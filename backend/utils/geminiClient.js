// Check if we have environment variables set up for Gemini API
const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== '';

let generateForecast;

if (hasApiKey) {
  // Real Gemini implementation
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  generateForecast = async function(prompt) {
    try {

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      // Fall back to mock if API fails
      return "Nope";
    }
  };
}


module.exports = generateForecast;
