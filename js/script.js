// Configuração da API
const API_BASE_URL = './api'; // Relative path to PHP files

// A variável DADOS_FUNCIONARIOS é carregada do arquivo data.js (LEGADO - REMOVER EM BREVE)
// Inicializa com vazio se não houver cache, o loadFuncionariosFromCloud irá popular
let localData = localStorage.getItem('custom_data');
let DADOS_ATUAIS = localData ? JSON.parse(localData) : [];

async function syncFuncionarios(silent = false) {
    if (!silent && !confirm('Isso irá SOBRESCREVER a lista no Banco de Dados com a lista atual. Continuar?')) return;

    const button = document.querySelector('button[onclick="syncFuncionarios()"]');
    let originalText = '';
    if (button) {
        originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Enviando...';
    }

    const statusDiv = document.getElementById('status-message'); // Para feedback silencioso (auto-sync)
    if (silent && statusDiv) {
        statusDiv.textContent = 'Sincronizando...';
        statusDiv.style.display = 'block';
        statusDiv.className = 'status-message warning';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api_funcionarios.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employees: DADOS_ATUAIS })
        });

        const result = await response.json();

        if (result.result === 'success') {
            if (!silent) alert('Banco de dados atualizado com sucesso!');
            if (silent && statusDiv) {
                statusDiv.textContent = 'Salvo e Sincronizado!';
                statusDiv.className = 'status-message success';
                setTimeout(() => { statusDiv.style.display = 'none'; }, 2000);
            }
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error('Erro ao sincronizar:', error);
        if (!silent) alert('Erro ao conectar com o servidor.');
        if (silent && statusDiv) {
            statusDiv.textContent = 'Salvo localmente (Erro na nuvem)';
            statusDiv.className = 'status-message error';
            setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
        }
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

// Se não houver dados locais, inicializa com o padrão para edição futura
if (!localData) {
    // Opcional: salvar logo de cara ou esperar a primeira edição?
    // Vamos esperar a primeira edição para não duplicar dados desnecessariamente no storage
}

let selectedEmpresa = '';
let selectedSetor = '';
let selectedFuncionarios = [];

// Função utilitária para converter para MAIÚSCULAS
const toUpper = (str) => str ? String(str).toUpperCase() : '';

// --- FUNÇÕES DE NAVEGAÇÃO E TEMA ---

function showScreen(id) {
    // Esconde todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    // Mostra a tela desejada
    const screen = document.getElementById(id);
    if (screen) {
        screen.classList.add('active');
        // Reinicia animações se necessário
        const list = screen.querySelector('[id^="list-"]');
        if (list) staggerAnimate(list);
    }
}

// pequena utilitária para animar entrada de itens com stagger
function staggerAnimate(container) {
    const items = Array.from(container.children);
    items.forEach((it, i) => {
        it.classList.remove('animate-item');
        // forçar reflow para reiniciar a animação
        void it.offsetWidth;
        it.style.animationDelay = `${i * 38}ms`;
        it.classList.add('animate-item');
    });
}

// LÓGICA DO MODO ESCURO
function checkThemePreference() {
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    const toggleButton = document.getElementById('theme-toggle');

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        if (toggleButton) toggleButton.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        if (toggleButton) toggleButton.textContent = '🌙';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const toggleButton = document.getElementById('theme-toggle');

    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        if (toggleButton) toggleButton.textContent = '☀️';
    } else {
        localStorage.setItem('theme', 'light');
        if (toggleButton) toggleButton.textContent = '🌙';
    }
}


// --- FUNÇÕES DE FILTRO E ENVIO ---

function getUniqueValues(data, key) {
    return [...new Set(data.map(item => toUpper(item[key])))].sort();
}

// 1ª Tela: Carregar Empresas (index.html)
function loadEmpresas() {
    const empresas = getUniqueValues(DADOS_ATUAIS, 'Empresa');
    const list = document.getElementById('list-empresas');
    if (!list) return;

    list.innerHTML = '';

    empresas.forEach(empresa => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = empresa;
        item.onclick = () => selectEmpresa(empresa);
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectEmpresa(empresa); }
        });
        item.style.willChange = 'transform,opacity';
        list.appendChild(item);
    });
    staggerAnimate(list);
}

function selectEmpresa(empresa) {
    loadSetores(empresa);
    showScreen('screen-setor');
}

