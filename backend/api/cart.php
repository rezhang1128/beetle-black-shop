<?php require __DIR__ . '/config.php';
require_login();
$user_id = (int) $_SESSION['user']['id'];


if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $st = $pdo->prepare('SELECT c.id, c.product_id, c.qty, p.name, p.price_cents, p.photo
FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=?');
    $st->execute([$user_id]);
    echo json_encode($st->fetchAll(PDO::FETCH_ASSOC));
    exit;
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $pid = (int) ($body['product_id'] ?? 0);
    $qty = max(1, (int) ($body['qty'] ?? 1));
    $pdo->prepare('INSERT INTO cart_items (user_id, product_id, qty) VALUES (?,?,?)
   ON CONFLICT(user_id, product_id) DO UPDATE SET qty = qty + excluded.qty')->execute([$user_id, $pid, $qty]);
    echo json_encode(['success' => true]);
    exit;
}


if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $pid = (int) ($body['product_id'] ?? 0);
    $qty = (int) ($body['qty'] ?? 1);
    if ($qty <= 0) {
        $pdo->prepare('DELETE FROM cart_items WHERE user_id=? AND product_id=?')->execute([$user_id, $pid]);
    } else {
        $pdo->prepare('UPDATE cart_items SET qty=? WHERE user_id=? AND product_id=?')->execute([$qty, $user_id, $pid]);
    }
    echo json_encode(['success' => true]);
    exit;
}


echo json_encode(['error'=>'unsupported']);