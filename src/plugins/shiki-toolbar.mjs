import { getLangIcon, getLangLabel, normalizeLang } from '../utils/lang-icons.mjs';
import { createCodeBlockWrapper } from '../lib/markdown/code-block-frame.ts';

const isElement = (node, tag) => node && node.type === 'element' && node.tagName === tag;

const getText = (node) => {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (Array.isArray(node.children)) {
    return node.children.map(getText).join('');
  }
  return '';
};

const getProp = (props, key) => {
  if (!props) return null;
  if (props[key] != null) return props[key];
  const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (props[camel] != null) return props[camel];
  return null;
};

const getLangFromPre = (pre) => {
  const props = pre?.properties || {};
  const dataLang = getProp(props, 'data-lang') || getProp(props, 'data-language');
  if (dataLang) return String(dataLang);

  const cls = props.className;
  const classes = Array.isArray(cls) ? cls : typeof cls === 'string' ? cls.split(/\s+/) : [];
  const match = classes.find((name) => name && name.startsWith('language-'));
  if (match) return match.replace(/^language-/, '');
  return '';
};

const hasLineClass = (node) => {
  const cls = node?.properties?.className;
  if (Array.isArray(cls)) return cls.includes('line');
  if (typeof cls === 'string') return cls.split(/\s+/).includes('line');
  return false;
};

const countLines = (pre) => {
  const code = Array.isArray(pre.children)
    ? pre.children.find((child) => isElement(child, 'code'))
    : null;
  if (!code) return 0;

  const lineNodes = Array.isArray(code.children)
    ? code.children.filter((child) => child.type === 'element' && hasLineClass(child))
    : [];
  if (lineNodes.length) return lineNodes.length;

  const text = getText(code).replace(/\r\n/g, '\n');
  if (!text) return 0;
  const parts = text.split('\n');
  if (parts.length > 1 && parts[parts.length - 1] === '') {
    return Math.max(1, parts.length - 1);
  }
  return Math.max(1, parts.length);
};

export default function shikiToolbar() {
  return {
    name: 'astro-whono-code-toolbar',
    pre(node) {
      const rawLang = getLangFromPre(node);
      const normalized = normalizeLang(rawLang);
      const lines = countLines(node);
      node.properties = {
        ...(node.properties || {}),
        'data-lang': normalized,
        'data-lines': String(lines || 0)
      };
    },
    root(node) {
      if (!Array.isArray(node.children)) return;
      const preIndex = node.children.findIndex((child) => isElement(child, 'pre'));
      if (preIndex === -1) return;
      const pre = node.children[preIndex];

      const rawLang = getLangFromPre(pre);
      const normalized = normalizeLang(rawLang);
      const lineCount = Math.max(1, countLines(pre));
      const langLabel = getLangLabel(rawLang, normalized);
      const icon = getLangIcon(rawLang);
      const wrapper = createCodeBlockWrapper({
        langLabel,
        normalizedLang: normalized,
        lineCount,
        preNode: pre,
        iconSvg: icon ? icon.svg : null
      });

      node.children.splice(preIndex, 1, wrapper);
    }
  };
}
