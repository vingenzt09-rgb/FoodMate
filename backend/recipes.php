<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require_once __DIR__ . "/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only GET requests are allowed."
    ]);
    exit;
}

try {
    // Single recipe by ID
    if (isset($_GET["id"]) && $_GET["id"] !== "") {
        $id = (int) $_GET["id"];

        $stmt = $conn->prepare(
            "SELECT id, title, description, category, image_url,
                    prep_time_minutes, cook_time_minutes, servings, is_featured,
                    ingredients, instructions
             FROM recipes
             WHERE id = ?
             LIMIT 1"
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
            echo json_encode([
                "success" => false,
                "message" => "Recipe not found."
            ]);
        }

        $stmt->close();
        exit;
    }

    // All recipes
    $result = $conn->query(
        "SELECT id, title, description, category, image_url,
                prep_time_minutes, cook_time_minutes, servings, is_featured,
                ingredients, instructions
         FROM recipes
         ORDER BY id ASC"
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
    echo json_encode([
        "success" => true,
        "count" => count($recipes),
        "recipes" => $recipes
    ]);

} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Something went wrong. Please try again."
    ]);
}

?>