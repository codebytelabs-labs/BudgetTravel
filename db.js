require('dotenv').config(); // .env dosyasındaki değişkenleri yükle
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'budget_travel_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL veritabanına başarıyla bağlandı!');
        connection.release(); // Bağlantıyı havuza geri bırak
    } catch (error) {
        console.error('MySQL bağlantı hatası:', error.message);
        process.exit(1); // Uygulamayı sonlandır
    }
}

module.exports = {
    pool,
    testDbConnection
};