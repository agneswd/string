/**
 * DmListPane — compat wrapper.
 * Routes to DmListPaneClassic (default) or DmListPaneString based on layoutMode.
 */
import { DmListPaneClassic } from './DmListPaneClassic'
import { DmListPaneString } from './DmListPaneString'
import type { DmListPaneProps } from './types'

export function DmListPane({ layoutMode = 'classic', ...props }: DmListPaneProps) {
  if (layoutMode === 'string') return <DmListPaneString {...props} />
  return <DmListPaneClassic {...props} />
}

export { DmListPaneClassic, DmListPaneString }
