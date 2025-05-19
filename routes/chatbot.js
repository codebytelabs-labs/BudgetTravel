const express = require('express');
const router = express.Router(); // Router'ı doğru şekilde tanımlıyoruz
const { generateItinerary, generateFlights, generateHotels } = require('../services/travel');

// Chatbot için post isteği alıyoruz
router.post('/chatbot', async (req, res) => {
  const { itineraryPrompt, flightsPrompt, hotelsPrompt } = req.body;

  try {
    const itinerary = await generateItinerary(itineraryPrompt);
    const flights = await generateFlights(flightsPrompt);
    const hotels = await generateHotels(hotelsPrompt);

    // Verileri session'a ekliyoruz
    req.session.itinerary = itinerary;
    req.session.flights = flights;
    req.session.hotels = hotels;

    // Kullanıcıyı sonuçlar sayfasına yönlendiriyoruz
    res.redirect('/api/chatbot/result');
  } catch (error) {
    console.error('Chatbot işlemi sırasında hata oluştu:', error);
    res.status(500).send("Bir hata oluştu.");
  }
});

// Sonuç sayfasını gösteriyoruz
router.get('/chatbot/result', (req, res) => {
  const itinerary = req.session.itinerary;
  const flights = req.session.flights;
  const hotels = req.session.hotels;

  // Verilerin eksik olup olmadığını kontrol ediyoruz
  if (!itinerary || !flights || !hotels) {
    return res.status(400).send("Eksik veriler: Seyahat planı, uçuşlar veya oteller bulunamadı.");
  }

  res.render('chatbot_result', {
    itinerary,
    flights,
    hotels
  });
});

module.exports = router;  // Router'ı doğru şekilde dışa aktarıyoruz
