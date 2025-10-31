<?php require __DIR__ . '/config.php';
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $body['action'] ?? '';


if ($action === 'login') {
    // Authenticate using very simple email/password matching.  Passwords are
    // stored in plain text because this project is a demo
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
    // Destroying the session wipes the stored user and forces the front end to
    // request `/auth.php?action=me` again before considering the user logged in.
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}


if ($action === 'me') {
    // Convenience endpoint used by the SPA to hydrate the current user on page
    // load.  It simply echoes whatever user array is stored in the session.
    echo json_encode(['user' => $_SESSION['user'] ?? null]);
    exit;
}


echo json_encode(['error'=>'unknown_action']);