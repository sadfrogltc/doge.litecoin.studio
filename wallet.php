<?php
require_once("dogecoin.php");

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'listSelfCustodyUTXOs') {
        $fromAddress = $_POST['fromAddress'] ?? '';

        if (empty($fromAddress)) {
            echo json_encode(['success' => false, 'error' => 'From address is required']);
            exit();
        }

        try {
            $DOGECOIN = new Dogecoin();
            $utxos = $DOGECOIN->listUnspent($fromAddress);

            echo json_encode(['success' => true, 'utxos' => $utxos]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit();
    }
}
?>
