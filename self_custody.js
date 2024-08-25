function hexToBytes(hex) {
    const bytes = [];
    for (let c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}

document.addEventListener("DOMContentLoaded", async function() {
    // Initialization and Self-Custody Setup
    const address = localStorage.getItem('address');
    const privateKey = localStorage.getItem('privateKey');
    const publicKey = localStorage.getItem('publicKey');
    const balance = localStorage.getItem('balance');
    const utxos = localStorage.getItem('utxos');

    // References to the HTML elements
    const addressElement = document.getElementById('wallet-address');
    const balanceElement = document.getElementById('balance');
    const utxoSection = document.querySelector('.collapsible');
    const utxoContent = document.getElementById('unspentTx');
    const qrContainer = document.getElementById('selfCustodyQrCode');

    // QR Code Modal Elements
    const qrCode = document.querySelector(".qr-container img");
    const qrModal = document.getElementById("qrCodeModal");
    const modalContent = document.getElementById("qrModalContent");
    const closeModal = document.getElementById("closeQrModal");

    if (address && privateKey) {
        await initializeSelfCustody();
        document.getElementById('generate-keys-button').style.display = 'none';
        document.getElementById('restore-wallet').style.display = 'none';
        document.getElementById('sign-out-button').style.display = 'block';
        document.getElementById('selfcustody-send-form').style.display = 'block';
        document.getElementById('wallet-info').style.display = 'block';
        if (balance) {
            balanceElement.textContent = balance + ' DOGE';
            balanceElement.style.display = 'block';
        }
        generateQrCode(address, qrContainer);
    } else {
        document.getElementById('selfcustody-send-form').style.display = 'none';
        document.getElementById('wallet-info').style.display = 'none';
        document.getElementById('show-secrets-button').style.display = 'none';

        
        if (!address) {
            addressElement.style.display = 'none';
        }
        if (!balance) {
            balanceElement.style.display = 'none';
        }
        if (!utxos || JSON.parse(utxos).length === 0) {
            utxoSection.style.display = 'none';
            utxoContent.style.display = 'none';
        }
    }

    // Restore Options Handling
    document.getElementById('restore-option').addEventListener('change', function() {
        const option = this.value;
        document.getElementById('restore-private-key-section').style.display = option === 'private-key' ? 'block' : 'none';
        document.getElementById('restore-mnemonic-section').style.display = option === 'mnemonic' ? 'block' : 'none';
    });

    // Event Listeners for Buttons and Inputs
    document.getElementById('generate-keys-button').addEventListener('click', generateKeys);
    document.getElementById('restore-wallet-button').addEventListener('click', restoreWallet);
    document.getElementById('sign-out-button').addEventListener('click', signOutSelfCustody);
    document.getElementById('selfcustody-feeRate').addEventListener('input', function() {
        document.getElementById('selfcustody-feeRateDisplay').textContent = this.value + ' DOGE/kB';
    });


    closeModal.addEventListener("click", function() {
        qrModal.style.display = "none";
    });

    window.addEventListener("click", function(event) {
        if (event.target === qrModal) {
            qrModal.style.display = "none";
        }
    });

    // Modal Handling for Secrets
    var modal = document.getElementById("showSecretsModal");
    var btn = document.getElementById("show-secrets-button");
    var span = document.getElementsByClassName("close")[0];
    var confirmBtn = document.getElementById("confirm-show-secrets");
    var cancelBtn = document.getElementById("cancel-show-secrets");
    var secretsDisplay = document.getElementById("secretsDisplay");

    btn.onclick = function () {
        modal.style.display = "block";
    };

    span.onclick = function () {
        modal.style.display = "none";
    };

    cancelBtn.onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    confirmBtn.onclick = function () {
        displaySecrets();
    };

    function displaySecrets() {
        var privateKey = localStorage.getItem("privateKey");
        var mnemonic = localStorage.getItem("mnemonic");
        var publicKey = localStorage.getItem("publicKey");

        document.getElementById("privateKeyDisplay").textContent = privateKey
            ? "Private Key: " + privateKey
            : "No Private Key Available";

        document.getElementById("mnemonicDisplay").textContent = mnemonic
            ? "Mnemonic: " + mnemonic
            : "No Mnemonic Available";

        document.getElementById("publicKeyDisplay").textContent = publicKey
            ? "Public Key: " + publicKey
            : "No Public Key Available";

        secretsDisplay.style.display = "block"; // Display secrets inside the modal
    }
});

async function initializeSelfCustody() {
    const address = localStorage.getItem('address');
    const publicKey = localStorage.getItem('publicKey');

    document.getElementById('wallet-address').textContent = address;
    document.getElementById('generate-keys-button').style.display = 'none';
    document.getElementById('restore-wallet').style.display = 'none';
    document.getElementById('sign-out-button').style.display = 'block';
    document.getElementById('selfcustody-send-form').style.display = 'block';
  
    await updateBalance(address);
    await fetchUTXOs(address);
}

async function updateBalance(address) {
    const balance = await getBalance(address);
    document.getElementById('balance').textContent = balance.toFixed(8) + ' DOGE';
    document.getElementById('balance').style.display = 'block';
    localStorage.setItem('balance', balance.toFixed(8));
}

async function getBalance(address) {
    try {
        const response = await fetch(`get_balance.php?address=${encodeURIComponent(address)}`);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.balance !== undefined) {
            return data.balance;
        } else {
            console.error('Error fetching balance:', data.error);
            return 0;
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        return 0;
    }
}

async function generateKeys() {
    try {
        const privateKeyArray = new Uint8Array(16);
        window.crypto.getRandomValues(privateKeyArray);
        const entropyHex = Array.from(privateKeyArray, byte => byte.toString(16).padStart(2, '0')).join('');

        const mnemonic = entropyToMnemonic(entropyHex);
        const seed = mnemonicToSeed(mnemonic);
        const path = "m/44'/3'/0'/0/0";
        const masterKey = bip32MasterKeyFromSeed(seed);
        const derivedKey = deriveKeyFromPath(masterKey, path);
        
        const privateKeyHex = derivedKey.privateKey;

        const EC = elliptic.ec;
        const ec = new EC('secp256k1');
        const keyPair = ec.keyFromPrivate(privateKeyHex);
        const publicKey = keyPair.getPublic(true, 'hex');

        const publicKeyHash = ripemd160(sha256(publicKey));
        const addressWithPrefix = '1e' + publicKeyHash;
        const checksum = sha256(sha256(addressWithPrefix)).slice(0, 8);
        const address = base58Encode(hexToBytes(addressWithPrefix + checksum));

        const privateKeyWithPrefix = '9e' + privateKeyHex + '01';
        const privateKeyChecksum = sha256(sha256(privateKeyWithPrefix)).slice(0, 8);
        const privateKeyWIF = base58Encode(hexToBytes(privateKeyWithPrefix + privateKeyChecksum));

        document.getElementById('wallet-address').textContent = address;

        localStorage.setItem('address', address);
        localStorage.setItem('privateKey', privateKeyWIF);
        localStorage.setItem('mnemonic', mnemonic);
        localStorage.setItem('publicKey', publicKey);
        importPublicKey(publicKey);
        document.getElementById('generate-keys-button').style.display = 'none';
        document.getElementById('restore-wallet').style.display = 'none';
        document.getElementById('sign-out-button').style.display = 'block';
        document.getElementById('selfcustody-send-form').style.display = 'block';

        await updateBalance(address);
    } catch (error) {
        console.error('Error generating keys:', error);
    }
    location.reload();
}
async function restoreWallet() {
    try {
        const restoreOption = document.getElementById('restore-option').value;
        let privateKeyWIF = '';
        let mnemonic = '';

        // Adjusted regular expressions for validation
        const privateKeyRegex = /^[A-HJ-NP-Za-km-z1-9]{51,52}$/; // Updated regex to match example private keys
        const mnemonicRegex = /^([a-z]+(\s)?)+$/i; // Matches a sequence of lowercase/uppercase words

        if (restoreOption === 'private-key') {
            privateKeyWIF = document.getElementById('restore-private-key').value;
            if (privateKeyWIF) {
                // Validate private key format
                if (!privateKeyRegex.test(privateKeyWIF)) {
                    alert("Invalid private key format.");
                    return;
                }

                const privateKeyBytes = base58Decode(privateKeyWIF).slice(1, 33);
                const privateKeyHex = Array.from(privateKeyBytes, byte => byte.toString(16).padStart(2, '0')).join('');

                const EC = elliptic.ec;
                const ec = new EC('secp256k1');
                const keyPair = ec.keyFromPrivate(privateKeyHex);
                const publicKey = keyPair.getPublic(true, 'hex');

                const publicKeyHash = ripemd160(sha256(publicKey));
                const addressWithPrefix = '1e' + publicKeyHash;
                const checksum = sha256(sha256(addressWithPrefix)).slice(0, 8);
                const address = base58Encode(hexToBytes(addressWithPrefix + checksum));

                document.getElementById('wallet-address').textContent = address;

                localStorage.setItem('address', address);
                localStorage.setItem('privateKey', privateKeyWIF);
                localStorage.removeItem('mnemonic');
                localStorage.setItem('publicKey', publicKey);
                importPublicKey(publicKey);
            }
        } else if (restoreOption === 'mnemonic') {
            mnemonic = document.getElementById('restore-mnemonic').value;
            if (mnemonic) {
                // Validate mnemonic format
                if (!mnemonicRegex.test(mnemonic)) {
                    alert("Invalid mnemonic format.");
                    return;
                }

                const seed = mnemonicToSeed(mnemonic);
                const path = "m/44'/3'/0'/0/0";
                const masterKey = bip32MasterKeyFromSeed(seed);
                const derivedKey = deriveKeyFromPath(masterKey, path);

                const privateKeyHex = derivedKey.privateKey;

                const EC = elliptic.ec;
                const ec = new EC('secp256k1');
                const keyPair = ec.keyFromPrivate(privateKeyHex);
                const publicKey = keyPair.getPublic(true, 'hex');

                const publicKeyHash = ripemd160(sha256(publicKey));
                const addressWithPrefix = '1e' + publicKeyHash;
                const checksum = sha256(sha256(addressWithPrefix)).slice(0, 8);
                const address = base58Encode(hexToBytes(addressWithPrefix + checksum));

                const privateKeyWithPrefix = '9e' + privateKeyHex + '01';
                const privateKeyChecksum = sha256(sha256(privateKeyWithPrefix)).slice(0, 8);
                const privateKeyWIF = base58Encode(hexToBytes(privateKeyWithPrefix + privateKeyChecksum));

                document.getElementById('wallet-address').textContent = address;

                localStorage.setItem('address', address);
                localStorage.setItem('privateKey', privateKeyWIF);
                localStorage.setItem('mnemonic', mnemonic);
                localStorage.setItem('publicKey', publicKey);
                importPublicKey(publicKey);
            }
        }

        document.getElementById('generate-keys-button').style.display = 'none';
        document.getElementById('restore-wallet').style.display = 'none';
        document.getElementById('sign-out-button').style.display = 'block';
        document.getElementById('selfcustody-send-form').style.display = 'block';

        const storedAddress = localStorage.getItem('address');
        if (storedAddress) {
            await updateBalance(storedAddress);
            await fetchUTXOs(storedAddress); // Fetch UTXOs for restored wallet
        }
    } catch (error) {
        console.error('Error restoring wallet:', error);
    }
    location.reload();
}



async function importPublicKey(publicKey) {
    console.log("Public Key passed to importPublicKey:", publicKey);

    if (!publicKey) {
        console.error("No public key provided.");
        return;
    }

    try {
        const response = await fetch('import_public_key.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `publicKey=${encodeURIComponent(publicKey)}`
        });
        const result = await response.json();
        if (result.success) {
            console.log(result.message);
        } else {
            console.error(result.message);
        }
    } catch (error) {
        console.error('Error importing public key:', error);
    }
}

