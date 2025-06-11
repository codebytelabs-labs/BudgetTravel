// authController.js
const { pool, formatSQL } = require('../db'); // db.js dosyasından pool ve formatSQL'i alıyoruz
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
        // currentDbDialect'i db.js'deki gibi alıyoruz
        const currentDbDialect = process.env.DB_DIALECT || 'mysql';
        const rawSql = 'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)';
        const sql = formatSQL(rawSql, currentDbDialect); // SQL sorgusunu veritabanı türüne göre formatla

        // <<< BURADA DEĞİŞİKLİK YAPILDI: pool.execute yerine pool.query kullanıldı
        // Ayrıca, PostgreSQL'de insert sonrası id almak için RETURNING kullanılır.
        let queryResult;
        if (currentDbDialect === 'postgres') {
            // PostgreSQL'de insertId almak için RETURNING id ekliyoruz
            const result = await pool.query(sql + ' RETURNING id', [username, hashedPassword, email || null]);
            queryResult = {
                affectedRows: result.rowCount, // PostgreSQL'de etkilenen satır sayısı result.rowCount ile gelir
                insertId: result.rows[0] ? result.rows[0].id : null // PostgreSQL'de insertId result.rows[0].id ile gelir
            };
        } else {
            // MySQL için pool.query'ye devam edebiliriz (execute yerine query de çalışır)
            // Ya da MySQL'e özgü result formatını korumak için execute'u tekrar düşünebiliriz.
            // Ancak pool.query, mysql2/promise'da da kullanılabilir.
            const [result] = await pool.query(sql, [username, hashedPassword, email || null]);
            queryResult = {
                affectedRows: result.affectedRows,
                insertId: result.insertId
            };
        }


        // unique hatası (duplicate entry) kontrolü - MySQL için error.code === 'ER_DUP_ENTRY' idi.
        // PostgreSQL için duplicate entry hatası kodu '23505'tir.
        // affectedRows kontrolü hala geçerli
        if (queryResult.affectedRows === 0) {
            return res.status(500).json({ message: 'Kayıt başarısız oldu. Lütfen tekrar deneyin.' });
        }

        return res.status(201).json({ message: 'Kayıt başarılı!', userId: queryResult.insertId });

    } catch (error) {
        console.error('Kayıt hatası:', error);
        // Hata kodu 1062 (ER_DUP_ENTRY) MySQL'e özgüdür.
        // PostgreSQL'de UNIQUE kısıtlama ihlali '23505' hata koduyla gelir.
        if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
            return res.status(409).json({ message: 'Bu kullanıcı adı veya e-posta zaten kullanımda.' });
        }
        return res.status(500).json({ message: 'Sunucu hatası: Kayıt yapılamadı.' });
    }
};

// Kullanıcı giriş fonksiyonu
const loginUser = async (req, res) => {
    const { username, password } = req.body; // Gelen 'username' alanı, hem kullanıcı adı hem de e-posta olabilir

    if (!username || !password) {
        return res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunludur.' });
    }

    try {
        const currentDbDialect = process.env.DB_DIALECT || 'mysql';
        // <<< BURADA ÖNEMLİ DEĞİŞİKLİK: Sorgu hem username hem de email'i kontrol ediyor
        // Ayrıca SELECT ifadesine email'i de ekliyoruz, böylece kullanıcı objesinde email bilgisi de olur.
        const rawSql = 'SELECT id, username, password_hash, email FROM users WHERE username = ? OR email = ?';
        const sql = formatSQL(rawSql, currentDbDialect);

        let rows;
        if (currentDbDialect === 'postgres') {
            // PostgreSQL'de iki parametre de aynı değeri alır
            const result = await pool.query(sql, [username, username]); 
            rows = result.rows;
        } else {
            // MySQL'de iki parametre de aynı değeri alır
            const [mysqlRows] = await pool.query(sql, [username, username]); 
            rows = mysqlRows;
        }

        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı.' });
        }

        // Oturum bilgilerini req.session.user objesi olarak sakla
        req.session.user = {
            userId: user.id,
            username: user.username,
            email: user.email, // Email'i de oturum objesine ekliyoruz
            isLoggedIn: true
        };

        return res.status(200).json({ message: 'Giriş başarılı!', user: { id: user.id, username: user.username, email: user.email } });

    } catch (error) {
        console.error('Giriş hatası:', error);
        return res.status(500).json({ message: 'Sunucu hatası: Giriş yapılamadı.' });
    }
};
module.exports = {
    registerUser,
    loginUser
};