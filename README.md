# Cultivation Fiction

AI-powered interactive cultivation novel game for the web.

Players can start a new run with a custom name, gender, and AI provider, then experience an open-ended xianxia story with branching choices, free-form input, local save data, and dynamic AI-generated openings.

<p>
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fj2st1n%2Fcultivation-fiction&project-name=cultivation-fiction&repository-name=cultivation-fiction" target="_blank" rel="noopener noreferrer">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
</p>

## Highlights

- Dynamic AI-generated opening background and main quest for each new run
- Mixed interaction mode with structured choices and free input
- In-browser save system with TXT novel export and JSON save import/export
- Configurable AI endpoint, model selection, model fetch, and connection validation
- Static deployment target for Vercel and Cloudflare Pages
- Client-side API key usage with no server-side key storage in this project

## Current Status

This project is active and intended for continued iteration.

Current priorities include:

- improving story consistency across long conversations
- surfacing more structured world state and quest tracking
- polishing the onboarding and save/load experience
- strengthening project docs and collaboration workflows

See [ROADMAP.md](./ROADMAP.md) for planned work.

## Demo Flow

1. Open the app
2. Choose a nickname and gender
3. Configure your AI endpoint, API key, and model
4. Validate the connection
5. Enter the game and receive a unique AI-generated opening
6. Progress using options or your own custom actions

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand

## Project Structure

```text
app/
  components/      UI and gameplay screens
  lib/             AI prompt logic, parsing, helpers
  store/           Zustand state stores
  types/           Shared TypeScript types
public/            Static assets
```

## Local Development

```bash
npm install
npm run dev
```

Local static preview:

```bash
npm run build
npm run preview
```

## Deployment

### Vercel

Use the deploy button above or import the repository manually.

If Vercel shows an Output Directory field, leave it empty or use the platform default unless you explicitly need `out`.

### Cloudflare Pages

Use:

- Build command: `npm run build`
- Output directory: `out`

This project is designed around static export.

More details: [DEPLOY.md](./DEPLOY.md)

## AI Configuration Notes

- Endpoint should be a base OpenAI-compatible API URL such as `https://api.openai.com/v1`
- API keys are intentionally kept in browser memory and are not committed to the repo
- Model lists can be fetched from the provider and validated before entering the game

## Save Data

- TXT export creates a readable novel-style text file
- JSON export preserves structured save data
- JSON import restores prior game state

## Security Model

This repository is a static web app. It does not proxy AI requests through a backend.

That means:

- users provide and use their own API keys locally
- this repo should never contain real secrets
- deployment should remain static unless the architecture is intentionally changed later

## Collaboration

- Bug reports: use the GitHub bug template
- Feature requests: use the GitHub feature template
- Pull requests: follow [CONTRIBUTING.md](./CONTRIBUTING.md)

## Versioning

This project is moving toward lightweight semantic versioning.

Release notes will be tracked in [CHANGELOG.md](./CHANGELOG.md).

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