// 2ª Tela: Carregar Setores (setores.html)
function loadSetores(empresa) {
    const setoresFiltrados = DADOS_ATUAIS.filter(item => toUpper(item.Empresa) === toUpper(empresa));
    const setores = getUniqueValues(setoresFiltrados, 'Setor');
    const list = document.getElementById('list-setores');
    if (!list) return;

    // Atualiza titulo
    const titleSpan = document.getElementById('current-empresa');
    if (titleSpan) titleSpan.textContent = toUpper(empresa);

    list.innerHTML = '';

    setores.forEach(setor => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = setor;
        item.onclick = () => selectSetor(empresa, setor);
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSetor(empresa, setor); }
        });
        item.style.willChange = 'transform,opacity';
        list.appendChild(item);
    });
    staggerAnimate(list);
}

function selectSetor(empresa, setor) {
    loadFuncionarios(empresa, setor);
    showScreen('screen-funcionario');
}

// 3ª Tela: Carregar Funcionários (funcionarios.html)
function loadFuncionarios(empresa, setor) {
    // Recupera variaveis globais para uso no envio
    selectedEmpresa = empresa;
    selectedSetor = setor;

    const funcionarios = DADOS_ATUAIS.filter(
        item => toUpper(item.Empresa) === toUpper(empresa) && toUpper(item.Setor) === toUpper(setor)
    );
    const list = document.getElementById('list-funcionarios');
    if (!list) return;

    // Atualiza titulo e botão voltar
    const titleSpan = document.getElementById('current-setor');
    if (titleSpan) titleSpan.textContent = toUpper(setor);

    // Mostrar botão de adicionar se for educador COM PERMISSÃO ou suporte
    const btnNew = document.getElementById('btn-new-func-educador');
    if (btnNew) {
        const canRegister = localStorage.getItem('can_register') === '1';

        if (currentUserRole === 'suporte' || (currentUserRole === 'educador' && canRegister)) {
            btnNew.style.display = 'block';
        } else {
            btnNew.style.display = 'none';
        }
    }

    const backBtn = document.getElementById('back-to-setor');
    if (backBtn) {
        backBtn.onclick = () => {
            loadSetores(empresa);
            showScreen('screen-setor');
        };
    }

    list.innerHTML = '';

    if (funcionarios.length === 0) {
        list.innerHTML = '<p style="text-align:center; color: var(--subtle-text-color); text-transform: uppercase; margin-top: 30px;">NENHUM FUNCIONÁRIO ENCONTRADO NESTE SETOR.</p>';
    }

    funcionarios.forEach(func => {
        const nomeFuncionario = toUpper(func.Nome);
        const item = document.createElement('div');
        item.className = 'list-item funcionario-item';
        item.textContent = nomeFuncionario;
        item.dataset.nome = nomeFuncionario;
        item.onclick = (event) => toggleSelection(event, nomeFuncionario);
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelection({ currentTarget: item }, nomeFuncionario); }
        });
        item.style.willChange = 'transform,opacity';

        if (selectedFuncionarios.includes(nomeFuncionario)) {
            item.classList.add('selected');
        }

        list.appendChild(item);
    });
    staggerAnimate(list);
}

// ... (toggleSelection, updateSendButton mantidos iguais) ...

// --- AUTENTICAÇÃO E PERMISSÕES ---
let currentUserRole = null;
let currentUsername = null;

async function login() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const errorDiv = document.getElementById('login-error');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        errorDiv.textContent = 'Preencha usuário e senha.';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api_login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok && result.result === 'success') {
            currentUserRole = result.role;
            currentUsername = username;
            // Store permission
            localStorage.setItem('can_register', result.can_register ? '1' : '0');

            // Limpa campos
            usernameInput.value = '';
            passwordInput.value = '';
            errorDiv.style.display = 'none';

            // Recarregar dados do servidor
            await loadFuncionariosFromCloud();

            // Role-based redirection
            if (result.role === 'admin') {
                // Admin vai direto para Dashboard
                window.location.href = 'admin.html';
                return;
            } else if (result.role === 'educador') {
                // Educador vai para seleção de empresa
                applyRolePermissions(currentUserRole);
                loadEmpresas();
                showScreen('screen-empresa');
            } else if (result.role === 'suporte') {
                // Suporte escolhe onde ir
                showSuporteChoiceModal();
            }
        } else {
            errorDiv.textContent = result.error || 'Login falhou.';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro no login:', error);
        errorDiv.textContent = 'Erro de conexão.';
        errorDiv.style.display = 'block';
    }
}

function showSuporteChoiceModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="text-align: center;">
            <h3>Bem-vindo, Suporte!</h3>
            <p style="margin: 1.5rem 0; color: var(--text-secondary);">Escolha onde deseja ir:</p>
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem;">
                <button class="btn btn-primary" onclick="goToDashboard()" style="padding: 1rem; font-size: 1rem;">
                    📊 Dashboard (Admin)
                </button>
                <button class="btn btn-secondary" onclick="goToEmpresaSelection()" style="padding: 1rem; font-size: 1rem;">
                    📋 Selecionar Empresa (Educador)
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function goToDashboard() {
    window.location.href = 'admin.html';
}

function goToEmpresaSelection() {
    // Remove modal
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();

    applyRolePermissions(currentUserRole);
    loadEmpresas();
    showScreen('screen-empresa');
}

async function logout() {
    await fetch(`${API_BASE_URL}/api_logout.php`);
    currentUserRole = null;
    currentUsername = null;
    location.reload(); // Recarrega para limpar estado
}

async function checkSession() {
    try {
        const response = await fetch(`${API_BASE_URL}/api_check_session.php`);
        const data = await response.json();

        if (data.logged_in) {
            currentUserRole = data.role;
            currentUsername = data.username;
            // Update permission
            localStorage.setItem('can_register', data.can_register ? '1' : '0');

            applyRolePermissions(currentUserRole);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        return false;
    }
}

// Verificar sessão a cada 60 segundos
setInterval(async () => {
    const isLoggedIn = await checkSession();
    if (!isLoggedIn && currentUserRole) {
        // Se estava logado e caiu a sessão
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        location.reload();
    }
}, 60000);

function applyRolePermissions(role) {
    const adminBtn = document.getElementById('admin-toggle');
    const historyBtn = document.getElementById('history-toggle');
    const logoutBtn = document.getElementById('logout-btn');
    const userDisplay = document.getElementById('logged-user');

    // Botão de Logout sempre visível
    if (logoutBtn) logoutBtn.style.display = 'block';

    // Exibe usuário logado
    if (userDisplay) {
        userDisplay.textContent = `👤 ${currentUsername}`;
        userDisplay.style.display = 'block';
    }

    // Permissões de Botões Superiores
    if (role === 'admin' || role === 'suporte') {
        if (adminBtn) adminBtn.style.display = 'block';
    } else {
        if (adminBtn) adminBtn.style.display = 'none';
    }

    if (role === 'educador' || role === 'suporte') {
        if (historyBtn) historyBtn.style.display = 'block';
    } else {
        // Admin puro talvez não precise ver histórico de envio? 
        // O user pediu "SÓ OS BOTÕES PARA SELEÇÃO" para educador.
        // Vou deixar histórico para educador também pois ele precisa remover envios errados.
        if (historyBtn) historyBtn.style.display = 'none';
    }

    // Ajuste fino para Admin: Se for só admin, talvez ele queira ver histórico também?
    // O pedido diz: "PARA ADMIN CADASTRAR FUNCIONARIO".
    // Vou liberar histórico para todos por enquanto, exceto se for explicitamente proibido.
    // Mas vou seguir a regra estrita: Educador = Seleção. Admin = Cadastro. Suporte = Tudo.

    if (role === 'admin') {
        if (historyBtn) historyBtn.style.display = 'none'; // Admin foca em cadastro
    }
    if (role === 'educador') {
        if (historyBtn) historyBtn.style.display = 'block'; // Educador vê histórico (para remover erros do dia)
    }
    if (role === 'suporte') {
        if (historyBtn) historyBtn.style.display = 'block';
        if (adminBtn) adminBtn.style.display = 'block';
    }
}


// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verifica e aplica a preferência de tema
    checkThemePreference();

    // 2. Anexa a função de alternância ao botão (se existir na pagina)
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleDarkMode);

    // 3. Carrega dados da nuvem
    await loadFuncionariosFromCloud();

    // 4. Verifica Sessão
    const isLoggedIn = await checkSession();

    if (isLoggedIn) {
        loadEmpresas();
        showScreen('screen-empresa');
    } else {
        showScreen('screen-login');
    }
});

