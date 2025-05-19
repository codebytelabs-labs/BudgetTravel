async function getFlights(origin, destination, date) {
    return {
      price: 2500,
      details: {
        airline: "THY",
        from: origin,
        to: destination,
        date: date,
      },
    };
  }
  
  module.exports = { getFlights };
  