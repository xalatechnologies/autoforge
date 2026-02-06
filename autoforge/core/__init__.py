"""AutoForge Core - Agent and client logic."""

from autoforge.core.agent import run_agent_session, run_autonomous_agent
from autoforge.core.client import create_client
from autoforge.core.orchestrator import ParallelOrchestrator
from autoforge.core.prompts import (
    get_coding_prompt,
    get_initializer_prompt,
    get_project_prompts_dir,
    get_testing_prompt,
    has_project_prompts,
    scaffold_project_prompts,
)

__all__ = [
    "run_agent_session",
    "run_autonomous_agent",
    "create_client",
    "ParallelOrchestrator",
    "get_coding_prompt",
    "get_initializer_prompt",
    "get_testing_prompt",
    "get_project_prompts_dir",
    "has_project_prompts",
    "scaffold_project_prompts",
]
