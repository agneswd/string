## Plan: String layout split and full visual overhaul

This pass replaces the remaining subtle reskin work with a real component split between classic and string modes, then redesigns the remaining string surfaces so the app feels like its own product. It also fixes the shell outline, duplicated headers, classic sidebar inconsistencies, the `ChannelListPane` style warning, and moves string mode to JetBrains Mono.

**Phases 5**
1. **Phase 1: Layout mode rename and split foundation**
   - **Implementation Owner:** @Forge
   - **Objective:** Rename `workspace` mode to `string`, split mixed layout components into separate classic/string files, and preserve existing behavior.
   - **Files/Functions to Modify/Create:** src/constants/theme.ts, src/hooks/useLayoutMode.ts, src/components/modals/SettingsModal.tsx, src/components/guild/ServerListPane.tsx, src/components/layout/TopNavBar.tsx, src/components/layout/UserPanel.tsx, src/components/layout/ServerColumn.tsx, src/components/layout/SidebarBottom.tsx, src/App.tsx.
   - **Parallelization:** Must run first.
   - **Tests to Write:** None by default; rely on build and targeted lint unless a tiny smoke check becomes necessary.
   - **Steps:**
        1. Rename the mode and user-facing copy from `workspace` to `string`.
        2. Reset the persisted preference behavior rather than migrating the old stored value.
        3. Split mixed components into separate classic and string files.
        4. Update app wiring so only one variant is rendered per mode.
        5. Run build and targeted lint on changed files.

2. **Phase 2: Shell chrome and header cleanup**
   - **Implementation Owner:** @Loom
   - **Objective:** Redesign the string shell chrome, remove the black outline artifact, and fix duplicated top-bar context.
   - **Files/Functions to Modify/Create:** src/components/layout/WorkspaceShell.tsx or renamed string shell file, src/components/layout/AppShell.tsx, split top-nav files, src/components/layout/MessageArea.tsx, src/components/chat/ChatViewPane.tsx, src/components/social/FriendRequestPanel.tsx, src/App.tsx.
   - **Parallelization:** Starts after phase 1.
   - **Tests to Write:** None by default; build and targeted lint only.
   - **Steps:**
        1. Remove the inset outline around the main content in string mode.
        2. Redesign string shell framing and spacing so it looks clearly different.
        3. Fix duplicated headers by assigning one owner for view context in each screen.
        4. Correct classic shell sidebar alignment and dark bar issues.
        5. Run build and targeted lint.

3. **Phase 3: Parallel messaging surface redesign**
   - **Implementation Owner:** @Loom
   - **Objective:** Redesign DM and chat content surfaces for string mode with stronger typography and less Discord-like structure.
   - **Files/Functions to Modify/Create:** src/components/chat/ChatViewPane.tsx, src/components/chat/ReactionBar.tsx, src/components/voice/DmCallOverlay.tsx, any string-specific wrappers needed for chat surfaces.
   - **Parallelization:** Can run in parallel with phase 4 after phase 1. Must avoid overlapping shell/header ownership from phase 2.
   - **Tests to Write:** None by default; build and targeted lint only.
   - **Steps:**
        1. Redesign DM chat header, composer, message rhythm, and reactions.
        2. Apply JetBrains Mono styling for string mode where appropriate.
        3. Refresh DM call overlay styling to match string mode.
        4. Run build and targeted lint.

4. **Phase 4: Parallel navigation and social redesign**
   - **Implementation Owner:** @Loom
   - **Objective:** Redesign the string navigation lists and social surfaces, and fix the `ChannelListPane` style warning.
   - **Files/Functions to Modify/Create:** src/components/dm/DmListPane.tsx, src/components/guild/ChannelListPane.tsx, src/components/guild/MemberListPane.tsx, src/components/social/FriendRequestPanel.tsx, src/components/layout/ChannelColumn.tsx, src/components/layout/MemberColumn.tsx.
   - **Parallelization:** Can run in parallel with phase 3 after phase 1. Must coordinate with phase 2 on header ownership only.
   - **Tests to Write:** None by default; build and targeted lint only.
   - **Steps:**
        1. Redesign the DM list bar, guild/channel list, member surface, and friends page for string mode.
        2. Replace large workspace-specific labels with cleaner copy such as `Add` only.
        3. Move the member list into a softer inline panel or drawer treatment.
        4. Fix the `background` and `backgroundColor` conflict in ChannelListPane.
        5. Run build and targeted lint.

5. **Phase 5: Integration and polish pass**
   - **Implementation Owner:** @Forge
   - **Objective:** Reconcile the parallel redesign work, ensure both layout modes are coherent, and finish the font and spacing sweep.
   - **Files/Functions to Modify/Create:** src/App.tsx, shared layout wrappers, split exports, and any remaining files touched by phases 2-4.
   - **Parallelization:** Must wait for phases 2-4.
   - **Tests to Write:** None by default; build and targeted lint only.
   - **Steps:**
        1. Merge the split component work from parallel phases.
        2. Ensure classic mode keeps its intended structure with corrected colors and alignment.
        3. Finish the string-mode font and spacing sweep using JetBrains Mono where intended.
        4. Run build and targeted lint.

**Open Questions 3**
1. Use JetBrains Mono for string-mode chrome only, or also for message bodies and list content?
2. Should the softer member drawer remain always visible on wide screens, or collapse by default until toggled open?
3. Do you want classic mode to keep Discord-like typography, or just its structure with the corrected palette?