const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); // مینی اپ

// مسیر فایل دیتابیس تبلیغات
const adsFile = path.join(__dirname, "ads.json");

// خواندن تبلیغات
function readAds() {
  if (!fs.existsSync(adsFile)) fs.writeFileSync(adsFile, "[]");
  return JSON.parse(fs.readFileSync(adsFile));
}

// ذخیره تبلیغات
function saveAds(ads) {
  fs.writeFileSync(adsFile, JSON.stringify(ads, null, 2));
}

// گرفتن لیست تبلیغات
app.get("/api/ads", (req, res) => {
  const ads = readAds();
  res.json(ads);
});

// ثبت بازدید
app.post("/api/view/:id", (req, res) => {
  let ads = readAds();
  const adId = parseInt(req.params.id);
  const ad = ads.find(a => a.id === adId);

  if (ad) {
    ad.views = (ad.views || 0) + 1;
    saveAds(ads);
    res.json({ success: true, views: ad.views });
  } else {
    res.status(404).json({ success: false, message: "تبلیغ یافت نشد" });
  }
});

// افزودن تبلیغ (ادمین)
app.post("/api/add", (req, res) => {
  let ads = readAds();
  const { type, text, src, link } = req.body;

  const newAd = {
    id: ads.length ? ads[ads.length - 1].id + 1 : 1,
    type,
    text,
    src,
    link,
    views: 0
  };

  ads.push(newAd);
  saveAds(ads);
  res.json({ success: true, ad: newAd });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
