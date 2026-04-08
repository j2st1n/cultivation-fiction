# Contributing

## Development Setup

```bash
npm install
npm run dev
```

Before submitting changes:

```bash
npm run build
```

This project uses Next.js 16. If you are changing framework-level behavior, confirm the current version's conventions before making architectural changes.

## Contribution Guidelines

- Keep changes focused and easy to review
- Prefer preserving the static deployment model unless a backend change is intentionally proposed
- Do not commit secrets, API keys, or environment-specific credentials
- When changing story flow, keep the option parsing format stable
- When changing save data structures, consider backward compatibility for existing JSON saves

## Pull Requests

Please include:

- what changed
- why it changed
- any user-facing impact
- validation performed

If your PR changes onboarding, AI prompting, save data, or deployment behavior, call that out explicitly.

## Issues

Use the GitHub templates for:

- bug reports
- feature requests

## Release Notes

User-visible changes should also be reflected in [CHANGELOG.md](./CHANGELOG.md).

## Versioning Rule

Version updates are part of delivery, not an optional follow-up.

- patch (`x.y.Z`): bug fixes, polish, layout fixes, rendering fixes, small UX adjustments
- minor (`x.Y.z`): meaningful feature additions, new panels, state model upgrades, interaction-flow improvements
- major (`X.y.z`): breaking product architecture shifts or intentionally incompatible redesigns

When a change is pushed as a released iteration, update the visible app version, package metadata, and changelog together.
