# 📊 Sistema de Presença

Sistema profissional de gerenciamento de presença com interface responsiva para desktop e mobile, desenvolvido com PHP, MySQL e JavaScript.

## ✨ Características

### 🎨 Design Moderno
- **Login Elegante**: Página de login com gradiente moderno e animações suaves
- **Interface Admin**: Design profissional preto e branco com fonte Inter
- **Interface Educador**: Layout mobile-friendly e intuitivo
- **Totalmente Responsivo**: Funciona perfeitamente em celular, tablet e desktop
- **Modo Escuro**: Suporte completo para tema claro e escuro

### 🔐 Segurança e Autenticação
- Sistema de login com sessões PHP
- Senhas criptografadas com password_hash
- Controle de acesso baseado em roles (Admin, Suporte, Educador)
- Proteção contra SQL Injection

### 👥 Gestão de Funcionários
- Cadastro, edição e exclusão de funcionários
- Autocomplete para Empresa e Setor
- Busca e filtros em tempo real
- Sincronização automática com banco de dados

### 📈 Dashboard Administrativo
- Gráficos interativos com Chart.js
- Estatísticas de presença em tempo real
- Visualização por empresa, setor e período
- Exportação para Excel

### 🔑 Controle de Acesso
- Permissões por empresa para educadores
- Interface visual para gerenciar acessos
- Restrições automáticas baseadas em role

### 📱 Funcionalidades Mobile
- Interface otimizada para toque
- Animações suaves e responsivas
- Layout adaptativo para todas as telas
- Suporte a orientação landscape

## 🚀 Instalação

### Requisitos
- XAMPP (Apache + MySQL + PHP 7.4+)
- Navegador moderno (Chrome, Firefox, Edge, Safari)

### Passo a Passo

1. **Instale o XAMPP**
   - Baixe em: https://www.apachefriends.org/
   - Instale e inicie Apache e MySQL

2. **Clone/Copie o Projeto**
   ```bash
   cd C:\xampp\htdocs\
   # Copie a pasta "Lista de Presença" aqui
   ```

3. **Configure o Banco de Dados**
   - Acesse: http://localhost/phpmyadmin
   - Crie um banco chamado `presenca_db`
   - Execute o script de setup:
   ```
   http://localhost/Lista%20de%20Presença/api/setup_database.php
   ```

4. **Configure as Credenciais**
   - Edite `config.php` se necessário
   - Padrão: host=localhost, user=root, password=''

5. **Acesse o Sistema**
   ```
   http://localhost/Lista%20de%20Presença/
   ```

### Usuários Padrão

Após executar o setup, use:

**Admin:**
- Usuário: `admin`
- Senha: `admin123`

**Educador:**
- Usuário: `educador`
- Senha: `educador123`

## 📁 Estrutura do Projeto

```
Lista de Presença/
├── css/
│   ├── styles.css          # Estilos principais
│   ├── admin-styles.css    # Estilos do admin (preto/branco)
│   ├── login-styles.css    # Estilos da página de login
│   └── responsive.css      # Media queries para responsividade
│
├── js/
│   ├── script.js           # Lógica principal do educador
│   ├── admin-script.js     # Lógica do painel admin
│   └── helpers.js          # Funções auxiliares
│
├── api/
│   ├── api_check_session.php    # Verificação de sessão
│   ├── api_login.php            # Autenticação
│   ├── api_logout.php           # Logout
│   ├── api_funcionarios.php     # CRUD de funcionários
│   ├── api_presenca.php         # Registro de presença
│   ├── api_users.php            # Gestão de usuários
│   ├── api_reports.php          # Relatórios e estatísticas
│   ├── export_excel.php         # Exportação Excel
│   ├── setup_database.php       # Setup inicial do BD
│   └── setup_users.php          # Criação de usuários padrão
│
├── index.html              # Interface do educador
├── admin.html              # Interface administrativa
├── config.php              # Configuração do banco de dados
└── README.md               # Este arquivo

```

## 🎯 Funcionalidades Detalhadas

### Interface do Educador

1. **Seleção de Empresa**: Lista todas as empresas cadastradas
2. **Seleção de Setor**: Filtra setores da empresa escolhida
3. **Seleção de Funcionários**: Múltipla seleção com feedback visual
4. **Envio de Presença**: Registro com validação de duplicatas
5. **Histórico**: Visualização e remoção de registros do dia

### Interface Administrativa

#### Dashboard
- Total de presenças do dia
- Gráfico de presença dos últimos 7 dias
- Distribuição por empresa (hoje)
- Distribuição por setor (hoje)
- Botão de exportação para Excel
- Atualização em tempo real

#### Gerenciar Funcionários
- Listagem completa com busca
- Adicionar novo funcionário
- Editar funcionário existente
- Excluir funcionário
- Autocomplete para Empresa e Setor
- Sincronização automática

#### Gerenciar Acessos
- Selecionar educador
- Definir empresas permitidas
- Salvar permissões
- Validação automática no login

## 🎨 Temas e Personalização

### Modo Escuro
- Ativado pelo botão 🌙 no canto superior direito
- Preferência salva em localStorage
- Cores otimizadas para baixa luminosidade

