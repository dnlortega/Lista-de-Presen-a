<?php
require '../config.php';
session_start();

// Verificar se é admin ou suporte
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'suporte'])) {
    http_response_code(403);
    die('Acesso negado');
}

try {
    // Buscar presença de hoje
    $stmt = $pdo->query("
        SELECT funcionario, empresa, setor, data_hora 
        FROM presenca 
        WHERE DATE(data_hora) = CURDATE()
        ORDER BY empresa, setor, funcionario
    ");
    $registros = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Gerar CSV (compatível com Excel)
    $filename = 'presenca_' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    // BOM para UTF-8 (Excel reconhece acentos)
    echo "\xEF\xBB\xBF";
    
    // Cabeçalho
    echo "Funcionário,Empresa,Setor,Data\n";
    
    // Dados
    foreach ($registros as $reg) {
        echo '"' . $reg['funcionario'] . '",';
        echo '"' . $reg['empresa'] . '",';
        echo '"' . $reg['setor'] . '",';
        echo '"' . $reg['data_hora'] . '"';
        echo "\n";
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    die('Erro: ' . $e->getMessage());
}
?>
