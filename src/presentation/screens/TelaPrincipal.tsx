import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Cliente } from '../../domain/entities/Cliente';
import { Produto } from '../../domain/entities/Produto';
import { CardCliente } from '../components/CardCliente';
import { ModalDetalhesCliente } from '../components/ModalDetalhesCliente';

import { GerenciarAtendimentosUseCase } from '../../domain/usecases/GerenciarAtendimentosUseCase';
import { AdicionarProdutoClienteUseCase } from '../../domain/usecases/AdicionarProdutoClienteUseCase';
import { FinalizarContaUseCase } from '../../domain/usecases/FinalizarContaUseCase';
import { ControlarCardapioEstoqueUseCase } from '../../domain/usecases/ControlarCardapioEstoqueUseCase';

interface TelaPrincipalProps {
  gerenciarAtendimentosUC: GerenciarAtendimentosUseCase;
  adicionarProdutoUC: AdicionarProdutoClienteUseCase;
  finalizarContaUC: FinalizarContaUseCase;
  controlarCardapioUC: ControlarCardapioEstoqueUseCase;
  aoIrParaCardapio: () => void;
  aoIrParaPurrinha: () => void;
}

export const TelaPrincipal: React.FC<TelaPrincipalProps> = ({
  gerenciarAtendimentosUC,
  adicionarProdutoUC,
  finalizarContaUC,
  controlarCardapioUC,
  aoIrParaCardapio,
  aoIrParaPurrinha,
}) => {
  const [clientesAtivos, setClientesAtivos] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [modalDetalhesVisivel, setModalDetalhesVisivel] = useState(false);

  const [modalNovoClienteVisivel, setModalNovoClienteVisivel] = useState(false);
  const [nomeNovoCliente, setNomeNovoCliente] = useState('');

  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);

  const [modalPurrinhaVisivel, setModalPurrinhaVisivel] = useState(false);
  const [clientePerdedorPurrinha, setClientePerdedorPurrinha] = useState<Cliente | null>(null);
  const [opcoesComboPurrinha, setOpcoesComboPurrinha] = useState<Produto[]>([]);

  const [clienteRecemPago, setClienteRecemPago] = useState<Cliente | null>(null);
  const timerDesfazerRef = useRef<NodeJS.Timeout | null>(null);

  const carregarClientes = useCallback(async () => {
    try {
      const lista = await gerenciarAtendimentosUC.listarClientesAtivos();
      setClientesAtivos(lista);
    } catch (erro: any) {
      Alert.alert('Erro', erro.message || 'Falha ao carregar atendimentos.');
    }
  }, [gerenciarAtendimentosUC]);

  useEffect(() => {
    carregarClientes();
    return () => {
      if (timerDesfazerRef.current) clearTimeout(timerDesfazerRef.current);
    };
  }, [carregarClientes]);

  const handleCriarCliente = async () => {
    try {
      await gerenciarAtendimentosUC.abrirAtendimento(nomeNovoCliente);
      setNomeNovoCliente('');
      setModalNovoClienteVisivel(false);
      await carregarClientes();
    } catch (erro: any) {
      Alert.alert('Atenção', erro.message);
    }
  };

  const handleClicarNoCard = async (cliente: Cliente) => {
    try {
      const clienteAtualizado = await gerenciarAtendimentosUC.visualizarDetalhesConsumo(
        cliente.getId()
      );
      setClienteSelecionado(clienteAtualizado);
      setModalDetalhesVisivel(true);
    } catch (erro: any) {
      Alert.alert('Erro', erro.message);
    }
  };

  const handleBuscarProduto = async (termo: string) => {
    try {
      const lista = await controlarCardapioUC.buscarProdutosPorNome(termo);
      setProdutosFiltrados(lista);
    } catch (erro: any) {
      Alert.alert('Erro', erro.message);
    }
  };

  const handleAdicionarProduto = async (
    pedidoId: number,
    produtoId: number,
    quantidade: number
  ) => {
    try {
      const resultado = await adicionarProdutoUC.executar(pedidoId, produtoId, quantidade);

      if (resultado.emitirAlertaEstoqueZerado && resultado.mensagemAlerta) {
        Alert.alert('Aviso de Estoque', resultado.mensagemAlerta);
      }

      if (clienteSelecionado) {
        const atualizado = await gerenciarAtendimentosUC.visualizarDetalhesConsumo(
          clienteSelecionado.getId()
        );
        setClienteSelecionado(atualizado);
      }
      await carregarClientes();
    } catch (erro: any) {
      Alert.alert('Erro ao adicionar item', erro.message);
    }
  };

  const confirmarComboPurrinha = async (cliente: Cliente, produtoCombo: Produto) => {
    try {
      const resultado = await adicionarProdutoUC.registrarDerrotaPurrinha(
        cliente.getPedido().getId(),
        produtoCombo
      );
      setModalPurrinhaVisivel(false);
      setClientePerdedorPurrinha(null);

      if (resultado.emitirAlertaEstoqueZerado && resultado.mensagemAlerta) {
        Alert.alert('Aviso de Estoque', resultado.mensagemAlerta);
      }
      await carregarClientes();
    } catch (erro: any) {
      Alert.alert('Atenção', erro.message);
    }
  };

  const handlePerderPurrinha = async (cliente: Cliente) => {
    try {
      const combosDisponiveis = await adicionarProdutoUC.listarOpcoesPurrinha();

      if (combosDisponiveis.length === 0) {
        Alert.alert(
          'Nenhum Combo Cadastrado',
          'Cadastre pelo menos um produto com promoção por lote (ex: Cracudinha 3 por R$ 12) lá no Cardápio!'
        );
        return;
      }

      if (combosDisponiveis.length === 1) {
        const unicoCombo = combosDisponiveis[0];
        const precoFormatado = unicoCombo.getPrecoPromocao().toFixed(2).replace('.', ',');
        Alert.alert(
          '🎲 Perdeu na Purrinha!',
          `Adicionar ${unicoCombo.getQtdPromocao()}x ${unicoCombo.getNome()} (+R$ ${precoFormatado}) na conta de "${cliente.getNome()}"?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: `Confirmar (+R$ ${precoFormatado})`,
              onPress: () => confirmarComboPurrinha(cliente, unicoCombo),
            },
          ]
        );
        return;
      }

      setClientePerdedorPurrinha(cliente);
      setOpcoesComboPurrinha(combosDisponiveis);
      setModalPurrinhaVisivel(true);
    } catch (erro: any) {
      Alert.alert('Erro', erro.message);
    }
  };

  const handleMarcarComoPago = async (cliente: Cliente) => {
    try {
      if (timerDesfazerRef.current && clienteRecemPago) {
        clearTimeout(timerDesfazerRef.current);
        await finalizarContaUC.arquivarDefinitivamente(
          clienteRecemPago.getPedido().getId()
        );
      }

      const pedidoId = cliente.getPedido().getId();
      await finalizarContaUC.concluirPagamento(pedidoId);
      setClienteRecemPago(cliente);
      await carregarClientes();

      timerDesfazerRef.current = setTimeout(async () => {
        await finalizarContaUC.arquivarDefinitivamente(pedidoId);
        setClienteRecemPago(null);
        timerDesfazerRef.current = null;
      }, 5000);
    } catch (erro: any) {
      Alert.alert('Erro', erro.message);
    }
  };

  const handleDesfazerPagamento = async () => {
    if (!clienteRecemPago) return;

    try {
      if (timerDesfazerRef.current) {
        clearTimeout(timerDesfazerRef.current);
        timerDesfazerRef.current = null;
      }

      await finalizarContaUC.desfazerPagamento(clienteRecemPago.getPedido().getId());
      setClienteRecemPago(null);
      await carregarClientes();
    } catch (erro: any) {
      Alert.alert('Erro ao desfazer', erro.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.barraSuperior}>
        <Text style={styles.tituloApp}>COMANDAS</Text>
        <View style={styles.botoesTopo}>
          <TouchableOpacity style={styles.botaoPurrinhaTopo} onPress={aoIrParaPurrinha}>
            <Text style={styles.textoBotaoPurrinhaTopo}>🎲 PURRINHA</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoCardapio} onPress={aoIrParaCardapio}>
            <Text style={styles.textoBotaoCardapio}>📋 CARDÁPIO</Text>
          </TouchableOpacity>
        </View>
      </View>

      {clientesAtivos.length === 0 ? (
        <View style={styles.estadoVazio}>
          <Text style={styles.iconeVazio}>🍻</Text>
          <Text style={styles.tituloVazio}>Nenhum cliente no momento</Text>
          <Text style={styles.subtituloVazio}>
            Toque no botão "+" abaixo para iniciar o primeiro atendimento na rua.
          </Text>
        </View>
      ) : (
        <FlatList
          data={clientesAtivos}
          keyExtractor={(item) => String(item.getId())}
          numColumns={2}
          contentContainerStyle={styles.listaCards}
          renderItem={({ item }) => (
            <CardCliente
              cliente={item}
              aoClicarNoCard={handleClicarNoCard}
              aoMarcarComoPago={handleMarcarComoPago}
              aoPerderPurrinha={handlePerderPurrinha}
            />
          )}
        />
      )}

      {clienteRecemPago && (
        <View style={styles.barraDesfazer}>
          <Text style={styles.textoDesfazer} numberOfLines={1}>
            Conta de "{clienteRecemPago.getNome()}" finalizada.
          </Text>
          <TouchableOpacity onPress={handleDesfazerPagamento} style={styles.botaoDesfazer}>
            <Text style={styles.textoBotaoDesfazer}>DESFAZER</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.botaoFlutuanteMais}
        activeOpacity={0.85}
        onPress={() => setModalNovoClienteVisivel(true)}
      >
        <Text style={styles.iconeMais}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalNovoClienteVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalNovoClienteVisivel(false)}
      >
        <View style={styles.fundoModalNovo}>
          <View style={styles.caixaModalNovo}>
            <Text style={styles.tituloModalNovo}>Novo Atendimento</Text>
            <TextInput
              style={styles.inputNomeCliente}
              placeholder="Nome do cliente (ex: João, Mesa Calçada)"
              value={nomeNovoCliente}
              onChangeText={setNomeNovoCliente}
              autoFocus={true}
            />
            <View style={styles.botoesModalNovo}>
              <TouchableOpacity
                style={[styles.botaoModal, styles.botaoCancelar]}
                onPress={() => {
                  setNomeNovoCliente('');
                  setModalNovoClienteVisivel(false);
                }}
              >
                <Text style={styles.textoBotaoCancelar}>CANCELAR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botaoModal, styles.botaoSalvar]}
                onPress={handleCriarCliente}
              >
                <Text style={styles.textoBotaoSalvar}>ABRIR CONTA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalPurrinhaVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalPurrinhaVisivel(false)}
      >
        <View style={styles.fundoModalNovo}>
          <View style={styles.caixaModalNovo}>
            <Text style={styles.tituloModalNovo}>
              🎲 Purrinha: {clientePerdedorPurrinha?.getNome()}
            </Text>
            <Text style={styles.subtituloModalPurrinha}>
              Qual combo o cliente perdeu na rodada?
            </Text>

            {opcoesComboPurrinha.map((prod) => (
              <TouchableOpacity
                key={prod.getId()}
                style={styles.botaoOpcaoCombo}
                onPress={() =>
                  clientePerdedorPurrinha &&
                  confirmarComboPurrinha(clientePerdedorPurrinha, prod)
                }
              >
                <View>
                  <Text style={styles.nomeOpcaoCombo}>{prod.getNome()}</Text>
                  <Text style={styles.detalheOpcaoCombo}>
                    Leva {prod.getQtdPromocao()} unidades (Estoque: {prod.getQuantidadeEstoque()})
                  </Text>
                </View>
                <Text style={styles.valorOpcaoCombo}>
                  + R$ {prod.getPrecoPromocao().toFixed(2).replace('.', ',')}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.botaoModal, styles.botaoCancelar, { marginTop: 12, alignItems: 'center' }]}
              onPress={() => setModalPurrinhaVisivel(false)}
            >
              <Text style={styles.textoBotaoCancelar}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ModalDetalhesCliente
        visivel={modalDetalhesVisivel}
        cliente={clienteSelecionado}
        produtosCardapio={produtosFiltrados}
        aoFecharModal={() => setModalDetalhesVisivel(false)}
        aoBuscarProduto={handleBuscarProduto}
        aoAdicionarProduto={handleAdicionarProduto}
        aoFinalizarConta={handleMarcarComoPago}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  barraSuperior: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  tituloApp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  botoesTopo: {
    flexDirection: 'row',
    gap: 8,
  },
  botaoPurrinhaTopo: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  textoBotaoPurrinhaTopo: {
    color: '#E65100',
    fontWeight: 'bold',
    fontSize: 12,
  },
  botaoCardapio: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  textoBotaoCardapio: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 12,
  },
  listaCards: {
    padding: 8,
    paddingBottom: 100,
  },
  estadoVazio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconeVazio: {
    fontSize: 48,
    marginBottom: 12,
  },
  tituloVazio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  subtituloVazio: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  botaoFlutuanteMais: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  iconeMais: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
  barraDesfazer: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 16,
    backgroundColor: '#323232',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 6,
  },
  textoDesfazer: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  botaoDesfazer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  textoBotaoDesfazer: {
    color: '#81C784',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fundoModalNovo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  caixaModalNovo: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  tituloModalNovo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  subtituloModalPurrinha: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 14,
  },
  botaoOpcaoCombo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFB74D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  nomeOpcaoCombo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
  },
  detalheOpcaoCombo: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  valorOpcaoCombo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  inputNomeCliente: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  botoesModalNovo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  botaoModal: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  botaoCancelar: {
    backgroundColor: '#EEEEEE',
  },
  textoBotaoCancelar: {
    color: '#424242',
    fontWeight: 'bold',
  },
  botaoSalvar: {
    backgroundColor: '#2E7D32',
  },
  textoBotaoSalvar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});