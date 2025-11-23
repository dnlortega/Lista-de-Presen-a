<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Listar presenças de hoje
    try {
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("
            SELECT empresa, setor, funcionario, data_hora 
            FROM presenca 
            WHERE DATE(data_hora) = :today 
            ORDER BY data_hora DESC
        ");
        $stmt->execute([':today' => $today]);
        $registros = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($registros);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Rota de Deletar
    if (isset($input['registro']) && isset($_GET['action']) && $_GET['action'] === 'delete') {
        $reg = $input['registro'];
        
        // Debug log
        file_put_contents('debug.log', date('Y-m-d H:i:s') . " - DELETE REQUEST: " . json_encode($reg) . "\n", FILE_APPEND);
        
        // Tenta deletar usando comparação flexível
        $sql = "DELETE FROM presenca WHERE 
                UPPER(TRIM(empresa)) = UPPER(TRIM(:empresa)) AND 
                UPPER(TRIM(setor)) = UPPER(TRIM(:setor)) AND 
                UPPER(TRIM(funcionario)) = UPPER(TRIM(:funcionario)) AND 
                DATE(data_hora) = :date 
                LIMIT 1";
        $stmt = $pdo->prepare($sql);
        
        try {
            $stmt->execute([
                ':empresa' => $reg['empresa'],
                ':setor' => $reg['setor'],
                ':funcionario' => $reg['funcionario'],
                ':date' => $reg['date']
            ]);
            
            $rowCount = $stmt->rowCount();
            file_put_contents('debug.log', date('Y-m-d H:i:s') . " - DELETE RESULT: rowCount = $rowCount\n", FILE_APPEND);
            
            if ($rowCount > 0) {
                echo json_encode(['result' => 'success']);
            } else {
                // Se falhar, tenta debug extra
                $check = $pdo->prepare("SELECT * FROM presenca WHERE DATE(data_hora) = :date AND UPPER(funcionario) = UPPER(:funcionario)");
                $check->execute([':date' => $reg['date'], ':funcionario' => $reg['funcionario']]);
                $found = $check->fetchAll(PDO::FETCH_ASSOC);
                file_put_contents('debug.log', date('Y-m-d H:i:s') . " - DELETE FAIL DEBUG: Found similar: " . json_encode($found) . "\n", FILE_APPEND);
                
                echo json_encode(['result' => 'not_found', 'message' => 'Registro não encontrado. Verifique o log.']);
            }
        } catch (Exception $e) {
            file_put_contents('debug.log', date('Y-m-d H:i:s') . " - DELETE ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        exit;
    }

    // Rota de Registrar Presença
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autenticado']);
        exit;
    }

    $registros = $input['registros'] ?? null;

    if (is_array($registros)) {
        file_put_contents('debug.log', date('Y-m-d H:i:s') . " - Recebido PRESENCA com " . count($registros) . " registros\n", FILE_APPEND);
        
        $sql = "INSERT INTO presenca (empresa, setor, funcionario, data_hora) VALUES (:empresa, :setor, :funcionario, :data_hora)";
        $stmt = $pdo->prepare($sql);
        
        // Query para verificar duplicidade
        $checkSql = "SELECT id FROM presenca WHERE 
                     UPPER(empresa) = UPPER(:empresa) AND 
                     UPPER(setor) = UPPER(:setor) AND 
                     UPPER(funcionario) = UPPER(:funcionario) AND 
                     DATE(data_hora) = :today";
        $checkStmt = $pdo->prepare($checkSql);
        
        $count = 0;
        $today = date('Y-m-d');
        $skipped = 0;

        try {
            $pdo->beginTransaction();
            foreach ($registros as $reg) {
                // Verificar duplicidade
                $checkStmt->execute([
                    ':empresa' => $reg['empresa'],
                    ':setor' => $reg['setor'],
                    ':funcionario' => $reg['funcionario'],
                    ':today' => $today
                ]);
                
                if ($checkStmt->fetch()) {
                    $skipped++;
                    continue; // Pula se já existe
                }

                $stmt->execute([
                    ':empresa' => $reg['empresa'],
                    ':setor' => $reg['setor'],
                    ':funcionario' => $reg['funcionario'],
                    ':data_hora' => $today
                ]);
                $count++;
            }
            $pdo->commit();
            file_put_contents('debug.log', date('Y-m-d H:i:s') . " - Presença salva! Count: $count, Skipped: $skipped\n", FILE_APPEND);
            echo json_encode(['result' => 'success', 'count' => $count, 'skipped' => $skipped]);
        } catch (Exception $e) {
            $pdo->rollBack();
            file_put_contents('debug.log', date('Y-m-d H:i:s') . " - Erro Presença: " . $e->getMessage() . "\n", FILE_APPEND);
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Dados inválidos']);
    }
}
?>
