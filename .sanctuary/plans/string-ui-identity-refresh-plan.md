## Plan: String UI identity refresh

Redesign String’s frontend so it feels like its own product instead of a Discord lookalike. The work will introduce a warm-accented dark-leaning minimalist theme, reshape the shell into a more generic workspace layout, and preserve user choice by adding a settings option for a Discord-style layout.

**Phases 4**
1. **Phase 1: Theme foundation**
   - **Implementation Owner:** @Loom
   - **Objective:** Establish reusable design tokens and shared primitives for the new visual identity.
   - **Files/Functions to Modify/Create:** src/index.css, src/constants/appStyles.ts, optional new theme files under src/constants or src/lib, settings/store files if needed for shared theme/layout state.
   - **Parallelization:** Must run first.
   - **Tests to Write:** shared token application checks, theme state checks, build/lint verification.
   - **Steps:**
        1. Add component tests or theme-state tests first to capture token usage and layout-mode defaults.
        2. Run the tests to confirm they fail before implementation.
        3. Replace the Discord-coded palette with a neutral dark foundation plus subtle warm accents.
        4. Centralize surface, border, spacing, radius, and typography values for reuse.
        5. Add layout-mode state scaffolding so a future settings control can switch between default and Discord-style layout modes.
        6. Run tests, lint, and build to confirm the shared theme layer is stable.

2. **Phase 2: Workspace shell and layout modes**
   - **Implementation Owner:** @Loom
   - **Objective:** Redesign the overall app silhouette into a calmer workspace shell while supporting an alternate Discord-style layout.
   - **Files/Functions to Modify/Create:** src/components/layout/AppShell.tsx, src/components/layout/TopNavBar.tsx, src/components/layout/UserPanel.tsx, src/components/voice/VoicePanel.tsx, relevant navigation/store files that hold settings or layout preferences.
   - **Parallelization:** Must wait for phase 1.
   - **Tests to Write:** shell render checks for default and Discord-style layout modes, layout toggle persistence/state checks, build/lint verification.
   - **Steps:**
        1. Write failing tests for both layout modes and the new workspace shell structure.
        2. Rework the shell proportions, borders, and panel layering to reduce Discord resemblance.
        3. Implement layout-mode switching with the default set to the new workspace layout.
        4. Simplify top and bottom chrome to fit the minimalist visual system.
        5. Run tests, lint, and build to confirm both layouts behave correctly.

3. **Phase 3: Core messaging and navigation surfaces**
   - **Implementation Owner:** @Loom
   - **Objective:** Restyle the main interaction surfaces so conversations, lists, and home panels match the new identity.
   - **Files/Functions to Modify/Create:** src/components/chat/ChatViewPane.tsx, src/components/dm/DmListPane.tsx, src/components/guild/ChannelListPane.tsx, src/components/guild/MemberListPane.tsx, src/components/social/FriendRequestPanel.tsx, related shared UI helpers.
   - **Parallelization:** Must wait for phase 2.
   - **Tests to Write:** chat/composer render checks, list item state checks, friends/home surface checks, build/lint verification.
   - **Steps:**
        1. Write failing component tests for the updated primary surfaces.
        2. Redesign list rhythm, empty states, message layout, composer framing, and section headers.
        3. Apply the new theme tokens consistently across DM, guild, member, and home views.
        4. Reduce dense utility styling in favor of clearer hierarchy and breathing room.
        5. Run tests, lint, and build to verify the primary app experience.

4. **Phase 4: Settings, overlays, and consistency pass**
   - **Implementation Owner:** @Loom
   - **Objective:** Expose the layout choice in settings and align secondary surfaces with the new identity.
   - **Files/Functions to Modify/Create:** settings-related components and hooks, src/components/modals/Modal.tsx, src/components/ui/NotificationToast.tsx, src/components/social/UserProfilePopup.tsx, remaining files with hardcoded Discord colors.
   - **Parallelization:** Must wait for phases 1-3.
   - **Tests to Write:** settings toggle checks, modal/toast/profile surface checks, final app build/lint verification.
   - **Steps:**
        1. Write failing tests for the settings-driven layout switch and secondary surfaces.
        2. Add a user-facing setting for choosing the default workspace layout or Discord-style layout.
        3. Restyle overlays, popups, notifications, and other remaining chrome to match the new system.
        4. Sweep for leftover hardcoded Discord colors and replace them with shared tokens.
        5. Run tests, lint, and build to confirm a consistent finish.

**Open Questions 3**
1. Should the warm accent lean bronze, amber, or rose-gold once implemented in the actual interface?
2. Should the layout preference persist only locally or also sync through existing user settings if that infrastructure already exists?
3. How far should the Discord-style mode go: shell geometry only, or also more familiar color/accent treatment?