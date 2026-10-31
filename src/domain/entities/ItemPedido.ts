import { Produto } from './Produto';

export class ItemPedido {
  private id: number;
  private quantidade: number;
  private produto: Produto;

  constructor(id: number, quantidade: number, produto: Produto) {
    if (quantidade <= 0) {
      throw new Error('A quantidade do item deve ser maior que zero.');
    }
    this.id = id;
    this.quantidade = quantidade;
    this.produto = produto;
  }

  public getId(): number {
    return this.id;
  }

  public getQuantidade(): number {
    return this.quantidade;
  }

  public getProduto(): Produto {
    return this.produto;
  }

  public adicionarQuantidade(quantidadeAdicional: number): void {
    if (quantidadeAdicional > 0) {
      this.quantidade += quantidadeAdicional;
    }
  }

  public calculaSubtotal(): number {
    if (
      this.produto.temPromocaoAtiva() &&
      this.quantidade >= this.produto.getQtdPromocao()
    ) {
      const tamanhoCombo = this.produto.getQtdPromocao();
      const precoCombo = this.produto.getPrecoPromocao();

      const qtdCombos = Math.floor(this.quantidade / tamanhoCombo);
      const qtdAvulsas = this.quantidade % tamanhoCombo;

      return qtdCombos * precoCombo + qtdAvulsas * this.produto.getPreco();
    }

    return this.quantidade * this.produto.getPreco();
  }
}