async function loadFuncionariosFromCloud() {
    // Mostra loading visual
    const statusDiv = document.getElementById('status-message');
    if (statusDiv) {
        statusDiv.textContent = 'Conectando ao banco de dados...';
        statusDiv.className = 'status-message warning';
        statusDiv.style.display = 'block';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api_funcionarios.php`);
        const data = await response.json();

        if (Array.isArray(data)) {
            DADOS_ATUAIS = data;
            localStorage.setItem('custom_data', JSON.stringify(DADOS_ATUAIS));
            console.log('Dados carregados do banco:', data.length);

            if (statusDiv) {
                statusDiv.textContent = 'Conectado ao Banco de Dados!';
                statusDiv.className = 'status-message success';
                setTimeout(() => { statusDiv.style.display = 'none'; }, 2000);
            }
        } else {
            console.warn('Formato inválido do banco.');
        }

    } catch (error) {
        console.error('Erro ao carregar do banco:', error);
        if (statusDiv) {
            statusDiv.textContent = 'Erro de Conexão (Verifique se o server.js está rodando)';
            statusDiv.className = 'status-message error';
            setTimeout(() => { statusDiv.style.display = 'none'; }, 5000);
        }
    } finally {
        // O router (DOMContentLoaded) chamará loadEmpresas
    }
}

// --- HISTÓRICO E CORREÇÃO ---

async function loadHistory() {
    showScreen('screen-history');
    const list = document.getElementById('list-history');
    list.innerHTML = '<div class="loading-spinner">Carregando histórico...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api_presenca.php`);
        const registros = await response.json();

        list.innerHTML = '';

        if (registros.length === 0) {
            list.innerHTML = '<div class="empty-state">Nenhum registro enviado hoje.</div>';
            return;
        }

        // Agrupar por Setor
        const sectors = {};
        registros.forEach(reg => {
            const setorKey = `${reg.empresa} - ${reg.setor}`;
            if (!sectors[setorKey]) sectors[setorKey] = [];
            sectors[setorKey].push(reg);
        });

        // Renderizar Botões de Setor
        Object.keys(sectors).sort().forEach((setorKey, index) => {
            const count = sectors[setorKey].length;
            const btn = document.createElement('button');
            btn.className = 'list-item animate-item';
            btn.style.animationDelay = `${index * 50}ms`;
            btn.style.display = 'flex';
            btn.style.justifyContent = 'space-between';
            btn.style.alignItems = 'center';

            btn.innerHTML = `
                <span style="font-weight:bold;">${setorKey}</span>
                <span style="background:var(--primary-color); color:white; padding:2px 8px; border-radius:10px; font-size:0.8em;">${count}</span>
            `;

            // Ao clicar, mostra os funcionários desse setor
            btn.onclick = () => renderHistoryEmployees(setorKey, sectors[setorKey]);

            list.appendChild(btn);
        });

    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        list.innerHTML = '<div class="error-state">Erro ao carregar histórico. Tente novamente.</div>';
    }
}

function renderHistoryEmployees(setorKey, employees) {
    const list = document.getElementById('list-history');
    list.innerHTML = '';

    // Botão Voltar
    const backBtn = document.createElement('button');
    backBtn.className = 'back-button';
    backBtn.style.marginBottom = '15px';
    backBtn.style.width = '100%';
    backBtn.textContent = `← Voltar para Setores (${setorKey})`;
    backBtn.onclick = () => loadHistory();
    list.appendChild(backBtn);

    // Lista de Funcionários
    employees.forEach((reg, index) => {
        const item = document.createElement('div');
        item.className = 'history-item animate-item';
        item.style.animationDelay = `${index * 50}ms`;

        const dateObj = new Date(reg.data_hora);
        const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const key = `${reg.empresa}|${reg.setor}|${reg.funcionario}|UNKNOWN|${reg.data_hora.split(' ')[0]}`;

        item.innerHTML = `
            <div class="history-info">
                <div class="history-time">${timeStr}</div>
                <div class="history-details">
                    <strong>${reg.funcionario}</strong>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFromHistory('${key}')">
                Remover
            </button>
        `;
        list.appendChild(item);
    });
}

