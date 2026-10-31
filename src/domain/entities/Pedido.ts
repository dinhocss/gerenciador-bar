import { ItemPedido } from './ItemPedido';
import { Produto } from './Produto';

export class Pedido {
  private id: number;
  private data: Date;
  private statusPagamento: boolean;
  private itens: ItemPedido[];
  private derrotasPurrinha: number;
  private totalPurrinha: number;

  constructor(
    id: number,
    data: Date = new Date(),
    statusPagamento: boolean = false,
    itens: ItemPedido[] = [],
    derrotasPurrinha: number = 0,
    totalPurrinha: number = 0
  ) {
    this.id = id;
    this.data = data;
    this.statusPagamento = statusPagamento;
    this.itens = itens;
    this.derrotasPurrinha = derrotasPurrinha;
    this.totalPurrinha = totalPurrinha;
  }

  public getId(): number {
    return this.id;
  }

  public getData(): Date {
    return this.data;
  }

  public isPago(): boolean {
    return this.statusPagamento;
  }

  public getItens(): ItemPedido[] {
    return this.itens;
  }

  public getDerrotasPurrinha(): number {
    return this.derrotasPurrinha;
  }

  public getTotalPurrinha(): number {
    return this.totalPurrinha;
  }

  public registrarDerrotaPurrinha(valorCombo: number): void {
    this.derrotasPurrinha += 1;
    this.totalPurrinha += valorCombo;
  }

  public adicionarProduto(produto: Produto, quantidade: number, novoItemId: number = 0): void {
    const itemExistente = this.itens.find(
      (item) => item.getProduto().getId() === produto.getId()
    );

    if (itemExistente) {
      itemExistente.adicionarQuantidade(quantidade);
    } else {
      const novoItem = new ItemPedido(novoItemId, quantidade, produto);
      this.itens.push(novoItem);
    }
  }

  public calcularTotal(): number {
    return this.itens.reduce((acumulador, item) => {
      return acumulador + item.calculaSubtotal();
    }, 0);
  }

  public marcarComoPago(): void {
    this.statusPagamento = true;
  }

  public desmarcarPagamento(): void {
    this.statusPagamento = false;
  }
}