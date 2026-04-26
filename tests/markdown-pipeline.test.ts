import { describe, expect, it } from 'vitest';
import { createMarkdownSanitizeSchema } from '../src/lib/markdown/pipeline';
import { getLangIcon } from '../src/utils/lang-icons.mjs';

describe('markdown sanitize schema', () => {
  it('keeps gradient-based language icons renderable', () => {
    const pythonIcon = getLangIcon('python');
    const phpIcon = getLangIcon('php');
    const schema = createMarkdownSanitizeSchema();
    const tagNames = new Set(schema.tagNames ?? []);
    const linearGradientAttrs = new Set((schema.attributes?.linearGradient ?? []).map(String));
    const radialGradientAttrs = new Set((schema.attributes?.radialGradient ?? []).map(String));
    const stopAttrs = new Set((schema.attributes?.stop ?? []).map(String));

    expect(pythonIcon?.svg).toContain('<linearGradient');
    expect(pythonIcon?.svg).toContain('<stop');
    expect(phpIcon?.svg).toContain('<radialGradient');
    expect(schema.clobber?.includes('id')).toBe(false);
    expect(tagNames.has('defs')).toBe(true);
    expect(tagNames.has('linearGradient')).toBe(true);
    expect(tagNames.has('radialGradient')).toBe(true);
    expect(tagNames.has('stop')).toBe(true);
    expect(linearGradientAttrs.has('x1')).toBe(true);
    expect(linearGradientAttrs.has('x2')).toBe(true);
    expect(linearGradientAttrs.has('y1')).toBe(true);
    expect(linearGradientAttrs.has('y2')).toBe(true);
    expect(radialGradientAttrs.has('cx')).toBe(true);
    expect(radialGradientAttrs.has('cy')).toBe(true);
    expect(radialGradientAttrs.has('r')).toBe(true);
    expect(radialGradientAttrs.has('gradientTransform')).toBe(true);
    expect(radialGradientAttrs.has('gradientUnits')).toBe(true);
    expect(stopAttrs.has('offset')).toBe(true);
    expect(stopAttrs.has('stopColor') || stopAttrs.has('stop-color')).toBe(true);
  });
});
