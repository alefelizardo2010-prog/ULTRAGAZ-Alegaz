-- ============================================================
-- Projeto: ULTRAGAZ-Alegaz
-- Modelo Físico (MySQL / MariaDB)
-- ============================================================

CREATE DATABASE IF NOT EXISTS ultragaz
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ultragaz;

-- ------------------------------------------------------------
-- Tabela: cliente
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cliente (
    id_cliente     INT AUTO_INCREMENT PRIMARY KEY,
    nome           VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL,
    telefone       VARCHAR(20),
    data_cadastro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cliente_email UNIQUE (email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabela: endereco  (1 cliente possui N endereços)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS endereco (
    id_endereco  INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente   INT NOT NULL,
    logradouro   VARCHAR(150) NOT NULL,
    numero       VARCHAR(10)  NOT NULL,
    complemento  VARCHAR(50),
    bairro       VARCHAR(80)  NOT NULL,
    cidade       VARCHAR(80)  NOT NULL,
    estado       CHAR(2)      NOT NULL,
    cep          CHAR(8)      NOT NULL,
    CONSTRAINT fk_endereco_cliente
        FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabela: produto
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produto (
    id_produto  INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(100)  NOT NULL,
    descricao   VARCHAR(255),
    peso_kg     DECIMAL(6,2),
    preco       DECIMAL(10,2) NOT NULL,
    ativo       TINYINT(1)    NOT NULL DEFAULT 1,
    CONSTRAINT ck_produto_preco CHECK (preco >= 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabela: pedido
-- (1 cliente faz N pedidos; 1 endereço recebe N pedidos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido        INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente       INT NOT NULL,
    id_endereco      INT NOT NULL,
    data_pedido      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status           ENUM('PENDENTE','EM_ROTA','ENTREGUE','CANCELADO')
                     NOT NULL DEFAULT 'PENDENTE',
    forma_pagamento  ENUM('DINHEIRO','PIX','CARTAO_DEBITO','CARTAO_CREDITO')
                     NOT NULL,
    valor_total      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_pedido_cliente
        FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_endereco
        FOREIGN KEY (id_endereco) REFERENCES endereco (id_endereco)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabela: item_pedido  (resolve o N:M entre pedido e produto)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_pedido (
    id_pedido       INT NOT NULL,
    id_produto      INT NOT NULL,
    quantidade      INT NOT NULL,
    preco_unitario  DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_pedido, id_produto),
    CONSTRAINT fk_item_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedido (id_pedido)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_item_produto
        FOREIGN KEY (id_produto) REFERENCES produto (id_produto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT ck_item_quantidade CHECK (quantidade > 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabela: mensagens_contato (tabela original do formulário)
-- id_cliente é opcional: visitante pode enviar sem ter cadastro
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mensagens_contato (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente  INT NULL,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL,
    mensagem    TEXT NOT NULL,
    data_envio  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensagem_cliente
        FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Índices auxiliares para consultas frequentes
-- ------------------------------------------------------------
CREATE INDEX idx_endereco_cliente ON endereco (id_cliente);
CREATE INDEX idx_pedido_cliente   ON pedido (id_cliente);
CREATE INDEX idx_pedido_status    ON pedido (status);

-- ------------------------------------------------------------
-- Dados de exemplo (opcional, para testar o sistema)
-- ------------------------------------------------------------
INSERT INTO produto (nome, descricao, peso_kg, preco) VALUES
    ('Botijão P13', 'Gás de cozinha 13 kg', 13.00, 134.00),
    ('Botijão P20', 'Gás 20 kg',            20.00, 245.00),
    ('Botijão P45', 'Gás industrial 45 kg', 45.00, 480.00);
