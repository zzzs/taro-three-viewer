# Taro Three Viewer

基于 Taro + React + Three.js 实现的 3D 模型查看器，支持 H5 和微信小程序等多端环境。

## 功能特性

- 支持 GLB/GLTF 模型加载
- 支持旋转、缩放、平移等交互操作
- 跨平台支持（H5、微信小程序）

## 环境要求

- Node.js >= 16.0.0

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发环境

#### H5 端

```bash
npm run dev:h5
```

#### 微信小程序端

```bash
npm run dev:weapp
```

## 目录结构

- `src/` - 源代码
  - `pages/` - 页面文件
  - `components/` - 组件文件
- `config/` - Taro 配置文件
- `public/` - 静态资源文件

## License

MIT
