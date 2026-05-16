# 为文章详情页新增 TOC

## 任务目标
- 为文章详情页新增 TOC（目录）功能
- 仅覆盖文章详情，不改 `essay` 与 `archive` 的列表页
- 复用现有 memo 页目录思路，但抽成文章详情可复用实现

## 现状分析
- 文章详情统一由 `src/pages/archive/[slug].astro` + `src/layouts/ArticleLayout.astro` 承载
- `src/pages/essay/[slug].astro` 仅是 301 跳转，不应单独实现 TOC
- memo 页已存在基于 `render(entry).headings` 生成目录的方案，可作为交互与样式参考

## 实施方案
### 阶段 1：文档与现状梳理
- [x] 确认文章详情真实路由与布局入口
- [x] 初始化索引与任务文档

### 阶段 2：功能实现
- [x] 抽取通用 TOC 数据整理逻辑或组件
- [x] 在文章详情页接入目录渲染
- [x] 补充文章详情页目录样式，并处理无有效 headings 时的隐藏逻辑

### 阶段 3：验证与回写
- [x] 补充或更新测试
- [x] 运行必要的本地检查
- [x] 根据最终实现更新文档与 TODO 状态

## 关键决策
- TOC 挂载在 `ArticleLayout`，因为这是文章详情唯一的真实布局入口
- 目录数据来自服务端 `render(entry)` 的 `headings`，避免客户端二次解析正文 DOM
- 文章详情 TOC 采用 `H2` 一级、`H3` 二级；`H3` 独立出现时提升为顶级项，兼容只有次级标题的文章
