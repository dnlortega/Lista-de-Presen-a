
// --- FUNÇÕES AUXILIARES (RECRIADAS) ---

function loadSentRecords() {
    const saved = localStorage.getItem('sent_records');
    return saved ? JSON.parse(saved) : {};
}

function saveSentRecords(records) {
    localStorage.setItem('sent_records', JSON.stringify(records));
}

function makeRecordKey(r) {
    // Chave única para evitar duplicatas no dia: Empresa|Setor|Funcionario|Educador|Data
    const today = new Date().toISOString().slice(0, 10);
    return `${r.empresa}|${r.setor}|${r.funcionario}|${r.educador}|${today}`;
}

function getEducador() {
    // Retorna o usuário logado atualmente (definido em script.js)
    if (typeof currentUsername !== 'undefined' && currentUsername) {
        return currentUsername;
    }
    return localStorage.getItem('username') || 'NÃO IDENTIFICADO';
}

function showMessage(msg, type = 'info') {
    // Exibe mensagem flutuante ou alert
    const statusDiv = document.getElementById('status-message');
    if (statusDiv) {
        statusDiv.textContent = msg;
        statusDiv.className = `status-message ${type}`;
        statusDiv.style.display = 'block';
        setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
    } else {
        alert(msg);
    }
}
