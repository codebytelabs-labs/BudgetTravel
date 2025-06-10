// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');
// const https = require('https'); // Eğer HTTPS sunucusu kullanmıyorsanız bu satırı kaldırabilirsiniz.
const app = express();
const http = require('http').Server(app); // HTTP sunucusu
require("dotenv").config(); // .env dosyasındaki değişkenleri yükle

// PostgreSQL için oturum depolamasını ekle (connect-pg-simple)
const pg = require('pg'); // pg kütüphanesini burada da alıyoruz (PgSession için gerekli olabilir)
const PgSession = require('connect-pg-simple')(session); // connect-pg-simple'ı başlat

// db.js'den bağlantı havuzunu, test fonksiyonunu ve formatSQL'i alıyoruz
const { pool, testDbConnection, formatSQL } = require('./db');
// Veritabanı bağlantısı ve auth rotaları
const authRoutes = require('./routes/authRoutes'); // Auth rotalarını al

// Diğer rotalar (chatbotRoutes gibi)
const chatbotRoutes = require("./routes/result");

// --- Middleware'ler ---
// Middleware'lerin sırası önemlidir!

// 1. Statik dosyalar için middleware (en üstte olmalı ki statik dosyalar hızlıca sunulsun)
app.use(express.static('public'));
// app.use(express.static(path.join(__dirname, 'public'))); // Yukarıdaki ile aynı işi yapar, birini kullanmak yeterli

// 2. Body parser middleware'leri (JSON ve URL-encoded verileri işlemek için)
// Bu middleware'ler, tüm POST/PUT/PATCH rotalarından ÖNCE tanımlanmalıdır ki req.body kullanılabilir olsun.
app.use(express.json()); // JSON formatındaki istek body'lerini parse eder
app.use(express.urlencoded({ extended: true })); // URL-encoded formatındaki istek body'lerini parse eder


// 3. Oturum (Session) middleware'i
// Bu, req.session objesini kullanabilmek için tüm rotalardan ve diğer middleware'lerden önce gelmeli (body parser hariç).

// session store'u ortam değişkenine göre ayarla
const sessionStore = process.env.DB_DIALECT === 'postgres' && process.env.NODE_ENV === 'production'
    ? new PgSession({
        pool: pool, // db.js'den gelen PostgreSQL havuzunu kullan
        tableName: 'session' // Oturum bilgilerinin saklanacağı tablo adı
    })
    : new session.MemoryStore(); // Lokal development veya MySQL kullanıyorsanız MemoryStore

app.use(session({
    secret: process.env.SECRET_KEY || 'your-super-secret-key-fallback', // .env'den SECRET_KEY kullanın
    resave: false, // Oturum değişmediği sürece yeniden kaydetme
    saveUninitialized: false, // Yeni, başlatılmamış oturumları kaydetme (daha iyi performans ve gizlilik)
    store: sessionStore, // <<< BURADA DEĞİŞİKLİK YAPILDI: Oturum depolama çözümü eklendi
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Production ortamında HTTPS kullanılıyorsa true olmalı
        httpOnly: true, // Tarayıcı tarafındaki JavaScript'ten çereze erişimi engeller (güvenlik)
        maxAge: 1000 * 60 * 60 * 24 // 1 gün (isteğe bağlı: oturum süresi)
    }
}));

// 4. Veritabanı bağlantısını test et (uygulama başlamadan önce bağlantı kontrolü)
testDbConnection();

// 5. View Engine ayarları (middleware'lerden sonra olabilir)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.set('view engine','html'); // Eğer EJS kullanıyorsanız bu satır yorumda kalmalı

app.set('trust proxy', 1); // Vercel gibi proxy arkasında çalışırken şart

// --- Kimlik Doğrulama Middleware'i ---
// Bu middleware, sadece giriş yapmış kullanıcıların erişmesi gereken rotalara uygulanacak.
function isAuthenticated(req, res, next) {
    // req.session.userId veya req.session.username gibi oturumda bir kimlik bilgisi var mı kontrol et
    if (req.session && req.session.userId) {
        // Kullanıcı oturum açtıysa, isteği devam ettir.
        return next();
    }
    // Oturum açmadıysa giriş sayfasına yönlendir ve mesaj göster
    req.session.returnTo = req.originalUrl; // Kullanıcının gelmek istediği URL'yi kaydet
    res.redirect('/signin?message=GirisYapmalisiniz'); // Mesaj parametresi ekledim
}

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});


