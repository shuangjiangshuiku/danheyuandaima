# 单合源代码

一个 Chrome 扩展（Manifest V3），用于对比网页的「源代码」「格式化后源码」「渲染后 DOM」，并高亮显示两者之间的差异。可以帮助你快速看出浏览器在渲染页面时，JavaScript 对 DOM 做了哪些修改。

单合网站  [https://www.danhe.com/](https://www.danhe.com/)

## 功能

- 抓取页面原始源代码（服务器返回的内容）
- 使用 [js-beautify](https://github.com/beautifier/js-beautify) 生成格式化后的规范代码
- 抓取页面渲染后的真实 DOM（`document.documentElement.outerHTML`）
- 使用 [jsdiff](https://github.com/kpdecker/jsdiff) 生成两者的差异对比，红色表示删除、绿色表示新增
- 支持右键菜单和快捷键 `Alt+U` 快速打开

## 安装方式（开发者模式加载）

1. 下载或克隆本仓库到本地
2. 打开 Chrome，访问 `chrome://extensions/`
3. 打开右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」，选择本项目文件夹
5. 安装完成后，在任意网页上点击工具栏图标，或按 `Alt+U`，或右键页面选择「查看单合源代码」

## 项目结构

```
.
├── manifest.json           # 扩展清单（Manifest V3）
├── background.js           # Service Worker，处理右键菜单、快捷键、标签页逻辑
├── content.js               # 内容脚本，抓取渲染后的 DOM
├── danheyuandaima.html      # 结果展示页面
├── danheyuandaima.js         # 展示页面逻辑（抓取源码、格式化、发起 diff）
├── diffWorker.js            # Web Worker，在后台线程执行 diff 计算
├── diff.js                  # jsdiff 库（BSD License）
├── beautify-html.min.js     # js-beautify 库（MIT License）
├── style.css                 # 样式
├── icon16/32/48/128.png     # 扩展图标
├── loading.gif               # 加载动画
└── back-to-top.png           # 回到顶部按钮图标
```

## 许可证

第三方库 `diff.js`（jsdiff，BSD License）与 `beautify-html.min.js`（js-beautify，MIT License）保留了各自原始版权声明，请勿删除。项目本身采用 [LICENSE](./LICENSE) 中的许可证。

## 已知限制

- 需要 `host_permissions: http://*/*, https://*/*` 权限来抓取任意网页的源码
- 无法在 Chrome 内置页面（如 `chrome://` 页面）或商店页面上使用
