<?php
// Security Headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

require '../config.php';

session_start();

// Rate Limiting - Prevent Brute Force
$max_attempts = 5;
$lockout_time = 900; // 15 minutes
$ip = $_SERVER['REMOTE_ADDR'];

// Check if IP is locked out
if (isset($_SESSION['login_attempts'][$ip])) {
    $attempts = $_SESSION['login_attempts'][$ip];
    
    if ($attempts['count'] >= $max_attempts) {
        $time_passed = time() - $attempts['last_attempt'];
        
        if ($time_passed < $lockout_time) {
            $remaining = ceil(($lockout_time - $time_passed) / 60);
            http_response_code(429);
            echo json_encode([
                'error' => "Muitas tentativas. Tente novamente em $remaining minutos.",
                'locked' => true
            ]);
            exit;
        } else {
            // Reset after lockout period
            unset($_SESSION['login_attempts'][$ip]);
        }
    }
}

$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

// Input Validation
if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Usuário e senha obrigatórios']);
    exit;
}

// Sanitize username (prevent SQL injection attempts)
if (!preg_match('/^[a-zA-Z0-9_]{3,50}$/', $username)) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato de usuário inválido']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, password_hash, role, empresas, can_register FROM usuarios WHERE username = :username");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Successful login - Reset attempts
        unset($_SESSION['login_attempts'][$ip]);
        
        // Regenerate session ID to prevent session fixation
        session_regenerate_id(true);
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $username;
        $_SESSION['role'] = $user['role'];
        $_SESSION['can_register'] = (bool)$user['can_register'];
        $_SESSION['empresas'] = $user['empresas'] ? json_decode($user['empresas'], true) : [];
        $_SESSION['login_time'] = time();
        $_SESSION['last_activity'] = time();
        
        // Log successful login
        file_put_contents('../debug.log', date('Y-m-d H:i:s') . " - Login bem-sucedido: $username (IP: $ip)\n", FILE_APPEND);

        echo json_encode([
            'result' => 'success',
            'role' => $user['role'],
            'can_register' => (bool)$user['can_register']
        ]);
    } else {
        // Failed login - Track attempts
        if (!isset($_SESSION['login_attempts'][$ip])) {
            $_SESSION['login_attempts'][$ip] = ['count' => 0, 'last_attempt' => time()];
        }
        
        $_SESSION['login_attempts'][$ip]['count']++;
        $_SESSION['login_attempts'][$ip]['last_attempt'] = time();
        
        $remaining_attempts = $max_attempts - $_SESSION['login_attempts'][$ip]['count'];
        
        // Log failed attempt
        file_put_contents('../debug.log', date('Y-m-d H:i:s') . " - Tentativa de login falhou: $username (IP: $ip)\n", FILE_APPEND);
        
        http_response_code(401);
        
        if ($remaining_attempts > 0) {
            echo json_encode([
                'error' => "Credenciais inválidas. Você tem $remaining_attempts tentativa(s) restante(s)."
            ]);
        } else {
            echo json_encode([
                'error' => "Conta bloqueada por 15 minutos devido a múltiplas tentativas falhas.",
                'locked' => true
            ]);
        }
    }

} catch (PDOException $e) {
    // Log error without exposing details
    file_put_contents('../debug.log', date('Y-m-d H:i:s') . " - Erro de BD no login: " . $e->getMessage() . "\n", FILE_APPEND);
    
    http_response_code(500);
    echo json_encode(['error' => 'Erro no servidor. Tente novamente mais tarde.']);
}
?>
