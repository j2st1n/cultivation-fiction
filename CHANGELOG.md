# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by Keep a Changelog and the project is moving toward semantic versioning.

## [Unreleased]

## [0.5.5] - 2026-04-08

### Changed
- Desktop reading arrows now step from the live viewport anchor without relying on stale internal direction state

## [0.5.4] - 2026-04-08

### Changed
- Desktop reading arrows now derive their next anchor from the current viewport, so mouse-wheel and trackpad scrolling no longer leaves navigation in a stale state

## [0.5.3] - 2026-04-08

### Changed
- Reading arrows now step through conversation anchors more predictably instead of stalling after one jump
- World panel location history was reframed as coarse-grained key locations so it stays useful as the list grows

## [0.5.2] - 2026-04-08

### Changed
- Endpoint typing no longer gets rewritten with `/v1` while the user is still entering the URL manually
- Reading controls now target more meaningful conversation anchors and fade away more gracefully during long-form reading
- World-state syncing now carries structured location fields and realm sub-level display so UI metadata better matches the story text
- The world panel was simplified to avoid duplicated progress information and overly fragmented location display

## [0.5.1] - 2026-04-08

### Changed
- Mobile reading now includes quick jump controls for returning to the top or bottom during long sessions
- Streaming output no longer forcibly drags the viewport downward while the reader is reviewing earlier text
- Hidden 剧情状态 metadata and raw 选项 / 自由输入 blocks are now filtered out of visible streamed and final narrative output

## [0.5.0] - 2026-04-07

### Added
- Story memory now includes 最近进展 and 关键线索 in addition to 主线脉络 and 当前目标

### Changed
- AI context is now more compact and structured for long-session narrative consistency
- 剧情面板 now displays richer memory layers to reduce long-conversation drift

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
