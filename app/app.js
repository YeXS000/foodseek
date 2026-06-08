const payload = window.FOODSEEK_DATA || { metadata: {}, shops: [] };
const shops = payload.shops || [];

const AREA_ANCHORS = {
  "西湖": [30.244, 120.146],
  "连锁": [30.255, 120.162],
  "金街美地": [30.159, 120.079],
  "象山国际": [30.161, 120.083],
  "奥莱金街": [30.157, 120.077],
  "首尔印象": [30.162, 120.081],
  "象山路西街": [30.160, 120.076],
  "集贸路": [30.159, 120.085],
  "袁浦路": [30.097, 120.088],
  "之江商务中心": [30.168, 120.093],
  "南街停车场": [30.156, 120.082],
  "象山站 D 口": [30.158, 120.084],
  "龙坞": [30.177, 120.043],
  "BAC 艺术社区": [30.155, 120.069],
  "星光荟": [30.166, 120.082],
  "金华南路": [30.291, 120.144],
  "大关大润发": [30.306, 120.155],
  "野风现代之窗": [30.286, 120.160],
  "拱墅万达金街": [30.337, 120.147],
  "信义坊": [30.289, 120.148],
  "景芳": [30.269, 120.205],
  "原工大垃圾街": [30.291, 120.168],
  "铂悦城": [30.357, 120.070],
  "屏峰": [30.236, 120.041],
  "石马": [30.226, 120.055],
  "萧山": [30.184, 120.264],
  "九堡": [30.309, 120.273],
  "三墩": [30.328, 120.087],
  "香积寺路": [30.304, 120.173],
  "大关": [30.310, 120.151],
  "上塘路": [30.309, 120.161],
  "东和": [30.238, 120.043],
  "UN 公社": [30.232, 120.044],
  "小和山新苑": [30.237, 120.035],
  "良渚": [30.379, 120.046],
  "七贤山居": [30.232, 120.059],
  "三墩新天地": [30.322, 120.088],
  "永旺梦乐城": [30.365, 120.046],
  "中大银泰": [30.322, 120.184],
  "海外海": [30.305, 120.144],
  "河东路": [30.289, 120.170],
  "康康谷": [30.323, 120.158],
  "新塘路": [30.269, 120.211],
  "高教园": [30.233, 120.044],
  "西联广场": [30.272, 120.075],
  "西文街": [30.322, 120.176],
  "新天地": [30.322, 120.178],
  "海创园": [30.279, 120.014],
  "乐堤港": [30.306, 120.119],
  "西和": [30.237, 120.039],
  "西子丁兰": [30.351, 120.211],
  "剑桥公社": [30.322, 120.175],
  "善贤人家": [30.309, 120.170],
  "胜利河美食街": [30.308, 120.154],
  "西溪印象城": [30.275, 120.071],
};

const PREFERENCES = [
  { id: "beef", label: "牛肉", keywords: ["黄牛", "牛肉", "吊龙", "牛杂", "牛腩", "牛排", "牛百叶", "牛骨髓", "生牛肉"] },
  { id: "seafood", label: "海鲜", keywords: ["虾", "蟹", "鱼", "蛤", "螺", "蚝", "海鲜", "带鱼", "黄鱼", "鲳鱼"] },
  { id: "noodles", label: "粉面", keywords: ["面", "粉", "馄饨", "拌川", "烧卖"] },
  { id: "hotpot", label: "火锅", keywords: ["火锅", "锅", "羊肉炉", "鸡公煲", "砂锅", "涮"] },
  { id: "bbq", label: "烧烤", keywords: ["烧烤", "烤", "羊肉串", "烤鱼", "烤冷面"] },
  { id: "spicy", label: "重辣", keywords: ["辣", "川菜", "湘", "麻辣", "水煮", "酸菜鱼", "黄喉"] },
  { id: "vegetable", label: "素菜", keywords: ["素菜", "空心菜", "木耳", "蕨菜", "豆腐", "包菜", "茄子"] },
  { id: "late", label: "夜宵", keywords: ["夜", "小龙虾", "烧烤", "大排档", "生蚝", "螺蛳"] },
];

const NEARBY_RADII_KM = [2, 4, 7, 12];
const DISTANCE_FALLBACK_KM = 80;
const WHEEL_PREVIEW_COUNT = 6;
const WHEEL_SPIN_MS = 1050;
const BASEMAP_STORAGE_KEY = "foodseek-basemap";
const COOLDOWN_STORAGE_KEY = "foodseek-cooldowns";
const VISITED_STORAGE_KEY = "foodseek-visited";
const FEEDBACK_STORAGE_KEY = "foodseek-reroll-feedback";
const UNVISITED_STORAGE_KEY = "foodseek-unvisited-first";
const COOLDOWN_MS = 1000 * 60 * 60 * 24;
const RAPID_REROLL_WINDOW_MS = 1000 * 60;
const RAPID_REROLL_THRESHOLD = 5;
const FEEDBACK_COOLDOWN_MS = 1000 * 60 * 30;
const GCJ_A = 6378245.0;
const GCJ_EE = 0.00669342162296594323;
const BD_X_PI = (Math.PI * 3000.0) / 180.0;

