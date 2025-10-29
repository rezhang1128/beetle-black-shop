<?php require __DIR__ . '/config.php';
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$code = strtoupper(trim($body['code'] ?? ''));
$product_id = isset($body['product_id']) ? (int) $body['product_id'] : null;


$st = $pdo->prepare('SELECT * FROM promo_codes WHERE code=? LIMIT 1');
$st->execute([$code]);
$promo = $st->fetch(PDO::FETCH_ASSOC);
if (!$promo) {
    echo json_encode(['valid' => false, 'reason' => 'not_found']);
    exit;
}


$now = new DateTime();
if (!empty($promo['starts_at']) && $now < new DateTime($promo['starts_at'])) {
    echo json_encode(['valid' => false, 'reason' => 'not_started']);
    exit;
}
if (!empty($promo['ends_at']) && $now > new DateTime($promo['ends_at'])) {
    echo json_encode(['valid' => false, 'reason' => 'expired']);
    exit;
}
if (!empty($promo['product_id']) && $product_id && (int) $promo['product_id'] !== $product_id) {
    echo json_encode(['valid' => false, 'reason' => 'wrong_product']);
    exit;
}


echo json_encode([
    'valid' => true,
    'percent_off' => $promo['percent_off'] ? (int) $promo['percent_off'] : null,
    'amount_off_cents' => $promo['amount_off_cents'] ? (int) $promo['amount_off_cents'] : null,
]);