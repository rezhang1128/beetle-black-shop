<?php require __DIR__ . '/config.php';
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $body['action'] ?? '';


if ($action === 'login') {
    $email = $body['email'] ?? '';
    $password = $body['password'] ?? '';
    $st = $pdo->prepare('SELECT * FROM users WHERE email=? AND password=? LIMIT 1');
    $st->execute([$email, $password]);
    $user = $st->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        $_SESSION['user'] = $user;
        echo json_encode(['success' => true, 'user' => ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role']]]);
    } else {
        echo json_encode(['success' => false]);
    }
    exit;
}


if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}


if ($action === 'me') {
    echo json_encode(['user' => $_SESSION['user'] ?? null]);
    exit;
}


echo json_encode(['error'=>'unknown_action']);