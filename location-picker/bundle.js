// 分发物生成 —— 模块 /ios-location-spoofer 和脚本 /location-spoofer.js 的内容都在这里。
//
// 三个东西别混：
//   模块 .module    叠在用户已有配置之上的补丁，只有 [Script] / [Rule] / [MITM]
//   脚本 .js        真正干活的 68KB 代码，被 script-path 指向，小火箭自己去下
//   CA 证书         小火箭里现场生成、装进 iOS 并手动信任的，谁也替不了用户做
//
// 为什么只发模块，不发配置文件：
//   一度是发整份 .conf 的，想着「朋友点一次就全齐」。实测下来那是错的——
//   模板配置里 [Proxy] 一个节点都没有、34 条 RULE-SET 全指向 raw.githubusercontent.com
//   （新用户正因为还没法翻墙才要装这个，根本下不动），真正跟改定位有关的只有
//   [Script]、直连规则、[MITM] hostname 三样，而这三样模块全都能给。
//   代价却是实打实的：要求用户切换配置，可能把他自己配好的节点和规则覆盖掉。
//   改成只发模块之后，用户拿自己的配置（新人就是自带的 default.conf）照用，
//   教程里「切换到这份配置」那一步也随之消失。已实测：%APPEND% 在 default.conf
//   上生效，模块的 [Rule] 也生效。
//
// 一个必须记住的约束：**模块不会自动更新**（已实测）。脚本能，因为 script-path
// 指向我们、小火箭会去拉；但模块本身改了之后，只能让每个用户手动重新导入一次。
// 所以下面的 PATTERN 和 MITM_HOSTS 宁可写宽一点——匹配多几个主机的代价接近零，
// 漏一个主机的代价是「所有人都要重装一遍」。

const fs = require("fs");
const path = require("path");

// 主机部分放宽到整个 ls.apple.com，路径仍然死死限定 /clls/wloc。
// 苹果的定位入口是一个主机池：gs-loc、gsp-ssl、gspe1、gspe19-cn、gspe79、gspe85-cn…
// 成员随时会变，而且国区还有 -cn 变体。既然改一次要全员重装，就别按名字一个个列。
// 过度匹配的风险很小：ls.apple.com 下不走 /clls/wloc 的请求根本进不了脚本。
const PATTERN =
  "^https?:\\/\\/(?:" +
  "gs-loc(?:-cn)?\\.apple\\.com" +
  "|[a-z0-9-]+\\.ls\\.apple\\.com" +
  "|gsp\\d*-ssl\\.apple\\.com" +
  "|bluedot\\.is\\.autonavi\\.com(?:\\.gds\\.alibabadns\\.com)?" +
  ")\\/clls\\/wloc";

// 同理，解密域名用通配符覆盖整个 ls.apple.com，别指望以后能补。
const MITM_HOSTS =
  "gs-loc.apple.com, gs-loc-cn.apple.com, *.ls.apple.com, " +
  "bluedot.is.autonavi.com, bluedot.is.autonavi.com.gds.alibabadns.com";

const SCRIPT_PATH = "/location-spoofer.js";
// 小火箭是拿 URL 最后一段当文件名、再补后缀的。路径写 /module 的话导进去就叫
// 「module.module」，在列表里根本认不出是什么。所以路径本身要起个像样的名字，
// 而且不能带扩展名——带了会变成 xxx.module.module。
const MODULE_PATH = "/ios-location-spoofer";
const SCRIPT_FILE = path.join(__dirname, "location-spoofer.js");

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
    "#!desc=拦截 Apple 定位服务器回应的 GPS 坐标，替换成自定义位置。装在任意配置上都能用。",
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
// 实测过必要性——没有这条时，取坐标的请求会一路掉到 FINAL，被丢给默认代理节点，
// 那个节点一挂定位就静默失效。模块里的规则排在 FINAL 之前，所以一定会先匹配上。
// 裸 IP 得用 IP-CIDR，DOMAIN 匹配不上；本地开发就是这种情况，那就干脆不写这条。
function directRule(origin) {
  const host = hostOf(origin);
  if (!host || /^[\d.]+$/.test(host) || host.indexOf(":") >= 0) return "";
  return "# 定位服务自身直连：选中的节点挂掉时，改坐标和更新脚本也不受影响\n" +
         "DOMAIN," + host + ",DIRECT\n";
}

module.exports = {
  PATTERN: PATTERN,
  MITM_HOSTS: MITM_HOSTS,
  SCRIPT_PATH: SCRIPT_PATH,
  MODULE_PATH: MODULE_PATH,
  scriptBody: function () { return scriptBody; },
  buildModule: buildModule,
  hostOf: hostOf
};