async function sendSelectedFuncionarios() {
    if (selectedFuncionarios.length === 0) {
        showMessage('NENHUM FUNCIONÁRIO SELECIONADO.', 'error');
        return;
    }

    const sendButton = document.getElementById('send-button');
    sendButton.disabled = true;
    sendButton.classList.add('loading');

    const educador = toUpper(getEducador());
    const registrosTodos = selectedFuncionarios.map(nome => ({
        empresa: toUpper(selectedEmpresa),
        setor: toUpper(selectedSetor),
        funcionario: nome,
        educador
    }));

    // REMOVIDO: Filtragem local de duplicados. Agora confiamos 100% no servidor.
    const toSend = registrosTodos;

    if (toSend.length === 0) {
        sendButton.classList.remove('loading');
        sendButton.disabled = false;
        showMessage('Nenhum funcionário selecionado.', 'warning');
        return;
    }

    showMessage(`ENVIANDO ${toSend.length} REGISTRO(S)...`, 'warning');

    try {
        const response = await fetch(`${API_BASE_URL}/api_presenca.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registros: toSend })
        });

        const result = await response.json();

        if (result.result === 'success') {
            // Atualiza UI
            toSend.forEach(r => {
                document.querySelectorAll('.list-item.funcionario-item').forEach(item => {
                    if (item.dataset.nome === r.funcionario) item.classList.remove('selected');
                });
            });

            // Limpa seleção
            selectedFuncionarios = [];
            updateSendButton();

            let msg = `✅ SALVO! ${result.count} novos.`;
            if (result.skipped > 0) {
                msg += ` (${result.skipped} duplicados ignorados)`;
            }
            showMessage(msg, 'success');

            // Atualizar a página automaticamente após 1.5s
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            throw new Error(result.error || 'Erro desconhecido');
        }

    } catch (error) {
        console.error('Erro ao registrar:', error);
        showMessage('❌ ERRO AO SALVAR. O SERVIDOR ESTÁ RODANDO?', 'error');
    } finally {
        sendButton.classList.remove('loading');
        sendButton.disabled = false;
    }
}

async function removeFromHistory(key) {
    if (!confirm('Deseja apagar este registro do Banco de Dados?')) return;

    const sent = loadSentRecords();
    const parts = key.split('|');
    const registro = {
        empresa: parts[0],
        setor: parts[1],
        funcionario: parts[2],
        date: parts[4]
    };

    const btn = document.querySelector(`button[data-key="${key}"]`);
    if (btn) btn.textContent = 'Apagando...';

    try {
        // Para deletar, usamos api_presenca.php?action=delete
        const response = await fetch(`${API_BASE_URL}/api_presenca.php?action=delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registro: registro })
        });

        const result = await response.json();

        if (result.result === 'success') {
            delete sent[key];
            saveSentRecords(sent);
            loadHistory();
            alert('Registro apagado do Banco de Dados!');
        } else {
            alert('Erro: ' + (result.message || 'Não foi possível apagar.'));
            if (btn) btn.textContent = 'Remover';
        }

    } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro de conexão com o servidor.');
        if (btn) btn.textContent = 'Remover';
    }
}

// --- PAINEL ADMIN ---

function showAdminScreen() {
    renderAdminList();
    showScreen('screen-admin');
}

