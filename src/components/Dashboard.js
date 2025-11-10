/**
 * @file Dashboard.js
 * @description This file contains the main dashboard component for the financial tracker application.
 * It displays key financial summaries, charts for spending and income allocation, and a detailed table of all transactions.
 * Key Features:
 * - Interactive filtering by month, year, or custom date range.
 * - Dynamic charts to visualize spending habits and budget adherence.
 * - Calculation of financial metrics like cash balance, total spending, and savings.
 * - Application of user-defined budgeting rules (e.g., 50/30/20 rule).
 * - A paginated and filterable table of all transactions with edit/delete functionality.
 * - Optimized performance using React hooks like `useMemo` to prevent unnecessary recalculations.
 */

// --- 1. IMPORTS ---
// Import core React hooks for state management and performance optimization.
import React, { useState, useMemo } from 'react';
// Import layout components from React Bootstrap for a structured and responsive design.
import { Row, Col, Card, Form, Button, Table, Badge, ProgressBar } from 'react-bootstrap';
// Import specific chart components from 'react-chartjs-2', a React wrapper for the Chart.js library.
import { Pie, Doughnut } from 'react-chartjs-2';
// Import necessary modules from Chart.js itself. These are "tree-shakable," meaning only the parts we import will be included in the final application bundle.
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
// Import the navigation hook from React Router to programmatically navigate to other pages (e.g., the edit transaction page).
import { useNavigate } from 'react-router-dom';
// Import icons from the 'react-icons' library to add visual cues for actions like edit, delete, and recurring transactions.
import { BsPencil, BsTrash, BsClockHistory } from 'react-icons/bs';

// Import the specific function we need from the apiService
import { deleteTransaction } from '../services/apiService';


// --- 2. CHART.JS REGISTRATION ---
// Chart.js requires you to explicitly register the components (elements, scales, plugins) you intend to use.
// This modular approach helps keep the final bundle size smaller.
// - ArcElement: Required for drawing the segments of Pie and Doughnut charts.
// - Tooltip: The pop-up that appears when you hover over a chart segment.
// - Legend: The key that explains what the different colors/segments in the chart represent.
ChartJS.register(ArcElement, Tooltip, Legend);

// --- 3. HELPER FUNCTIONS ---
// These are small, reusable utility functions that keep the main component logic clean.

/**
 * @function findActiveBudgetRule
 * @description Finds the correct budget rule to apply based on a given date. It filters rules by their start/end dates
 * and sorts them to find the most recent, applicable one. This allows for historical budget rules.
 * If no rule is found, it returns a default "Fallback Rule" (50/30/20) to prevent errors.
 * @param {Array} rules - An array of budget rule objects from the database.
 * @param {Date} periodDate - The start date of the period being analyzed.
 * @returns {Object} The active budget rule with ratios converted to decimals.
 */

const findActiveBudgetRule = (rules, periodDate) => {
    // First, convert percentage-based ratios (e.g., 50) to decimals (e.g., 0.5) for calculations.
    const applicableRules = rules
        .map(rule => ({
            ...rule,
            needs_ratio: rule.needs_ratio / 100,
            wants_ratio: rule.wants_ratio / 100,
            savings_ratio: rule.savings_ratio / 100,
        }))
        // Filter the rules to find ones that are active for the given periodDate.
        .filter(rule => {
            const startDate = new Date(rule.start_date + 'T00:00:00');
            // Rule hasn't started yet.
            if (startDate > periodDate) return false;
            // Rule has a start date but no end date (i.e., it's ongoing), OR the period is before the rule's end date.
            if (!rule.end_date || periodDate <= new Date(rule.end_date + 'T00:00:00')) {
                return true;
            }
            return false;
        });
    // If multiple rules could apply, sort them by start date in descending order to pick the most recent one.
    applicableRules.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    // Return the most recent applicable rule, or a default fallback rule if none were found.
    return applicableRules[0] || { name: 'Fallback Rule', needs_ratio: 0.5, wants_ratio: 0.3, savings_ratio: 0.2 };
};

