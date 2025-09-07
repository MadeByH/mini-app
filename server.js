const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// مسیر فایل‌های داده
const ADS_FILE = path.join(__dirname, 'ads.json'); // فایل تبلیغات شما
const STATS_FILE = path.join(__dirname, 'ad_stats.json'); // فایل آمار

// --- توابع کمکی برای خواندن/نوشتن فایل‌ها ---

// خواندن یا ایجاد فایل تبلیغات
function loadAds() {
    try {
        if (!fs.existsSync(ADS_FILE)) {
            fs.writeFileSync(ADS_FILE, JSON.stringify([])); // اگر وجود نداشت، یک آرایه خالی ایجاد کن
        }
        const data = fs.readFileSync(ADS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('خطا در خواندن فایل تبلیغات:', error);
        return [];
    }
}

// ذخیره کردن تبلیغات
function saveAds(ads) {
    try {
        fs.writeFileSync(ADS_FILE, JSON.stringify(ads, null, 2), 'utf-8');
    } catch (error) {
        console.error('خطا در ذخیره فایل تبلیغات:', error);
    }
}

// خواندن یا ایجاد فایل آمار
function loadStats() {
    try {
        if (!fs.existsSync(STATS_FILE)) {
            fs.writeFileSync(STATS_FILE, JSON.stringify({})); // اگر وجود نداشت، یک آبجکت خالی ایجاد کن
        }
        const data = fs.readFileSync(STATS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('خطا در خواندن فایل آمار:', error);
        return {};
    }
}

// ذخیره کردن آمار
function saveStats(stats) {
    try {
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
    } catch (error) {
        console.error('خطا در ذخیره فایل آمار:', error);
    }
}

let adStats = loadStats(); // بارگذاری آمار هنگام شروع سرور

// تابع کمکی برای اطمینان از وجود adId در آمار
function ensureAdStats(adId) {
    if (!adStats[adId]) {
        adStats[adId] = { views: 0, clicks: 0 };
    }
}

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname))); // برای سرو کردن فایل‌های استاتیک

// --- API Routes ---

// 1. دریافت لیست کامل تبلیغات (همراه با آمار)
app.get('/api/ads', (req, res) => {
    const ads = loadAds(); // خواندن تبلیغات از ads.json
    const adsWithStats = ads.map(ad => {
        ensureAdStats(ad.id); // اطمینان از وجود آمار برای این تبلیغ
        return {
            ...ad,
            views: adStats[ad.id].views,
            clicks: adStats[ad.id].clicks
        };
    });
    res.json(adsWithStats);
});

// 2. افزودن یا به‌روزرسانی یک تبلیغ (توسط پنل ادمین)
app.post('/api/ads', (req, res) => {
    const newAd = req.body; // تبلیغ جدید از بدنه درخواست
    let ads = loadAds();

    const existingAdIndex = ads.findIndex(ad => ad.id === newAd.id);

    if (existingAdIndex > -1) {
        // به‌روزرسانی تبلیغ موجود
        ads[existingAdIndex] = newAd;
        res.json({ message: 'تبلیغ به‌روز شد', ad: newAd });
    } else {
        // افزودن تبلیغ جدید
        ads.push(newAd);
        res.status(201).json({ message: 'تبلیغ اضافه شد', ad: newAd });
    }
    saveAds(ads); // ذخیره تغییرات در ads.json
});

// 3. حذف یک تبلیغ (توسط پنل ادمین)
app.delete('/api/ads/:id', (req, res) => {
    const adIdToDelete = req.params.id;
    let ads = loadAds();
    const initialLength = ads.length;
    ads = ads.filter(ad => ad.id !== adIdToDelete);

    if (ads.length < initialLength) {
        saveAds(ads); // ذخیره تغییرات در ads.json
        // (اختیاری) می‌توانید آمار مربوط به این تبلیغ را هم از adStats حذف کنید
        delete adStats[adIdToDelete];
        saveStats(adStats); // ذخیره آمار به‌روز شده
        res.json({ message: 'تبلیغ حذف شد' });
    } else {
        res.status(404).json({ message: 'تبلیغ با این شناسه یافت نشد.' });
    }
});


// 4. ثبت بازدید (از صفحه نمایش تبلیغات)
app.post('/api/view/:id', (req, res) => {
    const adId = req.params.id;
    ensureAdStats(adId);
    adStats[adId].views++;
    saveStats(adStats); // ذخیره تغییرات
    res.json({ success: true, views: adStats[adId].views });
});

// 5. ثبت کلیک (از صفحه نمایش تبلیغات)
app.post('/api/click/:id', (req, res) => {
    const adId = req.params.id;
    ensureAdStats(adId);
    adStats[adId].clicks++;
    saveStats(adStats); // ذخیره تغییرات
    res.json({ success: true, clicks: adStats[adId].clicks });
});

// 6. Endpoint جدید برای پنل ادمین (فقط برای دریافت همه آمار)
app.get('/api/ads/stats', (req, res) => {
    res.json(adStats);
});

// --- Route برای سرو کردن index.html ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- شروع سرور ---
app.listen(PORT, () => {
    console.log(`سرور در حال اجرا روی http://localhost:${PORT}`);
});
