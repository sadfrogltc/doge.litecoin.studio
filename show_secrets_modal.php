<div id="showSecretsModal" class="modal">
    <div class="modal-content">
        <span id="closeSecretsModal" class="close">&times;</span>
        <h2>Are you sure you want to see your private keys?</h2>
        <p>Displaying your private keys and mnemonic phrase (if available) is sensitive. Make sure you're in a secure environment.</p>
        
        <button id="confirm-show-secrets">YES, SHOW SECRETS</button>
        <button class="modal-button" id="cancel-show-secrets">CANCEL</button>

        <div id="secretsDisplay" style="display:none;">
            <h3>Your Secrets</h3>
            <p id="privateKeyDisplay" class="truncated-text">No Private Key Available</p>
            <p id="mnemonicDisplay" class="truncated-text">No Mnemonic Available</p>
            <p id="publicKeyDisplay" class="truncated-text">No PubKey Available</p>
        </div>
    </div>
</div>
