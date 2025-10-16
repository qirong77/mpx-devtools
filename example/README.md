# MPX Demo App

> 一个基于 MPX 框架的跨平台小程序示例项目

## 项目介绍

这是一个完整的 MPX 框架示例项目，展示了如何使用 MPX 开发跨平台小程序。项目包含了丰富的组件展示、API 演示和最佳实践。

### 主要特性

- 🚀 **跨平台支持** - 支持微信、支付宝、百度、字节跳动等多个小程序平台
- 🧩 **丰富的组件** - 包含各种常用 UI 组件的展示和使用方法
- 🔧 **完整的 API 演示** - 展示小程序常用 API 的使用方法
- 📱 **响应式设计** - 适配不同尺寸的设备屏幕
- 🎨 **现代化 UI** - 使用渐变色彩和卡片式设计

## 项目结构

```
src/
├── app.mpx              # 应用入口文件
├── pages/               # 页面目录
│   ├── index.mpx        # 启动页（重定向）
│   ├── home.mpx         # 首页
│   ├── components.mpx   # 组件展示页
│   ├── api-demo.mpx     # API 演示页
│   └── about.mpx        # 关于页面
└── components/          # 组件目录
    ├── feature-card.mpx      # 特性卡片组件
    ├── nav-grid.mpx          # 导航网格组件
    ├── demo-section.mpx      # 演示区块组件
    ├── list-component.mpx    # 列表组件
    ├── info-card.mpx         # 信息卡片组件
    ├── platform-card.mpx     # 平台卡片组件
    └── list.mpx             # 增强列表组件
```

## 页面功能

### 🏠 首页 (Home)
- 项目介绍和欢迎信息
- 核心特性展示
- 快速导航菜单
- 环境信息检测

### 🧩 组件展示 (Components)
- 按钮组件（多种样式和尺寸）
- 表单组件（输入框、选择器、开关等）
- 列表组件展示
- 轮播图组件
- 弹窗和反馈组件

### 🔧 API 演示 (API Demo)
- 网络请求演示
- 本地存储操作
- 设备信息获取
- 媒体功能（图片选择、扫码）
- 界面反馈（提示、震动）
- 页面导航功能

### ℹ️ 关于 (About)
- 项目详细信息
- 环境检测功能
- 平台差异对比
- 技术栈展示
- 调试信息查看

## 开发环境搭建

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
# 同时启动微信小程序和 Web 开发服务器
npm run dev
```

### 构建生产版本
```bash
# 构建微信小程序版本
mpx build --target=wx

# 构建支付宝小程序版本
mpx build --target=ali

# 构建百度小程序版本
mpx build --target=swan

# 构建字节跳动小程序版本
mpx build --target=tt
```

## 技术栈

- **核心框架**: MPX 2.10.0
- **基础库**: Vue.js 2.7.0
- **构建工具**: Webpack 5.43.0
- **样式预处理**: Stylus
- **开发工具**: Vue CLI 5.0.0

## 最佳实践

### 组件开发
- 使用 `createComponent` 创建组件
- 通过 `properties` 定义组件属性
- 使用 `triggerEvent` 向父组件发送事件

### 页面开发
- 使用 `createPage` 创建页面
- 合理使用生命周期钩子
- 统一的错误处理和用户反馈

### 样式规范
- 使用 `rpx` 作为响应式单位
- 统一的颜色变量和主题
- 卡片式设计和渐变效果

### API 使用
- 使用 `mpx.xxx` 调用小程序 API
- 统一的异步处理和错误捕获
- 良好的用户反馈体验

## 跨平台适配

项目支持一套代码编译到多个小程序平台：

- **微信小程序** - 完整功能支持
- **支付宝小程序** - 核心功能适配
- **百度智能小程序** - 基础功能支持
- **字节跳动小程序** - 基础功能支持

## 参考链接

- [MPX 官方文档](https://mpxjs.cn)
- [MPX GitHub 仓库](https://github.com/didi/mpx)
- [小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

## License

MIT License
