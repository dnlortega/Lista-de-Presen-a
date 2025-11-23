CREATE DATABASE IF NOT EXISTS sistema_presenca;
USE sistema_presenca;

CREATE TABLE IF NOT EXISTS funcionarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    empresa VARCHAR(255) NOT NULL,
    setor VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS presenca (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa VARCHAR(255) NOT NULL,
    setor VARCHAR(255) NOT NULL,
    funcionario VARCHAR(255) NOT NULL,
    data_hora DATE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'educador', 'suporte') NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario_empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    empresa VARCHAR(255) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
