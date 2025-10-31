<?php require __DIR__ . '/config.php';
$action = $_GET['action'] ?? '';


if ($action === 'byShop') {
    $shop_id = (int) ($_GET['shop_id'] ?? 0);
    $st = $pdo->prepare('SELECT * FROM products WHERE shop_id=? AND active=1 ORDER BY id DESC');
    $st->execute([$shop_id]);
    echo json_encode($st->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($action === 'listAll') {
    require_admin();
    $st = $pdo->query('SELECT p.*, s.name AS shop_name FROM products p LEFT JOIN shops s ON s.id = p.shop_id ORDER BY p.id DESC');
    echo json_encode($st->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($action === 'create') {
    require_admin();
    // multipart: shop_id, name, description, price_cents, photo
    $shop_id = (int) ($_POST['shop_id'] ?? 0);
    $name = $_POST['name'] ?? '';
    $description = $_POST['description'] ?? null;
    $price_cents = (int) ($_POST['price_cents'] ?? 0);
    $photo = null;
    if (!empty($_FILES['photo']['tmp_name'])) {
        $fname = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $_FILES['photo']['name']);
        move_uploaded_file($_FILES['photo']['tmp_name'], __DIR__ . '/../uploads/' . $fname);
        $photo = $fname;
    }
    $st = $pdo->prepare('INSERT INTO products (shop_id,name,description,price_cents,photo) VALUES (?,?,?,?,?)');
    $st->execute([$shop_id, $name, $description, $price_cents, $photo]);
    echo json_encode(['success' => true]);
    exit;
}


if ($action === 'update') {
    require_admin();
    // When updating we only touch the `photo` column if a new file was uploaded
    // so existing images remain untouched.
    $id = (int) ($_POST['id'] ?? 0);
    $name = $_POST['name'] ?? '';
    $description = $_POST['description'] ?? null;
    $price_cents = (int) ($_POST['price_cents'] ?? 0);
    $setPhoto = '';
    $vals = [$name, $description, $price_cents];
    if (!empty($_FILES['photo']['tmp_name'])) {
        $fname = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $_FILES['photo']['name']);
        move_uploaded_file($_FILES['photo']['tmp_name'], __DIR__ . '/../uploads/' . $fname);
        $setPhoto = ', photo=?';
        $vals[] = $fname;
    }
    $vals[] = $id;
    $sql = 'UPDATE products SET name=?, description=?, price_cents=?' . $setPhoto . ' WHERE id=?';
    $st = $pdo->prepare($sql);
    $st->execute($vals);
    echo json_encode(['success' => true]);
    exit;
}


if ($action === 'delete') {
    require_admin();
    $id = (int) ($_POST['id'] ?? 0);
    $st = $pdo->prepare('DELETE FROM products WHERE id=?');
    $st->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}


echo json_encode(['error'=>'unknown_action']);