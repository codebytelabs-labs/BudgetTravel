const OpenAI = require("openai");
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // API key'inizi burada alacaksınız
});

module.exports = openai;
