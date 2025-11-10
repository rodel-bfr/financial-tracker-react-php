/**
 * @file Dashboard.js
 * @description This file contains the main dashboard component...
 * (All JSDoc comments preserved)
 */

// --- 1. IMPORTS ---
// Import core React hooks for state management and performance optimization.
import React, { useState, useMemo } from 'react';
// Import layout components from React Bootstrap for a structured and responsive design.
import { Row, Col, Card, Form, Button, Table, Badge, ProgressBar } from 'react-bootstrap';
// Import specific chart components from 'react-chartjs-2'...
import { Pie, Doughnut } from 'react-chartjs-2';
// Import necessary modules from Chart.js itself...
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
// Import the navigation hook from React Router...
import { useNavigate } from 'react-router-dom';
// Import icons from the 'react-icons' library...
import { BsPencil, BsTrash, BsClockHistory } from 'react-icons/bs';

// Import the specific function we need from the apiService
import { deleteTransaction } from '../services/apiService';


// --- 2. CHART.JS REGISTRATION ---
ChartJS.register(ArcElement, Tooltip, Legend);

// --- 3. HELPER FUNCTIONS ---
const findActiveBudgetRule = (rules, periodDate) => {
    const applicableRules = rules
        .map(rule => ({
            ...rule,
            needs_ratio: rule.needs_ratio / 100,
            wants_ratio: rule.wants_ratio / 100,
            savings_ratio: rule.savings_ratio / 100,
        }))
        .filter(rule => {
            const startDate = new Date(rule.start_date + 'T00:00:00');
            if (startDate > periodDate) return false;
            if (!rule.end_date || periodDate <= new Date(rule.end_date + 'T00:00:00')) {
                return true;
            }
            return false;
        });
    applicableRules.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    return applicableRules[0] || { name: 'Fallback Rule', needs_ratio: 0.5, wants_ratio: 0.3, savings_ratio: 0.2 };
};
const getMonthName = (monthNumber) => {
  const date = new Date();
  date.setMonth(monthNumber - 1); 
  return date.toLocaleString('en-US', { month: 'long' });
};
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat('en-GB', options).format(date);
};
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
 */
