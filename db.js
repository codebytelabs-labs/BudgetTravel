// db.js
require('dotenv').config(); // .env dosyasındaki değişkenleri yükle

// Dinamik olarak doğru veritabanı sürücüsünü yükle
let pool;
let dbType = process.env.DB_DIALECT || 'mysql'; // Varsayılan olarak 'mysql' kullan


if (dbType === 'postgres') {
    const { Pool } = require('pg'); // PostgreSQL için pg kütüphanesi
    pool = new Pool({
        connectionString: process.env.DATABASE_URL, // Render PostgreSQL için connectionString
        ssl: {
            // Sadece production (Render) ortamında SSL gerekli
            // NODE_ENV 'production' ise ssl.rejectUnauthorized: false ayarı yapılmalı
            // Aksi takdirde yerelde 'development' ise bu ayarı kapatabiliriz.
            // veya Render kendi bağlantı URL'sinde bunu hallediyor olabilir.
            // En güvenlisi ortam değişkenine göre ayarlamaktır.
            rejectUnauthorized: process.env.NODE_ENV !== 'development' // Geliştirme ortamında SSL sertifika doğrulamasını kapat
        }
    });
    console.log('PostgreSQL bağlantısı için yapılandırıldı.');
} else {
    // MySQL için mysql2/promise kütüphanesi
    const mysql = require('mysql2/promise');
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'budget_travel_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    console.log('MySQL bağlantısı için yapılandırıldı.');
}


async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(`${dbType.toUpperCase()} veritabanına başarıyla bağlandı!`);
        connection.release(); // Bağlantıyı havuza geri bırak
    } catch (error) {
        console.error(`${dbType.toUpperCase()} bağlantı hatası:`, error.message);
        process.exit(1); // Uygulamayı sonlandır
    }
}

// SQL sorguları için yardımcı fonksiyon (placeholder'ları dönüştürmek için)
// MySQL '?', PostgreSQL '$1, $2' kullanır
function formatSQL(sql, dbDialect) {
    if (dbDialect === 'postgres') {
        let i = 0;
        return sql.replace(/\?/g, () => `$${++i}`);
    }
    return sql;
}

module.exports = {
    pool,
    testDbConnection,
    formatSQL // Artık formatSQL fonksiyonunu da dışa aktarıyoruz
};