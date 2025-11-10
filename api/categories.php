<?php
  // Include the database connection.
  require 'conectare.php';

  // --- READ ---
  // Handles GET requests to fetch all categories.
  function executaGET($cnx) {
      $raspuns = [];
      // Selects all categories, ordered by type (e.g., 'Income', 'Expense') and then by name.
      $cda = "SELECT * FROM categories ORDER BY type, name";
      if ($rez = mysqli_query($cnx, $cda)) {
          while ($linie = mysqli_fetch_assoc($rez)) {
              $raspuns[] = $linie;
          }
          mysqli_free_result($rez);
      }
      echo json_encode($raspuns);
  }

  // --- CREATE ---
  // Handles POST requests to add a new category.
  function executaPOST($cnx) {
      $data = json_decode(file_get_contents('php://input'), true);
      $name = $data['name'];
      $type = $data['type'];
      $description = $data['description'];
      $color = $data['color'];

      // When a user creates a category, 'is_predefined' is hardcoded to 0 (false).
      $stmt = mysqli_prepare($cnx, "INSERT INTO categories(name, type, description, color, is_predefined) VALUES (?, ?, ?, ?, 0)");
      // 'ssss' for four string parameters.
      mysqli_stmt_bind_param($stmt, 'ssss', $name, $type, $description, $color);

      if (mysqli_stmt_execute($stmt)) {
          echo json_encode(['rezultat' => "OK", 'id' => mysqli_stmt_insert_id($stmt)]);
      } else {
          echo json_encode(['rezultat' => 'Eroare: ' . mysqli_error($cnx)]);
      }
  }

  // --- UPDATE ---
  // Handles PATCH requests to update a category.
  function executaPATCH($cnx) {
      $data = json_decode(file_get_contents('php://input'), true);
      $id = $data['id'];
      $name = $data['name'];
      $type = $data['type'];
      $description = $data['description'];
      $color = $data['color'];

      // NOTE: The original restriction "AND is_predefined = 0" was removed.
      // This now allows ANY category to be edited, including ones that were predefined in the system.
      $stmt = mysqli_prepare($cnx, "UPDATE categories SET name = ?, type = ?, description = ?, color = ? WHERE id = ?");
      mysqli_stmt_bind_param($stmt, 'ssssi', $name, $type, $description, $color, $id);

      if (mysqli_stmt_execute($stmt)) {
          echo json_encode(['rezultat' => "OK"]);
      } else {
          echo json_encode(['rezultat' => 'Eroare: ' . mysqli_error($cnx)]);
      }
  }
  
  // --- DELETE ---
  // Handles DELETE requests to remove a category.
  function executaDELETE($cnx) {
      $data = json_decode(file_get_contents('php://input'), true);
      $id = $data['id'];

      // NOTE: The original restriction "AND is_predefined = 0" was removed.
      // This now allows ANY category to be deleted.
      // WARNING: Deleting a category that is in use by transactions could cause issues (foreign key constraints).
      $stmt = mysqli_prepare($cnx, "DELETE FROM categories WHERE id = ?");
      mysqli_stmt_bind_param($stmt, 'i', $id);

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