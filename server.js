const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 کلید ادمین
const ADMIN_KEY = process.env.ADMIN_KEY || "1387hhh";

// مسیر فایل‌های داده
const ADS_FILE = path.join(__dirname, "ads.json");
const STATS_FILE = path.join(__dirname, "ad_stats.json");

// --- توابع کمکی ---
function loadAds() {
  if (!fs.existsSync(ADS_FILE)) fs.writeFileSync(ADS_FILE, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(ADS_FILE, "utf-8"));
}
function saveAds(ads) {
  fs.writeFileSync(ADS_FILE, JSON.stringify(ads, null, 2), "utf-8");
}

function loadStats() {
  if (!fs.existsSync(STATS_FILE)) fs.writeFileSync(STATS_FILE, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(STATS_FILE, "utf-8"));
}
function saveStats(stats) {
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
}

// بارگذاری آمار
let adStats = loadStats();

// اطمینان از وجود آمار برای هر تبلیغ
function ensureAdStats(adId) {
  if (!adStats[adId]) {
    adStats[adId] = { views: 0, clicks: 0, viewers: [] };
  }
}

// --- Middleware ---
app.use(express.json());
app.use(express.static(__dirname));

// --- API Routes ---

// 📌 گرفتن لیست تبلیغات
app.get("/api/ads", (req, res) => {
  const ads = loadAds();
  const adsWithStats = ads.map((ad) => {
    ensureAdStats(ad.id);
    return {
      ...ad,
      views: adStats[ad.id].views,
      clicks: adStats[ad.id].clicks,
    };
  });
  res.json(adsWithStats);
});

// 📌 افزودن تبلیغ (فقط ادمین)
app.post("/api/ads", (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ message: "دسترسی غیرمجاز" });
  }

  let ads = loadAds();
  const { id, type, text, src, link } = req.body;

  const newAd = { id, type, text, src, link };
  ads.push(newAd);
  saveAds(ads);

  ensureAdStats(id);
  saveStats(adStats);

  res.status(201).json({ message: "تبلیغ اضافه شد", ad: newAd });
});

// 📌 حذف تبلیغ (فقط ادمین)
app.delete("/api/ads/:id", (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ message: "دسترسی غیرمجاز" });
  }

  const adId = req.params.id;
  let ads = loadAds();
  const initialLength = ads.length;

  ads = ads.filter((ad) => ad.id !== adId);

  if (ads.length < initialLength) {
    saveAds(ads);
    delete adStats[adId];
    saveStats(adStats);
    res.json({ message: "تبلیغ حذف شد" });
  } else {
    res.status(404).json({ message: "تبلیغ پیدا نشد" });
  }
});

// 📌 ثبت بازدید یونیک
app.post("/api/view/:id", (req, res) => {
  const adId = req.params.id;
  const userIp = req.ip;

  ensureAdStats(adId);

  if (!adStats[adId].viewers.includes(userIp)) {
    adStats[adId].views++;
    adStats[adId].viewers.push(userIp);
    saveStats(adStats);
  }

  res.json({ success: true, views: adStats[adId].views });
});

// 📌 ثبت کلیک
app.post("/api/click/:id", (req, res) => {
  const adId = req.params.id;
  ensureAdStats(adId);
  adStats[adId].clicks++;
  saveStats(adStats);
  res.json({ success: true, clicks: adStats[adId].clicks });
});

// 📌 گرفتن آمار کامل (ادمین)
app.get("/api/ads/stats", (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ message: "دسترسی غیرمجاز" });
  }
  res.json(adStats);
});

// 📌 سرو کردن index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// --- شروع سرور ---
app.listen(PORT, () => {
  console.log(`🚀 سرور روی http://localhost:${PORT}`);
});
