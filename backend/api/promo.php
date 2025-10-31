<?php
require __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';

function respond_error(string $message, int $status = 400, array $extra = []): void
{
    http_response_code($status);
    echo json_encode(array_merge(['error' => $message], $extra));
    exit;
}

function normalize_datetime(?string $value, string $fieldLabel): ?string
{
    if ($value === null) {
        return null;
    }
    $trimmed = trim($value);
    if ($trimmed === '') {
        return null;
    }
    try {
        $dt = new DateTime($trimmed);
    } catch (Exception $e) {
        respond_error("Invalid {$fieldLabel} date provided.");
    }
    return $dt->format('Y-m-d H:i:s');
}

function parse_promo_payload(array $body): array
{
    $code = strtoupper(trim((string) ($body['code'] ?? '')));
    if ($code === '') {
        respond_error('Promo code is required.');
    }

    $percentOff = null;
    if (array_key_exists('percent_off', $body) && $body['percent_off'] !== '' && $body['percent_off'] !== null) {
        if (!is_numeric($body['percent_off'])) {
            respond_error('Percent off must be a number between 1 and 100.');
        }
        $percentOff = (int) round((float) $body['percent_off']);
        if ($percentOff <= 0 || $percentOff > 100) {
            respond_error('Percent off must be between 1 and 100.');
        }
    }

    $amountOffCents = null;
    if (array_key_exists('amount_off_cents', $body) && $body['amount_off_cents'] !== '' && $body['amount_off_cents'] !== null) {
        if (!is_numeric($body['amount_off_cents'])) {
            respond_error('Amount off must be a numeric value.');
        }
        $amountOffCents = (int) round((float) $body['amount_off_cents']);
        if ($amountOffCents <= 0) {
            respond_error('Amount off must be greater than zero.');
        }
    }

    if ($percentOff === null && $amountOffCents === null) {
        respond_error('Provide a percent off or amount off value.');
    }

    $productId = null;
    if (array_key_exists('product_id', $body) && $body['product_id'] !== '' && $body['product_id'] !== null) {
        $productId = (int) $body['product_id'];
        if ($productId <= 0) {
            $productId = null;
        }
    }

    $startsAt = normalize_datetime($body['starts_at'] ?? null, 'start');
    $endsAt = normalize_datetime($body['ends_at'] ?? null, 'end');

    if ($startsAt !== null && $endsAt !== null) {
        if (new DateTime($startsAt) >= new DateTime($endsAt)) {
            respond_error('End date must be after the start date.');
        }
    }

    return [
        'code' => $code,
        'percent_off' => $percentOff,
        'amount_off_cents' => $amountOffCents,
        'product_id' => $productId,
        'starts_at' => $startsAt,
        'ends_at' => $endsAt,
    ];
}

if ($action === 'list') {
    require_admin();
    $rows = $pdo
        ->query('SELECT id, code, percent_off, amount_off_cents, product_id, starts_at, ends_at FROM promo_codes ORDER BY id DESC')
        ->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
    exit;
}

if ($action === 'create') {
    require_admin();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $payload = parse_promo_payload($body);

    $st = $pdo->prepare('INSERT INTO promo_codes (code, percent_off, amount_off_cents, product_id, starts_at, ends_at) VALUES (?,?,?,?,?,?)');
    try {
        $st->execute([
            $payload['code'],
            $payload['percent_off'],
            $payload['amount_off_cents'],
            $payload['product_id'],
            $payload['starts_at'],
            $payload['ends_at'],
        ]);
    } catch (PDOException $e) {
        if ((int) $e->getCode() === 23000) {
            respond_error('A promo with that code already exists.');
        }
        throw $e;
    }

    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'update') {
    require_admin();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($body['id']) ? (int) $body['id'] : 0;
    if ($id <= 0) {
        respond_error('Promo id is required.');
    }
    $payload = parse_promo_payload($body);

    $st = $pdo->prepare('UPDATE promo_codes SET code=?, percent_off=?, amount_off_cents=?, product_id=?, starts_at=?, ends_at=? WHERE id=?');
    try {
        $st->execute([
            $payload['code'],
            $payload['percent_off'],
            $payload['amount_off_cents'],
            $payload['product_id'],
            $payload['starts_at'],
            $payload['ends_at'],
            $id,
        ]);
    } catch (PDOException $e) {
        if ((int) $e->getCode() === 23000) {
            respond_error('A promo with that code already exists.');
        }
        throw $e;
    }

    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete') {
    require_admin();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($body['id']) ? (int) $body['id'] : 0;
    if ($id <= 0) {
        respond_error('Promo id is required.');
    }
    $st = $pdo->prepare('DELETE FROM promo_codes WHERE id=?');
    $st->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$code = strtoupper(trim($body['code'] ?? ''));
$product_id = isset($body['product_id']) ? (int) $body['product_id'] : null;
$product_ids = array_map('intval', $body['product_ids'] ?? []);
if ($product_id) {
    $product_ids[] = $product_id;
}
$product_ids = array_values(array_unique(array_filter($product_ids, fn($id) => $id > 0)));

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
if (!empty($promo['product_id'])) {
    $promoProductId = (int) $promo['product_id'];
    if (!in_array($promoProductId, $product_ids, true)) {
        echo json_encode(['valid' => false, 'reason' => 'wrong_product']);
        exit;
    }
}
echo json_encode([
    'valid' => true,
    'percent_off' => $promo['percent_off'] ? (int) $promo['percent_off'] : null,
    'amount_off_cents' => $promo['amount_off_cents'] ? (int) $promo['amount_off_cents'] : null,
    'product_id' => $promo['product_id'] ? (int) $promo['product_id'] : null,
]);