### Cores do Admin
- **Sidebar**: Gradiente preto (#0a0a0a → #1a1a1a)
- **Fundo**: Branco puro (#ffffff)
- **Texto**: Preto (#1a1a1a)
- **Accent**: Preto para botões primários
- **Fonte**: Inter (Google Fonts)

### Animações
- Fade in ao carregar telas
- Slide in para itens de lista
- Scale in para modais
- Hover effects em todos os botões
- Transições suaves (cubic-bezier)

## 📱 Responsividade

### Breakpoints

- **Desktop**: > 1024px (layout completo)
- **Tablet**: 768px - 1024px (layout adaptado)
- **Mobile**: < 768px (layout vertical)
- **Small Mobile**: < 480px (otimizado para telas pequenas)
- **Landscape**: altura < 500px (ajustes para orientação horizontal)

### Adaptações Mobile

- Sidebar do admin vira horizontal
- Botões em coluna única
- Modais ocupam 95% da tela
- Fonte reduzida proporcionalmente
- Touch targets otimizados (mínimo 44px)
- Gráficos responsivos

## 🔧 Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica
- **CSS3**: Flexbox, Grid, Animations, Variables
- **JavaScript ES6+**: Async/Await, Fetch API, Modules
- **Chart.js 4.4.0**: Gráficos interativos
- **Google Fonts**: Inter font family

### Backend
- **PHP 7.4+**: Lógica de servidor
- **MySQL**: Banco de dados relacional
- **PDO**: Prepared statements para segurança
- **Sessions**: Gerenciamento de estado

### Arquitetura
- **SPA**: Single Page Application para educador
- **MPA**: Multi Page Application (admin separado)
- **REST-like API**: Endpoints PHP com JSON
- **MVC Pattern**: Separação de responsabilidades

## 🔒 Segurança

### Implementações
- ✅ Password hashing (password_hash/verify)
- ✅ Prepared statements (PDO)
- ✅ Session management
- ✅ CSRF protection (session-based)
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS prevention (htmlspecialchars)

### Boas Práticas
- Senhas nunca armazenadas em texto plano
- Validação server-side e client-side
- Logs de debug para troubleshooting
- Separação de roles e permissões

## 📊 Banco de Dados

### Tabelas

#### `funcionarios`
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- Nome (VARCHAR 255)
- Empresa (VARCHAR 255)
- Setor (VARCHAR 255)
```

#### `presenca`
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- funcionario (VARCHAR 255)
- empresa (VARCHAR 255)
- setor (VARCHAR 255)
- data_hora (DATE)
```

#### `users`
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- username (VARCHAR 50, UNIQUE)
- password (VARCHAR 255)
- role (ENUM: 'admin', 'educador', 'suporte')
- empresas (TEXT, JSON)
```

## 🐛 Troubleshooting

### Erro de Conexão com Banco
1. Verifique se MySQL está rodando no XAMPP
2. Confirme credenciais em `config.php`
3. Execute `setup_database.php` novamente

### Login Não Funciona
1. Verifique se `setup_users.php` foi executado
2. Limpe cookies e cache do navegador
3. Verifique logs em `debug.log`

### Gráficos Não Aparecem
1. Verifique conexão com internet (Chart.js CDN)
2. Abra console do navegador (F12)
3. Verifique se `api_reports.php` retorna dados

### Estilos Quebrados
1. Verifique se todos os arquivos CSS existem em `/css/`
2. Limpe cache (Ctrl + Shift + R)
3. Verifique console para erros 404

## 📝 Changelog

### v2.1.0 (2025-11-23)
- ✨ Nova funcionalidade: Educadores podem cadastrar funcionários
- 🧹 Limpeza de código: Remoção de scripts de debug e setup não utilizados
- 📝 Atualização da documentação

### v2.0.0 (2025-11-22)
- ✨ Redesign completo do Admin (preto e branco)
- ✨ Nova página de login elegante
- ✨ Sistema totalmente responsivo
- ✨ Organização em pastas (css/, js/, api/)
- ✨ Autocomplete para Empresa e Setor
- 🐛 Fix no botão de remover histórico
- 📚 README completo

### v1.0.0
- 🎉 Lançamento inicial
- ✅ Migração para PHP/MySQL
- ✅ Sistema de login
- ✅ Dashboard com gráficos
- ✅ Controle de acesso por empresa

## 👨‍💻 Desenvolvimento

### Adicionar Novo Endpoint
1. Crie arquivo em `/api/`
2. Use PDO para queries
3. Retorne JSON
4. Adicione validação de sessão

### Modificar Estilos
- Educador: `css/styles.css`
- Admin: `css/admin-styles.css`
- Login: `css/login-styles.css`
- Responsivo: `css/responsive.css`

### Adicionar Funcionalidade
1. HTML em `index.html` ou `admin.html`
2. JavaScript em `js/script.js` ou `js/admin-script.js`
3. Backend em `/api/`
4. Teste em mobile e desktop

## 📄 Licença

Este projeto é de uso interno. Todos os direitos reservados.

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique a seção Troubleshooting
2. Consulte os logs em `debug.log`
3. Revise o código fonte (bem comentado)

---

**Desenvolvido com ❤️ para gestão eficiente de presença**