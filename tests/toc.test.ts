import { describe, expect, it } from 'vitest';
import { buildArticleTocEntries, buildMemoTocGroups } from '../src/lib/toc';

const resolveArticleTocDockState = ({
  layoutTop,
  layoutHeight,
  tocHeight,
  scrollY,
  topOffset
}: {
  layoutTop: number;
  layoutHeight: number;
  tocHeight: number;
  scrollY: number;
  topOffset: number;
}) => {
  const safeLayoutHeight = Math.max(0, layoutHeight);
  const safeTocHeight = Math.max(0, tocHeight);
  const bottomTop = Math.max(0, safeLayoutHeight - safeTocHeight);
  const viewportAnchor = scrollY + topOffset;

  if (safeLayoutHeight <= safeTocHeight + topOffset) {
    return { mode: 'top', absoluteTop: 0 } as const;
  }

  if (viewportAnchor <= layoutTop) {
    return { mode: 'top', absoluteTop: 0 } as const;
  }

  if (viewportAnchor + safeTocHeight >= layoutTop + safeLayoutHeight) {
    return { mode: 'bottom', absoluteTop: bottomTop } as const;
  }

  return { mode: 'fixed', absoluteTop: bottomTop } as const;
};

describe('buildArticleTocEntries', () => {
  it('builds h2 sections with nested h3 items', () => {
    expect(
      buildArticleTocEntries([
        { depth: 2, text: '第一章', slug: 'chapter-1' },
        { depth: 3, text: '小节 A', slug: 'section-a' },
        { depth: 3, text: '小节 B', slug: 'section-b' },
        { depth: 2, text: '第二章', slug: 'chapter-2' }
      ])
    ).toEqual([
      {
        text: '第一章',
        slug: 'chapter-1',
        items: [
          { text: '小节 A', slug: 'section-a' },
          { text: '小节 B', slug: 'section-b' }
        ]
      },
      {
        text: '第二章',
        slug: 'chapter-2',
        items: []
      }
    ]);
  });

  it('keeps h3-only content visible as top-level toc items', () => {
    expect(
      buildArticleTocEntries([
        { depth: 3, text: '直接开始', slug: 'start-here' }
      ])
    ).toEqual([
      {
        text: '直接开始',
        slug: 'start-here',
        items: []
      }
    ]);
  });

  it('ignores empty headings', () => {
    expect(
      buildArticleTocEntries([
        { depth: 2, text: '', slug: 'empty' },
        { depth: 3, text: '可见项', slug: 'visible' }
      ])
    ).toEqual([
      {
        text: '可见项',
        slug: 'visible',
        items: []
      }
    ]);
  });
});

describe('buildMemoTocGroups', () => {
  it('groups h3 items under h2 titles', () => {
    expect(
      buildMemoTocGroups([
        { depth: 2, text: '2026', slug: '2026' },
        { depth: 3, text: '春天', slug: 'spring' }
      ])
    ).toEqual([
      {
        title: '2026',
        items: [{ text: '春天', slug: 'spring' }]
      }
    ]);
  });

  it('creates a fallback group when memo starts with h3', () => {
    expect(
      buildMemoTocGroups([
        { depth: 3, text: '未分组条目', slug: 'loose-item' }
      ])
    ).toEqual([
      {
        title: '目录',
        items: [{ text: '未分组条目', slug: 'loose-item' }]
      }
    ]);
  });
});

describe('resolveArticleTocDockState', () => {
  it('keeps toc at layout top before reaching the viewport anchor', () => {
    expect(
      resolveArticleTocDockState({
        layoutTop: 600,
        layoutHeight: 1800,
        tocHeight: 320,
        scrollY: 200,
        topOffset: 40
      })
    ).toEqual({
      mode: 'top',
      absoluteTop: 0
    });
  });

  it('switches toc to fixed in the middle reading area', () => {
    expect(
      resolveArticleTocDockState({
        layoutTop: 600,
        layoutHeight: 1800,
        tocHeight: 320,
        scrollY: 900,
        topOffset: 40
      })
    ).toEqual({
      mode: 'fixed',
      absoluteTop: 1480
    });
  });

  it('pins toc to the layout bottom near the article end', () => {
    expect(
      resolveArticleTocDockState({
        layoutTop: 600,
        layoutHeight: 1800,
        tocHeight: 320,
        scrollY: 2100,
        topOffset: 40
      })
    ).toEqual({
      mode: 'bottom',
      absoluteTop: 1480
    });
  });
});
