// Arquivo: script.js

// *** SUA URL DE IMPLANTAÇÃO DO GOOGLE APPS SCRIPT (FIXADA) ***
const URL_SCRIPT_API = 'https://script.google.com/macros/s/AKfycbx2eMgGrnPB7yMX1SAnF8cwa0NNj9-uPyuIsdS5mz5zCNSjbwr68t8g7Posw56ne9CYkg/exec';

// A variável DADOS_FUNCIONARIOS é carregada do arquivo data.js

let selectedEmpresa = '';
let selectedSetor = '';
let selectedFuncionarios = [];

// Função utilitária para converter para MAIÚSCULAS
const toUpper = (str) => str ? String(str).toUpperCase() : '';

// --- FUNÇÕES DE NAVEGAÇÃO E TEMA ---

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(id).classList.add('active');

    if (id === 'screen-setor') {
        document.getElementById('current-empresa').textContent = toUpper(selectedEmpresa);
    }
    if (id === 'screen-empresa') {
        selectedEmpresa = '';
        selectedSetor = '';
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
        toggleButton.textContent = '☀️'; // Exibe o sol para trocar para o modo claro
    } else {
        document.body.classList.remove('dark-mode');
        toggleButton.textContent = '🌙'; // Exibe a lua para trocar para o modo escuro
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const toggleButton = document.getElementById('theme-toggle');

    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        toggleButton.textContent = '☀️';
    } else {
        localStorage.setItem('theme', 'light');
        toggleButton.textContent = '🌙';
    }
}


// --- FUNÇÕES DE FILTRO E ENVIO ---

function getUniqueValues(data, key) {
    return [...new Set(data.map(item => toUpper(item[key])))].sort();
}

// 1ª Tela: Carregar Empresas
function loadEmpresas() {
    const empresas = getUniqueValues(DADOS_FUNCIONARIOS, 'Empresa');
    const list = document.getElementById('list-empresas');
    list.innerHTML = '';

    empresas.forEach(empresa => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = empresa;
        item.onclick = () => selectEmpresa(empresa);
        // acessibilidade: teclado
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectEmpresa(empresa); }
        });
        // animação de entrada
        item.style.willChange = 'transform,opacity';
        list.appendChild(item);
    });
    // animação stagger
    staggerAnimate(list);
    showScreen('screen-empresa');
}

function selectEmpresa(empresa) {
    selectedEmpresa = empresa;
    document.getElementById('current-empresa').textContent = toUpper(empresa);
    loadSetores(empresa);
}

// 2ª Tela: Carregar Setores
function loadSetores(empresa) {
    const setoresFiltrados = DADOS_FUNCIONARIOS.filter(item => toUpper(item.Empresa) === toUpper(empresa));
    const setores = getUniqueValues(setoresFiltrados, 'Setor');
    const list = document.getElementById('list-setores');
    list.innerHTML = '';

    setores.forEach(setor => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = setor;
        item.onclick = () => selectSetor(setor);
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSetor(setor); }
        });
        item.style.willChange = 'transform,opacity';
        list.appendChild(item);
    });
    staggerAnimate(list);
    showScreen('screen-setor');
}

function selectSetor(setor) {
    selectedSetor = setor;
    selectedFuncionarios = [];
    document.getElementById('current-setor').textContent = toUpper(setor);
    updateSendButton();
    loadFuncionarios(selectedEmpresa, setor);
    showScreen('screen-funcionario');
}

// 3ª Tela: Carregar Funcionários
function loadFuncionarios(empresa, setor) {
    const funcionarios = DADOS_FUNCIONARIOS.filter(
        item => toUpper(item.Empresa) === toUpper(empresa) && toUpper(item.Setor) === toUpper(setor)
    );
    const list = document.getElementById('list-funcionarios');
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

function toggleSelection(event, nomeFuncionario) {
    const itemElement = event.currentTarget;

    if (selectedFuncionarios.includes(nomeFuncionario)) {
        selectedFuncionarios = selectedFuncionarios.filter(name => name !== nomeFuncionario);
        itemElement.classList.remove('selected');
    } else {
        selectedFuncionarios.push(nomeFuncionario);
        itemElement.classList.add('selected');
        // animação sutil de confirmação
        itemElement.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.02)' },
            { transform: 'scale(1)' }
        ], { duration: 220, easing: 'ease-out' });
    }

    updateSendButton();
}

function updateSendButton() {
    const button = document.getElementById('send-button');
    const count = selectedFuncionarios.length;

    button.textContent = `ENVIAR SELECIONADOS (${count})`;
    button.disabled = count === 0;
}


// --- FUNÇÃO DE REGISTRO EM LOTE (Google Sheets) ---

// utilitários para evitar envios duplicados (baseado em localStorage)
function loadSentRecords() {
    try {
        return JSON.parse(localStorage.getItem('sent_records') || '{}');
    } catch (e) {
        return {};
    }
}

function saveSentRecords(obj) {
    localStorage.setItem('sent_records', JSON.stringify(obj));
}

function getEducador() {
    return "DANIEL";
}



function makeRecordKey(reg) {
    // chave composta: empresa|setor|funcionario|educador|YYYY-MM-DD (evita duplicados no mesmo dia por educador)
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10);
    const educador = (reg.educador || getEducador() || '').toUpperCase();
    return `${reg.empresa}|${reg.setor}|${reg.funcionario}|${educador}|${dateStr}`;
}