const BASEMAPS = {
  voyager: {
    label: "清爽",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: "abcd",
  },
  positron: {
    label: "素净",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: "abcd",
  },
  dark: {
    label: "夜色",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: "abcd",
  },
  osm: {
    label: "街道",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap",
  },
};

function readStoredBasemap() {
  try {
    return localStorage.getItem(BASEMAP_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeBasemap(id) {
  try {
    localStorage.setItem(BASEMAP_STORAGE_KEY, id);
  } catch {}
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function readBoolean(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === "true";
  } catch {
    return fallback;
  }
}

function writeBoolean(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

const state = {
  search: "",
  area: "",
  sort: "source",
  preferences: new Set(),
  activeId: null,
  markers: new Map(),
  map: null,
  basemapLayer: null,
  basemap: readStoredBasemap() || "voyager",
  layer: null,
  lastResult: [],
  userLocation: null,
  userMarker: null,
  userAccuracyCircle: null,
  locationStatus: "idle",
  isSpinning: false,
  wheelRotation: 0,
  spinTimer: null,
  cooldowns: readJson(COOLDOWN_STORAGE_KEY, {}),
  visited: new Set(readJson(VISITED_STORAGE_KEY, [])),
  preferUnvisited: readBoolean(UNVISITED_STORAGE_KEY, true),
  rerollTimestamps: [],
  feedbackQuestionVisible: false,
  lastFeedbackPromptAt: Number(readJson(FEEDBACK_STORAGE_KEY, { lastPromptAt: 0 }).lastPromptAt || 0),
};

const elements = {
  list: document.getElementById("shopList"),
  search: document.getElementById("searchInput"),
  area: document.getElementById("areaSelect"),
  sort: document.getElementById("sortSelect"),
  chips: document.getElementById("preferenceChips"),
  resultCount: document.getElementById("resultCount"),
  mappedCount: document.getElementById("mappedCount"),
  geoStatus: document.getElementById("geoStatus"),
  detail: document.getElementById("detailPanel"),
  mobileSelected: document.getElementById("mobileSelected"),
  random: document.getElementById("randomButton"),
  locate: document.getElementById("locateButton"),
  rouletteTitle: document.getElementById("rouletteTitle"),
  rouletteHint: document.getElementById("rouletteHint"),
  decisionNudge: document.getElementById("decisionNudge"),
  wheelFace: document.getElementById("wheelFace"),
  unvisitedToggle: document.getElementById("unvisitedToggle"),
  basemapSwitch: document.getElementById("basemapSwitch"),
  fit: document.getElementById("fitButton"),
  map: document.getElementById("map"),
};

function dishesText(shop) {
  return (shop.recommended_dishes || []).join(" ");
}

function selectedLocation(shop) {
  return shop.location_enrichment?.selected_location || {};
}

function shopAddress(shop) {
  const selected = selectedLocation(shop);
  return selected.formatted_address || shop.address_hint || "地址待确认";
}

function hasExactPoint(shop) {
  const point = selectedLocation(shop);
  const hasLat = point.latitude !== null && point.latitude !== undefined && point.latitude !== "";
  const hasLng = point.longitude !== null && point.longitude !== undefined && point.longitude !== "";
  return hasLat && hasLng && Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude));
}

function isOutsideChina(lng, lat) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformGcjLat(lng, lat) {
  let value = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  value += ((20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0) / 3.0;
  value += ((20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin((lat / 3.0) * Math.PI)) * 2.0) / 3.0;
  value += ((160.0 * Math.sin((lat / 12.0) * Math.PI) + 320.0 * Math.sin((lat * Math.PI) / 30.0)) * 2.0) / 3.0;
  return value;
}

function transformGcjLng(lng, lat) {
  let value = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  value += ((20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0) / 3.0;
  value += ((20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin((lng / 3.0) * Math.PI)) * 2.0) / 3.0;
  value += ((150.0 * Math.sin((lng / 12.0) * Math.PI) + 300.0 * Math.sin((lng / 30.0) * Math.PI)) * 2.0) / 3.0;
  return value;
}

function gcj02ToWgs84(lng, lat) {
  if (isOutsideChina(lng, lat)) {
    return { lng, lat };
  }
  let dLat = transformGcjLat(lng - 105.0, lat - 35.0);
  let dLng = transformGcjLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - GCJ_EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic)) * Math.PI);
  dLng = (dLng * 180.0) / ((GCJ_A / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return {
    lng: lng * 2 - (lng + dLng),
    lat: lat * 2 - (lat + dLat),
  };
}

function bd09ToGcj02(lng, lat) {
  const x = lng - 0.0065;
  const y = lat - 0.006;
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * BD_X_PI);
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * BD_X_PI);
  return {
    lng: z * Math.cos(theta),
    lat: z * Math.sin(theta),
  };
}

function displayCoordinates(point) {
  const lng = Number(point.longitude);
  const lat = Number(point.latitude);
  const coordinateSystem = String(point.coordinate_system || "").toUpperCase();
  if (coordinateSystem.includes("WGS")) {
    return { lng, lat };
  }
  if (coordinateSystem.includes("BD") || point.provider === "baidu") {
    const gcj =
      Number.isFinite(Number(point.gcj02_longitude)) && Number.isFinite(Number(point.gcj02_latitude))
        ? { lng: Number(point.gcj02_longitude), lat: Number(point.gcj02_latitude) }
        : bd09ToGcj02(lng, lat);
    return gcj02ToWgs84(gcj.lng, gcj.lat);
  }
  if (coordinateSystem.includes("GCJ") || point.provider === "amap") {
    return gcj02ToWgs84(lng, lat);
  }
  return { lng, lat };
}

function jitter(id) {
  const x = ((id * 37) % 100 - 50) / 11000;
  const y = ((id * 53) % 100 - 50) / 11000;
  return [x, y];
}

function displayPoint(shop) {
  const selected = selectedLocation(shop);
  if (hasExactPoint(shop)) {
    const point = displayCoordinates(selected);
    return {
      lat: point.lat,
      lng: point.lng,
      precision: "exact",
      label: selected.provider === "baidu" ? "百度" : "高德",
    };
  }

  const anchor = AREA_ANCHORS[shop.address_hint] || AREA_ANCHORS["西湖"];
  const [latJitter, lngJitter] = jitter(shop.id);
  return {
    lat: anchor[0] + latJitter,
    lng: anchor[1] + lngJitter,
    precision: "area",
    label: "地址",
  };
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceKmBetween(a, b) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(b.lat - a.lat);
  const lngDelta = toRadians(b.lng - a.lng);
  const latA = toRadians(a.lat);
  const latB = toRadians(b.lat);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function shopDistanceKm(shop) {
  if (!state.userLocation) {
    return null;
  }
  const point = displayPoint(shop);
  return distanceKmBetween(state.userLocation, { lat: point.lat, lng: point.lng });
}

function formatDistance(distance) {
  if (distance === null || distance === undefined || !Number.isFinite(distance)) {
    return "";
  }
  if (distance < 1) {
    return `${Math.max(Math.round(distance * 1000), 1)} m`;
  }
  return `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km`;
}

function rankedByDistance(result) {
  return result
    .map((shop) => ({ shop, distance: shopDistanceKm(shop) }))
    .filter((item) => item.distance !== null && Number.isFinite(item.distance))
    .sort((a, b) => a.distance - b.distance || a.shop.id - b.shop.id);
}

function nearestDistance(result) {
  const ranked = rankedByDistance(result);
  return ranked.length ? ranked[0].distance : null;
}

function hasUsefulLocation(result = shops) {
  if (!state.userLocation) {
    return false;
  }
  const nearest = nearestDistance(result);
  return nearest !== null && nearest <= DISTANCE_FALLBACK_KM;
}

function distanceMeta(shop) {
  if (!hasUsefulLocation(shops)) {
    return "";
  }
  const distance = shopDistanceKm(shop);
  const label = formatDistance(distance);
  return label ? `<span>${label}</span>` : "";
}

function randomCandidates(result) {
  const eligible = result.filter((shop) => shop.status !== "closed_in_source" && !isCoolingDown(shop));
  if (!eligible.length) {
    return [];
  }
  if (!hasUsefulLocation(eligible)) {
    return eligible;
  }

  const ranked = rankedByDistance(eligible);
  const minimumPoolSize = Math.min(3, ranked.length);
  for (const radius of NEARBY_RADII_KM) {
    const pool = ranked.filter((item) => item.distance <= radius).map((item) => item.shop);
    if (pool.length >= minimumPoolSize) {
      return pool;
    }
  }

  return ranked.slice(0, Math.min(12, ranked.length)).map((item) => item.shop);
}

function distanceWeight(shop) {
  if (!hasUsefulLocation(shops)) {
    return 0;
  }
  const distance = shopDistanceKm(shop);
  if (distance === null || !Number.isFinite(distance)) {
    return 0;
  }
  if (distance <= 1.5) return 6;
  if (distance <= 3) return 4;
  if (distance <= 6) return 2;
  if (distance <= 10) return 1;
  return 0;
}

function cleanCooldowns() {
  const now = Date.now();
  let changed = false;
  Object.entries(state.cooldowns).forEach(([shopId, expiresAt]) => {
    if (!Number.isFinite(Number(expiresAt)) || Number(expiresAt) <= now) {
      delete state.cooldowns[shopId];
      changed = true;
    }
  });
  if (changed) {
    writeJson(COOLDOWN_STORAGE_KEY, state.cooldowns);
  }
}

function isCoolingDown(shop) {
  cleanCooldowns();
  return Number(state.cooldowns[String(shop.id)] || 0) > Date.now();
}

function addCooldown(shopId) {
  state.cooldowns[String(shopId)] = Date.now() + COOLDOWN_MS;
  writeJson(COOLDOWN_STORAGE_KEY, state.cooldowns);
}

function isVisited(shop) {
  return state.visited.has(Number(shop.id));
}

function markVisited(shopId) {
  state.visited.add(Number(shopId));
  writeJson(VISITED_STORAGE_KEY, [...state.visited]);
}

function unvisitedWeight(shop) {
  if (!state.preferUnvisited) {
    return 0;
  }
  return isVisited(shop) ? -1 : 3;
}

function feedbackStore() {
  return readJson(FEEDBACK_STORAGE_KEY, { lastPromptAt: 0, events: [] });
}

function saveFeedbackEvent(reason) {
  const store = feedbackStore();
  const active = shops.find((shop) => shop.id === state.activeId);
  store.events = [
    ...(store.events || []),
    {
      reason,
      shopId: active?.id || null,
      shopName: active?.name || null,
      area: state.area || "",
      preferences: [...state.preferences],
      createdAt: new Date().toISOString(),
    },
  ].slice(-50);
  store.lastPromptAt = Date.now();
  state.lastFeedbackPromptAt = store.lastPromptAt;
  writeJson(FEEDBACK_STORAGE_KEY, store);
}

function trackRerollPressure() {
  const now = Date.now();
  state.rerollTimestamps = [...state.rerollTimestamps, now].filter(
    (timestamp) => now - timestamp <= RAPID_REROLL_WINDOW_MS,
  );
  if (
    state.rerollTimestamps.length >= RAPID_REROLL_THRESHOLD &&
    now - state.lastFeedbackPromptAt > FEEDBACK_COOLDOWN_MS
  ) {
    state.feedbackQuestionVisible = true;
    state.lastFeedbackPromptAt = now;
    const store = feedbackStore();
    store.lastPromptAt = now;
    writeJson(FEEDBACK_STORAGE_KEY, store);
  }
}

function preferenceScore(shop) {
  if (!state.preferences.size) {
    return 1;
  }
  const haystack = `${shop.name} ${shop.address_hint} ${dishesText(shop)}`;
  let matches = 0;
  state.preferences.forEach((id) => {
    const preference = PREFERENCES.find((item) => item.id === id);
    if (preference?.keywords.some((keyword) => haystack.includes(keyword))) {
      matches += 1;
    }
  });
  return matches;
}

function filteredShops() {
  const query = state.search.trim().toLowerCase();
  let result = shops.filter((shop) => {
    const haystack = `${shop.id} ${shop.name} ${shop.raw_name} ${shop.address_hint} ${dishesText(shop)}`.toLowerCase();
    const queryMatch = !query || haystack.includes(query);
    const areaMatch = !state.area || shop.address_hint === state.area;
    const preferenceMatch = preferenceScore(shop) > 0;
    return queryMatch && areaMatch && preferenceMatch;
  });

  result = [...result].sort((a, b) => {
    if (state.sort === "distance" && hasUsefulLocation(result)) {
      const distanceA = shopDistanceKm(a);
      const distanceB = shopDistanceKm(b);
      return (distanceA ?? Number.POSITIVE_INFINITY) - (distanceB ?? Number.POSITIVE_INFINITY) || a.id - b.id;
    }
    if (state.sort === "dish") {
      return (b.recommended_dishes?.length || 0) - (a.recommended_dishes?.length || 0) || a.id - b.id;
    }
    return a.id - b.id;
  });

  return result;
}

function navigationUrl(shop) {
  const selected = selectedLocation(shop);
  if (selected.navigation_url) {
    return selected.navigation_url;
  }
  const keyword = encodeURIComponent(`${shop.name} ${shop.address_hint}`);
  return `https://uri.amap.com/search?keyword=${keyword}&city=杭州&callnative=1`;
}

function badge(shop) {
  if (shop.status === "closed_in_source") {
    return `<span class="badge closed">已关</span>`;
  }
  return "";
}

function dishTags(shop, limit = 5) {
  const dishes = (shop.recommended_dishes || []).slice(0, limit);
  if (!dishes.length) {
    return `<span class="dish">原表未列菜品</span>`;
  }
  return dishes.map((dish) => `<span class="dish">${dish}</span>`).join("");
}

function recommendationReasons(shop) {
  const reasons = [];
  const distance = shopDistanceKm(shop);
  if (distance !== null && Number.isFinite(distance)) {
    reasons.push(distance <= 3 ? `近 · ${formatDistance(distance)}` : `${formatDistance(distance)}`);
  }
  reasons.push(isVisited(shop) ? "吃过" : "没吃过");
  if ((shop.recommended_dishes || []).length) {
    reasons.push(`${Math.min(shop.recommended_dishes.length, 8)} 个菜可参考`);
  }
  if (shopAddress(shop) !== "地址待确认") {
    reasons.push("有地址");
  }
  return reasons.slice(0, 3);
}

function reasonTags(shop) {
  return recommendationReasons(shop).map((reason) => `<span class="reason">${reason}</span>`).join("");
}

function renderAreaOptions() {
  const counts = shops.reduce((map, shop) => {
    map.set(shop.address_hint, (map.get(shop.address_hint) || 0) + 1);
    return map;
  }, new Map());
  [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .forEach(([area, count]) => {
      const option = document.createElement("option");
      option.value = area;
      option.textContent = `${area} (${count})`;
      elements.area.appendChild(option);
    });
}

function renderChips() {
  elements.chips.innerHTML = PREFERENCES.map(
    (item) => `<button class="chip" type="button" data-id="${item.id}">${item.label}</button>`,
  ).join("");
}

function renderList(result) {
  if (!result.length) {
    elements.list.innerHTML = `<article class="empty-state">没有匹配的店。换个区域或少选一个偏好试试。</article>`;
    return;
  }

  elements.list.innerHTML = result
    .map((shop) => {
      const active = shop.id === state.activeId ? " active" : "";
      return `
        <article class="shop-card${active}" data-id="${shop.id}" tabindex="0">
          <div class="shop-card-header">
            <span class="shop-name">${shop.name}</span>
            <span class="shop-id">#${String(shop.id).padStart(2, "0")}</span>
          </div>
          <div class="dishes">${dishTags(shop)}</div>
          <div class="meta-line">${badge(shop)}<span>${shopAddress(shop)}</span>${distanceMeta(shop)}<span>第 ${shop.source_page} 页</span></div>
        </article>
      `;
    })
    .join("");
}

function renderDetail(shop) {
  if (!shop) {
    elements.detail.innerHTML = "";
    return;
  }

  const address = shopAddress(shop);

  elements.detail.innerHTML = `
    <h2>${shop.name}</h2>
    <div class="meta-line">${badge(shop)}<span>${address}</span>${distanceMeta(shop)}</div>
    <div class="reasons">${reasonTags(shop)}</div>
    <div class="dishes">${dishTags(shop, 8)}</div>
    <div class="detail-actions">
      <a class="text-button primary" href="${navigationUrl(shop)}" target="_blank" rel="noreferrer">导航</a>
      <button class="text-button" type="button" data-testid="visited-button" data-visited="${shop.id}">去吃了</button>
      <button class="text-button" type="button" data-testid="skip-button" data-skip="${shop.id}">不想吃</button>
      <button class="text-button" type="button" data-copy="${shop.id}">复制店名</button>
    </div>
  `;
}

function renderMobileSelected(shop) {
  if (!elements.mobileSelected) {
    return;
  }
  if (!shop) {
    elements.mobileSelected.innerHTML = "";
    return;
  }

  elements.mobileSelected.innerHTML = `
    <article class="mobile-pick">
      <div class="mobile-pick-top">
        <div>
          <span class="mobile-pick-label">当前推荐</span>
          <h2>${shop.name}</h2>
        </div>
        <span class="shop-id">#${String(shop.id).padStart(2, "0")}</span>
      </div>
      <div class="meta-line">${badge(shop)}<span>${shopAddress(shop)}</span>${distanceMeta(shop)}</div>
      <div class="reasons">${reasonTags(shop)}</div>
      <div class="dishes">${dishTags(shop, 4)}</div>
      <div class="detail-actions">
        <a class="text-button primary" href="${navigationUrl(shop)}" target="_blank" rel="noreferrer">导航</a>
        <button class="text-button" type="button" data-testid="visited-button" data-visited="${shop.id}">去吃了</button>
        <button class="text-button" type="button" data-testid="skip-button" data-skip="${shop.id}">不想吃</button>
        <button class="text-button" type="button" data-copy="${shop.id}">复制</button>
        <button class="text-button" type="button" data-reroll="true">换一家</button>
      </div>
    </article>
  `;
}

function renderMarkers(result) {
  if (!state.layer) {
    return;
  }
  state.layer.clearLayers();
  state.markers.clear();

  result.forEach((shop) => {
    const point = displayPoint(shop);
    const marker = L.circleMarker([point.lat, point.lng], {
      radius: shop.id === state.activeId ? 12 : 9,
      color: "#ffffff",
      weight: shop.id === state.activeId ? 4 : 3,
      fillColor: shop.id === state.activeId ? "#c85035" : "#2f8f9d",
      fillOpacity: 0.96,
      opacity: 1,
      className: "food-point",
    });
    const distance = formatDistance(shopDistanceKm(shop));
    marker.bindPopup(`<strong>${shop.name}</strong><br>${shopAddress(shop)}${distance ? `<br>${distance}` : ""}`);
    marker.on("click", () => selectShop(shop.id, false));
    marker.addTo(state.layer);
    state.markers.set(shop.id, marker);
  });
}

function fitMap() {
  if (!state.map || !state.markers.size) {
    return;
  }
  const group = L.featureGroup([...state.markers.values()]);
  state.map.fitBounds(group.getBounds().pad(0.18), { animate: true, maxZoom: 14 });
}

function locationSummary(result) {
  if (state.locationStatus === "locating") {
    return "定位中";
  }
  if (state.locationStatus === "denied") {
    return "未授权定位";
  }
  if (state.locationStatus === "error") {
    return "定位失败";
  }
  if (!state.userLocation) {
    return "未定位";
  }
  if (!hasUsefulLocation(result)) {
    return "离杭州较远";
  }
  const nearbyCount = result.filter((shop) => {
    const distance = shopDistanceKm(shop);
    return distance !== null && distance <= 4;
  }).length;
  return `4km内 ${nearbyCount} 家`;
}

function renderLocationButton(result) {
  if (!elements.locate) {
    return;
  }
  const useful = hasUsefulLocation(result);
  elements.locate.classList.toggle("is-active", useful);
  elements.locate.classList.toggle("is-loading", state.locationStatus === "locating");
  elements.locate.title = useful ? "刷新定位" : "定位";
  elements.locate.setAttribute("aria-label", elements.locate.title);
}

function renderBasemapSwitch() {
  if (!elements.basemapSwitch) {
    return;
  }
  elements.basemapSwitch.querySelectorAll("[data-basemap]").forEach((button) => {
    const active = button.dataset.basemap === state.basemap;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderUnvisitedToggle() {
  if (!elements.unvisitedToggle) {
    return;
  }
  elements.unvisitedToggle.classList.toggle("active", state.preferUnvisited);
  elements.unvisitedToggle.setAttribute("aria-pressed", String(state.preferUnvisited));
}

function renderDecisionQuestion() {
  if (!elements.decisionNudge) {
    return;
  }
  if (!state.feedbackQuestionVisible) {
    elements.decisionNudge.innerHTML = "";
    elements.decisionNudge.classList.remove("active");
    return;
  }
  elements.decisionNudge.classList.add("active");
  elements.decisionNudge.innerHTML = `
    <p>你刚刚连续换了好几次，是不是体验不好？</p>
    <div class="feedback-actions">
      <button type="button" data-testid="feedback-option" data-feedback="too_far">太远了</button>
      <button type="button" data-testid="feedback-option" data-feedback="wrong_taste">不想吃这些</button>
      <button type="button" data-testid="feedback-option" data-feedback="not_enough_info">信息不够</button>
      <button type="button" data-testid="feedback-option" data-feedback="just_browsing">只是看看</button>
      <button type="button" data-testid="feedback-option" data-feedback="skip">先继续转</button>
    </div>
  `;
}

function renderStats(result) {
  const addressCount = result.filter((shop) => Boolean(shopAddress(shop))).length;
  elements.resultCount.textContent = String(result.length);
  elements.mappedCount.textContent = String(addressCount);
  elements.geoStatus.textContent = locationSummary(result);
  renderLocationButton(result);
}

function activeShopFrom(result) {
  if (!result.length) {
    state.activeId = null;
    return null;
  }
  const active = result.find((shop) => shop.id === state.activeId);
  if (active) {
    return active;
  }
  state.activeId = result[0].id;
  return result[0];
}

function rouletteHint(result, pool) {
  if (!result.length) {
    return "无候选";
  }
  if (state.locationStatus === "locating") {
    return "定位中";
  }
  if (state.userLocation && hasUsefulLocation(result)) {
    const nearest = nearestDistance(pool);
    const nearestText = formatDistance(nearest);
    return nearestText ? `${pool.length} 家近处候选 · 最近 ${nearestText}` : `${pool.length} 家近处候选`;
  }
  if (state.userLocation && !hasUsefulLocation(result)) {
    return "距离较远 · 按原随机";
  }
  return `${pool.length} 家候选 · 未定位`;
}

function renderRoulette(result, active) {
  if (!elements.wheelFace || !elements.rouletteTitle || !elements.rouletteHint) {
    return;
  }

  const pool = randomCandidates(result);
  elements.wheelFace.style.setProperty("--count", String(Math.max(Math.min(pool.length, WHEEL_PREVIEW_COUNT), 1)));
  elements.wheelFace.style.setProperty("--spin", `${state.wheelRotation}deg`);
  elements.wheelFace.innerHTML = "";

  elements.rouletteTitle.textContent = state.isSpinning ? "转着呢" : active?.name || "换一家";
  elements.rouletteHint.textContent = rouletteHint(result, pool);
  elements.random.disabled = state.isSpinning || !pool.length;
  elements.random.classList.toggle("is-spinning", state.isSpinning);
}

function render() {
  const result = filteredShops();
  state.lastResult = result;
  const active = activeShopFrom(result);
  renderList(result);
  renderMarkers(result);
  renderStats(result);
  renderDetail(active);
  renderMobileSelected(active);
  renderRoulette(result, active);
  renderBasemapSwitch();
  renderUnvisitedToggle();
  renderDecisionQuestion();
}

function randomPick() {
  if (state.isSpinning) {
    return;
  }
  const result = state.lastResult.length ? state.lastResult : filteredShops();
  const pool = randomCandidates(result);
  if (!pool.length) {
    return;
  }
  trackRerollPressure();
  renderDecisionQuestion();

  const weighted = pool.flatMap((shop) => {
    const score = Math.max(
      Math.max(preferenceScore(shop), 1) + (hasExactPoint(shop) ? 1 : 0) + distanceWeight(shop) + unvisitedWeight(shop),
      1,
    );
    return Array.from({ length: score }, () => shop);
  });
  const pick = weighted[Math.floor(Math.random() * weighted.length)];

  state.isSpinning = true;
  state.wheelRotation += 720 + Math.floor(Math.random() * 360);
  renderRoulette(result, shops.find((shop) => shop.id === state.activeId));
  window.clearTimeout(state.spinTimer);
  state.spinTimer = window.setTimeout(() => {
    state.isSpinning = false;
    selectShop(pick.id);
  }, WHEEL_SPIN_MS);
}

function skipShop(shopId) {
  addCooldown(Number(shopId));
  render();
  randomPick();
}

function visitShop(shopId) {
  markVisited(Number(shopId));
  render();
}

function answerDecisionQuestion(reason) {
  saveFeedbackEvent(reason);
  state.feedbackQuestionVisible = false;
  state.rerollTimestamps = [];
  renderDecisionQuestion();
}

function selectShop(shopId, shouldPan = true) {
  const shop = shops.find((item) => item.id === shopId);
  if (!shop) {
    return;
  }
  state.activeId = shop.id;
  render();

  const marker = state.markers.get(shop.id);
  if (marker && shouldPan && state.map) {
    state.map.setView(marker.getLatLng(), Math.max(state.map.getZoom(), 13), { animate: true });
    marker.openPopup();
  }
}

async function copyShop(shopId) {
  const shop = shops.find((item) => item.id === Number(shopId));
  if (!shop) {
    return;
  }
  const text = `${shop.name} ${shop.address_hint}`;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
}

function renderUserLocation() {
  if (!state.map || !state.userLocation || !window.L) {
    return;
  }

  const latLng = [state.userLocation.lat, state.userLocation.lng];
  if (!state.userMarker) {
    state.userMarker = L.circleMarker(latLng, {
      radius: 8,
      color: "#ffffff",
      weight: 3,
      fillColor: "#4f7b38",
      fillOpacity: 0.95,
      opacity: 1,
      className: "user-point",
    }).addTo(state.map);
    state.userMarker.bindPopup("你在这里");
  } else {
    state.userMarker.setLatLng(latLng);
  }

  const accuracy = state.userLocation.accuracy;
  if (Number.isFinite(accuracy)) {
    if (!state.userAccuracyCircle) {
      state.userAccuracyCircle = L.circle(latLng, {
        radius: accuracy,
        color: "#4f7b38",
        weight: 1,
        fillColor: "#4f7b38",
        fillOpacity: 0.08,
        opacity: 0.45,
        interactive: false,
      }).addTo(state.map);
    } else {
      state.userAccuracyCircle.setLatLng(latLng);
      state.userAccuracyCircle.setRadius(accuracy);
    }
  }
}

function requestUserLocation() {
  if (!navigator.geolocation) {
    state.locationStatus = "error";
    if (state.sort === "distance") {
      state.sort = "source";
      elements.sort.value = "source";
    }
    render();
    return;
  }

  state.locationStatus = "locating";
  render();
  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      state.locationStatus = "ready";
      if (state.sort === "source" || state.sort === "distance") {
        state.sort = "distance";
        elements.sort.value = "distance";
      }
      render();
      renderUserLocation();
      if (hasUsefulLocation(shops) && state.map) {
        state.map.setView([state.userLocation.lat, state.userLocation.lng], 14, { animate: true });
      }
    },
    (error) => {
      state.locationStatus = error.code === 1 ? "denied" : "error";
      if (state.sort === "distance") {
        state.sort = "source";
        elements.sort.value = "source";
      }
      render();
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000 * 60 * 5,
      timeout: 8000,
    },
  );
}

function initLocationPermission() {
  if (!navigator.permissions?.query) {
    return;
  }
  navigator.permissions
    .query({ name: "geolocation" })
    .then((permission) => {
      if (permission.state === "granted") {
        requestUserLocation();
      }
    })
    .catch(() => {});
}

function applyBasemap(id) {
  if (!state.map || !window.L) {
    return;
  }
  const nextId = BASEMAPS[id] ? id : "voyager";
  const config = BASEMAPS[nextId];
  if (state.basemapLayer) {
    state.map.removeLayer(state.basemapLayer);
  }

  state.basemap = nextId;
  state.basemapLayer = L.tileLayer(config.url, {
    maxZoom: 19,
    subdomains: config.subdomains,
    attribution: config.attribution,
  }).addTo(state.map);
  storeBasemap(nextId);
  renderBasemapSwitch();
}

function initMap() {
  if (!window.L) {
    elements.map.innerHTML = `<div class="fallback-map">地图资源未加载，列表仍可使用。</div>`;
    return;
  }

  state.map = L.map("map", {
    zoomControl: false,
    attributionControl: true,
  }).setView(AREA_ANCHORS["西湖"], 12);

  L.control.zoom({ position: "bottomleft" }).addTo(state.map);
  applyBasemap(state.basemap);
  state.layer = L.layerGroup().addTo(state.map);
  renderUserLocation();
}

function bindEvents() {
  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value;
    render();
    fitMap();
  });
  elements.area.addEventListener("change", (event) => {
    state.area = event.target.value;
    render();
    fitMap();
  });
  elements.sort.addEventListener("change", (event) => {
    state.sort = event.target.value;
    if (state.sort === "distance" && !state.userLocation) {
      requestUserLocation();
      return;
    }
    render();
    fitMap();
  });
  elements.chips.addEventListener("click", (event) => {
    const button = event.target.closest(".chip");
    if (!button) {
      return;
    }
    const id = button.dataset.id;
    if (state.preferences.has(id)) {
      state.preferences.delete(id);
      button.classList.remove("active");
    } else {
      state.preferences.add(id);
      button.classList.add("active");
    }
    render();
    fitMap();
  });
  elements.list.addEventListener("click", (event) => {
    const card = event.target.closest(".shop-card");
    if (card) {
      selectShop(Number(card.dataset.id));
    }
  });
  elements.list.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const card = event.target.closest(".shop-card");
    if (card) {
      event.preventDefault();
      selectShop(Number(card.dataset.id));
    }
  });
  document.addEventListener("click", (event) => {
    const copyButton = event.target.closest("[data-copy]");
    if (copyButton) {
      copyShop(copyButton.dataset.copy);
    }
    const visitedButton = event.target.closest("[data-visited]");
    if (visitedButton) {
      visitShop(visitedButton.dataset.visited);
    }
    const skipButton = event.target.closest("[data-skip]");
    if (skipButton) {
      skipShop(skipButton.dataset.skip);
    }
    const feedbackButton = event.target.closest("[data-feedback]");
    if (feedbackButton) {
      answerDecisionQuestion(feedbackButton.dataset.feedback);
    }
    if (event.target.closest("[data-reroll]")) {
      randomPick();
    }
  });
  elements.random.addEventListener("click", randomPick);
  elements.locate.addEventListener("click", requestUserLocation);
  elements.unvisitedToggle.addEventListener("click", () => {
    state.preferUnvisited = !state.preferUnvisited;
    writeBoolean(UNVISITED_STORAGE_KEY, state.preferUnvisited);
    render();
  });
  elements.basemapSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-basemap]");
    if (!button) {
      return;
    }
    applyBasemap(button.dataset.basemap);
  });
  elements.fit.addEventListener("click", fitMap);
}

function boot() {
  renderAreaOptions();
  renderChips();
  initMap();
  bindEvents();
  render();
  fitMap();
  initLocationPermission();
  window.lucide?.createIcons();
}

boot();
