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
        $action = $_GET["action"] ?? "posts";

        if ($action === "posts") {
            $userId = isset($_GET["user_id"]) ? (int)$_GET["user_id"] : 0;
            
            $sql = "
                SELECT p.id, p.caption, p.image_url, p.created_at, u.name AS author_name,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes_count,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
                FROM posts p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.id DESC
            ";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();

            $posts = [];
            while ($row = $result->fetch_assoc()) {
                $posts[] = [
                    "id" => (int)$row["id"],
                    "caption" => $row["caption"],
                    "image_url" => $row["image_url"],
                    "created_at" => $row["created_at"],
                    "author_name" => $row["author_name"],
                    "likes_count" => (int)$row["likes_count"],
                    "is_liked" => (bool)$row["is_liked"],
                    "comments_count" => (int)$row["comments_count"]
                ];
            }
            $stmt->close();

            echo json_encode(["success" => true, "posts" => $posts]);
            exit;
        }

        if ($action === "comments") {
            $postId = isset($_GET["post_id"]) ? (int)$_GET["post_id"] : 0;
            if ($postId <= 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "post_id required."]);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT c.id, c.body, c.created_at, u.name AS author_name
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = ?
                ORDER BY c.id ASC
            ");
            $stmt->bind_param("i", $postId);
            $stmt->execute();
            $result = $stmt->get_result();

            $comments = [];
            while ($row = $result->fetch_assoc()) {
                $comments[] = [
                    "id" => (int)$row["id"],
                    "body" => $row["body"],
                    "created_at" => $row["created_at"],
                    "author_name" => $row["author_name"]
                ];
            }
            $stmt->close();

            echo json_encode(["success" => true, "comments" => $comments]);
            exit;
        }
    }

    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data["action"] ?? "";

        if ($action === "create_post") {
            $userId = (int)($data["user_id"] ?? 0);
            $caption = trim($data["caption"] ?? "");
            $imageUrl = trim($data["image_url"] ?? "");

            if ($userId <= 0 || $caption === "") {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "User ID and caption required."]);
                exit;
            }

            $stmt = $conn->prepare("INSERT INTO posts (user_id, caption, image_url) VALUES (?, ?, ?)");
            $stmt->bind_param("iss", $userId, $caption, $imageUrl);
            $stmt->execute();
            $stmt->close();

            echo json_encode(["success" => true, "message" => "Post created."]);
            exit;
        }

        if ($action === "toggle_like") {
            $userId = (int)($data["user_id"] ?? 0);
            $postId = (int)($data["post_id"] ?? 0);

            if ($userId <= 0 || $postId <= 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Invalid data."]);
                exit;
            }

            $checkStmt = $conn->prepare("SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?");
            $checkStmt->bind_param("ii", $userId, $postId);
            $checkStmt->execute();
            $checkRes = $checkStmt->get_result();
            
            if ($checkRes->num_rows > 0) {
                $deleteStmt = $conn->prepare("DELETE FROM post_likes WHERE user_id = ? AND post_id = ?");
                $deleteStmt->bind_param("ii", $userId, $postId);
                $deleteStmt->execute();
                $deleteStmt->close();
                $isLiked = false;
            } else {
                $insertStmt = $conn->prepare("INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)");
                $insertStmt->bind_param("ii", $userId, $postId);
                $insertStmt->execute();
                $insertStmt->close();
                $isLiked = true;
            }
            $checkStmt->close();

            echo json_encode(["success" => true, "is_liked" => $isLiked]);
            exit;
        }

        if ($action === "add_comment") {
            $userId = (int)($data["user_id"] ?? 0);
            $postId = (int)($data["post_id"] ?? 0);
            $body = trim($data["body"] ?? "");

            if ($userId <= 0 || $postId <= 0 || $body === "") {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Invalid data."]);
                exit;
            }

            $stmt = $conn->prepare("INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)");
            $stmt->bind_param("iis", $postId, $userId, $body);
            $stmt->execute();
            $stmt->close();

            echo json_encode(["success" => true, "message" => "Comment added."]);
            exit;
        }
    }

} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Something went wrong."]);
}
?>