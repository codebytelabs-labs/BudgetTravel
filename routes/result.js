const express = require('express');
const router = express.Router();

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

  

  res.render('chatbot_result', {
    itinerary,
    flights,
    hotels,
    googleHotels,
    googleAttractions
  });
});


module.exports = router;
