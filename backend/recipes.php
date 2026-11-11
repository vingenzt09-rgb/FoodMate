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

        $title = trim($data["title"] ?? "");
        $description = trim($data["description"] ?? "");
        $category = trim($data["category"] ?? "");
        $image_url = trim($data["image_url"] ?? "");
        $prep = (int) ($data["prep_time_minutes"] ?? 0);
        $cook = (int) ($data["cook_time_minutes"] ?? 0);
        $servings = (int) ($data["servings"] ?? 1);
        $ingredientsText = trim($data["ingredients"] ?? "");
        $instructions = trim($data["instructions"] ?? "");
        $calories = (int) ($data["calories"] ?? 0);
        $protein = (float) ($data["protein"] ?? 0.0);
        $carbs = (float) ($data["carbs"] ?? 0.0);
        $fat = (float) ($data["fat"] ?? 0.0);

        if ($title === "" || $category === "" || $ingredientsText === "" || $instructions === "") {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Required fields missing."]);
            exit;
        }

        $stmt = $conn->prepare(
            "INSERT INTO recipes (title, description, category, image_url, prep_time_minutes, cook_time_minutes, servings, ingredients, instructions, is_featured, calories, protein, carbs, fat)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)"
        );
        
        $stmt->bind_param("ssssiiissd ddd", $title, $description, $category, $image_url, $prep, $cook, $servings, $ingredientsText, $instructions, $calories, $protein, $carbs, $fat);
        $stmt->execute();
        $newId = $conn->insert_id;
        $stmt->close();

        $ingredientLines = explode("\n", $ingredientsText);
        foreach ($ingredientLines as $line) {
            $line = trim($line);
            if (!empty($line)) {
                $ingStmt = $conn->prepare("INSERT IGNORE INTO ingredients (name) VALUES (?)");
                $ingStmt->bind_param("s", $line);
                $ingStmt->execute();
                $ingStmt->close();
                
                $getIng = $conn->prepare("SELECT id FROM ingredients WHERE name = ?");
                $getIng->bind_param("s", $line);
                $getIng->execute();
                $res = $getIng->get_result();
                if ($row = $res->fetch_assoc()) {
                    $ingId = (int)$row['id'];
                    $linkStmt = $conn->prepare("INSERT IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, '', '')");
                    $linkStmt->bind_param("ii", $newId, $ingId);
                    $linkStmt->execute();
                    $linkStmt->close();
                }
                $getIng->close();
            }
        }

        http_response_code(201);
        echo json_encode(["success" => true, "message" => "Recipe created.", "id" => $newId]);
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        if (isset($_GET["id"]) && $_GET["id"] !== "") {
            $id = (int) $_GET["id"];
            $stmt = $conn->prepare("SELECT * FROM recipes WHERE id = ? LIMIT 1");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($row = $result->fetch_assoc()) {
                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "recipe" => [
                        "id" => (int) $row["id"],
                        "title" => $row["title"],
                        "description" => $row["description"],
                        "category" => $row["category"],
                        "image_url" => $row["image_url"],
                        "prep_time_minutes" => (int) $row["prep_time_minutes"],
                        "cook_time_minutes" => (int) $row["cook_time_minutes"],
                        "servings" => (int) $row["servings"],
                        "is_featured" => (bool) $row["is_featured"],
                        "ingredients" => $row["ingredients"],
                        "instructions" => $row["instructions"],
                        "calories" => (int) $row["calories"],
                        "protein" => (float) $row["protein"],
                        "carbs" => (float) $row["carbs"],
                        "fat" => (float) $row["fat"]
                    ]
                ]);
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Recipe not found."]);
            }
            $stmt->close();
            exit;
        }

        $result = $conn->query("SELECT * FROM recipes ORDER BY id DESC");
        $recipes = [];
        while ($row = $result->fetch_assoc()) {
            $recipes[] = [
                "id" => (int) $row["id"],
                "title" => $row["title"],
                "description" => $row["description"],
                "category" => $row["category"],
                "image_url" => $row["image_url"],
                "prep_time_minutes" => (int) $row["prep_time_minutes"],
                "cook_time_minutes" => (int) $row["cook_time_minutes"],
                "servings" => (int) $row["servings"],
                "is_featured" => (bool) $row["is_featured"],
                "ingredients" => $row["ingredients"],
                "instructions" => $row["instructions"],
                "calories" => (int) $row["calories"],
                "protein" => (float) $row["protein"],
                "carbs" => (float) $row["carbs"],
                "fat" => (float) $row["fat"]
            ];
        }

        http_response_code(200);
        echo json_encode(["success" => true, "count" => count($recipes), "recipes" => $recipes]);
        exit;
    }
} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>