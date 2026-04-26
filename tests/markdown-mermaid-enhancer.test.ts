import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn()
}));

vi.mock('mermaid', () => ({
  default: mermaidMock
}));

const PREVIEW_SVG = '<svg viewBox="0 0 400 200"></svg>';

const createBlockMarkup = (source = 'flowchart LR\nA-->B') => `
  <div class="code-block" data-mermaid-block="true" data-mermaid-source="${source}" data-mermaid-view="preview">
    <div class="code-toolbar">
      <span class="code-lang"><span>MERMAID</span></span>
      <div class="code-meta">
        <button
          class="code-action"
          type="button"
          data-mermaid-preview-toggle="true"
          aria-pressed="true"
          aria-label="退出预览"
          title="退出预览"
        ></button>
      </div>
    </div>
    <pre data-lang="mermaid" data-lines="2" hidden><code>${source}</code></pre>
    <div class="code-preview mermaid-preview" data-mermaid-preview="true">
      <div class="mermaid-preview__viewport" data-mermaid-viewport="true">
        <div class="mermaid-preview__controls">
          <button class="code-action" type="button" data-mermaid-fit="true" aria-label="适应页面" title="适应页面"></button>
          <button class="code-action" type="button" data-mermaid-zoom-out="true" aria-label="缩小" title="缩小"></button>
          <button class="code-action" type="button" data-mermaid-zoom-in="true" aria-label="放大" title="放大"></button>
        </div>
        <div class="mermaid-preview__render" data-mermaid-render-target="true"></div>
      </div>
      <div class="mermaid-preview__error" data-mermaid-error="true" hidden></div>
    </div>
  </div>
`;

const setBoxMetrics = (element: HTMLElement, width: number, height: number) => {
  Object.defineProperty(element, 'clientWidth', {
    configurable: true,
    get: () => width
  });
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    get: () => height
  });
};

