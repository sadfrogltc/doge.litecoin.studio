<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include necessary files for Dogecoin operations and QR code generation
require_once("dogecoin.php");

function sanitize_input($data) {
    // Trim, remove slashes, and convert special characters to HTML entities
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

function is_valid_private_key($privateKey) {
    // Private keys typically start with a specific prefix and have a fixed length
    return preg_match("/^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/", $privateKey);
}

function is_valid_mnemonic($mnemonic) {
    // Mnemonic should be a series of valid words (simple check for word characters and spaces)
    return preg_match("/^([a-z]+(\s)?)+$/i", $mnemonic);
}

function is_valid_address($address) {
    // Validate Dogecoin address format
    return preg_match("/^[DA9][a-km-zA-HJ-NP-Z1-9]{25,34}$/", $address);
}

function is_valid_amount($amount) {
    // Ensure the amount is a positive float
    return filter_var($amount, FILTER_VALIDATE_FLOAT) && $amount > 0;
}

// Sanitize inputs
$restore_option = isset($_POST['restore-option']) ? sanitize_input($_POST['restore-option']) : '';
$restore_private_key = isset($_POST['restore-private-key']) ? sanitize_input($_POST['restore-private-key']) : '';
$restore_mnemonic = isset($_POST['restore-mnemonic']) ? sanitize_input($_POST['restore-mnemonic']) : '';
$selfcustody_to_address = isset($_POST['to_address']) ? sanitize_input($_POST['to_address']) : '';
$selfcustody_amount = isset($_POST['amount']) ? sanitize_input($_POST['amount']) : '';
$selfcustody_feeRate = isset($_POST['feeRate']) ? sanitize_input($_POST['feeRate']) : '';

// Validate the private key
if ($restore_private_key && !is_valid_private_key($restore_private_key)) {
    die("Invalid private key format.");
}

// Validate the mnemonic
if ($restore_mnemonic && !is_valid_mnemonic($restore_mnemonic)) {
    die("Invalid mnemonic format.");
}

// Validate the address format
if ($selfcustody_to_address && !is_valid_address($selfcustody_to_address)) {
    die("Invalid address format.");
}

// Validate the amount
if ($selfcustody_amount && !is_valid_amount($selfcustody_amount)) {
    die("Invalid amount.");
}

// Validate fee rate (ensure it's a number within the expected range)
if ($selfcustody_feeRate && (!filter_var($selfcustody_feeRate, FILTER_VALIDATE_FLOAT) || $selfcustody_feeRate < 0.05 || $selfcustody_feeRate > 3)) {
    die("Invalid fee rate.");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dogecoin Wallet</title>
    <?php include("dynamicStyle.php"); ?>
    <!-- Include necessary JavaScript libraries for cryptographic operations -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/elliptic/6.5.4/elliptic.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs2/qrcode.min.js"></script>
    <script src="word-list.js"></script>
    <script src="dailyScanCountdown.js"></script>
</head>
<body>
<div id="maintenanceNotice" style="display: none;">
    <p>The website will be unavailable for due rescanning for public key utxos for those who imported their wallets and see a 0 balance:</p>
    <div id="countdownElement"></div>
</div>

<div class="container">
    <div class="top-right-buttons">
        <button id="show-secrets-button">Show Secrets</button>
    </div>
    <h1>Dogecoin Wallet</h1>

    <!-- Self Custody Wallet Section -->
    <div class="wallet-section">
        <h2>Self Custody</h2>
        
        <div id="restore-wallet">
            <h3>Restore Wallet</h3>
            <label for="restore-option">Restore Using:</label>
            <select id="restore-option">
                <option value="private-key">Private Key</option>
                <option value="mnemonic">Mnemonic</option>
            </select>
            <div id="restore-private-key-section">
                <label for="restore-private-key">Enter Private Key:</label>
                <input type="text" id="restore-private-key" name="restore-private-key">
            </div>
            <div id="restore-mnemonic-section" style="display: none;">
                <label for="restore-mnemonic">Enter Mnemonic:</label>
                <input type="text" id="restore-mnemonic" name="restore-mnemonic">
            </div>
            <button id="restore-wallet-button">Restore Wallet</button>
            <br>
            <br>
            <hr>
            <button id="generate-keys-button">Generate Keys</button>
        </div>
        
        <div class="qr-container">
            <div id="selfCustodyQrCode" style="display:none;">
                <!-- QR Code Image will be dynamically generated and added here -->
            </div>
        </div>

        <div id="wallet-info">
            <p>Address: <span class="address" id="wallet-address"></span></p>
            <p>Balance: <span id="balance" class="balance" style="display: none;">0.00 DOGE</span></p>
        </div>
        
        <button class="collapsible">UTXO's</button>
        <div class="content" id="unspentTx">
            <!-- UTXO data will be displayed here -->
            <div id="paginationControls" class="pagination-controls">
                <!-- Pagination buttons will be inserted here by JavaScript -->
            </div>
        </div>

        <script>
            document.addEventListener("DOMContentLoaded", function() {
                var coll = document.getElementsByClassName("collapsible")[0];
                coll.addEventListener("click", function() {
                    this.classList.toggle("active");
                    var content = document.getElementById("unspentTx");
                    if (content.style.display === "block") {
                        content.style.display = "none";
                    } else {
                        content.style.display = "block";
                        fetchUnspentTransactions();
                    }
                });

                function fetchUnspentTransactions() {
                    var address = localStorage.getItem('address');
                    if (!address) {
                        alert('No address found in local storage.');
                        return;
                    }

                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', 'fetch_unspent_tx.php', true);
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            try {
                                var result = JSON.parse(xhr.responseText);
                                if (result.success) {
                                    localStorage.setItem('utxos', JSON.stringify(result.utxos));
                                    displayUTXOs(result.utxos); // Display structured UTXOs
                                } else {
                                    alert('Failed to fetch UTXOs.');
                                }
                            } catch (e) {
                                console.error('Failed to parse UTXO response:', e);
                                alert('Failed to fetch UTXOs.');
                            }
                        }
                    };
                    xhr.send('address=' + encodeURIComponent(address));
                }

                function displayUTXOs(utxos) {
                    var unspentTxDiv = document.getElementById('unspentTx');
                    unspentTxDiv.innerHTML = ''; // Clear existing content

                    if (utxos.length > 0) {
                        utxos.forEach(function (utxo, index) {
                            var utxoElement = document.createElement('div');
                            utxoElement.classList.add('utxo-item');
                            utxoElement.innerHTML = `
                                <p>TXID: ${utxo.txid}</p>
                                <p>VOUT: ${utxo.vout}</p>
                                <p>Amount: ${utxo.amount} DOGE</p>
                                <p>Confirmations: ${utxo.confirmations}</p>
                                <hr>
                            `;
                            unspentTxDiv.appendChild(utxoElement);
                        });
                    } else {
                        unspentTxDiv.innerHTML = '<p>No UTXOs available</p>';
                    }
                }
            });
        </script>