function renderAdminList(filter = '') {
    const list = document.getElementById('list-admin');
    list.innerHTML = '';

    const term = filter.toUpperCase();

    // Ordenar por Nome
    const sorted = [...DADOS_ATUAIS].sort((a, b) => a.Nome.localeCompare(b.Nome));

    sorted.forEach((item, index) => {
        // O índice original no array principal é importante para edição
        const originalIndex = DADOS_ATUAIS.indexOf(item);

        if (term && !item.Nome.toUpperCase().includes(term) && !item.Empresa.toUpperCase().includes(term)) {
            return;
        }

        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `
            <div class="admin-item-info">
                <span class="admin-item-name">${item.Nome}</span>
                <span class="admin-item-meta">${item.Empresa} | ${item.Setor}</span>
            </div>
            <div class="admin-item-actions">
                <button class="action-btn secondary" onclick="openEditModal(${originalIndex})">✏</button>
                <button class="action-btn danger" onclick="deleteFuncionario(${originalIndex})">🗑</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function filterAdminList() {
    const term = document.getElementById('admin-search').value;
    renderAdminList(term);
}

// --- CRUD ---

function openEditModal(index = -1) {
    document.getElementById('edit-modal').classList.add('active');
    document.getElementById('edit-index').value = index;

    // Populate autocomplete lists
    const empresasList = document.getElementById('empresas-list');
    const setoresList = document.getElementById('setores-list');

    if (empresasList) {
        const empresas = getUniqueValues(DADOS_ATUAIS, 'Empresa');
        empresasList.innerHTML = empresas.map(e => `<option value="${e}">`).join('');
    }

    if (setoresList) {
        const setores = getUniqueValues(DADOS_ATUAIS, 'Setor');
        setoresList.innerHTML = setores.map(s => `<option value="${s}">`).join('');
    }

    if (index >= 0) {
        const item = DADOS_ATUAIS[index];
        document.getElementById('edit-nome').value = item.Nome;
        document.getElementById('edit-empresa').value = item.Empresa;
        document.getElementById('edit-setor').value = item.Setor;
    } else {
        document.getElementById('edit-nome').value = '';
        document.getElementById('edit-empresa').value = '';
        document.getElementById('edit-setor').value = '';
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

function saveFuncionario() {
    const index = parseInt(document.getElementById('edit-index').value);
    const nome = document.getElementById('edit-nome').value.trim();
    const empresa = document.getElementById('edit-empresa').value.trim();
    const setor = document.getElementById('edit-setor').value.trim();

    if (!nome || !empresa || !setor) {
        alert('Preencha todos os campos.');
        return;
    }

    const novoItem = { "Empresa": empresa, "Setor": setor, "Nome": nome };

    // Se for adição via Educador (não tem index)
    if (index === -999) {
        saveFuncionarioEducator(novoItem);
        return;
    }

    if (index >= 0) {
        // Edição
        DADOS_ATUAIS[index] = novoItem;
    } else {
        // Novo (Admin)
        DADOS_ATUAIS.push(novoItem);
    }

    localStorage.setItem('custom_data', JSON.stringify(DADOS_ATUAIS));
    closeEditModal();
    renderAdminList();

    // Sincronizar silenciosamente
    syncFuncionarios(true);
}

function openAddModalEducator() {
    document.getElementById('edit-modal').classList.add('active');
    document.getElementById('edit-index').value = -999; // Código especial para "Novo via Educador"

    // Preenche e trava Empresa/Setor
    const empresaInput = document.getElementById('edit-empresa');
    const setorInput = document.getElementById('edit-setor');

    empresaInput.value = selectedEmpresa;
    setorInput.value = selectedSetor;

    empresaInput.readOnly = true;
    setorInput.readOnly = true;

    // Limpa nome
    document.getElementById('edit-nome').value = '';
    document.getElementById('edit-nome').focus();
}

async function saveFuncionarioEducator(novoItem) {
    const btn = document.querySelector('#edit-modal .action-btn.primary');
    const originalText = btn.textContent;
    btn.textContent = 'Salvando...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api_funcionarios.php?action=add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: novoItem.Nome,
                empresa: novoItem.Empresa,
                setor: novoItem.Setor
            })
        });

        const result = await response.json();

        if (result.result === 'success') {
            alert('Funcionário adicionado com sucesso!');

            // Adiciona localmente para refletir na hora
            DADOS_ATUAIS.push(novoItem);
            localStorage.setItem('custom_data', JSON.stringify(DADOS_ATUAIS));

            // Recarrega a lista
            loadFuncionarios(selectedEmpresa, selectedSetor);
            closeEditModal();
        } else {
            alert('Erro: ' + (result.error || 'Falha ao adicionar.'));
        }

    } catch (error) {
        console.error('Erro ao adicionar:', error);
        alert('Erro de conexão.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;

        // Destrava os campos para o próximo uso (caso seja admin depois)
        document.getElementById('edit-empresa').readOnly = false;
        document.getElementById('edit-setor').readOnly = false;
    }
}



function deleteFuncionario(index) {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;
    DADOS_ATUAIS.splice(index, 1);
    saveDataLocal();
    renderAdminList(document.getElementById('admin-search').value);

    // Auto-sync
    syncFuncionarios(true);
}

function saveDataLocal() {
    localStorage.setItem('custom_data', JSON.stringify(DADOS_ATUAIS));
    // Recarregar listas principais se estiverem visíveis seria ideal, mas o usuário vai navegar de volta
}

// --- GERENCIAR ACESSOS ---

let currentUsers = [];
let currentUserPermissions = {};

async function openAccessModal() {
    document.getElementById('access-modal').classList.add('active');

    // Carregar lista de educadores
    try {
        const response = await fetch(`${API_BASE_URL}/api_users.php`);
        const users = await response.json();
        currentUsers = users;

        const select = document.getElementById('access-user-select');
        select.innerHTML = '<option value="">-- Selecione --</option>';

        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        alert('Erro ao carregar lista de educadores.');
    }
}

function closeAccessModal() {
    document.getElementById('access-modal').classList.remove('active');
    document.getElementById('access-companies').style.display = 'none';
    document.getElementById('access-user-select').value = '';
}

async function loadUserPermissions() {
    const userId = document.getElementById('access-user-select').value;

    if (!userId) {
        document.getElementById('access-companies').style.display = 'none';
        return;
    }

    // Encontrar usuário selecionado
    const user = currentUsers.find(u => u.id == userId);
    if (!user) return;

    currentUserPermissions = user.empresas || [];

    // Obter lista de todas as empresas únicas
    const empresas = getUniqueValues(DADOS_ATUAIS, 'Empresa');

    // Criar checkboxes
    const container = document.getElementById('companies-checkboxes');
    container.innerHTML = '';

    empresas.forEach(empresa => {
        const div = document.createElement('div');
        div.style.marginBottom = '8px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `empresa-${empresa}`;
        checkbox.value = empresa;
        checkbox.checked = currentUserPermissions.includes(empresa);

        const label = document.createElement('label');
        label.htmlFor = `empresa-${empresa}`;
        label.textContent = empresa;
        label.style.marginLeft = '8px';
        label.style.cursor = 'pointer';

        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });

    document.getElementById('access-companies').style.display = 'block';
}

async function saveUserPermissions() {
    const userId = document.getElementById('access-user-select').value;

    if (!userId) {
        alert('Selecione um educador.');
        return;
    }

    // Coletar empresas marcadas
    const checkboxes = document.querySelectorAll('#companies-checkboxes input[type="checkbox"]:checked');
    const empresas = Array.from(checkboxes).map(cb => cb.value);

    try {
        const response = await fetch(`${API_BASE_URL}/api_users.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, empresas: empresas })
        });

        const result = await response.json();

        if (result.result === 'success') {
            alert('Permissões atualizadas com sucesso!');
            closeAccessModal();
        } else {
            alert('Erro: ' + (result.error || 'Desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar permissões:', error);
        alert('Erro ao salvar permissões.');
    }
}

