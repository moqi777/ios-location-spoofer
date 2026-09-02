// 分发物生成 —— 一键配置 /conf、模块 /module、脚本 /location-spoofer.js 的内容都在这里。
//
// 四个东西别混：
//   配置文件 .conf  小火箭的主配置，一次只生效一份，管节点和分流规则
//   模块 .module    叠加在配置之上的小补丁，只有 [Script] 和 [MITM] 两段
//   脚本 .js        真正干活的 68KB 代码，被 script-path 指向，小火箭自己去下
//   CA 证书         小火箭里现场生成、装进 iOS 并手动信任的，谁也替不了用户做
//
// 默认发 .conf：里面已经含了 [Script]，朋友点一次就全齐，不用先导配置再导模块。
// .module 留着给「已经有自己配置文件」的人用，两者共用同一段 [Script] 生成逻辑。

const fs = require("fs");
const path = require("path");

const PATTERN =
  "^https?:\\/\\/(?:gs-loc(?:-cn)?\\.apple\\.com|gsp-ssl\\.ls\\.apple\\.com|" +
  "bluedot\\.is\\.autonavi\\.com(?:\\.gds\\.alibabadns\\.com)?)\\/clls\\/wloc";

const MITM_HOSTS =
  "gs-loc.apple.com, gs-loc-cn.apple.com, gsp-ssl.ls.apple.com, " +
  "bluedot.is.autonavi.com, bluedot.is.autonavi.com.gds.alibabadns.com";

const SCRIPT_PATH = "/location-spoofer.js";
// 小火箭是拿 URL 最后一段当文件名、再补 .conf 后缀的。路径写 /conf 的话
// 导进去就叫「conf.conf」，在配置列表里根本认不出是什么。所以路径本身要起个像样的名字，
// 而且不能带扩展名 —— 带了会变成 xxx.conf.conf。
const CONF_PATH = "/ios-location-spoofer";
const SCRIPT_FILE = path.join(__dirname, "location-spoofer.js");
const CONF_FILE = path.join(__dirname, "shadowrocket.conf");

// 脚本本体读一次留在内存里 —— 68KB，比每次请求都读盘划算得多。
// 文件缺失（比如没打进镜像）不能让进程起不来：路由自己回 404，别的功能照常。
var scriptBody = null;
try {
  scriptBody = fs.readFileSync(SCRIPT_FILE);
} catch (e) {
  console.log("⚠️  " + SCRIPT_FILE + " 不存在，/location-spoofer.js 将返回 404");
}

function scriptLine(origin, token) {
  return (
    "iOS Location Spoofer = type=http-response,pattern=" + PATTERN +
    ",requires-body=1,binary-body-mode=1,max-size=0,timeout=30" +
    ",script-path=" + origin + SCRIPT_PATH +
    ",argument=mode=response&latitude=37.3349&longitude=-122.00902&horizontalAccuracy=39" +
    "&verticalAccuracy=1000&altitude=530&debug=false&configUrl=" +
    origin + "/loc.json?token=" + token
  );
}

function buildModule(origin, token) {
  return [
    "#!name=iOS Location Spoofer",
    "#!desc=拦截 Apple 定位服务器回应的 GPS 坐标，替换成自定义位置。适用于 Shadowrocket。",
    "",
    "[Script]",
    scriptLine(origin, token),
    "",
    "[Rule]",
    directRule(origin).trim(),
    "",
    "[MITM]",
    "hostname = %APPEND% " + MITM_HOSTS,
    ""
  ].join("\n");
}

// 只要主机名：端口不能出现在 DOMAIN 规则里，会让整条规则失效。
function hostOf(origin) {
  return String(origin).replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
}

// 直连规则：节点挂了也能取坐标、更新脚本。
// 裸 IP 得用 IP-CIDR，DOMAIN 匹配不上；本地开发就是这种情况，那就干脆不写这条。
function directRule(origin) {
  const host = hostOf(origin);
  if (!host || /^[\d.]+$/.test(host) || host.indexOf(":") >= 0) return "";
  return "# 定位服务自身直连：选中的节点挂掉时，改坐标和更新脚本也不受影响\n" +
         "DOMAIN," + host + ",DIRECT\n";
}

// 模板只读一次，但注入要按 token 做，所以这里存的是「已经改好结构、token 处留占位符」的版本。
var confTemplate = null;
var confError = "";

function loadConf() {
  if (confTemplate !== null || confError) return;
  var raw;
  try {
    raw = fs.readFileSync(CONF_FILE, "utf8");
  } catch (e) {
    confError = "配置模板缺失：" + CONF_FILE;
    console.log("⚠️  " + confError + "，/conf 将返回 404");
    return;
  }

  // 1) 改掉 update-url。原值指向 lazy.conf 的作者仓库 —— 小火箭一更新配置就会
  //    从那儿拉一份干净的回来，把我们注入的 [Script] 和苹果域名全冲掉，而且是静默的。
  //    指向自己之后，更新反而变成好事：内容永远是最新的、带着正确的 token。
  raw = raw.replace(
    /^update-url\s*=.*$/m,
    "update-url = __ORIGIN__" + CONF_PATH + "?token=__TOKEN__"
  );

  // 2) 自己的域名直连，插在 [Rule] 最前面。规则是从上往下匹配的，
  //    放后面会被那一堆 RULE-SET 里的 Global.list 先抢走判成 PROXY。
  raw = raw.replace(/^\[Rule\]$/m, "[Rule]\n__DIRECT_RULE__");

  // 3) [Script] 段。原配置里没有这一段，插在 [MITM] 前面（惯例位置）。
  raw = raw.replace(
    /^\[MITM\]$/m,
    "[Script]\n" +
    "__SCRIPT_LINE__\n\n" +
    "[MITM]"
  );

  confTemplate = raw;
}

function buildConf(origin, token) {
  loadConf();
  if (!confTemplate) return null;
  return confTemplate
    .split("__DIRECT_RULE__").join(directRule(origin))
    .split("__SCRIPT_LINE__").join(scriptLine(origin, token))
    .split("__ORIGIN__").join(origin)
    .split("__HOST__").join(hostOf(origin))
    .split("__TOKEN__").join(token);
}

module.exports = {
  PATTERN: PATTERN,
  MITM_HOSTS: MITM_HOSTS,
  SCRIPT_PATH: SCRIPT_PATH,
  CONF_PATH: CONF_PATH,
  scriptBody: function () { return scriptBody; },
  buildModule: buildModule,
  buildConf: buildConf,
  hostOf: hostOf
};