function signOutSelfCustody() {
    // Remove all relevant items from localStorage
    localStorage.removeItem('address');
    localStorage.removeItem('privateKey');
    localStorage.removeItem('mnemonic');
    localStorage.removeItem('publicKey');
    localStorage.removeItem('balance');
    localStorage.removeItem('utxos');

    for (let key in localStorage) {
        if (key !== "initialized") {
            localStorage.removeItem(key);
        }
    }

    document.getElementById('wallet-address').textContent = '';
    document.getElementById('balance').style.display = 'none';
    document.getElementById('selfCustodyQrCode').src = '';
    document.getElementById('selfCustodyQrCode').style.display = 'none';

    document.getElementById('generate-keys-button').style.display = 'block';
    document.getElementById('restore-wallet').style.display = 'block';
    document.getElementById('sign-out-button').style.display = 'none';
    document.getElementById('selfcustody-send-form').style.display = 'none';

    location.reload();
}

async function fetchUTXOs(address) {
    try {
        const response = await fetch('fetch_unspent_tx.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `address=${encodeURIComponent(address)}`
        });
        const result = await response.json();

        console.log("Fetched UTXOs:", result);
        
        if (result.success) {
            // Store the full UTXO information including scriptPubKey
            localStorage.setItem('utxos', JSON.stringify(result.utxos));
            displayUTXOs(result.utxos);
        }
    } catch (error) {
        console.error('Error fetching UTXOs:', error);
    }
}


