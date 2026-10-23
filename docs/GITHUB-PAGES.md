# 用 GitHub Desktop 发布手机 PWA

仓库目录：`D:\G\limbusbattle`。发布由你在 GitHub Desktop 中执行，本工程没有替你提交、推送或部署。

1. 在 GitHub Desktop 打开这个仓库，填写提交说明并 Commit，然后 Push origin；首次则 Publish repository。
2. 在 GitHub 网页打开仓库 → **Settings → Pages**，将 **Source** 设为 **GitHub Actions**。
3. 推送至 `main` 或 `master` 后，`.github/workflows/pages.yml` 会自动安装依赖、测试、构建并发布 `dist`。也可以在 Actions 中手动运行 **Publish mobile PWA**。
4. 等工作流成功，打开 Pages 页面显示的 **HTTPS 地址**，再用手机访问。项目采用相对资源路径，已验证 `/limbusbattle/` 这样的仓库子路径。

工作流遵循 [GitHub Pages 官方自定义工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。仓库可用性和 Pages 权限由你的 GitHub 账户决定。

## 在手机安装

- **Android**：用 Chrome 或 Edge 打开 HTTPS 地址，点击游戏右上角「安装游戏」，或浏览器菜单 → 安装应用 / 添加到主屏幕。
- **iPhone / iPad**：用 Safari 打开，分享 → 添加到主屏幕。从新图标启动，关闭系统竖排方向锁定并旋转为横屏。
- 首次打开保持联网，等「离线资源已备妥」后再断网。后续可从主屏幕离线运行。
- 浏览器支持时进入战斗会请求全屏、横屏与保持屏幕常亮；不支持方向锁定时显示旋转提示。竖屏遮挡期间战斗暂停，转回横屏后继续。
- 左侧摇杆支持斜方向和滑动搓招；右侧 J/K/E.G.O. 与人格快捷键支持多指。设置中仍可调大小和位置。

安装方式因平台而异，参见 [web.dev PWA 安装指南](https://web.dev/learn/pwa/installation)；方向锁定通常要求移动端全屏，参见 [MDN ScreenOrientation.lock](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock)。电脑 `127.0.0.1` 只是本机预览地址，不能当作手机安装网址。

## 后续更新

开发工作完成后运行 `npm run sync:repo`，将改动同步到上述 GitHub Desktop 仓库。脚本校验 SHA-256，保留 `.git`、无关文件和依赖；遇到目标仓库尚未同步的改动会停止并报告冲突。在该仓库本身工作时不需要复制。

之后你在 GitHub Desktop Commit / Push，工作流再次发布。已安装游戏发现更新会显示「新版本就绪」：先返回终端，打开「手机安装 / 已安装」面板，再点击更新。不会在对战中自动刷新。

## 本地检查

```sh
npm ci
npm run dev
npm test
npm run test:browser
npm run test:pwa
npm run build
npm run preview
```

`test:pwa` 使用独立生产预览，覆盖仓库子路径、断网重载、全部人格贴图、摇杆搓招、旋屏暂停和安装更新。需要预装 Playwright Chromium，或设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE`。

`public/runtime` 已提交预编译的像素帧，CI 不需要 Python。制作原图保存在 `public/characters`，只在换美术时运行 `python scripts/build-pixel-atlases.py`。生产包不含这些大尺寸原图，离线预缓存约 2.5 MiB。
