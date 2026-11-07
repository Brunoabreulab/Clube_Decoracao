from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator
from typing import List
import psycopg
import os
import re

app = FastAPI(title="API Clube Decoração")


# 1. Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://brunoabreulab.github.io"
                  "https://www.clubedecoracao.com.br"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# 2. Conexão com PostgreSQL (Neon)
def conectar_banco():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL não configurada no Render.")

    return psycopg.connect(database_url)


# 3. Inicialização do Banco de Dados
def init_db():
    with conectar_banco() as conn:
        with conn.cursor() as cursor:

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS usuarios (
                    id SERIAL PRIMARY KEY,
                    nome_completo TEXT NOT NULL,
                    cpf TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS pedidos (
                    id SERIAL PRIMARY KEY,
                    usuario_id INTEGER REFERENCES usuarios(id),
                    status TEXT DEFAULT 'aguardando_pagamento',
                    valor_total REAL NOT NULL,
                    forma_pagamento TEXT DEFAULT 'PIX',
                    cep TEXT NOT NULL,
                    cidade TEXT NOT NULL,
                    estado TEXT NOT NULL,
                    numero TEXT NOT NULL
                )
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS itens_pedido (
                    id SERIAL PRIMARY KEY,
                    pedido_id INTEGER REFERENCES pedidos(id),
                    titulo TEXT NOT NULL,
                    tamanho TEXT NOT NULL,
                    quantidade INTEGER NOT NULL,
                    preco_unitario REAL NOT NULL
                )
            """)


@app.on_event("startup")
def iniciar_api():
    init_db()


# 4. Modelos de Validação
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

    @field_validator('nome_completo')
    def validar_nome(cls, v):
        if len(v.strip().split()) < 2:
            raise ValueError('Informe nome e sobrenome.')
        return v.strip()

    @field_validator('cpf')
    def validar_cpf(cls, v):
        cpf_limpo = re.sub(r'\D', '', v)
        if len(cpf_limpo) != 11:
            raise ValueError('CPF deve conter 11 dígitos.')
        return cpf_limpo

    @field_validator('cep')
    def validar_cep(cls, v):
        cep_limpo = re.sub(r'\D', '', v)
        if len(cep_limpo) != 8:
            raise ValueError('CEP deve conter 8 dígitos.')
        return cep_limpo


# 5. Rota Principal de Checkout
@app.post("/api/checkout", status_code=status.HTTP_201_CREATED)
def realizar_checkout(dados: CheckoutSchema):

    try:
        with conectar_banco() as conn:
            with conn.cursor() as cursor:

                # Cadastrar ou atualizar usuário
                cursor.execute("""
                    INSERT INTO usuarios (nome_completo, cpf, email)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (cpf) DO UPDATE SET
                        nome_completo = EXCLUDED.nome_completo,
                        email = EXCLUDED.email
                    RETURNING id
                """, (
                    dados.nome_completo,
                    dados.cpf,
                    dados.email
                ))

                usuario_id = cursor.fetchone()[0]

                # Calcular valor total
                valor_total = sum(
                    item.preco * item.quantidade
                    for item in dados.itens
                )

                # Inserir pedido
                cursor.execute("""
                    INSERT INTO pedidos (
                        usuario_id,
                        valor_total,
                        cep,
                        cidade,
                        estado,
                        numero
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    usuario_id,
                    valor_total,
                    dados.cep,
                    dados.cidade,
                    dados.estado,
                    dados.numero
                ))

                pedido_id = cursor.fetchone()[0]

                # Inserir itens do pedido
                for item in dados.itens:
                    cursor.execute("""
                        INSERT INTO itens_pedido (
                            pedido_id,
                            titulo,
                            tamanho,
                            quantidade,
                            preco_unitario
                        )
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        pedido_id,
                        item.titulo,
                        item.tamanho,
                        item.quantidade,
                        item.preco
                    ))

        return {
            "sucesso": True,
            "mensagem": "Pedido registrado com sucesso!",
            "pedido_id": pedido_id
        }

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar o pedido no banco de dados."
        )
