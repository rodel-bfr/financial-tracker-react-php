// Import core React hooks and a full suite of Bootstrap components for a complex layout.
import React, { useState, useMemo } from 'react';
import { Card, Form, Button, InputGroup, Row, Col, Alert, Modal, ListGroup, Badge } from 'react-bootstrap';
// Import icons to provide clear visual cues for actions like add, edit, delete, and stop.
import { BsPlus, BsPencil, BsTrash, BsStopCircle } from 'react-icons/bs';

// A helper utility function to format date strings into a human-readable format.
const formatDate = (dateString) => {
  if (!dateString) return 'Forever'; // Handle cases where an end date is not set.
  const date = new Date(dateString + 'T00:00:00');
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat('en-GB', options).format(date);
};

// A reusable pagination component, also used in other parts of the application.
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

/**
 * ScheduleManager is a highly reusable component for managing any list of recurring items.
 * It handles its own state for filtering, pagination, and modal-based CRUD operations.
 * Its behavior is customized via props like 'title' and 'itemType'.
 */
const ScheduleManager = ({ title, itemType, categories, onDataChanged, items }) => {
    // --- STATE MANAGEMENT ---
    // State for the Add/Edit modal dialog.
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    
    // State for the filter controls.
    const [statusFilter, setStatusFilter] = useState('active'); // 'all', 'active', 'inactive'
    const [dateFromInput, setDateFromInput] = useState(''); // The value in the date input field
    const [dateToInput, setDateToInput] = useState('');   // The value in the date input field
    const [filterDateFrom, setFilterDateFrom] = useState(''); // The currently applied date filter
    const [filterDateTo, setFilterDateTo] = useState('');     // The currently applied date filter

    // State for pagination.
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // The API endpoint is dynamically constructed based on the 'itemType' prop ('income' or 'expense').
    // This is a key part of what makes this component reusable.
    const API_ENDPOINT = `http://localhost/financial-tracker/recurring_${itemType}s.php`;
    
    // Resets the form state, used when opening the modal to add a new item.
    const resetForm = () => {
        setIsEditing(false);
        setCurrentItem({
            id: null, description: '', amount: '', category_id: '', recurrence_day: '15',
            start_date: new Date().toISOString().slice(0, 10),
            end_date: new Date().toISOString().slice(0, 10),
            contract_end_date: ''
        });
    };
    
    // --- DERIVED STATE & MEMORIZATION ---
    // This useMemo hook calculates the list of items to display based on the active filters.
    // This is a complex derivation and useMemo provides a significant performance boost by caching the result.
    const filteredItems = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);

        // 1. First, filter by the selected date range.
        const dateFiltered = (items || []).filter(item => {
            if (!filterDateFrom || !filterDateTo) return true;
            const scheduleStart = new Date(item.start_date + 'T00:00:00');
            const scheduleEnd = new Date(item.end_date + 'T00:00:00');
            const filterStart = new Date(filterDateFrom + 'T00:00:00');
            const filterEnd = new Date(filterDateTo + 'T00:00:00');
            // Check for any overlap between the schedule's date range and the filter's date range.
            return scheduleStart <= filterEnd && scheduleEnd >= filterStart;
        });

        // 2. Next, dynamically add a 'status' property to each item.
        const withStatus = dateFiltered.map(item => {
            const startDate = new Date(item.start_date + 'T00:00:00');
            const endDate = new Date(item.end_date + 'T00:00:00');
            const status = (today >= startDate && today <= endDate) ? 'active' : 'inactive';
            return { ...item, status };
        });

        // 3. Finally, filter by the selected status ('all', 'active', 'inactive').
        if (statusFilter === 'all') return withStatus;
        return withStatus.filter(item => item.status === statusFilter);
    }, [items, statusFilter, filterDateFrom, filterDateTo]); // Re-calculates only if these dependencies change.

    // This second useMemo hook takes the filtered list and applies pagination to it.
    const { currentPagedItems, totalPages } = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return {
            currentPagedItems: filteredItems.slice(indexOfFirstItem, indexOfLastItem),
            totalPages: Math.ceil(filteredItems.length / itemsPerPage)
        };
    }, [filteredItems, currentPage, itemsPerPage]); // Depends on the result of the previous useMemo hook.

    // --- EVENT HANDLERS ---
    const handleApplyDateFilters = () => { setCurrentPage(1); setFilterDateFrom(dateFromInput); setFilterDateTo(dateToInput); };
    const handleResetDateFilters = () => { setCurrentPage(1); setFilterDateFrom(''); setFilterDateTo(''); setDateFromInput(''); setDateToInput(''); };
    
    // Standard modal and form handlers for CRUD operations.
    const handleOpenModal = (item = null) => {
        if (item) { // If an item is passed, we're editing.
            const itemToEdit = {...item, contract_end_date: item.contract_end_date || ''}; // Ensure contract_end_date is not null
            setIsEditing(true);
            setCurrentItem(itemToEdit);
        } else { // Otherwise, we're adding a new item.
            resetForm();
        }
        setShowModal(true);
    };

    const handleCloseModal = () => { setShowModal(false); resetForm(); };
    const handleFormChange = (e) => { setCurrentItem({...currentItem, [e.target.name]: e.target.value }); };

    const handleSubmit = (e) => {
        e.preventDefault();
        const method = isEditing ? 'PATCH' : 'POST';
        fetch(API_ENDPOINT, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentItem) })
        .then(res => res.json()).then(() => { onDataChanged(); handleCloseModal(); });
    };

    const handleDelete = (id) => {
        if (!window.confirm(`Are you sure you want to delete this schedule and all of its past transactions?`)) return;
        fetch(API_ENDPOINT, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        .then(res => res.json()).then(() => onDataChanged());
    };

    // Special handler for the "Stop" button, which has specific business logic.
    const handleStopClick = (item) => {
        const today = new Date(); today.setHours(0,0,0,0);
        
        // Business Rule: If an expense is under contract, it cannot be stopped early.
        if (itemType === 'expense' && item.contract_end_date) {
            const contractEndDate = new Date(item.contract_end_date + 'T00:00:00');
            if (contractEndDate > today) {
                alert(`This payment schedule is under contract until ${formatDate(item.contract_end_date)} and cannot be stopped early.`);
                return;
            }
        }
        
        const formattedToday = formatDate(today.toISOString().slice(0, 10));
        if (window.confirm(`Are you sure you want to stop the "${item.description}" schedule?\nThis will set its end date to today, ${formattedToday}.`)) {
            const updatedItem = { ...item, end_date: today.toISOString().slice(0, 10) };
            // Use PATCH to update the end date of the existing item.
            fetch(API_ENDPOINT, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedItem) })
            .then(res => res.json()).then(data => { if(data.rezultat === "OK") onDataChanged(); else alert(`Error: ${data.rezultat}`); });
        }
    };
    
    // Another derived value: get only the categories relevant to this component instance (income or expense).
    const relevantCategories = categories ? (itemType === 'income'
        ? categories.filter(c => c.type === 'Income')
        : categories.filter(c => ['Needs', 'Wants', 'Savings'].includes(c.type))) : [];

    // --- JSX RENDERING ---
    return (
        <Card className="h-100">
            <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                {title} {/* Title is passed via props */}
                <Button variant="success" size="sm" onClick={() => handleOpenModal()}><BsPlus /> Add Schedule</Button>
            </Card.Header>
            <Card.Body className="d-flex flex-column">
                {/* Filter Controls */}
                <div className="p-3 border rounded mb-3 bg-light">
                    <Row className="g-3 align-items-center mb-3">
                        <Col xs="auto">
                            <Form.Label htmlFor={`dateFrom-${itemType}`} className="mb-0 fw-bold">Filter by Date:</Form.Label>
                        </Col>
                        <Col>
                            <Form.Control id={`dateFrom-${itemType}`} type="date" size="sm" value={dateFromInput} onChange={e => setDateFromInput(e.target.value)} />
                        </Col>
                        <Col xs="auto">
                            <span className="text-muted">to</span>
                        </Col>
                        <Col>
                            <Form.Control id={`dateTo-${itemType}`} type="date" size="sm" value={dateToInput} onChange={e => setDateToInput(e.target.value)} />
                        </Col>
                        <Col xs="auto"><Button variant="primary" size="sm" onClick={handleApplyDateFilters}>Go</Button></Col>
                        <Col xs="auto"><Button variant="outline-secondary" size="sm" onClick={handleResetDateFilters}>Reset</Button></Col>
                    </Row>
                    <hr/>
                    <Row className="align-items-center">
                        <Col md="auto">
                             <Form.Label htmlFor={`statusAll-${itemType}`} className="mb-0 fw-bold me-3">Status:</Form.Label>
                        </Col>
                        <Col>
                            <Form.Check inline type="radio" label="All" name={`statusFilter-${itemType}`} id={`statusAll-${itemType}`} value="all" checked={statusFilter === 'all'} onChange={(e) => setStatusFilter(e.target.value)} />
                            <Form.Check inline type="radio" label="Active" name={`statusFilter-${itemType}`} id={`statusActive-${itemType}`} value="active" checked={statusFilter === 'active'} onChange={(e) => setStatusFilter(e.target.value)} />
                            <Form.Check inline type="radio" label="Inactive" name={`statusFilter-${itemType}`} id={`statusInactive-${itemType}`} value="inactive" checked={statusFilter === 'inactive'} onChange={(e) => setStatusFilter(e.target.value)} />
                        </Col>
                        <Col md="auto" className="ms-auto">
                            <div className="d-flex align-items-center gap-2">
                                <Form.Label htmlFor={`itemsPerPage-${itemType}`} className="mb-0 fw-bold">Show:</Form.Label>
                                <Form.Select id={`itemsPerPage-${itemType}`} size="sm" value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{width: '75px'}}>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </Form.Select>
                            </div>
                        </Col>
                    </Row>
                </div>
                {/* List of Schedules */}
                <ListGroup variant="flush" className="flex-grow-1">
                    {currentPagedItems.length > 0 ? currentPagedItems.map(item => (
                        <ListGroup.Item key={item.id}>
                            <div className="d-flex justify-content-between">
                                <div>
                                    <strong>€{item.amount}</strong> for '{item.description}'
                                    <Badge bg={item.status === 'active' ? 'success' : 'secondary'} className="ms-2 align-middle text-capitalize">{item.status}</Badge>
                                </div>
                                <div className="text-nowrap">
                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenModal(item)} title="Edit"><BsPencil /></Button>
                                    <Button variant="outline-warning" size="sm" className="me-2" onClick={() => handleStopClick(item)} title="Stop"><BsStopCircle /></Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)} title="Delete"><BsTrash /></Button>
                                </div>
                            </div>
                            <small className="text-muted">From: {formatDate(item.start_date)} To: {formatDate(item.end_date)}</small>
                            {/* Conditional rendering for the contract end date warning */}
                            {item.contract_end_date && <><br/><small className="text-danger fw-bold">Contract ends: {formatDate(item.contract_end_date)}</small></>}
                        </ListGroup.Item>
                    )) : <p className="text-muted text-center p-3">No schedules match the selected filters.</p>}
                </ListGroup>
                <ModernPagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage}/>
            </Card.Body>

            {/* Modal for Adding/Editing a Schedule */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton><Modal.Title>{isEditing ? 'Edit' : 'Add'} {title}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                         <Form.Group className="mb-2"><Form.Label>Description</Form.Label><Form.Control name="description" type="text" placeholder="e.g., Monthly Salary" value={currentItem?.description || ''} onChange={handleFormChange} required /></Form.Group>
                         <Form.Group className="mb-2"><Form.Label>Amount (€)</Form.Label><InputGroup><Form.Control name="amount" type="number" step="0.01" placeholder="100.00" value={currentItem?.amount || ''} onChange={handleFormChange} required /></InputGroup></Form.Group>
                         <Form.Group className="mb-2"><Form.Label>Category</Form.Label><Form.Select name="category_id" value={currentItem?.category_id || ''} onChange={handleFormChange} required><option value="">Select...</option>{relevantCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Form.Select></Form.Group>
                         <Form.Group className="mb-2"><Form.Label>Day of Month (1-31)</Form.Label><Form.Control name="recurrence_day" type="number" min="1" max="31" value={currentItem?.recurrence_day || ''} onChange={handleFormChange} required /></Form.Group>
                         <Row>
                            <Col><Form.Group className="mb-2"><Form.Label>Active From</Form.Label><Form.Control name="start_date" type="date" value={currentItem?.start_date || ''} onChange={handleFormChange} required /></Form.Group></Col>
                            <Col><Form.Group className="mb-2"><Form.Label>Active To</Form.Label><Form.Control name="end_date" type="date" value={currentItem?.end_date || ''} onChange={handleFormChange} required /></Form.Group></Col>
                         </Row>
                        {itemType === 'expense' && (
                             <Form.Group className="mt-2"><Form.Label>Contractual End Date (Optional)</Form.Label><Form.Control name="contract_end_date" type="date" value={currentItem?.contract_end_date || ''} onChange={handleFormChange} /></Form.Group>
                        )}
                         <div className="text-end mt-3"><Button variant="primary" type="submit">{isEditing ? 'Save Changes' : 'Add Schedule'}</Button></div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Card>
    );
};


