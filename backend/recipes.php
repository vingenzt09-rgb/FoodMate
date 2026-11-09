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
    // === POST: Add a new recipe ===
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);

        $title = trim($data["title"] ?? "");
        $description = trim($data["description"] ?? "");
        $category = trim($data["category"] ?? "");
        $image_url = trim($data["image_url"] ?? "");
        $prep = (int) ($data["prep_time_minutes"] ?? 0);
        $cook = (int) ($data["cook_time_minutes"] ?? 0);
        $servings = (int) ($data["servings"] ?? 1);
        $ingredients = trim($data["ingredients"] ?? "");
        $instructions = trim($data["instructions"] ?? "");

        if ($title === "" || $category === "" || $ingredients === "" || $instructions === "") {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Title, category, ingredients, and instructions are required."
            ]);
            exit;
        }

        $stmt = $conn->prepare(
            "INSERT INTO recipes (title, description, category, image_url, prep_time_minutes, cook_time_minutes, servings, ingredients, instructions, is_featured)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)"
        );
        
        $stmt->bind_param("ssssiiiss", $title, $description, $category, $image_url, $prep, $cook, $servings, $ingredients, $instructions);
        $stmt->execute();
        $newId = $conn->insert_id;
        $stmt->close();

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Recipe created successfully.",
            "id" => $newId
        ]);
        exit;
    }

    // === GET: List or fetch a single recipe ===
    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        if (isset($_GET["id"]) && $_GET["id"] !== "") {
            $id = (int) $_GET["id"];

            $stmt = $conn->prepare(
                "SELECT id, title, description, category, image_url,
                        prep_time_minutes, cook_time_minutes, servings, is_featured,
                        ingredients, instructions
                 FROM recipes WHERE id = ? LIMIT 1"
            );
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
                        "instructions" => $row["instructions"]
                    ]
                ]);
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Recipe not found."]);
            }
            $stmt->close();
            exit;
        }

        $result = $conn->query(
            "SELECT id, title, description, category, image_url,
                    prep_time_minutes, cook_time_minutes, servings, is_featured,
                    ingredients, instructions
             FROM recipes ORDER BY id DESC"
        );

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
                "instructions" => $row["instructions"]
            ];
        }

        http_response_code(200);
        echo json_encode(["success" => true, "count" => count($recipes), "recipes" => $recipes]);
        exit;
    }

    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);

} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Something went wrong."]);
}
?>