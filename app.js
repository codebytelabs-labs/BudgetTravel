const express = require('express');
const path = require('path');
const https = require('https');
const app = express();
const http = require('http').Server(app);



app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.set('view engine','html');

app.use(express.static('public', express.static(path.join(__dirname, 'public'))));

app.get('/', (req, res) => {
  res.render("index.ejs");
});

app.get('/about', (req, res) => {
  res.render("about.ejs");
});


const port = 3000;
const ipAddress = '127.0.0.1'; // Örnek bir IP adresi, kendi IP'nizi kullanmalısınız

app.set('host', '127.0.0.1');

http.listen(3000, ipAddress, () => {
  console.log(`Sunucu çalışıyor, IP: ${ipAddress}, Port: ${port}`);
});