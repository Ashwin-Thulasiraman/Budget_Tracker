function generatePrompt(monthlyExpenses = [], categoryExpenses = [], selectedCategories = [], budgetItems = [], totalBudget = 30000, income = null) {
  let prompt = `
You are a personal finance assistant. A user wants to plan their expenses for the next month.

They mentioned the following areas they will spend on:
${budgetItems.map(item => `- ${item}`).join('\n')}

Please allocate a realistic and smart monthly budget (in INR) across these items, based on their previous history of expenses.

${income ? `The user's monthly income is ₹${income}. Suggest a suitable savings amount.` : ''}

Rules:
- Do NOT exceed expenditure where expenditure=income-suitable_savings_amount.
- Strictly Do not talk about anything not related to finances.
- Respond only with a valid JSON object. No explanations or comments.
`;

  // Add monthly total expense data
  if (monthlyExpenses.length > 0) {
    prompt += `\nUser's Monthly Expenses (last few months):\n`;
    monthlyExpenses.forEach(expense => {
      prompt += `- ${expense.month}: ₹${expense.total_cost}\n`;
    });
  }

  // Add category-wise historical expense data
  if (categoryExpenses.length > 0) {
    prompt += `\nCategory-wise Historical Data:\n`;
    categoryExpenses.forEach(category => {
      prompt += `- ${category.category}: ₹${category.total_cost}\n`;
    });
  }

  if (selectedCategories.length > 0) {
    prompt += `\nThe user is specifically interested in budget suggestions for: ${selectedCategories.join(', ')}\n`;
  }

  prompt += `\nPlease provide your response in the following strict JSON format only (no extra commentary or markdown):\n{
  "nextMonthPrediction": "estimated total amount for next month",
  "categoryPredictions": {`;

  if (selectedCategories.length > 0) {
    selectedCategories.forEach((category, index) => {
      prompt += `\n    \"${category.toLowerCase()}\": \"estimated amount\"`;
      if (index < selectedCategories.length - 1) prompt += ',';
    });
  } else {
    prompt += `
    \"food\": \"estimated amount\",
    \"travel\": \"estimated amount\",
    \"housing\": \"estimated amount\"`

  }

  prompt += `
  },
  "suggestedSavings": "amount to save from income",
  "suggestions": [
    "specific money-saving suggestion 1",
    "specific money-saving suggestion 2",
    "specific money-saving suggestion 3"
  ],
  "budgetAdvice": "based on last 3 months expenses,should the user increase or decrease their budget? should they take a loan?",
  "trends": "analysis of spending trends over the months",
  "categoryInsights": "tell which categories to reduce spending on based on last three months"
}

Base your predictions on the spending patterns shown in the data. Focus especially on the selected categories if provided. Provide practical, actionable advice.`;

  return prompt;
}

module.exports = generatePrompt;
