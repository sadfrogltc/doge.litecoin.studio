<?php
require_once('dogecoin.php');

function notifyUsers($message) {
    // Example function to send an alert to active users
    // Implement this function to suit your application's alert system
    echo "Notification: $message\n";
}

function scheduleRescan() {
    $dogecoin = new Dogecoin();

    // Notify users 5 minutes before the rescan
    $notifyTime = strtotime("01:30 PM");
    $currentTime = time();

    if ($currentTime >= $notifyTime && $currentTime < $notifyTime + 300) {
        notifyUsers("The website will be unavailable in 5 minutes for scheduled maintenance.");
        // Implement countdown logic on the frontend as needed
    }

    // Perform rescan at 2:00 AM
    $rescanTime = strtotime("01:35 PM");
    if ($currentTime >= $rescanTime && $currentTime < $rescanTime + 60) {
        $result = $dogecoin->rescan1year();
        echo "Rescan Result: " . print_r($result, true);
    }
}

// Run the schedule
scheduleRescan();
?>
