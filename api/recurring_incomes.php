<?php
/**
 * @file recurring_incomes.php
 * @description This script manages recurring incomes. Its structure and logic are almost identical
 * to recurring_expenses.php, but it handles positive income values.
 * It provides functionality to:
 * 1. Process and automatically create transactions for due recurring incomes.
 * 2. CRUD (Create, Read, Update, Delete) the recurring income rules.
 * It acts as a RESTful API endpoint for the '/recurring_incomes' resource.
 */

require 'conectare.php';

// --- 1. SPECIAL ACTION: PROCESS RECURRING INCOMES ---
/**
 * @function processRecurringIncomes
 * @description Automatically creates transaction records for any due recurring incomes
 * that have not yet been processed. This is the income counterpart to processRecurringExpenses.
 * @param mysqli $cnx The active database connection.
 */
function processRecurringIncomes($cnx) {
    $today = new DateTime();
    $today->setTime(0, 0, 0);
    $added_count = 0;

    $query = "SELECT * FROM recurring_incomes WHERE start_date <= ?";
    $stmt = mysqli_prepare($cnx, $query);
    $today_str = $today->format('Y-m-d');
    
    mysqli_stmt_bind_param($stmt, 's', $today_str);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    while ($rule = mysqli_fetch_assoc($result)) {
        // Safety check for category existence.
        $cat_id = $rule['category_id'];
        $check_cat_q = "SELECT id FROM categories WHERE id = ?";
        $check_cat_stmt = mysqli_prepare($cnx, $check_cat_q);
        mysqli_stmt_bind_param($check_cat_stmt, 'i', $cat_id);
        mysqli_stmt_execute($check_cat_stmt);
        mysqli_stmt_store_result($check_cat_stmt);

        if (mysqli_stmt_num_rows($check_cat_stmt) > 0) {
            $end_date_obj = new DateTime($rule['end_date']);
            // Determine the starting point for transaction generation.
            $cursor_date = $rule['last_processed_date'] ? (new DateTime($rule['last_processed_date']))->modify('first day of next month') : new DateTime($rule['start_date']);

            // Loop through each month that needs processing.
            while ($cursor_date <= $today && $cursor_date <= $end_date_obj) {
                $transaction_date_obj = new DateTime($cursor_date->format('Y-m-') . $rule['recurrence_day']);
                
                // Handle invalid days of the month (e.g., day 30 in a February).
                if ($transaction_date_obj->format('m') != $cursor_date->format('m')) {
                    $transaction_date_obj = new DateTime($cursor_date->format('Y-m-t'));
                }

                if ($transaction_date_obj <= $today) {
                    $transaction_date_str = $transaction_date_obj->format('Y-m-d');
                    
                    // Prepare to insert a new 'Income' transaction, linking it with 'recurring_income_id'.
                    $trans_stmt = mysqli_prepare($cnx, "INSERT INTO transactions(description, amount, type, category_id, transaction_date, recurring_income_id) VALUES (?, ?, 'Income', ?, ?, ?)");
                    
                    // Bind parameters. The amount is positive for income.
                    mysqli_stmt_bind_param($trans_stmt, 'sdisi', $rule['description'], $rule['amount'], $rule['category_id'], $transaction_date_str, $rule['id']);
                    mysqli_stmt_execute($trans_stmt);
                    $added_count++;
                }
                $cursor_date->modify('first day of next month');
            }
            // Update the 'last_processed_date' to prevent reprocessing.
            $update_stmt = mysqli_prepare($cnx, "UPDATE recurring_incomes SET last_processed_date = ? WHERE id = ?");
            mysqli_stmt_bind_param($update_stmt, 'si', $today_str, $rule['id']);
            mysqli_stmt_execute($update_stmt);
        }
    }
    // Return a status message.
    echo json_encode(['status' => 'processed', 'added' => $added_count]);
}

// --- 2. READ (GET) ---
/**
 * @function getRecurringIncomes
 * @description Handles HTTP GET requests. Fetches and returns all recurring income rules.
 * @param mysqli $cnx The active database connection.
 */
