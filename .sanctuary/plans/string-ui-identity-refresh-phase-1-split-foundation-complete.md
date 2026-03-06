## Phase 1 Complete: Layout mode rename and split foundation

Phase 1 renamed the new layout mode to string, reset old persisted workspace values cleanly, and split the mixed layout components into separate classic and string implementations. The app now selects one variant tree per mode, which prepares the remaining redesign work to proceed in parallel without keeping both branches in the same files.

**Files created/changed:**
- .sanctuary/plans/string-ui-identity-refresh-plan.md
- src/App.tsx
- src/components/guild/ServerListPane.tsx
- src/components/guild/ServerListPane.shared.tsx
- src/components/guild/ServerListPaneClassic.tsx
- src/components/guild/ServerListPaneString.tsx
- src/components/guild/__tests__/ServerListPane.test.tsx
- src/components/layout/ServerColumn.tsx
- src/components/layout/ServerColumnClassic.tsx
- src/components/layout/ServerColumnString.tsx
- src/components/layout/SidebarBottom.tsx
- src/components/layout/SidebarBottomClassic.tsx
- src/components/layout/SidebarBottomString.tsx
- src/components/layout/TopNavBar.tsx
- src/components/layout/TopNavBarClassic.tsx
- src/components/layout/TopNavBarString.tsx
- src/components/layout/UserPanel.tsx
- src/components/layout/UserPanelClassic.tsx
- src/components/layout/UserPanelString.tsx
- src/components/layout/__tests__/SidebarBottom.test.tsx
- src/components/layout/__tests__/TopNavBar.test.tsx
- src/components/layout/__tests__/UserPanel.test.tsx
- src/components/layout/__tests__/layoutMode.integration.test.tsx
- src/components/modals/SettingsModal.tsx
- src/components/modals/__tests__/SettingsModal.test.tsx
- src/constants/theme.ts
- src/constants/__tests__/theme.test.ts
- src/hooks/useLayoutMode.ts
- src/hooks/__tests__/useLayoutMode.test.ts

**Functions created/changed:**
- useLayoutMode
- App
- ServerListPane
- ServerColumn
- SidebarBottom
- TopNavBar
- UserPanel

**Tests created/changed:**
- src/hooks/__tests__/useLayoutMode.test.ts
- src/constants/__tests__/theme.test.ts
- src/components/modals/__tests__/SettingsModal.test.tsx
- src/components/guild/__tests__/ServerListPane.test.tsx
- src/components/layout/__tests__/TopNavBar.test.tsx
- src/components/layout/__tests__/UserPanel.test.tsx
- src/components/layout/__tests__/SidebarBottom.test.tsx
- src/components/layout/__tests__/layoutMode.integration.test.tsx

**Review Status:** APPROVED

**Git Commit Message:**
refactor(ui): split classic and string layout components

- rename the new layout mode from workspace to string
- split mixed layout files into classic and string variants
- update app wiring to render one mode-specific component tree
