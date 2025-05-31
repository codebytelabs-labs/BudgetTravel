const express = require('express');
const session = require('express-session');
const path = require('path');
const https = require('https');
const app = express();
const http = require('http').Server(app);
require("dotenv").config();


const chatbotRoutes = require("./routes/chatbot");


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.set('view engine','html');

app.set('trust proxy', 1); // Vercel gibi proxy arkasında çalışırken şart

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(express.static('public', express.static(path.join(__dirname, 'public'))));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.get('/', (req, res) => res.render("index.ejs"));
app.get('/about', (req, res) => res.render("about.ejs"));
app.get('/signin', (req, res) => res.render("signin_user.ejs"));
app.get('/signup', (req, res) => res.render("signup_user.ejs"));
app.get('/contact', (req, res) => res.render("contact.ejs"));
app.get('/destinations', (req, res) => res.render("chatbot.ejs"));

// AI Tatil Planlayıcı Form Sayfası
app.get('/chatbot', (req, res) => res.render("chatbot.ejs"));

app.use('/api', chatbotRoutes);






const port = process.env.PORT || 3000;
const ipAddress = '127.0.0.1'; // Örnek bir IP adresi, kendi IP'nizi kullanmalısınız

app.set('host', '127.0.0.1');

http.listen(port, ipAddress, () => {
  console.log(`Sunucu çalışıyor, IP: ${ipAddress}, Port: ${port}`);
});

// 404 sayfası yönlendirmesi
app.use((req, res, next) => {
    res.status(404).render('404');
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('404');
});