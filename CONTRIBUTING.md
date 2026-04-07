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
