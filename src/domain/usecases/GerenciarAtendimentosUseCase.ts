import { ClienteRepository } from '../../data/repositories/ClienteRepository';
import { Cliente } from '../entities/Cliente';

export class GerenciarAtendimentosUseCase {
  constructor(private clienteRepo: ClienteRepository) {}

  // Lista todos os clientes ativos para renderizar os cards na tela principal (UC01)
  public async listarClientesAtivos(): Promise<Cliente[]> {
    return await this.clienteRepo.listarClientesAtivos();
  }

  // Adiciona um novo cliente no dia ao tocar no '+' (UC01)
  public async abrirAtendimento(nomeCliente: string): Promise<Cliente> {
    if (!nomeCliente || nomeCliente.trim().length === 0) {
      throw new Error("Por favor, informe o nome do cliente para abrir a comanda.");
    }
    return await this.clienteRepo.criarClienteComPedido(nomeCliente.trim());
  }

  // Busca o cliente com todos os itens consumidos ao clicar no card (UC02)
  public async visualizarDetalhesConsumo(clienteId: number): Promise<Cliente> {
    const cliente = await this.clienteRepo.buscarPorId(clienteId);
    if (!cliente) {
      throw new Error("Atendimento não encontrado.");
    }
    return cliente;
  }
}