<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require '../config.php';
session_start();

// Verificar se é admin ou suporte
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'suporte'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Listar usuários e suas permissões
    $stmt = $pdo->query("SELECT id, username, role, can_register FROM usuarios WHERE role = 'educador' ORDER BY username");
    $users = $stmt->fetchAll();
    
    // Para cada usuário, buscar empresas permitidas
    foreach ($users as &$user) {
        $stmtEmpresas = $pdo->prepare("SELECT empresa FROM usuario_empresas WHERE usuario_id = :user_id");
        $stmtEmpresas->execute([':user_id' => $user['id']]);
        $user['empresas'] = $stmtEmpresas->fetchAll(PDO::FETCH_COLUMN);
        $user['can_register'] = (bool)$user['can_register']; // Cast to boolean
    }
    
    echo json_encode($users);

} elseif ($method === 'POST') {
    // Atualizar permissões de um usuário
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? null;
    $empresas = $input['empresas'] ?? [];
    $canRegister = isset($input['can_register']) ? (int)$input['can_register'] : 0;

    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id obrigatório']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Atualizar flag can_register
        $stmtUser = $pdo->prepare("UPDATE usuarios SET can_register = :can_register WHERE id = :user_id");
        $stmtUser->execute([':can_register' => $canRegister, ':user_id' => $userId]);

        // Remover permissões antigas
        $stmt = $pdo->prepare("DELETE FROM usuario_empresas WHERE usuario_id = :user_id");
        $stmt->execute([':user_id' => $userId]);

        // Adicionar novas permissões
        if (!empty($empresas)) {
            $stmt = $pdo->prepare("INSERT INTO usuario_empresas (usuario_id, empresa) VALUES (:user_id, :empresa)");
            foreach ($empresas as $empresa) {
                $stmt->execute([
                    ':user_id' => $userId,
                    ':empresa' => $empresa
                ]);
            }
        }

        $pdo->commit();
        echo json_encode(['result' => 'success']);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
