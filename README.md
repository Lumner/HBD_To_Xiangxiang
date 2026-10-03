# 送给湘湘的星光生日旅程

一个完整的中文互动生日网页：身份确认、新一岁祝福、三种小游戏、礼物、烛光许愿、生日音乐和最终的一封信。手机和电脑均可体验，所有装饰都通过网页绘制。

在线体验：[湘湘的生日旅程](https://lumner.github.io/HBD_To_Xiangxiang/)。

## 发布到 GitHub Pages

项目已准备好发布配置，网页成品位于 `dist`，没有构建依赖。不需要上传愿望或配置服务器。

1. 在仓库打开 **Settings → Pages**。
2. 将 **Build and deployment → Source** 设为 **GitHub Actions**。
3. 打开 **Actions → 发布湘湘的生日网页 → Run workflow**，选择 `main` 分支并运行。
4. 等待“发布网页”成功。实际访问网址会显示在工作流的部署结果和仓库的 Pages 设置中，使用该网址分享给朋友。

工作流为手动发布，上传源码不会立即发布网页。以后修改内容并推送后，重新运行同一个工作流即可更新。不要选择从仓库根目录发布，因为真正的网页入口位于 `dist/index.html`。

流程依据 [GitHub Pages 官方自定义工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 本地预览

安装 Node.js 二十二或更新版本，在项目目录运行：

```sh
npm start
```

打开 `http://127.0.0.1:4173`。请勿直接双击页面文件，浏览器可能拦截本地脚本模块。

## 修改称呼和祝福

集中编辑 [`dist/config.js`](dist/config.js)：

- `friend`：湘湘的称呼。
- `blessing`：最后一封信的逐段正文。
- `gifts`、`gameBlessings`、`eggs`：礼物、关卡祝福和彩蛋。
- `games`：游戏难度。
- `theme`：主题颜色。

## 中文愿望和生日音乐

- 愿望使用支持中文输入法的文本框，录入文字会被遮住，保存后可主动点开查看。
- 愿望仅保存在当前设备、当前浏览器，不上传到 GitHub 或任何服务器。
- 打开页面默认静音。点击“吹灭蜡烛”会从头开始生日伴奏；音乐与互动音效仍可独立开关。
- 背景音乐是项目自行合成的轻柔生日纯音乐，保存在网页目录里，不依赖外链。

## 验证

```sh
npm run check
```

手机长按回归页：运行 `node tests/touch-server.mjs`，打开 `http://127.0.0.1:4174/tests/touch-browser.html`，点击检查按钮。它用真实关卡模块模拟触摸事件，检查五轮最长蓄力与祝福，不读取本地生日进度，也不会进入 Pages 发布目录。它属于浏览器合成事件测试，不能代替实体手机系统手势测试。

完整操作与文件分工见 [使用说明](使用说明.md)，实际检查记录见 [测试记录](测试记录.md)，音乐制作说明见 [音乐说明](音乐说明.md)。
