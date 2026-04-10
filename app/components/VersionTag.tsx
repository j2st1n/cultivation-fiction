'use client';

import { getDisplayVersion } from '@/app/lib/version';

export function VersionTag({ className = '' }: { className?: string }) {
  return <span className={className}>{getDisplayVersion()}</span>;
}
