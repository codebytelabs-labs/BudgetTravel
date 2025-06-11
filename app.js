// app.js
const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const http = require('http').Server(app); // HTTP sunucusu
require("dotenv").config(); // .env dosyasındaki değişkenleri yükle

// connect-pg-simple'ı session ile birlikte başlat
const PgSession = require('connect-pg-simple')(session); 

// db.js'den bağlantı havuzunu, test fonksiyonunu ve formatSQL'i alıyoruz
const { pool, testDbConnection, formatSQL } = require('./db');
// Veritabanı bağlantısı ve auth rotaları
const authRoutes = require('./routes/authRoutes'); // Auth rotalarını al

// Diğer rotalar (chatbotRoutes gibi)
const chatbotRoutes = require("./routes/result"); // Örneğin: /api/chatbot gibi rotalar


const port = process.env.PORT || 3000;

// --- Middleware'ler ---
// Middleware'lerin sırası önemlidir!

// 1. Statik dosyalar için middleware
app.use(express.static(path.join(__dirname, 'public')));

// 2. Body parser middleware'leri
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// 3. Oturum (Session) middleware'i
// PostgreSQL kullanıyorsanız (Render üzerinde büyük ihtimalle) PgSession kullanın.
// Aksi halde MemoryStore (yerel geliştirme için) veya başka bir depolama kullanın.
const sessionStore = process.env.DB_DIALECT === 'postgres'
    ? new PgSession({
        pool: pool, // db.js'den gelen PostgreSQL havuzunu kullan
        tableName: 'session', // Oturum bilgilerinin saklanacağı tablo adı
        // Render gibi üretim ortamlarında HTTPS kullanıldığında 'secure' çerezler için proxy ayarı:
        // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    : new session.MemoryStore(); // Lokal development veya MySQL kullanıyorsanız MemoryStore

app.use(session({
    secret: process.env.SECRET_KEY || 'your-super-secret-key-fallback', // .env'den SECRET_KEY kullanın
    resave: false, // Oturum değişmediği sürece yeniden kaydetme
    saveUninitialized: false, // Yeni, başlatılmamış oturumları kaydetme
    store: sessionStore, // Oturum depolama çözümü
    cookie: {
        // secure: true olmalı eğer HTTPS kullanıyorsanız. Render üretimde HTTPS kullanır.
        secure: process.env.NODE_ENV === 'production', 
        httpOnly: true, // Tarayıcı tarafındaki JavaScript'ten çereze erişimi engeller
        maxAge: 1000 * 60 * 60 * 24 // 1 gün (milisaniye cinsinden)
    }
}));

// Vercel/Render gibi proxy arkasında çalışırken güvenli çerezler için
app.set('trust proxy', 1); 

// 4. Veritabanı bağlantısını test et
testDbConnection();

// 5. View Engine ayarları
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// --- res.locals.user Atamasını Yapan Middleware ---
// Bu middleware, her istekte EJS şablonlarına `user` değişkenini aktarır.
// **ÖNEMLİ:** Buradaki `req.session.user` objesi, `authController.js`'deki `loginUser` fonksiyonunda
// `req.session.user = { userId: ..., username: ..., isLoggedIn: true };` şeklinde doğru ayarlanmalıdır.
app.use((req, res, next) => {
    // Debugging çıktılarını artık kaldırabiliriz, temiz bir kod için:
    // console.log('Middleware - req.session (before res.locals):', req.session);
    // console.log('Middleware - req.session.user (before res.locals):', req.session.user);

    res.locals.user = req.session.user || null;

    // console.log('Middleware - res.locals.user (after setting):', res.locals.user);
    next();
});

// --- Kimlik Doğrulama Middleware'i ---
// Bu middleware, sadece giriş yapmış kullanıcıların erişmesi gereken rotalara uygulanacak.
function isAuthenticated(req, res, next) {
    // req.session.user.isLoggedIn kontrolü ile kullanıcının oturum açıp açmadığını kontrol et
    // authController'da req.session.user objesi altına kaydettiğimiz isLoggedIn'i kullanıyoruz.
    if (req.session && req.session.user && req.session.user.isLoggedIn) {
        return next(); // Kullanıcı oturum açtıysa, isteği devam ettir.
    }
    // Oturum açmadıysa giriş sayfasına yönlendir ve mesaj göster
    req.session.returnTo = req.originalUrl; // Kullanıcının gelmek istediği URL'yi kaydet
    res.redirect('/signin?message=GirisYapmalisiniz'); 
}


// --- Rotalar ---

// Ana sayfa ve diğer statik sayfalar için GET rotaları
app.get('/', (req, res) => res.render("index.ejs"));
app.get('/about', (req, res) => res.render("about.ejs"));

// Giriş rotası
app.get('/signin', (req, res) => {
    // Eğer kullanıcı zaten giriş yapmışsa ve session.user.isLoggedIn true ise, profil sayfasına yönlendir
    if (req.session && req.session.user && req.session.user.isLoggedIn) {
        return res.redirect('/profile');
    }
    const message = req.query.message; 
    res.render("signin_user.ejs", { message: message }); 
});

app.get('/signup', (req, res) => res.render("signup_user.ejs"));
app.get('/contact', (req, res) => res.render("contact.ejs"));
app.get('/destinations', (req, res) => res.render("chatbot.ejs")); // Eğer chatbot.ejs ise
app.get('/chatbot', (req, res) => res.render("chatbot.ejs")); // Aynı sayfayı farklı rota ile
app.get('/routes_page', (req, res) => res.render("routes_page.ejs"))


// Profil Sayfası Rotası (isAuthenticated middleware'i ile korumalı)
app.get('/profile', isAuthenticated, async (req, res) => { // async ekledik
    try {
        const userId = req.session.user.userId; // Oturumdan kullanıcı ID'sini al

        const currentDbDialect = process.env.DB_DIALECT || 'mysql';
        const rawSql = "SELECT id, title, content, created_at FROM travel_drafts WHERE user_id = ? ORDER BY created_at DESC";
        const sql = formatSQL(rawSql, currentDbDialect);

        let drafts;
        if (currentDbDialect === 'postgres') {
            const result = await pool.query(sql, [userId]);
            drafts = result.rows;
        } else {
            const [rows] = await pool.query(sql, [userId]);
            drafts = rows;
        }
        
        // Profil sayfasına user objesi ve drafts (taslaklar) dizisini gönderiyoruz
        res.render('profile.ejs', { user: req.session.user, drafts: drafts }); 

    } catch (error) {
        console.error('Profil sayfası yüklenirken taslaklar çekilemedi:', error);
        // Hata durumunda bile profil sayfasını user objesiyle render et, ancak taslaklar boş olsun
        res.render('profile.ejs', { user: req.session.user, drafts: [] }); 
    }
});
// Çıkış (Logout) Rotası
app.get('/logout', (req, res) => {
    req.session.destroy(err => { 
        if (err) {
            console.error('Oturum sonlandırma hatası:', err);
            return res.redirect('/');
        }
        res.clearCookie('connect.sid'); // Oturum çerezini temizle
        res.redirect('/signin?message=CikisBasarili'); 
    });
});

// Seyahat Taslağı Kaydetme Rotası (isAuthenticated middleware'i ile korumalı)
app.post('/save-draft', isAuthenticated, async (req, res) => {
    const { title, content } = req.body;
    // userId'yi doğrudan req.session.user objesinden alıyoruz
    const userId = req.session.user.userId; 

    if (!title || !content) {
        return res.status(400).json({ success: false, message: "Eksik veri: Başlık ve içerik gereklidir." });
    }

    const currentDbDialect = process.env.DB_DIALECT || 'mysql'; 
    const rawSql = "INSERT INTO travel_drafts (user_id, title, content) VALUES (?, ?, ?)";
    const sql = formatSQL(rawSql, currentDbDialect); 

    try {
        await pool.query(sql, [userId, title, content]); 
        res.status(200).json({ success: true, message: "Seyahat planı başarıyla kaydedildi!" });
    } catch (err) {
        console.error("Veritabanı hatası:", err);
        res.status(500).json({ success: false, message: "Seyahat planı kaydedilirken bir hata oluştu." });
    }
});

// API Rotaları
app.use('/api', chatbotRoutes); 
app.use('/api/auth', authRoutes); 

// --- Sunucuyu Başlatma ---
http.listen(port, '0.0.0.0', () => {
    console.log(`Sunucu çalışıyor, IP: ${'0.0.0.0'}, Port: ${port}`);
});

// --- Hata Yakalama Middleware'leri (En altta olmalı) ---

// 404 sayfası yönlendirmesi
app.use((req, res, next) => {
    res.status(404).render('404'); // '404.ejs' şablonunuz olmalı
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
    console.error(err.stack); 
    res.status(500).render('404'); // Veya özel bir 500 sayfası
});