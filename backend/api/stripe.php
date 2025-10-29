<?php require __DIR__ . '/config.php';
require __DIR__ . '/../vendor/autoload.php';
require_login();


// Set your Stripe secret key
\Stripe\Stripe::setApiKey('sk_test_51SNOxBQlKi5OB6Ovu48gOOVZ3XvaVhgE53wE1oERjOJn3id1vhS6rrdMxjsmkUoYSh5MIG6Ujys44bgEwt16EuvF005sf4EsN0');


// Compute total from cart
$user_id = (int) $_SESSION['user']['id'];
$st = $pdo->prepare('SELECT qty, price_cents FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=?');
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

$intent = \Stripe\PaymentIntent::create([
    'amount' => $total,
    'currency' => 'aud',
    'automatic_payment_methods' => ['enabled' => true],
]);


echo json_encode(['clientSecret' => $intent->client_secret]);