// Admin Script - Dedicated for Admin Interface

const API_BASE_URL = './api';
let DADOS_ATUAIS = [];
let currentUsers = [];
let currentUserPermissions = {};
let charts = {
    dias: null,
    empresas: null,
    setores: null
};

// Check session on load
document.addEventListener('DOMContentLoaded', async () => {
    const session = await checkSession();
    if (!session || !['admin', 'suporte'].includes(session.role)) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('admin-user').textContent = `👤 ${session.username}`;

    // Load data
    await loadFuncionariosFromCloud();

    // Setup navigation
    setupNavigation();

    // Load dashboard by default
    loadDashboard();
});

async function checkSession() {
    try {
        const response = await fetch(`${API_BASE_URL}/api_check_session.php`);
        const data = await response.json();
        return data.logged_in ? data : null;
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        return null;
    }
}

// Verificar sessão a cada 60 segundos
setInterval(async () => {
    const session = await checkSession();
    if (!session) {
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        window.location.href = 'index.html';
    }
}, 60000);

async function logout() {
    await fetch(`${API_BASE_URL}/api_logout.php`);
    window.location.href = 'index.html';
}

async function loadFuncionariosFromCloud() {
    try {
        const response = await fetch(`${API_BASE_URL}/api_funcionarios.php`);
        const data = await response.json();

        DADOS_ATUAIS = data.map(f => ({
            Nome: f.Nome,
            Empresa: f.Empresa,
            Setor: f.Setor
        }));

        localStorage.setItem('custom_data', JSON.stringify(DADOS_ATUAIS));
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
    }
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            showSection(section);
        });
    });
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

    // Remove active from nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show selected
    document.getElementById(`section-${sectionName}`).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Load data
    if (sectionName === 'dashboard') loadDashboard();
    else if (sectionName === 'funcionarios') loadFuncionariosList();
    else if (sectionName === 'educadores') loadEducadoresList();
    else if (sectionName === 'acessos') loadAccessManagement();
}

// Dashboard
async function loadDashboard() {
    try {
        console.log('Loading dashboard...');
        const response = await fetch(`${API_BASE_URL}/api_reports.php`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dashboard data:', data);

        // Check for error in response
        if (data.error) {
            console.error('API Error:', data.error);
            alert('Erro ao carregar dashboard: ' + data.error);
            return;
        }

        document.getElementById('total-hoje').textContent = data.total_hoje || 0;

        renderChartDias(data.presenca_por_dia || []);
        renderChartEmpresas(data.presenca_por_empresa_hoje || []);
        renderChartSetores(data.presenca_por_setor_hoje || []);
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function exportExcel() {
    window.open(`${API_BASE_URL}/export_excel.php`, '_blank');
}

// Funcionários
function loadFuncionariosList() {
    const list = document.getElementById('list-funcionarios');
    list.innerHTML = '';

    DADOS_ATUAIS.forEach((func, index) => {
        const item = document.createElement('div');
        item.className = 'data-item';
        item.innerHTML = `
            <div class="data-item-info">
                <h4>${func.Nome}</h4>
                <div class="data-item-meta">${func.Empresa} - ${func.Setor}</div>
            </div>
            <div class="data-item-actions">
                <button class="btn btn-secondary" onclick="editFuncionario(${index})">Editar</button>
                <button class="btn btn-secondary" onclick="deleteFuncionario(${index})">Excluir</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function openEditModal(index = -1) {
    document.getElementById('edit-modal').classList.add('active');
    document.getElementById('edit-index').value = index;

    // Populate autocomplete lists
    const empresasList = document.getElementById('empresas-list-admin');
    const setoresList = document.getElementById('setores-list-admin');

    if (empresasList) {
        const empresas = [...new Set(DADOS_ATUAIS.map(f => f.Empresa))];
        empresasList.innerHTML = empresas.map(e => `<option value="${e}">`).join('');
    }

    if (setoresList) {
        const setores = [...new Set(DADOS_ATUAIS.map(f => f.Setor))];
        setoresList.innerHTML = setores.map(s => `<option value="${s}">`).join('');
    }

    if (index >= 0) {
        const func = DADOS_ATUAIS[index];
        document.getElementById('edit-nome').value = func.Nome;
        document.getElementById('edit-empresa').value = func.Empresa;
        document.getElementById('edit-setor').value = func.Setor;
    } else {
        document.getElementById('edit-nome').value = '';
        document.getElementById('edit-empresa').value = '';
        document.getElementById('edit-setor').value = '';
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

function editFuncionario(index) {
    openEditModal(index);
}

async function saveFuncionario() {
    const index = parseInt(document.getElementById('edit-index').value);
    const nome = document.getElementById('edit-nome').value.trim();
    const empresa = document.getElementById('edit-empresa').value.trim();
    const setor = document.getElementById('edit-setor').value.trim();

    if (!nome || !empresa || !setor) {
        alert('Preencha todos os campos');
        return;
    }

    const funcionario = { Nome: nome, Empresa: empresa, Setor: setor };

    if (index >= 0) {
        DADOS_ATUAIS[index] = funcionario;
    } else {
        DADOS_ATUAIS.push(funcionario);
    }

    await syncFuncionarios();
    closeEditModal();
    loadFuncionariosList();
}

async function deleteFuncionario(index) {
    if (!confirm('Excluir este funcionário?')) return;

    DADOS_ATUAIS.splice(index, 1);
    await syncFuncionarios();
    loadFuncionariosList();
}

async function syncFuncionarios() {
    try {
        await fetch(`${API_BASE_URL}/api_funcionarios.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employees: DADOS_ATUAIS })
        });
        localStorage.setItem('custom_data', JSON.stringify(DADOS_ATUAIS));
    } catch (error) {
        console.error('Erro ao sincronizar:', error);
    }
}

