import * as SQLite from 'expo-sqlite';

export const getDatabaseConnection = async (): Promise<SQLite.SQLiteDatabase> => {
  return await SQLite.openDatabaseAsync('gerenciador_bar.db');
};

export const inicializarBancoDeDados = async (): Promise<void> => {
  const db = await getDatabaseConnection();

  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      preco REAL NOT NULL,
      quantidade_estoque INTEGER NOT NULL DEFAULT 0,
      qtd_promocao INTEGER NOT NULL DEFAULT 0,
      preco_promocao REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      status_pagamento INTEGER NOT NULL DEFAULT 0,
      derrotas_purrinha INTEGER NOT NULL DEFAULT 0,
      total_purrinha REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      pedido_id INTEGER NOT NULL UNIQUE,
      FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS itens_pedido (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL,
      FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE RESTRICT
    );
  `);

  try {
    await db.execAsync('ALTER TABLE produtos ADD COLUMN qtd_promocao INTEGER NOT NULL DEFAULT 0;');
  } catch (e) {}

  try {
    await db.execAsync('ALTER TABLE produtos ADD COLUMN preco_promocao REAL NOT NULL DEFAULT 0;');
  } catch (e) {}

  try {
    await db.execAsync('ALTER TABLE pedidos ADD COLUMN derrotas_purrinha INTEGER NOT NULL DEFAULT 0;');
  } catch (e) {}

  try {
    await db.execAsync('ALTER TABLE pedidos ADD COLUMN total_purrinha REAL NOT NULL DEFAULT 0;');
  } catch (e) {}

  await db.execAsync('DELETE FROM pedidos WHERE status_pagamento = 1;');
};