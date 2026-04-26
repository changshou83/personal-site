import remarkDirective from 'remark-directive';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkCallout from '../../plugins/remark-callout.mjs';
import shikiToolbar from '../../plugins/shiki-toolbar.mjs';
import { createMermaidMarkdownFeature } from './features/mermaid';

// 这一层是 Astro Markdown 配置的总装配点：
// 1. 统一注册 remark / rehype feature
// 2. 统一汇总 sanitize 白名单
// 3. 统一配置 Shiki 与代码块增强
type AstroMarkdownProcessorOptions = import('@astrojs/markdown-remark').AstroMarkdownProcessorOptions;
type SanitizeSchema = import('hast-util-sanitize').Schema;
type SanitizeAttributeList = string[];

// 每个 Markdown feature 都通过这组约定向主管线声明自己的能力。
type MarkdownFeature = {
  name: string;
  rehypePlugins?: AstroMarkdownProcessorOptions['rehypePlugins'];
  remarkPlugins?: AstroMarkdownProcessorOptions['remarkPlugins'];
  sanitizeAttributes?: Record<string, string[]>;
  syntaxHighlight?: {
    excludeLangs?: string[];
  };
};

// rehype-sanitize 的 schema 属性值可能混有非字符串定义，这里统一做字符串化，
// 方便后面做 merge 去重。
const getSchemaAttrs = (schema: SanitizeSchema, tagName: string): SanitizeAttributeList => {
  const attrs = schema.attributes?.[tagName];
  return Array.isArray(attrs) ? attrs.map((item) => String(item)) : [];
};

// 多个 feature 都可能往同一个 tag 或全局 '*' 注入属性白名单，这里集中去重。
const mergeAttrs = (...lists: SanitizeAttributeList[]): string[] =>
  Array.from(new Set(lists.flat().map((item) => String(item))));

// 目前只有 Mermaid 是通过这套新 feature 机制接进来的第一个能力。
// 以后新增 Markdown 扩展时，优先继续走这里，而不是散落到 astro.config。
const createMarkdownFeatures = (): MarkdownFeature[] => [
  createMermaidMarkdownFeature()
];

export const createMarkdownSanitizeSchema = (): SanitizeSchema => {
  const features = createMarkdownFeatures();
  // feature 自己声明的运行期 data-* 契约统一汇总到共享白名单里，
  // 这样具体 feature 不需要碰主 schema 的细节结构。
  const sharedFeatureAttrs = features.flatMap((feature) => feature.sanitizeAttributes?.['*'] ?? []);

  return {
    ...defaultSchema,
    tagNames: [
      // 默认 schema 不认识部分正文增强节点（如 figure / details / svg），
      // 这里按站点实际输出做增量扩展，而不是从零重写 schema。
      ...(defaultSchema.tagNames ?? []),
      'cite',
      'figure',
      'figcaption',
      'picture',
      'source',
      'summary',
      'details',
      'dialog',
      'button',
      'svg',
      'path',
      'rect'
    ],
    attributes: {
      ...(defaultSchema.attributes ?? {}),
      '*': [
        // 这些是站点正文增强普遍依赖的共享属性。
        ...((defaultSchema.attributes?.['*'] ?? [])),
        'className',
        'class',
        'id',
        'title',
        'role',
        'style',
        'hidden',
        'tabIndex',
        'tabindex',
        'aria-label',
        'aria-hidden',
        'aria-live',
        'aria-controls',
        'aria-haspopup',
        'aria-pressed',
        'data-icon',
        'data-lang',
        'data-lines',
        'data-state',
        ...sharedFeatureAttrs
      ],
      // 下面这些是对具体标签的精细放行，用来支持 figure、gallery、
      // 代码块工具栏按钮和 Mermaid 内联 SVG。
      a: mergeAttrs(getSchemaAttrs(defaultSchema, 'a'), ['target', 'rel']),
      img: mergeAttrs(getSchemaAttrs(defaultSchema, 'img'), ['loading', 'decoding', 'width', 'height']),
      source: mergeAttrs(getSchemaAttrs(defaultSchema, 'source'), ['srcset', 'srcSet', 'type', 'media', 'sizes']),
      ul: [['className', 'gallery', 'cols-2', 'cols-3', 'contains-task-list']],
      figure: [['className', 'figure']],
      figcaption: [['className', 'figure-caption']],
      div: mergeAttrs(getSchemaAttrs(defaultSchema, 'div'), [
        'dataIcon',
        'dataLang',
        'dataLines',
        'dataState',
        'data-icon',
        'data-lang',
        'data-lines',
        'data-state'
      ]),
      p: mergeAttrs(getSchemaAttrs(defaultSchema, 'p'), ['dataIcon', 'data-icon']),
      pre: mergeAttrs(getSchemaAttrs(defaultSchema, 'pre'), ['dataLang', 'dataLines', 'data-lang', 'data-lines']),
      code: mergeAttrs(getSchemaAttrs(defaultSchema, 'code'), ['dataLang', 'data-lang']),
      button: mergeAttrs(getSchemaAttrs(defaultSchema, 'button'), [
        'type',
        'disabled',
        'title',
        'ariaLabel',
        'aria-label',
        'ariaPressed',
        'aria-pressed',
        'dataState',
        'data-state'
      ]),
      svg: [
        ...getSchemaAttrs(defaultSchema, 'svg'),
        'viewBox',
        'width',
        'height',
        'fill',
        'stroke',
        'strokeWidth',
        'strokeLinecap',
        'strokeLinejoin',
        'ariaHidden'
      ],
      path: [
        ...getSchemaAttrs(defaultSchema, 'path'),
        'd',
        'fill',
        'stroke',
        'strokeWidth',
        'strokeLinecap',
        'strokeLinejoin'
      ],
      rect: [...getSchemaAttrs(defaultSchema, 'rect'), 'x', 'y', 'rx', 'ry', 'width', 'height']
    }
  };
};

export const createMarkdownPipeline = (): AstroMarkdownProcessorOptions => {
  const features = createMarkdownFeatures();
  // feature 的 remark / rehype 插件在这里统一摊平，保持 Astro config 入口干净。
  const rehypeFeaturePlugins = features.flatMap((feature) => feature.rehypePlugins ?? []);
  const remarkFeaturePlugins = features.flatMap((feature) => feature.remarkPlugins ?? []);
  // Mermaid 这类需要浏览器端二次增强的代码块必须跳过 Shiki 代码包裹，
  // 否则构建期输出结构会和自定义 feature 冲突。
  const syntaxHighlightExcludeLangs = Array.from(new Set([
    'mermaid',
    ...features.flatMap((feature) => feature.syntaxHighlight?.excludeLangs ?? [])
  ]));

  return {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: syntaxHighlightExcludeLangs
    },
    // remark 阶段先跑 Markdown 语法增强，rehype 阶段再做 HTML/HAST 改写和 sanitize。
    remarkPlugins: [remarkDirective, remarkCallout, ...remarkFeaturePlugins],
    rehypePlugins: [
      rehypeRaw,
      ...rehypeFeaturePlugins,
      [rehypeSanitize, createMarkdownSanitizeSchema()]
    ],
    shikiConfig: {
      // 普通代码块仍然统一走 Shiki + toolbar 增强。
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      transformers: [shikiToolbar()]
    }
  };
};
