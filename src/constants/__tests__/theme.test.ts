import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { THEME_TOKENS, LAYOUT_MODES, CSS_VAR_TOKENS } from '../theme'

describe('THEME_TOKENS', () => {
  it('exports an object', () => {
    expect(typeof THEME_TOKENS).toBe('object')
    expect(THEME_TOKENS).not.toBeNull()
  })

  it('has required token groups', () => {
    expect(THEME_TOKENS).toHaveProperty('bg')
    expect(THEME_TOKENS).toHaveProperty('text')
    expect(THEME_TOKENS).toHaveProperty('accent')
    expect(THEME_TOKENS).toHaveProperty('border')
    expect(THEME_TOKENS).toHaveProperty('radius')
    expect(THEME_TOKENS).toHaveProperty('spacing')
  })

  it('accent primary is not Discord blue', () => {
    expect(THEME_TOKENS.accent.primary.toLowerCase()).not.toBe('#5865f2')
  })

  it('accent primary is a valid hex color', () => {
    expect(THEME_TOKENS.accent.primary).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('background colors are dark (low luminance hex values)', () => {
    // All bg hex values should start with #1 or #2 (dark range < 48 decimal for first byte)
    const bgValues = Object.values(THEME_TOKENS.bg)
    for (const v of bgValues) {
      if (typeof v === 'string' && v.startsWith('#')) {
        const r = parseInt(v.slice(1, 3), 16)
        expect(r).toBeLessThan(60)
      }
    }
  })

  it('radius tokens are rem-based strings', () => {
    for (const val of Object.values(THEME_TOKENS.radius)) {
      expect(typeof val).toBe('string')
      expect(val).toMatch(/rem$|^9999px$/)
    }
  })
})

describe('LAYOUT_MODES', () => {
  it('exports a readonly tuple with classic and string modes', () => {
    expect(Array.isArray(LAYOUT_MODES)).toBe(true)
    expect(LAYOUT_MODES).toContain('classic')
    expect(LAYOUT_MODES).toContain('string')
  })
})

// ── CSS parity tests ────────────────────────────────────────────────────────
// Reads index.css and verifies every entry in CSS_VAR_TOKENS appears verbatim
// so that theme.ts stays the single source of truth and token drift is caught.

describe('CSS_VAR_TOKENS parity with index.css', () => {
  const cssPath = resolve(process.cwd(), 'src/index.css')
  const css = readFileSync(cssPath, 'utf-8')

  it('exports a non-empty token map', () => {
    expect(Object.keys(CSS_VAR_TOKENS).length).toBeGreaterThan(0)
  })

  for (const [varName, expected] of Object.entries(CSS_VAR_TOKENS)) {
    it(`index.css declares ${varName}: ${expected}`, () => {
      // Match "  --var-name:  value;" allowing any surrounding whitespace/semicolon
      const pattern = new RegExp(
        `${varName.replace('--', '--')}\\s*:\\s*${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*;`
      )
      expect(css).toMatch(pattern)
    })
  }
})
