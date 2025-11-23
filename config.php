<?php
// Configurações do Banco de Dados
$host = 'localhost';
$db   = 'sistema_presenca';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    // Configurar timezone para Brasil/São Paulo
    date_default_timezone_set('America/Sao_Paulo');
    $pdo->exec("SET time_zone = '-03:00'");
    
} catch (\PDOException $e) {
    // Em produção, não mostre o erro detalhado
    http_response_code(500);
    echo json_encode(['error' => 'Erro de conexão com o banco de dados: ' . $e->getMessage()]);
    exit;
}
?>
