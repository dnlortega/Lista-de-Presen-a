// *** CÓDIGO DO GOOGLE APPS SCRIPT (PRESENÇA) ***
// Copie e cole este código no editor do Apps Script da planilha de PRESENÇA

function doPost(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const doc = SpreadsheetApp.getActiveSpreadsheet();
        const data = JSON.parse(e.postData.contents);

        if (data.type === 'update_employees') {
            return ContentService.createTextOutput(JSON.stringify({ 'result': 'ignored', 'message': 'Use the other script for employees' }))
                .setMimeType(ContentService.MimeType.JSON);
        } else if (data.type === 'delete_attendance') {
            return deleteAttendance(doc, data.registro);
        } else {
            return registerAttendance(doc, data.registros);
        }

    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

function registerAttendance(doc, registros) {
    let sheet = doc.getSheetByName("Presenca");
    if (!sheet) {
        sheet = doc.insertSheet("Presenca");
        sheet.appendRow(["EMPRESA", "SETOR", "FUNCIONÁRIO", "DATA"]);
    }

    const rows = registros.map(r => {
        const now = new Date();
        return [
            r.empresa,
            r.setor,
            r.funcionario,
            now
        ];
    });

    if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'count': rows.length }))
        .setMimeType(ContentService.MimeType.JSON);
}

function deleteAttendance(doc, registro) {
    const sheet = doc.getSheetByName("Presenca");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'message': 'Sheet not found' })).setMimeType(ContentService.MimeType.JSON);

    const lastRow = sheet.getLastRow();
    const data = sheet.getRange(1, 1, lastRow, 4).getValues();

    // Data alvo (YYYY-MM-DD)
    const targetParts = registro.date.split('-');
    const targetYear = parseInt(targetParts[0]);
    const targetMonth = parseInt(targetParts[1]) - 1; // JS months are 0-11
    const targetDay = parseInt(targetParts[2]);

    // Procura de baixo para cima
    for (let i = lastRow - 1; i >= 1; i--) {
        const row = data[i];
        const empresa = row[0];
        const setor = row[1];
        const funcionario = row[2];
        const dataHora = new Date(row[3]);

        // Comparação robusta de data (ignora hora e fuso)
        const sameDate = dataHora.getFullYear() === targetYear &&
            dataHora.getMonth() === targetMonth &&
            dataHora.getDate() === targetDay;

        if (String(empresa).toUpperCase() == String(registro.empresa).toUpperCase() &&
            String(setor).toUpperCase() == String(registro.setor).toUpperCase() &&
            String(funcionario).toUpperCase() == String(registro.funcionario).toUpperCase() &&
            sameDate) {

            sheet.deleteRow(i + 1);
            return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'message': 'Deleted' }))
                .setMimeType(ContentService.MimeType.JSON);
        }
    }

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'not_found', 'message': 'Record not found matching ' + registro.date }))
        .setMimeType(ContentService.MimeType.JSON);
}
