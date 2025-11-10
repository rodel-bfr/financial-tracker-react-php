// src/services/apiService.js

// 1. Define the base URL once.
const API_URL = "http://localhost/financial-tracker/";

/**
 * A generic request handler to keep our code DRY (Avoid redundancy).
 * It handles the API_URL, headers, and response/error checking.
 * @param {string} endpoint - The PHP file to call (e.g., 'transactions.php')
 * @param {object} options - The standard 'fetch' options (method, body, etc.)
 * @returns {Promise<any>} - A promise that resolves with the JSON data.
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  // 2. Set default headers.
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 3. Stringify the body if it exists.
  const config = {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    const response = await fetch(url, config);
    
    // 4. Check for network errors (4xx, 5xx).
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Network response was not ok: ${response.statusText}`);
    }

    // 5. Return the parsed JSON data.
    return await response.json();
  } catch (error) {
    console.error(`API service error for endpoint: ${endpoint}`, error);
    throw error; // Re-throw the error so the component can catch it.
  }
}

// --- API Functions ---
// Now we export one clean function for each action.

// --- Transactions ---
export const getAllTransactions = () => 
  request('transactions.php');

export const addTransaction = (transactionData) => 
  request('transactions.php', { method: 'POST', body: transactionData });

export const updateTransaction = (transactionData) => 
  request('transactions.php', { method: 'PATCH', body: transactionData });

export const deleteTransaction = (id) => 
  request('transactions.php', { method: 'DELETE', body: { id } });

// --- Categories ---
export const getAllCategories = () => 
  request('categories.php');

export const addCategory = (categoryData) => 
  request('categories.php', { method: 'POST', body: categoryData });

export const updateCategory = (categoryData) => 
  request('categories.php', { method: 'PATCH', body: categoryData });

export const deleteCategory = (id) => 
  request('categories.php', { method: 'DELETE', body: { id } });

// --- Budget Rules ---
export const getAllBudgetRules = () => 
  request('budget.php');

export const addBudgetRule = (ruleData) => 
  request('budget.php', { method: 'POST', body: ruleData });

export const updateBudgetRule = (ruleData) => 
  request('budget.php', { method: 'PATCH', body: ruleData });

export const deleteBudgetRule = (id) => 
  request('budget.php', { method: 'DELETE', body: { id } });

// --- Recurring Incomes ---
export const getAllRecurringIncomes = () => 
  request('recurring_incomes.php');

export const addRecurringIncome = (incomeData) => 
  request('recurring_incomes.php', { method: 'POST', body: incomeData });

export const updateRecurringIncome = (incomeData) => 
  request('recurring_incomes.php', { method: 'PATCH', body: incomeData });

export const deleteRecurringIncome = (id) => 
  request('recurring_incomes.php', { method: 'DELETE', body: { id } });

export const processRecurringIncomes = () => 
  request('recurring_incomes.php?action=process', { method: 'POST' });

// --- Recurring Expenses ---
export const getAllRecurringExpenses = () => 
  request('recurring_expenses.php');

export const addRecurringExpense = (expenseData) => 
  request('recurring_expenses.php', { method: 'POST', body: expenseData });

export const updateRecurringExpense = (expenseData) => 
  request('recurring_expenses.php', { method: 'PATCH', body: expenseData });

export const deleteRecurringExpense = (id) => 
  request('recurring_expenses.php', { method: 'DELETE', body: { id } });

export const processRecurringExpenses = () => 
  request('recurring_expenses.php?action=process', { method: 'POST' });