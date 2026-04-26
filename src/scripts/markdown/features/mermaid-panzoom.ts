import {
  getControls,
  getFitButton,
  getRenderTarget,
  getView,
  getViewport,
  getZoomInButton,
  getZoomOutButton,
  isControlTarget,
  query
} from './mermaid-dom';

// 这是每个 Mermaid block 独有的交互状态。
// 它只描述图表的平移缩放和拖拽过程，不处理视图切换或 Mermaid 渲染本身。
type MermaidPanZoomState = {
  scale: number;
  x: number;
  y: number;
  baseWidth: number;
  baseHeight: number;
  hasCustomTransform: boolean;
  dragging: boolean;
  pointerId: number | null;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
};

export type MermaidPanZoomController = {
  bind: () => void;
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  stopDragging: () => void;
  onSvgRendered: (options?: { preserveCustomTransform?: boolean }) => void;
  onResize: () => void;
};

const SVG_SELECTOR = 'svg';
// 缩放下限，避免图表被缩到完全不可读。
const MIN_SCALE = 0.5;
// 手动缩放上限，只约束按钮缩放，不约束 fit 自动计算出的比例。
const MAX_MANUAL_SCALE = 3;
// 每次点击放大/缩小时的比例步长。
const ZOOM_STEP = 0.2;
const controllers = new WeakMap<HTMLElement, MermaidPanZoomController>();

const createInitialState = (): MermaidPanZoomState => ({
  scale: 1,
  x: 0,
  y: 0,
  baseWidth: 0,
  baseHeight: 0,
  hasCustomTransform: false,
  dragging: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  baseX: 0,
  baseY: 0
});

// 手动按钮缩放统一走这个 clamp，避免超出预期范围。
const clampManualScale = (value: number) => Math.min(MAX_MANUAL_SCALE, Math.max(MIN_SCALE, value));

