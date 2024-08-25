document.addEventListener("DOMContentLoaded", function() {
    startCountdown();
});

function startCountdown() {
    const maintenanceNotice = document.getElementById('maintenanceNotice');
    const countdownElement = document.getElementById('countdownElement');
    if (!maintenanceNotice || !countdownElement) {
        console.error('Maintenance notice or countdown element not found');
        return;
    }

    // Set the time for the rescan (e.g., 2:00 AM daily)
    const rescanHour = 2; // 2:00 AM
    const rescanMinute = 0; // 0 minutes

    // Get the current date and time
    const now = new Date();

    // Set the rescan time for today
    let rescanTime = new Date();
    rescanTime.setHours(rescanHour, rescanMinute, 0, 0);

    // If the rescan time has already passed today, set it for tomorrow
    if (now > rescanTime) {
        rescanTime.setDate(rescanTime.getDate() + 1);
    }

    // Calculate the difference in seconds
    let countdownTime = Math.floor((rescanTime - now) / 1000);

    // Show countdown only if within 30 minutes of maintenance
    const minutesUntilRescan = Math.floor(countdownTime / 60);
    if (minutesUntilRescan > 30) {
        maintenanceNotice.style.display = 'none'; // Hide the maintenance notice and countdown element if more than 30 minutes remain
        return;
    } else {
        maintenanceNotice.style.display = 'block'; // Show the maintenance notice and countdown element
    }

    const updateCountdown = () => {
        const hours = Math.floor(countdownTime / 3600);
        const minutes = Math.floor((countdownTime % 3600) / 60);
        const seconds = countdownTime % 60;

        countdownElement.textContent = `${hours}h ${minutes}m ${seconds}s`;

        if (countdownTime > 0) {
            countdownTime--;
        } else {
            clearInterval(countdownInterval);
            countdownElement.textContent = 'Maintenance in progress...';
        }
    };

    updateCountdown(); // Initial call to display the timer immediately
    const countdownInterval = setInterval(updateCountdown, 1000);
}
