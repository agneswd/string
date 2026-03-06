## Phase 1 Complete: Theme foundation

Phase 1 established the new visual system foundation for String without changing the app’s current layout behavior. It introduced a reusable warm-accented dark theme contract, added layout-mode scaffolding for future workspace versus Discord-style switching, and added focused frontend test coverage for the new shared layer.

**Files created/changed:**
- package.json
- package-lock.json
- vite.config.ts
- src/App.tsx
- src/index.css
- src/constants/appStyles.ts
- src/constants/theme.ts
- src/constants/__tests__/theme.test.ts
- src/hooks/index.ts
- src/hooks/useLayoutMode.ts
- src/hooks/__tests__/useLayoutMode.test.ts

**Functions created/changed:**
- useLayoutMode
- App

**Tests created/changed:**
- src/constants/__tests__/theme.test.ts
- src/hooks/__tests__/useLayoutMode.test.ts

**Review Status:** APPROVED

**Git Commit Message:**
feat(ui): add theme foundation and layout scaffolding

- add shared theme tokens and CSS parity coverage
- add persistent layout mode hook for future shell variants
- set up Vitest frontend checks for theme and layout state
