// 安装教程页 —— /help?token=xxx
//
// 为什么单独一页而不是塞进弹窗：新用户拿到链接时，离「能改定位」还差四步，
// 弹窗里放不下，也不该放。弹窗只负责把人引到这儿来。
//
// 图片走 /tutorial/*.jpg，由服务器自己托管 —— GitHub 图床国内打不开。
// src 上的 ?v=__ASSETV__ 由 server.js 启动时替换成 tutorial/ 目录的内容哈希：
// 图片是七天强缓存 + 固定文件名，不带版本的话换了图老用户永远看不到新的。
// 全部 loading=lazy：26 张共 528KB，不懒加载的话开页就得等半天。
// 图还没补齐时 onerror 会把 <img> 换成一个占位框，不至于留一片破图。
//
// 排版铁律：页面顺序必须等于用户手上的操作顺序。提醒和截图都贴在它所属的
// 那一步旁边，不能攒到段落末尾——否则读者做到一半会撞见后面才用得上的东西，
// 以为自己漏了什么。同一句话也不要既写在正文又写进图注。
//
// 截图里的隐私已经在生成时裁掉了：关于本机那张切到只剩「证书信任设置」一行
// （原图有 IMEI/ICCID/MEID），首页那张只留顶部开关（原图有机场订阅名和流量）。
// 以后换图记得也过一遍这两处。

