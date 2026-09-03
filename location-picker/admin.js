// 管理后台接口 —— /admin 与 /admin/api/*
//
// 认证走独立的 ADMIN_TOKEN 环境变量，和用户 token 完全分离。
// 没设置 ADMIN_TOKEN 时，本模块直接「装作不存在」（返回 false，由 server.js 走 404），
// 而不是返回 403 —— 免得对外暴露「这里有个后台」。

const crypto = require("crypto");
const fs = require("fs");
const zlib = require("zlib");
const db = require("./db");
const page = require("./admin-page");

const ADMIN_TOKEN = String(process.env.ADMIN_TOKEN || "").trim();

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function enabled() {
  return ADMIN_TOKEN !== "";
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer"       // 别把带 admin token 的 URL 漏给外链
  });
  res.end(body);
}

// 必须收完 Buffer 再整体解码：body += chunk 会对每个 TCP 分片单独 toString("utf8")，
// 一个 3 字节的汉字如果正好跨在分片边界上，两半会各自变成 U+FFFD —— 中文备注无声损坏。
function readBody(req, limit) {
  const max = limit || 1e4;
  return new Promise(function (resolve, reject) {
    const chunks = [];
    var size = 0;
    req.on("data", function (c) {
      size += c.length;
      if (size > max) { req.destroy(); return reject(new Error("body too large")); }
      chunks.push(c);
    });
    req.on("end", function () { resolve(Buffer.concat(chunks).toString("utf8")); });
    req.on("error", reject);
  });
}

// 模块模板里的域名从请求头动态取，以后换服务名不用改代码
function originOf(req) {
  const host = req.headers.host || "localhost";
  const proto = req.headers["x-forwarded-proto"] || (req.socket.encrypted ? "https" : "http");
  return proto + "://" + host;
}

function buildPickerUrl(origin, token) {
  return origin + "/?token=" + token;
}


// 归档文件原样转发，不读进内存 —— 内存占用与文件大小无关
function streamArchive(res, full, name) {
  var st;
  try { st = fs.statSync(full); } catch (e) { return json(res, 404, { error: "not found" }); }
  res.writeHead(200, {
    "Content-Type": "application/gzip",
    "Content-Length": st.size,
    "Content-Disposition": 'attachment; filename="' + name + '"',
    "Cache-Control": "no-store"
  });
  const rs = fs.createReadStream(full);
  rs.on("error", function () { res.destroy(); });
  rs.pipe(res);
}

// 按时间范围导出当前表。三件事必须同时做到：
//   1) 用 id 游标分批取，不能 .all() 把整表拉进内存
//   2) 每批之间 setImmediate 让出事件循环 —— 否则同步循环会把服务器整个卡住，
//      导出 50 万行期间所有人的 /loc.json 都得排队
//   3) 走 zlib 流而不是逐批 gzipSync，让 gzip 和 socket 的背压自然传导上来，
//      顺便还能压成单个 gzip 块，压缩率更好
const EXPORT_BATCH = 1000;

function streamExport(res, fromMs, toMs, filename, tokenId) {
  res.writeHead(200, {
    "Content-Type": "application/gzip",
    "Content-Disposition": 'attachment; filename="' + filename + '"',
    "Cache-Control": "no-store"
  });
  const gz = zlib.createGzip({ level: 6 });
  gz.on("error", function () { res.destroy(); });
  gz.pipe(res);
  res.on("close", function () { gz.destroy(); });

  var afterId = 0;
  var wroteHeader = false;
  function step() {
    if (res.destroyed) return;
    var rows;
    try {
      rows = db.fetchLogBatch(fromMs, toMs, afterId, EXPORT_BATCH, tokenId);
    } catch (e) {
      return gz.destroy();
    }
    if (!wroteHeader) { gz.write(db.CSV_HEADER); wroteHeader = true; }   // 空区间也给个只有表头的 CSV，
    if (!rows.length) return gz.end();                                    // 否则用户分不清「没数据」和「导出坏了」
    afterId = rows[rows.length - 1].id;
    const text = db.rowsToCsv(rows);
    const last = rows.length < EXPORT_BATCH;
    const ok = gz.write(text);
    if (last) return gz.end();
    if (ok) setImmediate(step); else gz.once("drain", step);
  }
  step();
}

