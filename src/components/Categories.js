// Import core React hooks and Bootstrap components for the UI.
import React, { useState, useMemo } from 'react';
import { Card, Form, Button, Row, Col, Badge, Table, Modal } from 'react-bootstrap';
// Import icons for the edit and delete buttons, enhancing the UI's clarity.
import { BsPencil, BsTrash } from 'react-icons/bs';

// Centralized API endpoint for all category-related operations.
const API_URL = "http://localhost/financial-tracker/";

/**
 * A reusable pagination component. It's kept separate for clarity and reusability.
 * It handles its own rendering logic based on the props it receives.
 * @param {object} props - Component props.
 * @param {number} props.totalPages - The total number of pages.
 * @param {number} props.currentPage - The currently active page.
 * @param {Function} props.onPageChange - A callback function to be called when the page changes.
 */
const ModernPagination = ({ totalPages, currentPage, onPageChange }) => {
    // Don't render the component if there's only one page or less.
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="d-flex justify-content-center align-items-center mt-4">
            <Button variant="light" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="me-3">
                &laquo; Previous
            </Button>
            <span className="text-muted small">Page {currentPage} of {totalPages}</span>
            <Button variant="light" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="ms-3">
                Next &raquo;
            </Button>
        </div>
    );
};

/**
 * The Categories component allows users to manage their transaction categories.
 * It provides functionality to add, view, edit, and delete categories.
 * @param {object} props - Component props.
 * @param {Array} props.categories - The full list of categories passed down from App.js.
 * @param {Function} props.onDataChanged - The callback function to trigger a data reload in App.js.
 */
