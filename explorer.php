<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'dogecoin.php';
include('banner.php');

$DOGECOIN = new Dogecoin();

// Handle search form submission
$search_result = null;
if (isset($_POST['search'])) {
    $query = $_POST['query'];

    if (ctype_digit($query)) {
        // Search by block height
        $blockhash = $DOGECOIN->getBlockHash((int)$query);
        if ($blockhash) {
            $search_result = $DOGECOIN->getBlock($blockhash);
        }
    } else {
        // Search by block or transaction hash
        $block = $DOGECOIN->getBlock($query);
        if ($block) {
            $search_result = $block;
        } else {
            $transaction = $DOGECOIN->getTransaction($query);
            if ($transaction) {
                $search_result = $transaction;
            }
        }
    }
}

function displayData($data) {
    $output = '<ul>';
    foreach ($data as $key => $value) {
        if (is_array($value)) {
            $output .= '<li>' . htmlspecialchars($key) . ': ' . displayData($value) . '</li>';
        } else {
            $output .= '<li>' . htmlspecialchars($key) . ': ' . htmlspecialchars($value) . '</li>';
        }
    }
    $output .= '</ul>';
    return $output;
}
?>
<!DOCTYPE html>
<html lang="en">
<?php
    include('banner.php');
    
    ?>
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    <?php include("dynamicStyle.php"); ?>
</head>

<body>
    <div class="container">
        <h1>Blockchain Explorer</h1>
        
        <form method="POST" action="explorer.php">
            <input type="text" name="query" placeholder="Enter block height, block hash, or transaction ID" required>
            <button type="submit" name="search">Search</button>
        </form>
        <form method="GET" action="index.php">
            <button type="submit" name="back">Back</button>
        </form>

        <?php if ($search_result): ?>
            <h2>Search Result</h2>
            <div class="search-result"><?php echo displayData($search_result); ?></div>
        <?php endif; ?>
    </div>
    <?php 
   
    include('footer.php');?>
</body>
</html>
