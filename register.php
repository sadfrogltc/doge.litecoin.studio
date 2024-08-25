<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once('user.php');

$registration_success = null;
$registration_error = null;

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = trim($_POST['username']);
    $username = filter_var($username, FILTER_SANITIZE_FULL_SPECIAL_CHARS);

    if (empty($username)) {
        $registration_error = "Username is required.";
    } elseif (strlen($username) < 4 || strlen($username) > 20) {
        $registration_error = "Username must be between 4 and 20 characters.";
    } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        $registration_error = "Username can only contain letters, numbers, and underscores.";
    }

    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    if (empty($password) || empty($confirm_password)) {
        $registration_error = "Password and confirmation are required.";
    } elseif ($password !== $confirm_password) {
        $registration_error = "Passwords do not match.";
    } elseif (strlen($password) < 6) {
        $registration_error = "Password must be at least 6 characters long.";
    }

    if (empty($registration_error)) {
        $user = new User();
        if ($user->register($username, $password, $confirm_password)) {
            $registration_success = "Registration successful. <h4><a href='login.php' class='login-link'>LOG IN NOW!</a></h4>";
        } else {
            $registration_error = "Registration failed.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Register</title>
    <?php include("dynamicStyle.php"); ?>
</head>
<body>
<?php include('banner.php'); ?>
<div class="container">
    <h2>Register | Doge Wallet</h2>
    <?php if ($registration_success): ?>
        <p><?php echo $registration_success; ?></p>
    <?php elseif ($registration_error): ?>
        <p><?php echo $registration_error; ?></p>
    <?php endif; ?>
    <form method="post" action="register.php">
        <label for="username">Username:</label>
        <input type="text" name="username" id="username" required <?php if ($registration_success) echo "disabled"; ?>>
        <br>
        <br>
        <label for="password">Password:</label>
        <input type="password" name="password" id="password" required <?php if ($registration_success) echo "disabled"; ?>>
        <br>
        <label for="confirm_password">Confirm Password:</label>
        <input type="password" name="confirm_password" id="confirm_password" required <?php if ($registration_success) echo "disabled"; ?>>
        <br>
        <input type="submit" value="Register" <?php if ($registration_success) echo "disabled"; ?>>
    </form>
    <p>Already have an account? <a href="login.php">Log in</a></p>
</div>
<?php include('footer.php');?>
</body>
</html>