const Categories = ({ categories, onDataChanged }) => {
    // --- STATE MANAGEMENT (useState) ---
    // State for the "Add New Category" form fields (a controlled component).
    const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#CCCCCC', type: 'Wants' });
    // State to hold the category object that is currently being edited. It's null when not editing.
    const [editingCategory, setEditingCategory] = useState(null);
    // State to control the visibility of the edit modal dialog.
    const [showEditModal, setShowEditModal] = useState(false);
    // State for managing the table's pagination.
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // --- DERIVED STATE & MEMOIZATION (useMemo) ---
    // This hook calculates which items to display on the current page.
    // useMemo ensures this calculation only re-runs when its dependencies change, improving performance.
    const { currentItems, totalPages } = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const paginatedItems = categories.slice(indexOfFirstItem, indexOfLastItem);
        const pages = Math.ceil(categories.length / itemsPerPage);
        return { currentItems: paginatedItems, totalPages: pages };
    }, [categories, currentPage, itemsPerPage]); // Dependencies: re-calculate if these change.

    // --- EVENT HANDLERS (CRUD Operations) ---

    // Handles the submission of the "Add New Category" form.
    const handleAddCategory = (e) => {
        e.preventDefault(); // Prevent default form submission which causes a page reload.
        if (!newCategory.name) { alert('Please enter a category name.'); return; }
        
        fetch(`${API_URL}categories.php`, {
            method: 'POST', // Use POST for creating a new resource.
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCategory)
        })
        .then(res => res.json())
        .then(data => {
            if(data.rezultat === "OK") {
                // On success, reset the form fields and trigger a global data refresh.
                setNewCategory({ name: '', description: '', color: '#CCCCCC', type: 'Wants' });
                onDataChanged();
            } else { alert("Error: " + data.rezultat); }
        });
    };

    // Handles the click of a "Delete" button for a category.
    const handleDeleteCategory = (id) => {
        // Use window.confirm as a simple way to get user confirmation before a destructive action.
        if(!window.confirm("Are you sure you want to delete this category? This cannot be undone.")) return;
        
        fetch(`${API_URL}categories.php`, {
            method: 'DELETE', // Use DELETE for removing a resource.
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
        .then(res => res.json())
        .then(data => {
            if(data.rezultat === "OK") {
                onDataChanged(); // On success, just trigger a global data refresh.
            } 
            else { alert("Error: " + data.rezultat); }
        });
    };

    // --- MODAL HANDLING LOGIC ---

    // This function is called when the user clicks an "Edit" button.
    const handleShowEditModal = (category) => {
        setEditingCategory(category); // Store the category object to be edited in state.
        setShowEditModal(true);       // Set the state to true to show the modal.
    };

    // This function is called when the modal is closed (either by cancel button or 'x').
    const handleCloseEditModal = () => {
        setShowEditModal(false);      // Hide the modal.
        setEditingCategory(null);     // Clear the editing state.
    };

    // Handles the submission of the form inside the "Edit" modal.
    const handleUpdateCategory = (e) => {
        e.preventDefault();
        fetch(`${API_URL}categories.php`, {
            method: 'PATCH', // Use PATCH for updating an existing resource.
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingCategory)
        })
        .then(res => res.json())
        .then(data => {
            if(data.rezultat === "OK") {
                // On success, close the modal and trigger a global data refresh.
                handleCloseEditModal();
                onDataChanged();
            } else { alert("Error: " + data.rezultat); }
        });
    };

    // --- JSX RENDERING ---
    return (
        <>
            <Row>
                {/* Section for adding a new category */}
                <Col md={12} className="mb-4">
                    <Card>
                        <Card.Header as="h4">Add New Category</Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleAddCategory}>
                                <Row className="align-items-end g-3">
                                    {/* Each form control is a "controlled component". Its value is tied to state,
                                        and its onChange handler updates that state. The spread syntax `{...newCategory}`
                                        is used to update one field while keeping the others intact. */}
                                    <Col md={3}><Form.Group><Form.Label htmlFor="new-cat-name">Name</Form.Label><Form.Control id="new-cat-name" type="text" placeholder="e.g., Groceries" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} required /></Form.Group></Col>
                                    <Col md={4}><Form.Group><Form.Label htmlFor="new-cat-desc">Description</Form.Label><Form.Control id="new-cat-desc" type="text" placeholder="e.g., Weekly food shopping" value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} /></Form.Group></Col>
                                    <Col md={2}><Form.Group><Form.Label htmlFor="new-cat-type">Type</Form.Label><Form.Select id="new-cat-type" value={newCategory.type} onChange={e => setNewCategory({...newCategory, type: e.target.value})}><option value="Wants">Wants</option><option value="Needs">Needs</option><option value="Savings">Savings</option><option value="Income">Income</option></Form.Select></Form.Group></Col>
                                    <Col md={1}><Form.Group><Form.Label htmlFor="new-cat-color">Color</Form.Label><Form.Control id="new-cat-color" type="color" value={newCategory.color} onChange={e => setNewCategory({...newCategory, color: e.target.value})} /></Form.Group></Col>
                                    <Col md={2}><Button variant="success" type="submit" className="w-100">Add Category</Button></Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Section for managing existing categories */}
                <Col md={12}>
                    <Card>
                        <Card.Header as="h4">Manage Categories</Card.Header>
                        <Card.Body>
                            {/* Pagination controls */}
                            <div className="d-flex justify-content-end mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <Form.Label htmlFor="cat-items-per-page" className="mb-0 fw-bold">Show:</Form.Label>
                                    <Form.Select id="cat-items-per-page" size="sm" value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{width: '75px'}}>
                                        <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                                    </Form.Select>
                                </div>
                            </div>
                            {/* The table displays the list of categories */}
                            <Table striped bordered hover responsive size="sm">
                                <thead>
                                    <tr>
                                        <th>Name</th><th>Color</th><th>Description</th><th>Type</th><th>Budget Role</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Map over the 'currentItems' (the paginated list) to create a table row for each category. */}
                                    {/* The 'key' prop is essential for React to efficiently update the list. */}
                                    {currentItems.map(cat => (
                                        <tr key={cat.id}>
                                            <td>{cat.name}</td>
                                            <td><div title={cat.color} style={{ width: '25px', height: '25px', backgroundColor: cat.color || '#CCCCCC', border: '1px solid #ddd', borderRadius: '3px', margin: 'auto' }}></div></td>
                                            <td className="text-muted">{cat.description}</td>
                                            <td><Badge bg="secondary" pill>{cat.type}</Badge></td>
                                            {/* Example of conditional rendering inside the table */}
                                            <td>{['Needs', 'Wants', 'Savings'].includes(cat.type) ? cat.type : 'N/A'}</td>
                                            <td>
                                                {/* The onClick handlers call the appropriate function with the current category's data. */}
                                                <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowEditModal(cat)} title="Edit"><BsPencil /></Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteCategory(cat.id)} title="Delete"><BsTrash /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                           {/* Render the pagination component */}
                           <ModernPagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* The Edit Modal is only rendered to the DOM when 'editingCategory' is not null.
                This is an efficient way to handle modals, avoiding an empty modal in the DOM at all times. */}
            {editingCategory && (
                <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
                    <Modal.Header closeButton><Modal.Title>Edit Category</Modal.Title></Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleUpdateCategory}>
                            {/* The form fields in the modal are controlled by the 'editingCategory' state object. */}
                            <Form.Group className="mb-3"><Form.Label htmlFor="edit-cat-name">Name</Form.Label><Form.Control id="edit-cat-name" type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} required /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label htmlFor="edit-cat-desc">Description</Form.Label><Form.Control id="edit-cat-desc" as="textarea" rows={2} value={editingCategory.description || ''} onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})} /></Form.Group>
                            <Row>
                                <Col><Form.Group><Form.Label htmlFor="edit-cat-type">Type</Form.Label><Form.Select id="edit-cat-type" value={editingCategory.type} onChange={(e) => setEditingCategory({...editingCategory, type: e.target.value})}><option value="Wants">Wants</option><option value="Needs">Needs</option><option value="Savings">Savings</option><option value="Income">Income</option></Form.Select></Form.Group></Col>
                                <Col xs="auto"><Form.Group><Form.Label htmlFor="edit-cat-color">Color</Form.Label><Form.Control id="edit-cat-color" type="color" value={editingCategory.color || '#CCCCCC'} onChange={(e) => setEditingCategory({...editingCategory, color: e.target.value})} /></Form.Group></Col>
                            </Row>
                             <div className="text-end mt-4">
                                <Button variant="secondary" onClick={handleCloseEditModal} className="me-2">Cancel</Button>
                                <Button variant="primary" type="submit">Save Changes</Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
};

export default Categories;
// This component is responsible for managing and displaying transaction categories.