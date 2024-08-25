<?php
require_once("dogecoin.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['rawTxHex']) && isset($_POST['prevTxs']) && isset($_POST['privKeys'])) {
        $rawTxHex = $_POST['rawTxHex'];
        $prevTxs = json_decode($_POST['prevTxs'], true);
        $privKeys = json_decode($_POST['privKeys'], true);

        // Log all incoming data for debugging
        error_log("Received Raw Transaction Hex: $rawTxHex");
        error_log("Received Previous Transactions: " . print_r($prevTxs, true));
        error_log("Received Private Keys: " . print_r($privKeys, true));

        try {
            // Instantiate the Dogecoin class
            $dogecoin = new Dogecoin();

            // Verify that prevTxs contains the necessary scriptPubKey
            foreach ($prevTxs as $prevTx) {
                if (!isset($prevTx['scriptPubKey']) || empty($prevTx['scriptPubKey'])) {
                    throw new Exception('Missing scriptPubKey in previous transaction outputs.');
                }
            }

            // Sign the raw transaction
            $signedTx = $dogecoin->signRawTransactionSelfCustody($rawTxHex, $prevTxs, $privKeys);

            // Log signed transaction details
            error_log("Signed Transaction Response: " . print_r($signedTx, true));

            // Check if signing was successful
            if (isset($signedTx['hex']) && !empty($signedTx['hex'])) {
                // Broadcast the signed transaction
                $txid = $dogecoin->sendRawTransaction($signedTx['hex']);

                if ($txid) {
                    error_log("Transaction broadcasted successfully. TXID: $txid");
                    echo json_encode([
                        'success' => true, 
                        'txid' => $txid,
                        'rawTxHex' => $rawTxHex,
                        'prevTxs' => $prevTxs,
                        'privKeys' => $privKeys,
                        'signedTx' => $signedTx['hex']
                    ]);
                } else {
                    error_log("Broadcast failed: No TXID returned.");
                    echo json_encode([
                        'success' => false, 
                        'error' => 'Failed to broadcast transaction.',
                        'rawTxHex' => $rawTxHex,
                        'prevTxs' => $prevTxs,
                        'privKeys' => $privKeys,
                        'signedTx' => $signedTx['hex']
                    ]);
                }
            } else {
                $errorMessage = isset($signedTx['errors']) ? json_encode($signedTx['errors']) : 'Unknown signing error.';
                error_log("Signing failed: " . $errorMessage);
                echo json_encode([
                    'success' => false, 
                    'error' => 'Failed to sign transaction: ' . $errorMessage,
                    'rawTxHex' => $rawTxHex,
                    'prevTxs' => $prevTxs,
                    'privKeys' => $privKeys,
                    'signedTx' => isset($signedTx['hex']) ? $signedTx['hex'] : null
                ]);
            }
        } catch (Exception $e) {
            error_log("Exception during signing or broadcasting: " . $e->getMessage());
            echo json_encode([
                'success' => false, 
                'error' => $e->getMessage(),
                'rawTxHex' => $rawTxHex,
                'prevTxs' => $prevTxs,
                'privKeys' => $privKeys
            ]);
        }
    } else {
        error_log("Missing parameters: rawTxHex, prevTxs, or privKeys.");
        echo json_encode([
            'success' => false, 
            'error' => 'Missing parameters.',
            'rawTxHex' => isset($_POST['rawTxHex']) ? $_POST['rawTxHex'] : null,
            'prevTxs' => isset($_POST['prevTxs']) ? json_decode($_POST['prevTxs'], true) : null,
            'privKeys' => isset($_POST['privKeys']) ? json_decode($_POST['privKeys'], true) : null
        ]);
    }
} else {
    error_log("Invalid request method.");
    echo json_encode(['success' => false, 'error' => 'Invalid request method.']);
}
?>
