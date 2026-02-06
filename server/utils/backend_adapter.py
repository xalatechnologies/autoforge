"""
Router Backend Adapter
======================

Provides Convex backend access for FastAPI routers.
Uses async operations directly since routers are async.
"""

import os
from typing import Any

_convex_layer = None


def get_backend_type() -> str:
    """Get the configured backend type."""
    return os.environ.get("AUTOFORGE_BACKEND", "sqlite").lower()


def is_convex_enabled() -> bool:
    """Check if Convex backend is enabled."""
    return get_backend_type() == "convex"


def get_project_id() -> str | None:
    """Get the Convex project ID from environment."""
    return os.environ.get("CONVEX_PROJECT_ID")


async def get_convex_layer():
    """Get the Convex data layer (lazy load)."""
    global _convex_layer
    if _convex_layer is None:
        from api.convex_data_layer import ConvexDataLayer
        _convex_layer = ConvexDataLayer()
    return _convex_layer


# Feature operations (async)

async def list_features_convex(project_name: str) -> dict | None:
    """List features from Convex.
    
    Args:
        project_name: Project name (will be resolved to Convex document ID)
    """
    if not is_convex_enabled() or not project_name:
        return None
    layer = await get_convex_layer()
    # Resolve project name to Convex document ID
    project_id = await layer.resolve_project_id(project_name)
    return await layer.list_features(project_id)


async def get_feature_convex(feature_id: str) -> dict | None:
    """Get a feature from Convex."""
    if not is_convex_enabled():
        return None
    layer = await get_convex_layer()
    feature = await layer.get_feature_by_id(feature_id)
    return feature.to_dict() if feature else None


async def get_dependency_graph_convex(project_id: str) -> dict | None:
    """Get dependency graph from Convex."""
    if not is_convex_enabled() or not project_id:
        return None
    layer = await get_convex_layer()
    return await layer.get_feature_graph(project_id)


async def create_feature_convex(
    project_id: str, category: str, name: str, description: str, steps: list
) -> dict | None:
    """Create a feature in Convex."""
    if not is_convex_enabled() or not project_id:
        return None
    layer = await get_convex_layer()
    return await layer.create_feature(project_id, category, name, description, steps)


async def create_features_bulk_convex(project_id: str, features: list) -> dict | None:
    """Create features in bulk in Convex."""
    if not is_convex_enabled() or not project_id:
        return None
    layer = await get_convex_layer()
    return await layer.create_features_bulk(project_id, features)


async def skip_feature_convex(feature_id: str) -> dict | None:
    """Skip a feature in Convex."""
    if not is_convex_enabled():
        return None
    layer = await get_convex_layer()
    return await layer.skip_feature(feature_id)


async def add_dependency_convex(feature_id: str, dep_id: str) -> dict | None:
    """Add a dependency in Convex."""
    if not is_convex_enabled():
        return None
    layer = await get_convex_layer()
    return await layer.add_feature_dependency(feature_id, dep_id)


async def remove_dependency_convex(feature_id: str, dep_id: str) -> dict | None:
    """Remove a dependency in Convex."""
    if not is_convex_enabled():
        return None
    layer = await get_convex_layer()
    return await layer.remove_feature_dependency(feature_id, dep_id)


async def update_feature_convex(
    feature_id: str,
    name: str | None = None,
    description: str | None = None,
    steps: list | None = None,
    category: str | None = None,
) -> dict | None:
    """Update a feature in Convex."""
    if not is_convex_enabled():
        return None
    layer = await get_convex_layer()
    return await layer.update_feature(feature_id, name, description, steps, category)


async def delete_feature_convex(feature_id: str) -> dict | None:
    """Delete a feature in Convex."""
    if not is_convex_enabled():
        return None
    layer = await get_convex_layer()
    return await layer.delete_feature(feature_id)


async def set_dependencies_convex(feature_id: str, dependency_ids: list[str]) -> dict | None:
    """Set all dependencies for a feature in Convex."""
    if not is_convex_enabled():
        return None
    layer = await get_convex_layer()
    return await layer.set_feature_dependencies(feature_id, dependency_ids)


# Schedule operations (async)

async def list_schedules_convex(project_id: str) -> list | None:
    """List schedules from Convex."""
    if not is_convex_enabled() or not project_id:
        return None
    layer = await get_convex_layer()
    return await layer.list_schedules(project_id)


async def get_schedule_convex(schedule_id: str) -> dict | None:
    """Get a schedule from Convex."""
    if not is_convex_enabled():
        return None
    layer = await get_convex_layer()
    return await layer.get_schedule(schedule_id)


async def create_schedule_convex(project_id: str, schedule_data: dict) -> dict | None:
    """Create a schedule in Convex."""
    if not is_convex_enabled() or not project_id:
        return None
    layer = await get_convex_layer()
    return await layer.create_schedule(project_id, schedule_data)


async def update_schedule_convex(schedule_id: str, update_data: dict) -> dict | None:
    """Update a schedule in Convex."""
    if not is_convex_enabled():
        return None
    layer = await get_convex_layer()
    return await layer.update_schedule(schedule_id, update_data)


async def delete_schedule_convex(schedule_id: str) -> dict | None:
    """Delete a schedule in Convex."""
    if not is_convex_enabled():
        return None
    layer = await get_convex_layer()
    return await layer.delete_schedule(schedule_id)
