## SpacetimeDB module path

Canonical module path: `spacetimedb/`.
Use this directory as the active source for `spacetime publish` and `spacetime generate`.

## Verified local flow

- Start local SpacetimeDB: `spacetime start`
- Publish module: `spacetime publish string --module-path spacetimedb`
- Generate client bindings: `spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb`
- Install frontend deps: `npm install`
- Run frontend: `npm run dev`
- In app: connect, register, then create a guild or join a guild

