async function getHotels(destination, date, nights) {
    return {
      total: 3000,
      details: {
        name: "Örnek Hotel",
        location: destination,
        pricePerNight: 1000,
        nights,
      },
    };
  }
  
  module.exports = { getHotels };
  