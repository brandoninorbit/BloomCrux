
"use client";
import dynamic from "next/dynamic";

// Load the heavy dev widget only in dev or when explicitly enabled
const DevFrameTester = dynamic(
  () => import("./dev/FrameTesterImpl"),
  { ssr: false }
);

export default function FrameTester(props: any) {
  const enabled =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_FRAME_TESTER === "true";

  if (!enabled) return null; // in prod by default it’s a no-op
  return <DevFrameTester {...props} />;
}
