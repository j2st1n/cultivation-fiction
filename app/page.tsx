'use client';

import dynamic from 'next/dynamic';

const GameInterface = dynamic(
  () => import('@/app/components/GameInterface'),
  { ssr: false }
);

export default function Home() {
  return <GameInterface />;
}