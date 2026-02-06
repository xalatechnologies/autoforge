"""
Import Chat Session
===================

Manages interactive project import conversation with Claude.
Uses the import-project.md skill to help users import existing codebases.
"""

import asyncio
import json
import logging
import os
import shutil
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator, Optional

from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient
from dotenv import load_dotenv

from .chat_constants import API_ENV_VARS, ROOT_DIR, make_multimodal_message
from .codebase_analyzer import analyze_codebase, CodebaseAnalysis
from ..schemas import ImageAttachment

# Load environment variables from .env file if present
load_dotenv()

logger = logging.getLogger(__name__)


class ImportChatSession:
    """
    Manages a project import conversation.

    Unlike SpecChatSession which builds a spec conversationally,
    this session:
    1. Runs codebase analysis first
    2. Presents findings to the user
    3. Generates spec from existing code (preserving patterns)
    """

    def __init__(self, project_name: str, project_dir: Path):
        """
        Initialize the session.

        Args:
            project_name: Name of the project being imported
            project_dir: Absolute path to the existing project directory
        """
        self.project_name = project_name
        self.project_dir = project_dir
        self.client: Optional[ClaudeSDKClient] = None
        self.messages: list[dict] = []
        self.complete: bool = False
        self.created_at = datetime.now()
        self._conversation_id: Optional[str] = None
        self._client_entered: bool = False
        
        # Import-specific state
        self.analysis: Optional[CodebaseAnalysis] = None
        self.spec_generated: bool = False

    async def close(self) -> None:
        """Clean up resources and close the Claude client."""
        if self.client and self._client_entered:
            try:
                await self.client.__aexit__(None, None, None)
            except Exception as e:
                logger.warning(f"Error closing Claude client: {e}")
            finally:
                self._client_entered = False
                self.client = None

    async def start(self) -> AsyncGenerator[dict, None]:
        """
        Initialize session by running analysis and starting conversation.

        Yields message chunks as they stream in.
        """
        # First, run the codebase analysis
        try:
            yield {"type": "status", "content": "Analyzing codebase..."}
            self.analysis = analyze_codebase(self.project_dir)
            yield {
                "type": "analysis_complete",
                "summary": self.analysis.to_summary(),
                "data": self.analysis.to_dict()
            }
        except Exception as e:
            logger.exception("Failed to analyze codebase")
            yield {"type": "error", "content": f"Analysis failed: {str(e)}"}
            return

        # Load the import-project skill
        skill_path = ROOT_DIR / ".claude" / "commands" / "import-project.md"

        if not skill_path.exists():
            yield {
                "type": "error",
                "content": f"Import skill not found at {skill_path}"
            }
            return

        try:
            skill_content = skill_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            skill_content = skill_path.read_text(encoding="utf-8", errors="replace")

        # Ensure autoforge prompts directory exists
        prompts_dir = self.project_dir / ".autoforge" / "prompts"
        prompts_dir.mkdir(parents=True, exist_ok=True)

        # Create security settings file
        security_settings = {
            "sandbox": {"enabled": False},
            "permissions": {
                "defaultMode": "acceptEdits",
                "allow": [
                    "Read(./**)",
                    "Write(./**)",
                    "Edit(./**)",
                    "Glob(./**)",
                ],
            },
        }
        from autoforge.data.paths import get_claude_settings_path
        settings_file = get_claude_settings_path(self.project_dir)
        settings_file.parent.mkdir(parents=True, exist_ok=True)
        with open(settings_file, "w") as f:
            json.dump(security_settings, f, indent=2)

        # Prepare system prompt with project path and analysis summary
        project_path = str(self.project_dir.resolve())
        system_prompt = skill_content.replace("$ARGUMENTS", project_path)
        
        # Append analysis context to help Claude
        analysis_context = f"""

---

# PRE-COMPUTED ANALYSIS

The codebase has already been analyzed. Here is the result:

{self.analysis.to_summary()}

**Raw analysis data is available.** Use this to inform your spec generation.
Do NOT re-scan the entire codebase - use this analysis.

"""
        system_prompt += analysis_context

        # Write system prompt to CLAUDE.md
        claude_md_path = self.project_dir / "CLAUDE.md"
        
        # Preserve existing CLAUDE.md if it exists
        existing_claude_md = None
        if claude_md_path.exists():
            try:
                existing_claude_md = claude_md_path.read_text(encoding="utf-8")
            except Exception:
                pass
        
        with open(claude_md_path, "w", encoding="utf-8") as f:
            f.write(system_prompt)
        logger.info(f"Wrote import system prompt to {claude_md_path}")

        # Create Claude SDK client
        system_cli = shutil.which("claude")

        # Build environment overrides
        sdk_env: dict[str, str] = {}
        for var in API_ENV_VARS:
            value = os.getenv(var)
            if value:
                sdk_env[var] = value

        model = os.getenv("ANTHROPIC_DEFAULT_OPUS_MODEL", "claude-opus-4-5-20251101")

        try:
            self.client = ClaudeSDKClient(
                options=ClaudeAgentOptions(
                    model=model,
                    cli_path=system_cli,
                    setting_sources=["project", "user"],
                    allowed_tools=[
                        "Read",
                        "Write",
                        "Edit",
                        "Glob",
                        "WebFetch",
                        "WebSearch",
                    ],
                    permission_mode="acceptEdits",
                    max_turns=100,
                    cwd=str(self.project_dir.resolve()),
                    settings=str(settings_file.resolve()),
                    env=sdk_env,
                )
            )
            await self.client.__aenter__()
            self._client_entered = True
        except Exception as e:
            logger.exception("Failed to create Claude client")
            yield {"type": "error", "content": f"Failed to initialize Claude: {str(e)}"}
            # Restore original CLAUDE.md if we had one
            if existing_claude_md:
                with open(claude_md_path, "w", encoding="utf-8") as f:
                    f.write(existing_claude_md)
            return

        # Start the conversation
        try:
            initial_message = (
                f"I've analyzed the codebase at {project_path}. "
                "Please review the analysis and proceed with generating the import spec."
            )
            async for chunk in self._query_claude(initial_message):
                yield chunk
            yield {"type": "response_done"}
        except Exception as e:
            logger.exception("Failed to start import chat")
            yield {"type": "error", "content": f"Failed to start conversation: {str(e)}"}

    async def send_message(
        self,
        user_message: str,
        attachments: list[ImageAttachment] | None = None
    ) -> AsyncGenerator[dict, None]:
        """
        Send user message and stream Claude's response.

        Args:
            user_message: The user's response
            attachments: Optional list of image attachments

        Yields:
            Message chunks of various types.
        """
        if not self.client:
            yield {"type": "error", "content": "Session not initialized. Call start() first."}
            return

        self.messages.append({
            "role": "user",
            "content": user_message,
            "has_attachments": bool(attachments),
            "timestamp": datetime.now().isoformat()
        })

        try:
            async for chunk in self._query_claude(user_message, attachments):
                yield chunk
            yield {"type": "response_done"}
        except Exception as e:
            logger.exception("Error during Claude query")
            yield {"type": "error", "content": f"Error: {str(e)}"}

    async def _query_claude(
        self,
        message: str,
        attachments: list[ImageAttachment] | None = None
    ) -> AsyncGenerator[dict, None]:
        """
        Internal method to query Claude and stream responses.
        """
        if not self.client:
            return

        # Build the message content
        if attachments and len(attachments) > 0:
            content_blocks: list[dict[str, Any]] = []
            if message:
                content_blocks.append({"type": "text", "text": message})
            for att in attachments:
                content_blocks.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": att.mimeType,
                        "data": att.base64Data,
                    }
                })
            await self.client.query(make_multimodal_message(content_blocks))
            logger.info(f"Sent multimodal message with {len(attachments)} image(s)")
        else:
            await self.client.query(message)

        current_text = ""
        pending_spec_write: dict[str, Any] | None = None

        async for msg in self.client.receive_response():
            msg_type = type(msg).__name__

            if msg_type == "AssistantMessage" and hasattr(msg, "content"):
                for block in msg.content:
                    block_type = type(block).__name__

                    if block_type == "TextBlock" and hasattr(block, "text"):
                        text = block.text
                        if text:
                            current_text += text
                            yield {"type": "text", "content": text}
                            self.messages.append({
                                "role": "assistant",
                                "content": text,
                                "timestamp": datetime.now().isoformat()
                            })

                    elif block_type == "ToolUseBlock" and hasattr(block, "name"):
                        tool_name = block.name
                        tool_input = getattr(block, "input", {})
                        tool_id = getattr(block, "id", "")

                        if tool_name in ("Write", "Edit"):
                            file_path = tool_input.get("file_path", "")
                            if "app_spec.txt" in str(file_path):
                                pending_spec_write = {
                                    "tool_id": tool_id,
                                    "path": file_path
                                }
                                logger.info(f"Spec write detected: {file_path}")

            elif msg_type == "UserMessage" and hasattr(msg, "content"):
                for block in msg.content:
                    block_type = type(block).__name__
                    if block_type == "ToolResultBlock":
                        is_error = getattr(block, "is_error", False)
                        tool_use_id = getattr(block, "tool_use_id", "")

                        if not is_error and pending_spec_write:
                            if tool_use_id == pending_spec_write.get("tool_id"):
                                file_path = pending_spec_write["path"]
                                full_path = Path(file_path) if Path(file_path).is_absolute() else self.project_dir / file_path
                                if full_path.exists():
                                    logger.info(f"Spec file verified at: {full_path}")
                                    self.spec_generated = True
                                    yield {
                                        "type": "spec_generated",
                                        "path": str(file_path)
                                    }
                                pending_spec_write = None

    def is_complete(self) -> bool:
        """Check if import session is complete."""
        return self.complete or self.spec_generated

    def get_messages(self) -> list[dict]:
        """Get all messages in the conversation."""
        return self.messages.copy()

    def get_analysis(self) -> Optional[dict]:
        """Get the codebase analysis result."""
        return self.analysis.to_dict() if self.analysis else None