<form id="selfcustody-send-form" method="post" action="">
    <label for="selfcustody-to_address">Recipient Address:</label>
    <input type="text" id="selfcustody-to_address" name="to_address" required>
    <br><br>
    <label for="selfcustody-amount">Amount:</label>
    <input type="text" id="selfcustody-amount" name="amount" required>
    <br><br>

    <!-- Support Developer Toggle -->
    <label for="supportDeveloper">
        <input type="checkbox" id="supportDeveloper" name="supportDeveloper" checked>
        Support Developer (0.1 Đ) 🐸 
    </label>
    <br><br>

    <!-- Fee Rate Slider and Buttons Aligned in a Row -->
    <div class="fee-rate-container">
        <label for="selfcustody-feeRate">Fee Rate (DOGE per kB):</label>
        <input type="range" id="selfcustody-feeRate" name="feeRate" min="0.05" max="2" step="0.1" value="1">
        <span id="selfcustody-feeRateDisplay">1 DOGE/kB</span>
        <button type="button" id="selfcustody-create-transaction" class="transaction-button" onclick="createAndDisplayRawTransaction()">Create Transaction</button>
        <button type="button" id="selfcustody-sign-broadcast" class="transaction-button" onclick="signAndBroadcastTransaction()">Sign and Broadcast</button>
    </div>
</form>

