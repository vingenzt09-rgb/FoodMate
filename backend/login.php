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

$email = strtolower(trim($data["email"] ?? ""));
$password = $data["password"] ?? "";

if ($email === "" || $password === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please enter email and password."
    ]);
    exit;
}

try {

    $stmt = $conn->prepare(
        "SELECT id, name, email, password_hash
         FROM users
         WHERE email = ?
         LIMIT 1"
    );

    $stmt->bind_param("s", $email);
    $stmt->execute();

    $stmt->bind_result(
        $userId,
        $userName,
        $userEmail,
        $passwordHash
    );

    if ($stmt->fetch()) {

        if (password_verify($password, $passwordHash)) {

            http_response_code(200);

            echo json_encode([
                "success" => true,
                "message" => "Login successful.",
                "user" => [
                    "id" => $userId,
                    "name" => $userName,
                    "email" => $userEmail
                ]
            ]);

        } else {

            http_response_code(401);

            echo json_encode([
                "success" => false,
                "message" => "Invalid email or password."
            ]);
        }

    } else {

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "Invalid email or password."
        ]);
    }

    $stmt->close();

} catch (mysqli_sql_exception $e) {

    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Something went wrong. Please try again."
    ]);
}

?>