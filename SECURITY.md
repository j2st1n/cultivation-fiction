# Security Policy

## Supported Version

The latest version on `main` is the supported version for security-related fixes.

## Reporting a Vulnerability

If you discover a security issue, please do not open a public issue with exploit details.

Instead:

1. Prepare a clear description of the issue
2. Include impact, reproduction steps, and any proof of concept if necessary
3. Share it privately with the repository maintainer through GitHub private reporting if available, or another private channel

## Scope Notes

This project is a static client-side web app.

Important implications:

- users provide their own API keys locally
- this repository should never contain committed secrets
- the app does not provide a backend secret vault or request proxy

## What to Report

- accidental exposure of secrets or credentials
- unsafe client-side storage of sensitive data beyond the current intended model
- injection or unsafe rendering issues
- save import/export paths that could lead to abuse
- supply-chain or dependency risks with clear impact on this project

## Out of Scope

- requests to support private API key storage on the static client
- vulnerabilities in third-party providers outside this repository
- purely theoretical issues without a practical attack path
