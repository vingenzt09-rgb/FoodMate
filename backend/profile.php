<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require_once __DIR__ . "/db.php";

try {
    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        $userId = isset($_GET["user_id"]) ? (int)$_GET["user_id"] : 0;

        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "user_id required."]);
            exit;
        }

        $stmt = $conn->prepare("SELECT id, name, email, profile_image, role FROM users WHERE id = ? LIMIT 1");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            echo json_encode([
                "success" => true,
                "user" => [
                    "id" => (int)$row["id"],
                    "name" => $row["name"],
                    "email" => $row["email"],
                    "profile_image" => $row["profile_image"],
                    "role" => $row["role"]
                ]
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "User not found."]);
        }
        $stmt->close();
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $userId = (int)($data["user_id"] ?? 0);
        $name = trim($data["name"] ?? "");
        $profileImage = trim($data["profile_image"] ?? "");

        if ($userId <= 0 || $name === "") {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data."]);
            exit;
        }

        $stmt = $conn->prepare("UPDATE users SET name = ?, profile_image = ? WHERE id = ?");
        $stmt->bind_param("ssi", $name, $profileImage, $userId);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "message" => "Profile updated."]);
        exit;
    }

} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Something went wrong."]);
}
?>