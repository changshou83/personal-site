export type MermaidView = 'code' | 'preview';

// These selectors are the public runtime contract emitted by the Markdown
// pipeline. Keeping them centralized makes build-time/output changes easier
// to reason about.
const BLOCK_SELECTOR = '[data-mermaid-block="true"]';
const TOGGLE_SELECTOR = '[data-mermaid-preview-toggle]';
const FIT_SELECTOR = '[data-mermaid-fit]';
const ZOOM_OUT_SELECTOR = '[data-mermaid-zoom-out]';
const ZOOM_IN_SELECTOR = '[data-mermaid-zoom-in]';
const PRE_SELECTOR = 'pre';
const PREVIEW_SELECTOR = '[data-mermaid-preview]';
const VIEWPORT_SELECTOR = '[data-mermaid-viewport]';
const CONTROLS_SELECTOR = '.mermaid-preview__controls';
const RENDER_TARGET_SELECTOR = '[data-mermaid-render-target]';
const ERROR_SELECTOR = '[data-mermaid-error]';
const DEFAULT_PREVIEW_HEIGHT = 320;

// 两个图标字符串都放在 DOM 层管理，因为它们只服务于按钮显示，不属于渲染或交互控制逻辑。
const EYE_ICON = `
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>
`;

const CODE_ICON = `
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="m8 9-4 3 4 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="m16 9 4 3-4 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
    <path d="m14 4-4 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>
`;

// 通用 query helper，统一类型推断，避免每个文件自己再写 querySelector 包装。
export const query = <T extends Element>(root: ParentNode, selector: string) => root.querySelector<T>(selector);

// 所有 Mermaid block 的统一扫描入口。
export const getBlocks = (root: ParentNode = document) => Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR));

export const getToggleButton = (block: ParentNode) => query<HTMLButtonElement>(block, TOGGLE_SELECTOR);

export const getFitButton = (block: ParentNode) => query<HTMLButtonElement>(block, FIT_SELECTOR);

export const getZoomOutButton = (block: ParentNode) => query<HTMLButtonElement>(block, ZOOM_OUT_SELECTOR);

export const getZoomInButton = (block: ParentNode) => query<HTMLButtonElement>(block, ZOOM_IN_SELECTOR);

export const getPre = (block: ParentNode) => query<HTMLElement>(block, PRE_SELECTOR);

export const getPreview = (block: ParentNode) => query<HTMLElement>(block, PREVIEW_SELECTOR);

export const getViewport = (block: ParentNode) => query<HTMLElement>(block, VIEWPORT_SELECTOR);

export const getControls = (block: ParentNode) => query<HTMLElement>(block, CONTROLS_SELECTOR);

export const getRenderTarget = (block: ParentNode) => query<HTMLElement>(block, RENDER_TARGET_SELECTOR);

export const getErrorElement = (block: ParentNode) => query<HTMLElement>(block, ERROR_SELECTOR);

// Mermaid 主题只跟站点 data-theme 对齐，运行时统一映射成 light/default 这两个结果。
export const getTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default';

// 原始源码来自构建期写入的 data-mermaid-source。
export const getSource = (block: HTMLElement) => block.dataset.mermaidSource ?? '';

// 当前视图状态也完全来自 data-mermaid-view，避免再维护一份额外运行时状态。
export const getView = (block: HTMLElement): MermaidView => block.dataset.mermaidView === 'preview' ? 'preview' : 'code';

export const isControlTarget = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest(CONTROLS_SELECTOR));

const setPreviewControlState = (block: HTMLElement, visible: boolean) => {
  const fit = getFitButton(block);
  const zoomOut = getZoomOutButton(block);
  const zoomIn = getZoomInButton(block);

  if (fit) fit.hidden = !visible;
  if (zoomOut) zoomOut.hidden = !visible;
  if (zoomIn) zoomIn.hidden = !visible;
};

export const syncView = (block: HTMLElement, view: MermaidView) => {
  const pre = getPre(block);
  const preview = getPreview(block);
  const toggle = getToggleButton(block);

  // Code and preview share the same toolbar shell. Toggling only swaps the
  // visible panel and updates the single action button/icon in place.
  block.dataset.mermaidView = view;
  if (pre) pre.hidden = view !== 'code';
  if (preview) preview.hidden = view !== 'preview';
  setPreviewControlState(block, view === 'preview');

  if (!toggle) return;

  const active = view === 'preview';
  toggle.setAttribute('aria-pressed', String(active));
  toggle.setAttribute('aria-label', active ? '退出预览' : '预览');
  toggle.title = active ? '退出预览' : '预览';
  // 按钮本身只有一个，通过替换 innerHTML 完成“眼睛 / 代码”图标切换。
  toggle.innerHTML = active ? CODE_ICON : EYE_ICON;
};

const measureCodeHeight = (block: HTMLElement): number => {
  const pre = getPre(block);
  if (!pre) return DEFAULT_PREVIEW_HEIGHT;

  // 如果代码区当前可见，直接测真实高度即可。
  if (!pre.hidden) {
    return Math.max(1, Math.ceil(pre.getBoundingClientRect().height)) || DEFAULT_PREVIEW_HEIGHT;
  }

  // 如果代码区隐藏，则克隆一个不可见但可测量的副本。
  // 这样预览区仍能和“源码本该占据的高度”保持一致。
  const clone = pre.cloneNode(true);
  if (!(clone instanceof HTMLElement)) return DEFAULT_PREVIEW_HEIGHT;

  // The preview should occupy the same vertical space as the code view,
  // so we temporarily measure a visible clone instead of using a fixed height.
  clone.hidden = false;
  clone.removeAttribute('hidden');
  clone.style.position = 'absolute';
  clone.style.visibility = 'hidden';
  clone.style.pointerEvents = 'none';
  clone.style.inset = '0 auto auto 0';
  clone.style.width = `${pre.clientWidth || block.clientWidth}px`;
  clone.style.maxWidth = 'none';
  clone.style.height = 'auto';
  clone.style.overflow = 'visible';

  block.append(clone);
  const height = Math.max(1, Math.ceil(clone.getBoundingClientRect().height)) || DEFAULT_PREVIEW_HEIGHT;
  clone.remove();
  return height;
};

export const syncPreviewHeight = (block: HTMLElement) => {
  // Storing the measured height in a CSS variable lets layout stay in CSS
  // while keeping the measurement logic in one place.
  block.style.setProperty('--mermaid-preview-height', `${measureCodeHeight(block)}px`);
};
