<?php
require_once("dogecoin.php");

$dogecoin = new Dogecoin();

try {
    $result = $dogecoin->rescan1year();
    echo json_encode([
        'success' => true,
        'blocks_scanned' => $result['blocks_scanned'],
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
?>
