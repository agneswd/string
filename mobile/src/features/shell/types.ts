export type ShellTabKey = 'browse' | 'friends' | 'you'

export interface ShellTabDefinition {
  key: ShellTabKey
  label: string
  iconText: string
  badgeCount?: number
  hint?: string
}
