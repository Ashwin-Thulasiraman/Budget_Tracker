import { useState } from 'react'
import BudgetSuggestion from './BudgetSuggestion'
import './App.css'
import { useEffect } from 'react'

function App() {
  const [expenses, setExpenses] = useState([])
  const [formData, setFormData] = useState({
    month: '',
    category: '',
    expense: ''
  });

  const [categoryCosts,setCategoryCosts]= useState([]);
  const [monthCosts, setMonthCosts] = useState([]);
  const [groupBy,setGroupBy] = useState('category'); 
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [budgetAnalysis, setBudgetAnalysis] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    month: '',
    category: '',
    expense: ''
  });
  const months= ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  useEffect(()=>{
    const fetchExpenses = async () => {
      try {
        const response = await fetch('http://localhost:5000/new');
        const data = await response.json();
        setExpenses(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const fetchCategoryCosts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/category-costs');
        const data = await response.json();
        setCategoryCosts(data);
      } catch (error) {
        console.error('Error fetching category costs:', error);
      }
    };

    const fetchMonthCosts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/month-costs');
        const data = await response.json();
        setMonthCosts(data);
      } catch (error) {
        console.error('Error fetching month costs:', error);
      }
    };

    fetchExpenses();
    fetchCategoryCosts(); 
    fetchMonthCosts();
  }, [])


  const analyzeBudget = () => {
    if (monthlyIncome && monthCosts.length > 0) {
      const income = parseFloat(monthlyIncome);
      const analysis = monthCosts.map(monthData => ({
        month: monthData.month,
        totalExpense: parseFloat(monthData.total_cost),
        income: income,
        difference: income - parseFloat(monthData.total_cost),
        isOverBudget: parseFloat(monthData.total_cost) > income
      }));
      setBudgetAnalysis(analysis);
    } else {
      setBudgetAnalysis([]);
    }
  };

  // Trigger budget analysis when income or month costs change
  useEffect(() => {
    analyzeBudget();
  }, [monthlyIncome, monthCosts]);

  // Function to refresh all data
  const refreshData = async () => {
    try {
      const [expensesRes, categoryCostsRes, monthCostsRes] = await Promise.all([
        fetch('http://localhost:5000/new'),
        fetch('http://localhost:5000/api/category-costs'),
        fetch('http://localhost:5000/api/month-costs')
      ]);

      const [expensesData, categoryCostsData, monthCostsData] = await Promise.all([
        expensesRes.json(),
        categoryCostsRes.json(),
        monthCostsRes.json()
      ]);
      setExpenses(expensesData);
      setCategoryCosts(categoryCostsData);
      setMonthCosts(monthCostsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Start editing an expense
  const startEdit = (expense) => {
    setEditingId(expense.id);
    setEditFormData({
      month: expense.month,
      category: expense.category,
      expense: expense.expense.toString()
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      month: '',
      category: '',
      expense: ''
    });
  };

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  // Save edited expense
  const saveEdit = async (id) => {
    const { month, category, expense } = editFormData;
    
    // Validation
    if (!month || !category || !expense) {
      alert("All fields are required");
      return;
    }
    
    if (expense < 0) {
      alert("Expense must be a positive number");
      return;
    }
    
    if (!months.includes(month.toLowerCase())) {
      alert("Month must be a valid month");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: month.toLowerCase(),
          category,
          expense: parseFloat(expense)
        })
      });

      if (response.ok) {
        await refreshData();
        setEditingId(null);
        setEditFormData({
          month: '',
          category: '',
          expense: ''
        });
        alert("Expense updated successfully");
      } else {
        alert("Failed to update expense");
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert("Error updating expense");
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        const response = await fetch(`http://localhost:5000/delete/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await refreshData();
          alert("Expense deleted successfully");
        } else {
          alert("Failed to delete expense");
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert("Error deleting expense");
      }
    }
  };

  const handleChange = (e) => {

    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };
  const submitDetails = async (e) => {
    e.preventDefault();
    const body=formData;
    const { month, category, expense } = body;
    console.log(body);
    if (!month || !category || !expense) {
      alert("All fields are required");
      return;
    }
    
    if (expense<0) {
      alert("Expense must be a positive number");
      return;
    }
    if (typeof month!=="string"||!months.includes(month.toLowerCase())) {
      alert("Month must be string and a valid month");
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: month.toLowerCase(),
          category,
          expense: parseFloat(expense)
        })
      });
      
      if (response.ok) {
        await refreshData();
        setFormData({
          month: '',
          category: '',
          expense: ''
        });
        alert("Expense added successfully");
      }
    }
      catch(error) {
        console.error('Error:', error);
      }
  }
  return (
    <>
      <h1>Welcome to Budget Tracker</h1>
      

      <div className="income-section">
        <h3>Set Monthly Income/Budget</h3>
        <input 
          type="number" 
          placeholder="Enter your monthly income" 
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
          className="income-input"
        />
        <button 
          onClick={analyzeBudget}
          className="analyze-button"
        >
          Analyze Budget
        </button>
      </div>


      <div className="form-section">
        <h3>Add New Expense</h3>
        <form onSubmit={submitDetails}>
          <select name="month" onChange={handleChange} className="form-input" value={formData.month}>
            <option value="">Select Month</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month.charAt(0).toUpperCase() + month.slice(1)}
              </option>
            ))}
          </select>
          <br></br>
          <input type="text" name="category" placeholder="Enter category" onChange={handleChange} className="form-input" value={formData.category} />
          <br></br>
          <input type="number" name="expense" placeholder="Enter expense" onChange={handleChange} className="form-input" value={formData.expense} />
          <br></br><br></br>
          <button type="submit" className="submit-button">Add Expense</button>
        </form>
      </div>

      <div className="table-container">
        <h2>Expenses Table</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Category</th>
              <th>Expense</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className={editingId === expense.id ? 'editing-row' : ''}>
                <td>
                  {editingId === expense.id ? (
                    <select
                      name="month"
                      value={editFormData.month}
                      onChange={handleEditChange}
                      className="edit-input"
                    >
                      <option value="">Select Month</option>
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month.charAt(0).toUpperCase() + month.slice(1)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    expense.month.charAt(0).toUpperCase() + expense.month.slice(1)
                  )}
                </td>
                <td>
                  {editingId === expense.id ? (
                    <input
                      type="text"
                      name="category"
                      value={editFormData.category}
                      onChange={handleEditChange}
                      className="edit-input"
                      placeholder="Enter category"
                    />
                  ) : (
                    expense.category
                  )}
                </td>
                <td>
                  {editingId === expense.id ? (
                    <input
                      type="number"
                      name="expense"
                      value={editFormData.expense}
                      onChange={handleEditChange}
                      className="edit-input"
                      placeholder="Enter expense"
                    />
                  ) : (
                    `${parseFloat(expense.expense).toFixed(2)}`
                  )}
                </td>
                <td>
                  {editingId === expense.id ? (
                    <div className="action-buttons">
                      <button 
                        onClick={() => saveEdit(expense.id)}
                        className="save-button"
                      >
                        Save
                      </button>
                      <button 
                        onClick={cancelEdit}
                        className="cancel-button"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="action-buttons">
                      <button 
                        onClick={() => startEdit(expense)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-container">
        <h2>Summary</h2>
        <div className="group-selector">
          <label htmlFor="groupBy">Group by: </label>
          <select 
            id="groupBy" 
            value={groupBy} 
            onChange={(e) => setGroupBy(e.target.value)}
            className="group-select"
          >
            <option value="category">Category</option>
            <option value="month">Month</option>
          </select>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>{groupBy === 'category' ? 'Category' : 'Month'}</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {(groupBy === 'category' ? categoryCosts : monthCosts).map((data, index) => (
              <tr key={index}>
                <td>
                  {groupBy === 'category' 
                    ? data.category 
                    : data.month.charAt(0).toUpperCase() + data.month.slice(1)
                  }
                </td>
                <td>{parseFloat(data.total_cost).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


          {monthlyIncome && budgetAnalysis.length > 0 && (
            <div className="table-container">
              <h2>Budget Analysis</h2>
              <p className="budget-info">
                Monthly Income/Budget: {monthlyIncome}
              </p>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total Expenses</th>
                    <th>Budget</th>
                    <th>Difference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetAnalysis.map((analysis, index) => (
                    <tr key={index} className={analysis.isOverBudget ? 'over-budget' : 'within-budget'}>
                      <td>{analysis.month.charAt(0).toUpperCase() + analysis.month.slice(1)}</td>
                      <td>{analysis.totalExpense.toFixed(2)}</td>
                      <td>{analysis.income.toFixed(2)}</td>
                      <td className={analysis.difference >= 0 ? 'positive-amount' : 'negative-amount'}>
                        {Math.abs(analysis.difference).toFixed(2)} {analysis.difference >= 0 ? 'Under' : 'Over'}
                      </td>
                      <td className={analysis.isOverBudget ? 'status-over' : 'status-within'}>
                        {analysis.isOverBudget ? '⚠️ Over Budget' : '✅ Within Budget'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
 
      {/* Budget Suggestion Component - Moved to bottom */}
      <div className="budget-suggestion-section">
        <BudgetSuggestion />
      </div>

    </>
  )
}

export default App;
