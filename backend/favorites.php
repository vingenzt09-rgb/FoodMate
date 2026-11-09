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

    // === GET: List favorites for a user ===
    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        $userId = isset($_GET["user_id"]) ? (int) $_GET["user_id"] : 0;

        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "user_id is required."
            ]);
            exit;
        }

        $stmt = $conn->prepare(
            "SELECT recipe_id FROM favorites WHERE user_id = ?"
        );
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $recipeIds = [];
        while ($row = $result->fetch_assoc()) {
            $recipeIds[] = (int) $row["recipe_id"];
        }
        $stmt->close();

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "count" => count($recipeIds),
            "recipe_ids" => $recipeIds
        ]);
        exit;
    }

    // === POST: Add or remove a favorite ===
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);

        $userId = (int) ($data["user_id"] ?? 0);
        $recipeId = (int) ($data["recipe_id"] ?? 0);
        $action = $data["action"] ?? "";

        if ($userId <= 0 || $recipeId <= 0 || !in_array($action, ["add", "remove"])) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "user_id, recipe_id and action (add/remove) are required."
            ]);
            exit;
        }

        if ($action === "add") {
            $stmt = $conn->prepare(
                "INSERT IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)"
            );
            $stmt->bind_param("ii", $userId, $recipeId);
            $stmt->execute();
            $stmt->close();

            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Added to favorites.",
                "is_favorite" => true
            ]);
            exit;
        }

        if ($action === "remove") {
            $stmt = $conn->prepare(
                "DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?"
            );
            $stmt->bind_param("ii", $userId, $recipeId);
            $stmt->execute();
            $stmt->close();

            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Removed from favorites.",
                "is_favorite" => false
            ]);
            exit;
        }
    }

    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Something went wrong."
    ]);
}

?>