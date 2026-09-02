放教程截图的地方，会被打进 Docker 镜像，由 /tutorial/<文件名> 提供。

help-page.js 引用了下面这些。缺哪张页面就显示「（示意图待补）」占位框，不会破图。

第一步 安装小火箭
  s1a-signout-new.jpg   iOS 26.4+：设置 → Apple 账户 → 媒体与购买项目 → 退出登录
  s1b-signout-old.jpg   iOS 26.4 以下：App Store → 头像 → 拉到最底 → 退出登录
  s1c-skip2fa.jpg       Apple ID 安全提示 → 其他选项 → 不升级

第二步 导入配置（无图，就是一个按钮加五步手动操作）

第三步 打开 HTTPS 解密（21 张，顺序就是操作顺序）
  s3-01.jpg  切到本配置并点 ⓘ          s3-11.jpg  底部弹窗再点安装
  s3-02.jpg  进 HTTPS 解密              s3-12.jpg  已安装 → 完成
  s3-03.jpg  打开总开关                 s3-13.jpg  设置 → 通用 → 关于本机
  s3-04.jpg  证书 → 安装证书            s3-14.jpg  最底部 → 证书信任设置
  s3-05.jpg  允许下载描述文件           s3-15.jpg  打开 Shadowrocket 信任开关
  s3-06.jpg  已下载 → 关闭              s3-16.jpg  根证书警告 → 继续
  s3-07.jpg  设置 → VPN 与设备管理      s3-17.jpg  回小火箭，✕ 关掉空白页
  s3-08.jpg  点 Shadowrocket 描述文件   s3-18.jpg  证书显示「系统已信任」→ ✓
  s3-09.jpg  右上角安装                 s3-19.jpg  HTTPS 解密页 → ✓ 保存
  s3-10.jpg  警告页再点安装             s3-20.jpg  返回，解密配好
  s3-21.jpg  回首页把总开关打开（原 s2-enable.jpg）

第四步 / 常见问题
  s4-pick.jpg           选点页：搜地址 → 选地图源 → 保存定位
  fix-loccache.jpg      设置 → 定位服务，关掉再打开（清系统定位缓存）

---

加图前先压一遍。当前这批是 460px 宽、JPEG 质量 70，单张 10~38 KB，26 张共 528 KB：

  sips -s format jpeg -s formatOptions 70 -Z 460 原图.png --out 目标.jpg

裁剪（sips 的 --cropOffset 是左上角绝对坐标，但**宽度等于原图宽度时会被忽略、
退回居中裁剪**，所以宽度要比原图小至少 2px）：

  sips -c 高 宽 --cropOffset Y X 原图.png --out 目标.png

**换图必须先过一遍隐私**。这批里有两张原图带敏感信息，已经靠裁剪去掉了：
  s3-14  原图是「关于本机」整页，带 IMEI / ICCID / MEID —— 只保留最底一行
  s3-21  原图是小火箭首页，带机场订阅名、流量和到期时间 —— 只保留顶部开关

文件名只能用 [A-Za-z0-9._-]，服务端做了白名单，别的字符一律 404。
