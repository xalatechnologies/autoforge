#!/usr/bin/env python3
"""
Codebase Analyzer Tests
=======================

Tests for the codebase analyzer service.
Run with: python -m pytest tests/test_codebase_analyzer.py -v
"""

import json
import tempfile
import unittest
from pathlib import Path

from server.services.codebase_analyzer import (
    CodebaseAnalysis,
    Dependency,
    DocFile,
    ProjectStructure,
    SpecFile,
    StylingInfo,
    TaskRef,
    TechStackInfo,
    analyze_codebase,
)


class TestTechStackDetection(unittest.TestCase):
    """Tests for technology stack detection."""

    def test_detects_react_vite_typescript(self):
        """Detect a React + Vite + TypeScript project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            # Create package.json
            package_json = {
                "name": "test-app",
                "dependencies": {
                    "react": "^18.0.0",
                    "react-dom": "^18.0.0"
                },
                "devDependencies": {
                    "vite": "^5.0.0",
                    "typescript": "^5.0.0"
                }
            }
            with open(project_dir / "package.json", "w") as f:
                json.dump(package_json, f)
            
            # Create lock file
            (project_dir / "pnpm-lock.yaml").touch()
            
            analysis = analyze_codebase(project_dir)
            
            self.assertEqual(analysis.tech_stack.framework, "react")
            self.assertEqual(analysis.tech_stack.build_tool, "vite")
            self.assertEqual(analysis.tech_stack.language, "typescript")
            self.assertEqual(analysis.tech_stack.package_manager, "pnpm")

    def test_detects_nextjs_project(self):
        """Detect a Next.js project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            package_json = {
                "name": "next-app",
                "dependencies": {
                    "react": "^18.0.0",
                    "next": "^14.0.0"
                }
            }
            with open(project_dir / "package.json", "w") as f:
                json.dump(package_json, f)
            
            analysis = analyze_codebase(project_dir)
            
            self.assertEqual(analysis.tech_stack.framework, "react")
            self.assertEqual(analysis.tech_stack.meta_framework, "next")

    def test_detects_python_fastapi(self):
        """Detect a Python FastAPI project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            # Create requirements.txt
            with open(project_dir / "requirements.txt", "w") as f:
                f.write("fastapi==0.100.0\nuvicorn==0.22.0\n")
            
            # Create main.py
            (project_dir / "main.py").touch()
            
            analysis = analyze_codebase(project_dir)
            
            self.assertEqual(analysis.tech_stack.language, "python")
            self.assertEqual(len(analysis.dependencies), 2)
            self.assertTrue(any(d.name == "fastapi" for d in analysis.dependencies))


class TestStylingDetection(unittest.TestCase):
    """Tests for styling and design system detection."""

    def test_detects_tailwind(self):
        """Detect Tailwind CSS."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            package_json = {
                "devDependencies": {
                    "tailwindcss": "^3.4.0"
                }
            }
            with open(project_dir / "package.json", "w") as f:
                json.dump(package_json, f)
            
            # Create tailwind config
            (project_dir / "tailwind.config.js").touch()
            
            analysis = analyze_codebase(project_dir)
            
            self.assertEqual(analysis.styling.css_framework, "tailwind")
            self.assertEqual(analysis.styling.theme_file, "tailwind.config.js")

    def test_detects_styled_components(self):
        """Detect styled-components."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            package_json = {
                "dependencies": {
                    "react": "^18.0.0",
                    "styled-components": "^6.0.0"
                }
            }
            with open(project_dir / "package.json", "w") as f:
                json.dump(package_json, f)
            
            analysis = analyze_codebase(project_dir)
            
            self.assertEqual(analysis.styling.css_approach, "styled-components")


class TestDocumentation(unittest.TestCase):
    """Tests for documentation file detection."""

    def test_finds_readme(self):
        """Find README.md file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            with open(project_dir / "README.md", "w") as f:
                f.write("# My Project\n\nDescription here.")
            
            analysis = analyze_codebase(project_dir)
            
            readme = next((d for d in analysis.docs if d.doc_type == "readme"), None)
            self.assertIsNotNone(readme)
            self.assertEqual(readme.title, "My Project")

    def test_finds_multiple_docs(self):
        """Find multiple documentation files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            (project_dir / "README.md").write_text("# README")
            (project_dir / "CHANGELOG.md").write_text("# Changelog")
            (project_dir / "CONTRIBUTING.md").write_text("# Contributing")
            
            analysis = analyze_codebase(project_dir)
            
            self.assertGreaterEqual(len(analysis.docs), 3)


class TestSpecDetection(unittest.TestCase):
    """Tests for spec/planning file detection."""

    def test_finds_autoforge_specs(self):
        """Find AutoForge spec files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            prompts_dir = project_dir / ".autoforge" / "prompts"
            prompts_dir.mkdir(parents=True)
            (prompts_dir / "app_spec.txt").write_text("Project spec content")
            
            analysis = analyze_codebase(project_dir)
            
            self.assertTrue(any(s.spec_type == "autoforge" for s in analysis.specs))

    def test_finds_prd(self):
        """Find PRD file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            (project_dir / "PRD.md").write_text("# Product Requirements\n\nDetails...")
            
            analysis = analyze_codebase(project_dir)
            
            prd = next((s for s in analysis.specs if s.spec_type == "prd"), None)
            self.assertIsNotNone(prd)


class TestTaskDetection(unittest.TestCase):
    """Tests for TODO/task detection."""

    def test_finds_todo_comments(self):
        """Find TODO comments in source files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            (project_dir / "main.py").write_text(
                "def foo():\n"
                "    # TODO: Implement this function\n"
                "    pass\n"
            )
            
            analysis = analyze_codebase(project_dir)
            
            todos = [t for t in analysis.tasks if t.ref_type == "todo"]
            self.assertGreaterEqual(len(todos), 1)
            self.assertIn("Implement this function", todos[0].content)

    def test_finds_fixme_comments(self):
        """Find FIXME comments in source files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            (project_dir / "app.ts").write_text(
                "function bar() {\n"
                "    // FIXME: Handle edge case\n"
                "    return null;\n"
                "}\n"
            )
            
            analysis = analyze_codebase(project_dir)
            
            fixmes = [t for t in analysis.tasks if t.ref_type == "fixme"]
            self.assertGreaterEqual(len(fixmes), 1)


class TestProjectStructure(unittest.TestCase):
    """Tests for project structure analysis."""

    def test_detects_src_directory(self):
        """Detect src directory."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            (project_dir / "src").mkdir()
            (project_dir / "src" / "index.ts").touch()
            
            analysis = analyze_codebase(project_dir)
            
            self.assertIn("src", analysis.structure.key_directories)
            self.assertIn("src/index.ts", analysis.structure.entry_points)

    def test_detects_test_directories(self):
        """Detect test directories."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            (project_dir / "tests").mkdir()
            (project_dir / "__tests__").mkdir()
            
            analysis = analyze_codebase(project_dir)
            
            self.assertIn("tests", analysis.structure.test_dirs)
            self.assertIn("__tests__", analysis.structure.test_dirs)


class TestAnalysisOutput(unittest.TestCase):
    """Tests for analysis output formats."""

    def test_to_dict_serializable(self):
        """Ensure to_dict produces JSON-serializable output."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            (project_dir / "README.md").write_text("# Test")
            
            analysis = analyze_codebase(project_dir)
            result = analysis.to_dict()
            
            # Should be JSON serializable
            json_str = json.dumps(result)
            self.assertIsInstance(json_str, str)

    def test_to_summary_readable(self):
        """Ensure to_summary produces readable text."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            package_json = {
                "dependencies": {"react": "^18.0.0"},
                "devDependencies": {"typescript": "^5.0.0"}
            }
            with open(project_dir / "package.json", "w") as f:
                json.dump(package_json, f)
            
            analysis = analyze_codebase(project_dir)
            summary = analysis.to_summary()
            
            self.assertIn("Codebase Analysis", summary)
            self.assertIn("Tech Stack", summary)


class TestErrorHandling(unittest.TestCase):
    """Tests for error handling."""

    def test_invalid_directory_raises_error(self):
        """Invalid directory should raise ValueError."""
        with self.assertRaises(ValueError):
            analyze_codebase(Path("/nonexistent/path"))

    def test_handles_malformed_package_json(self):
        """Handle malformed package.json gracefully."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            
            with open(project_dir / "package.json", "w") as f:
                f.write("{ invalid json")
            
            # Should not raise, just return analysis without package.json data
            analysis = analyze_codebase(project_dir)
            self.assertIsNone(analysis.raw_package_json)


if __name__ == "__main__":
    unittest.main()
