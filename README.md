# foodseek

杭州美食推荐数据整理、地图补全和 H5 浏览器。

## 数据文件

- `data/hangzhou_food_recommendations.json`：从图片抽取的原始 99 家店数据。
- `data/hangzhou_food_recommendations.sqlite`：原始数据生成的 SQLite。
- `data/hangzhou_food_recommendations_enriched.json`：地理信息补全副本，不改动原始数据。
- `data/hangzhou_food_recommendations_enriched.sqlite`：enriched 副本生成的 SQLite。

## 生成副本

```powershell
python scripts/create_enrichment_copy.py
python scripts/build_food_db.py --input data/hangzhou_food_recommendations_enriched.json --output data/hangzhou_food_recommendations_enriched.sqlite
```

## 补全地图位置

当前 Codex 环境没有加载高德/百度地图 MCP。脚本支持高德 Web 服务 API 和百度地图 Web 服务 API，提供 key 后运行：

```powershell
$env:AMAP_WEB_SERVICE_KEY="你的高德Web服务Key"
$env:BAIDU_MAP_AK="你的百度地图AK"
python scripts/enrich_food_locations.py --provider both --only-pending
python scripts/build_food_db.py --input data/hangzhou_food_recommendations_enriched.json --output data/hangzhou_food_recommendations_enriched.sqlite
python scripts/export_h5_data.py
```

坐标说明：

- 高德候选点保存为 `GCJ-02`。
- 百度候选点保存为 `BD-09`。
- `location_enrichment.selected_location` 是当前选中的候选点。
- `location_enrichment.providers.*.candidates` 保留候选列表，方便人工复核。

## H5 页面

```powershell
python scripts/export_h5_data.py
python -m http.server 5173 -d app
```

打开 `http://localhost:5173`。

页面会优先使用 enriched 文件里的精确点位；没有精确坐标时，使用原图地址/商圈的粗略锚点显示在地图上。

## 部署到服务器 8089

目标服务器：

- Host: `74.176.80.124`
- SSH/SFTP 用户: `yeenjia`
- SSH 端口: `22`
- H5 服务端口: `8089`
- 远端目录: `/home/yeenjia/foodseek-h5/current`

先本地打包：

```powershell
python scripts/build_h5_bundle.py
python -m http.server 5173 -d dist/foodseek
```

确认 `http://localhost:5173` 正常后，再上传到服务器：

```powershell
.\scripts\deploy_h5.ps1 -KeyPath "D:\path\to\yeenjia-vir_key.pem"
```

上传并启动远端 8089 服务：

```powershell
.\scripts\deploy_h5.ps1 -KeyPath "D:\path\to\yeenjia-vir_key.pem" -StartRemoteService
```

启动成功后访问：

```text
http://74.176.80.124:8089
```

注意：服务器安全组、防火墙或 `ufw` 需要放行 TCP `8089` 入站，否则服务启动了外网也打不开。
