<?php
  // --- CORS HEADERS ---
  // These headers are crucial for security and allow a web browser to make requests
  // from a different origin (domain, protocol, or port) than the server's.

  // Allows requests from your React app's origin. Without this, the browser would block the request.
  header("Access-Control-Allow-Origin: http://localhost:3000");
  
  // Specifies which HTTP methods are allowed in requests from the frontend.
  header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
  
  // Specifies which custom headers can be included in requests.
  header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
  
  // The browser sends a "preflight" OPTIONS request before POST, PATCH, or DELETE
  // to check if the actual request is safe to send. This block handles that preflight
  // request by sending an empty success response, allowing the real request to proceed.
  if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
  }

  // --- DATABASE CONNECTION ---
  $server = "localhost"; // Database server address
  $user = "root";        // Default XAMPP username
  $parola = "";          // Default XAMPP password is empty
  $db = "financial_tracker"; // The name of the database

  // Establish the connection to the MySQL database.
  $cnx = mysqli_connect($server, $user, $parola, $db);

  // Check if the connection was successful.
  if (mysqli_connect_errno()) {
      // If the connection fails, stop the script and display an error message.
      die("Conectare la MySQL nereusita: " . mysqli_connect_error());
  };

  // --- GLOBAL SETTINGS ---
  // Set the character set to UTF-8 to ensure proper handling of special characters.
  mysqli_set_charset($cnx, "utf8");
  
  // Set the global Content-Type header for all responses from any script that includes this file.
  // This tells the client to expect a JSON response, encoded in UTF-8.
  header("Content-Type: application/json; charset=UTF-8");
?>