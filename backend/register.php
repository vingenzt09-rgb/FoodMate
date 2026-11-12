<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require_once __DIR__ . "/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data["name"] ?? "");
$email = strtolower(trim($data["email"] ?? ""));
$password = $data["password"] ?? "";

if ($name === "" || $email === "" || $password === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please fill in all fields."
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid email address."
    ]);
    exit;
}

if (
    strlen($password) < 8 || 
    !preg_match('/[A-Z]/', $password) || 
    !preg_match('/[a-z]/', $password) || 
    !preg_match('/[0-9]/', $password) ||
    !preg_match('/[^A-Za-z0-9]/', $password)
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
    ]);
    exit;
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $conn->prepare(
        "INSERT INTO users (name, email, password_hash)
         VALUES (?, ?, ?)"
    );

    $stmt->bind_param("sss", $name, $email, $passwordHash);
    $stmt->execute();

    http_response_code(201);

    echo json_encode([
        "success" => true,
        "message" => "Account created successfully.",
        "user_id" => $conn->insert_id,
        "name" => $name
    ]);

} catch (mysqli_sql_exception $e) {

    if ($e->getCode() === 1062) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This email is already registered."
        ]);
    } else {
        error_log($e->getMessage());
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Something went wrong. Please try again."
        ]);
    }
}
?>