/**
 * BudgetRuleManager is another self-contained CRUD component for managing budget rules (e.g., 50/30/20).
 */
const BudgetRuleManager = ({ budgetRules, onDataChanged }) => {
    // Standard state for modal CRUD operations.
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    // State to show notifications (e.g., validation errors) inside the modal.
    const [notification, setNotification] = useState({ show: false, message: '', variant: 'danger' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 2;
    const API_ENDPOINT = `http://localhost/financial-tracker/budget.php`;

    // Memorized pagination logic.
    const { currentRules, totalPages } = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return {
            currentRules: budgetRules.slice(indexOfFirstItem, indexOfLastItem),
            totalPages: Math.ceil(budgetRules.length / itemsPerPage)
        };
    }, [budgetRules, currentPage]);

    const resetForm = () => {
        setIsEditing(false);
        setCurrentItem({
            id: null, name: '', start_date: new Date().toISOString().slice(0, 10), end_date: '',
            needs_ratio: '50', wants_ratio: '30', savings_ratio: '20'
        });
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setCurrentItem(item);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleCloseModal = () => { setShowModal(false); resetForm(); };
    const handleFormChange = (e) => setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
    
    const handleDelete = (id) => {
        if (!window.confirm(`Are you sure you want to delete this budget rule?`)) return;
        fetch(API_ENDPOINT, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
            .then(res => res.json()).then(() => onDataChanged());
    };

    // Submit handler with custom client-side validation.
    const handleSubmit = (e) => {
        e.preventDefault();
        const { needs_ratio, wants_ratio, savings_ratio } = currentItem;
        // Business Rule: Ensure the three ratios add up to exactly 100.
        const total = parseInt(needs_ratio || 0) + parseInt(wants_ratio || 0) + parseInt(savings_ratio || 0);
        if (total !== 100) {
            setNotification({ show: true, message: 'Ratios must add up to 100%.', variant: 'danger' });
            return; // Stop the submission if validation fails.
        }

        // Standard POST/PATCH logic.
        const method = isEditing ? 'PATCH' : 'POST';
        fetch(API_ENDPOINT, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentItem) })
            .then(res => res.json()).then(data => {
                if (data.rezultat === "OK") {
                    onDataChanged();
                    handleCloseModal();
                } else {
                    setNotification({ show: true, message: data.rezultat || 'An error occurred.', variant: 'danger' });
                }
            });
    };
    
    return (
        <Card>
            <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                Budgeting Rules
                <Button variant="primary" size="sm" onClick={() => handleOpenModal()}><BsPlus /> Add Rule</Button>
            </Card.Header>
            <Card.Body className="d-flex flex-column">
                <p className="text-muted">Define different budgeting rules for specific time periods. The rule with the most recent start date for a given period will be applied.</p>
                <ListGroup variant="flush" className="flex-grow-1">
                    {currentRules.length > 0 ? currentRules.map(rule => (
                        <ListGroup.Item key={rule.id}>
                            <div className="d-flex justify-content-between">
                                <div>
                                    <strong>{rule.name}</strong>
                                    <Badge bg="secondary" className="ms-2">{`${rule.needs_ratio}% / ${rule.wants_ratio}% / ${rule.savings_ratio}%`}</Badge>
                                </div>
                                <div className="text-nowrap">
                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenModal(rule)} title="Edit"><BsPencil /></Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(rule.id)} title="Delete"><BsTrash /></Button>
                                </div>
                            </div>
                            <small className="text-muted">Effective: {formatDate(rule.start_date)} to {formatDate(rule.end_date)}</small>
                        </ListGroup.Item>
                    )) : <p className="text-muted text-center p-3">No budget rules defined.</p>}
                </ListGroup>
                
                <ModernPagination
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </Card.Body>

             <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton><Modal.Title>{isEditing ? 'Edit' : 'Add'} Budget Rule</Modal.Title></Modal.Header>
                <Modal.Body>
                    {notification.show && <Alert variant={notification.variant} onClose={() => setNotification({ show: false })} dismissible>{notification.message}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3"><Form.Label>Rule Name</Form.Label><Form.Control name="name" type="text" placeholder="e.g., Aggressive Saving Period" value={currentItem?.name || ''} onChange={handleFormChange} required /></Form.Group>
                        <Row>
                           <Col><Form.Group className="mb-3"><Form.Label>From Date</Form.Label><Form.Control name="start_date" type="date" value={currentItem?.start_date || ''} onChange={handleFormChange} required /></Form.Group></Col>
                           <Col><Form.Group className="mb-3"><Form.Label>To Date (Optional)</Form.Label><Form.Control name="end_date" type="date" value={currentItem?.end_date || ''} onChange={handleFormChange} /></Form.Group></Col>
                        </Row>
                        <hr/>
                        <p className="text-muted mb-2">Define the allocation percentages for this rule.</p>
                        <Row>
                           <Col><Form.Group className="mb-3"><Form.Label>Needs %</Form.Label><Form.Control name="needs_ratio" type="number" placeholder="50" value={currentItem?.needs_ratio || ''} onChange={handleFormChange} required /></Form.Group></Col>
                           <Col><Form.Group className="mb-3"><Form.Label>Wants %</Form.Label><Form.Control name="wants_ratio" type="number" placeholder="30" value={currentItem?.wants_ratio || ''} onChange={handleFormChange} required /></Form.Group></Col>
                           <Col><Form.Group className="mb-3"><Form.Label>Savings %</Form.Label><Form.Control name="savings_ratio" type="number" placeholder="20" value={currentItem?.savings_ratio || ''} onChange={handleFormChange} required /></Form.Group></Col>
                        </Row>
                        <div className="text-end mt-3"><Button variant="primary" type="submit">{isEditing ? 'Save Changes' : 'Add Rule'}</Button></div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Card>
    );
}

/**
 * BudgetSetup is the main page component that acts as a container or layout component.
 * Its primary job is to compose the other manager components into a single page.
 */
const BudgetSetup = ({ settings, onSettingsSaved, categories, recurringIncomes, recurringExpenses }) => {
    // It receives all necessary data from the main App component via props.
    const budgetRules = settings;

    return (
        <>
            <Row className="mb-4">
                <Col>
                    {/* It renders the BudgetRuleManager, passing down the relevant data. */}
                    <BudgetRuleManager budgetRules={budgetRules} onDataChanged={onSettingsSaved} />
                </Col>
            </Row>
            <Row>
                <Col lg={6} className="mb-4 mb-lg-0">
                    {/* It renders an instance of ScheduleManager for Incomes. */}
                    <ScheduleManager title="Scheduled Incomes" itemType="income" categories={categories} onDataChanged={onSettingsSaved} items={recurringIncomes} />
                </Col>
                <Col lg={6}>
                    {/* It renders another instance of ScheduleManager for Expenses, demonstrating reusability. */}
                    <ScheduleManager title="Scheduled Payments" itemType="expense" categories={categories} onDataChanged={onSettingsSaved} items={recurringExpenses} />
                </Col>
            </Row>
        </>
    );
};

export default BudgetSetup;