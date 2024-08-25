<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once("dogecoin.php");

$publicKey = $_POST['publicKey'] ?? '';
if (empty($publicKey)) {
    echo json_encode(['success' => false, 'error' => 'No public key provided']);
    exit;
}

// Instantiate the Dogecoin class
$dogecoin = new Dogecoin();

// Import the public key into the Dogecoin node
$importResult = $dogecoin->importPublicKey($publicKey, 'User Generated watch-only', false);

if (isset($importResult['error']) && $importResult['error'] !== null) {
    echo json_encode(['success' => false, 'error' => $importResult['error']]);
} else {
    echo json_encode(['success' => true, 'message' => 'Public key imported successfully']);
}
?>