<p>Raw Transaction Hex: <span id="raw-transaction-hex" class="truncated-text"></span></p>
<p>Broadcast Result: <span id="broadcast-result" class="truncated-text"></span></p>
    </div>
    <button id="sign-out-button" style="display: none;"></button>
</div>

<!-- QR Code Modal -->
<div id="qrCodeModal" class="qr-modal">
    <div class="qr-modal-content">
        <span id="closeQrModal" class="close">&times;</span>
        <img id="qrModalContent" src="" alt="QR Code">
    </div>
</div>

<!-- Secrets Modal -->
<?php 
include('show_secrets_modal.php');
?>

<!-- Footer -->
<?php 
include('footer.php');
?>

<!-- Self-Custody JavaScript -->
<script src="self_custody.js" defer></script>
<script>
    document.addEventListener("DOMContentLoaded", function () {
        const qrCode = document.querySelector(".qr-container img");
        const qrModal = document.getElementById("qrCodeModal");
        const modalContent = document.getElementById("qrModalContent");
        const closeModal = document.getElementById("closeQrModal");

        qrCode.addEventListener("click", function () {
            modalContent.src = qrCode.src; // Use the same source as the displayed QR code
            qrModal.style.display = "flex";
        });

        closeModal.addEventListener("click", function () {
            qrModal.style.display = "none";
        });

        window.addEventListener("click", function (event) {
            if (event.target === qrModal) {
                qrModal.style.display = "none";
            }
        });
    });

    // Show Secrets Modal Script
    document.addEventListener("DOMContentLoaded", function () {
        const secretsModal = document.getElementById("showSecretsModal");
        const showSecretsButton = document.getElementById("show-secrets-button");
        const closeSecretsModal = document.getElementById("closeSecretsModal");
        const confirmShowSecrets = document.getElementById("confirm-show-secrets");
        const cancelShowSecrets = document.getElementById("cancel-show-secrets");
        const secretsDisplay = document.getElementById("secretsDisplay");

        showSecretsButton.addEventListener("click", function () {
            resetSecretsModal();
            secretsModal.style.display = "block";
        });

        closeSecretsModal.addEventListener("click", function () {
            resetSecretsModal();
            secretsModal.style.display = "none";
        });

        cancelShowSecrets.addEventListener("click", function () {
            resetSecretsModal();
            secretsModal.style.display = "none";
        });

        confirmShowSecrets.addEventListener("click", function () {
            displaySecrets();
            confirmShowSecrets.style.display = "none";
            cancelShowSecrets.style.display = "none";
        });

        function displaySecrets() {
            var privateKey = localStorage.getItem("privateKey");
            var mnemonic = localStorage.getItem("mnemonic");
            var publicKey = localStorage.getItem("publicKey");

            displayAndEnableCopy(privateKey, "privateKeyDisplay", "Private Key");
            displayAndEnableCopy(mnemonic, "mnemonicDisplay", "Mnemonic");
            displayAndEnableCopy(publicKey, "publicKeyDisplay", "Public Key");

            secretsDisplay.style.display = "block"; 
        }

        function displayAndEnableCopy(text, elementId, label) {
            var displayElement = document.getElementById(elementId);
            displayElement.innerHTML = `<strong>${label}:</strong> ${text ? truncateMiddle(text, 40) : "Not Available"}`;

            displayElement.onclick = function() {
                if (text) {
                    navigator.clipboard.writeText(text).then(() => {
                        alert(`Copied to clipboard: ${text}`);
                    }).catch(err => {
                        console.error('Could not copy text: ', err);
                    });
                }
            };
        }

        function truncateMiddle(text, maxLength) {
            if (text.length <= maxLength) return text;
            const half = Math.floor(maxLength / 2);
            return text.slice(0, half) + "..." + text.slice(-half);
        }

        function resetSecretsModal() {
            confirmShowSecrets.style.display = "block";
            cancelShowSecrets.style.display = "block";
            secretsDisplay.style.display = "none";
            document.getElementById("privateKeyDisplay").textContent = "";
            document.getElementById("mnemonicDisplay").textContent = "";
            document.getElementById("publicKeyDisplay").textContent = "";
        }
    });
</script>
</body>
</html>
 