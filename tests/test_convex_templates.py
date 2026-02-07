#!/usr/bin/env python3
"""
Test Convex Template Verification

End-to-end tests to verify the Convex backend templates work correctly.
Validates:
1. Template files contain correct Convex patterns
2. Infrastructure features (0-4) are properly defined
3. Template rendering works with Convex architecture
4. Mock data patterns are correctly identified
"""

import os
import re
import sys
from pathlib import Path

import pytest

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from autoforge.data.paths import TEMPLATES_DIR


# =============================================================================
# TEMPLATE FILE TESTS
# =============================================================================


class TestAppSpecTemplate:
    """Test app_spec.template.txt for Convex patterns."""

    @pytest.fixture
    def template_content(self):
        template_path = TEMPLATES_DIR / "app_spec.template.txt"
        return template_path.read_text()

    def test_convex_backend_defined(self, template_content):
        """Verify backend uses Convex runtime."""
        assert "<runtime>Convex (reactive backend)</runtime>" in template_content

    def test_convex_database_defined(self, template_content):
        """Verify database is Convex document database."""
        assert "<database>Convex document database</database>" in template_content

    def test_convex_realtime_defined(self, template_content):
        """Verify realtime is WebSocket based."""
        assert "WebSocket subscriptions" in template_content

    def test_convex_helpers_defined(self, template_content):
        """Verify convex-helpers is referenced."""
        assert "convex-helpers" in template_content

    def test_convex_architecture_section_exists(self, template_content):
        """Verify <convex_architecture> section exists."""
        assert "<convex_architecture>" in template_content
        assert "</convex_architecture>" in template_content

    def test_convex_schema_pattern(self, template_content):
        """Verify schema uses defineTable pattern."""
        assert "defineTable" in template_content
        assert "v.string()" in template_content
        assert "v.id(" in template_content

    def test_convex_functions_section(self, template_content):
        """Verify Convex functions section exists."""
        assert "<convex_functions>" in template_content or "queries:" in template_content
        assert "mutations:" in template_content

    def test_no_express_references(self, template_content):
        """Verify no Node/Express references remain."""
        assert "Node.js with Express" not in template_content
        assert "SQLite with better-sqlite3" not in template_content
        assert "<port>3001</port>" not in template_content


class TestInitializerPromptTemplate:
    """Test initializer_prompt.template.md for Convex patterns."""

    @pytest.fixture
    def template_content(self):
        template_path = TEMPLATES_DIR / "initializer_prompt.template.md"
        return template_path.read_text()

    def test_infrastructure_feature_0_convex(self, template_content):
        """Verify feature 0 uses Convex dev server."""
        assert "Convex dev server starts" in template_content
        assert "`npx convex dev`" in template_content

    def test_infrastructure_feature_1_schema(self, template_content):
        """Verify feature 1 checks schema deployment."""
        assert "Schema deployed" in template_content
        assert "dashboard" in template_content.lower()

    def test_infrastructure_feature_2_persistence(self, template_content):
        """Verify feature 2 tests data persistence."""
        assert "Data persists" in template_content
        assert "mutation" in template_content

    def test_infrastructure_feature_3_mock_patterns(self, template_content):
        """Verify feature 3 checks for mock patterns."""
        assert "No mock" in template_content
        assert "grep" in template_content

    def test_infrastructure_feature_4_real_queries(self, template_content):
        """Verify feature 4 checks real database queries."""
        assert "Convex functions query" in template_content or "function logs" in template_content.lower()

    def test_init_sh_uses_convex_dev(self, template_content):
        """Verify init.sh example uses npx convex dev."""
        assert "npx convex dev --once" in template_content
        assert "npx convex dev &" in template_content
        assert "npm run dev" in template_content

    def test_project_structure_has_convex_folder(self, template_content):
        """Verify project structure includes convex/ folder."""
        assert "convex/" in template_content
        assert "schema.ts" in template_content
        assert "domain/" in template_content

    def test_no_sqlite_references(self, template_content):
        """Verify no SQLite references remain in infrastructure features."""
        # Check infrastructure features section specifically
        infra_section = template_content.split("## MANDATORY INFRASTRUCTURE FEATURES")[1]
        infra_section = infra_section.split("## MANDATORY TEST CATEGORIES")[0]
        assert "sqlite3" not in infra_section.lower()
        assert "psql" not in infra_section.lower()


class TestCodingPromptTemplate:
    """Test coding_prompt.template.md for Convex patterns."""

    @pytest.fixture
    def template_content(self):
        template_path = TEMPLATES_DIR / "coding_prompt.template.md"
        return template_path.read_text()

    def test_step2_convex_server_instructions(self, template_content):
        """Verify STEP 2 has Convex server startup instructions."""
        assert "npx convex dev" in template_content
        assert "localhost:5173" in template_content or "Vite app" in template_content

    def test_step55_verification_checklist_convex(self, template_content):
        """Verify STEP 5.5 mentions Convex-specific checks."""
        assert "Convex" in template_content
        assert "mutation" in template_content or "useQuery" in template_content

    def test_step56_mock_detection_convex_folder(self, template_content):
        """Verify STEP 5.6 grep includes convex/ folder."""
        assert "convex/" in template_content
        assert 'grep -r' in template_content

    def test_step57_convex_restart_test(self, template_content):
        """Verify STEP 5.7 uses Convex restart method."""
        assert "CONVEX" in template_content or "npx convex dev" in template_content

    def test_no_express_api_references(self, template_content):
        """Verify no Express API patterns remain."""
        # These should not be in the main instructions
        assert "POST /api/" not in template_content
        assert "GET /api/" not in template_content


