<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, PUT, OPTIONS");
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

        $listStmt = $conn->prepare("SELECT id FROM grocery_lists WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $listStmt->bind_param("i", $userId);
        $listStmt->execute();
        $listRes = $listStmt->get_result();
        $listId = 0;

        if ($row = $listRes->fetch_assoc()) {
            $listId = (int)$row["id"];
        } else {
            $createStmt = $conn->prepare("INSERT INTO grocery_lists (user_id, name) VALUES (?, 'My Grocery List')");
            $createStmt->bind_param("i", $userId);
            $createStmt->execute();
            $listId = $conn->insert_id;
            $createStmt->close();
        }
        $listStmt->close();

        $itemsStmt = $conn->prepare("SELECT id, item_name, is_purchased FROM grocery_list_items WHERE grocery_list_id = ? ORDER BY id ASC");
        $itemsStmt->bind_param("i", $listId);
        $itemsStmt->execute();
        $itemsRes = $itemsStmt->get_result();

        $items = [];
        while ($row = $itemsRes->fetch_assoc()) {
            $items[] = [
                "id" => (int)$row["id"],
                "item_name" => $row["item_name"],
                "is_purchased" => (bool)$row["is_purchased"]
            ];
        }
        $itemsStmt->close();

        echo json_encode(["success" => true, "list_id" => $listId, "items" => $items]);
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);
        $userId = (int)($data["user_id"] ?? 0);
        $itemName = trim($data["item_name"] ?? "");

        if ($userId <= 0 || $itemName === "") {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid data."]);
            exit;
        }

        $listStmt = $conn->prepare("SELECT id FROM grocery_lists WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $listStmt->bind_param("i", $userId);
        $listStmt->execute();
        $listRes = $listStmt->get_result();
        $listId = 0;
        
        if ($row = $listRes->fetch_assoc()) {
            $listId = (int)$row["id"];
        }
        $listStmt->close();

        if ($listId <= 0) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "List not found."]);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO grocery_list_items (grocery_list_id, item_name) VALUES (?, ?)");
        $stmt->bind_param("is", $listId, $itemName);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "message" => "Item added."]);
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "DELETE") {
        if (isset($_GET["clear_all"]) && $_GET["clear_all"] === "true") {
            $userId = isset($_GET["user_id"]) ? (int)$_GET["user_id"] : 0;
            if ($userId <= 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "user_id required."]);
                exit;
            }

            $stmt = $conn->prepare("DELETE FROM grocery_list_items WHERE grocery_list_id IN (SELECT id FROM grocery_lists WHERE user_id = ?)");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $stmt->close();

            echo json_encode(["success" => true, "message" => "List cleared."]);
            exit;
        }

        $itemId = isset($_GET["id"]) ? (int)$_GET["id"] : 0;
        if ($itemId <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid id."]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM grocery_list_items WHERE id = ?");
        $stmt->bind_param("i", $itemId);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "message" => "Item deleted."]);
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "PUT") {
        $data = json_decode(file_get_contents("php://input"), true);
        $itemId = (int)($data["id"] ?? 0);
        $isPurchased = (int)($data["is_purchased"] ?? 0);

        if ($itemId <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid id."]);
            exit;
        }

        $stmt = $conn->prepare("UPDATE grocery_list_items SET is_purchased = ? WHERE id = ?");
        $stmt->bind_param("ii", $isPurchased, $itemId);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "message" => "Item updated."]);
        exit;
    }

} catch (mysqli_sql_exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Something went wrong."]);
}
?>