let currentPage = 1;
const itemsPerPage = 5;

function displayUTXOs(utxos) {
    const utxoContainer = document.getElementById('unspentTx');
    utxoContainer.innerHTML = ''; 

    if (!utxos || utxos.length === 0) {
        utxoContainer.innerHTML = '<p>No UTXOs available.</p>';
        return;
    }

    const totalItems = utxos.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    for (let i = startIndex; i < endIndex; i++) {
        const utxo = utxos[i];
        const utxoElement = document.createElement('div');
        utxoElement.className = 'utxo-item'; 
        utxoElement.id = `utxo-${i}`; 

        utxoElement.innerHTML = `
            <div class="utxo-row">
                <span class="utxo-label">Transaction ID:</span>
                <span class="utxo-value" id="utxo-txid-${i}">${utxo.txid}</span>
            </div>
            <div class="utxo-row">
                <span class="utxo-label">Vout:</span>
                <span class="utxo-value" id="utxo-vout-${i}">${utxo.vout}</span>
            </div>
            <div class="utxo-row">
                <span class="utxo-label">Address:</span>
                <span class="utxo-value" id="utxo-address-${i}">${utxo.address}</span>
            </div>
            <div class="utxo-row">
                <span class="utxo-label">Amount:</span>
                <span class="utxo-value" id="utxo-amount-${i}">${utxo.amount} DOGE</span>
            </div>
            <div class="utxo-row">
                <span class="utxo-label">Confirmations:</span>
                <span class="utxo-value" id="utxo-confirmations-${i}">${utxo.confirmations}</span>
            </div>
            <div class="utxo-row">
                <span class="utxo-label">Spendable:</span>
                <span class="utxo-value" id="utxo-spendable-${i}">${utxo.spendable ? 'Yes' : 'No'}</span>
            </div>
            <div class="utxo-row">
                <span class="utxo-label">Solvable:</span>
                <span class="utxo-value" id="utxo-solvable-${i}">${utxo.solvable ? 'Yes' : 'No'}</span>
            </div>
            <hr>
        `;

        utxoContainer.appendChild(utxoElement);
    }

    const itemsToAdd = itemsPerPage - (endIndex - startIndex);
    for (let j = 0; j < itemsToAdd; j++) {
        const placeholderElement = document.createElement('div');
        placeholderElement.className = 'utxo-item placeholder-item';
        utxoContainer.appendChild(placeholderElement);
    }

    addPaginationControls(totalPages);
}

