import { describe, expect, it } from 'vitest';
import { createMermaidMarkdownFeature } from '../src/lib/markdown/features/mermaid';

type HastNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

const createCodeTree = (lang: string, source: string) => ({
  type: 'root',
  children: [
    {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {
            className: [`language-${lang}`]
          },
          children: [
            {
              type: 'text',
              value: source
            }
          ]
        }
      ]
    }
  ]
});

const getProperty = (node: HastNode | undefined, key: string) => {
  if (!node?.properties) return undefined;
  return node.properties[key];
};

const findNode = (node: HastNode, predicate: (candidate: HastNode) => boolean): HastNode | null => {
  if (predicate(node)) return node;
  for (const child of node.children ?? []) {
    const match = findNode(child, predicate);
    if (match) return match;
  }

  return null;
};

describe('mermaid markdown pipeline', () => {
  it('wraps mermaid code blocks into the preview-enabled code block contract', () => {
    const tree = createCodeTree('mermaid', 'flowchart LR\nA-->B');
    const feature = createMermaidMarkdownFeature();
    const plugin = feature.rehypePlugins?.[0];

    expect(plugin).toBeTypeOf('function');
    plugin?.()(tree);

    const wrapper = tree.children[0] as HastNode;
    expect(wrapper.tagName).toBe('div');
    expect(getProperty(wrapper, 'data-mermaid-block')).toBe('true');
    expect(getProperty(wrapper, 'data-mermaid-view')).toBe('preview');
    expect(getProperty(wrapper, 'data-mermaid-source')).toBe('flowchart LR\nA-->B');

    const pre = findNode(wrapper, (candidate) => candidate.tagName === 'pre');
    expect(pre).not.toBeNull();
    expect(getProperty(pre ?? undefined, 'data-lang')).toBe('mermaid');
    expect(getProperty(pre ?? undefined, 'hidden')).toBe(true);

    expect(findNode(wrapper, (candidate) => getProperty(candidate, 'data-mermaid-preview-toggle') === 'true')).not.toBeNull();
    expect(findNode(wrapper, (candidate) => getProperty(candidate, 'data-mermaid-preview') === 'true')).not.toBeNull();
    expect(findNode(wrapper, (candidate) => getProperty(candidate, 'data-mermaid-viewport') === 'true')).not.toBeNull();
    expect(findNode(wrapper, (candidate) => getProperty(candidate, 'data-mermaid-render-target') === 'true')).not.toBeNull();
    expect(findNode(wrapper, (candidate) => getProperty(candidate, 'data-mermaid-error') === 'true')).not.toBeNull();
  });

  it('leaves non-mermaid code blocks untouched', () => {
    const tree = createCodeTree('ts', 'const answer = 42;');
    const original = tree.children[0];
    const feature = createMermaidMarkdownFeature();

    feature.rehypePlugins?.[0]?.()(tree);

    expect(tree.children[0]).toBe(original);
    expect((tree.children[0] as HastNode).tagName).toBe('pre');
  });
});
