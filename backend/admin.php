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
        $action = $_GET["action"] ?? "";

        if ($action === "stats") {
            $usersCount = $conn->query("SELECT COUNT(*) as count FROM users")->fetch_assoc()["count"];
            $recipesCount = $conn->query("SELECT COUNT(*) as count FROM recipes")->fetch_assoc()["count"];
            $postsCount = $conn->query("SELECT COUNT(*) as count FROM posts")->fetch_assoc()["count"];

            echo json_encode([
                "success" => true,
                "stats" => [
                    "users" => (int)$usersCount,
                    "recipes" => (int)$recipesCount,
                    "posts" => (int)$postsCount
                ]
            ]);
            exit;
        }

        if ($action === "users") {
            $result = $conn->query("SELECT id, name, email, role, created_at FROM users ORDER BY id ASC");
            $users = [];
            while ($row = $result->fetch_assoc()) {
                $users[] = $row;
            }
            echo json_encode(["success" => true, "users" => $users]);
            exit;
        }

        if ($action === "posts") {
            $result = $conn->query("
                SELECT p.id, p.caption, p.image_url, p.created_at, u.name AS author_name 
                FROM posts p 
                JOIN users u ON p.user_id = u.id 
                ORDER BY p.id DESC
            ");
            $posts = [];
            while ($row = $result->fetch_assoc()) {
                $posts[] = $row;
            }
            echo json_encode(["success" => true, "posts" => $posts]);
            exit;
        }
    }

    if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
        $action = $_GET["action"] ?? "";
        $id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid ID."]);
            exit;
        }

        if ($action === "delete_post") {
            $stmt = $conn->prepare("DELETE FROM posts WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true, "message" => "Post deleted."]);
            exit;
        }

        if ($action === "delete_user") {
            $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true, "message" => "User deleted."]);
            exit;
        }
    }

} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Something went wrong."]);
}
?>