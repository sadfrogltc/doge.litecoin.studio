<?php echo "
    <p>Dogecoin Self-Custody node.</p>
    <br>
    Created by SadFrogLTC
    <br>
    <br>
    <a href='#' onclick='openFaqModal()'>FAQ</a>
"; ?>

<!-- FAQ Modal Structure -->
<div id="faqModal" class="modal">
    <div class="modal-content">
        <span class="close" onclick="closeFaqModal()">&times;</span>
        
        <h2>Frequently Asked Questions (FAQ)</h2>
        <br>
        <h3>1. What is this application?</h3>
        <p>This is a self-custody Dogecoin wallet application designed to allow users to manage their Dogecoin securely without relying on third-party custodians.</p>
        <br>
        <h3>2. What are the goals of this application?</h3>
        <p>The primary goal is to provide a secure, easy-to-use platform for managing Dogecoin, where users have complete control over their private keys and funds.</p>
        <br>
        <h3>3. How secure is this application?</h3>
        <p>The application is designed with security as a top priority. It performs all cryptographic operations client-side, ensuring that your private keys are only processed for signing transactions and never stored or imported into any external node or server. They are not retained by any external systems. The application does not store your private keys or mnemonics on any server, ensuring that only you have control over your funds. However, it is crucial to ensure that your device is secure and free from malware, as this could compromise your wallet.</p>
        <br>
        <h3>4. What risks are associated with this application?</h3>
        <p>The main risks involve the security of your device. If your device is compromised by malware or other threats, your private keys could be exposed. Always ensure that your device is secure and that you follow best practices for online security.</p>
        <br>
        <h3>5. What happens if I lose my private key or mnemonic?</h3>
        <p>If you lose your private key or mnemonic, you will lose access to your Dogecoin. It is vital to keep your private key and mnemonic safe and secure, as they are the only means to access and recover your wallet.</p>
        <br>
        <h3>6. Can I recover my wallet if I lose my device?</h3>
        <p>Yes, as long as you have your mnemonic or private key, you can restore your wallet on any compatible device.</p>
        <br>
        <h3>7. Are there any fees associated with using this application?</h3>
        <p>There is a small website fee for using services, such as processing transactions, and network fees paid to miners for securing the Dogecoin network. For example, doge.litecoin.studio charges a 0.1 Đ fee to help maintain the app.</p>
    </div>
</div>

<script>
function openFaqModal() {
    document.getElementById('faqModal').style.display = 'block';
}

function closeFaqModal() {
    document.getElementById('faqModal').style.display = 'none';
}

// Close the modal when the user clicks outside of it
window.onclick = function(event) {
    var modal = document.getElementById('faqModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}
</script>
