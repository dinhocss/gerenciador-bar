import React, { useState, useEffect, useCallback } from 'react';
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
import { Produto } from '../../domain/entities/Produto';
import { ControlarCardapioEstoqueUseCase } from '../../domain/usecases/ControlarCardapioEstoqueUseCase';

interface TelaCardapioProps {
  controlarCardapioUC: ControlarCardapioEstoqueUseCase;
  aoVoltar: () => void;
}

export const TelaCardapio: React.FC<TelaCardapioProps> = ({
  controlarCardapioUC,
  aoVoltar,
}) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  const [nome, setNome] = useState('');
  const [precoTexto, setPrecoTexto] = useState('');
  const [estoqueTexto, setEstoqueTexto] = useState('');
  const [qtdPromoTexto, setQtdPromoTexto] = useState('');
  const [precoPromoTexto, setPrecoPromoTexto] = useState('');

  const carregarCardapio = useCallback(async () => {
    try {
      const lista = await controlarCardapioUC.listarCardapio();
      setProdutos(lista);
    } catch (erro: any) {
      Alert.alert('Erro', erro.message || 'Não foi possível carregar o cardápio.');
    }
  }, [controlarCardapioUC]);

  useEffect(() => {
    carregarCardapio();
  }, [carregarCardapio]);

  const abrirModalNovoProduto = () => {
    setProdutoEditando(null);
    setNome('');
    setPrecoTexto('');
    setEstoqueTexto('');
    setQtdPromoTexto('');
    setPrecoPromoTexto('');
    setModalVisivel(true);
  };

  const abrirModalEditarProduto = (produto: Produto) => {
    setProdutoEditando(produto);
    setNome(produto.getNome());
    setPrecoTexto(produto.getPreco().toFixed(2).replace('.', ','));
    setEstoqueTexto(String(produto.getQuantidadeEstoque()));
    setQtdPromoTexto(
      produto.getQtdPromocao() > 0 ? String(produto.getQtdPromocao()) : ''
    );
    setPrecoPromoTexto(
      produto.getPrecoPromocao() > 0
        ? produto.getPrecoPromocao().toFixed(2).replace('.', ',')
        : ''
    );
    setModalVisivel(true);
  };

  const handleSalvarProduto = async () => {
    try {
      const precoNumerico = parseFloat(precoTexto.replace(',', '.'));
      const estoqueNumerico = parseInt(estoqueTexto, 10);

      const qtdPromoNumerica =
        qtdPromoTexto.trim() !== '' ? parseInt(qtdPromoTexto, 10) : 0;
      const precoPromoNumerico =
        precoPromoTexto.trim() !== ''
          ? parseFloat(precoPromoTexto.replace(',', '.'))
          : 0;

      if (isNaN(precoNumerico)) {
        Alert.alert('Atenção', 'Informe um preço válido (ex: 5,00).');
        return;
      }

      if (isNaN(estoqueNumerico)) {
        Alert.alert('Atenção', 'Informe uma quantidade de estoque válida.');
        return;
      }

      if (produtoEditando) {
        await controlarCardapioUC.atualizarProduto(
          produtoEditando.getId(),
          nome,
          precoNumerico,
          estoqueNumerico,
          isNaN(qtdPromoNumerica) ? 0 : qtdPromoNumerica,
          isNaN(precoPromoNumerico) ? 0 : precoPromoNumerico
        );
      } else {
        await controlarCardapioUC.cadastrarProduto(
          nome,
          precoNumerico,
          estoqueNumerico,
          isNaN(qtdPromoNumerica) ? 0 : qtdPromoNumerica,
          isNaN(precoPromoNumerico) ? 0 : precoPromoNumerico
        );
      }

      setModalVisivel(false);
      await carregarCardapio();
    } catch (erro: any) {
      Alert.alert('Erro ao salvar', erro.message);
    }
  };

  const handleConfirmarRemocao = (produto: Produto) => {
    Alert.alert(
      'Remover Produto',
      `Deseja remover "${produto.getNome()}" do cardápio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await controlarCardapioUC.removerProduto(produto.getId());
              await carregarCardapio();
            } catch (erro: any) {
              Alert.alert(
                'Não foi possível remover',
                'Este produto está vinculado a um atendimento ativo no momento.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.barraSuperior}>
        <TouchableOpacity style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>← VOLTAR</Text>
        </TouchableOpacity>
        <Text style={styles.tituloTela}>CARDÁPIO E ESTOQUE</Text>
        <View style={{ width: 70 }} />
      </View>

      {produtos.length === 0 ? (
        <View style={styles.estadoVazio}>
          <Text style={styles.iconeVazio}>📋</Text>
          <Text style={styles.tituloVazio}>Cardápio vazio</Text>
          <Text style={styles.subtituloVazio}>
            Toque no botão "+" abaixo para cadastrar bebidas e porções no banco de dados.
          </Text>
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(item) => String(item.getId())}
          contentContainerStyle={styles.listaProdutos}
          renderItem={({ item }) => {
            const semEstoque = item.getQuantidadeEstoque() === 0;
            return (
              <View style={styles.cardProduto}>
                <View style={styles.infoProduto}>
                  <Text style={styles.nomeProduto}>{item.getNome()}</Text>
                  <Text style={styles.precoProduto}>
                    R$ {item.getPreco().toFixed(2).replace('.', ',')}
                    {item.temPromocaoAtiva()
                      ? `  •  Promo: ${item.getQtdPromocao()} por R$ ${item
                          .getPrecoPromocao()
                          .toFixed(2)
                          .replace('.', ',')}`
                      : ''}
                  </Text>
                  <View style={styles.linhaEstoque}>
                    <Text
                      style={[
                        styles.textoEstoque,
                        semEstoque && styles.textoEstoqueZerado,
                      ]}
                    >
                      Estoque: {item.getQuantidadeEstoque()} un.
                    </Text>
                    {semEstoque && (
                      <View style={styles.badgeEsgotado}>
                        <Text style={styles.textoBadgeEsgotado}>ESGOTADO</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.acoesProduto}>
                  <TouchableOpacity
                    style={styles.botaoEditar}
                    onPress={() => abrirModalEditarProduto(item)}
                  >
                    <Text style={styles.textoBotaoEditar}>EDITAR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botaoRemover}
                    onPress={() => handleConfirmarRemocao(item)}
                  >
                    <Text style={styles.textoBotaoRemover}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={styles.botaoFlutuanteMais}
        activeOpacity={0.85}
        onPress={abrirModalNovoProduto}
      >
        <Text style={styles.iconeMais}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.fundoModal}>
          <View style={styles.caixaModal}>
            <Text style={styles.tituloModal}>
              {produtoEditando ? 'Editar Produto / Estoque' : 'Novo Produto'}
            </Text>

            <Text style={styles.labelInput}>Nome do Produto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Cracudinha 300ml"
              value={nome}
              onChangeText={setNome}
            />

            <View style={styles.linhaInputsDuplos}>
              <View style={styles.colunaInput}>
                <Text style={styles.labelInput}>Preço Unitário (R$)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 5,00"
                  keyboardType="decimal-pad"
                  value={precoTexto}
                  onChangeText={setPrecoTexto}
                />
              </View>

              <View style={styles.colunaInput}>
                <Text style={styles.labelInput}>Qtd. em Estoque</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 48"
                  keyboardType="number-pad"
                  value={estoqueTexto}
                  onChangeText={setEstoqueTexto}
                />
              </View>
            </View>

            <Text style={styles.labelInput}>
              Promoção por Lote (Opcional - ex: 3 por R$ 12,00)
            </Text>
            <View style={styles.linhaInputsDuplos}>
              <View style={styles.colunaInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Leve X (ex: 3)"
                  keyboardType="number-pad"
                  value={qtdPromoTexto}
                  onChangeText={setQtdPromoTexto}
                />
              </View>

              <View style={styles.colunaInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Pague R$ (ex: 12,00)"
                  keyboardType="decimal-pad"
                  value={precoPromoTexto}
                  onChangeText={setPrecoPromoTexto}
                />
              </View>
            </View>

            <View style={styles.botoesModal}>
              <TouchableOpacity
                style={[styles.botaoModal, styles.botaoCancelar]}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.textoBotaoCancelar}>CANCELAR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botaoModal, styles.botaoSalvar]}
                onPress={handleSalvarProduto}
              >
                <Text style={styles.textoBotaoSalvar}>SALVAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  botaoVoltar: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#EEEEEE',
  },
  textoBotaoVoltar: {
    fontWeight: 'bold',
    color: '#424242',
    fontSize: 13,
  },
  tituloTela: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  listaProdutos: {
    padding: 12,
    paddingBottom: 90,
  },
  cardProduto: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
  },
  infoProduto: {
    flex: 1,
    marginRight: 12,
  },
  nomeProduto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  precoProduto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 2,
  },
  linhaEstoque: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  textoEstoque: {
    fontSize: 13,
    color: '#616161',
  },
  textoEstoqueZerado: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  badgeEsgotado: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF9A9A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textoBadgeEsgotado: {
    color: '#D32F2F',
    fontSize: 10,
    fontWeight: 'bold',
  },
  acoesProduto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botaoEditar: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  textoBotaoEditar: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 12,
  },
  botaoRemover: {
    backgroundColor: '#FFEBEE',
    width: 34,
    height: 34,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  textoBotaoRemover: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 14,
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
    backgroundColor: '#1976D2',
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
  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  caixaModal: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  labelInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    marginBottom: 14,
    color: '#212121',
  },
  linhaInputsDuplos: {
    flexDirection: 'row',
    gap: 12,
  },
  colunaInput: {
    flex: 1,
  },
  botoesModal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
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
    backgroundColor: '#1976D2',
  },
  textoBotaoSalvar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});