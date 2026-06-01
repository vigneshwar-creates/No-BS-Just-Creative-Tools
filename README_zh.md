<div align="center">
  <img src="assets/images/JCT.jpeg" alt="Banner" width="100%">
  
  <h1 align="center">Just Creative Tools (JCT) 🎨</h1>

  <p align="center">
    <a href="https://github.com/vigneshwar-creates/No-BS-Just-Creative-Tools/stargazers"><img src="https://img.shields.io/github/stars/vigneshwar-creates/No-BS-Just-Creative-Tools.svg?style=for-the-badge" alt="Stargazers"></a>
    <a href="https://github.com/vigneshwar-creates/No-BS-Just-Creative-Tools/issues"><img src="https://img.shields.io/github/issues/vigneshwar-creates/No-BS-Just-Creative-Tools.svg?style=for-the-badge" alt="Issues"></a>
    <a href="https://github.com/vigneshwar-creates/No-BS-Just-Creative-Tools/network/members"><img src="https://img.shields.io/github/forks/vigneshwar-creates/No-BS-Just-Creative-Tools.svg?style=for-the-badge" alt="Forks"></a>
    <a href="https://github.com/vigneshwar-creates/No-BS-Just-Creative-Tools/blob/main/LICENSE"><img src="https://img.shields.io/github/license/vigneshwar-creates/No-BS-Just-Creative-Tools.svg?style=for-the-badge" alt="License"></a>
  </p>

  <p align="center">
    <a href="README_zh.md"><img src="https://img.shields.io/badge/Chinese-blue?style=for-the-badge" alt="Chinese"></a>
    <a href="README.md"><img src="https://img.shields.io/badge/English-blue?style=for-the-badge" alt="English"></a>
    <a href="README_ta.md"><img src="https://img.shields.io/badge/Tamil-blue?style=for-the-badge" alt="Tamil"></a>
  </p>
  
  <p>
    > **注意 (Note):** 此翻译可能包含错误。如果我们遗漏了任何含义或存在翻译不准确的情况，请<a href="https://github.com/vigneshwar-creates/No-BS-Just-Creative-Tools/issues">提交一个 Issue</a> 报告。 <br>
    > (This translation might contain errors. If you find any missing meanings or mistakes, please start an issue report.)
  </p>

  <p>
    <b>Just Creative Tools</b> 是一套极其简单的设计工具合集。<br>
    所有操作均在您的浏览器中完全本地运行。<br>
    这意味着您的文件和照片 <b>100% 安全</b>。它们绝对不会被发送到任何服务器或存储在云端。
  </p>
</div>

## 功能特性 🎯

- [x] **画布图像与文本编辑器**：添加照片、绘制草图、添加文本图层以及导入自定义字体。调整亮度、对比度、饱和度等。
- [x] **便携式 .JCT 项目文件**：将您的画布工作区导出为 `.jct` 文件，以便备份、分享或稍后导入。
- [x] **智能图像尺寸调整**：为任何社交媒体网站或平台调整照片尺寸，而不会出现奇怪的裁剪。
- [x] **自由绘制与形状裁剪**：裁剪为标准尺寸，或自由绘制线条以剪切出任何形状。
- [x] **网络摄像头照片裁剪**：使用您的电脑摄像头拍照并立即进行裁剪。
- [x] **GIF 创建与编辑器**：制作动态图片（GIF）并使用文本叠加和有趣的表情符号进行自定义。
- [x] **安全的本地存储**：您的所有设计都会使用浏览器的本地存储安全地保存在您的设备上。

## 它是如何工作的？ 💡

与其他设计网站不同，JCT **不会上传您的图像**。它使用浏览器内的现代网络技术在本地完成所有处理。这使得工具运行极快且完全私密。

## 快速开始 🚀

1. 请确保您的电脑上已安装 **Node.js**。
2. 克隆此仓库并安装依赖项：
   ```bash
   git clone https://github.com/vigneshwar-creates/No-BS-Just-Creative-Tools.git
   cd No-BS-Just-Creative-Tools
   npm install
   ```
3. 启动本地服务器：
   ```bash
   npm run dev
   ```
4. 在浏览器中打开终端上显示的链接（通常为 `http://localhost:5173`）。

## 构建工具 🛠️

- **[Vite + React](https://vitejs.dev/)** - 用于构建快如闪电且响应迅速的界面。
- **[idb-keyval](https://github.com/jakearchibald/idb-keyval)** - 用于在浏览器的 IndexedDB 中本地保存您的进度。
- **[Lucide React](https://lucide.dev/)** - 提供简洁明了的图标。