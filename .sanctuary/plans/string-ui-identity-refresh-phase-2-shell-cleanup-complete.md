## Phase 2 Complete: Shell chrome and header cleanup

Phase 2 removed the string-shell outline artifact, made the top-level chrome more distinct, fixed redundant header context, and corrected the classic sidebar shell framing. The work stayed focused on shell, chrome, and header ownership so the deeper surface redesign can proceed separately.

**Files created/changed:**
- src/App.tsx
- src/components/chat/ChatViewPane.tsx
- src/components/guild/ServerListPane.shared.tsx
- src/components/guild/ServerListPaneClassic.tsx
- src/components/guild/ServerListPaneString.tsx
- src/components/layout/AppShell.tsx
- src/components/layout/MessageArea.tsx
- src/components/layout/TopNavBar.tsx
- src/components/layout/TopNavBarClassic.tsx
- src/components/layout/TopNavBarString.tsx
- src/components/layout/UserPanelClassic.tsx
- src/components/layout/WorkspaceShell.tsx
- src/components/layout/__tests__/TopNavBar.test.tsx
- src/components/layout/__tests__/WorkspaceShell.test.tsx
- src/components/layout/__tests__/layoutMode.integration.test.tsx
- src/constants/appStyles.ts
- src/index.css

**Functions created/changed:**
- App
- MessageArea
- TopNavBar
- TopNavBarClassic
- TopNavBarString
- WorkspaceShell
- AppShell

**Tests created/changed:**
- src/components/layout/__tests__/TopNavBar.test.tsx
- src/components/layout/__tests__/WorkspaceShell.test.tsx
- src/components/layout/__tests__/layoutMode.integration.test.tsx

**Review Status:** APPROVED

**Git Commit Message:**
feat(ui): refine shell chrome and header ownership

- remove the string shell outline and update chrome styling
- fix duplicated view context in the top bar
- align classic sidebar framing and shell surfaces