// Access Management
async function loadAccessManagement() {
    try {
        const response = await fetch(`${API_BASE_URL}/api_users.php`);
        const users = await response.json();
        currentUsers = users;

        const select = document.getElementById('select-educador');
        select.innerHTML = '<option value="">-- Selecione --</option>';

        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username;
            select.appendChild(option);
        });

        select.onchange = loadUserPermissions;
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

function loadUserPermissions() {
    const userId = document.getElementById('select-educador').value;
    const container = document.getElementById('companies-container');

    if (!userId) {
        container.style.display = 'none';
        return;
    }

    const user = currentUsers.find(u => u.id == userId);
    if (!user) return;

    currentUserPermissions = user.empresas || [];

    // Set checkbox state
    const canRegisterCheckbox = document.getElementById('can-register-checkbox-inline');
    if (canRegisterCheckbox) {
        canRegisterCheckbox.checked = !!user.can_register;
    }

    const empresas = [...new Set(DADOS_ATUAIS.map(f => f.Empresa))];
    const list = document.getElementById('companies-checkboxes-inline'); // Fixed ID to match HTML
    list.innerHTML = '';

    empresas.forEach(empresa => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '5px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = empresa;
        checkbox.checked = currentUserPermissions.includes(empresa);
        checkbox.style.marginRight = '8px';

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(empresa));
        list.appendChild(label);
    });

    container.style.display = 'block';
}

async function saveUserPermissionsInline() {
    const userId = document.getElementById('access-user-select-inline').value;
    if (!userId) return;

    const checkboxes = document.querySelectorAll('#companies-checkboxes-inline input:checked');
    const empresas = Array.from(checkboxes).map(cb => cb.value);

    const canRegisterCheckbox = document.getElementById('can-register-checkbox-inline');
    const canRegister = canRegisterCheckbox ? (canRegisterCheckbox.checked ? 1 : 0) : 0;

    try {
        const response = await fetch(`${API_BASE_URL}/api_users.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                empresas: empresas,
                can_register: canRegister
            })
        });

        const result = await response.json();
        if (result.result === 'success') {
            alert('Permissões salvas com sucesso!');
            // Reload users to update local cache
            const responseUsers = await fetch(`${API_BASE_URL}/api_users.php`);
            currentUsers = await responseUsers.json();
        }
    } catch (error) {
        console.error('Erro ao salvar permissões:', error);
    }
}

// Search
document.getElementById('search-funcionarios')?.addEventListener('keyup', (e) => {
    const search = e.target.value.toLowerCase();
    document.querySelectorAll('.data-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? '' : 'none';
    });
});

// Educadores Management
let educadoresList = [];

async function loadEducadoresList() {
    try {
        const response = await fetch(`${API_BASE_URL}/api_educadores.php`);
        educadoresList = await response.json();

        const list = document.getElementById('list-educadores');
        list.innerHTML = '';

        if (educadoresList.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:2rem; color:#666;">Nenhum educador cadastrado</p>';
            return;
        }

        educadoresList.forEach(educador => {
            const item = document.createElement('div');
            item.className = 'data-item';
            item.innerHTML = `
                <div class="data-item-info">
                    <h4>${educador.username}</h4>
                    <div class="data-item-meta">Educador</div>
                </div>
                <div class="data-item-actions">
                    <button class="btn btn-secondary" onclick="deleteEducador(${educador.id})">Excluir</button>
                </div>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar educadores:', error);
    }
}

function openEducadorModal() {
    document.getElementById('educador-modal').classList.add('active');
    document.getElementById('educador-modal-title').textContent = 'Novo Educador';
    document.getElementById('educador-id').value = '';
    document.getElementById('educador-username').value = '';
    document.getElementById('educador-password').value = '';
    document.getElementById('educador-nome').value = '';
}

function closeEducadorModal() {
    document.getElementById('educador-modal').classList.remove('active');
}

async function saveEducador() {
    const username = document.getElementById('educador-username').value.trim();
    const password = document.getElementById('educador-password').value;

    if (!username || !password) {
        alert('Preencha usuário e senha');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api_educadores.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                username,
                password
            })
        });

        const result = await response.json();

        if (result.result === 'success') {
            alert('Educador cadastrado com sucesso!');
            closeEducadorModal();
            loadEducadoresList();
        } else {
            alert('Erro: ' + (result.error || 'Não foi possível cadastrar'));
        }
    } catch (error) {
        console.error('Erro ao salvar educador:', error);
        alert('Erro de conexão');
    }
}

async function deleteEducador(id) {
    if (!confirm('Excluir este educador?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api_educadores.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete',
                id
            })
        });

        const result = await response.json();

        if (result.result === 'success') {
            alert('Educador excluído!');
            loadEducadoresList();
        }
    } catch (error) {
        console.error('Erro ao excluir educador:', error);
    }
}

// Search educadores
document.getElementById('search-educadores')?.addEventListener('keyup', (e) => {
    const search = e.target.value.toLowerCase();
    document.querySelectorAll('#list-educadores .data-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? '' : 'none';
    });
});
