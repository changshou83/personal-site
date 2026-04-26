import mermaid from 'mermaid';
import { getErrorElement, getRenderTarget, getSource, getTheme, getViewport } from './mermaid-dom';
import type { MermaidPanZoomController } from './mermaid-panzoom';

// 这里单独抽一个最小 Mermaid 接口，避免把整个 mermaid 包的复杂类型带进来。
type MermaidModule = {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, code: string) => Promise<{ svg: string }>;
};

// Mermaid render 需要唯一 id，这里做简单递增即可。
let renderSequence = 0;

const showError = (block: HTMLElement, error: unknown) => {
  const errorElement = getErrorElement(block);
  const renderTarget = getRenderTarget(block);
  const viewport = getViewport(block);
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown Mermaid error');

  block.dataset.mermaidRendered = 'false';
  if (renderTarget) renderTarget.innerHTML = '';
  // 失败态不再展示空的图表视口，只保留错误文本。
  if (viewport) viewport.hidden = true;

  if (!errorElement) return;

  errorElement.hidden = false;
  errorElement.textContent = `Mermaid 渲染失败：${message}`;
};

export const renderMermaidPreview = async (
  block: HTMLElement,
  controller: MermaidPanZoomController,
  options: { force?: boolean } = {}
) => {
  // Preview renders lazily. Once a block has rendered successfully, normal
  // view toggles reuse the existing SVG and only forced rerenders rebuild it.
  if (!options.force && block.dataset.mermaidRendered === 'true') return;

  const source = getSource(block);
  const renderTarget = getRenderTarget(block);
  const errorElement = getErrorElement(block);
  const viewport = getViewport(block);
  if (!source || !renderTarget) return;

  // 每次重新尝试 render 前，都先恢复“正常预览态”。
  if (viewport) viewport.hidden = false;
  if (errorElement) {
    errorElement.hidden = true;
    errorElement.textContent = '';
  }

  try {
    // Mermaid keeps process-wide config, so each render pass reasserts the
    // current theme before generating fresh SVG.
    (mermaid as MermaidModule).initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: getTheme(),
      fontFamily: 'inherit'
    });

    // Mermaid 返回的是完整 SVG 字符串，这里直接塞进 render target。
    const { svg } = await (mermaid as MermaidModule).render(`mermaid-preview-${++renderSequence}`, source);
    renderTarget.innerHTML = svg;
    block.dataset.mermaidRendered = 'true';

    // Theme changes rerender the SVG in place. If the user has already panned
    // or zoomed, preserve that transform instead of snapping back to fit.
    controller.onSvgRendered({ preserveCustomTransform: Boolean(options.force) });
  } catch (error) {
    showError(block, error);
  }
};
