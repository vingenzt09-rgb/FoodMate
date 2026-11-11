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
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $userId = (int)($data["user_id"] ?? 0);
        $recipeId = (int)($data["recipe_id"] ?? 0);
        $foodName = trim($data["food_name"] ?? "");
        $servings = (float)($data["servings"] ?? 1.0);
        $calories = (int)($data["calories"] ?? 0);
        $protein = (float)($data["protein"] ?? 0);
        $carbs = (float)($data["carbs"] ?? 0);
        $fat = (float)($data["fat"] ?? 0);
        $logDate = trim($data["log_date"] ?? date("Y-m-d"));

        if ($userId <= 0 || $foodName === "") {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data."]);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO food_logs (user_id, recipe_id, food_name, servings, calories, protein, carbs, fat, log_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iisdiddds", $userId, $recipeId, $foodName, $servings, $calories, $protein, $carbs, $fat, $logDate);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "message" => "Food logged."]);
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        $userId = isset($_GET["user_id"]) ? (int)$_GET["user_id"] : 0;
        $date = isset($_GET["date"]) ? $_GET["date"] : date("Y-m-d");

        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "user_id required."]);
            exit;
        }

        $stmt = $conn->prepare("SELECT id, food_name, servings, calories, protein, carbs, fat FROM food_logs WHERE user_id = ? AND log_date = ? ORDER BY id DESC");
        $stmt->bind_param("is", $userId, $date);
        $stmt->execute();
        $result = $stmt->get_result();

        $logs = [];
        $totalCalories = 0;
        $totalProtein = 0;
        $totalCarbs = 0;
        $totalFat = 0;

        while ($row = $result->fetch_assoc()) {
            $logs[] = [
                "id" => (int)$row["id"],
                "food_name" => $row["food_name"],
                "servings" => (float)$row["servings"],
                "calories" => (int)$row["calories"],
                "protein" => (float)$row["protein"],
                "carbs" => (float)$row["carbs"],
                "fat" => (float)$row["fat"]
            ];
            $totalCalories += (int)$row["calories"];
            $totalProtein += (float)$row["protein"];
            $totalCarbs += (float)$row["carbs"];
            $totalFat += (float)$row["fat"];
        }
        $stmt->close();

        echo json_encode([
            "success" => true,
            "logs" => $logs,
            "totals" => [
                "calories" => $totalCalories,
                "protein" => round($totalProtein, 1),
                "carbs" => round($totalCarbs, 1),
                "fat" => round($totalFat, 1)
            ]
        ]);
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
        $id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid id."]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM food_logs WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "message" => "Log deleted."]);
        exit;
    }

} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Something went wrong."]);
}
?>