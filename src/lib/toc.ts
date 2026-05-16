export type TocHeading = {
  depth: number;
  text: string;
  slug: string;
};

export type TocItem = {
  text: string;
  slug: string;
};

export type MemoTocGroup = {
  title: string;
  items: TocItem[];
};

export type ArticleTocEntry = TocItem & {
  items: TocItem[];
};

export const buildMemoTocGroups = (headings: TocHeading[]): MemoTocGroup[] => {
  const groups: MemoTocGroup[] = [];
  let current: MemoTocGroup | null = null;

  for (const heading of headings) {
    if (!heading.text || !heading.slug) continue;

    if (heading.depth === 2) {
      current = { title: heading.text, items: [] };
      groups.push(current);
      continue;
    }

    if (heading.depth === 3) {
      if (!current) {
        current = { title: '目录', items: [] };
        groups.push(current);
      }

      current.items.push({ text: heading.text, slug: heading.slug });
    }
  }

  return groups;
};

export const buildArticleTocEntries = (headings: TocHeading[]): ArticleTocEntry[] => {
  const entries: ArticleTocEntry[] = [];
  let current: ArticleTocEntry | null = null;

  for (const heading of headings) {
    if (!heading.text || !heading.slug) continue;

    if (heading.depth === 2) {
      current = { text: heading.text, slug: heading.slug, items: [] };
      entries.push(current);
      continue;
    }

    if (heading.depth === 3) {
      if (!current) {
        current = { text: heading.text, slug: heading.slug, items: [] };
        entries.push(current);
        continue;
      }

      current.items.push({ text: heading.text, slug: heading.slug });
    }
  }

  return entries;
};