export const createMermaidPanZoomController = (block: HTMLElement): MermaidPanZoomController => {
  const existing = controllers.get(block);
  if (existing) return existing;

  // Each Mermaid block gets one controller instance so repeated enhancer
  // init/rerender passes reuse the same interaction state.
  const state = createInitialState();
  let bound = false;

  const applyTransform = () => {
    const renderTarget = getRenderTarget(block);
    if (!renderTarget) return;

    // 平移仍然走 CSS transform，因为它不影响图表清晰度。
    renderTarget.style.transform = `translate(${state.x}px, ${state.y}px)`;

    const svg = query<SVGSVGElement>(renderTarget, SVG_SELECTOR);
    if (!svg || state.baseWidth <= 0 || state.baseHeight <= 0) return;

    // Scale the SVG by its own dimensions instead of a CSS scale transform
    // so zooming stays crisp even at large sizes.
    svg.style.width = `${state.baseWidth * state.scale}px`;
    svg.style.height = `${state.baseHeight * state.scale}px`;
  };

  const updateBaseSvgSize = () => {
    const renderTarget = getRenderTarget(block);
    if (!renderTarget) return;

    const svg = query<SVGSVGElement>(renderTarget, SVG_SELECTOR);
    if (!svg) return;

    // 优先用 viewBox 作为图表天然尺寸。
    // 对矢量图来说，这比测量渲染后的像素尺寸更稳定。
    const viewBox = svg.getAttribute('viewBox')?.trim().split(/\s+/).map(Number) ?? [];
    const viewBoxWidth = viewBox[2] ?? 0;
    const viewBoxHeight = viewBox[3] ?? 0;

    if (Number.isFinite(viewBoxWidth) && viewBoxWidth > 0 && Number.isFinite(viewBoxHeight) && viewBoxHeight > 0) {
      state.baseWidth = viewBoxWidth;
      state.baseHeight = viewBoxHeight;
      return;
    }

    // 极少数情况下如果拿不到可用 viewBox，就退回到当前实际渲染尺寸。
    const rect = svg.getBoundingClientRect();
    state.baseWidth = rect.width || state.baseWidth || 1;
    state.baseHeight = rect.height || state.baseHeight || 1;
  };

  const updateViewportCursor = () => {
    const viewport = getViewport(block);
    if (!viewport) return;

    viewport.dataset.dragging = state.dragging ? 'true' : 'false';
  };

  const stopDragging = () => {
    state.dragging = false;
    state.pointerId = null;
    updateViewportCursor();
  };

  const fit = () => {
    const viewport = getViewport(block);
    if (!viewport || state.baseWidth <= 0 || state.baseHeight <= 0) return;

    // 预留少量内边距，避免图表贴边。
    const padding = 16;
    const availableWidth = Math.max(1, viewport.clientWidth - padding * 2);
    const availableHeight = Math.max(1, viewport.clientHeight - padding * 2);
    const nextScale = Math.max(MIN_SCALE, Math.min(availableWidth / state.baseWidth, availableHeight / state.baseHeight));

    // fit 会重置为“自动适配”状态，因此 hasCustomTransform 需要清掉。
    state.scale = nextScale;
    state.x = (viewport.clientWidth - state.baseWidth * state.scale) / 2;
    state.y = (viewport.clientHeight - state.baseHeight * state.scale) / 2;
    state.hasCustomTransform = false;
    applyTransform();
  };

  const zoomAtViewportCenter = (nextScale: number) => {
    const viewport = getViewport(block);
    if (!viewport) return;

    // 所有按钮缩放都以 viewport 中心为基准点，保证体验可预期。
    const clampedScale = clampManualScale(nextScale);
    if (clampedScale === state.scale) return;

    const centerX = viewport.clientWidth / 2;
    const centerY = viewport.clientHeight / 2;
    const factor = clampedScale / state.scale;

    state.x = centerX - (centerX - state.x) * factor;
    state.y = centerY - (centerY - state.y) * factor;
    state.scale = clampedScale;
    state.hasCustomTransform = true;
    applyTransform();
  };

  const zoomOut = () => {
    zoomAtViewportCenter(state.scale - ZOOM_STEP);
  };

  const zoomIn = () => {
    zoomAtViewportCenter(state.scale + ZOOM_STEP);
  };

  const onSvgRendered = ({ preserveCustomTransform = false }: { preserveCustomTransform?: boolean } = {}) => {
    updateBaseSvgSize();

    // Theme changes recreate the SVG markup. If the user has manually panned
    // or zoomed, keep that transform instead of snapping back to fit.
    if (preserveCustomTransform && state.hasCustomTransform) {
      applyTransform();
      return;
    }

    fit();
  };

  const onResize = () => {
    // 只有预览态才需要响应图表 resize，代码态不处理。
    if (getView(block) !== 'preview') return;

    // 如果用户没有手动改过变换，则窗口变化后重新 fit。
    // 否则保留当前平移缩放，只重新应用 transform。
    if (!state.hasCustomTransform) {
      fit();
      return;
    }

    applyTransform();
  };

  const bind = () => {
    if (bound) return;

    const fitButton = getFitButton(block);
    const zoomOutButton = getZoomOutButton(block);
    const zoomInButton = getZoomInButton(block);
    const viewport = getViewport(block);
    const controls = getControls(block);

    fitButton?.addEventListener('click', () => {
      fit();
    });

    zoomOutButton?.addEventListener('click', () => {
      zoomOut();
    });

    zoomInButton?.addEventListener('click', () => {
      zoomIn();
    });

    controls?.addEventListener('pointerdown', (event) => {
      // Controls live inside the draggable viewport, so their events must not
      // leak into the drag handlers.
      event.stopPropagation();
    });

    controls?.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    viewport?.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || getView(block) !== 'preview' || isControlTarget(event.target)) return;

      // Dragging stores the current transform baseline and applies deltas from
      // the pointer movement, rather than reading computed transforms back out.
      state.dragging = true;
      state.pointerId = event.pointerId;
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.baseX = state.x;
      state.baseY = state.y;
      state.hasCustomTransform = true;
      viewport.setPointerCapture(event.pointerId);
      updateViewportCursor();
      event.preventDefault();
    });

    viewport?.addEventListener('pointermove', (event) => {
      if (!state.dragging || state.pointerId !== event.pointerId) return;

      // 当前位移 = 起始位移 + 指针移动增量。
      state.x = state.baseX + (event.clientX - state.startX);
      state.y = state.baseY + (event.clientY - state.startY);
      applyTransform();
    });

    const stopDraggingFromEvent = (event: PointerEvent) => {
      if (!viewport || state.pointerId !== event.pointerId) return;

      // pointer capture 需要成对释放，否则后续指针事件可能异常。
      state.dragging = false;
      state.pointerId = null;
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
      updateViewportCursor();
    };

    viewport?.addEventListener('pointerup', stopDraggingFromEvent);
    viewport?.addEventListener('pointercancel', stopDraggingFromEvent);

    bound = true;
    updateViewportCursor();
  };

  // 对外暴露的是控制器接口，而不是内部 state，
  // 这样 Mermaid 入口层不需要知道缩放细节。
  const controller: MermaidPanZoomController = {
    bind,
    fit,
    zoomIn,
    zoomOut,
    stopDragging,
    onSvgRendered,
    onResize
  };

  controllers.set(block, controller);
  return controller;
};
