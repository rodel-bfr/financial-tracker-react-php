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

// --- DOTENV & COMPOSER AUTOLOAD ---
  // This line includes the Composer autoloader, which makes the Dotenv library available.
  require_once __DIR__ . '/vendor/autoload.php';
  
  // This tells Dotenv to look for the .env file in the current directory (your '/api' folder)
  $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
  $dotenv->load();

  // --- DATABASE CONNECTION ---
  // We read from the $_ENV superglobal
  $server = $_ENV['DB_HOST'];        
  $user = $_ENV['DB_USER'];        
  $parola = $_ENV['DB_PASS'];      
  $db = $_ENV['DB_NAME'];

  // Establish the connection to the MySQL database.
  $cnx = mysqli_connect($server, $user, $parola, $db);

// Check if the connection was successful
  if (mysqli_connect_errno()) {
      // Log the real error for your records (good practice)
      error_log("MySQL connection failed: " . mysqli_connect_error());
      // Show a generic error to the user
      die("A database connection error occurred. Please try again later.");
  };

  // --- GLOBAL SETTINGS ---
  // Set the character set to UTF-8 to ensure proper handling of special characters.
  mysqli_set_charset($cnx, "utf8");
  
  // Set the global Content-Type header for all responses from any script that includes this file.
  // This tells the client to expect a JSON response, encoded in UTF-8.
  header("Content-Type: application/json; charset=UTF-8");
?>