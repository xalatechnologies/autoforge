"""
Convex Data Layer Implementation
================================

Implements DataLayer protocol using Convex backend.
Uses ConvexClient for HTTP API calls.
"""

from typing import Any

from api.convex_client import get_convex_client, ConvexClient
from api.data_layer import DataLayer, Feature, FeatureStats


class ConvexDataLayer:
    """DataLayer implementation using Convex backend.
    
    All operations are async and use the Convex HTTP API.
    Project names are automatically resolved to Convex document IDs.
    """
    
    # In-memory cache for project name → document ID mapping
    _project_id_cache: dict[str, str] = {}
    
    def __init__(self, client: ConvexClient | None = None):
        """Initialize with optional client (uses global if not provided)."""
        self._client = client
    
    @property
    def client(self) -> ConvexClient:
        """Get the Convex client."""
        if self._client is None:
            self._client = get_convex_client()
        return self._client
    
    async def resolve_project_id(self, project_name: str) -> str:
        """Resolve project name to Convex document ID.
        
        Uses getOrCreate mutation - creates project if it doesn't exist.
        Results are cached in memory for performance.
        """
        # Check cache first
        if project_name in self._project_id_cache:
            return self._project_id_cache[project_name]
        
        # Call getOrCreate mutation
        result = await self.client.mutation(
            "projects:getOrCreate",
            {"name": project_name}
        )
        
        project_id = result["id"]
        self._project_id_cache[project_name] = project_id
        return project_id

    
    # Feature queries
    
    async def get_feature_stats(self, project_id: str) -> FeatureStats:
        """Get feature completion statistics."""
        result = await self.client.query(
            "features:getStats",
            {"projectId": project_id}
        )
        return FeatureStats(
            passing=result["passing"],
            in_progress=result["inProgress"],
            total=result["total"],
            percentage=result["percentage"],
        )
    
    async def get_feature_by_id(self, feature_id: str | int) -> Feature | None:
        """Get a specific feature by ID."""
        result = await self.client.query(
            "features:getById",
            {"featureId": str(feature_id)}
        )
        if not result:
            return None
        return self._to_feature(result)
    
    async def get_feature_summary(self, feature_id: str | int) -> dict | None:
        """Get minimal feature info."""
        result = await self.client.query(
            "features:getSummary",
            {"featureId": str(feature_id)}
        )
        return result
    
    async def get_ready_features(self, project_id: str, limit: int = 5) -> list[Feature]:
        """Get features ready to implement."""
        results = await self.client.query(
            "features:getReady",
            {"projectId": project_id, "limit": limit}
        )
        return [self._to_feature(r) for r in results]
    
    async def get_blocked_features(self, project_id: str, limit: int = 10) -> list[dict]:
        """Get blocked features."""
        return await self.client.query(
            "features:getBlocked",
            {"projectId": project_id, "limit": limit}
        )
    
    async def get_features_for_regression(self, project_id: str, limit: int = 3) -> list[dict]:
        """Get passing features for regression testing."""
        features = await self.list_features(project_id)
        if not features:
            return []
        return features.get("done", [])[:limit]
    
    async def get_feature_graph(self, project_id: str) -> dict:
        """Get dependency graph for visualization."""
        features = await self.list_features(project_id)
        if not features:
            return {"nodes": [], "edges": []}
        all_features = features.get("pending", []) + features.get("in_progress", []) + features.get("done", [])
        nodes = [
            {
                "id": f["id"],
                "name": f["name"],
                "category": f.get("category", ""),
                "status": "done" if f.get("passes") else "in_progress" if f.get("in_progress") else "pending",
                "priority": f.get("priority", 0),
                "dependencies": f.get("dependencies", [])
            }
            for f in all_features
        ]
        edges = []
        for f in all_features:
            for dep in f.get("dependencies", []):
                edges.append({"source": dep, "target": f["id"]})
        return {"nodes": nodes, "edges": edges}
    
    async def list_features(self, project_id: str) -> dict:
        """List all features grouped by status."""
        return await self.client.query(
            "features:list",
            {"projectId": project_id}
        )
    
    # Feature mutations
    
    async def mark_feature_passing(self, feature_id: str | int) -> dict:
        """Mark a feature as passing."""
        return await self.client.mutation(
            "featureMutations:markPassing",
            {"featureId": str(feature_id)}
        )
    
    async def mark_feature_failing(self, feature_id: str | int) -> dict:
        """Mark a feature as failing (regression)."""
        return await self.client.mutation(
            "featureMutations:markFailing",
            {"featureId": str(feature_id)}
        )
    
    async def skip_feature(self, feature_id: str | int) -> dict:
        """Skip a feature (move to end of queue)."""
        return await self.client.mutation(
            "featureMutations:skip",
            {"featureId": str(feature_id)}
        )
    
    async def mark_feature_in_progress(self, feature_id: str | int) -> dict:
        """Mark a feature as in-progress."""
        return await self.client.mutation(
            "featureMutations:markInProgress",
            {"featureId": str(feature_id)}
        )
    
    async def claim_and_get_feature(self, feature_id: str | int) -> dict:
        """Atomically claim a feature and return its details."""
        return await self.client.mutation(
            "featureMutations:claimAndGet",
            {"featureId": str(feature_id)}
        )
    
    async def clear_feature_in_progress(self, feature_id: str | int) -> dict:
        """Clear in-progress status."""
        return await self.client.mutation(
            "featureMutations:clearInProgress",
            {"featureId": str(feature_id)}
        )
    
    async def create_feature(
        self, project_id: str, category: str, name: str, description: str, steps: list[str]
    ) -> dict:
        """Create a single feature."""
        return await self.client.mutation(
            "featureMutations:create",
            {
                "projectId": project_id,
                "category": category,
                "name": name,
                "description": description,
                "steps": steps,
            }
        )
    
    async def create_features_bulk(self, project_id: str, features: list[dict]) -> dict:
        """Create multiple features in bulk."""
        return await self.client.mutation(
            "featureMutations:createBulk",
            {"projectId": project_id, "features": features}
        )
    
    async def add_feature_dependency(self, feature_id: str | int, dependency_id: str | int) -> dict:
        """Add a dependency to a feature."""
        return await self.client.mutation(
            "featureMutations:addDependency",
            {"featureId": str(feature_id), "dependencyId": str(dependency_id)}
        )
    
    async def remove_feature_dependency(self, feature_id: str | int, dependency_id: str | int) -> dict:
        """Remove a dependency from a feature."""
        return await self.client.mutation(
            "featureMutations:removeDependency",
            {"featureId": str(feature_id), "dependencyId": str(dependency_id)}
        )
    
    async def set_feature_dependencies(self, feature_id: str | int, dependency_ids: list[str | int]) -> dict:
        """Set all dependencies for a feature."""
        return await self.client.mutation(
            "featureMutations:setDependencies",
            {"featureId": str(feature_id), "dependencyIds": [str(d) for d in dependency_ids]}
        )
    
    async def update_feature(
        self,
        feature_id: str | int,
        name: str | None = None,
        description: str | None = None,
        steps: list | None = None,
        category: str | None = None,
    ) -> dict:
        """Update a feature's editable fields."""
        args = {"featureId": str(feature_id)}
        if name is not None:
            args["name"] = name
        if description is not None:
            args["description"] = description
        if steps is not None:
            args["steps"] = steps
        if category is not None:
            args["category"] = category
        return await self.client.mutation("featureMutations:update", args)
    
    async def delete_feature(self, feature_id: str | int) -> dict:
        """Delete a feature and clean up dependencies."""
        return await self.client.mutation(
            "featureMutations:deleteFeature",
            {"featureId": str(feature_id)}
        )
    
    # Helper methods
    
    def _to_feature(self, data: dict) -> Feature:
        """Convert Convex result to Feature dataclass."""
        return Feature(
            id=data["id"],
            priority=data["priority"],
            category=data["category"],
            name=data["name"],
            description=data["description"],
            steps=data["steps"],
            passes=data["passes"],
            in_progress=data.get("in_progress", False),
            dependencies=data.get("dependencies", []),
            blocked=data.get("blocked", False),
            blocking_dependencies=data.get("blocking_dependencies"),
        )
