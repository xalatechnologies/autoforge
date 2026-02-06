"""
Codebase Analyzer Service
=========================

Analyzes existing codebases to understand tech stack, patterns, documentation,
and conventions. Used by import flow and agent introspection skill.

This module is purely additive - it does not modify any existing services.
"""

import json
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# Python 3.11+ has tomllib in the standard library
try:
    import tomllib
except ImportError:
    tomllib = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


# =============================================================================
# Data Classes
# =============================================================================


@dataclass
class Dependency:
    """A project dependency with version info."""
    name: str
    version: str | None = None
    dev: bool = False
    source: str = ""  # e.g., "package.json", "requirements.txt"


@dataclass
class TechStackInfo:
    """Detected technology stack information."""
    language: str | None = None  # "javascript", "typescript", "python", etc.
    runtime: str | None = None  # "node", "bun", "deno", "python", etc.
    framework: str | None = None  # "react", "vue", "django", "fastapi", etc.
    meta_framework: str | None = None  # "next", "nuxt", "remix", etc.
    build_tool: str | None = None  # "vite", "webpack", "esbuild", etc.
    package_manager: str | None = None  # "npm", "pnpm", "yarn", "poetry", etc.
    test_framework: str | None = None  # "jest", "vitest", "pytest", etc.
    # Backend/Database
    backend: str | None = None  # "convex", "supabase", "firebase", "prisma", etc.
    database: str | None = None  # "postgresql", "mongodb", "sqlite", etc.
    # Monorepo
    is_monorepo: bool = False
    monorepo_tool: str | None = None  # "turborepo", "nx", "lerna", "pnpm-workspaces"
    workspace_apps: list[str] | None = None  # List of apps in monorepo
    workspace_packages: list[str] | None = None  # List of shared packages


@dataclass
class StylingInfo:
    """Detected styling/design system information."""
    css_framework: str | None = None  # "tailwind", "bootstrap", "chakra", etc.
    css_approach: str | None = None  # "modules", "styled-components", "emotion", etc.
    preprocessor: str | None = None  # "sass", "less", "postcss", etc.
    design_tokens_file: str | None = None  # Path to tokens file if found
    theme_file: str | None = None  # Path to theme config if found


@dataclass
class DocFile:
    """A documentation file found in the project."""
    path: str
    doc_type: str  # "readme", "changelog", "contributing", "api", "architecture", etc.
    title: str | None = None


@dataclass
class SpecFile:
    """A specification or planning file found in the project."""
    path: str
    spec_type: str  # "prd", "epic", "user-story", "spec", "autoforge"
    title: str | None = None


@dataclass
class TaskRef:
    """A task or issue reference found in the project."""
    ref_type: str  # "todo", "fixme", "github-issue", "jira", "linear"
    content: str
    file_path: str | None = None
    line_number: int | None = None
    url: str | None = None


@dataclass
class ProjectStructure:
    """Analyzed project structure."""
    root_files: list[str] = field(default_factory=list)
    key_directories: list[str] = field(default_factory=list)
    entry_points: list[str] = field(default_factory=list)
    component_dirs: list[str] = field(default_factory=list)
    test_dirs: list[str] = field(default_factory=list)
    config_files: list[str] = field(default_factory=list)
    # Convex components architecture
    convex_components: list[str] = field(default_factory=list)


