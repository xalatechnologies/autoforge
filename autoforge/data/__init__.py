"""AutoForge Data - Registry, progress, and paths."""

from autoforge.data.paths import (
    get_autoforge_dir,
    get_claude_settings_path,
    get_features_db_path,
    migrate_project_layout,
)
from autoforge.data.progress import has_features
from autoforge.data.registry import (
    DEFAULT_MODEL,
    VALID_MODELS,
    get_project_path,
    list_registered_projects,
    register_project,
)

__all__ = [
    "get_autoforge_dir",
    "get_claude_settings_path",
    "get_features_db_path",
    "migrate_project_layout",
    "has_features",
    "DEFAULT_MODEL",
    "VALID_MODELS",
    "get_project_path",
    "list_registered_projects",
    "register_project",
]
