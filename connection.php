<?php
class Database {
    private static $instance = null;
    private $db;

    private function __construct($host, $dbname, $username, $password) {
        try {
            $this->db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }

    public static function getInstance($host, $dbname, $username, $password) {
        if (self::$instance === null) {
            self::$instance = new Database($host, $dbname, $username, $password);
        }
        return self::$instance->db;
    }
}

// Database connection details
<you database variables here> 


function getDbConnection() {
    global $db_host, $db_name, $db_user, $db_password;
    return Database::getInstance($db_host, $db_name, $db_user, $db_password);
}
?>
