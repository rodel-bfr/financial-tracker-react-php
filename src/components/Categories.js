// Import core React hooks and Bootstrap components for the UI.
import React, { useState, useMemo } from 'react';
import { Card, Form, Button, Row, Col, Badge, Table, Modal } from 'react-bootstrap';
// Import icons for the edit and delete buttons, enhancing the UI's clarity.
import { BsPencil, BsTrash } from 'react-icons/bs';

// Import the specific functions we need from the apiService
// The path is '../services...' because we are in the 'components' folder.
import { addCategory, deleteCategory, updateCategory } from '../services/apiService';

/**
 * A reusable pagination component. It's kept separate for clarity and reusability.
 * (All comments preserved)
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
 */
const Categories = ({ categories, onDataChanged }) => {
    // --- STATE MANAGEMENT (useState) ---
    const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#CCCCCC', type: 'Wants' });
    const [editingCategory, setEditingCategory] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // --- DERIVED STATE & MEMOIZATION (useMemo) ---
    const { currentItems, totalPages } = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const paginatedItems = categories.slice(indexOfFirstItem, indexOfLastItem);
        const pages = Math.ceil(categories.length / itemsPerPage);
        return { currentItems: paginatedItems, totalPages: pages };
    }, [categories, currentPage, itemsPerPage]);

    // --- EVENT HANDLERS (CRUD Operations) ---

    // Handles the submission of the "Add New Category" form.
    const handleAddCategory = async (e) => {
        e.preventDefault(); 
        if (!newCategory.name) { alert('Please enter a category name.'); return; }
        
        try {
            const data = await addCategory(newCategory); // Call the service
            if (data.rezultat === "OK") {
                // On success, reset the form fields and trigger a global data refresh.
                setNewCategory({ name: '', description: '', color: '#CCCCCC', type: 'Wants' });
                onDataChanged();
            } else {
                alert("Error: " + data.rezultat); // Handle backend-specific error
            }
        } catch (error) {
            console.error("Failed to add category:", error);
            alert("An error occurred while adding the category."); // Handle network/service error
        }
    };

    // Handles the click of a "Delete" button for a category.
    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category? This cannot be undone.")) return;
        
        try {
            const data = await deleteCategory(id); // Call the service
            if (data.rezultat === "OK") {
                onDataChanged(); // On success, just trigger a global data refresh.
            } else {
                alert("Error: " + data.rezultat);
            }
        } catch (error) {
            console.error("Failed to delete category:", error);
            alert("An error occurred while deleting the category.");
        }
    };

    // --- MODAL HANDLING LOGIC ---

    const handleShowEditModal = (category) => {
        setEditingCategory(category);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingCategory(null);
    };

    // Handles the submission of the form inside the "Edit" modal.
    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        
        try {
            const data = await updateCategory(editingCategory); // Call the service
            if (data.rezultat === "OK") {
                // On success, close the modal and trigger a global data refresh.
                handleCloseEditModal();
                onDataChanged();
            } else {
                alert("Error: " + data.rezultat);
            }
        } catch (error) {
            console.error("Failed to update category:", error);
            alert("An error occurred while updating the category.");
        }
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
                                    {/* Each form control is a "controlled component"... */}
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
                                    {/* Map over the 'currentItems'... */}
                                    {currentItems.map(cat => (
                                        <tr key={cat.id}>
                                            <td>{cat.name}</td>
                                            <td><div title={cat.color} style={{ width: '25px', height: '25px', backgroundColor: cat.color || '#CCCCCC', border: '1px solid #ddd', borderRadius: '3px', margin: 'auto' }}></div></td>
                                            <td className="text-muted">{cat.description}</td>
                                            <td><Badge bg="secondary" pill>{cat.type}</Badge></td>
                                            {/* Example of conditional rendering... */}
                                            <td>{['Needs', 'Wants', 'Savings'].includes(cat.type) ? cat.type : 'N/A'}</td>
                                            <td>
                                                {/* The onClick handlers... */}
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

            {/* The Edit Modal... */}
            {editingCategory && (
                <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
                    <Modal.Header closeButton><Modal.Title>Edit Category</Modal.Title></Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleUpdateCategory}>
                            {/* The form fields in the modal... */}
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