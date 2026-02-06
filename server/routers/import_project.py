"""
Import Project Router
=====================

WebSocket and REST endpoints for importing existing projects into AutoForge.
Analyzes codebases and generates specs from what exists.
"""

import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from ..services import import_chat_session
from ..services.codebase_analyzer import analyze_codebase

router = APIRouter(prefix="/api/import", tags=["import-project"])

logger = logging.getLogger(__name__)


# =============================================================================
# REST Endpoints
# =============================================================================


class AnalysisRequest(BaseModel):
    """Request to analyze an existing project."""
    project_dir: str


class AnalysisResponse(BaseModel):
    """Response from codebase analysis."""
    success: bool
    project_name: str
    summary: str
    data: dict
    error: Optional[str] = None


class ImportSessionStatus(BaseModel):
    """Status of an import session."""
    project_name: str
    is_active: bool
    is_complete: bool
    has_analysis: bool
    spec_generated: bool
    message_count: int


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_project(request: AnalysisRequest) -> AnalysisResponse:
    """
    Analyze an existing project without starting a full import session.
    
    This is a quick analysis endpoint for previewing what would be imported.
    """
    try:
        project_dir = Path(request.project_dir).resolve()
        
        if not project_dir.exists():
            return AnalysisResponse(
                success=False,
                project_name="",
                summary="",
                data={},
                error=f"Project directory does not exist: {project_dir}"
            )
        
        if not project_dir.is_dir():
            return AnalysisResponse(
                success=False,
                project_name="",
                summary="",
                data={},
                error=f"Path is not a directory: {project_dir}"
            )
        
        analysis = analyze_codebase(project_dir)
        
        return AnalysisResponse(
            success=True,
            project_name=analysis.project_name,
            summary=analysis.to_summary(),
            data=analysis.to_dict()
        )
        
    except Exception as e:
        logger.exception(f"Failed to analyze project: {request.project_dir}")
        return AnalysisResponse(
            success=False,
            project_name="",
            summary="",
            data={},
            error=str(e)
        )


@router.get("/sessions", response_model=list[str])
async def list_import_sessions_endpoint() -> list[str]:
    """List all active import sessions."""
    return import_chat_session.list_import_sessions()


@router.get("/sessions/{project_name}", response_model=ImportSessionStatus)
async def get_import_session_status(project_name: str) -> ImportSessionStatus:
    """Get status of an import session."""
    session = import_chat_session.get_import_session(project_name)
    
    if not session:
        return ImportSessionStatus(
            project_name=project_name,
            is_active=False,
            is_complete=False,
            has_analysis=False,
            spec_generated=False,
            message_count=0
        )
    
    return ImportSessionStatus(
        project_name=project_name,
        is_active=True,
        is_complete=session.is_complete(),
        has_analysis=session.analysis is not None,
        spec_generated=session.spec_generated,
        message_count=len(session.get_messages())
    )


@router.delete("/sessions/{project_name}")
async def cancel_import_session(project_name: str) -> dict:
    """Cancel and remove an import session."""
    await import_chat_session.remove_import_session(project_name)
    return {"status": "cancelled", "project_name": project_name}


# =============================================================================
# WebSocket Endpoint
# =============================================================================


@router.websocket("/{project_name}/ws")
async def import_project_websocket(websocket: WebSocket, project_name: str):
    """
    WebSocket endpoint for interactive project import chat.

    Message protocol:

    Client -> Server:
    - {"type": "start", "project_dir": "/path/to/project"} - Start import session
    - {"type": "message", "content": "..."} - Send user message
    - {"type": "ping"} - Keep-alive ping

    Server -> Client:
    - {"type": "status", "content": "..."} - Status update
    - {"type": "analysis_complete", "summary": "...", "data": {...}} - Analysis done
    - {"type": "text", "content": "..."} - Text response chunk
    - {"type": "spec_generated", "path": "..."} - Spec file created
    - {"type": "response_done"} - Response complete
    - {"type": "error", "content": "..."} - Error message
    - {"type": "pong"} - Keep-alive pong
    """
    await websocket.accept()
    logger.info(f"Import WebSocket connected for project: {project_name}")
    
    session = None
    
    try:
        while True:
            try:
                # Receive message with timeout for keep-alive
                raw_message = await websocket.receive_text()
                data = json.loads(raw_message)
                msg_type = data.get("type")
                
                if msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                    continue
                
                if msg_type == "start":
                    # Start new import session
                    project_dir = data.get("project_dir")
                    if not project_dir:
                        await websocket.send_json({
                            "type": "error",
                            "content": "project_dir is required"
                        })
                        continue
                    
                    project_path = Path(project_dir).resolve()
                    
                    if not project_path.exists() or not project_path.is_dir():
                        await websocket.send_json({
                            "type": "error",
                            "content": f"Invalid project directory: {project_dir}"
                        })
                        continue
                    
                    # Create session and stream startup
                    session = await import_chat_session.create_import_session(
                        project_name, project_path
                    )
                    
                    async for chunk in session.start():
                        await websocket.send_json(chunk)
                    
                    continue
                
                if msg_type == "message":
                    if not session:
                        await websocket.send_json({
                            "type": "error",
                            "content": "Session not started. Send 'start' first."
                        })
                        continue
                    
                    user_content = data.get("content", "")
                    attachments = data.get("attachments")
                    
                    # Parse attachments if present
                    parsed_attachments = None
                    if attachments:
                        from ..schemas import ImageAttachment
                        parsed_attachments = [
                            ImageAttachment(
                                mimeType=a.get("mimeType", "image/png"),
                                base64Data=a.get("base64Data", "")
                            )
                            for a in attachments
                            if a.get("base64Data")
                        ]
                    
                    async for chunk in session.send_message(user_content, parsed_attachments):
                        await websocket.send_json(chunk)
                    
                    continue
                
                # Unknown message type
                await websocket.send_json({
                    "type": "error",
                    "content": f"Unknown message type: {msg_type}"
                })
                
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "content": "Invalid JSON message"
                })
    
    except WebSocketDisconnect:
        logger.info(f"Import WebSocket disconnected for project: {project_name}")
    except Exception as e:
        logger.exception(f"Import WebSocket error for {project_name}")
        try:
            await websocket.send_json({
                "type": "error",
                "content": f"WebSocket error: {str(e)}"
            })
        except Exception:
            pass
    finally:
        # Clean up session on disconnect
        if session:
            try:
                await session.close()
            except Exception:
                pass
