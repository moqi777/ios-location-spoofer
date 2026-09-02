// 安装教程页 —— /help?token=xxx
//
// 为什么单独一页而不是塞进弹窗：新用户拿到链接时，离「能改定位」还差三步，
// 弹窗里放不下，也不该放。弹窗只负责把人引到这儿来。
//
// 图片走 /tutorial/*.jpg，由服务器自己托管 —— GitHub 图床国内打不开。
// 图还没补齐时 onerror 会把 <img> 换成一个占位框，不至于留一片破图。

const PAGE = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>安装教程</title>
<style>
  :root{--blue:#007aff;--orange:#ff9500;--red:#ff3b30;--line:#e5e5ea;--dim:#8e8e93}
  *{box-sizing:border-box}
  html,body{margin:0;background:#f2f2f7;color:#1c1c1e;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:15px;line-height:1.6}
  header{position:sticky;top:0;z-index:5;background:#f2f2f7;padding:14px 16px 10px;border-bottom:1px solid var(--line)}
  h1{margin:0;font-size:20px}
  header .sub{color:var(--dim);font-size:13px;margin-top:2px}
  main{padding:12px 16px 40px;max-width:680px;margin:0 auto}
  .step{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:14px}
  .step h2{margin:0 0 4px;font-size:17px;display:flex;align-items:center;gap:8px}
  .step h2 .n{flex:0 0 24px;height:24px;border-radius:50%;background:var(--blue);color:#fff;
    font-size:13px;display:flex;align-items:center;justify-content:center;font-weight:700}
  .step .why{color:var(--dim);font-size:13px;margin:0 0 10px 32px}
  ol,ul{margin:8px 0;padding-left:22px}
  .steps{margin:6px 0 10px;padding-left:20px}
  .steps li{margin:3px 0;color:#1c1c1e}
  li{margin:4px 0}
  code{background:#f2f2f7;padding:1px 5px;border-radius:4px;font-size:13px}
  .warn{background:#fff4e5;border:1px solid #ffd8a8;color:#8a4b00;
    border-radius:9px;padding:10px 12px;margin:10px 0;font-size:14px}
  .danger{background:#ffeceb;border:1px solid #ffc9c5;color:#a3231a;
    border-radius:9px;padding:10px 12px;margin:10px 0;font-size:14px}
  .warn b,.danger b{display:block;margin-bottom:2px}
  .disc{margin:8px 0 2px;padding:9px 11px;border-radius:8px;background:#f7f7f9;
    border:1px solid var(--line);color:var(--dim);font-size:12.5px;line-height:1.55}
  a{color:var(--blue)}
  .shot{margin:10px 0;border:1px solid var(--line);border-radius:9px;overflow:hidden;background:#fff}
  .shot img{display:block;width:100%;height:auto}
  .shot .cap{padding:6px 10px;font-size:12px;color:var(--dim);border-top:1px solid var(--line)}
  .ph{padding:26px 12px;text-align:center;color:var(--dim);font-size:13px;background:#fafafa}
  .cta{display:block;text-align:center;padding:14px;border-radius:11px;background:#34c759;
    color:#fff;font-weight:700;font-size:17px;text-decoration:none;margin:14px 0 6px}
  .cta.off{background:#c7c7cc}
  .hint{color:var(--dim);font-size:13px;text-align:center}
  .alt{margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);font-size:13.5px;color:#444}
  .alt b{color:#1c1c1e}
  .copybtn{display:block;width:100%;margin-top:8px;padding:11px;border:1px solid var(--blue);
    border-radius:9px;background:#fff;color:var(--blue);font-size:15px;font-weight:600}
  .copybtn.done{background:var(--blue);color:#fff}
  .back{display:block;text-align:center;padding:13px;border-radius:11px;background:#fff;
    border:1px solid var(--line);color:var(--blue);text-decoration:none;font-weight:600;margin-top:18px}
  .wx{background:var(--red);color:#fff;border-radius:11px;padding:12px 14px;margin-bottom:14px;font-size:15px}
  .wx b{display:block;font-size:16px;margin-bottom:3px}
</style>
</head>
<body>
<header>
  <h1>安装教程</h1>
  <div class="sub">照着做一遍，大约 10 分钟，之后就不用再管了</div>
</header>
<main>
<div id="wxbox"></div>

<div class="step">
  <h2><span class="n">1</span>安装 Shadowrocket（小火箭）</h2>
  <p class="why">这个 App 国区商店没有，得用外区 Apple ID 下载。</p>
  <ol>
    <li>买一个外区 Apple ID。两个渠道，自己挑：
      <ul>
        <li><a href="https://shop66.hi-taobao.top/products/shadowrocket-shared-id-auto-delivery" target="_blank" rel="noopener">贵一点，卖家提供售后</a></li>
        <li><a href="https://www.yuguoid.com/" target="_blank" rel="noopener">便宜，卖家明确不提供售后</a></li>
      </ul>
      <div class="disc">以上两个是<b>第三方平台</b>，和本服务没有任何关系。链接只是方便你找，
        我不参与交易、不经手你的付款、也不了解他们的经营情况。所谓「售后」指的是<b>那家平台自己承诺的售后</b>，
        找他们，不是找我。账号买卖属于第三方与你之间的事，买之前请自行判断，风险自负。</div>
    </li>
    <li>打开 <b>设置 → 顶部你的头像 → 媒体与购买项目 → 退出登录</b></li>
    <li>打开 <b>App Store</b>，登录刚买的外区账号，搜索并下载 Shadowrocket</li>
    <li>下载完成后，<b>立刻按上面的路径退出</b>，换回自己的国区账号</li>
  </ol>
  <div class="danger">
    <b>三条一定要照做</b>
    1、只在「媒体与购买项目」里登录，<b>绝对不要登 iCloud</b>。这类账号是多人共享的，登了 iCloud 等于把通讯录和照片交给陌生人。<br>
    2、登录后如果弹「Apple ID 安全 / 双重认证」，点<b>「其他选项」→「不升级」</b>，不要绑你的手机号。<br>
    3、共享账号容易被风控，登不上就多试几次或等 24 小时。
  </div>
  <div class="shot"><img src="/tutorial/switch-appleid.jpg" alt="切换 Apple ID" onerror="ph(this)"><div class="cap">设置 → 头像 → 媒体与购买项目 → 退出登录</div></div>
  <div class="shot"><img src="/tutorial/skip-2fa.jpg" alt="跳过双重认证" onerror="ph(this)"><div class="cap">弹出安全提示时，选「其他选项」→「不升级」</div></div>
</div>

<div class="step">
  <h2><span class="n">2</span>导入配置</h2>
  <p class="why">一次装好节点规则和定位脚本，点一下就行。</p>
  <div id="ctabox"></div>
</div>

<div class="step">
  <h2><span class="n">3</span>打开 HTTPS 解密</h2>
  <p class="why">不做这步，前面全白装 —— 定位不会变，而且不会有任何报错。</p>
  <ol>
    <li>小火箭首页，点配置文件后面的 <b>ⓘ</b> → <b>HTTPS 解密</b></li>
    <li><b>证书 → 生成新的 CA 证书</b>，再点<b>安装证书</b></li>
    <li>回到系统 <b>设置 → 已下载描述文件 → 安装</b>（要输锁屏密码）</li>
    <li>系统 <b>设置 → 通用 → 关于本机 → 证书信任设置</b>，把 Shadowrocket 那一项的开关<b>打开</b></li>
    <li>回到小火箭，把 <b>HTTPS 解密</b> 的总开关打开</li>
  </ol>
  <div class="warn">
    <b>第 4 步最容易漏</b>
    「证书信任设置」藏在<b>关于本机</b>页面的最底部，装完描述文件不会自动跳过去，得自己翻。这个开关没开，解密就是不生效的。
  </div>
  <div class="shot"><img src="/tutorial/mitm-cert.jpg" alt="生成并安装证书" onerror="ph(this)"><div class="cap">小火箭 → ⓘ → HTTPS 解密 → 证书</div></div>
  <div class="shot"><img src="/tutorial/trust-cert.jpg" alt="信任证书" onerror="ph(this)"><div class="cap">设置 → 通用 → 关于本机 → 证书信任设置</div></div>
</div>

<a class="back" id="backlink" href="#">都弄好了？回到选点页 →</a>
</main>
<script>
var token = new URLSearchParams(location.search).get("token") || "";
var IN_WECHAT = /MicroMessenger/i.test(navigator.userAgent);
function $(id){return document.getElementById(id);}
function ph(img){
  var box = img.parentNode;
  img.remove();
  var d = document.createElement("div");
  d.className = "ph";
  d.textContent = "（示意图待补）";
  box.insertBefore(d, box.firstChild);
}
$("backlink").href = "/?token=" + encodeURIComponent(token);

// 微信内置浏览器唤不起 shadowrocket:// 这类自定义 scheme，点了会毫无反应、
// 也不会报错 —— 而链接偏偏就是微信发的。所以这里必须拦下来明说。
if(IN_WECHAT){
  $("wxbox").innerHTML =
    '<div class="wx"><b>请先用 Safari 打开这个页面</b>' +
    '点右上角「⋯」→「在Safari中打开」。微信里没法唤起小火箭，按钮点了不会有反应。</div>';
  $("ctabox").innerHTML =
    '<a class="cta off" href="javascript:void(0)" onclick="return false">先用 Safari 打开本页</a>' +
    '<div class="hint">右上角「⋯」→「在Safari中打开」</div>';
} else {
  var url = location.origin + "/ios-location-spoofer?token=" + encodeURIComponent(token);

  // 一键导入是做不到的：shadowrocket://install?config= 只能把 App 唤起来，
  // 导入动作它不认；小火箭启动时扫剪贴板那条路实测也不生效。
  // 所以这个按钮只干两件确定能成的事：把链接复制好、把 App 唤起来。
  // 剩下四步必须用户自己点，那就把路径写清楚，别让人在界面里瞎找。
  // 复制要用同步的 execCommand —— clipboard.writeText 是异步的，
  // 等它 resolve 时页面早跳走了，剪贴板还是空的。
  function copySync(text){
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.top = "0"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus(); ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch(e){ ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  $("ctabox").innerHTML =
    '<a class="cta" id="ctago" href="shadowrocket://">复制链接并打开小火箭</a>' +
    '<div class="hint" id="ctahint">点一下，链接会自动复制到剪贴板</div>' +
    '<div class="alt"><b>然后在小火箭里这样做：</b>' +
      '<ol class="steps">' +
        '<li>底部「<b>配置</b>」栏</li>' +
        '<li>右上角 <b>+</b> 号</li>' +
        '<li>粘贴刚才复制好的链接</li>' +
        '<li>点<b>下载</b></li>' +
        '<li>切换到这份配置（点一下让它打勾）</li>' +
      '</ol>' +
      '如果按钮点了没反应、或提示「网址无效」，说明这台手机还没装小火箭，' +
      '先回第一步。链接其实已经复制好了，装完自己打开小火箭按上面五步走也行。' +
    '</div>';

  $("ctago").addEventListener("click", function(){
    copySync(url);
    if(navigator.clipboard && navigator.clipboard.writeText){
      try { navigator.clipboard.writeText(url); } catch(e){}
    }
    $("ctahint").innerHTML = '<b style="color:#34c759">链接已复制</b> —— 在小火箭里按下面五步走';
    // 不 preventDefault：唤起 App 的跳转交给浏览器原生完成最可靠
  });
}
</script>
</body>
</html>`;

module.exports = { PAGE: PAGE };
