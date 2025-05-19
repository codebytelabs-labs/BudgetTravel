const openai = require('../ai/openaiClient');

const model = "gpt-4.1";

async function generateItinerary(prompt) {
  const response = await openai.chat.completions.create({
    model: model, // GPT-4 modelini kullanıyoruz
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
}

async function generateFlights(prompt) {
  const response = await openai.chat.completions.create({
    model: model, 
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
}

async function generateHotels(prompt) {
  const response = await openai.chat.completions.create({
    model: model, 
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
}

module.exports = { generateItinerary, generateFlights, generateHotels };
