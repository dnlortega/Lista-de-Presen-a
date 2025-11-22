<<<<<<< HEAD
# Sistema de Seleção de Funcionários (Web + Google Sheets)

Um aplicativo web moderno e responsivo, desenvolvido com HTML, CSS e JavaScript, projetado para registrar em lote a seleção de funcionários em uma planilha Google Sheets, utilizando o Google Apps Script como API de backend.

O sistema possui uma interface elegante (com modo claro/escuro) e um fluxo de trabalho em três etapas: **Empresa > Setor > Funcionário**. Todos os dados são padronizados em MAIÚSCULAS para garantir a consistência no registro.

---

## ✨ Funcionalidades Principais

* **Design Profissional:** Layout minimalista e elegante, otimizado para dispositivos móveis.
* **Modo Escuro (Dark Mode):** Botão de alternância para modo claro/escuro com persistência de preferência via `localStorage`.
* **Fluxo em Três Etapas:** Navegação intuitiva e filtrada (Empresa → Setor → Funcionário).
* **Seleção em Lote:** Permite selecionar múltiplos funcionários por setor e enviar todos em uma única transação.
* **Consistência de Dados:** Todos os campos (Empresa, Setor, Funcionário) são convertidos para **MAIÚSCULAS** antes do envio.
* **Backend via Apps Script:** Utiliza o Google Apps Script como um endpoint `POST` simples e seguro para gravação direta no Google Sheets.

---

## ⚙️ Configuração e Instalação

### 1. Backend (Google Sheets e Apps Script)

1.  **Crie sua Planilha:** Configure a planilha que receberá os registros. Recomenda-se colunas como `DATA_REGISTRO`, `EMPRESA`, `SETOR`, `FUNCIONARIO`.
2.  **Crie o Apps Script:** No Google Sheets, vá em `Extensões` > `Apps Script`.
3.  **Configure a URL de API:** A URL de implantação deve ser inserida no arquivo `script.js` na variável `URL_SCRIPT_API`.

> **URL Atualmente Configurada no Código:**
> `https://script.google.com/macros/s/AKfycbx2eMgGrnPB7yMX1SAnF8cwa0NNj9-uPyuIsdS5mz5zCNSjbwr68t8g7Posw56ne9CYkg/exec`

### 2. Frontend (HTML, CSS, JS)

O projeto é dividido em quatro arquivos:

* `index.html`: Estrutura principal e links de CSS/JS.
* `styles.css`: Estilos visuais (Modo Claro/Escuro).
* `script.js`: Lógica de navegação, tema e função de envio (`fetch`).
* `data.js`: **Dados estáticos** (a lista de funcionários).

Para rodar localmente, basta abrir o `index.html` no seu navegador. Para produção, hospede os arquivos em um servidor estático (como GitHub Pages, Vercel ou o próprio Google Drive/Apps Script).

---

## 🛠️ Manutenção dos Dados

A lista de funcionários está contida no arquivo **`data.js`**.

```javascript
// Arquivo: data.js
const DADOS_FUNCIONARIOS = [
    { "Empresa": "...", "Setor": "...", "Nome": "..." },
    // ... adicione/remova funcionários aqui
=======
# Sistema de Seleção de Funcionários (Web + Google Sheets)

Um aplicativo web moderno e responsivo, desenvolvido com HTML, CSS e JavaScript, projetado para registrar em lote a seleção de funcionários em uma planilha Google Sheets, utilizando o Google Apps Script como API de backend.

O sistema possui uma interface elegante (com modo claro/escuro) e um fluxo de trabalho em três etapas: **Empresa > Setor > Funcionário**. Todos os dados são padronizados em MAIÚSCULAS para garantir a consistência no registro.

---

## ✨ Funcionalidades Principais

* **Design Profissional:** Layout minimalista e elegante, otimizado para dispositivos móveis.
* **Modo Escuro (Dark Mode):** Botão de alternância para modo claro/escuro com persistência de preferência via `localStorage`.
* **Fluxo em Três Etapas:** Navegação intuitiva e filtrada (Empresa → Setor → Funcionário).
* **Seleção em Lote:** Permite selecionar múltiplos funcionários por setor e enviar todos em uma única transação.
* **Consistência de Dados:** Todos os campos (Empresa, Setor, Funcionário) são convertidos para **MAIÚSCULAS** antes do envio.
* **Backend via Apps Script:** Utiliza o Google Apps Script como um endpoint `POST` simples e seguro para gravação direta no Google Sheets.

---

## ⚙️ Configuração e Instalação

### 1. Backend (Google Sheets e Apps Script)

1.  **Crie sua Planilha:** Configure a planilha que receberá os registros. Recomenda-se colunas como `DATA_REGISTRO`, `EMPRESA`, `SETOR`, `FUNCIONARIO`.
2.  **Crie o Apps Script:** No Google Sheets, vá em `Extensões` > `Apps Script`.
3.  **Configure a URL de API:** A URL de implantação deve ser inserida no arquivo `script.js` na variável `URL_SCRIPT_API`.

> **URL Atualmente Configurada no Código:**
> `https://script.google.com/macros/s/AKfycbx2eMgGrnPB7yMX1SAnF8cwa0NNj9-uPyuIsdS5mz5zCNSjbwr68t8g7Posw56ne9CYkg/exec`

### 2. Frontend (HTML, CSS, JS)

O projeto é dividido em quatro arquivos:

* `index.html`: Estrutura principal e links de CSS/JS.
* `styles.css`: Estilos visuais (Modo Claro/Escuro).
* `script.js`: Lógica de navegação, tema e função de envio (`fetch`).
* `data.js`: **Dados estáticos** (a lista de funcionários).

Para rodar localmente, basta abrir o `index.html` no seu navegador. Para produção, hospede os arquivos em um servidor estático (como GitHub Pages, Vercel ou o próprio Google Drive/Apps Script).

---

## 🛠️ Manutenção dos Dados

A lista de funcionários está contida no arquivo **`data.js`**.

```javascript
// Arquivo: data.js
const DADOS_FUNCIONARIOS = [
    { "Empresa": "...", "Setor": "...", "Nome": "..." },
    // ... adicione/remova funcionários aqui
>>>>>>> 7a536f5aefd09b324a09f3a568d288e290c59c1a
];