/**
 * @function getMonthName
 * @description Converts a month number (1-12) into its full English name (e.g., 1 -> "January").
 * @param {number} monthNumber - The month number.
 * @returns {string} The full name of the month.
 */
const getMonthName = (monthNumber) => {
  const date = new Date();
  date.setMonth(monthNumber - 1); 
  return date.toLocaleString('en-US', { month: 'long' });
};

/**
 * @function formatDate
 * @description Formats a date string (like "YYYY-MM-DD") into a more readable format (e.g., "19 June 2025").
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date.
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat('en-GB', options).format(date);
};

/**
 * @function ModernPagination
 * @description A simple, reusable component for rendering pagination controls.
 * @param {Object} props - Contains totalPages, currentPage, and the onPageChange handler.
 * @returns {JSX.Element|null} The pagination UI, or null if there's only one page.
 */
const ModernPagination = ({ totalPages, currentPage, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="d-flex justify-content-center align-items-center mt-4">
            <Button variant="light" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="me-3">&laquo; Previous</Button>
            <span className="text-muted small">Page {currentPage} of {totalPages}</span>
            <Button variant="light" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="ms-3">Next &raquo;</Button>
        </div>
    );
};


// --- 4. MAIN DASHBOARD COMPONENT ---
/**
 * @component Dashboard
 * @param {Object} props - The properties passed down to the component.
 * @param {Array} props.transactions - The master list of all transaction objects.
 * @param {Array} props.budgetSettings - The list of all budget rule objects.
 * @param {Function} props.triggerReload - A function passed from the parent to force a data refresh (e.g., after deleting a transaction).
 * @param {Array} props.categories - The list of all available spending categories and their associated colors.
 * @param {Array} props.recurringIncomes - (Not directly used in this version but available)
 * @param {Array} props.recurringExpenses - (Not directly used in this version but available)
 */
