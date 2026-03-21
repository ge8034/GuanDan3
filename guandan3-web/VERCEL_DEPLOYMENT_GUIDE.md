# Guandan3 Vercel 部署指南

## 概述

本指南将指导您将 Guandan3 Next.js 应用部署到 Vercel 平台。

## 前置条件

- ✅ Next.js 应用构建成功（已验证）
- ✅ Supabase 项目已创建
- ✅ 数据库迁移文件已准备
- ⏳ Supabase 数据库迁移需要手动执行

## 部署步骤

### 方法 1: 通过 Vercel Dashboard 部署（推荐）

#### 步骤 1: 准备代码仓库

1. **确保代码已提交到 Git 仓库**
   ```bash
   git status
   git add .
   git commit -m "chore: prepare for Vercel deployment"
   ```

2. **推送到 GitHub/GitLab/Bitbucket**
   ```bash
   git push origin main
   ```

#### 步骤 2: 在 Vercel 中创建项目

1. **登录 Vercel**
   - 访问: https://vercel.com/login
   - 使用 GitHub、GitLab 或 Bitbucket 账号登录

2. **创建新项目**
   - 点击 "Add New..." → "Project"
   - 选择您的 Guandan3 仓库
   - 点击 "Import"

#### 步骤 3: 配置项目设置

1. **项目名称**
   - 输入: `guandan3-web`（或您喜欢的名称）

2. **框架预设**
   - Vercel 会自动检测为 Next.js
   - 保持默认设置

3. **根目录**
   - 保持默认: `./`

4. **构建命令**
   - 自动设置为: `npm run build`

5. **输出目录**
   - 自动设置为: `.next`

6. **安装命令**
   - 自动设置为: `npm install`

#### 步骤 4: 配置环境变量

在 "Environment Variables" 部分添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rzzywltxlfgucngfiznx.supabase.co` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key-here` | Supabase 匿名密钥 |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | 应用 URL（部署后更新） |

**获取 Supabase 凭证：**
1. 访问: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx/settings/api
2. 复制 "Project URL" 和 "anon public" 密钥

#### 步骤 5: 部署应用

1. **点击 "Deploy" 按钮**
2. **等待构建完成**（通常需要 2-5 分钟）
3. **部署成功后，您会获得一个 URL**
   - 例如: `https://guandan3-web.vercel.app`

#### 步骤 6: 更新环境变量

1. **回到 Vercel 项目设置**
   - 进入 Settings → Environment Variables

2. **更新 NEXT_PUBLIC_APP_URL**
   - 将值更新为您的实际 Vercel URL
   - 例如: `https://guandan3-web.vercel.app`

3. **重新部署**
   - 进入 Deployments
   - 点击最新部署右侧的 "..." → "Redeploy"

### 方法 2: 使用 Vercel CLI 部署

#### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 步骤 2: 登录 Vercel

```bash
vercel login
```

#### 步骤 3: 部署项目

```bash
cd guandan3-web
vercel
```

按照提示操作：
1. 选择链接到现有项目或创建新项目
2. 配置项目名称和设置
3. 添加环境变量
4. 确认部署

#### 步骤 4: 生产环境部署

```bash
vercel --prod
```

## 部署后验证

### 1. 检查应用是否正常运行

访问您的 Vercel URL，确认：
- ✅ 页面正常加载
- ✅ 没有控制台错误
- ✅ 样式正确显示

### 2. 测试数据库连接

1. **打开浏览器开发者工具**
2. **检查网络请求**
3. **确认 Supabase API 调用成功**

### 3. 测试核心功能

- ✅ 创建房间
- ✅ 加入房间
- ✅ 开始游戏
- ✅ 提交回合

## 常见问题

### 问题 1: 构建失败

**解决方案：**
- 检查 `package.json` 中的脚本是否正确
- 确认所有依赖都已安装
- 查看 Vercel 构建日志获取详细错误信息

### 问题 2: 环境变量未生效

**解决方案：**
- 确认变量名拼写正确（区分大小写）
- 重新部署项目以应用新的环境变量
- 检查变量值是否包含特殊字符需要转义

### 问题 3: 数据库连接失败

**解决方案：**
- 确认 Supabase 凭证正确
- 检查 Supabase 项目是否处于活跃状态
- 验证数据库迁移是否已执行

### 问题 4: 页面样式异常

**解决方案：**
- 检查 Tailwind CSS 配置
- 确认静态资源路径正确
- 清除浏览器缓存重试

## 自定义域名（可选）

### 步骤 1: 添加域名

1. 进入 Vercel 项目设置
2. 选择 "Domains"
3. 点击 "Add Domain"
4. 输入您的域名

### 步骤 2: 配置 DNS

按照 Vercel 提供的说明配置 DNS 记录：
- 添加 A 记录
- 或添加 CNAME 记录

### 步骤 3: 更新环境变量

将 `NEXT_PUBLIC_APP_URL` 更新为您的自定义域名

## 性能优化

### 1. 启用图片优化

Vercel 自动优化 Next.js Image 组件

### 2. 配置 CDN

Vercel 全球 CDN 自动启用

### 3. 启用缓存

在 `vercel.json` 中配置缓存规则

## 监控和日志

### 查看部署日志

1. 进入 Vercel 项目
2. 选择 "Deployments"
3. 点击特定部署查看日志

### 查看实时日志

1. 进入 Vercel 项目
2. 选择 "Logs"
3. 查看实时应用日志

### 设置错误追踪

项目已集成 Sentry，自动追踪错误

## 成本和限制

### Vercel 免费计划

- ✅ 100GB 带宽/月
- ✅ 无限项目
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 边缘函数

### 升级到 Pro 计划

如需更多资源，可升级到 Pro 计划（$20/月）

## 相关文档

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Supabase 集成指南](https://supabase.com/docs/guides/with-nextjs)

## 相关文件

- `vercel.json` - Vercel 配置文件
- `.env.local` - 本地环境变量
- `package.json` - 项目依赖和脚本
- `next.config.js` - Next.js 配置

## 下一步

1. **执行数据库迁移** - 参考 `MANUAL_MIGRATION_GUIDE.md`
2. **部署到 Vercel** - 按照本指南操作
3. **测试应用功能** - 验证所有功能正常
4. **配置自定义域名**（可选）
5. **设置监控和告警**（可选）

## 支持

如遇到问题：
1. 查看 Vercel 文档
2. 检查项目日志
3. 联系 Vercel 支持