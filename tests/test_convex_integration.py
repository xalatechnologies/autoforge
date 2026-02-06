#!/usr/bin/env python3
"""
Test Convex Integration

Verifies that the Convex backend is working correctly by:
1. Creating a test project
2. Creating test features
3. Querying feature stats
4. Marking a feature as passing
"""

import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.convex_client import ConvexClient


async def test_convex_integration():
    """Run integration tests against Convex backend."""
    
    # Get Convex URL from environment
    convex_url = os.environ.get("CONVEX_URL", "https://lovable-salmon-58.convex.cloud")
    
    print(f"🚀 Testing Convex integration at: {convex_url}")
    print("-" * 50)
    
    client = ConvexClient(convex_url)
    
    # Test 1: Create a project
    print("\n📁 Test 1: Creating test project...")
    project_result = await client.mutation(
        "projects:create",
        {"name": "test-autoforge", "path": "/tmp/test-autoforge"}
    )
    print(f"   Result: {project_result}")
    
    if "error" in project_result and "already exists" in project_result["error"]:
        # Get existing project
        project = await client.query("projects:getByName", {"name": "test-autoforge"})
        project_id = project["_id"]
        print(f"   Using existing project: {project_id}")
    else:
        project_id = project_result.get("id")
        print(f"   Created project: {project_id}")
    
    if not project_id:
        print("❌ Failed to get project ID")
        return False
    
    # Test 2: Create test features
    print("\n📝 Test 2: Creating test features...")
    features_result = await client.mutation(
        "featureMutations:createBulk",
        {
            "projectId": project_id,
            "features": [
                {
                    "category": "Core",
                    "name": "Test Feature 1",
                    "description": "First test feature",
                    "steps": ["Step 1", "Step 2"]
                },
                {
                    "category": "Core", 
                    "name": "Test Feature 2",
                    "description": "Second test feature",
                    "steps": ["Step A", "Step B"]
                }
            ]
        }
    )
    print(f"   Result: {features_result}")
    
    # Test 3: Get feature stats
    print("\n📊 Test 3: Getting feature stats...")
    stats = await client.query("features:getStats", {"projectId": project_id})
    print(f"   Stats: {stats}")
    
    # Test 4: List features
    print("\n📋 Test 4: Listing features...")
    features = await client.query("features:list", {"projectId": project_id})
    print(f"   Found {len(features)} features")
    
    if features:
        # Test 5: Mark first feature as passing
        print("\n✅ Test 5: Marking feature as passing...")
        first_feature_id = features[0]["_id"]
        pass_result = await client.mutation(
            "featureMutations:markPassing",
            {"featureId": first_feature_id}
        )
        print(f"   Result: {pass_result}")
        
        # Test 6: Get updated stats
        print("\n📊 Test 6: Getting updated stats...")
        updated_stats = await client.query("features:getStats", {"projectId": project_id})
        print(f"   Updated stats: {updated_stats}")
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    return True


if __name__ == "__main__":
    success = asyncio.run(test_convex_integration())
    sys.exit(0 if success else 1)
