<?php require __DIR__ . '/config.php';
echo json_encode([
    'session_id' => session_id(),
    'user' => $_SESSION['user'] ?? null,
]);