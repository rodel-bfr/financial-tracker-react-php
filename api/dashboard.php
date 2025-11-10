<?php
// Include the database connection.
require 'conectare.php';

// Function to calculate total expenses per category for a given date range.
function getCategoryTotals($cnx, $startDate, $endDate) {
    $totals = [];
    // This query sums up transaction amounts, grouping them by category.
    // It only considers 'Expense' type transactions within the specified date range.
    $query = "SELECT c.name, c.type, SUM(t.amount) as total 
              FROM transactions t 
              JOIN categories c ON t.category_id = c.id
              WHERE t.transaction_date BETWEEN ? AND ? AND t.type = 'Expense'
              GROUP BY c.id";
    $stmt = mysqli_prepare($cnx, $query);
    // 'ss' for two string parameters (the dates).
    mysqli_stmt_bind_param($stmt, 'ss', $startDate, $endDate);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    while ($row = mysqli_fetch_assoc($result)) {
        // Expense amounts are stored as negative numbers in the DB.
        // abs() makes the total positive for display purposes on the dashboard.
        $row['total'] = abs($row['total']);
        $totals[] = $row;
    }
    return $totals;
}

// --- Date Period Calculations ---

// Get the first and last day of the current month (e.g., '2025-06-01' and '2025-06-30').
$currentMonthStart = date('Y-m-01');
$currentMonthEnd = date('Y-m-t');

// Get the first and last day of the previous month.
$previousMonthStart = date('Y-m-01', strtotime('first day of last month'));
$previousMonthEnd = date('Y-m-t', strtotime('last day of last month'));

// Get the start and end of the current year.
$yearStart = date('Y-01-01');
$yearEnd = date('Y-12-31');

// --- Data Aggregation ---
// This builds the final JSON object to be sent to the frontend.
$dashboardData = [
    'currentMonth' => getCategoryTotals($cnx, $currentMonthStart, $currentMonthEnd),
    'previousMonth' => getCategoryTotals($cnx, $previousMonthStart, $previousMonthEnd),
    'yearToDate' => getCategoryTotals($cnx, $yearStart, $yearEnd)
];

// Send the aggregated dashboard data as a JSON response.
echo json_encode($dashboardData);
mysqli_close($cnx);
?>