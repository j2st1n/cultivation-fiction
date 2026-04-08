'use client';

import { useMemo } from 'react';
import { getBaseDisplayVersion, getDisplayVersion } from '@/app/lib/version';

function buildRuntimeDevMarker(): string {
  const now = new Date();
  return `UI${[
    `${now.getHours()}`.padStart(2, '0'),
    `${now.getMinutes()}`.padStart(2, '0'),
    `${now.getSeconds()}`.padStart(2, '0'),
  ].join('')}`;
}

export function VersionTag({ className = '' }: { className?: string }) {
  const displayVersion = useMemo(() => {
    if (process.env.NODE_ENV !== 'development') {
      return getBaseDisplayVersion();
    }

    return `${getDisplayVersion()}-${buildRuntimeDevMarker()}`;
  }, []);

  return <span className={className}>{displayVersion}</span>;
}
