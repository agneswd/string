## Phase 4 Complete: Settings, overlays, and consistency pass

Phase 4 finished the redesign by exposing layout choice in settings and bringing secondary surfaces into the same warm-accented minimalist system. It updated shared modal and overlay styling, completed the remaining token sweep on touched secondary surfaces, and added focused coverage for the new settings and overlay behaviors.

**Files created/changed:**
- src/App.tsx
- src/components/modals/Modal.tsx
- src/components/modals/SettingsModal.tsx
- src/components/modals/__tests__/SettingsModal.test.tsx
- src/components/social/UserProfilePopup.tsx
- src/components/social/__tests__/UserProfilePopup.test.tsx
- src/components/ui/ContextMenu.tsx
- src/components/ui/NotificationToast.tsx
- src/components/ui/__tests__/ContextMenu.test.tsx
- src/constants/theme.ts
- src/index.css

**Functions created/changed:**
- App
- SettingsModal
- Modal
- UserProfilePopup
- ContextMenu
- NotificationToast

**Tests created/changed:**
- src/components/modals/__tests__/SettingsModal.test.tsx
- src/components/social/__tests__/UserProfilePopup.test.tsx
- src/components/ui/__tests__/ContextMenu.test.tsx

**Review Status:** APPROVED

**Git Commit Message:**
feat(ui): polish settings and overlay surfaces

- add layout mode controls to settings
- retheme modal, popup, toast, and context menu surfaces
- add focused tests for settings and overlay behavior
