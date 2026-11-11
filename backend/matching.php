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

try {
    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        $userId = isset($_GET["user_id"]) ? (int)$_GET["user_id"] : 0;
        
        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "user_id is required."]);
            exit;
        }

        $sql = "
            SELECT 
                r.id, 
                r.title, 
                r.category, 
                r.image_url,
                COUNT(ri.ingredient_id) AS total_ingredients,
                SUM(CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END) AS matched_ingredients
            FROM recipes r
            JOIN recipe_ingredients ri ON r.id = ri.recipe_id
            LEFT JOIN pantry_items p ON ri.ingredient_id = p.ingredient_id AND p.user_id = ?
            GROUP BY r.id, r.title, r.category, r.image_url
            HAVING SUM(CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END) > 0
            ORDER BY (SUM(CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END) / COUNT(ri.ingredient_id)) DESC, r.id ASC
        ";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("SQL Prepare Error: " . $conn->error);
        }
        
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $matches = [];
        while ($row = $result->fetch_assoc()) {
            $total = (int)$row["total_ingredients"];
            $matched = (int)$row["matched_ingredients"];
            $percentage = $total > 0 ? round(($matched / $total) * 100) : 0;

            $matches[] = [
                "id" => (int)$row["id"],
                "title" => $row["title"],
                "category" => $row["category"],
                "image_url" => $row["image_url"],
                "total_ingredients" => $total,
                "matched_ingredients" => $matched,
                "match_percentage" => $percentage
            ];
        }

        $stmt->close();

        echo json_encode([
            "success" => true,
            "matches" => $matches
        ]);
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>