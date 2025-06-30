// Check if we have environment variables set up for Gemini API
const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== '';

let generateForecast;

if (hasApiKey) {
  // Real Gemini implementation
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  generateForecast = async function(prompt) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      // Fall back to mock if API fails
      return getMockResponse();
    }
  };
} else {
  // Mock implementation for development
  console.log('Using mock AI responses - set GEMINI_API_KEY environment variable for real AI');
  
  generateForecast = async function(prompt) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return getMockResponse();
  };
}

function getMockResponse() {
  return `
  Based on your spending patterns, here's my analysis:

  {
    "nextMonthPrediction": "1250.00",
    "categoryPredictions": {
      "food": "450.00",
      "transport": "300.00",
      "entertainment": "200.00",
      "utilities": "250.00"
    },
    "suggestions": [
      "Consider meal planning to reduce food expenses by 15-20%",
      "Look for public transport discounts or carpooling options",
      "Set a monthly entertainment budget limit",
      "Review utility bills for potential savings on energy usage"
    ],
    "budgetAdvice": "Your spending shows consistent patterns. Consider implementing the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.",
    "trends": "Your expenses have been relatively stable over the past months, with slight increases in food and entertainment categories. This indicates good spending discipline."
  }
  `;
}

module.exports = generateForecast;
