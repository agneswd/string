/**
 * channel-list/utils.ts
 *
 * Pure helpers used by ChannelListPane and its sub-components.
 */

import type { ChannelListItem, CategoryGroup } from './types'

/** Group a flat channel list by category label. Preserves insertion order. */
export function groupByCategory(channels: ChannelListItem[]): CategoryGroup[] {
  const map = new Map<string, ChannelListItem[]>()
  const order: string[] = []
  for (const ch of channels) {
    const cat = ch.category ?? ''
    if (!map.has(cat)) { map.set(cat, []); order.push(cat) }
    map.get(cat)!.push(ch)
  }
  return order.map((label) => ({ label, channels: map.get(label)! }))
}
