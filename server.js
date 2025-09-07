const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADS_FILE = path.join(__dirname, 'ads.json');

// Middleware برای پردازش JSON و URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// سرو کردن فایل‌های استاتیک از پوشه فعلی (جایی که server.js قرار دارد)
// این باعث می‌شود index.html, admin.html, style.css, script.js مستقیماً قابل دسترسی باشند.
app.use(express.static(__dirname)); 

// تابع برای خواندن تبلیغات از ads.json
const readAds = () => {
  if (!fs.existsSync(ADS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(ADS_FILE, 'utf8');
  return JSON.parse(data);
};

// تابع برای ذخیره تبلیغات در ads.json
const saveAds = (ads) => {
  fs.writeFileSync(ADS_FILE, JSON.stringify(ads, null, 2), 'utf8');
};

// --------------- API Endpoints ---------------

// GET /api/ads: لیست تمام تبلیغات را برمی‌گرداند
app.get('/api/ads', (req, res) => {
  const ads = readAds();
  // بهتر است اطلاعات حساس مثل 'viewers' را به کلاینت عادی نفرستیم
  const publicAds = ads.map(ad => ({
    id: ad.id,
    type: ad.type,
    text: ad.text,
    src: ad.src,
    link: ad.link,
    // برای نمایش در index.html نیازی به uniqueViews و clicks نیست، مگر اینکه بخواهید نمایش دهید
  }));
  res.json(publicAds);
});

// POST /api/view/:id: ثبت بازدید واقعی (Unique View)
app.post("/api/view/:id", (req, res) => {
  let ads = readAds();
  const adId = parseInt(req.params.id);
  const ad = ads.find(a => a.id === adId);

  if (!ad) return res.status(404).json({ success: false, message: "تبلیغ یافت نشد" });

  // گرفتن IP کاربر
  // x-forwarded-for برای پروکسی‌ها و لودبالانسرها استفاده می‌شود.
  // req.connection.remoteAddress برای اتصال مستقیم.
  const userIp =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress;

  // اگر آرایه viewers وجود ندارد، ایجادش کن
  if (!ad.viewers) ad.viewers = [];

  // اگر IP کاربر در لیست viewers نیست، آن را اضافه کن و uniqueViews را افزایش بده
  if (!ad.viewers.includes(userIp)) {
    ad.viewers.push(userIp);
    ad.uniqueViews = (ad.uniqueViews || 0) + 1; // اگر قبلاً uniqueViews نداشته، 0 در نظر بگیر
  }

  saveAds(ads);
  res.json({ success: true, uniqueViews: ad.uniqueViews });
});

// POST /api/click/:id: ثبت کلیک
app.post("/api/click/:id", (req, res) => {
  let ads = readAds();
  const adId = parseInt(req.params.id);
  const ad = ads.find(a => a.id === adId);

  if (!ad) return res.status(404).json({ success: false, message: "تبلیغ یافت نشد" });

  // افزایش تعداد کلیک‌ها
  ad.clicks = (ad.clicks || 0) + 1; // اگر قبلاً clicks نداشته، 0 در نظر بگیر

  saveAds(ads);
  res.json({ success: true, clicks: ad.clicks });
});

// POST /api/add: یک تبلیغ جدید اضافه می‌کند
app.post('/api/add', (req, res) => {
  const { type, text, src, link } = req.body;
  if (!type || !link) { // حداقل نوع و لینک باید وجود داشته باشد
    return res.status(400).json({ success: false, message: "نوع و لینک تبلیغ الزامی است." });
  }

  let ads = readAds();
  const newId = ads.length > 0 ? Math.max(...ads.map(ad => ad.id)) + 1 : 1;

  const newAd = {
    id: newId,
    type,
    text: text || null, // متن برای تبلیغات متنی
    src: src || null,   // منبع برای تبلیغات تصویری/ویدیویی
    link,
    uniqueViews: 0,
    clicks: 0,
    viewers: [] // آرایه برای نگهداری IP بازدیدکنندگان واقعی
  };

  ads.push(newAd);
  saveAds(ads);
  res.status(201).json({ success: true, ad: newAd });
});

// GET /api/admin/ads: لیست کامل تبلیغات با آمار (برای پنل ادمین)
app.get("/api/admin/ads", (req, res) => {
  const ads = readAds();
  // برای پنل ادمین، نیازی به ارسال آرایه viewers نیست، اما سایر اطلاعات را می‌فرستیم
  const adminAds = ads.map(ad => ({
    id: ad.id,
    type: ad.type,
    text: ad.text,
    src: ad.src,
    link: ad.link,
    uniqueViews: ad.uniqueViews || 0,
    clicks: ad.clicks || 0,
  }));
  res.json(adminAds);
});

// شروع سرور
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // مطمئن می‌شویم که ads.json در صورت عدم وجود، ایجاد شود.
  if (!fs.existsSync(ADS_FILE)) {
    saveAds([]);
    console.log('ads.json created.');
  }
});