function addPaginationControls(totalPages) {
    const utxoContainer = document.getElementById('unspentTx');
    const paginationElement = document.createElement('div');
    paginationElement.className = 'pagination-controls';

    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.addEventListener('click', () => {
            currentPage--;
            displayUTXOs(JSON.parse(localStorage.getItem('utxos')));
        });
        paginationElement.appendChild(prevButton);
    }

    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.addEventListener('click', () => {
            currentPage++;
            displayUTXOs(JSON.parse(localStorage.getItem('utxos')));
        });
        paginationElement.appendChild(nextButton);
    }

    utxoContainer.appendChild(paginationElement);
}




function createRawTransaction(fromAddress, toAddress, amount, utxos, feeRate, websiteFee, websiteFeeAddress) {
    let selectedUTXOs = [];
    let totalInputAmount = 0;
    let estimatedFee = 0;
    let estimatedInputs = 0;
    const estimatedFeePerInput = 148;
    const estimatedFeePerOutput = 34;
    const estimatedTxOverhead = 10;

    const targetAmount = amount + websiteFee;

    // Sort UTXOs by amount (descending order)
    utxos.sort((a, b) => b.amount - a.amount);

    console.log(`Target Amount: ${targetAmount}, Fee Rate: ${feeRate}`);

    // Select UTXOs until target amount + estimated fee is met
    for (let utxo of utxos) {
        selectedUTXOs.push(utxo);
        totalInputAmount += utxo.amount;
        estimatedInputs++;
        estimatedFee = estimateFee(estimatedInputs, 3, feeRate, estimatedFeePerInput, estimatedFeePerOutput, estimatedTxOverhead);

        console.log(`Selected UTXO: ${JSON.stringify(utxo)}, Total Input Amount: ${totalInputAmount}, Estimated Fee: ${estimatedFee}`);

        if (totalInputAmount >= targetAmount + estimatedFee) {
            break;
        }
    }

    // Verify if the total input covers the target amount + fees
    if (totalInputAmount < targetAmount + estimatedFee) {
        throw new Error("Insufficient funds to cover the transaction amount and fees.");
    }

    // Prepare the inputs and outputs
    const inputs = selectedUTXOs.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout,
        scriptPubKey: utxo.scriptPubKey,  // Ensure scriptPubKey is included
    }));

    const outputs = {};
    outputs[toAddress] = amount;
    outputs[websiteFeeAddress] = websiteFee;

    const change = totalInputAmount - amount - websiteFee - estimatedFee;
    if (change > 0) {
        outputs[fromAddress] = change;
    }

    console.log(`Final Inputs: ${JSON.stringify(inputs)}, Final Outputs: ${JSON.stringify(outputs)}`);

    const rawTx = {
        inputs: inputs,
        outputs: outputs
    };

    return {
        rawTx: rawTx,
        inputs: inputs,
        outputs: outputs,
        exactFee: estimatedFee
    };
}