// 返回 true = 本模块已处理该请求；false = 不是管理路由，交回 server.js
function handle(req, res, url) {
  if (!enabled()) return false;
  if (url.pathname !== "/admin" && url.pathname.indexOf("/admin/") !== 0) return false;

  const given = url.searchParams.get("token") || req.headers["x-admin-token"] || "";
  if (!safeEqual(given, ADMIN_TOKEN)) {
    // 认证失败也回 404：不确认这个路径的存在
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
    return true;
  }

  const origin = originOf(req);

  // ---- 管理页 ----
  if (url.pathname === "/admin" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer"
    });
    res.end(page.PAGE);
    return true;
  }

  // ---- token 列表 ----
  if (url.pathname === "/admin/api/tokens" && req.method === "GET") {
    const today = db.dayKey(Date.now());
    const rawDb = db.raw();
    db.flushLogs();
    const todayHits = {};
    rawDb.prepare("SELECT token_id, loc_hits, set_hits, errors FROM daily WHERE day = ?")
      .all(today)
      .forEach(function (r) { todayHits[r.token_id] = r; });

    const rows = db.listTokens().map(function (t) {
      const loc = db.readLocation(t.id);
      const h = todayHits[t.id] || {};
      return {
        id: t.id,
        token: t.token,
        label: t.label,
        status: t.status,
        createdAt: t.created_at,
        lastSeenAt: t.last_seen_at,
        location: loc,
        todayLoc: h.loc_hits || 0,
        todaySet: h.set_hits || 0,
        todayErr: h.errors || 0,
        activatedAt: t.activated_at,
        guideOn: db.guideOn(t),
        deviceCount: db.listDevices(t.id).length
      };
    });
    return json(res, 200, { origin: origin, tokens: rows }), true;
  }

  // ---- 新建 token ----
  if (url.pathname === "/admin/api/tokens" && req.method === "POST") {
    readBody(req).then(function (body) {
      var label = "";
      try { label = String(JSON.parse(body || "{}").label || ""); } catch (e) { label = ""; }
      const t = db.createToken(label.slice(0, 40));
      json(res, 200, {
        id: t.id, token: t.token, label: t.label, status: t.status,
        pickerUrl: buildPickerUrl(origin, t.token)
      });
    }).catch(function () { json(res, 400, { error: "bad request" }); });
    return true;
  }

  // ---- 改点历史 ----
  const mh = url.pathname.match(/^\/admin\/api\/tokens\/(\d+)\/history$/);
  if (mh && req.method === "GET") {
    return json(res, 200, {
      tokenId: Number(mh[1]),
      rows: db.listHistory(Number(mh[1]), url.searchParams.get("limit")),
      devices: db.listDevices(Number(mh[1]))
    }), true;
  }

  // ---- 安装引导开关 ----
  const mr = url.pathname.match(/^\/admin\/api\/tokens\/(\d+)\/guide$/);
  if (mr && req.method === "POST") {
    const id = Number(mr[1]);
    readBody(req).then(function (body) {
      var on = false;
      try { on = JSON.parse(body || "{}").on === true; } catch (e) { on = false; }
      const ok = db.setGuide(id, on);
      json(res, ok ? 200 : 404, ok ? { ok: true, on: on } : { error: "not found" });
    }).catch(function () { json(res, 400, { error: "bad request" }); });
    return true;
  }

  // ---- 改备注 / 停用启用 / 删除 ----
  const m = url.pathname.match(/^\/admin\/api\/tokens\/(\d+)$/);
  if (m) {
    const id = Number(m[1]);
    if (req.method === "DELETE") {
      const ok = db.deleteToken(id);
      return json(res, ok ? 200 : 404, ok ? { ok: true } : { error: "not found" }), true;
    }
    if (req.method === "POST" || req.method === "PATCH") {
      readBody(req).then(function (body) {
        var j = {};
        try { j = JSON.parse(body || "{}"); } catch (e) { return json(res, 400, { error: "bad json" }); }
        const fields = {};
        if (j.label !== undefined) fields.label = String(j.label).slice(0, 40);
        if (j.status !== undefined) fields.status = j.status;
        const ok = db.updateToken(id, fields);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { error: "not found" });
      }).catch(function () { json(res, 400, { error: "bad request" }); });
      return true;
    }
  }

  // ---- 看板 ----
  if (url.pathname === "/admin/api/stats" && req.method === "GET") {
    return json(res, 200, db.stats(url.searchParams.get("days"))), true;
  }

  // ---- 日志 ----
  if (url.pathname === "/admin/api/logs" && req.method === "GET") {
    db.flushLogs();
    const out = db.queryLogs({
      tokenId: url.searchParams.get("token_id"),
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
      onlyErrors: url.searchParams.get("errors") === "1",
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset")
    });
    return json(res, 200, out), true;
  }

  // ---- 存储概况（数据库大小 / 行数 / 归档列表） ----
  if (url.pathname === "/admin/api/info" && req.method === "GET") {
    db.flushLogs();
    return json(res, 200, db.info()), true;
  }

  // ---- 代理层数自检 ----
  // TRUST_PROXY_HOPS 设错了不会报错，只会让日志里的 IP 全是基础设施地址——
  // 看着像正常数据，实际上完全没有分辨力（曾经据此得出过错误结论）。
  // 这里把原始转发链和每个跳数会取到的值都列出来，用一台已知公网 IP 的机器
  // 打一下，哪个 hops 取到的是自己的 IP，就该设成几。
  if (url.pathname === "/admin/api/whoami" && req.method === "GET") {
    const xff = String(req.headers["x-forwarded-for"] || "");
    const parts = xff.split(",").map(function (t) { return t.trim(); })
      .filter(function (t) { return t !== ""; });
    const byHop = {};
    for (var h = 1; h <= parts.length; h += 1) byHop[h] = parts[parts.length - h];
    return json(res, 200, {
      xffRaw: xff,
      chain: parts,
      chainLength: parts.length,
      socket: String(req.socket.remoteAddress || "").replace(/^::ffff:/, ""),
      currentHops: proxyHops,
      currentResult: parts.length >= proxyHops
        ? parts[parts.length - proxyHops] : "(回落到 socket)",
      resultByHops: byHop,
      hint: "用已知公网 IP 的机器请求本接口，resultByHops 里等于该 IP 的那个键就是应设的 TRUST_PROXY_HOPS"
    }), true;
  }

  // ---- 下载某个归档文件 ----
  if (url.pathname === "/admin/api/archives/download" && req.method === "GET") {
    const name = url.searchParams.get("f") || "";
    const full = db.archivePathOf(name);
    if (!full) return json(res, 404, { error: "not found" }), true;
    streamArchive(res, full, name);
    return true;
  }

  // ---- 删除某个归档文件 ----
  if (url.pathname === "/admin/api/archives" && req.method === "DELETE") {
    const name = url.searchParams.get("f") || "";
    var ok = false;
    try { ok = db.deleteArchive(name); } catch (e) { ok = false; }
    return json(res, ok ? 200 : 404, ok ? { ok: true } : { error: "not found" }), true;
  }

  // ---- 手动跑一次归档+清理 ----
  if (url.pathname === "/admin/api/archive/run" && req.method === "POST") {
    db.pruneLogs().then(function (r) {
      json(res, 200, r || { error: "db not ready" });
    }, function (e) {
      json(res, 500, { error: e.message });
    });
    return true;
  }

  // ---- 按时间范围导出当前表 ----
  if (url.pathname === "/admin/api/export" && req.method === "GET") {
    db.flushLogs();
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const fromMs = from ? db.dayStartMs(from) : 0;
    const toMs = to ? db.dayStartMs(to) + 86400000 : Date.now() + 86400000;
    if (!isFinite(fromMs) || !isFinite(toMs) || toMs <= fromMs) {
      return json(res, 400, { error: "bad range" }), true;
    }
    // token_id 允许是 0（无效 / 已删除 token 的日志），所以只有 null 和空串才算「不筛」
    const rawTid = url.searchParams.get("token_id");
    var tokenId = null;
    if (rawTid !== null && rawTid !== "") {
      tokenId = Number(rawTid);
      if (!Number.isInteger(tokenId) || tokenId < 0) {
        return json(res, 400, { error: "bad token_id" }), true;
      }
    }
    streamExport(res, fromMs, toMs,
      "logs-" + (from || "all") + "_" + (to || "now") +
      (tokenId === null ? "" : "-token" + tokenId) + ".csv.gz",
      tokenId);
    return true;
  }

  // ---- 收回磁盘空间（重写整个库，慎用） ----
  if (url.pathname === "/admin/api/vacuum" && req.method === "POST") {
    try {
      return json(res, 200, db.vacuum()), true;
    } catch (e) {
      return json(res, 500, { error: e.message }), true;
    }
  }

  return json(res, 404, { error: "not found" }), true;
}

// 跳数由 server.js 注入：解析和回落逻辑只该有一份，抄过来迟早会不同步
var proxyHops = 1;
function setProxyHops(n) { proxyHops = n; }

module.exports = {
  enabled: enabled,
  handle: handle,
  setProxyHops: setProxyHops,
  ADMIN_TOKEN: ADMIN_TOKEN
};