class TestConvexArchitectureDoc:
    """Test CONVEX_ARCHITECTURE.md documentation."""

    @pytest.fixture
    def doc_content(self):
        doc_path = TEMPLATES_DIR / "CONVEX_ARCHITECTURE.md"
        if doc_path.exists():
            return doc_path.read_text()
        return None

    def test_doc_exists(self, doc_content):
        """Verify documentation exists."""
        assert doc_content is not None, "CONVEX_ARCHITECTURE.md should exist"

    def test_schema_pattern_documented(self, doc_content):
        """Verify schema pattern is documented."""
        if doc_content:
            assert "defineSchema" in doc_content
            assert "defineTable" in doc_content

    def test_query_pattern_documented(self, doc_content):
        """Verify query pattern is documented."""
        if doc_content:
            assert "query" in doc_content
            assert "ctx.db" in doc_content

    def test_mutation_pattern_documented(self, doc_content):
        """Verify mutation pattern is documented."""
        if doc_content:
            assert "mutation" in doc_content
            assert "ctx.db.insert" in doc_content

    def test_react_integration_documented(self, doc_content):
        """Verify React integration is documented."""
        if doc_content:
            assert "useQuery" in doc_content
            assert "useMutation" in doc_content

    def test_convex_helpers_documented(self, doc_content):
        """Verify convex-helpers is documented."""
        if doc_content:
            assert "convex-helpers" in doc_content
            assert "rateLimitTables" in doc_content


# =============================================================================
# MOCK DATA PATTERN TESTS
# =============================================================================


class TestMockDataPatterns:
    """Test that mock data detection patterns are comprehensive."""

    MOCK_PATTERNS = [
        r"mockData",
        r"fakeData",
        r"sampleData",
        r"dummyData",
        r"hardcodedItems",
        r"testUsers",
        r"mockUsers",
        r"return \[\]",  # Empty array returns
    ]

    @pytest.fixture
    def coding_template(self):
        return (TEMPLATES_DIR / "coding_prompt.template.md").read_text()

    def test_all_mock_patterns_in_grep(self, coding_template):
        """Verify mock data grep includes key patterns."""
        for pattern in ["mockData", "fakeData", "dummyData"]:
            assert pattern in coding_template, f"Pattern '{pattern}' should be in mock detection"

    def test_convex_folder_in_grep(self, coding_template):
        """Verify grep searches convex/ folder."""
        assert "convex/" in coding_template


# =============================================================================
# TEMPLATE RENDERING TESTS
# =============================================================================


class TestTemplateRendering:
    """Test that templates can be loaded and rendered."""

    def test_load_initializer_prompt(self):
        """Verify initializer prompt loads correctly."""
        from autoforge.core.prompts import get_initializer_prompt
        
        prompt = get_initializer_prompt()
        assert prompt is not None
        assert len(prompt) > 1000  # Should be substantial
        assert "Convex" in prompt

    def test_load_coding_prompt(self):
        """Verify coding prompt loads correctly."""
        from autoforge.core.prompts import get_coding_prompt
        
        prompt = get_coding_prompt()
        assert prompt is not None
        assert len(prompt) > 1000
        assert "STEP" in prompt

    def test_load_testing_prompt(self):
        """Verify testing prompt loads correctly."""
        from autoforge.core.prompts import get_testing_prompt
        
        prompt = get_testing_prompt()
        assert prompt is not None
        assert len(prompt) > 500


# =============================================================================
# INFRASTRUCTURE FEATURE VALIDATION
# =============================================================================


class TestInfrastructureFeatures:
    """Validate infrastructure feature definitions."""

    @pytest.fixture
    def infrastructure_section(self):
        template_path = TEMPLATES_DIR / "initializer_prompt.template.md"
        content = template_path.read_text()
        # Extract infrastructure features section
        start = content.find("## MANDATORY INFRASTRUCTURE FEATURES")
        end = content.find("## MANDATORY TEST CATEGORIES")
        return content[start:end]

    def test_has_five_infrastructure_features(self, infrastructure_section):
        """Verify all 5 infrastructure features are defined."""
        for i in range(5):
            assert f"| {i} |" in infrastructure_section, f"Feature {i} should be defined"

    def test_feature_verification_steps_defined(self, infrastructure_section):
        """Verify each feature has verification steps."""
        for i in range(5):
            assert f"Feature {i}" in infrastructure_section, f"Feature {i} description should exist"
            assert "Steps:" in infrastructure_section

    def test_convex_specific_commands(self, infrastructure_section):
        """Verify Convex-specific commands in verification."""
        assert "npx convex dev" in infrastructure_section
        assert "dashboard" in infrastructure_section.lower()


# =============================================================================
# MAIN RUNNER
# =============================================================================


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
