<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Listar Funcionários
    session_start();
    
    file_put_contents('debug.log', date('Y-m-d H:i:s') . " - GET funcionarios - Role: " . ($_SESSION['role'] ?? 'none') . ", User ID: " . ($_SESSION['user_id'] ?? 'none') . "\n", FILE_APPEND);
    
    $sql = "SELECT nome, empresa, setor FROM funcionarios";
    
    // Se for educador, filtrar por empresas permitidas
    if (isset($_SESSION['role']) && $_SESSION['role'] === 'educador') {
        $userId = $_SESSION['user_id'];
        
        // Buscar empresas permitidas
        $stmtEmpresas = $pdo->prepare("SELECT empresa FROM usuario_empresas WHERE usuario_id = :user_id");
        $stmtEmpresas->execute([':user_id' => $userId]);
        $empresasPermitidas = $stmtEmpresas->fetchAll(PDO::FETCH_COLUMN);
        
        file_put_contents('debug.log', date('Y-m-d H:i:s') . " - Empresas permitidas para user $userId: " . implode(', ', $empresasPermitidas) . "\n", FILE_APPEND);
        
        if (!empty($empresasPermitidas)) {
            $placeholders = implode(',', array_fill(0, count($empresasPermitidas), '?'));
            $sql .= " WHERE empresa IN ($placeholders)";
        } else {
            // Educador sem empresas atribuídas = lista vazia
            file_put_contents('debug.log', date('Y-m-d H:i:s') . " - NENHUMA empresa atribuída, retornando lista vazia\n", FILE_APPEND);
            echo json_encode([]);
            exit;
        }
    }
    
    $sql .= " ORDER BY nome";
    
    if (isset($empresasPermitidas) && !empty($empresasPermitidas)) {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($empresasPermitidas);
    } else {
        $stmt = $pdo->query($sql);
    }
    
    $funcionarios = $stmt->fetchAll();
    
    // Mapear para o formato esperado (Maiúscula na chave para compatibilidade)
    $result = array_map(function($f) {
        return [
            'Nome' => $f['nome'],
            'Empresa' => $f['empresa'],
            'Setor' => $f['setor']
        ];
    }, $funcionarios);

    echo json_encode($result);

    // Atualizar Lista (Sobrescrever)
} elseif ($method === 'POST') {
    session_start();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? ($input['action'] ?? '');

    // PERMISSÕES:
    // Admin/Suporte: Podem tudo (Sincronização completa)
    // Educador: Pode APENAS adicionar individualmente (action='add')
    
    $role = $_SESSION['role'] ?? '';
    $canSync = in_array($role, ['admin', 'suporte']);
    
    // Educador só pode adicionar se tiver permissão explícita no banco (salva na sessão)
    $canAdd = in_array($role, ['admin', 'suporte']) || ($role === 'educador' && !empty($_SESSION['can_register']));

    if ($action === 'add') {
        if (!$canAdd) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado. Você não tem permissão para cadastrar funcionários.']);
            exit;
        }
        // Lógica de Adição Individual (segue abaixo)
    } else {
        // Lógica de Sincronização Completa (Padrão)
        if (!$canSync) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado. Apenas Admin/Suporte podem sincronizar tudo.']);
            exit;
        }
    }

    if ($action === 'add') {
        // ADICIONAR ÚNICO FUNCIONÁRIO
        $nome = $input['nome'] ?? '';
        $empresa = $input['empresa'] ?? '';
        $setor = $input['setor'] ?? '';

        if (!$nome || !$empresa || !$setor) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados incompletos.']);
            exit;
        }

        // Validação extra para educador: Só pode adicionar na empresa que tem acesso?
        // Opcional, mas recomendável. Por enquanto vamos confiar no frontend travado, 
        // mas idealmente checaria usuario_empresas aqui.
        
        try {
            $sql = "INSERT INTO funcionarios (nome, empresa, setor) VALUES (:nome, :empresa, :setor)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':nome' => $nome, ':empresa' => $empresa, ':setor' => $setor]);
            
            file_put_contents('debug.log', date('Y-m-d H:i:s') . " - Novo funcionário adicionado por $role: $nome\n", FILE_APPEND);
            echo json_encode(['result' => 'success', 'message' => 'Funcionário adicionado!']);
            exit;

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao salvar: ' . $e->getMessage()]);
            exit;
        }
    }

    // LÓGICA ORIGINAL DE SYNC (Mantida para Admin/Suporte)
    $employees = $input['employees'] ?? null;

    file_put_contents('debug.log', date('Y-m-d H:i:s') . " - Recebido POST com " . count($employees ?? []) . " funcionarios\n", FILE_APPEND);

    if (!is_array($employees)) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados inválidos']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // 1. Identificar funcionários que estão sendo removidos
        // Buscar lista atual no banco
        $stmtCurrent = $pdo->query("SELECT nome, empresa, setor FROM funcionarios");
        $currentEmployees = $stmtCurrent->fetchAll(PDO::FETCH_ASSOC);
        
        // Criar arrays de comparação (usando nome como chave única simplificada)
        $currentNames = array_map(function($e) { return strtoupper(trim($e['nome'])); }, $currentEmployees);
        $newNames = array_map(function($e) { return strtoupper(trim($e['Nome'])); }, $employees);
        
        // Encontrar quem está sendo removido
        $removedNames = array_diff($currentNames, $newNames);
        
        if (!empty($removedNames)) {
            // Verificar se algum dos removidos tem presença
            $placeholders = implode(',', array_fill(0, count($removedNames), '?'));
            $sqlCheck = "SELECT DISTINCT funcionario FROM presenca WHERE UPPER(funcionario) IN ($placeholders)";
            $stmtCheck = $pdo->prepare($sqlCheck);
            $stmtCheck->execute(array_values($removedNames));
            $blockedEmployees = $stmtCheck->fetchAll(PDO::FETCH_COLUMN);
            
            if (!empty($blockedEmployees)) {
                throw new Exception("Não é possível excluir: " . implode(', ', $blockedEmployees) . " possuem presença registrada. Apague as presenças primeiro.");
            }
        }

        // Se passou na verificação, prosseguir com a atualização (Limpar e Re-inserir)
        $pdo->exec("DELETE FROM funcionarios");

        if (!empty($employees)) {
            $sql = "INSERT INTO funcionarios (nome, empresa, setor) VALUES (:nome, :empresa, :setor)";
            $stmt = $pdo->prepare($sql);

            foreach ($employees as $emp) {
                $stmt->execute([
                    ':nome' => $emp['Nome'],
                    ':empresa' => $emp['Empresa'],
                    ':setor' => $emp['Setor']
                ]);
            }
        }

        $pdo->commit();
        file_put_contents('debug.log', date('Y-m-d H:i:s') . " - Sucesso! Inseridos: " . count($employees) . "\n", FILE_APPEND);
        echo json_encode(['result' => 'success', 'count' => count($employees)]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        file_put_contents('debug.log', date('Y-m-d H:i:s') . " - Erro: " . $e->getMessage() . "\n", FILE_APPEND);
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
