require('dotenv').config();
const express= require('express');
const cors = require('cors');
const app = express();
const pool= require('./db');

app.use(cors());
app.use(express.json());

app.post('/new',async (req,res)=>{
    try{
        console.log(req.body);
        const {expense,month,category} = req.body;
        
        const newExpense = await pool.query(
            "INSERT INTO budget (category,month,expense) VALUES ($1, $2, $3) RETURNING *",
            [category, month, expense]
        );
        res.json(newExpense.rows[0]);
    }catch(err){
        console.error(err.message);
        res.status(500).send("Add expense failed");
    }
})

app.get('/new',async (req,res)=>{
    try{
        const allExpenses = await pool.query("SELECT * FROM budget");
        res.json(allExpenses.rows);
    }catch(err){
        console.error(err.message);
        res.status(500).send("Get expenses failed");
    }
})

app.get('/api/category-costs', async (req, res) => {
  try {
    const result = await pool.query(`SELECT category, SUM(expense) AS total_cost FROM budget GROUP BY category`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.get('/api/month-costs', async (req, res) => {
  try {
    const result = await pool.query(`SELECT month, SUM(expense) AS total_cost FROM budget GROUP BY month`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Update expense endpoint
app.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, month, expense } = req.body;
    
    const updateExpense = await pool.query(
      "UPDATE budget SET category = $1, month = $2, expense = $3 WHERE id = $4 RETURNING *",
      [category, month, expense, id]
    );
    
    if (updateExpense.rows.length === 0) {
      return res.status(404).send("Expense not found");
    }
    
    res.json(updateExpense.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Update expense failed");
  }
});

// Delete expense endpoint
app.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteExpense = await pool.query("DELETE FROM budget WHERE id = $1 RETURNING *", [id]);
    
    if (deleteExpense.rows.length === 0) {
      return res.status(404).send("Expense not found");
    }
    
    res.json({ message: "Expense deleted successfully", deleted: deleteExpense.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Delete expense failed");
  }
});

//new code,please update this only

const generateForecast = require('./utils/geminiClient');
const generatePrompt = require('./utils/geminiPrompt');

app.get('/predict', async (req, res) => {
  try {
    // Get monthly aggregated data directly from database
    const monthlyResult = await pool.query(`SELECT month, SUM(expense) AS total_cost FROM budget GROUP BY month`);
    const monthlyExpenses = monthlyResult.rows;

    const prompt = generatePrompt(monthlyExpenses);

    const llmOutput = await generateForecast(prompt);

    const match = llmOutput.match(/\{[\s\S]*\}/);
    let prediction = {};
    if (match) {
      try {
        prediction = JSON.parse(match[0]);
      } catch (e) {
        console.error("Failed to parse Gemini output", e);
        prediction = { error: "Failed to parse AI response" };
      }
    } else {
      prediction = { error: "No valid prediction found in AI response" };
    }

    res.json({ prediction, monthlyExpenses });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Prediction generation failed" });
  }
});

// New endpoint for category-specific budget suggestions
app.post('/budget-suggestions', async (req, res) => {
  try {
    const { selectedCategories, income } = req.body;
    
    // Get monthly aggregated data
    const monthlyResult = await pool.query(`SELECT month, SUM(expense) AS total_cost FROM budget GROUP BY month ORDER BY month`);
    const monthlyExpenses = monthlyResult.rows;

    // Get category aggregated data
    const categoryResult = await pool.query(`SELECT category, SUM(expense) AS total_cost FROM budget GROUP BY category`);
    const categoryExpenses = categoryResult.rows;

    // Get available categories for reference
    const availableCategories = categoryExpenses.map(cat => cat.category);

    // Pass all parameters to generatePrompt including income
    const prompt = generatePrompt(monthlyExpenses, categoryExpenses, selectedCategories, selectedCategories, 30000, income);

    const llmOutput = await generateForecast(prompt);

    const match = llmOutput.match(/\{[\s\S]*\}/);
    let budgetSuggestion = {};
    if (match) {
      try {
        budgetSuggestion = JSON.parse(match[0]);
      } catch (e) {
        console.error("Failed to parse Gemini output", e);
        budgetSuggestion = { error: "Failed to parse AI response" };
      }
    } else {
      budgetSuggestion = { error: "No valid budget suggestion found in AI response" };
    }

    res.json({ 
      budgetSuggestion, 
      monthlyExpenses, 
      categoryExpenses,
      availableCategories,
      selectedCategories,
      income
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Budget suggestion generation failed" });
  }
});

// Chat endpoint for the chatbot
app.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get all individual expenses for detailed context
    const allExpensesResult = await pool.query(`SELECT * FROM budget ORDER BY month, category`);
    const allExpenses = allExpensesResult.rows;

    // Get summary data for context
    const monthlyResult = await pool.query(`SELECT month, SUM(expense) AS total_cost FROM budget GROUP BY month ORDER BY month`);
    const monthlyExpenses = monthlyResult.rows;

    const categoryResult = await pool.query(`SELECT category, SUM(expense) AS total_cost FROM budget GROUP BY category`);
    const categoryExpenses = categoryResult.rows;

    // Calculate total expenses
    const totalSpent = categoryExpenses.reduce((sum, cat) => sum + parseFloat(cat.total_cost), 0);

    // Create detailed expense breakdown for AI
    const expenseBreakdown = allExpenses.map(exp => 
      `${exp.month} - ${exp.category}: ₹${exp.expense} (ID: ${exp.id})`
    ).join('\n');

    // Create a budget-focused prompt with user's actual detailed data
    let prompt = `You are a helpful budget and financial assistant. The user is asking: "${message}"

User's Detailed Expense Data:
${expenseBreakdown}

Summary:
Monthly Totals: ${monthlyExpenses.map(m => `${m.month}: ₹${m.total_cost}`).join(', ')}
Category Totals: ${categoryExpenses.map(c => `${c.category}: ₹${c.total_cost}`).join(', ')}
Total Amount Spent: ₹${totalSpent.toFixed(2)}
Total Number of Expenses: ${allExpenses.length}

Please provide helpful, practical advice about budgeting, expense tracking, saving money, or financial planning based on their actual detailed spending data. 

If the question is not related to finances or budgeting, gently redirect the conversation back to financial topics.`;

    // If context is budget_chat, add more specific context
    if (context === 'budget_chat') {
      prompt += `\n\nThis user is actively using a budget tracking application and has the detailed expense data shown above. 
      Provide relevant information to their request in under 100 words.Talk about the trends if they ask anything related to their expenses`;
    }

    const llmOutput = await generateForecast(prompt);
    
    // Clean up the response
    const cleanedResponse = llmOutput.replace(/^\s*[\{\[].*?[\}\]]\s*/, '').trim();
    
    res.json({ 
      response: cleanedResponse || "I'm here to help with your budgeting questions! What would you like to know?",
      timestamp: new Date().toISOString(),
      userExpenseData: {
        allExpenses,
        categoryExpenses,
        monthlyExpenses,
        totalSpent: totalSpent.toFixed(2),
        expenseCount: allExpenses.length
      }
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ 
      error: "I'm having trouble responding right now. Please try again.",
      details: err.message 
    });
  }
});

app.listen(5000,()=>{
    console.log("Server up and running on port 5000");
})