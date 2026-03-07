## SpacetimeDB module path

Canonical module path: `spacetimedb/`.
Use this directory as the active source for `spacetime publish` and `spacetime generate`.

## Verified local flow

- Start local SpacetimeDB: `spacetime start`
- Publish module: `spacetime publish string --module-path spacetimedb`
- Generate client bindings: `spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb`
- Install frontend deps: `npm install`
- Run frontend: `npm run dev`
- Add Clerk env in `.env.local`: `VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY`
- In app: sign in with Clerk, then create a guild or join a guild

## Clerk setup

- Quickstart: https://clerk.com/docs/react/getting-started/quickstart
- Local development uses `.env.local` for `VITE_CLERK_PUBLISHABLE_KEY`.
- For GitHub Pages, add both your production Pages URL and your local dev URL to Clerk's allowed origins / redirect URLs.
- The Vite config uses a relative base so built assets resolve correctly on GitHub Pages project pages.

