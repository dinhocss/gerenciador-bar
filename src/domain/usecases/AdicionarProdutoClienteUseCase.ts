import { ClienteRepository } from '../../data/repositories/ClienteRepository';
import { ProdutoRepository } from '../../data/repositories/ProdutoRepository';
import { Produto } from '../entities/Produto';

export interface ResultadoAdicaoItem {
  emitirAlertaEstoqueZerado: boolean;
  mensagemAlerta?: string;
}

export class AdicionarProdutoClienteUseCase {
  constructor(
    private clienteRepo: ClienteRepository,
    private produtoRepo: ProdutoRepository
  ) {}

  public async executar(
    pedidoId: number,
    produtoId: number,
    quantidade: number
  ): Promise<ResultadoAdicaoItem> {
    if (quantidade <= 0) {
      throw new Error('A quantidade deve ser maior que zero.');
    }

    const produto = await this.produtoRepo.buscarPorId(produtoId);
    if (!produto) {
      throw new Error('Produto não encontrado no cardápio.');
    }

    const estoqueAnterior = produto.getQuantidadeEstoque();

    produto.decrementarEstoque(quantidade);
    const estoqueAtual = produto.getQuantidadeEstoque();

    await this.clienteRepo.salvarItemNoPedido(pedidoId, produtoId, quantidade);
    await this.produtoRepo.atualizar(produto);

    const acabouDeZerar = estoqueAnterior > 0 && estoqueAtual === 0;

    return {
      emitirAlertaEstoqueZerado: acabouDeZerar,
      mensagemAlerta: acabouDeZerar
        ? `Atenção: O estoque de "${produto.getNome()}" chegou a 0!`
        : undefined,
    };
  }

  public async listarOpcoesPurrinha(): Promise<Produto[]> {
    const todosProdutos = await this.produtoRepo.listarTodos();
    return todosProdutos.filter((p) => p.temPromocaoAtiva());
  }

  public async registrarDerrotaPurrinha(
    pedidoId: number,
    produtoEscolhido: Produto
  ): Promise<ResultadoAdicaoItem> {
    const qtdCombo =
      produtoEscolhido.getQtdPromocao() > 0 ? produtoEscolhido.getQtdPromocao() : 3;

    const valorCombo =
      produtoEscolhido.getPrecoPromocao() > 0
        ? produtoEscolhido.getPrecoPromocao()
        : qtdCombo * produtoEscolhido.getPreco();

    // 1. Contabiliza +1 derrota e soma o valor exclusivo de Purrinha no pedido
    await this.clienteRepo.incrementarPurrinhaNoPedido(pedidoId, valorCombo);

    // 2. Adiciona os itens na comanda geral e abate do estoque
    return await this.executar(pedidoId, produtoEscolhido.getId(), qtdCombo);
  }
}