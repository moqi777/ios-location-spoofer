放教程截图的地方，会被打进 Docker 镜像，由 /tutorial/<文件名> 提供。

现在 help-page.js 里引用了这四张，缺哪张页面就显示「（示意图待补）」占位框，不会破图：

  switch-appleid.jpg   设置 → 头像 → 媒体与购买项目 → 退出登录
  skip-2fa.jpg         Apple ID 安全提示 → 其他选项 → 不升级
  mitm-cert.jpg        小火箭 → ⓘ → HTTPS 解密 → 证书 → 生成/安装
  trust-cert.jpg       设置 → 通用 → 关于本机 → 证书信任设置

加图前先压一遍，原图动辄几百 KB，压完 20~80 KB 就够手机看：

  sips -s format jpeg -s formatOptions 70 --resampleWidth 750 原图.png --out 目标.jpg

文件名只能用 [A-Za-z0-9._-]，服务端做了白名单，别的字符一律 404。
