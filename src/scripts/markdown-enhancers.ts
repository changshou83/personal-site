import { createMarkdownEnhancers } from './markdown/features';

const enhancers = createMarkdownEnhancers();

export const initMarkdownEnhancers = async (container: ParentNode = document) => {
  for (const enhancer of enhancers) {
    await enhancer.init(container);
  }
};
