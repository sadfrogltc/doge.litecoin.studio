<?php
require_once("dogecoin.php");

$DOGECOIN = new Dogecoin();
$address = $_GET['address'] ?? '';

if (!empty($address)) {
    $balance = $DOGECOIN->checkBalance($address);
    echo json_encode(['balance' => $balance]);
} else {
    echo json_encode(['error' => 'No address provided']);
}
?>
