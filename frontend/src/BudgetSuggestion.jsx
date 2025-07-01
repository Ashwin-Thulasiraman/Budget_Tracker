import React, { useState, useEffect } from 'react';
import './BudgetSuggestion.css';

const BudgetSuggestion = () => {
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [budgetSuggestion, setBudgetSuggestion] = useState(null);
  const [income, setIncome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableCategories();
  }, []);

  const fetchAvailableCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/category-costs');
      const data = await response.json();
      setAvailableCategories(data.map(cat => cat.category));
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch available categories');
    }
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  const generateBudgetSuggestion = async () => {
    if (selectedCategories.length === 0 || !income || parseFloat(income) <= 0) {
      setError('Please enter a valid income amount and select at least one category');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/budget-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          selectedCategories, 
          income: parseFloat(income) 
        }),
      });

      const data = await response.json();

      if (data.budgetSuggestion?.error) {
        setError(data.budgetSuggestion.error);
      } else {
        setBudgetSuggestion(data.budgetSuggestion);
      }
    } catch (error) {
      console.error('Error generating budget suggestion:', error);
      setError('Failed to generate budget suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearSelections = () => {
    setSelectedCategories([]);
    setIncome('');
    setBudgetSuggestion(null);
    setError(null);
  };

  return (
    <div className="budget-suggestion-container">
      <div className="budget-suggestion-header">
        <h2>💡 Smart Budget Suggestions</h2>
        <p>Enter your income and select categories to receive personalized budget recommendations based on your spending history</p>
      </div>

      <div className="income-input-section">
        <h3>Monthly Income</h3>
        <div className="income-input">
          <label htmlFor="income">Enter your monthly income (₹):</label>
          <input
            type="number"
            id="income"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="e.g. 40000"
            min="0"
            step="1000"
          />
          {income && parseFloat(income) > 0 && (
            <span className="income-display">Monthly Income: ₹{parseFloat(income).toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="category-selection">
        <h3>Select Categories</h3>
        <div className="category-grid">
          {availableCategories.map((category) => (
            <div
              key={category}
              className={`category-card ${selectedCategories.includes(category) ? 'selected' : ''}`}
              onClick={() => handleCategoryToggle(category)}
            >
              <span className="category-name">{category}</span>
              {selectedCategories.includes(category) && <span className="check-mark">✓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="generate-btn" 
          onClick={generateBudgetSuggestion}
          disabled={loading || selectedCategories.length === 0 || !income || parseFloat(income) <= 0}
        >
          {loading ? 'Generating AI-Powered Suggestions...' : 'Generate Smart Budget Plan'}
        </button>
        <button 
          className="clear-btn" 
          onClick={clearSelections}
          disabled={loading}
        >
          Clear All
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {budgetSuggestion && !error && (() => {
        // Calculate total expenses from category predictions
        const totalExpenses = Object.values(budgetSuggestion.categoryPredictions || {})
          .reduce((sum, amount) => {
            const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.]/g, '')) : amount;
            return sum + (isNaN(numAmount) ? 0 : numAmount);
          }, 0);
        
        // Calculate actual savings as income - total expenses
        const actualSavings = parseFloat(income) - totalExpenses;
        
        return (
          <div className="budget-results">
            <div className="results-header">
              <h3>🎯 Your Personalized Budget Plan</h3>
              <p className="income-context">Based on your monthly income of ₹{parseFloat(income).toLocaleString()}</p>
            </div>

            <div className="prediction-summary">
              <div className="total-prediction">
                <h4>Total Budget Allocation</h4>
                <span className="amount">₹{totalExpenses.toLocaleString()}</span>
              </div>

              <div className="suggested-savings">
                <h4>Expected Savings</h4>
                <span className="amount savings">₹{actualSavings.toLocaleString()}</span>
                <span className="savings-percentage">
                  ({((actualSavings / parseFloat(income)) * 100).toFixed(1)}% of income)
                </span>
              </div>
            </div>

            <div className="category-predictions">
              <h4>Category-wise Budget Recommendations</h4>
              <div className="category-grid">
                {/* Show all available categories, using AI predictions or fallback values */}
                {availableCategories.map((category) => {
                  const predictedAmount = budgetSuggestion.categoryPredictions?.[category.toLowerCase()] || 
                                        budgetSuggestion.categoryPredictions?.[category] || 
                                        '0';
                  const amount = typeof predictedAmount === 'string' ? 
                    parseFloat(predictedAmount.replace(/[^\d.]/g, '')) || 0 : 
                    predictedAmount;
                  
                  return (
                    <div key={category} className="category-prediction-card">
                      <span className="category-name">{category}</span>
                      <span className="predicted-amount">₹{amount.toLocaleString()}</span>
                    </div>
                  );
                })}
                
                {/* Show any additional categories from AI that aren't in available categories */}
                {Object.entries(budgetSuggestion.categoryPredictions || {}).map(([category, amount]) => {
                  if (!availableCategories.includes(category) && !availableCategories.includes(category.charAt(0).toUpperCase() + category.slice(1))) {
                    const numAmount = typeof amount === 'string' ? 
                      parseFloat(amount.replace(/[^\d.]/g, '')) || 0 : 
                      amount;
                    return (
                      <div key={category} className="category-prediction-card">
                        <span className="category-name">{category}</span>
                        <span className="predicted-amount">₹{numAmount.toLocaleString()}</span>
                      </div>
                    );
                  }
                  return null;
                }).filter(Boolean)}
              </div>
            </div>

            <div className="suggestions-section">
              <h4>💰 Money-Saving Suggestions</h4>
              <ul className="suggestions-list">
                {budgetSuggestion.suggestions?.map((suggestion, index) => (
                  <li key={index} className="suggestion-item">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            <div className="advice-section">
              <div className="budget-advice">
                <h4>📊 Budget Advice</h4>
                <p>{budgetSuggestion.budgetAdvice}</p>
              </div>

              <div className="trends-analysis">
                <h4>📈 Spending Trends</h4>
                <p>{budgetSuggestion.trends}</p>
              </div>

              {budgetSuggestion.categoryInsights && (
                <div className="category-insights">
                  <h4>🔍 Category Insights</h4>
                  <p>{budgetSuggestion.categoryInsights}</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default BudgetSuggestion;