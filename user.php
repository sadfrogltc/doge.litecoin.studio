<?php

require_once('dogecoin.php');
require_once('connection.php');
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

class User {
    private $db;

    public function __construct() {
        $this->db = getDbConnection();
    }

    // LOGIN FUNCTION
    public function login($username, $password) {
        $stmt = $this->db->prepare("SELECT * FROM Users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['username'] = $username;
            $_SESSION['dogecoin_address'] = $user['dogecoin_address'];
            return true;
        } else {
            return false;
        }
    }

    // REGISTRATION FUNCTIONS
    public function register($username, $password, $confirm_password) {
        global $registration_success, $registration_error;

        // Passwords match check is redundant here as it is done before calling this function

        if ($this->userExists($username)) {
            $registration_error = "Username already exists.";
            return false;
        } 

        if ($this->createUser($username, $password)) {
            $registration_success = "Registration successful. You can now log in.";
            return true;
        } else {
            $registration_error = "An error occurred during registration. Please try again.";
            return false;
        }
    }

    // CHECK IF USER EXISTS
    public function userExists($username) {
        $stmt = $this->db->prepare("SELECT * FROM Users WHERE username = ?");
        $stmt->execute([$username]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    // CREATE NEW USER
    public function createUser($username, $password) {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        $dogecoin = new Dogecoin();
        $dogecoin_address = $dogecoin->getNewAddress($username);
        $private_key = $dogecoin->dumpPrivKey($dogecoin_address);

        $stmt = $this->db->prepare("INSERT INTO Users (username, password, dogecoin_address, private_key) VALUES (?, ?, ?, ?)");
        return $stmt->execute([$username, $hashed_password, $dogecoin_address, $private_key]);
    }

    public function getPrivateKey($dogecoin_address) {
        $stmt = $this->db->prepare("SELECT private_key FROM Users WHERE dogecoin_address = ?");
        $stmt->execute([$dogecoin_address]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
        return $result ? $result['private_key'] : null;
    }


    

}

?>

 