# 掼蛋3 UI 设计系统

## 设计理念

掼蛋3的设计系统以"现代、专业、易用"为核心原则，融合传统纸牌游戏的经典元素与现代Web应用的交互体验。

### 核心原则
- **一致性**: 统一的视觉语言和交互模式
- **可访问性**: 符合WCAG 2.1 AA标准
- **响应式**: 适配桌面、平板、移动设备
- **性能**: 优化的动画和渲染性能
- **可维护性**: 模块化、可扩展的组件架构

## 颜色系统

### 主色调 - 现代蓝紫色系
```css
--primary-50: #F5F3FF;
--primary-100: #EDE9FE;
--primary-200: #DDD6FE;
--primary-300: #C4B5FD;
--primary-400: #A78BFA;
--primary-500: #8B5CF6;  /* 主品牌色 */
--primary-600: #7C3AED;
--primary-700: #6D28D9;
--primary-800: #5B21B6;
--primary-900: #4C1D95;
```

### 辅助色调 - 清新绿色系
```css
--secondary-50: #F0FDF4;
--secondary-100: #DCFCE7;
--secondary-200: #BBF7D0;
--secondary-300: #86EFAC;
--secondary-400: #4ADE80;
--secondary-500: #22C55E;  /* 成功状态色 */
--secondary-600: #16A34A;
--secondary-700: #15803D;
--secondary-800: #166534;
--secondary-900: #14532D;
```

### 警告色调 - 温暖橙黄色系
```css
--warning-50: #FFFBEB;
--warning-100: #FEF3C7;
--warning-200: #FDE68A;
--warning-300: #FCD34D;
--warning-400: #FBBF24;
--warning-500: #F59E0B;  /* 警告状态色 */
--warning-600: #D97706;
--warning-700: #B45309;
--warning-800: #92400E;
--warning-900: #78350F;
```

### 错误色调 - 柔和红色系
```css
--error-50: #FEF2F2;
--error-100: #FEE2E2;
--error-200: #FECACA;
--error-300: #FCA5A5;
--error-400: #F87171;
--error-500: #EF4444;  /* 错误状态色 */
--error-600: #DC2626;
--error-700: #B91C1C;
--error-800: #991B1B;
--error-900: #7F1D1D;
```

### 中性色调 - 现代灰色系
```css
--gray-50: #FAFAFA;      /* 最浅背景 */
--gray-100: #F5F5F5;     /* 浅背景 */
--gray-200: #E5E5E5;     /* 边框色 */
--gray-300: #D4D4D4;     /* 分割线 */
--gray-400: #A3A3A3;     /* 禁用状态 */
--gray-500: #737373;     /* 次要文本 */
--gray-600: #525252;     /* 辅助文本 */
--gray-700: #404040;     /* 主要文本 */
--gray-800: #262626;     /* 强调文本 */
--gray-900: #171717;     /* 标题文本 */
```

### 游戏专用色 - 经典牌桌配色
```css
--card-back: #3B82F6;      /* 牌背蓝色 - 明亮现代 */
--card-front: #FFFFFF;     /* 牌面白色 */
--table-green: #166534;    /* 牌桌绿色 - 经典深绿 */
--table-border: #15803D;   /* 牌桌边框 */
--table-light: #22C55E;    /* 牌桌浅色区域 */
--highlight: #FBBF24;      /* 高亮色 */
--shadow: rgba(0, 0, 0, 0.1);  /* 柔和阴影 */
```

### 颜色使用指南
- **主色调**: 用于主要操作按钮、链接、品牌元素
- **辅助色调**: 用于成功状态、确认操作
- **警告色调**: 用于警告提示、需要注意的操作
- **错误色调**: 用于错误提示、危险操作
- **中性色调**: 用于文本、背景、边框
- **游戏专用色**: 仅用于游戏界面元素

## 排版系统

### 字体家族
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
```

### 字号系统
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
```

### 字重系统
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### 行高系统
```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### 排版使用指南
- **页面标题**: text-4xl, font-bold, leading-tight
- **章节标题**: text-2xl, font-semibold, leading-snug
- **卡片标题**: text-xl, font-semibold, leading-snug
- **正文内容**: text-base, font-normal, leading-normal
- **辅助文本**: text-sm, font-normal, leading-relaxed
- **按钮文本**: text-base, font-medium, leading-none

## 间距系统

### 基础间距单位
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### 间距使用指南
- **组件内间距**: space-2 ~ space-4
- **组件间间距**: space-4 ~ space-6
- **区块间距**: space-8 ~ space-12
- **页面边距**: space-6 ~ space-8
- **大区块间距**: space-12 ~ space-16

## 圆角系统

```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px */
--radius-base: 0.25rem;  /* 4px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-3xl: 1.5rem;    /* 24px */
--radius-full: 9999px;
```

### 圆角使用指南
- **输入框**: radius-md
- **按钮**: radius-lg
- **卡片**: radius-xl
- **模态框**: radius-2xl
- **头像**: radius-full
- **标签**: radius-full

## 阴影系统

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-2xl: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
```

