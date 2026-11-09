<?php

$host = "localhost";
$username = "root";
$password = "";
$database = "foodmate_db";
$port = 3306;

// Connect to MySQL
$conn = new mysqli(
    $host,
    $username,
    $password,
    $database,
    $port
);

// Check connection
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// Set character encoding
$conn->set_charset("utf8mb4");

?>