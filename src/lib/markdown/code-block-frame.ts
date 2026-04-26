// 这几个类型是“最小 HAST 子集”，只覆盖当前代码块包装器实际会生成的节点。
// 这里不直接依赖完整 hast 类型，是为了让构建期工具函数保持轻量。
type HastTextNode = {
  type: 'text';
  value: string;
};

type HastRawNode = {
  type: 'raw';
  value: string;
};

export type HastElement = {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
};

export type HastNode = HastTextNode | HastRawNode | HastElement;

// toolbar 配置项：面向“已经确定要包成 code-block 的内容”。
type ToolbarOptions = {
  langLabel: string;
  iconSvg?: string | null;
  lineCount: number;
  extraActions?: HastElement[];
  extraProperties?: Record<string, unknown>;
};

// code-block wrapper 配置项：普通代码块和 Mermaid 都走这套共享骨架。
type CodeBlockWrapperOptions = {
  langLabel: string;
  normalizedLang: string;
  lineCount: number;
  preNode: HastElement;
  iconSvg?: string | null;
  extraActions?: HastElement[];
  extraChildren?: HastElement[];
  extraProperties?: Record<string, unknown>;
  toolbarProperties?: Record<string, unknown>;
};

// 文本节点 helper，避免反复手写 { type: 'text', value }。
const createText = (value: string): HastTextNode => ({ type: 'text', value });

// SVG 节点 helper，用于构建 toolbar 内联图标。
const createSvgElement = (
  properties: Record<string, unknown>,
  children: HastElement[] = []
): HastElement => ({
  type: 'element',
  tagName: 'svg',
  properties,
  children
});

// 默认复制图标。运行期会根据 data-state 在 copy / check 两个图标间切换显示。
const createCopyIcon = (): HastElement => createSvgElement(
  {
    className: ['icon-copy'],
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  },
  [
    {
      type: 'element',
      tagName: 'rect',
      properties: { width: 14, height: 14, x: 8, y: 8, rx: 2, ry: 2 },
      children: []
    },
    {
      type: 'element',
      tagName: 'path',
      properties: { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' },
      children: []
    }
  ]
);

// 复制成功后的对勾图标。
const createCheckIcon = (): HastElement => createSvgElement(
  {
    className: ['icon-check'],
    viewBox: '0 0 24 24',
    'aria-hidden': 'true'
  },
  [
    {
      type: 'element',
      tagName: 'path',
      properties: {
        d: 'M5 13l4 4L19 7',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '1.8',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      },
      children: []
    }
  ]
);

export const createToolbar = ({
  langLabel,
  iconSvg,
  lineCount,
  extraActions = [],
  extraProperties = {}
}: ToolbarOptions): HastElement => {
  // 普通代码块和 Mermaid 都沿用同一套元信息结构：
  // 语言标签 / UTF-8 / 行数 / 复制按钮 / 额外操作按钮。
  const lineText = lineCount === 1 ? '1 Line' : `${lineCount} Lines`;
  const langChildren: HastNode[] = [];

  // 语言图标是可选项，因为 Mermaid 当前没有走语言图标系统。
  if (iconSvg) {
    langChildren.push({ type: 'raw', value: iconSvg });
  }

  langChildren.push({
    type: 'element',
    tagName: 'span',
    properties: {},
    children: [createText(langLabel)]
  });

  return {
    type: 'element',
    tagName: 'div',
    // extraProperties 主要给特殊场景扩展 toolbar 属性，
    // 比如后续若要挂额外 data-*，不必再复制整套结构。
    properties: { className: ['code-toolbar'], ...extraProperties },
    children: [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['code-lang'] },
        children: langChildren
      },
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-meta'] },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['code-info'] },
            children: [createText('UTF-8')]
          },
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['code-separator'] },
            children: [createText('|')]
          },
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['code-info'] },
            children: [createText(lineText)]
          },
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['code-separator'] },
            children: [createText('|')]
          },
          {
            type: 'element',
            tagName: 'button',
            properties: {
              className: ['code-copy'],
              // 构建期先输出 disabled，运行期增强脚本再激活复制能力。
              type: 'button',
              disabled: true,
              'aria-label': '复制代码',
              title: '复制代码',
              'data-state': 'idle'
            },
            children: [createCopyIcon(), createCheckIcon()]
          },
          ...extraActions
        ]
      }
    ]
  };
};

export const createCodeBlockWrapper = ({
  langLabel,
  normalizedLang,
  lineCount,
  preNode,
  iconSvg = null,
  extraActions = [],
  extraChildren = [],
  extraProperties = {},
  toolbarProperties = {}
}: CodeBlockWrapperOptions): HastElement => ({
  type: 'element',
  tagName: 'div',
  properties: {
    // 统一 code-block 外壳，普通代码块和 Mermaid 都保持同一 DOM 语义。
    className: ['code-block'],
    'data-lang': normalizedLang,
    'data-lines': String(lineCount),
    ...extraProperties
  },
  children: [
    // toolbar 永远在最前面，后面跟原始 pre，再跟可选扩展面板（如 Mermaid preview）。
    createToolbar({ langLabel, iconSvg, lineCount, extraActions, extraProperties: toolbarProperties }),
    preNode,
    ...extraChildren
  ]
});
