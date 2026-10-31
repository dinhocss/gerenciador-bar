import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Cliente } from '../../domain/entities/Cliente';
import { GerenciarAtendimentosUseCase } from '../../domain/usecases/GerenciarAtendimentosUseCase';

interface TelaPurrinhaProps {
  gerenciarAtendimentosUC: GerenciarAtendimentosUseCase;
  aoVoltar: () => void;
}

export const TelaPurrinha: React.FC<TelaPurrinhaProps> = ({
  gerenciarAtendimentosUC,
  aoVoltar,
}) => {
  const [perdedores, setPerdedores] = useState<Cliente[]>([]);

  const carregarPlacar = useCallback(async () => {
    try {
      const todosAtivos = await gerenciarAtendimentosUC.listarClientesAtivos();
      // Filtra apenas quem perdeu pelo menos 1 vez e ordena por quem perdeu mais
      const filtrados = todosAtivos
        .filter((c) => c.getDerrotasPurrinha() > 0)
        .sort((a, b) => b.getDerrotasPurrinha() - a.getDerrotasPurrinha());

      setPerdedores(filtrados);
    } catch (erro: any) {
      Alert.alert('Erro', erro.message || 'Não foi possível carregar o placar da Purrinha.');
    }
  }, [gerenciarAtendimentosUC]);

  useEffect(() => {
    carregarPlacar();
  }, [carregarPlacar]);

  const totalCombosMesa = perdedores.reduce(
    (acc, c) => acc + c.getDerrotasPurrinha(),
    0
  );
  const valorTotalMesa = perdedores.reduce(
    (acc, c) => acc + c.getTotalPurrinha(),
    0
  );

  return (
    <View style={styles.container}>
      {/* Barra Superior */}
      <View style={styles.barraSuperior}>
        <TouchableOpacity style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>← VOLTAR</Text>
        </TouchableOpacity>
        <Text style={styles.tituloTela}>🎲 PLACAR DA PURRINHA</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Painel de Resumo Geral da Roda */}
      {perdedores.length > 0 && (
        <View style={styles.painelResumo}>
          <View style={styles.itemResumo}>
            <Text style={styles.labelResumo}>Total de Derrotas</Text>
            <Text style={styles.valorResumo}>{totalCombosMesa} combos</Text>
          </View>
          <View style={styles.divisorVertical} />
          <View style={styles.itemResumo}>
            <Text style={styles.labelResumo}>Total em Combos</Text>
            <Text style={styles.valorResumoVerde}>
              R$ {valorTotalMesa.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>
      )}

      {/* Lista de Clientes que perderam na Purrinha */}
      {perdedores.length === 0 ? (
        <View style={styles.estadoVazio}>
          <Text style={styles.iconeVazio}>🎲</Text>
          <Text style={styles.tituloVazio}>Ninguém perdeu na Purrinha ainda</Text>
          <Text style={styles.subtituloVazio}>
            Quando você tocar no botão "🎲 Purrinha (+3)" no card de algum cliente, a contabilidade de combos dele aparecerá aqui!
          </Text>
        </View>
      ) : (
        <FlatList
          data={perdedores}
          keyExtractor={(item) => String(item.getId())}
          contentContainerStyle={styles.lista}
          renderItem={({ item, index }) => {
            const qtdDerrotas = item.getDerrotasPurrinha();
            const valorCombos = item.getTotalPurrinha();

            return (
              <View style={styles.cardPerdedor}>
                <View style={styles.posicaoBadge}>
                  <Text style={styles.textoPosicao}>{index + 1}º</Text>
                </View>

                <View style={styles.infoCentral}>
                  <Text style={styles.textoLinhaPrincipal}>
                    {item.getNome()} — Perdeu {qtdDerrotas}
                  </Text>
                  <Text style={styles.subtextoDetalhe}>
                    ({qtdDerrotas} {qtdDerrotas === 1 ? 'combo lançado' : 'combos lançados'} • Conta total no bar: R${' '}
                    {item.getTotalConsumo().toFixed(2).replace('.', ',')})
                  </Text>
                </View>

                <View style={styles.colunaValor}>
                  <Text style={styles.labelSoCombo}>SÓ COMBO</Text>
                  <Text style={styles.valorPurrinha}>
                    R$ {valorCombos.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
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
    color: '#E65100',
  },
  painelResumo: {
    backgroundColor: '#FFF3E0',
    margin: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB74D',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  itemResumo: {
    alignItems: 'center',
  },
  divisorVertical: {
    width: 1,
    height: '80%',
    backgroundColor: '#FFCC80',
  },
  labelResumo: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  valorResumo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 2,
  },
  valorResumoVerde: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 2,
  },
  lista: {
    padding: 12,
  },
  cardPerdedor: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
  },
  posicaoBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFB74D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textoPosicao: {
    fontWeight: 'bold',
    color: '#E65100',
    fontSize: 14,
  },
  infoCentral: {
    flex: 1,
    marginRight: 8,
  },
  textoLinhaPrincipal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    textTransform: 'uppercase',
  },
  subtextoDetalhe: {
    fontSize: 12,
    color: '#757575',
    marginTop: 3,
  },
  colunaValor: {
    alignItems: 'flex-end',
  },
  labelSoCombo: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E65100',
  },
  valorPurrinha: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2E7D32',
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
    textAlign: 'center',
  },
  subtituloVazio: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
});