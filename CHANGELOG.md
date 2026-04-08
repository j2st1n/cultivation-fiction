# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by Keep a Changelog and the project is moving toward semantic versioning.

## [Unreleased]

## [0.4.1] - 2026-04-07

### Changed
- Blog and GitHub icons now inherit the active reading theme styling more naturally instead of keeping a fixed slate-toned appearance

## [0.4.0] - 2026-04-07

### Added
- Three persisted reading themes: 夜幕, 青竹, and 纸卷

### Changed
- Main reading surfaces, panels, and setup flow now follow the selected reading theme for a more comfortable long-session experience

## [0.3.2] - 2026-04-07

### Changed
- Mobile header now uses a clearer two-row layout with the title protected from compression and the utility controls grouped more cleanly on small screens

## [0.3.1] - 2026-04-07

### Changed
- Story-state metadata is now emitted in a hidden structured block and shown only inside the 剧情 panel
- Mobile header layout now preserves a horizontal 修仙世界 title and wraps controls more cleanly on small screens

## [0.3.0] - 2026-04-07

### Added
- Dedicated 剧情 panel with separate 主线脉络 and 当前目标 views

### Changed
- Story state was upgraded from a single quest slot into a two-layer structure for long-term arc + current objective
- AI context now includes both main story arc and current objective to improve long-conversation consistency with lower narrative drift
- 世界观 panel now focuses on static world and character information only

## [0.2.2] - 2026-04-07

### Added
- Markdown rendering for assistant story output in both final and streaming states

### Changed
- Current main quest extraction now tracks more actionable objective phrasing
- Header controls were unified with minimalist icon buttons and age was moved fully into the world panel
- Blog icon loading now retries once before falling back
- Chat view no longer forces scroll-to-bottom after each response

## [0.2.1] - 2026-04-07

### Added
- Small visible version label in the setup and game header

### Changed
- TXT novel export now groups chapters by narrative chunks instead of raw paragraph counts
- Chapter titles now prefer lightweight subtitles based on place or event keywords

## [0.2.0] - 2026-04-07

### Added
- Dynamic AI-generated opening background and main quest
- Current main quest extraction and display in the world panel
- Expanded project documentation and GitHub collaboration scaffolding
- GitHub issue templates, PR template, and release configuration
- Chinese section in the public README

### Changed
- First-run setup and game entry flow were restructured to restore onboarding and intro behavior
- Repository structure was cleaned to remove agent-specific meta files from the project root

## [0.1.0] - 2026-04-07

### Added
- Initial public project setup
- Interactive cultivation fiction gameplay loop
- AI settings, model validation, save export/import, and static deployment support
