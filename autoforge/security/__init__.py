"""AutoForge Security - Bash hooks and authentication."""

from autoforge.security.auth import (
    AUTH_ERROR_HELP_CLI,
    AUTH_ERROR_HELP_SERVER,
    is_auth_error,
    print_auth_error_help,
)
from autoforge.security.hooks import (
    ALLOWED_COMMANDS,
    SENSITIVE_DIRECTORIES,
    bash_security_hook,
    extract_commands,
    get_effective_commands,
    is_command_allowed,
)

__all__ = [
    "is_auth_error",
    "print_auth_error_help",
    "AUTH_ERROR_HELP_CLI",
    "AUTH_ERROR_HELP_SERVER",
    "ALLOWED_COMMANDS",
    "SENSITIVE_DIRECTORIES",
    "bash_security_hook",
    "extract_commands",
    "get_effective_commands",
    "is_command_allowed",
]