function estimateFee(numInputs, numOutputs, feeRate, feePerInput = 148, feePerOutput = 34, txOverhead = 10) {
    // Reduce the per-input and per-output size slightly to lower the overall fee
    const adjustedFeePerInput = feePerInput - 20;  // Adjust based on your experience
    const adjustedFeePerOutput = feePerOutput - 10;  // Adjust based on your experience

    // Calculate the transaction size
    const txSize = (numInputs * adjustedFeePerInput) + (numOutputs * adjustedFeePerOutput) + txOverhead;

    // Calculate the fee based on the transaction size and fee rate
    const fee = (txSize / 1000) * feeRate;  // Fee rate is per kilobyte

    // Ensure the fee is not excessively high
    const minFee = 0.001; // Set a minimum fee
    const maxFee = Math.min(fee, feeRate);  // Ensure fee does not exceed a reasonable maximum

    return Math.max(fee, minFee);
}


function serializeTransaction(rawTx) {
    let serialized = '';
    serialized += intToBytesLE(1, 4);
    serialized += varIntToBytes(rawTx.inputs.length);

    rawTx.inputs.forEach(input => {
        serialized += reverseHex(input.txid);
        serialized += intToBytesLE(input.vout, 4);
        serialized += varIntToBytes(0);
        serialized += intToBytesLE(0xffffffff, 4);
    });

    serialized += varIntToBytes(Object.keys(rawTx.outputs).length);
    for (const [address, amount] of Object.entries(rawTx.outputs)) {
        serialized += intToBytesLE(Math.round(amount * 1e8), 8);
        const scriptPubKey = createScriptPubKey(address);
        serialized += varIntToBytes(scriptPubKey.length / 2);
        serialized += scriptPubKey;
    }

    serialized += intToBytesLE(0, 4);
    return serialized;
}

function createScriptPubKey(address) {
    const decoded = base58Decode(address);
    const prefixRemoved = decoded.slice(1, -4);
    const scriptPubKey = '76a914' + CryptoJS.enc.Hex.stringify(CryptoJS.lib.WordArray.create(prefixRemoved)) + '88ac';
    return scriptPubKey;
}

function intToBytesLE(num, bytes) {
    let arr = new ArrayBuffer(bytes);
    let view = new DataView(arr);
    for (let i = 0; i < bytes; i++) {
        view.setUint8(i, num & 0xff);
        num >>= 8;
    }
    return Array.from(new Uint8Array(arr), byte => byte.toString(16).padStart(2, '0')).join('');
}

function varIntToBytes(num) {
    if (num < 0xfd) {
        return num.toString(16).padStart(2, '0');
    } else if (num <= 0xffff) {
        return 'fd' + intToBytesLE(num, 2);
    } else if (num <= 0xffffffff) {
        return 'fe' + intToBytesLE(num, 4);
    } else {
        return 'ff' + intToBytesLE(num, 8);
    }
}

function reverseHex(hex) {
    return hex.match(/.{2}/g).reverse().join('');
}

function base58Encode(bytes) {
    const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const BASE = ALPHABET.length;

    let num = BigInt('0x' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(''));
    let encoded = '';

    while (num > 0) {
        const remainder = Number(num % BigInt(BASE));
        num = num / BigInt(BASE);
        encoded = ALPHABET[remainder] + encoded;
    }

    for (const byte of bytes) {
        if (byte === 0x00) {
            encoded = ALPHABET[0] + encoded;
        } else {
            break;
        }
    }

    return encoded;
}

function base58Decode(base58) {
    const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const BASE = ALPHABET.length;

    let num = BigInt(0);
    for (const char of base58) {
        num = num * BigInt(BASE) + BigInt(ALPHABET.indexOf(char));
    }

    const hex = num.toString(16);
    const padding = base58.match(/^1*/)[0].length;
    return new Uint8Array(Array(padding + Math.ceil(hex.length / 2)).fill(0).map((_, i) => {
        return i < padding ? 0 : parseInt(hex.substr((i - padding) * 2, 2), 16);
    }));
}