async function sendSelectedFuncionarios() {
    if (selectedFuncionarios.length === 0) {
        showMessage('NENHUM FUNCIONÁRIO SELECIONADO PARA ENVIAR.', 'error');
        return;
    }

    const sendButton = document.getElementById('send-button');
    sendButton.disabled = true;
    sendButton.classList.add('loading');

    // preparar registros e filtrar duplicados locais
    const educador = toUpper(getEducador());
    if (!educador) {
        showMessage('Informe o nome do educador antes de enviar.', 'error');
        sendButton.classList.remove('loading');
        sendButton.disabled = false;
        return;
    }

    const registrosTodos = selectedFuncionarios.map(nome => ({
        empresa: toUpper(selectedEmpresa),
        setor: toUpper(selectedSetor),
        funcionario: nome,
        educador
    }));

    const sent = loadSentRecords();
    const toSend = [];
    const ignored = [];

    registrosTodos.forEach(r => {
        const key = makeRecordKey(r);
        if (sent[key]) {
            ignored.push(r);
        } else {
            toSend.push(r);
        }
    });

    if (toSend.length === 0) {
        sendButton.classList.remove('loading');
        sendButton.disabled = false;
        showMessage('Nenhum registro novo para enviar (duplicados locais foram ignorados).', 'warning');
        return;
    }

    showMessage(`REGISTRANDO ${toSend.length} FUNCIONÁRIO(S)...`, 'warning');

    try {
        const dataToSend = { registros: toSend };

        // note: o Apps Script atual pode usar no-cors; ainda assim o fetch resolve se a rede funcionar
        const response = await fetch(URL_SCRIPT_API, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(dataToSend)
        });

        // Aguarda um momento para garantir que os dados foram processados
        await new Promise(resolve => setTimeout(resolve, 1000));

        // marca como enviados localmente
        toSend.forEach(r => { sent[makeRecordKey(r)] = Date.now(); });
        saveSentRecords(sent);

        // limpar caches locais relacionados a visualizações/dados para forçar refresh
        // (por exemplo, o dashboard usava 'dashboard_cache')
        try {
            localStorage.removeItem('dashboard_cache');
            localStorage.removeItem('sheet_cache');
        } catch (e) {
            console.warn('Erro ao limpar caches locais:', e);
        }

        // atualizar UI: remove seleção apenas dos enviados
        toSend.forEach(r => {
            const selector = `.list-item.funcionario-item[data-nome]`;
            // procura elementos que correspondam ao nome (toUpper já aplicado)
            document.querySelectorAll('.list-item.funcionario-item').forEach(item => {
                if (item.dataset.nome === r.funcionario) item.classList.remove('selected');
            });
        });

        // manter na seleção os ignorados (se houver)
        selectedFuncionarios = ignored.map(i => i.funcionario);
        updateSendButton();

        showMessage(`✅ ${toSend.length} REGISTRO(S) ENVIADOS COM SUCESSO!${ignored.length ? ' (' + ignored.length + ' duplicados ignorados)' : ''}`, 'success');

    } catch (error) {
        console.error('Erro ao registrar:', error);
        showMessage('❌ ERRO AO ENVIAR DADOS. VERIFIQUE A URL OU CONEXÃO.', 'error');
    } finally {
        sendButton.classList.remove('loading');
        sendButton.disabled = false;
    }
}

function showMessage(msg, type) {
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = msg;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';

    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verifica e aplica a preferência de tema
    checkThemePreference();

    // 2. Anexa a função de alternância ao botão
    document.getElementById('theme-toggle').addEventListener('click', toggleDarkMode);



    // 3. Carrega o conteúdo principal
    loadEmpresas();
});

// --- HISTÓRICO E CORREÇÃO ---

function loadHistory() {
    const sent = loadSentRecords();
    const list = document.getElementById('list-history');
    list.innerHTML = '';

    // Converter objeto em array e ordenar por data (mais recente primeiro)
    // Chave: empresa|setor|funcionario|educador|YYYY-MM-DD
    const items = Object.entries(sent).map(([key, timestamp]) => {
        const parts = key.split('|');
        return {
            key,
            timestamp,
            empresa: parts[0],
            setor: parts[1],
            funcionario: parts[2],
            educador: parts[3],
            date: parts[4]
        };
    }).sort((a, b) => b.timestamp - a.timestamp);

    // Filtrar apenas os de hoje (opcional, mas o app foca no dia)
    const today = new Date().toISOString().slice(0, 10);
    const todaysItems = items.filter(i => i.date === today);

    if (todaysItems.length === 0) {
        list.innerHTML = '<p style="text-align:center; color: var(--subtle-text-color); margin-top: 20px;">Nenhum envio registrado hoje.</p>';
    } else {
        todaysItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-info">
                    <span class="history-name">${item.funcionario}</span>
                    <span class="history-details">${item.empresa} - ${item.setor}</span>
                </div>
                <button class="delete-btn" onclick="removeFromHistory('${item.key}')">Remover</button>
            `;
            list.appendChild(div);
        });
    }

    showScreen('screen-history');
}

function removeFromHistory(key) {
    if (!confirm('Deseja remover este registro do aplicativo? Isso permitirá selecionar o funcionário novamente.')) return;

    const sent = loadSentRecords();
    delete sent[key];
    saveSentRecords(sent);

    // Recarregar a lista
    loadHistory();

    // Feedback
    // showMessage('Registro removido do local.', 'success'); // showMessage está em outra tela, melhor usar alert ou nada
}