import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Cliente } from '../../domain/entities/Cliente';

interface CardClienteProps {
  cliente: Cliente;
  aoClicarNoCard: (cliente: Cliente) => void;
  aoMarcarComoPago: (cliente: Cliente) => void;
  aoPerderPurrinha: (cliente: Cliente) => void;
}

export const CardCliente: React.FC<CardClienteProps> = ({
  cliente,
  aoClicarNoCard,
  aoMarcarComoPago,
  aoPerderPurrinha,
}) => {
  const subtotal = cliente.getTotalConsumo();
  const quantidadeItens = cliente.getPedido().getItens().length;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => aoClicarNoCard(cliente)}
    >
      <View style={styles.cabecalho}>
        <Text style={styles.nomeCliente} numberOfLines={1}>
          {cliente.getNome()}
        </Text>

        <TouchableOpacity
          style={styles.areaToqueBolinha}
          onPress={() => aoMarcarComoPago(cliente)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.bolinhaPagamento} />
        </TouchableOpacity>
      </View>

      <View style={styles.corpo}>
        <Text style={styles.resumoItens}>
          {quantidadeItens === 0
            ? 'Sem consumo'
            : `${quantidadeItens} ${quantidadeItens === 1 ? 'item' : 'itens'}`}
        </Text>

        <Text style={styles.valorSubtotal}>
          R$ {subtotal.toFixed(2).replace('.', ',')}
        </Text>

        <TouchableOpacity
          style={styles.botaoPurrinha}
          onPress={() => aoPerderPurrinha(cliente)}
        >
          <Text style={styles.textoBotaoPurrinha}>🎲 Purrinha (+3)</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    overflow: 'hidden',
    elevation: 2,
    minHeight: 125,
    justifyContent: 'space-between',
  },
  cabecalho: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  nomeCliente: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#2E7D32',
    flex: 1,
    marginRight: 8,
    textTransform: 'uppercase',
  },
  areaToqueBolinha: {
    padding: 2,
  },
  bolinhaPagamento: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: '#FFFFFF',
  },
  corpo: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  resumoItens: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  valorSubtotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  botaoPurrinha: {
    marginTop: 8,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFB74D',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  textoBotaoPurrinha: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E65100',
  },
});