import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextMenu } from '../ContextMenu'
import type { ContextMenuItem } from '../ContextMenu'

const normalItem: ContextMenuItem = { label: 'Edit', onClick: vi.fn() }
const dangerItem: ContextMenuItem = { label: 'Delete', onClick: vi.fn(), danger: true }
const disabledItem: ContextMenuItem = { label: 'Disabled', onClick: vi.fn(), disabled: true }

function renderMenu(items: ContextMenuItem[] = [normalItem, dangerItem], onClose = vi.fn()) {
  return render(<ContextMenu x={100} y={100} items={items} onClose={onClose} />)
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('ContextMenu', () => {
  it('renders all item labels', () => {
    renderMenu()
    expect(screen.getByText('Edit')).toBeTruthy()
    expect(screen.getByText('Delete')).toBeTruthy()
  })

  it('calls item.onClick and onClose when a normal item is clicked', () => {
    const onClick = vi.fn()
    const onClose = vi.fn()
    renderMenu([{ ...normalItem, onClick }], onClose)
    fireEvent.click(screen.getByText('Edit'))
    expect(onClick).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClick for disabled items', () => {
    const onClick = vi.fn()
    const onClose = vi.fn()
    renderMenu([{ ...disabledItem, onClick }], onClose)
    fireEvent.click(screen.getByText('Disabled'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('danger items start with --text-danger color (no hardcoded hex)', () => {
    renderMenu()
    const deleteBtn = screen.getByText('Delete').closest('button')!
    expect(deleteBtn.style.color).toBe('var(--text-danger)')
  })

  it('normal items start with --text-secondary color', () => {
    renderMenu()
    const editBtn = screen.getByText('Edit').closest('button')!
    expect(editBtn.style.color).toBe('var(--text-secondary)')
  })

  it('danger item hover sets background to --bg-danger-hover (no hardcoded rgba)', () => {
    renderMenu()
    const deleteBtn = screen.getByText('Delete').closest('button')!
    fireEvent.mouseEnter(deleteBtn)
    expect(deleteBtn.style.background).toBe('var(--bg-danger-hover)')
    // Must not contain the old hardcoded value
    expect(deleteBtn.style.background).not.toContain('rgba(248')
  })

  it('normal item hover sets background to --bg-active', () => {
    renderMenu()
    const editBtn = screen.getByText('Edit').closest('button')!
    fireEvent.mouseEnter(editBtn)
    expect(editBtn.style.background).toBe('var(--bg-active)')
  })

  it('mouse leave resets danger item back to transparent', () => {
    renderMenu()
    const deleteBtn = screen.getByText('Delete').closest('button')!
    fireEvent.mouseEnter(deleteBtn)
    fireEvent.mouseLeave(deleteBtn)
    expect(deleteBtn.style.background).toBe('transparent')
  })

  it('closes on Escape key', () => {
    const onClose = vi.fn()
    renderMenu([normalItem], onClose)
    // ContextMenu delays listener registration by setTimeout(0) to avoid
    // closing on the triggering right-click: advance timers before firing.
    vi.runAllTimers()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
