---
title: 使用 Astro 创建博客网站并部署在 Cloudflare Worker
description: 使用 Astro 创建博客网站并部署在 Cloudflare Worker
date: 2026-04-02
badge: 指南
tags: [ "Astro", "Cloudflare", "Guide"]
draft: false
---

## 一、基础部署操作

基础部署共分为五步，具体操作如下：

1. 创建 Astro 项目：打开终端，输入命令 `npm create astro@latest -- --template cxro/astro-whono`，等待命令执行完成，生成基础项目结构。
2. 安装依赖并启动本地服务：进入项目目录，执行 `npm i` 安装项目依赖；依赖安装完成后，输入 `npm run dev` 启动本地开发服务；服务启动后，通过浏览器访问给出的本地地址，进入 `/admin/` 配置页，完成博客基础配置（标题、作者信息、导航栏等）。
3. 配置 Cloudflare Worker 部署工具：执行 `npm install -g wrangler` 安装 `wrangler CLI`；在项目 `package.json` 文件中新增 `npm script`，名称为 `deploy`，内容设置为 `wrangler deploy`；该 Astro 模板无 SSR 内容，无需安装 Astro Cloudflare 适配器。
4. 提交项目到 GitHub 仓库：执行 `git init` 初始化 git 仓库，执行 `git add .` 添加所有文件，执行 `git commit -m "初始化 Astro 博客项目"` 完成提交；在 GitHub 创建新仓库，复制仓库远程地址，执行 `git remote add origin` 远程仓库地址 关联远程仓库，最后执行 `git push -u origin main` 将本地项目推送到远程仓库。
5. 在 Cloudflare 部署项目：登录 Cloudflare 账号，进入控制台仪表板，找到 Workers 模块，选择“从 GitHub 仓库新建 Worker”，关联上述 GitHub 仓库；配置打包命令为 `npm run build`，部署命令为 `wrangler deploy`；等待 CI 流程执行完成，即可通过 Worker 自带域名访问博客。

## 二、自定义域名配置

自定义域名配置共分为三步，具体操作如下：

1. 购买自定义域名：进入腾讯云域名注册页面，搜索并选定域名，完成实名认证后，支付费用，完成域名购买；因博客部署在境外服务器，无需进行域名备案。
2. 域名托管到 Cloudflare：登录 Cloudflare 控制台，点击“Domain”模块，输入购买的域名；选择免费套餐，Cloudflare 会自动扫描域名现有 DNS 记录，保留默认扫描结果即可；复制 Cloudflare 分配的专属 NS 记录，前往腾讯云域名管理页面，找到“名称服务器”修改入口，将原有 NS 记录替换为 Cloudflare 分配的记录并保存；等待 Cloudflare 验证通过，验证时长通常为10分钟至2小时，期间可在 Cloudflare 站点页面查看验证状态。
3. 绑定自定义域名到 Worker：Cloudflare 验证域名托管成功后，进入之前创建的 Worker 配置页面，找到“Worker 设置”中的“自定义域名”选项，点击“添加自定义域名”，输入需绑定的自定义域名；按照 Cloudflare 提示，创建 CNAME 记录，将域名指向 Worker 默认域名，开启代理状态（显示橙色云朵图标）；DNS 解析生效后即可通过自定义域名访问博客。
