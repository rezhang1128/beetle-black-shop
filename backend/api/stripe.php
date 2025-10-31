<?php require __DIR__ . '/config.php';
require __DIR__ . '/../vendor/autoload.php';
require_login();


\Stripe\Stripe::setApiKey('sk_test_51SNOxBQlKi5OB6Ovu48gOOVZ3XvaVhgE53wE1oERjOJn3id1vhS6rrdMxjsmkUoYSh5MIG6Ujys44bgEwt16EuvF005sf4EsN0');

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$promo_code = '';
if (isset($body['promo_code'])) {
    $promo_code = strtoupper(trim((string) $body['promo_code']));
}
// Compute total from cart
$user_id = (int) $_SESSION['user']['id'];
$st = $pdo->prepare('SELECT c.product_id, c.qty, p.price_cents FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=?');
$st->execute([$user_id]);
$items = $st->fetchAll(PDO::FETCH_ASSOC);
$total = 0;
foreach ($items as $i) {
    $total += ((int) $i['price_cents']) * ((int) $i['qty']);
}

if ($total <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Cart is empty']);
    exit;
}
$discount = 0;

if ($promo_code !== '') {
    $promo_stmt = $pdo->prepare('SELECT * FROM promo_codes WHERE code=? LIMIT 1');
    $promo_stmt->execute([$promo_code]);
    $promo = $promo_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$promo) {
        http_response_code(400);
        echo json_encode(['error' => 'Promo code is invalid.', 'reason' => 'promo_invalid']);
        exit;
    }

    $now = new DateTime();
    if (!empty($promo['starts_at']) && $now < new DateTime($promo['starts_at'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Promo code is invalid.', 'reason' => 'promo_invalid']);
        exit;
    }
    if (!empty($promo['ends_at']) && $now > new DateTime($promo['ends_at'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Promo code is invalid.', 'reason' => 'promo_invalid']);
        exit;
    }

    $promo_product_id = !empty($promo['product_id']) ? (int) $promo['product_id'] : null;
    $eligible_items = $items;
    if ($promo_product_id !== null) {
        $eligible_items = array_filter(
            $items,
            fn($item) => (int) $item['product_id'] === $promo_product_id
        );
        if (empty($eligible_items)) {
            http_response_code(400);
            echo json_encode(['error' => 'Promo code does not apply to your cart.', 'reason' => 'promo_invalid']);
            exit;
        }
    }

    $eligible_subtotal = array_reduce(
        $eligible_items,
        fn($carry, $item) => $carry + ((int) $item['price_cents']) * ((int) $item['qty']),
        0
    );

    if ($eligible_subtotal <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Promo code does not apply to your cart.', 'reason' => 'promo_invalid']);
        exit;
    }

    $percent_off = isset($promo['percent_off']) ? (int) $promo['percent_off'] : 0;
    if ($percent_off > 0) {
        $discount += (int) floor($eligible_subtotal * $percent_off / 100);
    }

    $amount_off = isset($promo['amount_off_cents']) ? (int) $promo['amount_off_cents'] : 0;
    if ($amount_off > 0) {
        $discount += $amount_off;
    }

    if ($discount > $eligible_subtotal) {
        $discount = $eligible_subtotal;
    }
}

if ($discount > $total) {
    $discount = $total;
}

$amount_to_charge = $total - $discount;

if ($amount_to_charge <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Promo code reduces total below zero.', 'reason' => 'promo_invalid']);
    exit;
}

$intent = \Stripe\PaymentIntent::create([
    'amount' => $amount_to_charge,
    'currency' => 'aud',
    'automatic_payment_methods' => ['enabled' => true],
]);


echo json_encode(['clientSecret' => $intent->client_secret]);