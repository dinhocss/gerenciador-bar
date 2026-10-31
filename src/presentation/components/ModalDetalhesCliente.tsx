import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { Cliente } from '../../domain/entities/Cliente';
import { Produto } from '../../domain/entities/Produto';

interface ModalDetalhesClienteProps {
  visivel: boolean;
  cliente: Cliente | null;
  produtosCardapio: Produto[];
  aoFecharModal: () => void;
  aoBuscarProduto: (termo: string) => void;
  aoAdicionarProduto: (pedidoId: number, produtoId: number, quantidade: number) => Promise<void>;
  aoFinalizarConta: (cliente: Cliente) => void;
}

export const ModalDetalhesCliente: React.FC<ModalDetalhesClienteProps> = ({
  visivel,
  cliente,
  produtosCardapio,
  aoFecharModal,
  aoBuscarProduto,
  aoAdicionarProduto,
  aoFinalizarConta,
}) => {
  const [modoAdicao, setModoAdicao] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    if (visivel) {
      setModoAdicao(false);
      setTermoBusca('');
      setProdutoSelecionado(null);
      setQuantidade(1);
    }
  }, [visivel, cliente]);

  if (!cliente) return null;

  const pedido = cliente.getPedido();
  const itensConsumidos = pedido.getItens();
  const totalGeral = cliente.getTotalConsumo();

  const handleDigitarBusca = (texto: string) => {
    setTermoBusca(texto);
    aoBuscarProduto(texto);
  };

  const handleConfirmarAdicao = async () => {
    if (!produtoSelecionado) return;

    await aoAdicionarProduto(pedido.getId(), produtoSelecionado.getId(), quantidade);

    setModoAdicao(false);
    setProdutoSelecionado(null);
    setQuantidade(1);
    setTermoBusca('');
  };

  return (
    <Modal
      visible={visivel}
      animationType="slide"
      transparent={true}
      onRequestClose={aoFecharModal}
    >
      <View style={styles.fundoEscuro}>
        <View style={styles.containerModal}>
          <View style={styles.cabecalho}>
            <Text style={styles.tituloCliente}>{cliente.getNome()}</Text>
            <TouchableOpacity onPress={aoFecharModal} style={styles.botaoFecharModal}>
              <Text style={styles.textoBotaoFecharModal}>✕</Text>
            </TouchableOpacity>
          </View>

          {!modoAdicao ? (
            <View style={styles.conteudo}>
              <Text style={styles.subtituloSecao}>Itens Consumidos</Text>

              {itensConsumidos.length === 0 ? (
                <View style={styles.estadoVazio}>
                  <Text style={styles.textoVazio}>Nenhum item adicionado ainda.</Text>
                </View>
              ) : (
                <FlatList
                  data={itensConsumidos}
                  keyExtractor={(item) => String(item.getId() || item.getProduto().getId())}
                  renderItem={({ item }) => {
                    const prod = item.getProduto();
                    const promoAplicada =
                      prod.temPromocaoAtiva() && item.getQuantidade() >= prod.getQtdPromocao();

                    return (
                      <View style={styles.linhaItem}>
                        <View style={styles.infoItem}>
                          <Text style={styles.nomeItem}>{prod.getNome()}</Text>
                          <Text style={styles.detalheUnitario}>
                            {item.getQuantidade()}x R$ {prod.getPreco().toFixed(2).replace('.', ',')}
                            {promoAplicada
                              ? ` (Promo ${prod.getQtdPromocao()} por R$ ${prod.getPrecoPromocao().toFixed(2).replace('.', ',')})`
                              : ''}
                          </Text>
                        </View>
                        <Text style={styles.subtotalItem}>
                          R$ {item.calculaSubtotal().toFixed(2).replace('.', ',')}
                        </Text>
                      </View>
                    );
                  }}
                />
              )}

              <View style={styles.rodapeComanda}>
                <View style={styles.linhaTotal}>
                  <Text style={styles.labelTotal}>TOTAL:</Text>
                  <Text style={styles.valorTotal}>
                    R$ {totalGeral.toFixed(2).replace('.', ',')}
                  </Text>
                </View>

                <View style={styles.botoesAcao}>
                  <TouchableOpacity
                    style={[styles.botao, styles.botaoAdicionarProduto]}
                    onPress={() => {
                      aoBuscarProduto('');
                      setModoAdicao(true);
                    }}
                  >
                    <Text style={styles.textoBotaoAdicionar}>+ PRODUTO</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.botao, styles.botaoFinalizarConta]}
                    onPress={() => {
                      aoFecharModal();
                      aoFinalizarConta(cliente);
                    }}
                  >
                    <Text style={styles.textoBotaoFinalizar}>✓ PAGO / FECHAR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.conteudo}>
              <View style={styles.barraPesquisaContainer}>
                <Text style={styles.iconeLupa}>🔍</Text>
                <TextInput
                  style={styles.inputPesquisa}
                  placeholder="Digite o nome do produto..."
                  value={termoBusca}
                  onChangeText={handleDigitarBusca}
                  autoFocus={true}
                />
              </View>

              <FlatList
                data={produtosCardapio}
                keyExtractor={(prod) => String(prod.getId())}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.textoVazio}>Nenhum produto encontrado.</Text>
                }
                renderItem={({ item: prod }) => {
                  const selecionado = produtoSelecionado?.getId() === prod.getId();
                  return (
                    <TouchableOpacity
                      style={[
                        styles.itemBusca,
                        selecionado && styles.itemBuscaSelecionado,
                      ]}
                      onPress={() => setProdutoSelecionado(prod)}
                    >
                      <View>
                        <Text style={styles.nomeProdutoBusca}>{prod.getNome()}</Text>
                        <Text style={styles.estoqueProdutoBusca}>
                          Estoque: {prod.getQuantidadeEstoque()}
                          {prod.temPromocaoAtiva()
                            ? ` • Promo: ${prod.getQtdPromocao()} por R$ ${prod.getPrecoPromocao().toFixed(2).replace('.', ',')}`
                            : ''}
                        </Text>
                      </View>
                      <Text style={styles.precoProdutoBusca}>
                        R$ {prod.getPreco().toFixed(2).replace('.', ',')}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              {produtoSelecionado && (
                <View style={styles.painelQuantidade}>
                  <Text style={styles.labelQuantidade}>
                    Quantidade ({produtoSelecionado.getNome()}):
                  </Text>
                  <View style={styles.controlesQuantidade}>
                    <TouchableOpacity
                      style={styles.botaoQtd}
                      onPress={() => setQuantidade((q) => Math.max(1, q - 1))}
                    >
                      <Text style={styles.textoBotaoQtd}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.valorQuantidade}>{quantidade}</Text>

                    <TouchableOpacity
                      style={styles.botaoQtd}
                      onPress={() => setQuantidade((q) => q + 1)}
                    >
                      <Text style={styles.textoBotaoQtd}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.botoesAcao}>
                <TouchableOpacity
                  style={[styles.botao, styles.botaoVoltar]}
                  onPress={() => setModoAdicao(false)}
                >
                  <Text style={styles.textoBotaoVoltar}>VOLTAR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.botao,
                    styles.botaoConfirmarAdicao,
                    !produtoSelecionado && styles.botaoDesabilitado,
                  ]}
                  disabled={!produtoSelecionado}
                  onPress={handleConfirmarAdicao}
                >
                  <Text style={styles.textoBotaoConfirmar}>CONFIRMAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fundoEscuro: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  containerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: '75%',
    maxHeight: '90%',
    padding: 16,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 12,
    marginBottom: 12,
  },
  tituloCliente: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    textTransform: 'uppercase',
  },
  botaoFecharModal: {
    padding: 6,
  },
  textoBotaoFecharModal: {
    fontSize: 20,
    color: '#757575',
    fontWeight: 'bold',
  },
  conteudo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  subtituloSecao: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  estadoVazio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoVazio: {
    color: '#9E9E9E',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 24,
  },
  linhaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoItem: {
    flex: 1,
    marginRight: 8,
  },
  nomeItem: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  detalheUnitario: {
    fontSize: 13,
    color: '#2E7D32',
    marginTop: 2,
  },
  subtotalItem: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  rodapeComanda: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 8,
  },
  linhaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
  },
  valorTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  botoesAcao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  botao: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoAdicionarProduto: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  textoBotaoAdicionar: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  botaoFinalizarConta: {
    backgroundColor: '#2E7D32',
  },
  textoBotaoFinalizar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  barraPesquisaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconeLupa: {
    fontSize: 18,
    marginRight: 8,
  },
  inputPesquisa: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#212121',
  },
  itemBusca: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  itemBuscaSelecionado: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  nomeProdutoBusca: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  estoqueProdutoBusca: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  precoProdutoBusca: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  painelQuantidade: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  labelQuantidade: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    flex: 1,
  },
  controlesQuantidade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botaoQtd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotaoQtd: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  valorQuantidade: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    minWidth: 24,
    textAlign: 'center',
  },
  botaoVoltar: {
    backgroundColor: '#EEEEEE',
  },
  textoBotaoVoltar: {
    color: '#424242',
    fontWeight: 'bold',
  },
  botaoConfirmarAdicao: {
    backgroundColor: '#1976D2',
  },
  botaoDesabilitado: {
    backgroundColor: '#B0BEC5',
  },
  textoBotaoConfirmar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});