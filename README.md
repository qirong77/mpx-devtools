# MPX Devtools

<div align="center">

[![npm version](https://img.shields.io/npm/v/mpx-devtools.svg)](https://www.npmjs.com/package/mpx-devtools)
[![license](https://img.shields.io/npm/l/mpx-devtools.svg)](https://github.com/qirong77/mpx-devtools/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/qirong77/mpx-devtools.svg)](https://github.com/qirong77/mpx-devtools/stargazers)

</div>

MPX Devtools 是一个为滴滴跨端框架 [MPX](https://github.com/didi/mpx) 开发的开发者工具，提供组件树可视化、数据监控和实时修改等强大功能，大幅提升小程序开发调试体验。


## ✨ 功能特点

- 📊 **组件树可视化** - 实时查看应用的完整组件树结构，清晰展示组件层级关系
- 🔍 **智能搜索** - 快速搜索组件数据，精准定位目标组件和状态
- 🔄 **数据监控** - 实时监控和修改组件的 data、computed 等状态
- 📍 **源码追踪** - 自动追踪组件源文件路径，快速定位问题代码
- 🛠️ **生命周期追踪** - 监控组件的挂载、卸载等生命周期事件
- 🔌 **零侵入集成** - 通过 Webpack 插件自动注入，生产环境零侵入
- ⚡ **性能优化** - 高效的实例管理和更新机制，不影响应用性能

## 🤔 为什么需要 MPX Devtools？

小程序开发调试面临诸多挑战：组件层级深难以定位、数据流向不直观、缺乏实时监控能力、编译后代码难以追踪源码。MPX Devtools 提供可视化组件树、实时数据监控和源码追踪，让调试更高效。

## 📦 安装

使用 npm 或 yarn 安装：

```bash
npm install mpx-devtools --save-dev
```

或

```bash
yarn add mpx-devtools -D
```

## 🚀 快速开始

### 1. 配置 Webpack 插件

在你的 `mpx.config.js` 中添加以下配置：

```javascript
const MpxDevtoolsWebpackPlugin = require('mpx-devtools/src/webpack-plugin/index.js')

module.exports = defineConfig({
  // ... 其他配置
  configureWebpack(config) {
    // 建议仅在开发环境启用
    if (process.env.NODE_ENV === 'development') {
      config.plugins.push(new MpxDevtoolsWebpackPlugin())
    }
  }
})
```

### 2. 启动项目

```bash
npm run dev
```

### 3. 开始调试

启动项目后，MPX Devtools 会自动注入到你的应用中。你可以通过小程序开发者工具的控制台查看和操作组件树数据。

## 🏗️ 工作原理

MPX Devtools 通过以下机制实现零侵入的调试功能：

1. **Webpack Loader** - 自动在 `.mpx` 文件中注入源文件路径信息
2. **Mixin 注入** - 通过 loader 自动为页面和组件注入生命周期钩子
3. **实例管理** - 监听组件的挂载和卸载，维护组件实例集合
4. **数据追踪** - 实时收集和更新组件的 data、computed 等状态信息

## 📂 项目结构

```
mpx-devtools/
├── src/                              # 源代码目录
│   ├── mpx-devtools.js              # 核心监控类，管理组件实例和数据
│   ├── mixin/                       # Mixin 文件
│   │   ├── mixin-page.js           # 页面生命周期 mixin
│   │   └── mixin-component.js      # 组件生命周期 mixin
│   └── webpack-plugin/              # Webpack 插件
│       ├── index.js                # 插件入口
│       └── loader/                 # Webpack loader
│           └── mpx-devtools-source-loader.js  # 源文件路径注入 loader
├── example/                         # 示例项目
│   ├── src/                        # 示例源码
│   │   ├── pages/                 # 示例页面
│   │   └── components/            # 示例组件
│   └── package.json               # 示例项目配置
├── assets/                          # 资源文件（截图等）
├── package.json                     # 项目配置
└── README.md                        # 项目文档
```

## 🎯 核心 API

### MPXDevTools 类

核心监控类，提供以下主要方法：

```javascript
// 获取当前页面的所有活跃组件实例
mpxDevTools.activeInstances

// 搜索包含指定文本的组件数据
mpxDevTools.search(text)

// 获取当前页面信息
mpxDevTools.currentPageMpxDevToolsInfo

// 组件挂载回调
mpxDevTools.onComponentMounted(instance)

// 组件卸载回调
mpxDevTools.onComponentUnmounted(instance)
```

### MpxDevtoolsComponentInfo 类

组件信息类，包含以下属性：

- `__mpx_file_src__` - 组件源文件路径
- `data` - 组件 data 数据
- `computed` - 组件 computed 数据
- `id` - 组件唯一标识
- 其他组件相关信息...

## 🌐 支持平台

目前主要支持：

- ✅ **微信小程序（wx）** - 完全支持

计划支持：

- ⏳ 支付宝小程序（ali）
- ⏳ 百度小程序（swan）
- ⏳ 字节跳动小程序（tt）
- ⏳ 钉钉小程序（dd）

## 🔧 使用示例

查看 `example/` 目录中的完整示例项目：

```bash
# 进入示例目录
cd example

# 安装依赖
npm install

# 启动示例项目
npm run dev
```

然后使用微信开发者工具打开编译后的 `dist/wx` 目录即可体验完整功能。

## ⚙️ 配置选项

### MpxDevtoolsWebpackPlugin

目前插件暂无配置选项，后续版本将支持更多自定义配置。

```javascript
new MpxDevtoolsWebpackPlugin({
  // 未来将支持的配置选项
})
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 许可证

[ISC License](LICENSE)

## 🔗 相关链接

- [MPX 官方文档](https://github.com/didi/mpx)
- [GitHub 仓库](https://github.com/qirong77/mpx-devtools)
- [NPM 包](https://www.npmjs.com/package/mpx-devtools)
- [问题反馈](https://github.com/qirong77/mpx-devtools/issues)

## 👨‍💻 作者

**qirong77**

- GitHub: [@qirong77](https://github.com/qirong77)

---

如果这个项目对你有帮助，欢迎 star ⭐️

- [MPX 框架](https://github.com/didi/mpx)
- [问题反馈](https://github.com/qirong77/mpx-devtools/issues)
- [项目主页](https://github.com/qirong77/mpx-devtools#readme)

## 作者

qirong77

---

如果这个项目对你有帮助，欢迎给它一个 star ⭐️