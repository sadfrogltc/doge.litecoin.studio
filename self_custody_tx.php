<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log POST data for debugging
file_put_contents('php://stderr', print_r($_POST, true));

// Capture raw transaction hex from the POST request
$rawTxHex = json_decode(file_get_contents('php://input'), true)['rawTxHex'] ?? null;

// Check if raw transaction hex was provided
if (!$rawTxHex) {
    echo json_encode(['success' => false, 'error' => 'No raw transaction hex provided.']);
    exit();
}

try {
    // Here you would broadcast the transaction to the Dogecoin network
    // For example, you could use a Dogecoin node's RPC method `sendrawtransaction`

    // This is just a placeholder for broadcasting logic
    // Replace with actual logic to send the transaction
    $txid = "dummy_txid_for_testing"; // Placeholder TXID, replace with actual TXID

    // Log the successful transaction broadcast
    file_put_contents('php://stderr', "Transaction broadcasted successfully, TXID: $txid\n");

    // Respond with success and the transaction ID
    echo json_encode(['success' => true, 'txid' => $txid]);
} catch (Exception $e) {
    // Log any errors encountered
    file_put_contents('php://stderr', "Error broadcasting transaction: " . $e->getMessage() . "\n");

    // Respond with an error message
    echo json_encode(['success' => false, 'error' => 'Failed to send transaction to backend.']);
}
?>
