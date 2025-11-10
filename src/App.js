// Import core React hooks. useState is for managing component state, useEffect for side effects (like data fetching),
// and useCallback for memorizing functions to prevent unnecessary re-renders.
import React, { useState, useEffect, useCallback } from "react";

// Import components from the 'react-bootstrap' library for a consistent UI.
import { Container, Navbar, Nav, Spinner, Alert, Button } from "react-bootstrap";

// Import components from 'react-router-dom' to handle client-side routing.
// Routes groups multiple Route components, Route maps a URL path to a component,
// and NavLink is a special Link that knows whether it is "active".
import { Routes, Route, NavLink } from "react-router-dom";

// Import the custom page components that will be rendered by the router.
import Dashboard from "./components/Dashboard";
import TransactionForm from "./components/TransactionForm";
import BudgetSetup from "./components/BudgetSetup";
import Categories from "./components/Categories";
import NotFound from "./components/NotFound";

// Define the base URL for the backend API. Storing it in a constant makes it easy to change if the server address moves.
const API_URL = "http://localhost/financial-tracker/";

/**
 * App component is the root component of the application.
 * It manages the main application state (like transactions, categories),
 * handles data fetching from the API, and sets up the main navigation and routing structure.
 */
export default function App() {
  // --- STATE MANAGEMENT (useState) ---
  // The useState hook declares a state variable. It returns a pair: the current state value and a function that lets you update it.
  
  // Holds the list of all transactions fetched from the server.
  const [transactions, setTransactions] = useState([]);
  // Holds the list of all user-defined categories.
  const [categories, setCategories] = useState([]);
  // Holds the list of all budget rules (e.g., 50/30/20).
  const [budgetSettings, setBudgetSettings] = useState([]);
  // A boolean flag to indicate when data is being fetched. Used for showing a loading spinner.
  const [loading, setLoading] = useState(true);
  // Holds any error message if data fetching fails. Used to show an error alert.
  const [error, setError] = useState(null);
  // Holds the list of all scheduled recurring income rules.
  const [recurringIncomes, setRecurringIncomes] = useState([]);
  // Holds the list of all scheduled recurring expense rules.
  const [recurringExpenses, setRecurringExpenses] = useState([]);


  // --- DATA FETCHING LOGIC ---

  /**
   * triggerReload is a function responsible for fetching all primary data from the backend API.
   * It uses useCallback to prevent the function from being recreated on every render. This is critical
   * because it's a dependency of the useEffect hook, and without useCallback, it would cause an infinite loop.
   */
  const triggerReload = useCallback(() => {
    // 1. Reset state before fetching: Show the loading spinner and clear previous errors.
    setLoading(true);
    setError(null);

    // This is an async function to allow the use of 'await' for handling promises from the fetch API.
    const fetchData = async () => {
      try {
        // First, send a POST request to the backend to process any recurring transactions that are due.
        // Promise.all ensures we wait for both processing requests to complete before fetching the main data.
        await Promise.all([
          fetch(`${API_URL}recurring_incomes.php?action=process`, { method: 'POST' }),
          fetch(`${API_URL}recurring_expenses.php?action=process`, { method: 'POST' })
        ]);
        
        // 2. Fetch all application data in parallel for efficiency.
        // Promise.all waits for all fetch requests to resolve before continuing.
        const [transRes, catRes, budgetRes, recIncomesRes, recExpensesRes] = await Promise.all([
          fetch(`${API_URL}transactions.php`),
          fetch(`${API_URL}categories.php`),
          fetch(`${API_URL}budget.php`),
          fetch(`${API_URL}recurring_incomes.php`),
          fetch(`${API_URL}recurring_expenses.php`)
        ]);

        // 3. Check if any of the network responses failed.
        if (!transRes.ok || !catRes.ok || !budgetRes.ok || !recIncomesRes.ok || !recExpensesRes.ok) {
            throw new Error('A network response was not ok.');
        }

        // 4. Parse the JSON body content from each successful response.
        const transactionsData = await transRes.json();
        const categoriesData = await catRes.json();
        const budgetData = await budgetRes.json();
        const recIncomesData = await recIncomesRes.json();
        const recExpensesData = await recExpensesRes.json();
        
        // 5. Update the application's state with the newly fetched data. This will trigger a re-render.
        setTransactions(transactionsData);
        setCategories(categoriesData);
        setBudgetSettings(budgetData);
        setRecurringIncomes(recIncomesData);
        setRecurringExpenses(recExpensesData);

      } catch (err) {
        // If any part of the 'try' block fails, the error is caught here.
        console.error("Data fetching failed:", err);
        setError("Failed to load data from the server. Please ensure XAMPP is running and all PHP API files exist.");
      } finally {
        // The 'finally' block always runs, regardless of success or failure.
        // Here, we hide the loading spinner.
        setLoading(false);
      }
    };

    fetchData();
  }, []); // The empty dependency array `[]` means useCallback creates the function only once.

  /**
   * The useEffect hook performs side effects in function components.
   * This hook runs once when the component is first mounted, because its dependency array `[triggerReload]`
   * contains a function wrapped in useCallback, which doesn't change.
   */
  useEffect(() => {
    triggerReload();
  }, [triggerReload]);

  // --- JSX RENDERING LOGIC ---
  return (
    <>
      {/* Navbar provides consistent navigation across all pages. 'sticky-top' keeps it visible during scroll. */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" sticky="top">
        <Container>
          <Navbar.Brand as={NavLink} to="/">💰 Financial Tracker</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {/* 'ms-auto' pushes the navigation links to the right side of the navbar. */}
            <Nav className="ms-auto">
              {/* Using 'as={NavLink}' integrates React Bootstrap with React Router for active link styling. */}
              {/* The 'end' prop on the Dashboard link ensures it is only 'active' on the exact "/" path. */}
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
        {/* Conditional Rendering: This is a key pattern in React for handling different UI states. */}
        {loading ? (
             // 1. If 'loading' is true, display a centered spinner.
             <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading data...</p>
            </div>
        ) : error ? (
            // 2. If 'loading' is false and 'error' is not null, display an error message.
            <Alert variant="danger">
                <h4>Application Error</h4>
                <p>{error}</p>
                <Button onClick={triggerReload} variant="outline-danger">Try Again</Button>
            </Alert>
        ) : (
        // 3. If 'loading' is false and there is no error, render the main application routes.
        <Routes>
          {/* Each <Route> defines a URL path and the component to render for that path. */}
          {/* State data (e.g., transactions) is passed down to child components as props. */}
          <Route path="/" element={<Dashboard transactions={transactions} budgetSettings={budgetSettings} triggerReload={triggerReload} categories={categories} recurringIncomes={recurringIncomes} recurringExpenses={recurringExpenses} />} />
          <Route path="/add-transaction" element={<TransactionForm categories={categories} onFormSubmit={triggerReload} transactions={transactions} />} />
          {/* This route includes a dynamic parameter ':id' for editing a specific transaction. */}
          <Route path="/edit/:id" element={<TransactionForm categories={categories} onFormSubmit={triggerReload} transactions={transactions} />} />
          <Route path="/budget-setup" element={<BudgetSetup settings={budgetSettings} onSettingsSaved={triggerReload} categories={categories} recurringIncomes={recurringIncomes} recurringExpenses={recurringExpenses} />} />
          <Route path="/categories" element={<Categories categories={categories} onDataChanged={triggerReload} />} />
          {/* The '*' path is a catch-all that renders the NotFound component for any undefined URL. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        )}
      </Container>
    </>
  );
}