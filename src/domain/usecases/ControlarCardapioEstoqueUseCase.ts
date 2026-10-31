import { ProdutoRepository } from '../../data/repositories/ProdutoRepository';
import { Produto } from '../entities/Produto';

export class ControlarCardapioEstoqueUseCase {
  constructor(private produtoRepo: ProdutoRepository) {}

  public async listarCardapio(): Promise<Produto[]> {
    return await this.produtoRepo.listarTodos();
  }

  public async buscarProdutosPorNome(termo: string): Promise<Produto[]> {
    if (!termo || termo.trim().length === 0) {
      return await this.produtoRepo.listarTodos();
    }
    return await this.produtoRepo.buscarPorNome(termo.trim());
  }

  public async cadastrarProduto(
    nome: string,
    preco: number,
    quantidadeEstoque: number,
    qtdPromocao: number = 0,
    precoPromocao: number = 0
  ): Promise<Produto> {
    if (!nome || nome.trim().length === 0) {
      throw new Error('O nome do produto é obrigatório.');
    }
    if (preco < 0) {
      throw new Error('O preço do produto não pode ser negativo.');
    }
    if (quantidadeEstoque < 0) {
      throw new Error('A quantidade em estoque não pode ser negativa.');
    }
    if (qtdPromocao < 0 || precoPromocao < 0) {
      throw new Error('Os valores da promoção não podem ser negativos.');
    }

    return await this.produtoRepo.salvar(
      nome.trim(),
      preco,
      quantidadeEstoque,
      qtdPromocao,
      precoPromocao
    );
  }

  public async atualizarProduto(
    id: number,
    nome: string,
    preco: number,
    novaQuantidadeEstoque: number,
    qtdPromocao: number = 0,
    precoPromocao: number = 0
  ): Promise<void> {
    const produto = new Produto(
      id,
      nome.trim(),
      preco,
      novaQuantidadeEstoque,
      qtdPromocao,
      precoPromocao
    );
    await this.produtoRepo.atualizar(produto);
  }

  public async removerProduto(id: number): Promise<void> {
    await this.produtoRepo.remover(id);
  }
}