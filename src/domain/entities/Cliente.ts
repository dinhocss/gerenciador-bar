import { Pedido } from './Pedido';

export class Cliente {
  private id: number;
  private nome: string;
  private pedido: Pedido;

  constructor(id: number, nome: string, pedido: Pedido) {
    if (!nome || nome.trim().length === 0) {
      throw new Error('O nome do cliente não pode ser vazio.');
    }
    this.id = id;
    this.nome = nome.trim();
    this.pedido = pedido;
  }

  public getId(): number {
    return this.id;
  }

  public getNome(): string {
    return this.nome;
  }

  public getPedido(): Pedido {
    return this.pedido;
  }

  public getTotalConsumo(): number {
    return this.pedido.calcularTotal();
  }

  public getDerrotasPurrinha(): number {
    return this.pedido.getDerrotasPurrinha();
  }

  public getTotalPurrinha(): number {
    return this.pedido.getTotalPurrinha();
  }
}