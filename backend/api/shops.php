<?php require __DIR__ . '/config.php';
$action = $_GET['action'] ?? '';


if ($action === 'list') {
    $rows = $pdo->query('SELECT * FROM shops ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
    exit;
}


if ($action === 'create') {
    require_admin();
    // multipart/form-data: name, address, photo
    $name = $_POST['name'] ?? '';
    $address = $_POST['address'] ?? null;
    $photo = null;
    //filenames are sanitized and prefixed with a timestamp to avoid collisions.
    if (!empty($_FILES['photo']['tmp_name'])) {
        $fname = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $_FILES['photo']['name']);
        move_uploaded_file($_FILES['photo']['tmp_name'], __DIR__ . '/../uploads/' . $fname);
        $photo = $fname;
    }
    $st = $pdo->prepare('INSERT INTO shops (name,address,photo) VALUES (?,?,?)');
    $st->execute([$name, $address, $photo]);
    echo json_encode(['success' => true]);
    exit;
}


if ($action === 'update') {
    require_admin();
    $id = (int) ($_POST['id'] ?? 0);
    $name = $_POST['name'] ?? '';
    $address = $_POST['address'] ?? null;
    $setPhoto = '';
    $vals = [$name, $address];
    if (!empty($_FILES['photo']['tmp_name'])) {
        $fname = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $_FILES['photo']['name']);
        move_uploaded_file($_FILES['photo']['tmp_name'], __DIR__ . '/../uploads/' . $fname);
        $setPhoto = ', photo=?';
        $vals[] = $fname;
    }
    $vals[] = $id;
    $sql = 'UPDATE shops SET name=?, address=?' . $setPhoto . ' WHERE id=?';
    $st = $pdo->prepare($sql);
    $st->execute($vals);
    echo json_encode(['success' => true]);
    exit;
}


if ($action === 'delete') {
    require_admin();
    $id = (int) ($_POST['id'] ?? 0);
    $st = $pdo->prepare('DELETE FROM shops WHERE id=?');
    $st->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}


echo json_encode(['error'=>'unknown_action']);