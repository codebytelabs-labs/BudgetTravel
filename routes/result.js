const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const {
  generateItinerary,
  generateFlights,
  generateHotels
} = require('../services/travel');
const { extractPlaceNames } = require('../utils/placeExtractor');
const { getGooglePlaces } = require('../services/googlePlacesService');

router.post('/chatbot', async (req, res) => {
  const { itineraryPrompt, flightsPrompt, hotelsPrompt, city } = req.body;

  try {
    const itinerary = await generateItinerary(itineraryPrompt);
    const flights = await generateFlights(flightsPrompt);
    const hotels = await generateHotels(hotelsPrompt);

    const combinedText = `${itinerary}\n${hotels}`;
    const placeNames = extractPlaceNames(combinedText);
    console.log('Extracted places:', placeNames);

    const { googleHotels, googleAttractions } = await getGooglePlaces(placeNames, city);
    console.log('Hotels:', googleHotels.length, 'Attractions:', googleAttractions.length);

    req.session.itinerary = itinerary;
    req.session.flights = flights;
    req.session.hotels = hotels;
    req.session.googleHotels = googleHotels;
    req.session.googleAttractions = googleAttractions;

    res.redirect('/api/chatbot/result');
  } catch (error) {
    console.error('Chatbot işleminde hata:', error);
    res.status(500).send("Bir hata oluştu.");
  }
});

function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/signin?message=GirisYapmalisiniz');
}

// Taslak seyahat planı kaydetme
router.post('/save-draft', isAuthenticated, (req, res) => {
  const { title, content } = req.body;
  const userId = req.session.userId;

  if (!title || !content) {
    return res.status(400).send("Eksik veri");
  }

  const sql = "INSERT INTO travel_drafts (user_id, title, content) VALUES (?, ?, ?)";
  pool.query(sql, [userId, title, content], (err, result) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).send("Bir hata oluştu.");
    }

    res.redirect('/profile#drafts');
  });
});


router.get('/chatbot/result', (req, res) => {
  const {
    itinerary,
    flights,
    hotels,
    googleHotels = [],
    googleAttractions = []
  } = req.session;

  if (!itinerary || !flights || !hotels) {
    return res.status(400).send("Eksik veriler: Seyahat planı, uçuşlar veya oteller bulunamadı.");
  }

  const chatbotResult = `${itinerary}\n\n${flights}\n\n${hotels}`;

  res.render('chatbot_result', {
    itinerary,
    flights,
    hotels,
    googleHotels,
    googleAttractions,
    chatbotResult
  });
});



module.exports = router;