function getRecurringIncomes($cnx) {
    $raspuns = [];
    $query = "SELECT r.*, c.name as category_name FROM recurring_incomes r JOIN categories c ON r.category_id = c.id ORDER BY r.id DESC";
    if ($rez = mysqli_query($cnx, $query)) {
        while ($linie = mysqli_fetch_assoc($rez)) {
            $raspuns[] = $linie;
        }
    }
    echo json_encode($raspuns);
}

// --- 3. CREATE (POST) ---
/**
 * @function addRecurringIncome
 * @description Handles HTTP POST requests. Adds a new recurring income rule.
 * @param mysqli $cnx The active database connection.
 */
function addRecurringIncome($cnx) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = mysqli_prepare($cnx, "INSERT INTO recurring_incomes (description, amount, category_id, recurrence_day, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)");
    mysqli_stmt_bind_param($stmt, 'sdiiss', $data['description'], $data['amount'], $data['category_id'], $data['recurrence_day'], $data['start_date'], $data['end_date']);
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['rezultat' => "OK", 'id' => mysqli_stmt_insert_id($stmt)]);
    } else {
        echo json_encode(['rezultat' => 'Eroare: ' . mysqli_error($cnx)]);
    }
}

// --- 4. UPDATE (PATCH) ---
/**
 * @function updateRecurringIncome
 * @description Handles HTTP PATCH requests. Updates an existing recurring income rule
 * and deletes its previously generated transactions to allow for regeneration.
 * @param mysqli $cnx The active database connection.
 */
function updateRecurringIncome($cnx) {
    $data = json_decode(file_get_contents('php://input'), true);

    // Step 1: Delete all transactions linked to this rule's ID.
    $delete_trans_stmt = mysqli_prepare($cnx, "DELETE FROM transactions WHERE recurring_income_id = ?");
    mysqli_stmt_bind_param($delete_trans_stmt, 'i', $data['id']);
    mysqli_stmt_execute($delete_trans_stmt);
    
    // Step 2: Update the rule and reset 'last_processed_date' to NULL to trigger regeneration.
    $stmt = mysqli_prepare($cnx, "UPDATE recurring_incomes SET description=?, amount=?, category_id=?, recurrence_day=?, start_date=?, end_date=?, last_processed_date=NULL WHERE id=?");
    mysqli_stmt_bind_param($stmt, 'sdiissi', $data['description'], $data['amount'], $data['category_id'], $data['recurrence_day'], $data['start_date'], $data['end_date'], $data['id']);
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['rezultat' => "OK"]);
    } else {
        echo json_encode(['rezultat' => 'Eroare: ' . mysqli_error($cnx)]);
    }
}

// --- 5. DELETE (DELETE) ---
/**
 * @function deleteRecurringIncome
 * @description Handles HTTP DELETE requests. Deletes a recurring income rule.
 * Associated transactions are deleted automatically via 'ON DELETE CASCADE' in the database.
 * @param mysqli $cnx The active database connection.
 */
function deleteRecurringIncome($cnx) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'];
    
    $stmt = mysqli_prepare($cnx, "DELETE FROM recurring_incomes WHERE id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $id);
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['rezultat' => "OK"]);
    } else {
        echo json_encode(['rezultat' => 'Eroare: ' . mysqli_error($cnx)]);
    }
}

// --- 6. Main Request Router ---
// Directs the incoming request to the correct function based on the HTTP method.
$metoda = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Special route for the processing action.
if ($metoda == 'POST' && $action == 'process') {
    processRecurringIncomes($cnx);
} 
// Standard RESTful routes.
else {
    switch ($metoda) {
        case 'GET': getRecurringIncomes($cnx); break;
        case 'POST': addRecurringIncome($cnx); break;
        case 'PATCH': updateRecurringIncome($cnx); break;
        case 'DELETE': deleteRecurringIncome($cnx); break;
    }
}
mysqli_close($cnx);
?>