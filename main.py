from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
import sqlite3
import re

app = FastAPI(title="API Clube Decoração")

# 1. Configuração de CORS (Segurança para permitir requisições do seu Front-end)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://brunoabreulab.github.io"], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# 2. Inicialização do Banco de Dados SQLite
DB_NAME = "clube_decoracao.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Criar tabela de Usuários
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_completo TEXT NOT NULL,
            cpf TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL
        )
    ''')
    
    # Criar tabela de Pedidos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            status TEXT DEFAULT 'aguardando_pagamento',
            valor_total REAL NOT NULL,
            forma_pagamento TEXT DEFAULT 'PIX',
            cep TEXT NOT NULL,
            cidade TEXT NOT NULL,
            estado TEXT NOT NULL,
            numero TEXT NOT NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        )
    ''')

    # Criar tabela de Itens do Pedido
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS itens_pedido (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER,
            titulo TEXT NOT NULL,
            tamanho TEXT NOT NULL,
            quantidade INTEGER NOT NULL,
            preco_unitario REAL NOT NULL,
            FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

# 3. Modelos de Validação de Dados (Pydantic / Sanitização)
class ItemPedidoSchema(BaseModel):
    titulo: str
    tamanho: str
    preco: float
    quantidade: int = 1

class CheckoutSchema(BaseModel):
    nome_completo: str
    cpf: str
    email: EmailStr
    cep: str
    cidade: str
    estado: str
    numero: str
    itens: List[ItemPedidoSchema]

    # Validação de Nome Completo
    @field_validator('nome_completo')
    def validar_nome(cls, v):
        if len(v.strip().split()) < 2:
            raise ValueError('Informe nome e sobrenome.')
        return v.strip()

    # Sanitização e Validação do CPF
    @field_validator('cpf')
    def validar_cpf(cls, v):
        cpf_limpo = re.sub(r'\D', '', v)
        if len(cpf_limpo) != 11:
            raise ValueError('CPF deve conter 11 dígitos.')
        return cpf_limpo

    # Sanitização do CEP
    @field_validator('cep')
    def validar_cep(cls, v):
        cep_limpo = re.sub(r'\D', '', v)
        if len(cep_limpo) != 8:
            raise ValueError('CEP deve conter 8 dígitos.')
        return cep_limpo


# 4. Rota Principal de Checkout
@app.post("/api/checkout", status_code=status.HTTP_201_CREATED)
def realizar_checkout(dados: CheckoutSchema):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    try:
        # Cadastrar ou atualizar Usuário (Prevenção de SQL Injection com ?)
        cursor.execute('''
            INSERT INTO usuarios (nome_completo, cpf, email)
            VALUES (?, ?, ?)
            ON CONFLICT(cpf) DO UPDATE SET
                nome_completo=excluded.nome_completo,
                email=excluded.email
        ''', (dados.nome_completo, dados.cpf, dados.email))
        
        # Buscar ID do Usuário
        cursor.execute("SELECT id FROM usuarios WHERE cpf = ?", (dados.cpf,))
        usuario_id = cursor.fetchone()[0]

        # Calcular total do pedido
        valor_total = sum(item.preco * item.quantidade for item in dados.itens)

        # Inserir Pedido
        cursor.execute('''
            INSERT INTO pedidos (usuario_id, valor_total, cep, cidade, estado, numero)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (usuario_id, valor_total, dados.cep, dados.cidade, dados.estado, dados.numero))
        
        pedido_id = cursor.lastrowid

        # Inserir Itens do Pedido
        for item in dados.itens:
            cursor.execute('''
                INSERT INTO itens_pedido (pedido_id, titulo, tamanho, quantidade, preco_unitario)
                VALUES (?, ?, ?, ?, ?)
            ''', (pedido_id, item.titulo, item.tamanho, item.quantidade, item.preco))

        conn.commit()
        return {
            "sucesso": True,
            "mensagem": "Pedido registrado com sucesso!",
            "pedido_id": pedido_id
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar o pedido no banco de dados."
        )
    finally:
        conn.close()