# Session registry with thread safety
_import_sessions: dict[str, ImportChatSession] = {}
_import_sessions_lock = threading.Lock()


def get_import_session(project_name: str) -> Optional[ImportChatSession]:
    """Get an existing import session for a project."""
    with _import_sessions_lock:
        return _import_sessions.get(project_name)


async def create_import_session(project_name: str, project_dir: Path) -> ImportChatSession:
    """Create a new import session for a project, closing any existing one."""
    old_session: Optional[ImportChatSession] = None

    with _import_sessions_lock:
        old_session = _import_sessions.pop(project_name, None)
        session = ImportChatSession(project_name, project_dir)
        _import_sessions[project_name] = session

    if old_session:
        try:
            await old_session.close()
        except Exception as e:
            logger.warning(f"Error closing old import session for {project_name}: {e}")

    return session


async def remove_import_session(project_name: str) -> None:
    """Remove and close an import session."""
    session: Optional[ImportChatSession] = None

    with _import_sessions_lock:
        session = _import_sessions.pop(project_name, None)

    if session:
        try:
            await session.close()
        except Exception as e:
            logger.warning(f"Error closing import session for {project_name}: {e}")


def list_import_sessions() -> list[str]:
    """List all active import session project names."""
    with _import_sessions_lock:
        return list(_import_sessions.keys())


async def cleanup_all_import_sessions() -> None:
    """Close all active import sessions. Called on server shutdown."""
    sessions_to_close: list[ImportChatSession] = []

    with _import_sessions_lock:
        sessions_to_close = list(_import_sessions.values())
        _import_sessions.clear()

    for session in sessions_to_close:
        try:
            await session.close()
        except Exception as e:
            logger.warning(f"Error closing import session {session.project_name}: {e}")
