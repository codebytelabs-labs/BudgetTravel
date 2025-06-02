const { pool } = require('../db'); // db.js dosyasından bağlantı havuzunu al
const bcrypt = require('bcryptjs'); // Şifre hash'leme için

// Kullanıcı kayıt fonksiyonu
const registerUser = async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunludur.' });
    }

    try {
        // Şifreyi hash'le
        const hashedPassword = await bcrypt.hash(password, 10); // 10 tuzlama turu

        // Kullanıcıyı veritabanına ekle
        const [result] = await pool.execute(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email || null] // email null olabilir
        );

        // unique hatası (duplicate entry) kontrolü
        if (result.affectedRows === 0) {
             return res.status(500).json({ message: 'Kayıt başarısız oldu. Lütfen tekrar deneyin.' });
        }
        
        return res.status(201).json({ message: 'Kayıt başarılı!', userId: result.insertId });

    } catch (error) {
        // Hata kodu 1062, UNIQUE kısıtlaması ihlal edildiğinde oluşur (yani kullanıcı adı veya e-posta zaten kullanımda)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Bu kullanıcı adı veya e-posta zaten kullanımda.' });
        }
        console.error('Kayıt hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası: Kayıt yapılamadı.' });
    }
};

// Kullanıcı giriş fonksiyonu
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunludur.' });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT id, username, password FROM users WHERE username = ?',
            [username]
        );

        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı.' });
        }

        // --- BURADA KULLANICI BİLGİSİNİ OTURUMA KAYDETME KISMI ---
        // Express-session kullanıyorsanız:
        req.session.userId = user.id;
        req.session.username = user.username; // *** BU SATIR ÇOK ÖNEMLİ! ***
        req.session.isLoggedIn = true; // Oturum açtığını belirtmek için ek bir bayrak

        // Eğer Postman/tarayıcı konsolunda 'token' alıp, frontend'de localStorage kullanıyorsanız:
        // const jwt = require('jsonwebtoken'); // Eğer JWT kullanıyorsanız bu gerekli
        // const token = jwt.sign({ id: user.id, username: user.username }, process.env.SECRET_KEY, { expiresIn: '1h' });
        // return res.status(200).json({ message: 'Giriş başarılı!', token: token, user: { id: user.id, username: user.username } });
        // Şu an sadece session kullanıyoruz, o yüzden JWT kısmı yorumlu kalabilir.

        // Başarılı giriş mesajı ve kullanıcı bilgileri
        return res.status(200).json({ message: 'Giriş başarılı!', user: { id: user.id, username: user.username } });

    } catch (error) {
        console.error('Giriş hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası: Giriş yapılamadı.' });
    }
};

module.exports = {
    registerUser,
    loginUser
};