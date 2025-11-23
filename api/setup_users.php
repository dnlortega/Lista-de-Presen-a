<?php
require 'config.php';

try {
    // Criar tabela usuarios
    $pdo->exec("CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'educador', 'suporte') NOT NULL
    )");
    echo "Tabela 'usuarios' verificada/criada.\n";

    // Usuários padrão
    $users = [
        ['username' => 'admin', 'password' => 'admin123', 'role' => 'admin'],
        ['username' => 'educador', 'password' => 'educador123', 'role' => 'educador'],
        ['username' => 'suporte', 'password' => 'suporte123', 'role' => 'suporte']
    ];

    foreach ($users as $user) {
        // Verifica se já existe
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = :username");
        $stmt->execute([':username' => $user['username']]);
        
        if ($stmt->fetch()) {
            echo "Usuario '{$user['username']}' ja existe.\n";
        } else {
            // Cria novo
            $hash = password_hash($user['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO usuarios (username, password_hash, role) VALUES (:username, :hash, :role)");
            $stmt->execute([
                ':username' => $user['username'],
                ':hash' => $hash,
                ':role' => $user['role']
            ]);
            echo "Usuario '{$user['username']}' criado com sucesso.\n";
        }
    }

} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>
