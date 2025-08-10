
"use client";

import dynamic from 'next/dynamic';

const FrameTesterImpl = dynamic(
  () => import('@/components/dev/FrameTesterImpl'),
  { ssr: false }
);

export default function FrameTester(props: any) {
  // This component will only render its implementation if the env var is set.
  // This makes it safe to include in any page for development purposes.
  if (process.env.NEXT_PUBLIC_DEV_UI !== '1') {
    return null;
  }

  return <FrameTesterImpl {...props} />;
}
