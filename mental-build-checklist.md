
# Mental Build Checklist (post-fix)

- Have you run **npm ci && npm run build** locally since your last change?
- Confirm **tsconfig.json** now excludes `.next` and has `"skipLibCheck": true`.
- Sanity-run **npx tsc --noEmit** (should not traverse `.next/types` anymore).
- If you're using Next.js SSR/SSG, ensure your `next.config.js` does **not** set `output: "export"`.
- Ensure environment:
  - `.env.local` present and in `.gitignore`
  - `NEXT_PUBLIC_FIREBASE_*` values exist locally
- Verify client vs server imports:
  - Anything touching `firebase/*` runs in a `"use client"` component or guarded by dynamic import.
- After each fix, re-run the prod build to catch regressions immediately.
