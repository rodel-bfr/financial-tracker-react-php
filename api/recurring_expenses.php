<?php
/**
 * @file recurring_expenses.php
 * @description This script manages recurring expenses. It provides functionality to:
 * 1. Process and automatically create transactions for due recurring expenses (special action).
 * 2. CRUD (Create, Read, Update, Delete) the recurring expense rules themselves.
 * It acts as a RESTful API endpoint for the '/recurring_expenses' resource.
 */

// Include the database connection file. This is essential for any database operations.
require 'conectare.php';

// --- 1. SPECIAL ACTION: PROCESS RECURRING EXPENSES ---
/**
 * @function processRecurringExpenses
 * @description This is the core logic for automation. It finds all active recurring expense rules
 * and creates the actual transaction records in the 'transactions' table for any past due dates
 * that haven't been processed yet. This should be triggered periodically (e.g., once a day).
 * @param mysqli $cnx The active database connection.
 */
function processRecurringExpenses($cnx) {
    // Get today's date with the time set to midnight for consistent comparisons.
    $today = new DateTime();
    $today->setTime(0, 0, 0);
    $added_count = 0; // A counter for the number of new transactions created.

    // Fetch all recurring expense rules that have already started.
    $query = "SELECT * FROM recurring_expenses WHERE start_date <= ?";
    $stmt = mysqli_prepare($cnx, $query);
    $today_str = $today->format('Y-m-d');
    
    mysqli_stmt_bind_param($stmt, 's', $today_str);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    // Loop through each recurring expense rule found.
    while ($rule = mysqli_fetch_assoc($result)) {
        // A safety check to ensure the category assigned to the rule still exists.
        $cat_id = $rule['category_id'];
        $check_cat_q = "SELECT id FROM categories WHERE id = ?";
        $check_cat_stmt = mysqli_prepare($cnx, $check_cat_q);
        mysqli_stmt_bind_param($check_cat_stmt, 'i', $cat_id);
        mysqli_stmt_execute($check_cat_stmt);
        mysqli_stmt_store_result($check_cat_stmt);

        // Only proceed if the category is valid.
        if (mysqli_stmt_num_rows($check_cat_stmt) > 0) {
            $end_date_obj = new DateTime($rule['end_date']);
            
            // The 'cursor_date' is our starting point for generating transactions.
            // If we've processed this rule before, start from the month after 'last_processed_date'.
            // Otherwise, start from the rule's 'start_date'.
            $cursor_date = $rule['last_processed_date'] ? (new DateTime($rule['last_processed_date']))->modify('first day of next month') : new DateTime($rule['start_date']);

            // Loop through each month from the cursor date until today's date.
            while ($cursor_date <= $today && $cursor_date <= $end_date_obj) {
                // Construct the potential transaction date for the current month in the loop.
                $transaction_date_obj = new DateTime($cursor_date->format('Y-m-') . $rule['recurrence_day']);

                // Handle cases where the recurrence day is invalid for the month (e.g., day 31 in February).
                // If the month of the constructed date doesn't match the cursor's month, it means the day was too high.
                // In this case, we use the last day of the cursor's month instead.
                if ($transaction_date_obj->format('m') != $cursor_date->format('m')) {
                    $transaction_date_obj = new DateTime($cursor_date->format('Y-m-t')); // 't' gives the last day of the month.
                }

                // Only create the transaction if its calculated date is in the past or is today.
                if ($transaction_date_obj <= $today) {
                    $transaction_date_str = $transaction_date_obj->format('Y-m-d');
                    
                    // Prepare to insert the new transaction. Note the 'recurring_expense_id' column.
                    // This creates a direct link between the generated transaction and the rule that created it.
                    $trans_stmt = mysqli_prepare($cnx, "INSERT INTO transactions(description, amount, type, category_id, transaction_date, recurring_expense_id) VALUES (?, ?, 'Expense', ?, ?, ?)");
                    
                    $negative_amount = -abs($rule['amount']); // Ensure expense amounts are stored as negative numbers.
                    
                    // Bind the parameters, including the rule's ID, to the INSERT statement.
                    mysqli_stmt_bind_param($trans_stmt, 'sdisi', $rule['description'], $negative_amount, $rule['category_id'], $transaction_date_str, $rule['id']);
                    mysqli_stmt_execute($trans_stmt);
                    $added_count++;
                }
                // Move the cursor to the first day of the next month to continue the loop.
                $cursor_date->modify('first day of next month');
            }
            // After processing the rule, update its 'last_processed_date' to today.
            // This prevents the same transactions from being created again next time the script runs.
            $update_stmt = mysqli_prepare($cnx, "UPDATE recurring_expenses SET last_processed_date = ? WHERE id = ?");
            mysqli_stmt_bind_param($update_stmt, 'si', $today_str, $rule['id']);
            mysqli_stmt_execute($update_stmt);
        }
    }
    // Return a status message to the client.
    echo json_encode(['status' => 'processed', 'added_expenses' => $added_count]);
}