describe('mermaid markdown enhancer', () => {
  let dom: JSDOM;
  let cleanupGlobals: Array<() => void> = [];

  beforeEach(() => {
    dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost/'
    });

    const globalAssignments = {
      window: dom.window,
      document: dom.window.document,
      MutationObserver: dom.window.MutationObserver,
      HTMLElement: dom.window.HTMLElement,
      Element: dom.window.Element,
      SVGSVGElement: dom.window.SVGSVGElement,
      Event: dom.window.Event,
      MouseEvent: dom.window.MouseEvent,
      PointerEvent: dom.window.PointerEvent ?? dom.window.MouseEvent
    } as const;

    cleanupGlobals = Object.entries(globalAssignments).map(([key, value]) => {
      const previous = (globalThis as Record<string, unknown>)[key];
      (globalThis as Record<string, unknown>)[key] = value;

      return () => {
        if (previous === undefined) {
          delete (globalThis as Record<string, unknown>)[key];
          return;
        }

        (globalThis as Record<string, unknown>)[key] = previous;
      };
    });

    Object.defineProperty(dom.window.HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value() {
        if (this.tagName === 'PRE') {
          return {
            width: 720,
            height: 208,
            top: 0,
            right: 720,
            bottom: 208,
            left: 0,
            x: 0,
            y: 0,
            toJSON() {
              return this;
            }
          };
        }

        return {
          width: 0,
          height: 0,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          x: 0,
          y: 0,
          toJSON() {
            return this;
          }
        };
      }
    });

    vi.resetModules();
    vi.clearAllMocks();
    mermaidMock.render.mockResolvedValue({ svg: PREVIEW_SVG });
  });

  afterEach(() => {
    cleanupGlobals.reverse().forEach((restore) => restore());
    dom.window.close();
  });

  it('renders preview by default and keeps preview height aligned with the code block height', async () => {
    dom.window.document.body.innerHTML = createBlockMarkup();

    const block = dom.window.document.querySelector<HTMLElement>('[data-mermaid-block="true"]');
    const pre = block?.querySelector<HTMLElement>('pre');
    const preview = block?.querySelector<HTMLElement>('[data-mermaid-preview]');
    const viewport = block?.querySelector<HTMLElement>('[data-mermaid-viewport]');
    const toggle = block?.querySelector<HTMLButtonElement>('[data-mermaid-preview-toggle]');

    expect(block && pre && preview && viewport && toggle).toBeTruthy();
    if (!block || !pre || !preview || !viewport || !toggle) return;

    setBoxMetrics(block, 720, 260);
    setBoxMetrics(pre, 720, 208);
    setBoxMetrics(viewport, 720, 208);

    const { initMarkdownEnhancers } = await import('../src/scripts/markdown-enhancers');
    await initMarkdownEnhancers(dom.window.document);

    expect(mermaidMock.initialize).toHaveBeenCalledTimes(1);
    expect(mermaidMock.render).toHaveBeenCalledTimes(1);
    expect(pre.hidden).toBe(true);
    expect(preview.hidden).toBe(false);
    expect(viewport.hidden).toBe(false);
    expect(toggle.getAttribute('aria-label')).toBe('退出预览');
    expect(block.style.getPropertyValue('--mermaid-preview-height')).toBe('208px');
    expect(block.querySelector('[data-mermaid-render-target]')?.innerHTML).toContain('<svg');
  });

  it('toggles between preview and code without rerendering an already rendered diagram', async () => {
    dom.window.document.body.innerHTML = createBlockMarkup();

    const block = dom.window.document.querySelector<HTMLElement>('[data-mermaid-block="true"]');
    const pre = block?.querySelector<HTMLElement>('pre');
    const preview = block?.querySelector<HTMLElement>('[data-mermaid-preview]');
    const viewport = block?.querySelector<HTMLElement>('[data-mermaid-viewport]');
    const toggle = block?.querySelector<HTMLButtonElement>('[data-mermaid-preview-toggle]');

    expect(block && pre && preview && viewport && toggle).toBeTruthy();
    if (!block || !pre || !preview || !viewport || !toggle) return;

    setBoxMetrics(block, 720, 260);
    setBoxMetrics(pre, 720, 208);
    setBoxMetrics(viewport, 720, 208);

    const { initMarkdownEnhancers } = await import('../src/scripts/markdown-enhancers');
    await initMarkdownEnhancers(dom.window.document);

    toggle.click();
    expect(pre.hidden).toBe(false);
    expect(preview.hidden).toBe(true);
    expect(toggle.getAttribute('aria-label')).toBe('预览');

    toggle.click();
    await Promise.resolve();

    expect(pre.hidden).toBe(true);
    expect(preview.hidden).toBe(false);
    expect(toggle.getAttribute('aria-label')).toBe('退出预览');
    expect(mermaidMock.render).toHaveBeenCalledTimes(1);
  });

  it('shows an inline error message when mermaid rendering fails', async () => {
    mermaidMock.render.mockRejectedValueOnce(new Error('Broken diagram'));
    dom.window.document.body.innerHTML = createBlockMarkup('flowchart TD\nA[');

    const block = dom.window.document.querySelector<HTMLElement>('[data-mermaid-block="true"]');
    const pre = block?.querySelector<HTMLElement>('pre');
    const viewport = block?.querySelector<HTMLElement>('[data-mermaid-viewport]');
    const error = block?.querySelector<HTMLElement>('[data-mermaid-error]');

    expect(block && pre && viewport && error).toBeTruthy();
    if (!block || !pre || !viewport || !error) return;

    setBoxMetrics(block, 720, 260);
    setBoxMetrics(pre, 720, 208);
    setBoxMetrics(viewport, 720, 208);

    const { initMarkdownEnhancers } = await import('../src/scripts/markdown-enhancers');
    await initMarkdownEnhancers(dom.window.document);

    expect(error.hidden).toBe(false);
    expect(viewport.hidden).toBe(true);
    expect(error.textContent).toContain('Mermaid 渲染失败：Broken diagram');
  });
});
