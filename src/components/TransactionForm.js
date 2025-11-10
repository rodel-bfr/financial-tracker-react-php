// Import core React hooks for managing state and side effects, and for performance optimization.
import React, { useState, useEffect, useMemo } from 'react';

// Import components from 'react-bootstrap' for building the form's layout and style.
import { Form, Button, Row, Col, Card } from 'react-bootstrap';

// Import hooks from 'react-router-dom' for navigation and accessing URL parameters.
import { useNavigate, useParams } from 'react-router-dom';

// Import the specific functions we need from the apiService
import { addTransaction, updateTransaction } from '../services/apiService';

/**
 * TransactionForm is a versatile component used for both adding a new transaction
 * and editing an existing one. It manages the form's state, handles user input,
 * performs data validation, and communicates with the backend API.
 * @param {object} props - Component props.
 * @param {Array} props.categories - The list of all available categories.
 * @param {Function} props.onFormSubmit - A callback function to trigger a data reload in the parent (App.js).
 * @param {Array} props.transactions - The list of all transactions, needed for finding the one to edit.
 */
const TransactionForm = ({ categories, onFormSubmit, transactions }) => { 
  // Initialize router hooks.
  const navigate = useNavigate();
  const { id: editId } = useParams(); // Get the 'id' from the URL, e.g., from '/edit/123'
  
  // A boolean flag to determine if the form is in "edit" mode or "add" mode.
  // This is a clean way to drive conditional logic throughout the component.
  const isEditMode = Boolean(editId);
  
  // Find the full transaction data to be edited.
  // useMemo is used for performance optimization. It memoizes the result of the 'find' operation,
  // so it only re-calculates when one of its dependencies (isEditMode, editId, transactions) changes.
  // This is more efficient than running a 'find' on every single render.
  const initialData = useMemo(() => 
    isEditMode ? transactions.find(t => String(t.id) === String(editId)) : null,
    [isEditMode, editId, transactions]
  );

  // --- FORM STATE MANAGEMENT (useState) ---
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  // This state manages the four USER-FACING transaction types. This is a UI abstraction layer
  // to make the form more intuitive than the two simple backend types ('Income'/'Expense').
  const [transactionType, setTransactionType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // Default to today

  // --- SIDE EFFECTS (useEffect) ---

  // This useEffect hook is responsible for populating the form fields when in "edit" mode.
  // It runs whenever isEditMode or initialData changes.
  useEffect(() => {
    if (isEditMode && initialData) {
      // Set the form fields with the data from the transaction being edited.
      setDescription(initialData.description);
      setAmount(String(Math.abs(initialData.amount))); // Always use the positive value in the amount field.
      setCategoryId(initialData.category_id);
      setDate(initialData.transaction_date);

      // This logic translates the two backend types ('Income'/'Expense' combined with category_type)
      // back into one of the four user-friendly UI types for the dropdown.
      if (initialData.type === 'Income') {
        setTransactionType(initialData.category_type === 'Savings' ? 'withdrawal' : 'income');
      } else { // type is 'Expense'
        setTransactionType(initialData.category_type === 'Savings' ? 'transfer' : 'expense');
      }
    }
  }, [isEditMode, initialData]); // Dependencies: The effect re-runs if these values change.

  // This useMemo hook creates a dynamically filtered list of categories.
  // It re-runs ONLY when the main 'categories' list or the selected 'transactionType' changes.
  // This is a great example of deriving state for the UI without creating more state variables
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    // The switch statement returns a different subset of categories based on the transaction type.
    switch (transactionType) {
        case 'income':
            return categories.filter(c => c.type === 'Income');
        case 'expense':
            return categories.filter(c => c.type === 'Needs' || c.type === 'Wants');
        case 'transfer': // Transfer TO savings uses the 'Savings' category.
        case 'withdrawal': // Withdrawal FROM savings also uses the 'Savings' category.
            return categories.filter(c => c.type === 'Savings');
        default:
            return [];
    }
  }, [categories, transactionType]);

  // This useEffect hook ensures data integrity.
  // If the user changes the transaction type, the category list changes. If the previously selected
  // category is no longer valid, this resets the category selection to prevent an invalid submission.
  useEffect(() => {
      if (!filteredCategories.some(c => c.id === categoryId)) {
          setCategoryId('');
      }
  }, [filteredCategories, categoryId]);


  // --- FORM SUBMISSION ---
  const handleSubmit = async (e) => {
    // Prevent the default browser behavior of a full-page reload on form submission.
    e.preventDefault();
    if (!description || !amount || !date || !categoryId) {
      alert('Please fill all fields');
      return;
    }

    // This logic is a crucial responsibility of the UI layer. It translates the user-friendly
    // 4-type system ('income', 'expense', 'transfer', 'withdrawal') into the strict 2-type system
    // that the backend API expects ('Income'/'Expense' with a +/- amount).
    let finalType;
    let finalAmount;

    switch (transactionType) {
        case 'income':
            finalType = 'Income';
            finalAmount = Math.abs(parseFloat(amount));
            break;
        case 'expense':
            finalType = 'Expense';
            finalAmount = -Math.abs(parseFloat(amount));
            break;
        case 'transfer': // A transfer TO savings is an EXPENSE from the cash perspective.
            finalType = 'Expense';
            finalAmount = -Math.abs(parseFloat(amount));
            break;
        case 'withdrawal': // A withdrawal FROM savings is an INCOME to the cash perspective.
            finalType = 'Income';
            finalAmount = Math.abs(parseFloat(amount));
            break;
        default:
            return;
    }

    // Construct the final data object to be sent to the API.
    const transactionData = {
      description,
      amount: finalAmount,
      type: finalType,
      category_id: parseInt(categoryId),
      transaction_date: date
    };

    // Use try-catch to handle potential errors during the async API calls.
    try {
      if (isEditMode) {
        // For updates, we pass the full object including the id.
        await updateTransaction({ ...transactionData, id: editId });
      } else {
        // For adds, we just pass the new data.
        await addTransaction(transactionData);
      }
      
      // If the 'await' functions above complete without error, run this:
      onFormSubmit(); // Call the parent's function to trigger a data refresh.
      navigate('/');  // Redirect the user to the dashboard for a smooth experience.

    } catch (error) {
      // If addTransaction or updateTransaction throws an error, it's caught here.
      console.error("Form submission error:", error);
      alert("Failed to save transaction. Please try again.");
    }
  };

  // --- JSX RENDERING ---
  return (
    <Card className="shadow-sm">
      {/* The component's title changes based on whether it's in edit mode. */}
      <Card.Header as="h3">{isEditMode ? 'Edit Transaction' : 'Add New Transaction'}</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formDate">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Form.Group>
            <Form.Group as={Col} controlId="formType">
              <Form.Label>Type</Form.Label>
              {/* This dropdown presents the 4 user-friendly transaction types. */}
              <Form.Select value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer to Savings</option>
                <option value="withdrawal">Withdrawal from Savings</option>
              </Form.Select>
            </Form.Group>
          </Row>

          <Form.Group className="mb-3" controlId="formDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control type="text" placeholder="e.g., Weekly groceries, Salary..." value={description} onChange={(e) => setDescription(e.target.value)} required />
          </Form.Group>

          <Row className="mb-3">
            <Form.Group as={Col} controlId="formAmount">
              <Form.Label>Amount (€)</Form.Label>
              <Form.Control type="number" step="0.01" placeholder="e.g.,50.75" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </Form.Group>
            <Form.Group as={Col} controlId="formCategory">
              <Form.Label>Category</Form.Label>
              <Form.Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="">Select a category...</option>
                {/* The options in this dropdown are dynamically rendered from the 'filteredCategories' list. */}
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Form.Group>
          </Row>

          {/* The button text also changes based on whether it's in edit mode. */}
          <Button variant="primary" type="submit" className="mt-3">
            {isEditMode ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default TransactionForm;