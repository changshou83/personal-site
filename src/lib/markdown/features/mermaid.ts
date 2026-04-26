import { visit } from 'unist-util-visit';
import type { Node } from 'unist';
import { createCodeBlockWrapper, type HastElement, type HastNode } from '../code-block-frame';

// Markdown feature 只关心两件事：
// 1. 在构建期识别 ```mermaid 代码块
// 2. 把它改写成运行期脚本能够稳定识别的 DOM 契约
type MarkdownFeature = {
  name: string;
  rehypePlugins?: Array<() => (tree: unknown) => void>;
  sanitizeAttributes?: Record<string, string[]>;
  syntaxHighlight?: {
    excludeLangs?: string[];
  };
};

type ParentNode = {
  children: unknown[];
};

// HAST 树里会混入很多非 element 节点，这里先做最基础的对象收窄。
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// 只认 element 节点，必要时再附带 tagName 判断。
const isElement = (node: unknown, tagName?: string): node is HastElement => {
  if (!isRecord(node) || node.type !== 'element' || typeof node.tagName !== 'string') {
    return false;
  }

  return tagName ? node.tagName === tagName : true;
};

// HAST 属性在不同阶段可能是 kebab-case，也可能已经被转成 camelCase，
// 所以这里统一做一次兼容读取。
const getProperty = (node: unknown, key: string): unknown => {
  if (!isElement(node)) return null;

  const props = node.properties ?? {};
  if (props[key] != null) return props[key];

  const camelKey = key.replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase());
  return props[camelKey] ?? null;
};

// className 既可能是数组，也可能是字符串，统一标准化成字符串数组。
const getClassList = (node: unknown): string[] => {
  const value = getProperty(node, 'className');
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  return [];
};

// 从当前节点递归抽取纯文本内容，用于拿到 Mermaid 原始源码。
const getText = (node: unknown): string => {
  if (!isRecord(node)) return '';
  if (node.type === 'text') return typeof node.value === 'string' ? node.value : '';
  if (Array.isArray(node.children)) return node.children.map(getText).join('');
  return '';
};

// Mermaid 语言标记可能来自 data-lang，也可能来自 language-mermaid class。
// 这里统一识别，避免依赖某一种上游输出结构。
const getCodeLang = (preNode: HastElement, codeNode: HastElement): string => {
  for (const node of [codeNode, preNode]) {
    const dataLang = getProperty(node, 'data-lang') || getProperty(node, 'data-language');
    if (typeof dataLang === 'string' && dataLang.trim()) return dataLang.trim().toLowerCase();

    const languageClass = getClassList(node).find((name) => name.startsWith('language-'));
    if (languageClass) return languageClass.replace(/^language-/, '').toLowerCase();
  }

  return '';
};

// 代码块行数会显示在 toolbar 元信息里，所以这里和普通代码块保持一致。
const countLines = (source: string): number => {
  if (!source) return 0;

  const parts = source.split('\n');
  if (parts.length > 1 && parts.at(-1) === '') return Math.max(1, parts.length - 1);
  return Math.max(1, parts.length);
};

// 构建期统一用 HAST element 工具函数拼装节点，避免手写对象噪音太大。
const createElement = (
  tagName: string,
  properties: Record<string, unknown> = {},
  children: HastNode[] = []
): HastElement => ({
  type: 'element',
  tagName,
  properties,
  children
});

// 所有 toolbar 图标都在构建期内联成 SVG，避免运行期再生成按钮图标 DOM。
const createSvgElement = (
  properties: Record<string, unknown>,
  children: HastElement[] = []
): HastElement => ({
  type: 'element',
  tagName: 'svg',
  properties,
  children
});

// 统一路径样式，保持几种按钮图标的视觉一致。
const createPath = (d: string): HastElement => createElement('path', {
  d,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.8',
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
});

// 图表态下右上角主切换按钮显示“代码”图标。
const createCodeIcon = (): HastElement => createSvgElement(
  {
    viewBox: '0 0 24 24',
    width: 16,
    height: 16,
    'aria-hidden': 'true'
  },
  [
    createPath('m8 9-4 3 4 3'),
    createPath('m16 9 4 3-4 3'),
    createPath('m14 4-4 16')
  ]
);

// 图表区域内的“缩小”按钮。
const createZoomOutIcon = (): HastElement => createSvgElement(
  {
    viewBox: '0 0 24 24',
    width: 16,
    height: 16,
    'aria-hidden': 'true'
  },
  [
    createPath('M5 12h14')
  ]
);

// 图表区域内的“放大”按钮。
const createZoomInIcon = (): HastElement => createSvgElement(
  {
    viewBox: '0 0 24 24',
    width: 16,
    height: 16,
    'aria-hidden': 'true'
  },
  [
    createPath('M5 12h14'),
    createPath('M12 5v14')
  ]
);

// 图表区域内的“适应页面”按钮。
const createFitIcon = (): HastElement => createSvgElement(
  {
    viewBox: '0 0 24 24',
    width: 16,
    height: 16,
    'aria-hidden': 'true'
  },
  [
    createPath('M8 4H4v4'),
    createPath('M16 4h4v4'),
    createPath('M20 16v4h-4'),
    createPath('M4 16v4h4')
  ]
);

// 统一换行符，顺便去掉末尾多余空行，避免数据属性里带出不必要差异。
const normalizeSource = (value: string): string => value.replace(/\r\n?/g, '\n').replace(/\n$/, '');