// --- Rotalar ---

// Ana sayfa ve diğer statik sayfalar için GET rotaları
app.get('/', (req, res) => res.render("index.ejs"));
app.get('/about', (req, res) => res.render("about.ejs"));
app.get('/signin', (req, res) => {
    const message = req.query.message; // URL'den mesajı al
    res.render("signin_user.ejs", { message: message }); // Mesajı EJS'ye gönder
});
app.get('/signup', (req, res) => res.render("signup_user.ejs"));
app.get('/contact', (req, res) => res.render("contact.ejs"));
app.get('/destinations', (req, res) => res.render("chatbot.ejs"));
app.get('/chatbot', (req, res) => res.render("chatbot.ejs"));

// *** YENİ EKLENEN KISIM: Profil Sayfası Rotası ***
// Bu rotaya sadece giriş yapmış kullanıcılar erişebilmeli.
// isAuthenticated middleware'ini buraya uyguluyoruz.
app.get('/profile', isAuthenticated, (req, res) => {
    const username = req.session.username || 'Misafir';
    res.render('profile', { username }); // req değil, username değişkeni geçiyoruz
});

// *** YENİ EKLENEN KISIM: Çıkış (Logout) Rotası ***
app.get('/logout', (req, res) => {
    req.session.destroy(err => { // Oturumu sonlandır
        if (err) {
            console.error('Oturum sonlandırma hatası:', err);
            return res.redirect('/');
        }
        res.clearCookie('connect.sid'); // Oturum çerezini temizle
        res.redirect('/signin?message=CikisBasarili'); // Giriş sayfasına yönlendir
    });
});

// <<< BURADA DEĞİŞİKLİK YAPILDI: async/await ve formatSQL kullanımı
app.post('/save-draft', isAuthenticated, async (req, res) => {
    const { title, content } = req.body;
    const userId = req.session.userId; // session'dan kullanıcı ID'si

    if (!title || !content) {
        return res.status(400).json({ success: false, message: "Eksik veri: Başlık ve içerik gereklidir." });
    }

    const currentDbDialect = process.env.DB_DIALECT || 'mysql'; // Mevcut veritabanı türünü al
    const rawSql = "INSERT INTO travel_drafts (user_id, title, content) VALUES (?, ?, ?)";
    const sql = formatSQL(rawSql, currentDbDialect); // formatSQL'i kullan

    try {
        await pool.query(sql, [userId, title, content]); // pool.query artık promise döner
        res.status(200).json({ success: true, message: "Seyahat planı başarıyla kaydedildi!" });
    } catch (err) {
        console.error("Veritabanı hatası:", err);
        res.status(500).json({ success: false, message: "Seyahat planı kaydedilirken bir hata oluştu." });
    }
});

// API Rotaları
app.use('/api', chatbotRoutes); // Chatbot API rotaları
app.use('/api/auth', authRoutes); // Auth (Login/Register) API Rotaları

// Sunucu portu
const port = process.env.PORT || 3000;

// HTTP sunucusunu başlat
http.listen(port, '0.0.0.0', () => {
    console.log(`Sunucu çalışıyor, IP: ${'0.0.0.0'}, Port: ${port}`);
});

// --- Hata Yakalama Middleware'leri (En altta olmalı) ---

// 404 sayfası yönlendirmesi (Tüm tanımlı rotalardan sonra gelmeli)
app.use((req, res, next) => {
    res.status(404).render('404'); // '404.ejs' şablonunuz olmalı
});

// Hata yakalama middleware'i (Tüm diğer middleware ve rotalardan sonra gelmeli)
app.use((err, req, res, next) => {
    console.error(err.stack); // Hata detaylarını konsola yazdır
    res.status(500).render('404'); // Sunucu hatasında da 404 sayfasını göster (veya özel bir 500 sayfası)
});