// --- 2. READ (GET) ---
/**
 * @function getRecurringExpenses
 * @description Handles HTTP GET requests. Fetches and returns all recurring expense rules from the database.
 * It joins with the 'categories' table to include the category name in the response.
 * @param mysqli $cnx The active database connection.
 */
function getRecurringExpenses($cnx) {
    $raspuns = [];
    $query = "SELECT r.*, c.name as category_name FROM recurring_expenses r JOIN categories c ON r.category_id = c.id ORDER BY r.id DESC";
    if ($rez = mysqli_query($cnx, $query)) {
        while ($linie = mysqli_fetch_assoc($rez)) {
            $raspuns[] = $linie;
        }
    }
    echo json_encode($raspuns);
}

// --- 3. CREATE (POST) ---
/**
 * @function addRecurringExpense
 * @description Handles HTTP POST requests. Adds a new recurring expense rule to the database.
 * @param mysqli $cnx The active database connection.
 */
function addRecurringExpense($cnx) {
    $data = json_decode(file_get_contents('php://input'), true);
    $contract_date = !empty($data['contract_end_date']) ? $data['contract_end_date'] : null;
    $stmt = mysqli_prepare($cnx, "INSERT INTO recurring_expenses (description, amount, category_id, recurrence_day, start_date, end_date, contract_end_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
    mysqli_stmt_bind_param($stmt, 'sdiisss', $data['description'], $data['amount'], $data['category_id'], $data['recurrence_day'], $data['start_date'], $data['end_date'], $contract_date);
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['rezultat' => "OK", 'id' => mysqli_stmt_insert_id($stmt)]);
    } else {
        echo json_encode(['rezultat' => 'Eroare: ' . mysqli_error($cnx)]);
    }
}

// --- 4. UPDATE (PATCH) ---
/**
 * @function updateRecurringExpense
 * @description Handles HTTP PATCH requests. Updates an existing recurring expense rule.
 * Crucially, it first deletes all transactions previously generated by this rule
 * and then resets 'last_processed_date' to NULL. This forces the system to regenerate
 * all transactions for the rule with the updated details the next time the processing script runs.
 * @param mysqli $cnx The active database connection.
 */
function updateRecurringExpense($cnx) {
    $data = json_decode(file_get_contents('php://input'), true);
    $contract_date = !empty($data['contract_end_date']) ? $data['contract_end_date'] : null;
    
    // Step 1: Delete all transactions linked to this specific recurring expense ID.
    // This is more reliable than matching by description.
    $delete_trans_stmt = mysqli_prepare($cnx, "DELETE FROM transactions WHERE recurring_expense_id = ?");
    mysqli_stmt_bind_param($delete_trans_stmt, 'i', $data['id']);
    mysqli_stmt_execute($delete_trans_stmt);
    
    // Step 2: Update the rule itself and set 'last_processed_date' to NULL to force a full reprocessing.
    $stmt = mysqli_prepare($cnx, "UPDATE recurring_expenses SET description=?, amount=?, category_id=?, recurrence_day=?, start_date=?, end_date=?, contract_end_date=?, last_processed_date=NULL WHERE id=?");
    mysqli_stmt_bind_param($stmt, 'sdiisssi', $data['description'], $data['amount'], $data['category_id'], $data['recurrence_day'], $data['start_date'], $data['end_date'], $contract_date, $data['id']);
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['rezultat' => "OK"]);
    } else {
        echo json_encode(['rezultat' => 'Eroare: ' . mysqli_error($cnx)]);
    }
}

// --- 5. DELETE (DELETE) ---
/**
 * @function deleteRecurringExpense
 * @description Handles HTTP DELETE requests. Deletes a recurring expense rule.
 * The corresponding transactions are deleted automatically by the database thanks to an
 * 'ON DELETE CASCADE' foreign key constraint on the 'recurring_expense_id' column.
 * @param mysqli $cnx The active database connection.
 */
function deleteRecurringExpense($cnx) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'];
    
    // We only need to delete the rule. The database handles the rest.
    $stmt = mysqli_prepare($cnx, "DELETE FROM recurring_expenses WHERE id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $id);
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['rezultat' => "OK"]);
    } else {
        echo json_encode(['rezultat' => 'Eroare: ' . mysqli_error($cnx)]);
    }
}

// --- 6. Main Request Router ---
// This block determines which function to call based on the HTTP request method and any 'action' parameter.
$metoda = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// A special route for the processing action. It uses POST for safety, as it modifies data.
if ($metoda == 'POST' && $action == 'process') {
    processRecurringExpenses($cnx);
} 
// The standard RESTful routes for CRUD operations.
else {
    switch ($metoda) {
        case 'GET': getRecurringExpenses($cnx); break;
        case 'POST': addRecurringExpense($cnx); break;
        case 'PATCH': updateRecurringExpense($cnx); break; // Using PATCH for updates is a common convention.
        case 'DELETE': deleteRecurringExpense($cnx); break;
    }
}

// Close the database connection at the end of the script.
mysqli_close($cnx);
?>