function sha256(data) {
    return CryptoJS.SHA256(CryptoJS.enc.Hex.parse(data)).toString(CryptoJS.enc.Hex);
}

function ripemd160(data) {
    return CryptoJS.RIPEMD160(CryptoJS.enc.Hex.parse(data)).toString(CryptoJS.enc.Hex);
}

function mnemonicToSeed(mnemonic, password = '') {
    const mnemonicBuffer = CryptoJS.enc.Utf8.parse(mnemonic);
    const saltBuffer = CryptoJS.enc.Utf8.parse('mnemonic' + password);
    const key = CryptoJS.PBKDF2(mnemonicBuffer, saltBuffer, {
        keySize: 512 / 32,
        iterations: 2048,
        hasher: CryptoJS.algo.SHA512
    });
    return CryptoJS.enc.Hex.stringify(key);
}

function entropyToMnemonic(entropyHex) {
    const entropyBytes = hexToBytes(entropyHex);
    const entropyBinary = entropyBytes.map(byte => byte.toString(2).padStart(8, '0')).join('');
    const checksumBinary = calculateChecksumBits(entropyBytes);
    const bits = entropyBinary + checksumBinary;
    const chunks = bits.match(/(.{1,11})/g);
    return chunks.map(binary => WORDLIST[parseInt(binary, 2)]).join(' ');
}

function calculateChecksumBits(entropyBytes) {
    const hash = sha256(entropyBytes.map(byte => String.fromCharCode(byte)).join(''));
    const hashBytes = hexToBytes(hash);
    const checksumLength = entropyBytes.length / 4;
    return hashBytes[0].toString(2).padStart(8, '0').slice(0, checksumLength);
}

function bip32MasterKeyFromSeed(seed) {
    const I = CryptoJS.HmacSHA512(CryptoJS.enc.Hex.parse(seed), 'Bitcoin seed');
    const IL = I.toString(CryptoJS.enc.Hex).slice(0, 64);
    const IR = I.toString(CryptoJS.enc.Hex).slice(64);
    return {
        privateKey: IL,
        chainCode: IR
    };
}
function deriveKeyFromPath(masterKey, path) {
    const EC = elliptic.ec;
    const ec = new EC('secp256k1');
    
    let key = masterKey;
    const segments = path.split('/').slice(1).map(segment => {
        if (segment.endsWith("'")) {
            return parseInt(segment.slice(0, -1)) + 0x80000000;
        }
        return parseInt(segment);
    });

    for (let segment of segments) {
        const data = new Uint8Array(37);
        data.set([0]);
        data.set(hexToBytes(key.privateKey), 1);
        data.set(new Uint8Array(new Uint32Array([segment]).buffer).reverse(), 33);
        
        const I = CryptoJS.HmacSHA512(CryptoJS.enc.Hex.parse(dataToHexString(data)), CryptoJS.enc.Hex.parse(key.chainCode));
        const IL = I.toString(CryptoJS.enc.Hex).slice(0, 64);
        const IR = I.toString(CryptoJS.enc.Hex).slice(64);

        const childPrivateKey = ec.keyFromPrivate(IL).getPrivate().add(ec.keyFromPrivate(key.privateKey).getPrivate()).mod(ec.curve.n);
        key = {
            privateKey: childPrivateKey.toString('hex'),
            chainCode: IR
        };
    }

    return key;
}
function dataToHexString(data) {
    return Array.prototype.map.call(data, function(byte) {
        return ('0' + byte.toString(16)).slice(-2);
    }).join('');
}
function generateQrCode(address, qrContainer) {
    if (address) {
        qrContainer.innerHTML = ""; 

        // Directly generate the QR code as an image
        const qrCode = new QRCode(qrContainer, {
            text: address,
            width: 128,
            height: 128
        });

        setTimeout(() => {
            const imgElement = qrContainer.querySelector('img');
            if (imgElement && imgElement.complete && imgElement.naturalHeight !== 0) {
                const src = imgElement.src;
                imgElement.src = ''; // Temporarily clear the src
                imgElement.src = src; // Re-set src to force re-render if needed
                qrContainer.style.display = 'block';
            } else {
                console.error("Failed to render QR code image in Chrome.");
            }
        }, 100);
    } else {
        alert('No address found to generate QR Code.');
    }
}



