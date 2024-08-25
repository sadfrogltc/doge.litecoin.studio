<?php
require_once("dogecoin.php");

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['address'])) {
    $address = $_POST['address'];
    $DOGECOIN = new Dogecoin();
    $unspentTx = $DOGECOIN->listUnspent($address);
    
    if (!empty($unspentTx)) {
        echo json_encode(['success' => true, 'utxos' => $unspentTx]);
    } else {
        echo json_encode(['success' => false, 'error' => 'No unspent transactions found.']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Address not provided.']);
}
?>
