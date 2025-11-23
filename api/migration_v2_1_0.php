<?php
require '../config.php';

try {
    echo "Iniciando migração v2.1.0...\n";

    // Verificar se a coluna já existe
    $stmt = $pdo->query("SHOW COLUMNS FROM usuarios LIKE 'can_register'");
    $column = $stmt->fetch();

    if (!$column) {
        echo "Adicionando coluna 'can_register'...\n";
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN can_register TINYINT(1) DEFAULT 0 AFTER role");
        echo "Coluna adicionada com sucesso!\n";
    } else {
        echo "Coluna 'can_register' já existe.\n";
    }

    echo "Migração concluída.\n";

} catch (PDOException $e) {
    echo "Erro na migração: " . $e->getMessage() . "\n";
}
?>
