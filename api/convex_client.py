"""
Convex HTTP Client
==================

HTTP client for interacting with Convex backend from Python.
Uses the Convex HTTP API with deploy key authentication.
"""

import json
import os
from typing import Any

import httpx


class ConvexClient:
    """HTTP client for Convex queries and mutations.
    
    Usage:
        client = ConvexClient(
            url=os.environ["CONVEX_URL"],
            deploy_key=os.environ["CONVEX_DEPLOY_KEY"]
        )
        
        # Query
        result = await client.query("autoforge/features:getStats", {"projectId": "..."})
        
        # Mutation
        result = await client.mutation("autoforge/features:markPassing", {"featureId": "..."})
    """
    
    def __init__(self, url: str, deploy_key: str | None = None):
        """Initialize client with Convex deployment URL and optional deploy key.
        
        Args:
            url: Convex deployment URL (e.g., https://xxx.convex.cloud)
            deploy_key: Optional Convex deploy key (e.g., prod:xxx). 
                       Required for production, optional for dev deployments.
        """
        self.url = url.rstrip("/")
        self.deploy_key = deploy_key
        
        headers = {"Content-Type": "application/json"}
        if deploy_key:
            headers["Authorization"] = f"Convex {deploy_key}"
            
        self._client = httpx.AsyncClient(
            timeout=30.0,
            headers=headers
        )
    
    async def query(self, function_name: str, args: dict[str, Any] | None = None) -> Any:
        """Execute a Convex query.
        
        Args:
            function_name: Full function path (e.g., "autoforge/features:getStats")
            args: Query arguments
            
        Returns:
            Query result (parsed JSON)
            
        Raises:
            ConvexError: If the query fails
        """
        return await self._call("query", function_name, args or {})
    
    async def mutation(self, function_name: str, args: dict[str, Any] | None = None) -> Any:
        """Execute a Convex mutation.
        
        Args:
            function_name: Full function path (e.g., "autoforge/features:markPassing")
            args: Mutation arguments
            
        Returns:
            Mutation result (parsed JSON)
            
        Raises:
            ConvexError: If the mutation fails
        """
        return await self._call("mutation", function_name, args or {})
    
    async def _call(self, call_type: str, function_name: str, args: dict[str, Any]) -> Any:
        """Internal method to call Convex API.
        
        Args:
            call_type: "query" or "mutation"
            function_name: Full function path
            args: Function arguments
            
        Returns:
            Function result
        """
        endpoint = f"{self.url}/api/{call_type}"
        payload = {
            "path": function_name,
            "args": args,
            "format": "json",
        }
        
        response = await self._client.post(endpoint, json=payload)
        
        if response.status_code != 200:
            raise ConvexError(
                f"Convex {call_type} failed: {response.status_code} {response.text}"
            )
        
        result = response.json()
        
        if "error" in result:
            raise ConvexError(result["error"])
        
        return result.get("value")
    
    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, *args):
        await self.close()


class ConvexError(Exception):
    """Error from Convex API."""
    pass


# Singleton client instance (initialized on first use)
_client: ConvexClient | None = None


def get_convex_client() -> ConvexClient:
    """Get the global Convex client instance.
    
    Reads CONVEX_URL and optionally CONVEX_DEPLOY_KEY from environment.
    Deploy key is required for production but optional for dev deployments.
    
    Returns:
        ConvexClient instance
        
    Raises:
        RuntimeError: If CONVEX_URL is not set
    """
    global _client
    
    if _client is None:
        url = os.environ.get("CONVEX_URL")
        deploy_key = os.environ.get("CONVEX_DEPLOY_KEY")
        
        if not url:
            raise RuntimeError("CONVEX_URL environment variable must be set")
        
        # Deploy key is optional - dev deployments work without it
        _client = ConvexClient(url, deploy_key if deploy_key else None)
    
    return _client