async function createAndDisplayRawTransaction() {
    const fromAddress = localStorage.getItem('address');
    const privateKey = localStorage.getItem('privateKey');
    const utxos = JSON.parse(localStorage.getItem('utxos'));
    const toAddress = document.getElementById('selfcustody-to_address').value;
    const amount = parseFloat(document.getElementById('selfcustody-amount').value);
    const feeRate = parseFloat(document.getElementById('selfcustody-feeRate').value);
    const supportDeveloper = document.getElementById('supportDeveloper').checked; // Check the toggle state

    const websiteFee = supportDeveloper ? 0.1 : 0; // Only add website fee if the toggle is selected
    const websiteFeeAddress = "DNdH2MUAYyuToe87ndFhVXXoDTUSpE1peq";

    console.log("From Address:", fromAddress);
    console.log("Private Key:", privateKey);
    console.log("UTXOs:", utxos);
    console.log("To Address:", toAddress);
    console.log("Amount:", amount);
    console.log("Fee Rate:", feeRate);
    console.log("Support Developer:", supportDeveloper);

    if (!fromAddress || !privateKey || !utxos || !toAddress || !amount || !feeRate) {
        alert('Missing necessary information to create transaction.');
        return;
    }

    try {
        const transactionData = createRawTransaction(
            fromAddress, 
            toAddress, 
            amount, 
            utxos, 
            feeRate, 
            websiteFee, 
            websiteFeeAddress
        );
        console.log("Transaction Data:", transactionData);
        const rawTxHex = serializeTransaction(transactionData.rawTx);
        console.log("Raw Transaction Hex:", rawTxHex);

        // Store the selected UTXOs (used as inputs) for signing
        localStorage.setItem('selectedUTXOs', JSON.stringify(transactionData.inputs)); // Store only selected inputs

        document.getElementById('raw-transaction-hex').textContent = rawTxHex;
        document.getElementById('raw-transaction-hex').style.display = 'block';
    } catch (error) {
        console.error('Error creating transaction:', error);
    }
}

function createRawTransaction(fromAddress, toAddress, amount, utxos, feeRate, websiteFee, websiteFeeAddress) {
    let selectedUTXOs = [];
    let totalInputAmount = 0;
    let estimatedFee = 0;
    let estimatedInputs = 0;
    const estimatedFeePerInput = 148;
    const estimatedFeePerOutput = 34;
    const estimatedTxOverhead = 10;

    const targetAmount = amount + (websiteFee > 0 ? websiteFee : 0);

    // Sort UTXOs by amount (descending order)
    utxos.sort((a, b) => b.amount - a.amount);

    console.log(`Target Amount: ${targetAmount}, Fee Rate: ${feeRate}`);

    // Select UTXOs until target amount + estimated fee is met
    for (let utxo of utxos) {
        selectedUTXOs.push(utxo);
        totalInputAmount += utxo.amount;
        estimatedInputs++;
        estimatedFee = estimateFee(estimatedInputs, websiteFee > 0 ? 3 : 2, feeRate, estimatedFeePerInput, estimatedFeePerOutput, estimatedTxOverhead);

        console.log(`Selected UTXO: ${JSON.stringify(utxo)}, Total Input Amount: ${totalInputAmount}, Estimated Fee: ${estimatedFee}`);

        if (totalInputAmount >= targetAmount + estimatedFee) {
            break;
        }
    }

    // Verify if the total input covers the target amount + fees
    if (totalInputAmount < targetAmount + estimatedFee) {
        throw new Error("Insufficient funds to cover the transaction amount and fees.");
    }

    // Prepare the inputs and outputs
    const inputs = selectedUTXOs.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout,
        scriptPubKey: utxo.scriptPubKey,  // Ensure scriptPubKey is included
    }));

    const outputs = {};

    // Handle the main output (sending amount)
    if (outputs[toAddress]) {
        outputs[toAddress] += amount;
    } else {
        outputs[toAddress] = amount;
    }

    // Conditionally add the website fee output
    if (websiteFee > 0) {
        if (outputs[websiteFeeAddress]) {
            outputs[websiteFeeAddress] += websiteFee;
        } else {
            outputs[websiteFeeAddress] = websiteFee;
        }
    }

    // Calculate and handle the change output
    const change = totalInputAmount - amount - (websiteFee > 0 ? websiteFee : 0) - estimatedFee;
    if (change > 0) {
        if (outputs[fromAddress]) {
            outputs[fromAddress] += change;
        } else {
            outputs[fromAddress] = change;
        }
    }

    console.log(`Final Inputs: ${JSON.stringify(inputs)}, Final Outputs: ${JSON.stringify(outputs)}`);

    const rawTx = {
        inputs: inputs,
        outputs: outputs
    };

    return {
        rawTx: rawTx,
        inputs: inputs,
        outputs: outputs,
        exactFee: estimatedFee
    };
}