### 阴影使用指南
- **按钮**: shadow-sm
- **卡片**: shadow-base
- **下拉菜单**: shadow-lg
- **模态框**: shadow-xl
- **悬浮元素**: shadow-md

## 动画系统

### 过渡时长
```css
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
```

### 缓动函数
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 动画使用指南
- **按钮悬停**: duration-150, ease-out
- **页面切换**: duration-300, ease-in-out
- **模态框**: duration-200, ease-out
- **下拉菜单**: duration-150, ease-out
- **加载状态**: duration-500, ease-in-out

## 响应式断点

```css
--breakpoint-sm: 640px;   /* 手机横屏 */
--breakpoint-md: 768px;   /* 平板 */
--breakpoint-lg: 1024px;  /* 小型桌面 */
--breakpoint-xl: 1280px;  /* 桌面 */
--breakpoint-2xl: 1536px; /* 大型桌面 */
```

### 响应式策略
- **移动优先**: 从小屏幕开始设计，逐步增强
- **弹性布局**: 使用Flexbox和Grid实现自适应
- **相对单位**: 优先使用rem、%、vw/vh
- **图片优化**: 响应式图片和懒加载

## 组件状态

### 按钮状态
- **默认**: 正常显示
- **悬停**: 背景色加深，轻微阴影
- **聚焦**: 蓝色边框，外发光效果
- **激活**: 背景色进一步加深，轻微位移
- **禁用**: 降低透明度，禁用交互

### 输入框状态
- **默认**: 灰色边框
- **聚焦**: 蓝色边框，外发光效果
- **错误**: 红色边框，错误提示
- **禁用**: 灰色背景，降低透明度

### 卡片状态
- **默认**: 基础阴影
- **悬停**: 阴影加深，轻微上浮
- **激活**: 边框高亮

## 可访问性

### 对比度要求
- **正常文本**: 至少4.5:1
- **大文本**: 至少3:1
- **UI组件**: 至少3:1

### 焦点管理
- **焦点可见**: 清晰的焦点指示器
- **焦点顺序**: 逻辑的Tab键顺序
- **焦点陷阱**: 模态框内的焦点管理

### 键盘导航
- **快捷键**: 常用操作的键盘快捷键
- **跳过链接**: 跳过导航的链接
- **ARIA标签**: 适当的ARIA属性

## 设计标记文件结构

```
src/
├── styles/
│   ├── globals.css          # 全局样式和CSS变量
│   ├── components.css       # 组件样式
│   └── utilities.css        # 工具类样式
├── components/
│   ├── ui/
│   │   ├── Button.tsx       # 按钮组件
│   │   ├── Card.tsx         # 卡片组件
│   │   ├── Input.tsx        # 输入框组件
│   │   ├── Modal.tsx        # 模态框组件
│   │   └── Toast.tsx        # 提示组件
│   └── game/
│       ├── Card.tsx         # 扑克牌组件
│       ├── Table.tsx        # 牌桌组件
│       └── Hand.tsx         # 手牌组件
└── lib/
    └── design-tokens.ts    # 设计标记TypeScript定义
```

## 实施指南

### 1. 安装依赖
```bash
npm install clsx tailwind-merge
```

### 2. 创建设计标记文件
在 `src/lib/design-tokens.ts` 中定义所有设计标记

### 3. 配置全局样式
在 `src/styles/globals.css` 中导入CSS变量

### 4. 创建基础组件
按照设计系统创建可复用的UI组件

### 5. 应用到页面
使用设计系统重构现有页面

## 维护指南

### 版本控制
- 使用语义化版本号
- 记录每次变更
- 保持向后兼容

### 文档更新
- 及时更新设计系统文档
- 提供使用示例
- 记录最佳实践

### 质量保证
- 定期进行设计审查
- 测试跨浏览器兼容性
- 验证可访问性标准

## 参考资源

- [Tailwind CSS](https://tailwindcss.com/)
- [Material Design](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
