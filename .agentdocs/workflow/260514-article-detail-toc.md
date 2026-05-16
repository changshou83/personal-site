# 为文章详情页新增 TOC

## 任务目标
- 为文章详情页新增 TOC（目录）功能
- 仅覆盖文章详情，不改 `essay` 与 `archive` 的列表页

## 当前状态
- 文章详情页 TOC 已重新实现
- 桌面端右侧独立栏，移动端文章开头默认展开
- 桌面端定位策略改为 `fixed + absolute` 混合方案，以获得“相对窗口固定，但在文章底部停住”的效果

## 现状分析
- 文章详情统一由 `src/pages/archive/[slug].astro` + `src/layouts/ArticleLayout.astro` 承载
- `src/pages/essay/[slug].astro` 仅是 301 跳转，不应单独实现 TOC
- memo 页已存在基于 `render(entry).headings` 生成目录的方案，可作为参考

## 后续待定
- [x] 桌面端目录改为窗口固定与文章边界切换的混合定位
- [ ] 如需进一步优化，再考虑滚动高亮阈值和目录宽度
