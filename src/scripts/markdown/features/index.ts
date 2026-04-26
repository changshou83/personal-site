import { createMermaidMarkdownEnhancer } from "./mermaid";

export type MarkdownEnhancer = {
  name: string;
  init: (container: ParentNode) => void | Promise<void>;
};

export const createMarkdownEnhancers = (): MarkdownEnhancer[] => [
  createMermaidMarkdownEnhancer(),
];