const Dashboard = ({ transactions, budgetSettings, triggerReload, categories, recurringIncomes, recurringExpenses }) => {
    // The `useNavigate` hook gives us a function to redirect the user to different routes.
    const navigate = useNavigate();

    // --- 5. STATE MANAGEMENT (useState) ---
    // `useState` is a React hook that lets you add a "state variable" to your component.
    // It returns a pair: the current state value and a function that lets you update it.
    // When you call the update function, React re-renders the component.

    const [filterType, setFilterType] = useState('month');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // State for the transaction table's date range filter.
    // We use two sets of state variables. `date...Input` holds the value in the HTML input fields.
    // `filterDate...` holds the *applied* filter value. This prevents the table from re-filtering on every keystroke.
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [dateFromInput, setDateFromInput] = useState('');
    const [dateToInput, setDateToInput] = useState('');
    
    /**
     * @memo availableYears
     * @description Calculates the unique years present in the transaction data.
     * @dependency [transactions] - This calculation only re-runs if the `transactions` array changes.
     * This prevents re-calculating the list of years every time the user selects a different month.
     */
    const availableYears = useMemo(() => {
        // Use a Set to automatically handle uniqueness.
        const years = new Set(transactions.map(t => new Date(t.transaction_date).getFullYear()));
        // Convert the Set to an array and sort it in descending order for the dropdown.
        return Array.from(years).sort((a, b) => b - a);
    }, [transactions]);

    // --- 7. EVENT HANDLERS ---
    // These functions handle user interactions like clicks and form submissions.

    /**
     * @function handleEdit
     * @description Navigates the user to the transaction editing page.
     * @param {number} id - The ID of the transaction to edit.
     */
    const handleEdit = (id) => navigate(`/edit/${id}`);
    
    /**
     * @function handleDelete
     * @description Deletes a transaction after user confirmation.
     * @param {number} id - The ID of the transaction to delete.
     */

    const handleDelete = async (id) => {
        // `window.confirm` is a simple way to ask for user confirmation.
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;
        
        // Call the deleteTransaction service function and handle errors.
        try {
            await deleteTransaction(id); // Call the service function
            triggerReload(); // After deleting, call the function from the parent to refetch all data.
        } catch (error) {
            console.error("Failed to delete transaction:", error);
            alert("Failed to delete transaction. Please try again.");
        }
    };

    /**
     * @function handleApplyFilters
     * @description Applies the date range from the input fields to the transaction table filter state.
     */
    const handleApplyFilters = () => {
        setFilterDateFrom(dateFromInput);
        setFilterDateTo(dateToInput);
        setCurrentPage(1); // Reset to the first page when filters change.
    };

    /**
     * @function handleResetFilters
     * @description Clears the date range filters and resets the table view.
     */
    const handleResetFilters = () => {
        setFilterDateFrom('');
        setFilterDateTo('');
        setDateFromInput('');
        setDateToInput('');
        setCurrentPage(1);
    };

    // --- 8. PRIMARY DATA CALCULATION (useMemo) ---
    // This is the most critical `useMemo` block. It processes the entire `transactions` array in a SINGLE PASS
    // to calculate all the necessary figures for the dashboard summaries and charts.
    // This is significantly more efficient than iterating over the data multiple times for each metric.

    const {
        periodTransactions, // Transactions that fall within the selected month/year.
        balanceAtPeriodEnd, // The final cash balance at the end of the selected period.
        totalSavingsPot,    // The cumulative total of all savings.
        periodSummary,      // Total money spent and saved within the period.
        incomeAllocation,   // Breakdown of spending against the budget rule (Needs, Wants, Savings).
        incomeSpentGauge    // Data for the "% of Income Spent" doughnut chart.
    } = useMemo(() => {
        // Determine the start and end dates of the period based on the filter controls.
        const periodStartDate = new Date(selectedYear, filterType === 'year' ? 0 : selectedMonth - 1, 1);
        const periodEndDate = new Date(selectedYear, filterType === 'year' ? 12 : selectedMonth, 0); // Day 0 of next month gives the last day of the current month.
        // Find the budget rule that was active at the start of this period.
        const activeRule = findActiveBudgetRule(budgetSettings, periodStartDate);

        // Initialize accumulators for our single-pass calculation.
        let runningBalance = 0;       // For calculating balance at a point in time.
        let runningSavingsPot = 0;    // For calculating the total savings pot.
        const periodTrans = [];         // To store transactions that happened *in* the period.
        let periodSpent = 0;          // Total non-savings expenses in the period.
        let periodSavings = 0;        // Total money moved to savings in the period.
        let periodInc = 0;            // Total income in the period.
        let periodNeedsActual = 0;    // Total "Needs" spending in the period.
        let periodWantsActual = 0;    // Total "Wants" spending in the period.


        // --- THE SINGLE PASS LOOP ---
        // Iterate through ALL transactions once.
        for (const t of transactions) {
            const transactionDate = new Date(t.transaction_date + 'T00:00:00');
            const amount = parseFloat(t.amount);

            // --- Calculation 1: Historical Balance & Savings Pot ---
            // These calculations run for every transaction *up to* the end of the selected period.
            if (transactionDate <= periodEndDate) {
                runningBalance += amount;
                // Savings Pot: If it's a 'Savings' category transaction, it affects the pot.
                // An expense to a savings category *increases* the pot (moves money from cash to savings).
                if (t.category_type === 'Savings') {
                    runningSavingsPot -= amount; // Amount is negative for expenses, so we subtract it.
                }
            }

            // --- Calculation 2: In-Period Summary ---
            // Check if the transaction falls *within* the selected period (month or year).
            const isInPeriod = (filterType === 'year')
                ? (transactionDate.getFullYear() === selectedYear)
                : (transactionDate.getFullYear() === selectedYear && transactionDate.getMonth() + 1 === selectedMonth);

            if (isInPeriod) {
                periodTrans.push(t); // Add to our list of transactions for this period.

                // Categorize the transaction's financial impact for the period.
                if (t.type === 'Income' && t.category_type !== 'Savings') {
                    periodInc += amount; // Add to period income.
                } else if (t.type === 'Expense') {
                    if (t.category_type === 'Savings') {
                        // This is a transfer to savings.
                        periodSavings -= amount; // Amount is negative, so this adds to savings.
                    } else {
                        // This is regular spending.
                        periodSpent -= amount; // Amount is negative, so this adds to spending.
                        // Track spending for budget allocation categories.
                        if (t.category_type === 'Needs') periodNeedsActual -= amount;
                        if (t.category_type === 'Wants') periodWantsActual -= amount;
                    }
                }
            }
        }
        
        // --- Post-Loop Calculations ---
        // Now that the loop is done, we can calculate targets and percentages.
        
        // Calculate the target amounts based on the period's income and the active budget rule.
        const needsTarget = periodInc * activeRule.needs_ratio;
        const wantsTarget = periodInc * activeRule.wants_ratio;
        const savingsTarget = periodInc * activeRule.savings_ratio;

        // Structure the data for the Income Allocation section.
        const allocation = {
            periodIncome: periodInc,
            activeRuleName: activeRule.name,
            needs: { actual: periodNeedsActual, target: needsTarget, percent: needsTarget > 0 ? (periodNeedsActual / needsTarget) * 100 : 0, ratio: activeRule.needs_ratio },
            wants: { actual: periodWantsActual, target: wantsTarget, percent: wantsTarget > 0 ? (periodWantsActual / wantsTarget) * 100 : 0, ratio: activeRule.wants_ratio },
            savings: { actual: periodSavings, target: savingsTarget, percent: savingsTarget > 0 ? (periodSavings / savingsTarget) * 100 : 0, ratio: activeRule.savings_ratio },
        };
        
        // Prepare data for the "% of Income Spent" doughnut chart.
        const percentageOfIncomeSpent = periodInc > 0 ? (periodSpent / periodInc) * 100 : 0;
        const isSurplusSpending = periodSpent > periodInc; // Did spending exceed income?
        const surplusAmount = isSurplusSpending ? periodSpent - periodInc : 0;
        const gaugeData = {
            isSurplus: isSurplusSpending,
            surplusDetail: `Funded by €${periodInc.toFixed(2)} (income) + €${surplusAmount.toFixed(2)} (surplus)`,
            centerText: isSurplusSpending ? `€${periodSpent.toFixed(2)}` : `${Math.round(percentageOfIncomeSpent)}%`,
            chartData: {
                datasets: [{
                    data: isSurplusSpending ? [100, 0] : [percentageOfIncomeSpent, 100 - percentageOfIncomeSpent],
                    backgroundColor: isSurplusSpending ? ['#dc3545', '#e9ecef'] : ['#e86100', '#e9ecef'], // Red if overspent, Orange if not
                    borderWidth: 0,
                }],
            },
        };

        // Return a single object containing all the calculated data.
        return {
            periodTransactions: periodTrans,
            balanceAtPeriodEnd: runningBalance,
            totalSavingsPot: runningSavingsPot,
            periodSummary: { totalSpent: periodSpent, savingsThisPeriod: periodSavings },
            incomeAllocation: allocation,
            incomeSpentGauge: gaugeData
        };
    // Dependencies: This entire block re-calculates ONLY if these values change.
    }, [transactions, budgetSettings, filterType, selectedYear, selectedMonth]);


    /**
     * @memo chartData
     * @description Prepares the data for the "Spending Distribution" Pie chart.
     * @dependency [periodTransactions, categories] - Re-calculates only when the transactions for the selected period change, or when category definitions change.
     */
    const chartData = useMemo(() => {
        // Create a quick lookup map for category names to their assigned colors for efficiency.
        const categoryColorMap = categories.reduce((acc, cat) => {
            acc[cat.name] = cat.color;
            return acc;
        }, {});

        // Process the transactions for the current period to aggregate spending by category.
        const spendingData = periodTransactions
            .filter(t => t.type === 'Expense' && t.category_type !== 'Savings') // Only look at non-savings expenses.
            .reduce((acc, t) => {
                const categoryName = t.category_name || 'Uncategorized';
                if (!acc[categoryName]) {
                    // If we haven't seen this category yet, initialize it.
                    acc[categoryName] = { total: 0, color: categoryColorMap[categoryName] || '#CCCCCC' }; // Use a default color if not found.
                }
                acc[categoryName].total += Math.abs(t.amount); // Add the transaction amount to the category's total.
                return acc;
            }, {});
            
        // Convert the aggregated data object into the format required by Chart.js.
        const labels = Object.keys(spendingData);
        if (labels.length === 0) return { labels: [], datasets: [{ data: [] }] }; // Handle case with no spending data.
        const data = labels.map(label => spendingData[label].total);
        const backgroundColor = labels.map(label => spendingData[label].color);

        return { labels, datasets: [{ data, backgroundColor }] };
    }, [periodTransactions, categories]);

    /**
     * @memo filteredTableTransactions
     * @description Filters the main transactions list based on the user-selected date range for the table view.
     * @dependency [transactions, filterDateFrom, filterDateTo] - Re-filters only when the master list or the date range changes.
     */
    const filteredTableTransactions = useMemo(() => {
        // If no date filters are applied, return all transactions immediately.
        if (!filterDateFrom && !filterDateTo) return transactions;
        
        return transactions.filter(t => {
            const transactionDate = new Date(t.transaction_date + 'T00:00:00');
            const start = filterDateFrom ? new Date(filterDateFrom + 'T00:00:00') : null;
            const end = filterDateTo ? new Date(filterDateTo + 'T00:00:00') : null;
            if (start && end) return transactionDate >= start && transactionDate <= end;
            if (start) return transactionDate >= start;
            if (end) return transactionDate <= end;
            return true;
        });
    }, [transactions, filterDateFrom, filterDateTo]);

    // --- 9. PAGINATION LOGIC ---
    // Calculates which transactions to display on the current page of the table.
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTableTransactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTableTransactions.length / itemsPerPage);
    
    // A user-friendly label for the current period being viewed.
    const periodLabel = filterType === 'year' ? `${selectedYear}` : `${getMonthName(selectedMonth)}, ${selectedYear}`;
    
    // --- 10. CHART.JS OPTIONS ---
    // These objects define the appearance and behavior of the charts.

    // Options for the Pie Chart.
    const pieChartOptions = {
        responsive: true, // Make the chart resize with its container.
        maintainAspectRatio: false, // Allows us to set a custom height/width via CSS.
        plugins: {
            legend: {
                display: false, // We are not showing the default legend.
            },
            tooltip: {
                // These options customize the tooltip that appears on hover.
                yAlign: 'bottom',
                xAlign: 'left',
                caretPadding: 15, // Extra space between the tooltip and the chart segment.
                displayColors: false, // Hides the little color box in the tooltip.
                
                // A callback function to create custom tooltip text.
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const dataset = context.dataset.data;
                        const total = dataset.reduce((acc, currentValue) => acc + currentValue, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        // Example output: "Groceries: €150.00 (25.5%)"
                        return `${label}: €${value.toFixed(2)} (${percentage}%)`;
                    }
                }
            }
        }
    };

    // Options for the Doughnut Chart.
    const doughnutOptions = { 
        responsive: true, 
        maintainAspectRatio: false, 
        cutout: '70%', // Makes the hole in the middle larger, creating a thinner ring.
        plugins: { 
            tooltip: { enabled: false }, // Disable tooltips for this chart.
            legend: { display: false } 
        } 
    };

    // --- 11. JSX RENDERING ---
    // This is where the component's UI is defined using JSX (a syntax extension for JavaScript).
    // It looks like HTML but allows you to embed JavaScript logic and components.
    return (
        <Card className="shadow-sm">
            <Card.Header as="h3">Dashboard</Card.Header>
            <Card.Body>
                {/* Main layout is a Row with two columns. */}
                <Row>
                    {/* Left Column: Contains summary cards and filter controls. */}
                    <Col lg={4} className="mb-4 mb-lg-0">
                        <div className="p-3 border rounded h-100 d-flex flex-column">
                            <h5>Summary & Controls</h5>
                             <Form.Group className="mb-3">
                                <div className="d-flex gap-2">
                                    {/* Dropdowns for selecting filter type, month, and year. */}
                                    <Form.Select id="filterTypeSelect" size="sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
                                        <option value="month">Monthly</option>
                                        <option value="year">Yearly</option>
                                    </Form.Select>
                                    {/* The month dropdown is conditionally rendered only if filterType is 'month'. */}
                                    {filterType === 'month' && (
                                        <Form.Select id="monthSelect" size="sm" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                                            {[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>)}
                                        </Form.Select>
                                    )}
                                    <Form.Select id="yearSelect" size="sm" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
                                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                                    </Form.Select>
                                </div>
                            </Form.Group>
                            
                            {/* Summary Cards */}
                            <Card body className="text-center mb-2 flex-grow-1">
                                <h6 className="text-muted">Cash Balance <span className="fw-normal">(at end of {periodLabel})</span></h6>
                                <p className={`fs-4 fw-bold ${balanceAtPeriodEnd >= 0 ? 'text-success' : 'text-danger'} mb-0`}>€{balanceAtPeriodEnd.toFixed(2)}</p>
                            </Card>
                            <Card body className="text-center mb-2 flex-grow-1">
                                <h6 className="text-muted">Total Spent <span className="fw-normal">(in {periodLabel})</span></h6>
                                <p className="fs-4 fw-bold text-danger mb-0">€{periodSummary.totalSpent.toFixed(2)}</p>
                            </Card>
                             <Card body className="text-center mb-2 flex-grow-1">
                                <h6 className="text-muted">Savings Made <span className="fw-normal">(in {periodLabel})</span></h6>
                                <p className="fs-4 fw-bold text-info mb-0">€{periodSummary.savingsThisPeriod.toFixed(2)}</p>
                            </Card>
                             <Card body className="text-center mb-3 flex-grow-1">
                                <h6 className="text-muted">Total Savings Pot</h6>
                                <p className="fs-4 fw-bold text-primary mb-0">€{totalSavingsPot.toFixed(2)}</p>
                            </Card>
                        </div>
                    </Col>
                    
                    {/* Right Column: Contains the charts and allocation progress bars. */}
                    <Col lg={8}>
                       <div className="p-3 border rounded h-100">
                           <Row>
                               {/* Spending Distribution Pie Chart */}
                               <Col xs={12} md={6} className="pe-md-3">
                                   <div className="d-flex flex-column h-100">
                                        <h5 className="mb-3 text-center text-md-start">Spending Distribution <span className="text-muted small">(in {periodLabel})</span></h5>
                                        {/* The chart container needs a defined height to render correctly. */}
                                        <div className="flex-grow-1" style={{ position: 'relative', height: '200px' }}>
                                           {/* Conditionally render the chart or a "no data" message. */}
                                           {chartData.datasets[0].data.length > 0 ? (
                                                <Pie data={chartData} options={pieChartOptions} /> 
                                           ) : (
                                                <div className="d-flex justify-content-center align-items-center h-100"><p className="text-center text-muted mb-0">No spending data.</p></div>
                                           )}
                                       </div>
                                       <div style={{ minHeight: '24px' }}></div>
                                   </div>
                               </Col>

                               {/* % of Income Spent Doughnut Chart */}
                               <Col xs={12} md={6} className="position-relative ps-md-3">
                                    <hr className="mt-4 d-md-none" /> {/* A horizontal line visible only on small screens. */}
                                    <div className="vr d-none d-md-block position-absolute" style={{ height: "85%", top: "50%", transform: "translateY(-50%)", left: 0 }}></div> {/* A vertical line visible only on medium screens and up. */}
                                    <div className="d-flex flex-column h-100">
                                        <h5 className="text-center mb-3">% of Income Spent <span className="text-muted small">(in {periodLabel})</span></h5>
                                        <div className="flex-grow-1" style={{ position: 'relative', height: '200px' }}>
                                           {incomeAllocation.periodIncome > 0 ? (
                                               <>
                                                   {/* The chart itself. */}
                                                   <Doughnut data={incomeSpentGauge.chartData} options={doughnutOptions} />
                                                   {/* This div is absolutely positioned to sit in the center of the doughnut chart. */}
                                                   <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', fontSize: '1.75rem', fontWeight: 'bold' }}>
                                                       {incomeSpentGauge.centerText}
                                                   </div>
                                               </>
                                           ) : (
                                               <div className="d-flex justify-content-center align-items-center h-100"><p className="text-center text-muted small">No income data.</p></div>
                                           )}
                                        </div>
                                        {/* A space below the chart to show the surplus spending detail if necessary. */}
                                        <div style={{ minHeight: '24px' }}>
                                            {incomeSpentGauge.isSurplus && incomeAllocation.periodIncome > 0 && (
                                                <p className="text-center text-muted small mb-0">
                                                    {incomeSpentGauge.surplusDetail}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                               </Col>
                           </Row>
                           <hr className="mt-4"/>

                           {/* Income Allocation Progress Bars Section */}
                           <div className="mt-2">
                               <h5 className="mb-2">Income Allocation <span className="text-muted small">(in {periodLabel})</span></h5>
                               <div className="d-block d-md-flex justify-content-md-between align-items-center mb-3">
                                    <p className="text-muted mb-2 mb-md-0">
                                        Income in Period: <strong className="text-dark">€{incomeAllocation.periodIncome.toFixed(2)}</strong>
                                    </p>
                                    <p className="text-muted mb-0 fst-italic">
                                        Applying Budget Rule: <strong className="text-dark">{incomeAllocation.activeRuleName}</strong>
                                    </p>
                                </div>
                               {/* Needs Progress Bar */}
                               <div className="mb-3">
                                    <div className="d-flex justify-content-between">
                                       <span><strong>Needs</strong> ({Math.round(incomeAllocation.needs.ratio * 100)}% Target)</span>
                                       <span className="fw-bold">{`€${incomeAllocation.needs.actual.toFixed(2)} / €${incomeAllocation.needs.target.toFixed(2)}`}</span>
                                    </div>
                                    <ProgressBar style={{height: '20px'}} now={incomeAllocation.needs.percent} label={`${Math.round(incomeAllocation.needs.percent)}%`} variant={incomeAllocation.needs.percent > 100 ? 'danger' : 'warning'} />
                               </div>
                               {/* Wants Progress Bar */}
                               <div className="mb-3">
                                    <div className="d-flex justify-content-between">
                                       <span><strong>Wants</strong> ({Math.round(incomeAllocation.wants.ratio * 100)}% Target)</span>
                                       <span className="fw-bold">{`€${incomeAllocation.wants.actual.toFixed(2)} / €${incomeAllocation.wants.target.toFixed(2)}`}</span>
                                    </div>
                                    <ProgressBar style={{height: '20px'}} now={incomeAllocation.wants.percent} label={`${Math.round(incomeAllocation.wants.percent)}%`} variant={incomeAllocation.wants.percent > 100 ? 'danger' : 'info'} />
                               </div>
                               {/* Savings Progress Bar */}
                               <div>
                                    <div className="d-flex justify-content-between">
                                       <span><strong>Savings</strong> ({Math.round(incomeAllocation.savings.ratio * 100)}% Target)</span>
                                       <span className="fw-bold">{`€${incomeAllocation.savings.actual.toFixed(2)} / €${incomeAllocation.savings.target.toFixed(2)}`}</span>
                                    </div>
                                    <ProgressBar style={{height: '20px'}} now={incomeAllocation.savings.percent} label={`${Math.round(incomeAllocation.savings.percent)}%`} variant="success" />
                               </div>
                           </div>
                       </div>
                    </Col>
                </Row>
                
                {/* Bottom Section: Full Transactions Table */}
                <div className="mt-4 p-3 border rounded">
                    <Row className="align-items-center mb-3">
                        <Col xs={12} lg>
                            <h5>Transactions</h5>
                        </Col>
                        {/* Transaction table controls (date filter, items per page). */}
                        <Col xs={12} lg="auto" className="mt-2 mt-lg-0">
                            <div className="d-flex flex-wrap flex-lg-nowrap align-items-center gap-2">
                                <Form.Control id="dateFromFilter" type="date" size="sm" value={dateFromInput} onChange={e => setDateFromInput(e.target.value)} />
                                <span className="text-muted">to</span>
                                <Form.Control id="dateToFilter" type="date" size="sm" value={dateToInput} onChange={e => setDateToInput(e.target.value)} />
                                <Button variant="primary" size="sm" onClick={handleApplyFilters}>Go</Button>
                                <Button variant="outline-secondary" size="sm" onClick={handleResetFilters}>Reset</Button>
                                <span className="ms-lg-2">Show:</span>
                                <Form.Select id="itemsPerPageSelect" size="sm" value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{width: 'auto', minWidth: '75px'}}>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </Form.Select>
                            </div>
                        </Col>
                    </Row>
                    
                    {/* The table itself. `responsive` adds horizontal scroll on small screens. */}
                    <Table striped hover responsive size="sm">
                        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Account: Amount</th><th>Actions</th></tr></thead>
                        <tbody>
                            {/* Map over the `currentItems` (the paginated data) to create table rows. */}
                            {currentItems.map(t => {
                                let accountDisplay;
                                const formattedAmount = `€${Math.abs(t.amount).toFixed(2)}`;
                                
                                // Special display logic for Savings transactions to show the movement between accounts.
                                if (t.category_type === 'Savings') {
                                    accountDisplay = t.type === 'Expense' ? ( // Moving money INTO savings
                                        <div><span className="text-danger d-block">Cash: -{formattedAmount}</span><span className="text-success d-block">Savings: +{formattedAmount}</span></div>
                                    ) : ( // Moving money OUT OF savings
                                        <div><span className="text-success d-block">Cash: +{formattedAmount}</span><span className="text-danger d-block">Savings: -{formattedAmount}</span></div>
                                    );
                                } else {
                                    // Standard display for income/expense.
                                    accountDisplay = (
                                        <span className={t.type === 'Income' ? 'text-success' : 'text-danger'}>
                                            Cash: {t.type === 'Income' ? '+' : '-'}{formattedAmount}
                                        </span>
                                    );
                                }
                                
                                const isRecurring = t.recurring_income_id !== null || t.recurring_expense_id !== null;

                                return (
                                <tr key={t.id}>
                                    <td>
                                        {formatDate(t.transaction_date)}
                                        {/* Show a clock icon if the transaction is part of a recurring series. */}
                                        {isRecurring && <BsClockHistory className="ms-2 text-muted" title="Recurring Transaction" />}
                                    </td>
                                    <td>{t.description}</td>
                                    <td><Badge bg="secondary" pill>{t.category_name}</Badge></td>
                                    <td>{accountDisplay}</td>
                                    <td>
                                        {/* Action buttons for each row. */}
                                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(t.id)} title="Edit"><BsPencil /></Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(t.id)} title="Delete"><BsTrash /></Button>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    
                    {/* Render the pagination component at the bottom of the table. */}
                    <ModernPagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </Card.Body>
        </Card>
    );
};

// Export the component so it can be used in other parts of the application (e.g., in App.js).
export default Dashboard;