async function signAndBroadcastTransaction() {
    const rawTxHex = document.getElementById('raw-transaction-hex').textContent;
    const privKey = localStorage.getItem('privateKey');
    const selectedUTXOs = JSON.parse(localStorage.getItem('selectedUTXOs'));
    console.log("Running signAndBroadcast");

    if (!rawTxHex || !privKey || !selectedUTXOs || selectedUTXOs.length === 0) {
        alert('Missing necessary data (rawTxHex, privKey, or selected UTXOs) to sign the transaction.');
        return;
    }

    const prevTxs = selectedUTXOs.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout,
        scriptPubKey: utxo.scriptPubKey  // Include scriptPubKey here
    }));

    try {
        console.log("Sending raw transaction for signing and broadcasting:", rawTxHex);
        const response = await fetch('broadcastAndSign.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `rawTxHex=${encodeURIComponent(rawTxHex)}&privKeys=${encodeURIComponent(JSON.stringify([privKey]))}&prevTxs=${encodeURIComponent(JSON.stringify(prevTxs))}`
        });

        const result = await response.json();
        console.log("Backend Response:", result);

        if (result.success) {
            console.log("Transaction broadcasted successfully. TXID:", result.txid);
            document.getElementById('broadcast-result').textContent = `Transaction broadcasted successfully. TXID: ${result.txid}`;
        } else {
            console.error("Error broadcasting transaction:", result.error);
            document.getElementById('broadcast-result').textContent = `Error broadcasting transaction: ${result.error}`;

            // Display parameters for debugging
            document.getElementById('broadcast-result').textContent += `
                Raw Tx Hex: ${result.rawTxHex}
                Previous Transactions: ${JSON.stringify(result.prevTxs, null, 2)}
                Private Keys: ${JSON.stringify(result.privKeys, null, 2)}
                Signed Tx: ${result.signedTx ? JSON.stringify(result.signedTx, null, 2) : 'N/A'}
            `;
        }

        document.getElementById('broadcast-result').style.display = 'block';
    } catch (error) {
        console.error('Error signing and broadcasting transaction:', error);
        document.getElementById('broadcast-result').textContent = `Error: ${error.message}`;
        document.getElementById('broadcast-result').style.display = 'block';
    }
}
document.addEventListener("DOMContentLoaded", function () {
    // Modal elements for secrets
    var secretsModal = document.getElementById("showSecretsModal");
    var showSecretsBtn = document.getElementById("show-secrets-button");
    var closeSecretsModal = document.getElementById("closeSecretsModal");
    var confirmBtn = document.getElementById("confirm-show-secrets");
    var cancelBtn = document.getElementById("cancel-show-secrets");
    var secretsDisplay = document.getElementById("secretsDisplay");

    // QR Code Modal Elements
    const qrContainer = document.getElementById("selfCustodyQrCode");
    const qrModal = document.getElementById("qrCodeModal");
    const qrCloseModal = document.getElementById("closeQrModal");
    const modalContent = document.getElementById("qrModalContent");

    // Show secrets modal
    showSecretsBtn.onclick = function () {
        resetSecretsModal();
        secretsModal.style.display = "block";
    };

    // Close secrets modal and reset
    closeSecretsModal.onclick = function () {
        resetSecretsModal();
        secretsModal.style.display = "none";
    };

    cancelBtn.onclick = function () {
        secretsModal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target === secretsModal) {
            resetSecretsModal();
            secretsModal.style.display = "none";
        }
        if (event.target === qrModal) {
            qrModal.style.display = "none";
        }
    };

    confirmBtn.onclick = function () {
        displaySecrets();
        confirmBtn.style.display = "none";
        cancelBtn.style.display = "none";
    };

    // Display secrets with labels and copy-on-click
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

    // Reset the secrets modal
    function resetSecretsModal() {
        confirmBtn.style.display = "block";
        cancelBtn.style.display = "block";
        secretsDisplay.style.display = "none";
        document.getElementById("privateKeyDisplay").textContent = "";
        document.getElementById("mnemonicDisplay").textContent = "";
        document.getElementById("publicKeyDisplay").textContent = "";
    }

    // QR Code modal
    qrContainer.addEventListener("click", function () {
        const qrImage = qrContainer.querySelector('img');
        if (qrImage && qrImage.src) {
            modalContent.src = qrImage.src; // Set the enlarged image source
            qrModal.style.display = "flex";
        } else {
            console.error("QR Code image not found or not loaded.");
        }
    });

    qrCloseModal.onclick = function () {
        qrModal.style.display = "none";
    };
});








