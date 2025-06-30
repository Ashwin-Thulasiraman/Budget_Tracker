
function generatePrompt(monthlyExpenses) {
  let prompt = `You are a financial advisor AI. Analyze the following monthly expense data and provide budget predictions and recommendations.

Monthly Expense Data:
`;

  // Add expense data to prompt
  monthlyExpenses.forEach(expense => {
    prompt += `- ${expense.month}: ${expense.total_cost}\n`;
  });

  prompt += `
Please provide your analysis in the following JSON format only (no additional text):
{
  "nextMonthPrediction": "estimated amount for next month",
  "categoryPredictions": {
    "food": "estimated amount",
    "transport": "estimated amount",
    "entertainment": "estimated amount",
    "utilities": "estimated amount"
  },
  "suggestions": [
    "specific money-saving suggestion 1",
    "specific money-saving suggestion 2",
    "specific money-saving suggestion 3"
  ],
  "budgetAdvice": "general budget advice based on spending patterns",
  "trends": "analysis of spending trends over the months"
}

Base your predictions on the spending patterns shown in the data. Provide practical, actionable advice.`;

  return prompt;
}

module.exports = generatePrompt;
