import { getDatabaseConnection } from '../database/database';
import { Cliente } from '../../domain/entities/Cliente';
import { Pedido } from '../../domain/entities/Pedido';
import { ItemPedido } from '../../domain/entities/ItemPedido';
import { Produto } from '../../domain/entities/Produto';

interface ClientePedidoRow {
  cliente_id: number;
  cliente_nome: string;
  pedido_id: number;
  pedido_data: string;
  pedido_status_pagamento: number;
  pedido_derrotas_purrinha: number;
  pedido_total_purrinha: number;
}

interface ItemProdutoRow {
  item_id: number;
  item_quantidade: number;
  produto_id: number;
  produto_nome: string;
  produto_preco: number;
  produto_estoque: number;
  produto_qtd_promo: number;
  produto_preco_promo: number;
}

export class ClienteRepository {
  public async criarClienteComPedido(nomeCliente: string): Promise<Cliente> {
    const db = await getDatabaseConnection();
    const dataAtual = new Date();

    let novoPedidoId = 0;
    let novoClienteId = 0;

    await db.withTransactionAsync(async () => {
      const resultadoPedido = await db.runAsync(
        'INSERT INTO pedidos (data, status_pagamento, derrotas_purrinha, total_purrinha) VALUES (?, ?, 0, 0)',
        [dataAtual.toISOString(), 0]
      );
      novoPedidoId = resultadoPedido.lastInsertRowId;

      const resultadoCliente = await db.runAsync(
        'INSERT INTO clientes (nome, pedido_id) VALUES (?, ?)',
        [nomeCliente, novoPedidoId]
      );
      novoClienteId = resultadoCliente.lastInsertRowId;
    });

    const novoPedido = new Pedido(novoPedidoId, dataAtual, false, [], 0, 0);
    return new Cliente(novoClienteId, nomeCliente, novoPedido);
  }

  public async listarClientesAtivos(): Promise<Cliente[]> {
    const db = await getDatabaseConnection();

    const clientesRows = await db.getAllAsync<ClientePedidoRow>(`
      SELECT 
        c.id AS cliente_id,
        c.nome AS cliente_nome,
        p.id AS pedido_id,
        p.data AS pedido_data,
        p.status_pagamento AS pedido_status_pagamento,
        p.derrotas_purrinha AS pedido_derrotas_purrinha,
        p.total_purrinha AS pedido_total_purrinha
      FROM clientes c
      INNER JOIN pedidos p ON c.pedido_id = p.id
      WHERE p.status_pagamento = 0
      ORDER BY c.id ASC
    `);

    const clientes: Cliente[] = [];

    for (const row of clientesRows) {
      const itens = await this.buscarItensPorPedidoId(row.pedido_id);

      const pedido = new Pedido(
        row.pedido_id,
        new Date(row.pedido_data),
        row.pedido_status_pagamento === 1,
        itens,
        row.pedido_derrotas_purrinha || 0,
        row.pedido_total_purrinha || 0
      );

      const cliente = new Cliente(row.cliente_id, row.cliente_nome, pedido);
      clientes.push(cliente);
    }

    return clientes;
  }

  public async buscarPorId(clienteId: number): Promise<Cliente | null> {
    const db = await getDatabaseConnection();

    const row = await db.getFirstAsync<ClientePedidoRow>(
      `
      SELECT 
        c.id AS cliente_id,
        c.nome AS cliente_nome,
        p.id AS pedido_id,
        p.data AS pedido_data,
        p.status_pagamento AS pedido_status_pagamento,
        p.derrotas_purrinha AS pedido_derrotas_purrinha,
        p.total_purrinha AS pedido_total_purrinha
      FROM clientes c
      INNER JOIN pedidos p ON c.pedido_id = p.id
      WHERE c.id = ?
    `,
      [clienteId]
    );

    if (!row) return null;

    const itens = await this.buscarItensPorPedidoId(row.pedido_id);

    const pedido = new Pedido(
      row.pedido_id,
      new Date(row.pedido_data),
      row.pedido_status_pagamento === 1,
      itens,
      row.pedido_derrotas_purrinha || 0,
      row.pedido_total_purrinha || 0
    );

    return new Cliente(row.cliente_id, row.cliente_nome, pedido);
  }

  public async salvarItemNoPedido(
    pedidoId: number,
    produtoId: number,
    quantidadeAdicional: number
  ): Promise<void> {
    const db = await getDatabaseConnection();

    const itemExistente = await db.getFirstAsync<{ id: number; quantidade: number }>(
      'SELECT id, quantidade FROM itens_pedido WHERE pedido_id = ? AND produto_id = ?',
      [pedidoId, produtoId]
    );

    if (itemExistente) {
      const novaQuantidade = itemExistente.quantidade + quantidadeAdicional;
      await db.runAsync(
        'UPDATE itens_pedido SET quantidade = ? WHERE id = ?',
        [novaQuantidade, itemExistente.id]
      );
    } else {
      await db.runAsync(
        'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade) VALUES (?, ?, ?)',
        [pedidoId, produtoId, quantidadeAdicional]
      );
    }
  }

  public async incrementarPurrinhaNoPedido(
    pedidoId: number,
    valorCombo: number
  ): Promise<void> {
    const db = await getDatabaseConnection();
    await db.runAsync(
      `UPDATE pedidos 
       SET derrotas_purrinha = derrotas_purrinha + 1, 
           total_purrinha = total_purrinha + ? 
       WHERE id = ?`,
      [valorCombo, pedidoId]
    );
  }

  public async atualizarStatusPagamento(pedidoId: number, pago: boolean): Promise<void> {
    const db = await getDatabaseConnection();
    const statusNumerico = pago ? 1 : 0;

    await db.runAsync(
      'UPDATE pedidos SET status_pagamento = ? WHERE id = ?',
      [statusNumerico, pedidoId]
    );
  }

  public async removerPedidoDefinitivamente(pedidoId: number): Promise<void> {
    const db = await getDatabaseConnection();
    await db.runAsync('DELETE FROM pedidos WHERE id = ?', [pedidoId]);
  }

  private async buscarItensPorPedidoId(pedidoId: number): Promise<ItemPedido[]> {
    const db = await getDatabaseConnection();

    const itensRows = await db.getAllAsync<ItemProdutoRow>(
      `
      SELECT 
        ip.id AS item_id,
        ip.quantidade AS item_quantidade,
        pr.id AS produto_id,
        pr.nome AS produto_nome,
        pr.preco AS produto_preco,
        pr.quantidade_estoque AS produto_estoque,
        pr.qtd_promocao AS produto_qtd_promo,
        pr.preco_promocao AS produto_preco_promo
      FROM itens_pedido ip
      INNER JOIN produtos pr ON ip.produto_id = pr.id
      WHERE ip.pedido_id = ?
    `,
      [pedidoId]
    );

    return itensRows.map((row) => {
      const produto = new Produto(
        row.produto_id,
        row.produto_nome,
        row.produto_preco,
        row.produto_estoque,
        row.produto_qtd_promo || 0,
        row.produto_preco_promo || 0
      );
      return new ItemPedido(row.item_id, row.item_quantidade, produto);
    });
  }
}