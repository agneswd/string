## Phase 2 Complete: Workspace shell and layout modes

Phase 2 introduced a new workspace-oriented shell so String now defaults to a calmer, less Discord-like layout for fresh users. It keeps the classic shell path available for future settings exposure, while limiting changes to structural chrome and layout behavior.

**Files created/changed:**
- src/App.tsx
- src/constants/theme.ts
- src/hooks/useLayoutMode.ts
- src/hooks/__tests__/useLayoutMode.test.ts
- src/components/layout/WorkspaceShell.tsx
- src/components/layout/__tests__/WorkspaceShell.test.tsx

**Functions created/changed:**
- useLayoutMode
- App
- WorkspaceShell

**Tests created/changed:**
- src/components/layout/__tests__/WorkspaceShell.test.tsx
- src/hooks/__tests__/useLayoutMode.test.ts

**Review Status:** APPROVED

**Git Commit Message:**
feat(ui): add workspace shell layout mode

- add a calmer workspace shell as the new default layout
- keep the classic shell path available for future settings
- expand tests for shell rendering and layout mode defaults
