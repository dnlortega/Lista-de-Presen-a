<?php
// Security Headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

session_start();

// Session Timeout - 30 minutes
$timeout_duration = 1800;

if (isset($_SESSION['user_id'])) {
    // Check for session timeout
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > $timeout_duration) {
        session_unset();
        session_destroy();
        echo json_encode(['logged_in' => false, 'timeout' => true]);
        exit;
    }
    
    // Update last activity time
    $_SESSION['last_activity'] = time();
    
    echo json_encode([
        'logged_in' => true,
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role']
    ]);
} else {
    echo json_encode(['logged_in' => false]);
}
?>