function resetData() {
    if (!confirm('Isso apagará todas as suas edições locais e restaurará o arquivo original data.js. Continuar?')) return;
    localStorage.removeItem('custom_data');
    location.reload();
}

// --- DASHBOARD ---

let dashboardCharts = {
    dias: null,
    empresas: null,
    setores: null
};

async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/api_reports.php`);
        const data = await response.json();

        // Atualizar total
        document.getElementById('total-hoje').textContent = data.total_hoje || 0;

        // Gráfico de dias
        renderChartDias(data.presenca_por_dia || []);

        // Gráfico de empresas
        renderChartEmpresas(data.presenca_por_empresa_hoje || []);

        // Gráfico de setores
        renderChartSetores(data.presenca_por_setor_hoje || []);

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        alert('Erro ao carregar dados do dashboard.');
    }
}

function renderChartDias(data) {
    const ctx = document.getElementById('chart-dias');
    if (!ctx) return;

    // Destruir gráfico anterior se existir
    if (dashboardCharts.dias) {
        dashboardCharts.dias.destroy();
    }

    const labels = data.map(d => d.dia);
    const values = data.map(d => d.total);

    dashboardCharts.dias = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Presenças',
                data: values,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderChartEmpresas(data) {
    const ctx = document.getElementById('chart-empresas');
    if (!ctx) return;

    if (dashboardCharts.empresas) {
        dashboardCharts.empresas.destroy();
    }

    const labels = data.map(d => d.empresa);
    const values = data.map(d => d.total);

    dashboardCharts.empresas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Presenças',
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderChartSetores(data) {
    const ctx = document.getElementById('chart-setores');
    if (!ctx) return;

    if (dashboardCharts.setores) {
        dashboardCharts.setores.destroy();
    }

    const labels = data.map(d => d.setor);
    const values = data.map(d => d.total);

    dashboardCharts.setores = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function exportExcel() {
    window.open(`${API_BASE_URL}/export_excel.php`, '_blank');
}

function showDashboard() {
    loadDashboard();
    showScreen('screen-dashboard');
}

// --- ADMIN DESKTOP NAVIGATION ---

function showAdminSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active from all nav items
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(`admin-section-${sectionName}`);
    if (section) {
        section.classList.add('active');
    }

    // Mark nav item as active
    event.target.closest('.admin-nav-item').classList.add('active');

    // Load data for specific sections
    if (sectionName === 'dashboard') {
        loadDashboardAdmin();
    } else if (sectionName === 'acessos') {
        loadAccessManagementInline();
    }
}

async function loadDashboardAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/api_reports.php`);
        const data = await response.json();

        // Atualizar total
        document.getElementById('total-hoje-admin').textContent = data.total_hoje || 0;

        // Gráficos
        renderChartDiasAdmin(data.presenca_por_dia || []);
        renderChartEmpresasAdmin(data.presenca_por_empresa_hoje || []);
        renderChartSetoresAdmin(data.presenca_por_setor_hoje || []);

    } catch (error) {
        console.error('Erro ao carregar dashboard admin:', error);
    }
}