const wrapMermaidPre = (preNode: HastElement, source: string): HastElement => {
  const lineCount = countLines(source);

  // Preserve the original source in the hidden <pre> so copy behavior still
  // works like a normal code block. Preview rendering is an extra panel layered
  // onto the same code-block shell rather than a separate rendering system.
  preNode.properties = {
    ...(preNode.properties ?? {}),
    'data-lang': 'mermaid',
    'data-lines': String(lineCount),
    hidden: true
  };

  // Mermaid 预览仍然包在普通 code-block 外壳里，这样：
  // 1. 复制按钮、语言标签、工具栏风格都能直接复用
  // 2. Mermaid 不会变成一套完全独立的正文组件
  return createCodeBlockWrapper({
    langLabel: 'MERMAID',
    normalizedLang: 'mermaid',
    lineCount,
    preNode,
    extraActions: [
      createElement(
        'button',
        {
          className: ['code-action'],
          type: 'button',
          // 这个按钮在运行期会在“预览 / 代码”两种状态之间切换图标和 aria 文案。
          'data-mermaid-preview-toggle': 'true',
          'aria-pressed': 'true',
          'aria-label': '退出预览',
          title: '退出预览'
        },
        [createCodeIcon()]
      )
    ],
    extraChildren: [
      createElement(
        'div',
        {
          className: ['code-preview', 'mermaid-preview'],
          // preview 容器和原始 pre 共存，通过 hidden 切换可见性。
          'data-mermaid-preview': 'true'
        },
        [
          createElement(
            'div',
            {
              className: ['mermaid-preview__viewport'],
              // viewport 是真正的图表可视区域，pan / zoom 都绑定在这里。
              'data-mermaid-viewport': 'true'
            },
            [
              createElement(
                'div',
                {
                  // controls 放在 viewport 内部，运行期会显式阻止它的点击进入拖拽逻辑。
                  className: ['mermaid-preview__controls']
                },
                [
                  createElement(
                    'button',
                    {
                      className: ['code-action'],
                      type: 'button',
                      'data-mermaid-fit': 'true',
                      'aria-label': '适应页面',
                      title: '适应页面'
                    },
                    [createFitIcon()]
                  ),
                  createElement(
                    'button',
                    {
                      className: ['code-action'],
                      type: 'button',
                      'data-mermaid-zoom-out': 'true',
                      'aria-label': '缩小',
                      title: '缩小'
                    },
                    [createZoomOutIcon()]
                  ),
                  createElement(
                    'button',
                    {
                      className: ['code-action'],
                      type: 'button',
                      'data-mermaid-zoom-in': 'true',
                      'aria-label': '放大',
                      title: '放大'
                    },
                    [createZoomInIcon()]
                  )
                ]
              ),
              createElement('div', {
                className: ['mermaid-preview__render'],
                // render target 只负责挂载 Mermaid 输出的 SVG，不承担控制逻辑。
                'data-mermaid-render-target': 'true'
              })
            ]
          ),
          createElement(
            'div',
            {
              className: ['mermaid-preview__error'],
              // 错误区默认隐藏，渲染失败时会替换 viewport 成为唯一展示区。
              'data-mermaid-error': 'true',
              hidden: true
            },
            []
          )
        ]
      )
    ],
    extraProperties: {
      // 这些 data-* 是 Mermaid 运行期的最小契约：
      // block 标记、原始源码、当前视图。
      'data-mermaid-block': 'true',
      'data-mermaid-source': source,
      'data-mermaid-view': 'preview'
    }
  });
};

export const rehypeMermaidBlocks = (): ((tree: unknown) => void) => {
  return (tree) => {
    visit(tree as Node, 'element', (node: unknown, index: number | undefined, parent: ParentNode | undefined) => {
      if (index == null || !parent || !isElement(node, 'pre') || !Array.isArray(node.children)) return;

      const codeNode = node.children.find((child) => isElement(child, 'code'));
      if (!codeNode) return;
      if (getCodeLang(node, codeNode) !== 'mermaid') return;

      // 命中 mermaid fenced block 后，直接用自定义 code-block 结构替换原来的 <pre>。
      parent.children[index] = wrapMermaidPre(node, normalizeSource(getText(codeNode)));
    });
  };
};

export const createMermaidMarkdownFeature = (): MarkdownFeature => ({
  name: 'mermaid',
  // Mermaid blocks bypass Shiki and are rewritten into a stable DOM contract
  // here, so the browser-side enhancer can attach behavior without depending
  // on Shiki's internal output structure.
  rehypePlugins: [rehypeMermaidBlocks],
  sanitizeAttributes: {
    '*': [
      // sanitize 白名单必须完整覆盖运行期依赖的 data-*，
      // 否则构建阶段会把这些属性洗掉，前端脚本就找不到对应节点。
      'dataMermaidBlock',
      'data-mermaid-block',
      'dataMermaidSource',
      'data-mermaid-source',
      'dataMermaidView',
      'data-mermaid-view',
      'dataMermaidPreview',
      'data-mermaid-preview',
      'dataMermaidViewport',
      'data-mermaid-viewport',
      'dataMermaidRenderTarget',
      'data-mermaid-render-target',
      'dataMermaidError',
      'data-mermaid-error',
      'dataMermaidPreviewToggle',
      'data-mermaid-preview-toggle',
      'dataMermaidZoomOut',
      'data-mermaid-zoom-out',
      'dataMermaidZoomIn',
      'data-mermaid-zoom-in',
      'dataMermaidFit',
      'data-mermaid-fit'
    ]
  },
  syntaxHighlight: {
    excludeLangs: ['mermaid']
  }
});
