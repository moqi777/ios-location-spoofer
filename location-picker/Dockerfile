# Node 24：node:sqlite 已转正，不再需要 --experimental-sqlite，依然零 npm 依赖
FROM node:24-alpine

RUN mkdir -p /data

WORKDIR /app
COPY server.js db.js admin.js admin-page.js bundle.js help-page.js ./
# 脚本本体和配置模板要自托管：raw.githubusercontent.com 国内打不开，
# 放 GitHub 等于让每个朋友都得先翻墙才能装上
COPY location-spoofer.js ./
COPY tutorial ./tutorial

# 坐标、token、日志都在 /data/app.db 里，挂 Volume 到 /data 即可持久化
ENV DATA_FILE=/data/loc.json
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]
