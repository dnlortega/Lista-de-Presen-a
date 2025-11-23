<?php
header('Content-Type: application/json');
require '../config.php';

session_start();

// Verificar se é admin ou suporte
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'suporte'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado']);
    exit;
}

try {
    $stats = [];
    
    // 1. Presença por dia (últimos 7 dias)
    $stmt = $pdo->query("
        SELECT DATE(data_hora) as dia, COUNT(*) as total 
        FROM presenca 
        WHERE data_hora >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(data_hora)
        ORDER BY dia ASC
    ");
    $stats['presenca_por_dia'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 2. Presença por empresa (hoje)
    $stmt = $pdo->query("
        SELECT empresa, COUNT(*) as total 
        FROM presenca 
        WHERE DATE(data_hora) = CURDATE()
        GROUP BY empresa
        ORDER BY total DESC
    ");
    $stats['presenca_por_empresa_hoje'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. Presença por setor (hoje)
    $stmt = $pdo->query("
        SELECT setor, COUNT(*) as total 
        FROM presenca 
        WHERE DATE(data_hora) = CURDATE()
        GROUP BY setor
        ORDER BY total DESC
    ");
    $stats['presenca_por_setor_hoje'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 4. Total de presença hoje
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM presenca WHERE DATE(data_hora) = CURDATE()");
    $stats['total_hoje'] = $stmt->fetchColumn();
    
    // 5. Lista completa de presença hoje (para exportar)
    $stmt = $pdo->query("
        SELECT funcionario, empresa, setor, data_hora 
        FROM presenca 
        WHERE DATE(data_hora) = CURDATE()
        ORDER BY empresa, setor, funcionario
    ");
    $stats['lista_hoje'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($stats);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
