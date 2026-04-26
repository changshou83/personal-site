import { getBlocks, getTheme, getToggleButton, getView, syncPreviewHeight, syncView } from './mermaid-dom';
import { createMermaidPanZoomController } from './mermaid-panzoom';
import { renderMermaidPreview } from './mermaid-renderer';

// 这些观察器是页面级单例，不应该跟每个 block 重复绑定。
let themeObserverAttached = false;
let lastTheme = '';
let resizeObserverAttached = false;

const bindBlock = (block: HTMLElement) => {
  // initMarkdownEnhancers 可能在不同页面/容器重复调用，这里必须幂等。
  if (block.dataset.mermaidEnhanced === 'true') return;

  const controller = createMermaidPanZoomController(block);
  const toggle = getToggleButton(block);

  // pan / zoom 的底层事件先绑定好，再挂视图切换。
  controller.bind();

  toggle?.addEventListener('click', async () => {
    if (getView(block) === 'code') {
      // Preview rendering is lazy on first open. After the first successful
      // render, the renderer short-circuits repeated toggles unless a forced
      // rerender is requested by theme changes.
      syncView(block, 'preview');
      syncPreviewHeight(block);
      await renderMermaidPreview(block, controller);
      return;
    }

    // 从图表切回代码时，顺手结束可能残留的拖拽态，避免 cursor / pointer 状态泄漏。
    controller.stopDragging();
    syncView(block, 'code');
  });

  block.dataset.mermaidEnhanced = 'true';
  // 初次绑定时先同步一次高度，保证默认图表态不会沿用旧尺寸。
  syncPreviewHeight(block);
};

const rerenderRenderedBlocks = async () => {
  // 只重绘已经实际渲染过的 block，避免主题切换时把未展开过的图表也提前 render。
  const blocks = getBlocks().filter((block) => block.dataset.mermaidRendered === 'true');
  await Promise.all(
    blocks.map((block) => renderMermaidPreview(block, createMermaidPanZoomController(block), { force: true }))
  );
};

const ensureThemeObserver = () => {
  if (themeObserverAttached || typeof MutationObserver === 'undefined') return;

  lastTheme = getTheme();
  new MutationObserver(() => {
    const nextTheme = getTheme();
    // data-theme 没实际变化时，不需要重绘 SVG。
    if (nextTheme === lastTheme) return;
    lastTheme = nextTheme;
    void rerenderRenderedBlocks();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  themeObserverAttached = true;
};

const ensureResizeObserver = () => {
  if (resizeObserverAttached || typeof window === 'undefined') return;

  window.addEventListener('resize', () => {
    for (const block of getBlocks()) {
      // Preview height follows the code block height, so width changes on
      // resize need to remeasure before pan/zoom decides whether to refit.
      syncPreviewHeight(block);
      createMermaidPanZoomController(block).onResize();
    }
  });

  resizeObserverAttached = true;
};

export const createMermaidMarkdownEnhancer = () => ({
  name: 'mermaid',
  async init(container: ParentNode) {
    // enhancer 只在当前容器内扫描，方便文章页、memo 页、bits 页分别调用。
    const blocks = getBlocks(container);
    if (!blocks.length) return;

    // Observers are global to the page. Individual blocks are still bound
    // per-container so repeated enhancer initialization stays idempotent.
    ensureThemeObserver();
    ensureResizeObserver();

    blocks.forEach((block) => {
      bindBlock(block);
      // syncView 会把默认 preview/code 状态同步到 DOM，包括按钮和 hidden 状态。
      syncPreviewHeight(block);
      syncView(block, getView(block));
    });

    await Promise.all(
      blocks
        .filter((block) => getView(block) === 'preview')
        // 默认是 preview 态，因此首次 init 之后会立即渲染首屏可见图表。
        .map((block) => renderMermaidPreview(block, createMermaidPanZoomController(block)))
    );
  }
});
