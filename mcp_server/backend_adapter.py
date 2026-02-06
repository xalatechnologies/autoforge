"""
MCP Backend Adapter
===================

Adapts data layer operations for MCP tools.
Uses Convex when AUTOFORGE_BACKEND=convex, otherwise SQLite.

This allows gradual migration without breaking existing functionality.
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Any


def get_backend_type() -> str:
    """Get the configured backend type."""
    return os.environ.get("AUTOFORGE_BACKEND", "sqlite").lower()


def is_convex_enabled() -> bool:
    """Check if Convex backend is enabled."""
    return get_backend_type() == "convex"


class MCPBackend:
    """Backend adapter for MCP tools.
    
    Provides sync wrappers around the async Convex operations.
    Falls back to None when SQLite should be used.
    """
    
    def __init__(self):
        self._convex_layer = None
        
    @property
    def convex_layer(self):
        """Lazy-load Convex data layer."""
        if self._convex_layer is None and is_convex_enabled():
            from api.convex_data_layer import ConvexDataLayer
            self._convex_layer = ConvexDataLayer()
        return self._convex_layer
    
    def _run_async(self, coro):
        """Run an async coroutine synchronously."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # We're in an async context already
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(asyncio.run, coro)
                    return future.result()
            else:
                return loop.run_until_complete(coro)
        except RuntimeError:
            return asyncio.run(coro)
    
    # Feature queries
    
    def get_stats(self, project_id: str) -> dict | None:
        """Get feature stats. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        result = self._run_async(self.convex_layer.get_feature_stats(project_id))
        return {
            "passing": result.passing,
            "in_progress": result.in_progress,
            "total": result.total,
            "percentage": result.percentage
        }
    
    def get_by_id(self, feature_id: str) -> dict | None:
        """Get feature by ID. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        feature = self._run_async(self.convex_layer.get_feature_by_id(feature_id))
        if feature:
            return feature.to_dict()
        return {"error": f"Feature {feature_id} not found"}
    
    def get_summary(self, feature_id: str) -> dict | None:
        """Get feature summary. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.get_feature_summary(feature_id))
    
    def get_ready(self, project_id: str, limit: int = 5) -> list | None:
        """Get ready features. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        features = self._run_async(self.convex_layer.get_ready_features(project_id, limit))
        return [f.to_dict() for f in features]
    
    def get_blocked(self, project_id: str, limit: int = 10) -> list | None:
        """Get blocked features. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.get_blocked_features(project_id, limit))
    
    def list_features(self, project_id: str) -> dict | None:
        """List all features. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.list_features(project_id))
    
    # Feature mutations
    
    def mark_passing(self, feature_id: str) -> dict | None:
        """Mark feature passing. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.mark_feature_passing(feature_id))
    
    def mark_failing(self, feature_id: str) -> dict | None:
        """Mark feature failing. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.mark_feature_failing(feature_id))
    
    def skip(self, feature_id: str) -> dict | None:
        """Skip feature. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.skip_feature(feature_id))
    
    def mark_in_progress(self, feature_id: str) -> dict | None:
        """Mark in-progress. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.mark_feature_in_progress(feature_id))
    
    def claim_and_get(self, feature_id: str) -> dict | None:
        """Claim and get feature. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.claim_and_get_feature(feature_id))
    
    def clear_in_progress(self, feature_id: str) -> dict | None:
        """Clear in-progress. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.clear_feature_in_progress(feature_id))
    
    def create(self, project_id: str, category: str, name: str, description: str, steps: list) -> dict | None:
        """Create feature. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.create_feature(project_id, category, name, description, steps))
    
    def create_bulk(self, project_id: str, features: list) -> dict | None:
        """Create features in bulk. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.create_features_bulk(project_id, features))
    
    def add_dependency(self, feature_id: str, dependency_id: str) -> dict | None:
        """Add dependency. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.add_feature_dependency(feature_id, dependency_id))
    
    def remove_dependency(self, feature_id: str, dependency_id: str) -> dict | None:
        """Remove dependency. Returns None if not using Convex."""
        if not is_convex_enabled():
            return None
        return self._run_async(self.convex_layer.remove_feature_dependency(feature_id, dependency_id))


# Global backend instance
_backend: MCPBackend | None = None


def get_backend() -> MCPBackend:
    """Get the global MCP backend instance."""
    global _backend
    if _backend is None:
        _backend = MCPBackend()
    return _backend