const Dashboard = ({ transactions, budgetSettings, triggerReload, categories, recurringIncomes, recurringExpenses }) => {
    const navigate = useNavigate();

    // --- 5. STATE MANAGEMENT (useState) ---
    const [filterType, setFilterType] = useState('month');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [dateFromInput, setDateFromInput] = useState('');
    const [dateToInput, setDateToInput] = useState('');
    
    // --- 6. PERFORMANCE OPTIMIZATION (useMemo) ---
    /**
     * @memo availableYears
     */
    const availableYears = useMemo(() => {
        const years = new Set(transactions.map(t => new Date(t.transaction_date).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [transactions]);

    // --- 7. EVENT HANDLERS ---
    /**
     * @function handleEdit
     */
    const handleEdit = (id) => navigate(`/edit/${id}`);
    
    /**
     * @function handleDelete
     * @description Deletes a transaction after user confirmation.
     * @param {number} id - The ID of the transaction to delete.
     */

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;
        
        // try/catch block.
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
     */
    const handleApplyFilters = () => {
        setFilterDateFrom(dateFromInput);
        setFilterDateTo(dateToInput);
        setCurrentPage(1);
    };

    /**
     * @function handleResetFilters
     */
    const handleResetFilters = () => {
        setFilterDateFrom('');
        setFilterDateTo('');
        setDateFromInput('');
        setDateToInput('');
        setCurrentPage(1);
    };

    // --- 8. PRIMARY DATA CALCULATION (useMemo) ---
    const {
        periodTransactions,
        balanceAtPeriodEnd,
        totalSavingsPot,
        periodSummary,
        incomeAllocation,
        incomeSpentGauge
    } = useMemo(() => {
        const periodStartDate = new Date(selectedYear, filterType === 'year' ? 0 : selectedMonth - 1, 1);
        const periodEndDate = new Date(selectedYear, filterType === 'year' ? 12 : selectedMonth, 0);
        const activeRule = findActiveBudgetRule(budgetSettings, periodStartDate);
        let runningBalance = 0;
        let runningSavingsPot = 0;
        const periodTrans = [];
        let periodSpent = 0;
        let periodSavings = 0;
        let periodInc = 0;
        let periodNeedsActual = 0;
        let periodWantsActual = 0;
        for (const t of transactions) {
            const transactionDate = new Date(t.transaction_date + 'T00:00:00');
            const amount = parseFloat(t.amount);
            if (transactionDate <= periodEndDate) {
                runningBalance += amount;
                if (t.category_type === 'Savings') {
                    runningSavingsPot -= amount;
                }
            }
            const isInPeriod = (filterType === 'year')
                ? (transactionDate.getFullYear() === selectedYear)
                : (transactionDate.getFullYear() === selectedYear && transactionDate.getMonth() + 1 === selectedMonth);
            if (isInPeriod) {
                periodTrans.push(t);
                if (t.type === 'Income' && t.category_type !== 'Savings') {
                    periodInc += amount;
                } else if (t.type === 'Expense') {
                    if (t.category_type === 'Savings') {
                        periodSavings -= amount;
                    } else {
                        periodSpent -= amount;
                        if (t.category_type === 'Needs') periodNeedsActual -= amount;
                        if (t.category_type === 'Wants') periodWantsActual -= amount;
                    }
                }
            }
        }
        const needsTarget = periodInc * activeRule.needs_ratio;
        const wantsTarget = periodInc * activeRule.wants_ratio;
        const savingsTarget = periodInc * activeRule.savings_ratio;
        const allocation = {
            periodIncome: periodInc,
            activeRuleName: activeRule.name,
            needs: { actual: periodNeedsActual, target: needsTarget, percent: needsTarget > 0 ? (periodNeedsActual / needsTarget) * 100 : 0, ratio: activeRule.needs_ratio },
            wants: { actual: periodWantsActual, target: wantsTarget, percent: wantsTarget > 0 ? (periodWantsActual / wantsTarget) * 100 : 0, ratio: activeRule.wants_ratio },
            savings: { actual: periodSavings, target: savingsTarget, percent: savingsTarget > 0 ? (periodSavings / savingsTarget) * 100 : 0, ratio: activeRule.savings_ratio },
        };
        const percentageOfIncomeSpent = periodInc > 0 ? (periodSpent / periodInc) * 100 : 0;
        const isSurplusSpending = periodSpent > periodInc;
        const surplusAmount = isSurplusSpending ? periodSpent - periodInc : 0;
        const gaugeData = {
            isSurplus: isSurplusSpending,
            surplusDetail: `Funded by €${periodInc.toFixed(2)} (income) + €${surplusAmount.toFixed(2)} (surplus)`,
            centerText: isSurplusSpending ? `€${periodSpent.toFixed(2)}` : `${Math.round(percentageOfIncomeSpent)}%`,
            chartData: {
                datasets: [{
                    data: isSurplusSpending ? [100, 0] : [percentageOfIncomeSpent, 100 - percentageOfIncomeSpent],
                    backgroundColor: isSurplusSpending ? ['#dc3545', '#e9ecef'] : ['#e86100', '#e9ecef'],
                    borderWidth: 0,
                }],
            },
        };
        return {
            periodTransactions: periodTrans,
            balanceAtPeriodEnd: runningBalance,
            totalSavingsPot: runningSavingsPot,
            periodSummary: { totalSpent: periodSpent, savingsThisPeriod: periodSavings },
            incomeAllocation: allocation,
            incomeSpentGauge: gaugeData
        };
    }, [transactions, budgetSettings, filterType, selectedYear, selectedMonth]);


    /**
     * @memo chartData
     */
    const chartData = useMemo(() => {
        const categoryColorMap = categories.reduce((acc, cat) => {
            acc[cat.name] = cat.color;
            return acc;
        }, {});
        const spendingData = periodTransactions
            .filter(t => t.type === 'Expense' && t.category_type !== 'Savings')
            .reduce((acc, t) => {
                const categoryName = t.category_name || 'Uncategorized';
                if (!acc[categoryName]) {
                    acc[categoryName] = { total: 0, color: categoryColorMap[categoryName] || '#CCCCCC' };
                }
                acc[categoryName].total += Math.abs(t.amount);
                return acc;
            }, {});
        const labels = Object.keys(spendingData);
        if (labels.length === 0) return { labels: [], datasets: [{ data: [] }] };
        const data = labels.map(label => spendingData[label].total);
        const backgroundColor = labels.map(label => spendingData[label].color);
        return { labels, datasets: [{ data, backgroundColor }] };
    }, [periodTransactions, categories]);

    /**
     * @memo filteredTableTransactions
     */
    const filteredTableTransactions = useMemo(() => {
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
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTableTransactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTableTransactions.length / itemsPerPage);
    const periodLabel = filterType === 'year' ? `${selectedYear}` : `${getMonthName(selectedMonth)}, ${selectedYear}`;
    
    // --- 10. CHART.JS OPTIONS ---
    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                yAlign: 'bottom',
                xAlign: 'left',
                caretPadding: 15,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const dataset = context.dataset.data;
                        const total = dataset.reduce((acc, currentValue) => acc + currentValue, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: €${value.toFixed(2)} (${percentage}%)`;
                    }
                }
            }
        }
    };
    const doughnutOptions = { 
        responsive: true, 
        maintainAspectRatio: false, 
        cutout: '70%',
        plugins: { 
            tooltip: { enabled: false },
            legend: { display: false } 
        } 
    };

    // --- 11. JSX RENDERING ---
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
                                    <Form.Select id="filterTypeSelect" size="sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
                                        <option value="month">Monthly</option>
                                        <option value="year">Yearly</option>
                                    </Form.Select>
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
                                        <div className="flex-grow-1" style={{ position: 'relative', height: '200px' }}>
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
                                    <hr className="mt-4 d-md-none" />
                                    <div className="vr d-none d-md-block position-absolute" style={{ height: "85%", top: "50%", transform: "translateY(-50%)", left: 0 }}></div>
                                    <div className="d-flex flex-column h-100">
                                        <h5 className="text-center mb-3">% of Income Spent <span className="text-muted small">(in {periodLabel})</span></h5>
                                        <div className="flex-grow-1" style={{ position: 'relative', height: '200px' }}>
                                           {incomeAllocation.periodIncome > 0 ? (
                                               <>
                                                   <Doughnut data={incomeSpentGauge.chartData} options={doughnutOptions} />
                                                   <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', fontSize: '1.75rem', fontWeight: 'bold' }}>
                                                       {incomeSpentGauge.centerText}
                                                   </div>
                                               </>
                                           ) : (
                                               <div className="d-flex justify-content-center align-items-center h-100"><p className="text-center text-muted small">No income data.</p></div>
                                           )}
                                        </div>
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
                    
                    {/* The table itself. */}
                    <Table striped hover responsive size="sm">
                        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Account: Amount</th><th>Actions</th></tr></thead>
                        <tbody>
                            {currentItems.map(t => {
                                let accountDisplay;
                                const formattedAmount = `€${Math.abs(t.amount).toFixed(2)}`;
                                if (t.category_type === 'Savings') {
                                    accountDisplay = t.type === 'Expense' ? (
                                        <div><span className="text-danger d-block">Cash: -{formattedAmount}</span><span className="text-success d-block">Savings: +{formattedAmount}</span></div>
                                    ) : (
                                        <div><span className="text-success d-block">Cash: +{formattedAmount}</span><span className="text-danger d-block">Savings: -{formattedAmount}</span></div>
                                    );
                                } else {
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
                                        {isRecurring && <BsClockHistory className="ms-2 text-muted" title="Recurring Transaction" />}
                                    </td>
                                    <td>{t.description}</td>
                                    <td><Badge bg="secondary" pill>{t.category_name}</Badge></td>
                                    <td>{accountDisplay}</td>
                                    <td>
                                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(t.id)} title="Edit"><BsPencil /></Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(t.id)} title="Delete"><BsTrash /></Button>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    
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

// Export the component...
export default Dashboard;