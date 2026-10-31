import { ClienteRepository } from '../../data/repositories/ClienteRepository';

export class FinalizarContaUseCase {
  constructor(private clienteRepo: ClienteRepository) {}

  // Marca como pago e oculta o card da tela principal (UC04 - Passo 2)
  public async concluirPagamento(pedidoId: number): Promise<void> {
    await this.clienteRepo.atualizarStatusPagamento(pedidoId, true);
  }

  // Restaura o card na tela principal se o dono clicar em "Desfazer" (UC04 - Fluxo 3a)
  public async desfazerPagamento(pedidoId: number): Promise<void> {
    await this.clienteRepo.atualizarStatusPagamento(pedidoId, false);
  }

  // Chamado automaticamente após os segundos do botão "Desfazer" expirarem
  public async arquivarDefinitivamente(pedidoId: number): Promise<void> {
    await this.clienteRepo.removerPedidoDefinitivamente(pedidoId);
  }
}