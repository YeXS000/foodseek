# qzh_code

这是千纸 / QZ Lab 当前 Foodseek H5 MVP 的代码收纳目录。

## 目录

- `app/`: 可直接部署的 H5 前端代码，包含页面、样式、交互逻辑和离线数据包。
- `data/`: 当前 MVP 推荐数据源 JSON；不包含 sqlite 中间库。
- `scripts/`: 数据导出、H5 构建、Playwright 验证和远端部署脚本。
- `deploy/`: 服务器上启动静态 H5 服务的脚本。
- `package.json` / `package-lock.json`: 当前仓库的 Node 依赖记录。

## 当前 MVP 重点

- 快速随机推荐一家吃饭地点。
- 支持换一家轮盘动效。
- 支持地理位置和距离感知推荐。
- 支持不想吃冷却、去吃了记录、没吃过优先。
- 短时间频繁刷新时记录用户反馈问题。
- 地图底图和标点坐标已做 WGS84/GCJ-02/BD-09 兼容处理。

## 没有放进来的东西

- 私钥、密码和服务器凭据。
- `node_modules/`。
- 构建产物 `dist/`，可用 `python scripts/build_h5_bundle.py` 重新生成。
- 截图、临时缓存和 Python `__pycache__`。
