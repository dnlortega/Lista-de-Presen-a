// *** CÓDIGO PARA A PLANILHA DE FUNCIONÁRIOS (ATUALIZADO) ***
// Cole este código no Apps Script da planilha de funcionários (Substitua o anterior)

function doGet(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const doc = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = doc.getSheets()[0]; // Pega a primeira aba

        const data = sheet.getDataRange().getValues();

        // Remove o cabeçalho
        data.shift();

        const employees = data.map(row => ({
            Nome: row[0],
            Empresa: row[1],
            Setor: row[2]
        })).filter(e => e.Nome); // Remove linhas vazias

        return ContentService.createTextOutput(JSON.stringify(employees))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ 'error': e }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

function doPost(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const doc = SpreadsheetApp.getActiveSpreadsheet();
        const data = JSON.parse(e.postData.contents);

        // Este script só serve para atualizar funcionários
        return updateEmployees(doc, data.employees);

    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

function updateEmployees(doc, employees) {
    let sheet = doc.getSheets()[0];

    sheet.clear();
    sheet.appendRow(["Nome", "Empresa", "Setor"]);

    if (employees && employees.length > 0) {
        employees.sort((a, b) => a.Nome.localeCompare(b.Nome));
        const rows = employees.map(e => [e.Nome, e.Empresa, e.Setor]);
        sheet.getRange(2, 1, rows.length, 3).setValues(rows);
    }

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'count': employees.length }))
        .setMimeType(ContentService.MimeType.JSON);
}
