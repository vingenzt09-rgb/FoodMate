<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require_once __DIR__ . "/db.php";

try {
    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        $userId = isset($_GET["user_id"]) ? (int)$_GET["user_id"] : 0;
        
        $result = $conn->query("SELECT id, name FROM ingredients ORDER BY name ASC");
        $ingredients = [];
        while ($row = $result->fetch_assoc()) {
            $ingredients[] = [
                "id" => (int)$row["id"],
                "name" => $row["name"]
            ];
        }

        $pantryIds = [];
        if ($userId > 0) {
            $stmt = $conn->prepare("SELECT ingredient_id FROM pantry_items WHERE user_id = ?");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($row = $res->fetch_assoc()) {
                $pantryIds[] = (int)$row["ingredient_id"];
            }
            $stmt->close();
        }

        echo json_encode([
            "success" => true, 
            "ingredients" => $ingredients,
            "pantry_ids" => $pantryIds
        ]);
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);
        $userId = (int) ($data["user_id"] ?? 0);
        $ingredientId = (int) ($data["ingredient_id"] ?? 0);

        if ($userId <= 0 || $ingredientId <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data."]);
            exit;
        }

        $stmt = $conn->prepare("INSERT IGNORE INTO pantry_items (user_id, ingredient_id) VALUES (?, ?)");
        $stmt->bind_param("ii", $userId, $ingredientId);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "message" => "Added to pantry."]);
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
        $userId = (int) ($_GET["user_id"] ?? 0);
        $ingredientId = (int) ($_GET["ingredient_id"] ?? 0);

        $stmt = $conn->prepare("DELETE FROM pantry_items WHERE user_id = ? AND ingredient_id = ?");
        $stmt->bind_param("ii", $userId, $ingredientId);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "message" => "Removed from pantry."]);
        exit;
    }

} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Something went wrong."]);
}
?>