const PAGE = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>安装教程</title>
<style>
  :root{--blue:#007aff;--green:#34c759;--red:#ff3b30;--line:#e5e5ea;--dim:#8e8e93}
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
  .steps li{margin:3px 0}
  li{margin:4px 0}
  code{background:#f2f2f7;padding:1px 5px;border-radius:4px;font-size:13px}
  .warn{background:#fff4e5;border:1px solid #ffd8a8;color:#8a4b00;
    border-radius:9px;padding:10px 12px;margin:10px 0;font-size:14px}
  .danger{background:#ffeceb;border:1px solid #ffc9c5;color:#a3231a;
    border-radius:9px;padding:10px 12px;margin:10px 0;font-size:14px}
  .warn b,.danger b{display:block;margin-bottom:2px}
  .warn b.i,.danger b.i{display:inline;margin:0}
  .disc{margin:8px 0 2px;padding:9px 11px;border-radius:8px;background:#f7f7f9;
    border:1px solid var(--line);color:var(--dim);font-size:12.5px;line-height:1.55}
  a{color:var(--blue)}
  /* 版本分叉：两条路径并排放，让人一眼看出自己该走哪条 */
  .ver{border:1px solid var(--line);border-radius:10px;margin:10px 0;overflow:hidden}
  .ver .vh{padding:8px 11px;font-size:13.5px;font-weight:700;background:#eef5ff;color:#0a4b9c;
    border-bottom:1px solid var(--line)}
  .ver.old .vh{background:#f4f4f6;color:#4a4a4f}
  .ver .vb{padding:10px 12px;font-size:14px}
  .ver .vb .path{font-weight:600;line-height:1.75}
  .shot{margin:10px 0;border:1px solid var(--line);border-radius:9px;overflow:hidden;background:#fff}
  .shot img{display:block;width:100%;height:auto}
  .shot .cap{padding:6px 10px;font-size:12px;color:var(--dim);border-top:1px solid var(--line)}
  /* 第三步 20 张图：两列卡片，每张自带序号和一句话，比长列表好扫 */
  /* align-items:start —— 有的截图裁得很矮（比如第 14 步只剩一行），
     默认的 stretch 会把它拉到跟同行那张一样高，卡片里空出一大块白 */
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin:10px 0 4px;align-items:start}
  .g{background:#fff;border:1px solid var(--line);border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
  .g img{width:100%;display:block;background:#fafafa;cursor:zoom-in}
  .g .cap{padding:6px 8px;font-size:12px;line-height:1.5;color:#3a3a3c;flex:1}
  .g .cap i,.shot .cap i{font-style:normal;display:inline-flex;align-items:center;justify-content:center;
    width:17px;height:17px;border-radius:50%;background:var(--blue);color:#fff;
    font-size:11px;font-weight:700;margin-right:4px;vertical-align:-3px}
  .cap i.r{background:var(--red)}
  .ph{padding:26px 12px;text-align:center;color:var(--dim);font-size:13px;background:#fafafa}
  .cta{display:block;text-align:center;padding:14px;border-radius:11px;background:var(--green);
    color:#fff;font-weight:700;font-size:17px;text-decoration:none;margin:14px 0 6px}
  .cta.off{background:#c7c7cc}
  .hint{color:var(--dim);font-size:13px;text-align:center}
  .alt{margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);font-size:13.5px;color:#444}
  .alt b{color:#1c1c1e}
  .back{display:block;text-align:center;padding:13px;border-radius:11px;background:#fff;
    border:1px solid var(--line);color:var(--blue);text-decoration:none;font-weight:600;margin-top:18px}
  .wx{background:var(--red);color:#fff;border-radius:11px;padding:12px 14px;margin-bottom:14px;font-size:15px}
  .wx b{display:block;font-size:16px;margin-bottom:3px}
  .faq{margin:10px 0 0}
  .faq dt{font-weight:700;font-size:14.5px;margin-top:12px}
  .faq dd{margin:3px 0 0;font-size:14px;color:#3a3a3c}
  /* 点图放大：教程截图缩到半屏后细节看不清，得能点开 */
  #lb{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:50;display:none;
    align-items:center;justify-content:center;padding:16px}
  #lb.on{display:flex}
  #lb img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px}
  #lb .x{position:absolute;top:12px;right:16px;color:#fff;font-size:30px;line-height:1;
    background:none;border:none;padding:6px}
</style>
</head>
<body>
<header>
  <h1>安装教程</h1>
  <div class="sub">照着做一遍，大约 15 分钟，之后就不用再管了</div>
</header>
<main>
<div id="wxbox"></div>

<div class="step">
  <h2><span class="n">1</span>安装 Shadowrocket（小火箭）</h2>
  <p class="why">这个 App 国区商店没有，得先把 App Store 换成外区账号才能下。</p>

  <ol>
    <li><b>买一个外区 Apple ID。</b>两个渠道，自己挑：
      <ul>
        <li><a href="https://shop66.hi-taobao.top/products/shadowrocket-shared-id-auto-delivery" target="_blank" rel="noopener">贵一点，卖家提供售后</a></li>
        <li><a href="https://www.yuguoid.com/" target="_blank" rel="noopener">便宜，卖家明确不提供售后</a></li>
      </ul>
      <div class="disc">以上两个是<b>第三方平台</b>，和本服务没有任何关系。链接只是方便你找，
        我不参与交易、不经手你的付款、也不了解他们的经营情况。所谓「售后」指的是<b>那家平台自己承诺的售后</b>，
        找他们，不是找我。账号买卖属于第三方与你之间的事，买之前请自行判断，风险自负。</div>
    </li>
    <li><b>退出你现在的 App Store 账号。</b>
      <span style="color:var(--red)">这一步不同系统版本路径不一样</span>，往下看。</li>
  </ol>

  <div class="warn">
    <b>先确认自己是什么版本</b>
    <b class="i">设置 → 通用 → 关于本机 → 系统版本</b>。iOS 26.4 是分界线，走错路径会找不到那个入口。
  </div>

  <div class="ver">
    <div class="vh">iOS 26.4 及以上 —— 入口挪到「设置」里了</div>
    <div class="vb">
      <div class="path">设置 → 顶部你的名字（Apple 账户）<br>→ 媒体与购买项目 → 退出登录</div>
      <div class="shot" style="margin-bottom:0">
        <img src="/tutorial/s1a-signout-new.jpg?v=__ASSETV__" alt="iOS 26.4 及以上退出方式" loading="lazy" onerror="ph(this)">
      </div>
    </div>
  </div>

  <div class="ver old">
    <div class="vh">iOS 26.4 以下 —— 老办法，在 App Store 里退</div>
    <div class="vb">
      <div class="path">打开 App Store → 右上角头像<br>→ 一直往下滑到最底 → 退出登录</div>
      <div class="shot" style="margin-bottom:0">
        <img src="/tutorial/s1b-signout-old.jpg?v=__ASSETV__" alt="旧版本退出方式" loading="lazy" onerror="ph(this)">
      </div>
    </div>
  </div>

  <div class="danger">
    <b>「媒体与购买项目」不是 iCloud</b>
    它只是 App Store 下载应用用的那个账号。这类账号是多人共享的，
    <b class="i">千万不要拿它登 iCloud、也不要开同步</b> —— 那等于把通讯录和照片交给陌生人。
  </div>

  <ol start="3">
    <li><b>打开 App Store，用刚买的外区账号登录。</b></li>
  </ol>

  <div class="warn">
    <b>登不上很正常</b>
    共享账号容易被风控，多试几次或等 24 小时再试。密码错了别硬试，会锁。
  </div>

  <ol start="4">
    <li><b>登录后会弹「Apple ID 安全 / 双重认证」</b>，
      必须点<b>「其他选项」→「不升级」</b>，<b>不要</b>绑你的手机号。</li>
  </ol>

  <div class="shot">
    <img src="/tutorial/s1c-skip2fa.jpg?v=__ASSETV__" alt="跳过双重认证" loading="lazy" onerror="ph(this)">
    <div class="cap">左边先点「其他选项」，右边再点「不升级」</div>
  </div>

  <ol start="5">
    <li><b>搜索 Shadowrocket，下载。</b></li>
    <li>下载完成后，<b>立刻按第 2 步同样的路径退出</b>外区账号，换回自己的国区账号，
      之后照常更新国区 App。</li>
  </ol>
</div>

<div class="step">
  <h2><span class="n">2</span>导入配置</h2>
  <p class="why">一次装好分流规则和定位脚本，你的专属链接已经在按钮里了。</p>
  <div id="ctabox"></div>
</div>

<div class="step">
  <h2><span class="n">3</span>打开 HTTPS 解密</h2>
  <p class="why">不做这步，前面全白装 —— 定位不会变，而且不会有任何报错。</p>
  <div class="warn">
    <b>二十一步看着吓人，其实一路点「下一步」</b>
    真正容易漏的只有第 <b class="i">14</b> 步：「证书信任设置」藏在<b class="i">关于本机</b>页面的<b class="i">最底部</b>，
    装完描述文件不会自动跳过去，得自己翻下去。这个开关没开，解密就是不生效的。
  </div>
  <div class="grid">
    <div class="g"><img src="/tutorial/s3-01.jpg?v=__ASSETV__" alt="1" loading="lazy" onerror="ph(this)"><div class="cap"><i>1</i>底部「配置」栏，先切到这份配置让它打勾，再点右边的 ⓘ</div></div>
    <div class="g"><img src="/tutorial/s3-02.jpg?v=__ASSETV__" alt="2" loading="lazy" onerror="ph(this)"><div class="cap"><i>2</i>找到「HTTPS 解密」，点进去</div></div>
    <div class="g"><img src="/tutorial/s3-03.jpg?v=__ASSETV__" alt="3" loading="lazy" onerror="ph(this)"><div class="cap"><i>3</i>把最上面的「HTTPS 解密」开关打开</div></div>
    <div class="g"><img src="/tutorial/s3-04.jpg?v=__ASSETV__" alt="4" loading="lazy" onerror="ph(this)"><div class="cap"><i>4</i>开关一打开会自己弹出「证书」页，点「安装证书」</div></div>
    <div class="g"><img src="/tutorial/s3-05.jpg?v=__ASSETV__" alt="5" loading="lazy" onerror="ph(this)"><div class="cap"><i>5</i>弹「正尝试下载配置描述文件」，点<b>允许</b></div></div>
    <div class="g"><img src="/tutorial/s3-06.jpg?v=__ASSETV__" alt="6" loading="lazy" onerror="ph(this)"><div class="cap"><i>6</i>提示「已下载描述文件」，点<b>关闭</b></div></div>
    <div class="g"><img src="/tutorial/s3-07.jpg?v=__ASSETV__" alt="7" loading="lazy" onerror="ph(this)"><div class="cap"><i>7</i>回系统「设置 → 通用 → VPN 与设备管理」</div></div>
    <div class="g"><img src="/tutorial/s3-08.jpg?v=__ASSETV__" alt="8" loading="lazy" onerror="ph(this)"><div class="cap"><i>8</i>点「已下载的描述文件」里的 Shadowrocket</div></div>
    <div class="g"><img src="/tutorial/s3-09.jpg?v=__ASSETV__" alt="9" loading="lazy" onerror="ph(this)"><div class="cap"><i>9</i>右上角「安装」，要输锁屏密码</div></div>
    <div class="g"><img src="/tutorial/s3-10.jpg?v=__ASSETV__" alt="10" loading="lazy" onerror="ph(this)"><div class="cap"><i>10</i>警告页再点一次右上角「安装」</div></div>
    <div class="g"><img src="/tutorial/s3-11.jpg?v=__ASSETV__" alt="11" loading="lazy" onerror="ph(this)"><div class="cap"><i>11</i>底部弹窗再点一次「安装」</div></div>
    <div class="g"><img src="/tutorial/s3-12.jpg?v=__ASSETV__" alt="12" loading="lazy" onerror="ph(this)"><div class="cap"><i>12</i>显示「已安装描述文件」，点右上角「完成」</div></div>
    <div class="g"><img src="/tutorial/s3-13.jpg?v=__ASSETV__" alt="13" loading="lazy" onerror="ph(this)"><div class="cap"><i>13</i>回「设置 → 通用 → 关于本机」</div></div>
    <div class="g"><img src="/tutorial/s3-14.jpg?v=__ASSETV__" alt="14" loading="lazy" onerror="ph(this)"><div class="cap"><i>14</i><b style="color:var(--red)">最容易漏</b>：一直滑到<b>最底部</b>，点「证书信任设置」</div></div>
    <div class="g"><img src="/tutorial/s3-15.jpg?v=__ASSETV__" alt="15" loading="lazy" onerror="ph(this)"><div class="cap"><i>15</i>把 Shadowrocket 那一项的开关打开</div></div>
    <div class="g"><img src="/tutorial/s3-16.jpg?v=__ASSETV__" alt="16" loading="lazy" onerror="ph(this)"><div class="cap"><i>16</i>弹根证书警告，点「继续」</div></div>
    <div class="g"><img src="/tutorial/s3-17.jpg?v=__ASSETV__" alt="17" loading="lazy" onerror="ph(this)"><div class="cap"><i>17</i>回到小火箭，左上角 ✕ 关掉这个空白页</div></div>
    <div class="g"><img src="/tutorial/s3-18.jpg?v=__ASSETV__" alt="18" loading="lazy" onerror="ph(this)"><div class="cap"><i>18</i>证书这里变成「<b>系统已信任</b>」，点右上角 ✓</div></div>
    <div class="g"><img src="/tutorial/s3-19.jpg?v=__ASSETV__" alt="19" loading="lazy" onerror="ph(this)"><div class="cap"><i>19</i>确认「HTTPS 解密」开关是开的，点右上角 ✓ 保存</div></div>
    <div class="g"><img src="/tutorial/s3-20.jpg?v=__ASSETV__" alt="20" loading="lazy" onerror="ph(this)"><div class="cap"><i>20</i>左上角返回，解密就配好了</div></div>
  </div>
  <div class="hint" style="text-align:left;margin:8px 0 0">图看不清？点一下可以放大。</div>

  <div class="shot">
    <img src="/tutorial/s3-21.jpg?v=__ASSETV__" alt="21" loading="lazy" onerror="ph(this)">
    <div class="cap"><i>21</i>回首页，把最上面那个开关打开。会弹一次「允许添加 VPN 配置」，点允许。到这儿就全装完了</div>
  </div>
  <div class="warn">
    <b>顺便说一下小火箭是干嘛的</b>
    它本行是个代理工具，我们只是借它的脚本功能来改定位 ——
    <b class="i">不订阅任何节点也能改定位</b>，首页空着就行。
    如果你还想拿它翻墙，那就得另外买机场订阅节点，<b class="i">找管理员买</b>，配好了直接能用。
  </div>
</div>

<div class="step">
  <h2><span class="n">4</span>开始改定位</h2>
  <p class="why">前面都是一次性的，以后每次改定位只用做这一步。</p>

  <div class="warn">
    <b>选点页在哪</b>
    就是<b class="i">本页最下面</b>那个「都弄好了？回到选点页 →」按钮。
    以后直接存管理员发你的那个链接，打开就是选点页。
  </div>

  <div class="shot">
    <img src="/tutorial/s4-pick.jpg?v=__ASSETV__" alt="选点页用法" loading="lazy" onerror="ph(this)">
    <div class="cap"><i class="r">1</i>输入地名，点「搜」　<i class="r">2</i><b>在地图上点一下</b>，蓝色标记落到你要的位置　<i class="r">3</i>点「保存定位」</div>
  </div>

  <div class="warn" style="background:#eaf5ff;border-color:#b9dbff;color:#0a4b9c">
    <b>还没完，第 4 下最关键</b>
    保存完<b class="i">一定要去把「定位服务」关掉再打开</b>：<br>
    <b class="i">设置 → 隐私与安全性 → 定位服务</b>，开关关一下再开。<br>
    iOS 会把上一次算出来的位置缓存住，不刷这一下，App 里看到的还是旧位置。<b class="i">每次改点都要做。</b>
  </div>
  <div class="shot">
    <img src="/tutorial/fix-loccache.jpg?v=__ASSETV__" alt="刷新系统定位缓存" loading="lazy" onerror="ph(this)">
    <div class="cap"><i class="r">4</i>设置 → 隐私与安全性 → 定位服务，关掉再打开</div>
  </div>
</div>

<div class="step">
  <h2 style="margin-bottom:8px">常见问题</h2>
  <dl class="faq">
    <dt>保存了，但手机上的定位没变</dt>
    <dd>按顺序排查：<br>
      1、第 4 步那个「<b>定位服务</b>关掉再打开」做了吗（最常见，漏了就一直是旧位置）；<br>
      2、小火箭首页那个总开关开了吗；<br>
      3、第 3 步的<b>证书信任设置</b>开了吗；<br>
      4、都做了还是旧的，等几分钟 —— 脚本本地也有 5 分钟缓存，
        想立刻生效就把小火箭开关关了再开。</dd>

    <dt>在户外就不准，在室内才对</dt>
    <dd>这是原理限制。我们改的是苹果的 <b>Wi-Fi / 基站</b> 定位结果，
      手机只要能收到 GPS 卫星信号，系统就优先信 GPS，伪造的结果会被盖掉。
      室内、或者开飞行模式只连 Wi-Fi 时最稳。</dd>

    <dt>提示「网址无效」，按钮点了没反应</dt>
    <dd>这台手机还没装小火箭，回第 1 步。链接其实已经复制到剪贴板了，
      装完自己打开小火箭粘贴也一样。</dd>

    <dt>换手机了，或者重装了小火箭</dt>
    <dd>需要重新配置导入，联系管理员处理。</dd>
  </dl>
</div>

<a class="back" id="backlink" href="#">都弄好了？回到选点页 →</a>
</main>

<div id="lb"><button class="x" id="lbx" aria-label="关闭">&times;</button><img id="lbi" alt=""></div>

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

// 点图放大。缩到半屏的截图里那些小字根本认不出来，没这个等于没图。
var lb = $("lb"), lbi = $("lbi");
document.addEventListener("click", function(e){
  var t = e.target;
  if(t && t.tagName === "IMG" && t.id !== "lbi" && t.closest(".g, .shot")){
    lbi.src = t.src; lb.classList.add("on");
    return;
  }
  if(t === lb || t.id === "lbx"){ lb.classList.remove("on"); lbi.src = ""; }
});

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
  // 剩下五步必须用户自己点，那就把路径写清楚，别让人在界面里瞎找。
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
