# 文章详情页与正文渲染链路

## 适用场景
- 修改文章详情页结构、元信息、正文布局或目录（TOC）时
- 需要确认 `essay` 与 `archive` 两套路由在详情层的真实承载页面时

## 当前结构
- 文章详情真实承载路由是 `src/pages/archive/[slug].astro`
- `src/pages/essay/[slug].astro` 仅返回 301 跳转到 `/archive/[slug]/`
- `src/pages/archive/[slug].astro` 负责：
  - 读取文章 entry 与相邻文章
  - 调用 `render(entry)` 获取正文 `Content`
  - 将正文与上下文传入 `src/layouts/ArticleLayout.astro`
- `src/layouts/ArticleLayout.astro` 是文章详情的统一布局，负责：
  - 页面头部与元信息
  - 正文容器 `.prose`
  - 上一篇 / 下一篇
  - 正文增强脚本与灯箱初始化

## 约束与记忆
- 文章详情相关的共性功能应优先落在 `ArticleLayout` 或其可复用子组件中，避免只改 `archive/[slug]` 页面导致路由行为分叉。
- 若功能依赖 Markdown headings，应优先在 `render(entry)` 一次性取出 `headings` 后透传，而不是在客户端二次扫描正文生成数据。
- 文章详情 TOC 采用正文外独立栏方案，移动端放在文章开头并默认展开。
- 桌面端右侧 TOC 不应压缩正文宽度，也不应改造全局 `BaseLayout`；优先通过 `ArticleLayout` 内的外挂定位实现。
- 当桌面 TOC 视觉上位于正文右侧但结构上仍挂在文章布局中时，纯 CSS `sticky` 很难实现“相对窗口固定且在文章底部停住”的体验，优先使用 `fixed + absolute` 的混合定位。
- 文章详情 TOC 采用 `H2` 作为一级目录、`H3` 作为二级目录；若文章没有 `H2` 而直接从 `H3` 开始，目录仍会把这些 `H3` 作为可见顶级项，避免出现空目录。
