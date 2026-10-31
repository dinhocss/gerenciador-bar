export class Produto {
  private id: number;
  private nome: string;
  private preco: number;
  private quantidadeEstoque: number;
  private qtdPromocao: number;
  private precoPromocao: number;

  constructor(
    id: number,
    nome: string,
    preco: number,
    quantidadeEstoque: number,
    qtdPromocao: number = 0,
    precoPromocao: number = 0
  ) {
    this.id = id;
    this.nome = nome;
    this.preco = preco;
    this.quantidadeEstoque = quantidadeEstoque;
    this.qtdPromocao = qtdPromocao;
    this.precoPromocao = precoPromocao;
  }

  public getId(): number {
    return this.id;
  }

  public getNome(): string {
    return this.nome;
  }

  public getPreco(): number {
    return this.preco;
  }

  public getQuantidadeEstoque(): number {
    return this.quantidadeEstoque;
  }

  public getQtdPromocao(): number {
    return this.qtdPromocao;
  }

  public getPrecoPromocao(): number {
    return this.precoPromocao;
  }

  public temPromocaoAtiva(): boolean {
    return this.qtdPromocao > 1 && this.precoPromocao > 0;
  }

  public decrementarEstoque(quantidadeConsumida: number): void {
    this.quantidadeEstoque -= quantidadeConsumida;
    if (this.quantidadeEstoque < 0) {
      this.quantidadeEstoque = 0;
    }
  }

  public atualizarEstoqueManual(novaQuantidade: number): void {
    this.quantidadeEstoque = novaQuantidade;
  }
}