let adminCharts = {
    dias: null,
    empresas: null,
    setores: null
};

function renderChartDiasAdmin(data) {
    const ctx = document.getElementById('chart-dias-admin');
    if (!ctx) return;

    if (adminCharts.dias) adminCharts.dias.destroy();

    adminCharts.dias = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.dia),
            datasets: [{
                label: 'Presenças',
                data: data.map(d => d.total),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderChartEmpresasAdmin(data) {
    const ctx = document.getElementById('chart-empresas-admin');
    if (!ctx) return;

    if (adminCharts.empresas) adminCharts.empresas.destroy();

    adminCharts.empresas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.empresa),
            datasets: [{
                label: 'Presenças',
                data: data.map(d => d.total),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

function renderChartSetoresAdmin(data) {
    const ctx = document.getElementById('chart-setores-admin');
    if (!ctx) return;

    if (adminCharts.setores) adminCharts.setores.destroy();

    adminCharts.setores = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.setor),
            datasets: [{
                data: data.map(d => d.total),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// Inline Access Management
async function loadAccessManagementInline() {
    try {
        const response = await fetch(`${API_BASE_URL}/api_users.php`);
        const users = await response.json();
        currentUsers = users;

        const select = document.getElementById('access-user-select-inline');
        select.innerHTML = '<option value="">-- Selecione um educador --</option>';

        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

async function loadUserPermissionsInline() {
    const userId = document.getElementById('access-user-select-inline').value;

    if (!userId) {
        document.getElementById('access-companies-inline').style.display = 'none';
        return;
    }

    const user = currentUsers.find(u => u.id == userId);
    if (!user) return;

    currentUserPermissions = user.empresas || [];
    const empresas = getUniqueValues(DADOS_ATUAIS, 'Empresa');

    const container = document.getElementById('companies-checkboxes-inline');
    container.innerHTML = '';

    empresas.forEach(empresa => {
        const div = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `empresa-inline-${empresa}`;
        checkbox.value = empresa;
        checkbox.checked = currentUserPermissions.includes(empresa);

        const label = document.createElement('label');
        label.htmlFor = `empresa-inline-${empresa}`;
        label.textContent = empresa;

        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });

    document.getElementById('access-companies-inline').style.display = 'block';
}

async function saveUserPermissionsInline() {
    const userId = document.getElementById('access-user-select-inline').value;

    if (!userId) {
        alert('Selecione um educador.');
        return;
    }

    const checkboxes = document.querySelectorAll('#companies-checkboxes-inline input[type="checkbox"]:checked');
    const empresas = Array.from(checkboxes).map(cb => cb.value);

    try {
        const response = await fetch(`${API_BASE_URL}/api_users.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, empresas: empresas })
        });

        const result = await response.json();

        if (result.result === 'success') {
            alert('Permissões atualizadas com sucesso!');
        } else {
            alert('Erro: ' + (result.error || 'Desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar permissões:', error);
        alert('Erro ao salvar permissões.');
    }
}

// Override showAdminScreen to load dashboard by default
function showAdminScreen() {
    showScreen('screen-admin');
    showAdminSection('dashboard');
}

// --- FUNÇÕES AUXILIARES (toggleSelection, updateSendButton) ---
// (Adicionando aqui pois estavam omitidas no bloco anterior e são necessárias)

function toggleSelection(event, nome) {
    const item = event.currentTarget;
    item.classList.toggle('selected');

    if (item.classList.contains('selected')) {
        if (!selectedFuncionarios.includes(nome)) selectedFuncionarios.push(nome);
    } else {
        selectedFuncionarios = selectedFuncionarios.filter(n => n !== nome);
    }

    updateSendButton();
}

function updateSendButton() {
    const btn = document.getElementById('send-button');
    if (!btn) return;

    if (selectedFuncionarios.length > 0) {
        btn.classList.add('active');
        btn.textContent = `ENVIAR (${selectedFuncionarios.length})`;
        btn.disabled = false;
    } else {
        btn.classList.remove('active');
        btn.textContent = 'ENVIAR';
        btn.disabled = true;
    }
}