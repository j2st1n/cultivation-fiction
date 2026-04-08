import packageJson from '@/package.json';

export const APP_VERSION = packageJson.version;
const DEV_BUILD_ID = process.env.NEXT_PUBLIC_DEV_BUILD_ID?.trim() || 'DEV';
const DEV_DIRTY_STATE = process.env.NEXT_PUBLIC_DEV_DIRTY?.trim() || 'clean';

function buildLocalDevMarker(): string {
  const explicitMarker = process.env.NEXT_PUBLIC_LOCAL_TEST_MARKER?.trim();
  if (explicitMarker) {
    return explicitMarker;
  }

  return DEV_DIRTY_STATE === 'dirty' ? `${DEV_BUILD_ID}+dirty` : DEV_BUILD_ID;
}

export function getDisplayVersion(): string {
  if (process.env.NODE_ENV !== 'development') {
    return `v${APP_VERSION}`;
  }

  return `v${APP_VERSION}-${buildLocalDevMarker()}`;
}

export function getBaseDisplayVersion(): string {
  return `v${APP_VERSION}`;
}
