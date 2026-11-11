<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

try {
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        if (isset($_FILES['image'])) {
            $file = $_FILES['image'];
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $newName = uniqid() . '.' . $ext;
            $uploadDir = 'uploads/';

            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            if (move_uploaded_file($file['tmp_name'], $uploadDir . $newName)) {
                $host = $_SERVER['HTTP_HOST'];
                $protocol = isset($_SERVER['HTTPS']) ? 'https://' : 'http://';
                $url = $protocol . $host . '/foodmate-api/uploads/' . $newName;

                echo json_encode(["success" => true, "url" => $url]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "File upload failed."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "No image provided."]);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>