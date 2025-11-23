<?php
// API para gerenciar educadores (usuários com role 'educador')
header('Content-Type: application/json');
require '../config.php';

session_start();

// Verificar se é admin ou suporte
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'suporte'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Listar todos os educadores
        $stmt = $pdo->query("SELECT id, username, role FROM usuarios WHERE role = 'educador' ORDER BY username");
        $educadores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($educadores);
        
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Criar novo educador
        if (isset($input['action']) && $input['action'] === 'create') {
            $username = trim($input['username'] ?? '');
            $password = $input['password'] ?? '';
            
            if (!$username || !$password) {
                http_response_code(400);
                echo json_encode(['error' => 'Usuário e senha obrigatórios']);
                exit;
            }
            
            // Verificar se já existe
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = :username");
            $stmt->execute([':username' => $username]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Usuário já existe']);
                exit;
            }
            
            // Criar
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO usuarios (username, password_hash, role) VALUES (:username, :password_hash, 'educador')");
            $stmt->execute([
                ':username' => $username,
                ':password_hash' => $password_hash
            ]);
            
            echo json_encode(['result' => 'success', 'id' => $pdo->lastInsertId()]);
            
        } elseif (isset($input['action']) && $input['action'] === 'delete') {
            // Deletar educador
            $id = $input['id'] ?? 0;
            
            $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = :id AND role = 'educador'");
            $stmt->execute([':id' => $id]);
            
            echo json_encode(['result' => 'success']);
        }
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
