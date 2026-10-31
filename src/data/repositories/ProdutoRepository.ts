import { getDatabaseConnection } from '../database/database';
import { Produto } from '../../domain/entities/Produto';

interface ProdutoRow {
  id: number;
  nome: string;
  preco: number;
  quantidade_estoque: number;
  qtd_promocao: number;
  preco_promocao: number;
}

export class ProdutoRepository {
  private mapRowToEntity(row: ProdutoRow): Produto {
    return new Produto(
      row.id,
      row.nome,
      row.preco,
      row.quantidade_estoque,
      row.qtd_promocao || 0,
      row.preco_promocao || 0
    );
  }

  public async salvar(
    nome: string,
    preco: number,
    quantidadeEstoque: number,
    qtdPromocao: number = 0,
    precoPromocao: number = 0
  ): Promise<Produto> {
    const db = await getDatabaseConnection();
    const resultado = await db.runAsync(
      'INSERT INTO produtos (nome, preco, quantidade_estoque, qtd_promocao, preco_promocao) VALUES (?, ?, ?, ?, ?)',
      [nome, preco, quantidadeEstoque, qtdPromocao, precoPromocao]
    );

    return new Produto(
      resultado.lastInsertRowId,
      nome,
      preco,
      quantidadeEstoque,
      qtdPromocao,
      precoPromocao
    );
  }

  public async listarTodos(): Promise<Produto[]> {
    const db = await getDatabaseConnection();
    const linhas = await db.getAllAsync<ProdutoRow>(
      'SELECT * FROM produtos ORDER BY nome ASC'
    );

    return linhas.map((linha) => this.mapRowToEntity(linha));
  }

  public async buscarPorNome(termo: string): Promise<Produto[]> {
    const db = await getDatabaseConnection();
    const linhas = await db.getAllAsync<ProdutoRow>(
      'SELECT * FROM produtos WHERE nome LIKE ? ORDER BY nome ASC',
      [`%${termo}%`]
    );

    return linhas.map((linha) => this.mapRowToEntity(linha));
  }

  public async buscarPorId(id: number): Promise<Produto | null> {
    const db = await getDatabaseConnection();
    const linha = await db.getFirstAsync<ProdutoRow>(
      'SELECT * FROM produtos WHERE id = ?',
      [id]
    );

    return linha ? this.mapRowToEntity(linha) : null;
  }

  public async atualizar(produto: Produto): Promise<void> {
    const db = await getDatabaseConnection();
    await db.runAsync(
      'UPDATE produtos SET nome = ?, preco = ?, quantidade_estoque = ?, qtd_promocao = ?, preco_promocao = ? WHERE id = ?',
      [
        produto.getNome(),
        produto.getPreco(),
        produto.getQuantidadeEstoque(),
        produto.getQtdPromocao(),
        produto.getPrecoPromocao(),
        produto.getId(),
      ]
    );
  }

  public async remover(id: number): Promise<void> {
    const db = await getDatabaseConnection();
    await db.runAsync('DELETE FROM produtos WHERE id = ?', [id]);
  }
}