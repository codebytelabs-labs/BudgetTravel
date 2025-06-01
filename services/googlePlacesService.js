const axios = require('axios');
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

// Helper: Get place ID from text query
async function getPlaceId(query) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query,
        key: GOOGLE_MAPS_API_KEY
      }
    });
    if (response.data.results.length > 0) {
      return response.data.results[0].place_id;
    }
  } catch (err) {
    console.error('Error fetching place ID for:', query, err.message);
  }
  return null;
}

// Helper: Get detailed info from place ID
async function getPlaceDetails(placeId) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,rating,types,reviews',
        key: GOOGLE_MAPS_API_KEY
      }
    });
    return response.data.result;
  } catch (err) {
    console.error('Error fetching place details for:', placeId, err.message);
    return null;
  }
}

// 🧠 Main Function: get all places and categorize
async function getGooglePlaces(placeNames = [], city = '') {
  const places = [];

  for (const name of placeNames) {
    const query = `${name} ${city}`;
    const placeId = await getPlaceId(query);
    if (!placeId) continue;

    const placeDetails = await getPlaceDetails(placeId);
    if (placeDetails) places.push(placeDetails);
  }

  const googleHotels = places.filter(
    p =>
      (p.types && p.types.includes('lodging')) ||
      p.name.toLowerCase().includes('hotel')
  );

  const googleAttractions = places.filter(
    p =>
      !(p.types && p.types.includes('lodging')) &&
      !p.name.toLowerCase().includes('hotel')
  );

  return {
    googleHotels,
    googleAttractions
  };
}

module.exports = {
  getGooglePlaces
};