@dataclass
class CodebaseAnalysis:
    """Complete analysis of a codebase."""
    project_dir: str
    project_name: str
    
    # Tech Stack
    tech_stack: TechStackInfo = field(default_factory=TechStackInfo)
    dependencies: list[Dependency] = field(default_factory=list)
    
    # Styling/Design
    styling: StylingInfo = field(default_factory=StylingInfo)
    
    # Documentation
    docs: list[DocFile] = field(default_factory=list)
    specs: list[SpecFile] = field(default_factory=list)
    
    # Tasks/Issues
    tasks: list[TaskRef] = field(default_factory=list)
    
    # Structure
    structure: ProjectStructure = field(default_factory=ProjectStructure)
    
    # Raw data for detailed inspection
    raw_package_json: dict | None = None
    raw_pyproject: dict | None = None
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization or MCP tool response."""
        return {
            "project_dir": self.project_dir,
            "project_name": self.project_name,
            "tech_stack": {
                "language": self.tech_stack.language,
                "runtime": self.tech_stack.runtime,
                "framework": self.tech_stack.framework,
                "meta_framework": self.tech_stack.meta_framework,
                "build_tool": self.tech_stack.build_tool,
                "package_manager": self.tech_stack.package_manager,
                "test_framework": self.tech_stack.test_framework,
                "backend": self.tech_stack.backend,
                "database": self.tech_stack.database,
                "is_monorepo": self.tech_stack.is_monorepo,
                "monorepo_tool": self.tech_stack.monorepo_tool,
                "workspace_apps": self.tech_stack.workspace_apps,
                "workspace_packages": self.tech_stack.workspace_packages,
            },
            "styling": {
                "css_framework": self.styling.css_framework,
                "css_approach": self.styling.css_approach,
                "preprocessor": self.styling.preprocessor,
                "design_tokens_file": self.styling.design_tokens_file,
                "theme_file": self.styling.theme_file,
            },
            "dependencies": [
                {"name": d.name, "version": d.version, "dev": d.dev, "source": d.source}
                for d in self.dependencies
            ],
            "docs": [
                {"path": d.path, "type": d.doc_type, "title": d.title}
                for d in self.docs
            ],
            "specs": [
                {"path": s.path, "type": s.spec_type, "title": s.title}
                for s in self.specs
            ],
            "tasks": [
                {
                    "type": t.ref_type,
                    "content": t.content,
                    "file": t.file_path,
                    "line": t.line_number,
                    "url": t.url,
                }
                for t in self.tasks
            ],
            "structure": {
                "root_files": self.structure.root_files,
                "key_directories": self.structure.key_directories,
                "entry_points": self.structure.entry_points,
                "component_dirs": self.structure.component_dirs,
                "test_dirs": self.structure.test_dirs,
                "config_files": self.structure.config_files,
                "convex_components": self.structure.convex_components,
            },
        }
    
    def to_summary(self) -> str:
        """Generate a human-readable summary of the analysis."""
        lines = [f"# Codebase Analysis: {self.project_name}", ""]
        
        # Tech Stack
        ts = self.tech_stack
        stack_parts = []
        if ts.language:
            stack_parts.append(ts.language.title())
        if ts.framework:
            stack_parts.append(ts.framework.title())
        if ts.meta_framework:
            stack_parts.append(f"({ts.meta_framework.title()})")
        if ts.build_tool:
            stack_parts.append(f"+ {ts.build_tool.title()}")
        
        if stack_parts:
            lines.append(f"**Tech Stack:** {' '.join(stack_parts)}")
        
        # Styling
        if self.styling.css_framework:
            lines.append(f"**Styling:** {self.styling.css_framework.title()}")
        
        # Backend
        if self.tech_stack.backend:
            backend_info = self.tech_stack.backend.title()
            if self.structure.convex_components:
                backend_info += f" ({len(self.structure.convex_components)} components)"
            lines.append(f"**Backend:** {backend_info}")
        
        # Monorepo
        if self.tech_stack.is_monorepo:
            parts = []
            if self.tech_stack.workspace_apps:
                parts.append(f"{len(self.tech_stack.workspace_apps)} apps")
            if self.tech_stack.workspace_packages:
                parts.append(f"{len(self.tech_stack.workspace_packages)} packages")
            lines.append(f"**Monorepo:** {', '.join(parts)}")
        
        # Dependencies count
        if self.dependencies:
            prod = sum(1 for d in self.dependencies if not d.dev)
            dev = sum(1 for d in self.dependencies if d.dev)
            lines.append(f"**Dependencies:** {prod} production, {dev} dev")
        
        # Docs
        if self.docs:
            lines.append(f"**Documentation:** {len(self.docs)} files found")
        
        # Specs
        if self.specs:
            lines.append(f"**Specs/Planning:** {len(self.specs)} files found")
        
        # Tasks
        if self.tasks:
            lines.append(f"**Tasks/TODOs:** {len(self.tasks)} found")
        
        return "\n".join(lines)


# =============================================================================
# Analysis Functions
# =============================================================================


def _parse_package_json(project_dir: Path) -> dict | None:
    """Parse package.json if it exists."""
    package_json_path = project_dir / "package.json"
    if not package_json_path.exists():
        return None
    try:
        with open(package_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else None
    except (json.JSONDecodeError, OSError) as e:
        logger.debug("Failed to parse package.json: %s", e)
        return None


def _parse_pyproject(project_dir: Path) -> dict | None:
    """Parse pyproject.toml if it exists."""
    pyproject_path = project_dir / "pyproject.toml"
    if not pyproject_path.exists():
        return None
    if tomllib is None:
        return {}  # tomllib not available
    try:
        with open(pyproject_path, "rb") as f:
            return tomllib.load(f)
    except Exception as e:
        logger.debug("Failed to parse pyproject.toml: %s", e)
        return None


def _parse_requirements_txt(project_dir: Path) -> list[Dependency]:
    """Parse requirements.txt for dependencies."""
    deps = []
    for filename in ["requirements.txt", "requirements-dev.txt", "requirements-prod.txt"]:
        req_path = project_dir / filename
        if not req_path.exists():
            continue
        is_dev = "dev" in filename
        try:
            with open(req_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or line.startswith("-"):
                        continue
                    # Parse "package==version" or "package>=version" etc.
                    match = re.match(r"^([a-zA-Z0-9_-]+)([<>=!~]+.*)?$", line)
                    if match:
                        name = match.group(1)
                        version = match.group(2).lstrip("<>=!~") if match.group(2) else None
                        deps.append(Dependency(
                            name=name,
                            version=version,
                            dev=is_dev,
                            source=filename
                        ))
        except OSError:
            pass
    return deps


def _detect_tech_stack(project_dir: Path, pkg: dict | None, pyproj: dict | None) -> TechStackInfo:
    """Detect the technology stack."""
    info = TechStackInfo()
    
    # Detect package manager
    if (project_dir / "pnpm-lock.yaml").exists():
        info.package_manager = "pnpm"
    elif (project_dir / "yarn.lock").exists():
        info.package_manager = "yarn"
    elif (project_dir / "bun.lockb").exists():
        info.package_manager = "bun"
    elif (project_dir / "package-lock.json").exists():
        info.package_manager = "npm"
    elif (project_dir / "poetry.lock").exists():
        info.package_manager = "poetry"
    elif (project_dir / "Pipfile.lock").exists():
        info.package_manager = "pipenv"
    
    # Node.js project
    if pkg is not None:
        info.runtime = "node"
        
        # Detect TypeScript
        deps = pkg.get("dependencies", {})
        dev_deps = pkg.get("devDependencies", {})
        all_deps = {**deps, **dev_deps}
        
        if "typescript" in all_deps or (project_dir / "tsconfig.json").exists():
            info.language = "typescript"
        else:
            info.language = "javascript"
        
        # Detect framework
        if "react" in deps:
            info.framework = "react"
        elif "vue" in deps:
            info.framework = "vue"
        elif "svelte" in deps:
            info.framework = "svelte"
        elif "@angular/core" in deps:
            info.framework = "angular"
        elif "express" in deps:
            info.framework = "express"
        elif "@nestjs/core" in deps:
            info.framework = "nestjs"
        
        # Detect meta-framework
        if "next" in deps:
            info.meta_framework = "next"
        elif "nuxt" in deps:
            info.meta_framework = "nuxt"
        elif "@remix-run/node" in deps or "@remix-run/react" in deps:
            info.meta_framework = "remix"
        elif "@sveltejs/kit" in deps:
            info.meta_framework = "sveltekit"
        elif "astro" in deps:
            info.meta_framework = "astro"
        
        # Detect build tool
        if "vite" in all_deps:
            info.build_tool = "vite"
        elif "webpack" in all_deps:
            info.build_tool = "webpack"
        elif "esbuild" in all_deps:
            info.build_tool = "esbuild"
        elif "parcel" in all_deps:
            info.build_tool = "parcel"
        elif "@rspack/core" in all_deps:
            info.build_tool = "rspack"
        
        # Detect test framework
        if "vitest" in all_deps:
            info.test_framework = "vitest"
        elif "jest" in all_deps:
            info.test_framework = "jest"
        elif "mocha" in all_deps:
            info.test_framework = "mocha"
        elif "@playwright/test" in all_deps:
            info.test_framework = "playwright"
    
    # Python project
    elif pyproj is not None or (project_dir / "requirements.txt").exists():
        info.language = "python"
        info.runtime = "python"
        
        # Check pyproject for framework hints
        if pyproj:
            deps_str = str(pyproj)
            if "django" in deps_str.lower():
                info.framework = "django"
            elif "fastapi" in deps_str.lower():
                info.framework = "fastapi"
            elif "flask" in deps_str.lower():
                info.framework = "flask"
            
            if "pytest" in deps_str.lower():
                info.test_framework = "pytest"
    
    # Rust project
    elif (project_dir / "Cargo.toml").exists():
        info.language = "rust"
        info.runtime = "rust"
        info.package_manager = "cargo"
    
    # Go project
    elif (project_dir / "go.mod").exists():
        info.language = "go"
        info.runtime = "go"
        info.package_manager = "go"
    
    # Detect backend/database
    if pkg is not None:
        deps = pkg.get("dependencies", {})
        dev_deps = pkg.get("devDependencies", {})
        all_deps = {**deps, **dev_deps}
        
        # Convex (reactive backend)
        if "convex" in all_deps or (project_dir / "convex").is_dir():
            info.backend = "convex"
        # Supabase
        elif "@supabase/supabase-js" in all_deps:
            info.backend = "supabase"
            info.database = "postgresql"
        # Firebase
        elif "firebase" in all_deps or "firebase-admin" in all_deps:
            info.backend = "firebase"
        # Prisma
        elif "@prisma/client" in all_deps or "prisma" in all_deps:
            info.backend = "prisma"
        # Drizzle
        elif "drizzle-orm" in all_deps:
            info.backend = "drizzle"
    
    # Detect monorepo
    if (project_dir / "pnpm-workspace.yaml").exists():
        info.is_monorepo = True
        info.monorepo_tool = "pnpm-workspaces"
        # Detect apps and packages
        apps_dir = project_dir / "apps"
        packages_dir = project_dir / "packages"
        if apps_dir.exists() and apps_dir.is_dir():
            info.workspace_apps = [d.name for d in apps_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]
        if packages_dir.exists() and packages_dir.is_dir():
            info.workspace_packages = [d.name for d in packages_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]
    elif (project_dir / "turbo.json").exists():
        info.is_monorepo = True
        info.monorepo_tool = "turborepo"
    elif (project_dir / "nx.json").exists():
        info.is_monorepo = True
        info.monorepo_tool = "nx"
    elif (project_dir / "lerna.json").exists():
        info.is_monorepo = True
        info.monorepo_tool = "lerna"
    
    return info


def _detect_styling(project_dir: Path, pkg: dict | None) -> StylingInfo:
    """Detect styling and design system setup."""
    info = StylingInfo()
    
    if pkg is not None:
        deps = pkg.get("dependencies", {})
        dev_deps = pkg.get("devDependencies", {})
        all_deps = {**deps, **dev_deps}
        
        # CSS Frameworks
        if "tailwindcss" in all_deps:
            info.css_framework = "tailwind"
        elif "@chakra-ui/react" in all_deps:
            info.css_framework = "chakra"
        elif "@mui/material" in all_deps:
            info.css_framework = "mui"
        elif "bootstrap" in all_deps or "react-bootstrap" in all_deps:
            info.css_framework = "bootstrap"
        elif "antd" in all_deps:
            info.css_framework = "antd"
        elif "@mantine/core" in all_deps:
            info.css_framework = "mantine"
        
        # CSS-in-JS approaches
        if "styled-components" in all_deps:
            info.css_approach = "styled-components"
        elif "@emotion/react" in all_deps or "@emotion/styled" in all_deps:
            info.css_approach = "emotion"
        elif "linaria" in all_deps:
            info.css_approach = "linaria"
        
        # Preprocessors
        if "sass" in all_deps or "node-sass" in all_deps:
            info.preprocessor = "sass"
        elif "less" in all_deps:
            info.preprocessor = "less"
        if "postcss" in all_deps:
            info.preprocessor = info.preprocessor or "postcss"
    
    # Look for design tokens files
    token_patterns = [
        "tokens.json", "design-tokens.json", "theme.json",
        "tokens.ts", "tokens.js", "theme.ts", "theme.js",
        "src/tokens.json", "src/theme.json",
        "styles/tokens.json", "styles/theme.json",
    ]
    for pattern in token_patterns:
        token_path = project_dir / pattern
        if token_path.exists():
            if "token" in pattern:
                info.design_tokens_file = pattern
            else:
                info.theme_file = pattern
            break
    
    # Check for tailwind config
    for config_name in ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.mjs"]:
        if (project_dir / config_name).exists():
            info.theme_file = config_name
            break
    
    return info


def _find_docs(project_dir: Path) -> list[DocFile]:
    """Find documentation files in the project."""
    docs = []
    
    doc_patterns = {
        "readme": ["README.md", "README.txt", "README", "readme.md"],
        "changelog": ["CHANGELOG.md", "CHANGES.md", "HISTORY.md"],
        "contributing": ["CONTRIBUTING.md", "CONTRIBUTE.md"],
        "license": ["LICENSE", "LICENSE.md", "LICENSE.txt"],
        "architecture": ["ARCHITECTURE.md", "DESIGN.md"],
        "api": ["API.md", "docs/api.md", "API.rst"],
        "security": ["SECURITY.md"],
        "code-of-conduct": ["CODE_OF_CONDUCT.md"],
    }
    
    for doc_type, patterns in doc_patterns.items():
        for pattern in patterns:
            doc_path = project_dir / pattern
            if doc_path.exists():
                # Try to extract title from first line
                title = None
                try:
                    with open(doc_path, "r", encoding="utf-8") as f:
                        first_line = f.readline().strip()
                        if first_line.startswith("#"):
                            title = first_line.lstrip("#").strip()
                except OSError:
                    pass
                docs.append(DocFile(path=pattern, doc_type=doc_type, title=title))
                break
    
    # Check for docs directory
    docs_dir = project_dir / "docs"
    if docs_dir.exists() and docs_dir.is_dir():
        for md_file in docs_dir.glob("*.md"):
            rel_path = str(md_file.relative_to(project_dir))
            if not any(d.path == rel_path for d in docs):
                title = None
                try:
                    with open(md_file, "r", encoding="utf-8") as f:
                        first_line = f.readline().strip()
                        if first_line.startswith("#"):
                            title = first_line.lstrip("#").strip()
                except OSError:
                    pass
                docs.append(DocFile(path=rel_path, doc_type="documentation", title=title))
    
    return docs


def _find_specs(project_dir: Path) -> list[SpecFile]:
    """Find specification and planning files."""
    specs = []
    
    # Check for AutoForge specs
    autoforge_prompts = project_dir / ".autoforge" / "prompts"
    if autoforge_prompts.exists():
        for spec_file in autoforge_prompts.glob("*.txt"):
            specs.append(SpecFile(
                path=str(spec_file.relative_to(project_dir)),
                spec_type="autoforge",
                title=spec_file.stem
            ))
        for spec_file in autoforge_prompts.glob("*.md"):
            specs.append(SpecFile(
                path=str(spec_file.relative_to(project_dir)),
                spec_type="autoforge",
                title=spec_file.stem
            ))
    
    # Check for Traycer.ai specs (epics and tickets)
    traycer_dir = project_dir / ".traycer"
    if traycer_dir.exists():
        for traycer_file in traycer_dir.glob("**/*.md"):
            rel_path = str(traycer_file.relative_to(project_dir))
            spec_type = "traycer-epic" if "epic" in rel_path.lower() else "traycer-ticket"
            title = None
            try:
                with open(traycer_file, "r", encoding="utf-8") as f:
                    first_line = f.readline().strip()
                    if first_line.startswith("#"):
                        title = first_line.lstrip("#").strip()
            except OSError:
                pass
            specs.append(SpecFile(path=rel_path, spec_type=spec_type, title=title))
    
    # Check for common spec patterns
    spec_patterns = [
        ("prd", ["PRD.md", "prd.md", "docs/PRD.md"]),
        ("epic", ["EPIC.md", "epic.md"]),
        ("spec", ["SPEC.md", "spec.md", "SPECIFICATION.md"]),
        ("user-story", ["USER_STORIES.md", "stories.md"]),
        ("roadmap", ["ROADMAP.md", "roadmap.md"]),
    ]
    
    for spec_type, patterns in spec_patterns:
        for pattern in patterns:
            spec_path = project_dir / pattern
            if spec_path.exists():
                title = None
                try:
                    with open(spec_path, "r", encoding="utf-8") as f:
                        first_line = f.readline().strip()
                        if first_line.startswith("#"):
                            title = first_line.lstrip("#").strip()
                except OSError:
                    pass
                specs.append(SpecFile(path=pattern, spec_type=spec_type, title=title))
    
    # Look for EPIC-*.md or similar patterns
    for epic_file in project_dir.glob("EPIC-*.md"):
        specs.append(SpecFile(
            path=str(epic_file.relative_to(project_dir)),
            spec_type="epic",
            title=epic_file.stem
        ))
    
    return specs


def _find_tasks(project_dir: Path, max_files: int = 100) -> list[TaskRef]:
    """Find TODO/FIXME comments and issue references in source files."""
    tasks = []
    
    # Patterns to search for
    todo_pattern = re.compile(r"(?:TODO|FIXME|HACK|XXX)[\s:]+(.+)", re.IGNORECASE)
    github_issue_pattern = re.compile(r"#(\d+)")
    jira_pattern = re.compile(r"([A-Z]+-\d+)")
    linear_pattern = re.compile(r"(ENG-\d+|[A-Z]{2,5}-\d+)")
    
    # Extensions to scan
    scan_extensions = {".py", ".js", ".ts", ".jsx", ".tsx", ".vue", ".svelte", ".rs", ".go"}
    
    # Directories to skip
    skip_dirs = {"node_modules", ".git", "venv", ".venv", "__pycache__", "dist", "build", ".next"}
    
    files_scanned = 0
    for root, dirs, files in project_dir.walk():
        # Skip directories
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for filename in files:
            if files_scanned >= max_files:
                break
                
            file_path = root / filename
            if file_path.suffix not in scan_extensions:
                continue
            
            files_scanned += 1
            rel_path = str(file_path.relative_to(project_dir))
            
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_num, line in enumerate(f, 1):
                        # TODO/FIXME
                        match = todo_pattern.search(line)
                        if match:
                            ref_type = "todo"
                            if "FIXME" in line.upper():
                                ref_type = "fixme"
                            tasks.append(TaskRef(
                                ref_type=ref_type,
                                content=match.group(1).strip()[:200],
                                file_path=rel_path,
                                line_number=line_num
                            ))
                        
                        # GitHub issues (only in comments)
                        if "#" in line and ("TODO" in line.upper() or "//" in line or "#" in line[:5]):
                            for issue_match in github_issue_pattern.finditer(line):
                                issue_num = issue_match.group(1)
                                if int(issue_num) < 100000:  # Reasonable issue number
                                    tasks.append(TaskRef(
                                        ref_type="github-issue",
                                        content=f"#{issue_num}",
                                        file_path=rel_path,
                                        line_number=line_num
                                    ))
            except OSError:
                pass
        
        if files_scanned >= max_files:
            break
    
    return tasks


def _analyze_structure(project_dir: Path) -> ProjectStructure:
    """Analyze project directory structure."""
    structure = ProjectStructure()
    
    # Root files
    important_root_files = [
        "package.json", "tsconfig.json", "vite.config.ts", "vite.config.js",
        "next.config.js", "next.config.mjs", "tailwind.config.js",
        "pyproject.toml", "requirements.txt", "manage.py", "main.py", "app.py",
        "Cargo.toml", "go.mod", "Makefile", "Dockerfile", "docker-compose.yml",
        ".env.example", ".gitignore", "CLAUDE.md",
    ]
    for filename in important_root_files:
        if (project_dir / filename).exists():
            structure.root_files.append(filename)
    
    # Key directories
    key_dirs = ["src", "app", "pages", "components", "lib", "utils", "api", "server", "public", "assets"]
    for dirname in key_dirs:
        if (project_dir / dirname).exists() and (project_dir / dirname).is_dir():
            structure.key_directories.append(dirname)
    
    # Entry points
    entry_patterns = [
        "src/index.tsx", "src/index.ts", "src/index.js",
        "src/main.tsx", "src/main.ts", "src/main.js",
        "app/page.tsx", "app/layout.tsx",  # Next.js App Router
        "pages/index.tsx", "pages/_app.tsx",  # Next.js Pages Router
        "main.py", "app.py", "server.py", "manage.py",
        "src/main.rs", "main.go", "cmd/main.go",
    ]
    for entry in entry_patterns:
        if (project_dir / entry).exists():
            structure.entry_points.append(entry)
    
    # Component directories
    component_patterns = ["components", "src/components", "app/components", "ui", "src/ui"]
    for pattern in component_patterns:
        comp_dir = project_dir / pattern
        if comp_dir.exists() and comp_dir.is_dir():
            structure.component_dirs.append(pattern)
    
    # Test directories
    test_patterns = ["tests", "test", "__tests__", "src/__tests__", "spec", "specs"]
    for pattern in test_patterns:
        test_dir = project_dir / pattern
        if test_dir.exists() and test_dir.is_dir():
            structure.test_dirs.append(pattern)
    
    # Config files found
    config_patterns = [
        "*.config.js", "*.config.ts", "*.config.mjs",
        ".eslintrc*", ".prettierrc*", "jest.config.*",
        "vitest.config.*", "playwright.config.*",
    ]
    for pattern in config_patterns:
        for config_file in project_dir.glob(pattern):
            if config_file.is_file():
                structure.config_files.append(config_file.name)
    
    # Convex components architecture
    convex_components_dir = project_dir / "convex" / "components"
    if convex_components_dir.exists() and convex_components_dir.is_dir():
        for comp_dir in convex_components_dir.iterdir():
            if comp_dir.is_dir() and not comp_dir.name.startswith("_"):
                # Check for convex.config.ts to confirm it's a component
                if (comp_dir / "convex.config.ts").exists() or (comp_dir / "convex.config.js").exists():
                    structure.convex_components.append(comp_dir.name)
    
    return structure


def _extract_dependencies_from_package(pkg: dict) -> list[Dependency]:
    """Extract dependencies from package.json."""
    deps = []
    
    for name, version in pkg.get("dependencies", {}).items():
        deps.append(Dependency(name=name, version=version, dev=False, source="package.json"))
    
    for name, version in pkg.get("devDependencies", {}).items():
        deps.append(Dependency(name=name, version=version, dev=True, source="package.json"))
    
    return deps


# =============================================================================
# Main Analysis Function
# =============================================================================


def analyze_codebase(project_dir: Path) -> CodebaseAnalysis:
    """
    Perform comprehensive analysis of a codebase.
    
    Args:
        project_dir: Path to the project root directory.
        
    Returns:
        CodebaseAnalysis object with all detected information.
    """
    project_dir = Path(project_dir).resolve()
    
    if not project_dir.exists() or not project_dir.is_dir():
        raise ValueError(f"Invalid project directory: {project_dir}")
    
    logger.info("Analyzing codebase at: %s", project_dir)
    
    # Parse config files
    pkg = _parse_package_json(project_dir)
    pyproj = _parse_pyproject(project_dir)
    
    # Detect tech stack
    tech_stack = _detect_tech_stack(project_dir, pkg, pyproj)
    
    # Extract dependencies
    dependencies = []
    if pkg:
        dependencies.extend(_extract_dependencies_from_package(pkg))
    dependencies.extend(_parse_requirements_txt(project_dir))
    
    # Detect styling
    styling = _detect_styling(project_dir, pkg)
    
    # Find documentation
    docs = _find_docs(project_dir)
    
    # Find specs
    specs = _find_specs(project_dir)
    
    # Find tasks
    tasks = _find_tasks(project_dir)
    
    # Analyze structure
    structure = _analyze_structure(project_dir)
    
    analysis = CodebaseAnalysis(
        project_dir=str(project_dir),
        project_name=project_dir.name,
        tech_stack=tech_stack,
        dependencies=dependencies,
        styling=styling,
        docs=docs,
        specs=specs,
        tasks=tasks,
        structure=structure,
        raw_package_json=pkg,
        raw_pyproject=pyproj,
    )
    
    logger.info("Analysis complete: %s", analysis.to_summary().replace("\n", " | "))
    
    return analysis
