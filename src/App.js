// Import core React hooks.
import React, { useState, useEffect, useCallback } from "react";

// Import components from 'react-bootstrap'.
import { Container, Navbar, Nav, Spinner, Alert, Button } from "react-bootstrap";

// Import components from 'react-router-dom'.
import { Routes, Route, NavLink } from "react-router-dom";

// Import the custom page components.
import Dashboard from "./components/Dashboard";
import TransactionForm from "./components/TransactionForm";
import BudgetSetup from "./components/BudgetSetup";
import Categories from "./components/Categories";
import NotFound from "./components/NotFound";

// Import all the functions needed from apiService.
import {
  getAllTransactions,
  getAllCategories,
  getAllBudgetRules,
  getAllRecurringIncomes,
  getAllRecurringExpenses,
  processRecurringIncomes,
  processRecurringExpenses
} from './services/apiService';

/**
 * App component is the root component of the application.
 * Manages main state, handles data fetching, and sets up routing.
 */
export default function App() {
  // --- STATE MANAGEMENT ---
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgetSettings, setBudgetSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recurringIncomes, setRecurringIncomes] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);


  // --- DATA FETCHING LOGIC ---

  /**
   * triggerReload fetches all primary data from the backend API.
   * It's wrapped in useCallback to prevent infinite loops in useEffect.
   */
  const triggerReload = useCallback(() => {
    // 1. Reset state before fetching.
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        // 2. Call the processing functions. They are now clean one-liners.
        // The service handles the 'method: POST' and URL.
        await Promise.all([
          processRecurringIncomes(),
          processRecurringExpenses()
        ]);
        
        // 3. Fetch all application data in parallel.
        // No more URLs, .ok checks, or .json() calls!
        const [
          transactionsData, 
          categoriesData, 
          budgetData, 
          recIncomesData, 
          recExpensesData
        ] = await Promise.all([
          getAllTransactions(),
          getAllCategories(),
          getAllBudgetRules(),
          getAllRecurringIncomes(),
          getAllRecurringExpenses()
        ]);

        // 4. Update the application's state with the clean data.
        setTransactions(transactionsData);
        setCategories(categoriesData);
        setBudgetSettings(budgetData);
        setRecurringIncomes(recIncomesData);
        setRecurringExpenses(recExpensesData);

      } catch (err) {
        // 5. The apiService throws an error, which we catch here.
        console.error("Data fetching failed:", err);
        // Update the error message.
        setError("Failed to load data from the server. Please ensure XAMPP is running and the API is accessible.");
      } finally {
        // 6. Hide the loading spinner.
        setLoading(false);
      }
    };

    fetchData();
  }, []); // The empty dependency array [] is correct.

  /**
   * This useEffect hook runs once on component mount.
   */
  useEffect(() => {
    triggerReload();
  }, [triggerReload]);

  // --- JSX RENDERING LOGIC ---
  // (This part remains exactly the same as your original file)
  return (
    <>
      {/* Navbar provides consistent navigation across all pages. */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" sticky="top">
        <Container>
          <Navbar.Brand as={NavLink} to="/">💰 Financial Tracker</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={NavLink} to="/" end>Dashboard</Nav.Link>
              <Nav.Link as={NavLink} to="/add-transaction">Add Transaction</Nav.Link>
              <Nav.Link as={NavLink} to="/budget-setup">Budgeting</Nav.Link>
              <Nav.Link as={NavLink} to="/categories">Categories</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      {/* Main content area */}
      <Container className="py-4">
        {/* Conditional Rendering Logic */}
        {loading ? (
             // 1. Show loading spinner
             <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading data...</p>
            </div>
        ) : error ? (
            // 2. Show error message
            <Alert variant="danger">
                <h4>Application Error</h4>
                <p>{error}</p>
                <Button onClick={triggerReload} variant="outline-danger">Try Again</Button>
            </Alert>
        ) : (
        // 3. Show application routes
        <Routes>
          <Route path="/" element={<Dashboard transactions={transactions} budgetSettings={budgetSettings} triggerReload={triggerReload} categories={categories} recurringIncomes={recurringIncomes} recurringExpenses={recurringExpenses} />} />
          <Route path="/add-transaction" element={<TransactionForm categories={categories} onFormSubmit={triggerReload} transactions={transactions} />} />
          <Route path="/edit/:id" element={<TransactionForm categories={categories} onFormSubmit={triggerReload} transactions={transactions} />} />
          <Route path="/budget-setup" element={<BudgetSetup settings={budgetSettings} onSettingsSaved={triggerReload} categories={categories} recurringIncomes={recurringIncomes} recurringExpenses={recurringExpenses} />} />
          <Route path="/categories" element={<Categories categories={categories} onDataChanged={triggerReload} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        )}
      </Container>
    </>
  );
}