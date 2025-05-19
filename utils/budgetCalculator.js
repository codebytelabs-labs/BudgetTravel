function splitBudget(total, flightCost, hotelCost) {
    const activities = total - (flightCost + hotelCost);
    return {
      flight: flightCost,
      hotel: hotelCost,
      activities: activities > 0 ? activities : 0,
    };
  }
  
  module.exports = { splitBudget };