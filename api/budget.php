<?php
// Include the database connection script.
require 'conectare.php';

// Helper function to read the JSON request body.
function citeste() {
    return json_decode(file_get_contents('php://input'), true);
}

// --- READ ---
// Handles GET requests to fetch all budget rules.
function executaGET($cnx) {
    $raspuns = [];
    $cda = "SELECT * FROM budget_rules ORDER BY start_date DESC";
    if ($rez = mysqli_query($cnx, $cda)) {
        while ($linie = mysqli_fetch_assoc($rez)) {
            // Convert ratios from the database (e.g., 0.5) back to percentages (e.g., 50)
            // for easier handling on the frontend.
            $linie['needs_ratio'] = $linie['needs_ratio'] * 100;
            $linie['wants_ratio'] = $linie['wants_ratio'] * 100;
            $linie['savings_ratio'] = $linie['savings_ratio'] * 100;
            $raspuns[] = $linie;
        }
        mysqli_free_result($rez);
    }
    echo json_encode($raspuns);
}

// --- CREATE ---
// Handles POST requests to add a new budget rule.
function executaPOST($cnx) {
    $data = citeste();
    // Handle optional end_date. If it's empty, set it to NULL for the database.
    $endDate = !empty($data['end_date']) ? $data['end_date'] : null;
    
    $stmt = mysqli_prepare($cnx, "INSERT INTO budget_rules(name, start_date, end_date, needs_ratio, wants_ratio, savings_ratio) VALUES (?, ?, ?, ?, ?, ?)");
    
    // Convert percentages from the frontend (e.g., 50) to decimal values (e.g., 0.5) for the database.
    $needs = $data['needs_ratio'] / 100;
    $wants = $data['wants_ratio'] / 100;
    $savings = $data['savings_ratio'] / 100;
    
    // Bind parameters: 'sss' for strings (name, dates), 'ddd' for doubles (ratios).
    mysqli_stmt_bind_param($stmt, 'sssddd', $data['name'], $data['start_date'], $endDate, $needs, $wants, $savings);
    
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['rezultat' => "OK", 'id' => mysqli_stmt_insert_id($stmt)]);
    } else {
        echo json_encode(['rezultat' => 'Eroare: ' . mysqli_error($cnx)]);
    }
}

// --- UPDATE ---
// Handles PATCH requests to update a budget rule.
function executaPATCH($cnx) {
    $data = citeste();
    $endDate = !empty($data['end_date']) ? $data['end_date'] : null;

    $stmt = mysqli_prepare($cnx, "UPDATE budget_rules SET name=?, start_date=?, end_date=?, needs_ratio=?, wants_ratio=?, savings_ratio=? WHERE id=?");
    
    // Also convert percentages to decimals on update.
    $needs = $data['needs_ratio'] / 100;
    $wants = $data['wants_ratio'] / 100;
    $savings = $data['savings_ratio'] / 100;

    // Bind parameters: 'sssdddi' includes an integer 'i' for the WHERE id clause.
    mysqli_stmt_bind_param($stmt, 'sssdddi', $data['name'], $data['start_date'], $endDate, $needs, $wants, $savings, $data['id']);

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['rezultat' => "OK"]);
    } else {
        echo json_encode(['rezultat' => 'Eroare: ' . mysqli_error($cnx)]);
    }
}

// --- DELETE ---
// Handles DELETE requests to remove a budget rule.
function executaDELETE($cnx) {
    $data = citeste();
    $stmt = mysqli_prepare($cnx, "DELETE FROM budget_rules WHERE id = ?");
    mysqli_stmt_bind_param($stmt, 'i', $data['id']);
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['rezultat' => "OK"]);
    } else {
        echo json_encode(['rezultat' => 'Eroare: ' . mysqli_error($cnx)]);
    }
}

// Main request router.
$metoda = $_SERVER['REQUEST_METHOD'];
switch ($metoda) {
    case 'GET': executaGET($cnx); break;
    case 'POST': executaPOST($cnx); break;
    case 'PATCH': executaPATCH($cnx); break;
    case 'DELETE': executaDELETE($cnx); break;
}
mysqli_close($cnx);
?>