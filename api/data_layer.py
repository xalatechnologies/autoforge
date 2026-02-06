"""
Data Layer Abstraction
======================

Protocol and implementations for data access in AutoForge.
Supports SQLite (local, per-project) and Convex (cloud, centralized) backends.

Backend selection via AUTOFORGE_BACKEND environment variable:
- "sqlite" (default): Per-project SQLite databases
- "convex": Centralized Convex backend
"""

import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable


@dataclass
class FeatureStats:
    """Feature completion statistics."""
    passing: int
    in_progress: int
    total: int
    percentage: float


@dataclass  
class Feature:
    """Feature/test case entity."""
    id: str | int
    priority: int
    category: str
    name: str
    description: str
    steps: list[str]
    passes: bool
    in_progress: bool
    dependencies: list[str | int]
    blocked: bool = False
    blocking_dependencies: list[str | int] | None = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        result = {
            "id": self.id,
            "priority": self.priority,
            "category": self.category,
            "name": self.name,
            "description": self.description,
            "steps": self.steps,
            "passes": self.passes,
            "in_progress": self.in_progress,
            "dependencies": self.dependencies,
        }
        if self.blocked:
            result["blocked"] = True
        if self.blocking_dependencies:
            result["blocking_dependencies"] = self.blocking_dependencies
        return result


@runtime_checkable
class DataLayer(Protocol):
    """Protocol for data access operations.
    
    Implementations must provide all feature and schedule operations
    with the same semantics as the current SQLite implementation.
    """
    
    # Feature queries
    async def get_feature_stats(self, project_id: str) -> FeatureStats: ...
    async def get_feature_by_id(self, feature_id: str | int) -> Feature | None: ...
    async def get_feature_summary(self, feature_id: str | int) -> dict | None: ...
    async def get_ready_features(self, project_id: str, limit: int = 5) -> list[Feature]: ...
    async def get_blocked_features(self, project_id: str, limit: int = 10) -> list[dict]: ...
    async def get_features_for_regression(self, project_id: str, limit: int = 3) -> list[dict]: ...
    async def get_feature_graph(self, project_id: str) -> dict: ...
    async def list_features(self, project_id: str) -> dict: ...
    
    # Feature mutations
    async def mark_feature_passing(self, feature_id: str | int) -> dict: ...
    async def mark_feature_failing(self, feature_id: str | int) -> dict: ...
    async def skip_feature(self, feature_id: str | int) -> dict: ...
    async def mark_feature_in_progress(self, feature_id: str | int) -> dict: ...
    async def claim_and_get_feature(self, feature_id: str | int) -> dict: ...
    async def clear_feature_in_progress(self, feature_id: str | int) -> dict: ...
    async def create_feature(
        self, project_id: str, category: str, name: str, description: str, steps: list[str]
    ) -> dict: ...
    async def create_features_bulk(self, project_id: str, features: list[dict]) -> dict: ...
    async def add_feature_dependency(self, feature_id: str | int, dependency_id: str | int) -> dict: ...
    async def remove_feature_dependency(self, feature_id: str | int, dependency_id: str | int) -> dict: ...
    async def set_feature_dependencies(self, feature_id: str | int, dependency_ids: list[str | int]) -> dict: ...


def get_backend() -> str:
    """Get the configured backend type.
    
    Returns:
        "sqlite" or "convex"
    """
    return os.environ.get("AUTOFORGE_BACKEND", "sqlite").lower()


def get_data_layer(project_dir: str | None = None) -> DataLayer:
    """Get the appropriate data layer implementation.
    
    Args:
        project_dir: Project directory (required for SQLite, optional for Convex)
        
    Returns:
        DataLayer implementation
        
    Raises:
        ValueError: If backend is invalid or project_dir missing for SQLite
    """
    backend = get_backend()
    
    if backend == "sqlite":
        if not project_dir:
            raise ValueError("project_dir is required for SQLite backend")
        from api.sqlite_data_layer import SQLiteDataLayer
        return SQLiteDataLayer(project_dir)
    
    elif backend == "convex":
        from api.convex_data_layer import ConvexDataLayer
        return ConvexDataLayer()
    
    else:
        raise ValueError(f"Unknown backend: {backend}")
