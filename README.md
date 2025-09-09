# SVG Studio

SVG Studio 是一个纯前端、轻量化的 SVG 编辑与导出工具，集合预览、编辑、优化、导出等关键功能于一体。它是一个在线轻量版的 "Figma / Illustrator for SVG"。

## 功能特点

### 基础功能（MVP）

- **文件管理**
  - 上传/拖拽/复制粘贴 SVG
  - 多文件切换（标签页）

- **视图控制**
  - 缩放/平移
  - 缩放比例显示
  - 重置视图 / 适配窗口

- **内容编辑**
  - 元素选择 & 高亮
  - 属性编辑（颜色、描边、透明度、文字）
  - 图层管理（显示/隐藏/删除/重命名）

- **导出**
  - 导出格式：SVG / PNG / JPEG / WebP
  - 高分辨率导出（自定义倍率 / 尺寸）
  - 背景色控制（透明 / 固定颜色）

- **历史管理**
  - 撤销/重做

- **优化工具**
  - 集成 SVGO 压缩

- **源码查看/编辑**
  - 实时预览

## 技术实现

- 纯前端实现：HTML + 原生 JavaScript + CSS
- 模块化架构：基于发布-订阅模式的松耦合设计
- 测试驱动开发 (TDD)：内置浏览器端测试套件

## 快速开始

1. 克隆仓库：
   ```
   git clone https://github.com/0x-hewm/SVG-Studio.git
   ```

2. 打开 `index.html` 文件：
   - 直接在浏览器中打开
   - 或使用本地服务器（如 VS Code 的 Live Server 插件）

3. 开始使用：
   - 点击"导入"按钮或拖放 SVG 文件到应用中
   - 使用视图控制工具缩放和平移
   - 选择元素并编辑其属性
   - 导出为不同格式

## 部署到 GitHub Pages

SVG Studio 支持自动部署到 GitHub Pages：

1. **启用 GitHub Pages**：
   - 进入 GitHub 仓库的 Settings 页面
   - 在左侧菜单中找到 "Pages"
   - 在 "Source" 下拉菜单中选择 "GitHub Actions"

2. **自动部署**：
   - 每次推送到 `main` 分支时，GitHub Actions 会自动构建和部署
   - 部署完成后，可以通过 `https://0x-hewm.github.io/SVG-Studio/` 访问

3. **手动触发部署**：
   - 进入仓库的 "Actions" 标签页
   - 选择 "Deploy to GitHub Pages" 工作流
   - 点击 "Run workflow" 按钮

## 项目结构

```
svg-studio/
├── index.html            # 主 HTML 文件
├── src/
│   ├── css/
│   │   └── main.css      # 主样式表
│   ├── js/
│   │   ├── main.js       # 应用入口
│   │   ├── modules/      # 功能模块
│   │   └── utils/        # 工具函数
│   └── assets/           # 静态资源
├── test/                 # 测试套件
│   ├── test-runner.js    # 测试运行器
│   ├── test-suite.js     # 测试套件
│   └── modules/          # 模块测试
└── doc/                  # 文档
    └── PRD.md            # 产品需求文档
```

## 运行测试

在浏览器中打开以下 URL 运行测试：

```
index.html?test=true
```

测试结果将显示在浏览器控制台中。

## 浏览器兼容性

SVG Studio 支持所有现代浏览器：

- Chrome 最新版
- Firefox 最新版
- Safari 最新版
- Edge 最新版

## 未来计划

- **V2 功能**：
  - 导出 PDF
  - 裁剪导出
  - 标尺/网格/参考线
  - 测量工具
  - 快捷键支持
  - 深色/浅色主题

- **V3+ 功能**：
  - 路径编辑（锚点移动、贝塞尔调整）
  - 对齐 & 分布工具

## 贡献

欢迎贡献代码、报告问题或提出新功能建议！

## 许可证

ISC License
