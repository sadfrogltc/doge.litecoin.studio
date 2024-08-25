<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include the User class
require_once('user.php');

// Start a new session or resume the existing session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Process login form submission
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Create a new User object
    $user = new User();

    // Attempt to log in
    if ($user->login($username, $password)) {
        // If successful, redirect to the index page
        header('Location: index.php');
        exit;
    } else {
        // If login fails, display an error message
        echo "Invalid username or password.";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    <?php include("dynamicStyle.php"); ?>
</head>
<body>
    <div id='title'>DOGE.LITECOIN.STUDIO</div>
    <div class="container">
        <h2>Login | Doge Wallet</h2>
        <form method="post" action="login.php">
            <label for="username">Username:</label>
            <input type="text" name="username" id="username" required>
            <br>
            <br>
            <label for="password">Password:</label>
            <input type="password" name="password" id="password" required>
            <br>
            <input type="submit" value="Login">
        </form>
        <p>Don't have an account? <a href="register.php" class="register-link">Register</a></p>
        <br>
    </div>
    <?php include('footer.php'); ?>
</body>
</html>
