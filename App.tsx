import React, { useEffect, useState, useMemo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { inicializarBancoDeDados } from './src/data/database/database';
import { ClienteRepository } from './src/data/repositories/ClienteRepository';
import { ProdutoRepository } from './src/data/repositories/ProdutoRepository';

import { GerenciarAtendimentosUseCase } from './src/domain/usecases/GerenciarAtendimentosUseCase';
import { AdicionarProdutoClienteUseCase } from './src/domain/usecases/AdicionarProdutoClienteUseCase';
import { FinalizarContaUseCase } from './src/domain/usecases/FinalizarContaUseCase';
import { ControlarCardapioEstoqueUseCase } from './src/domain/usecases/ControlarCardapioEstoqueUseCase';

import { TelaPrincipal } from './src/presentation/screens/TelaPrincipal';
import { TelaCardapio } from './src/presentation/screens/TelaCardapio';
import { TelaPurrinha } from './src/presentation/screens/TelaPurrinha';

export default function App() {
  const [bancoPronto, setBancoPronto] = useState(false);
  const [erroInicializacao, setErroInicializacao] = useState<string | null>(null);
  const [telaAtual, setTelaAtual] = useState<'PRINCIPAL' | 'CARDAPIO' | 'PURRINHA'>('PRINCIPAL');

  const dependencias = useMemo(() => {
    const clienteRepo = new ClienteRepository();
    const produtoRepo = new ProdutoRepository();

    return {
      gerenciarAtendimentosUC: new GerenciarAtendimentosUseCase(clienteRepo),
      adicionarProdutoUC: new AdicionarProdutoClienteUseCase(clienteRepo, produtoRepo),
      finalizarContaUC: new FinalizarContaUseCase(clienteRepo),
      controlarCardapioUC: new ControlarCardapioEstoqueUseCase(produtoRepo),
    };
  }, []);

  useEffect(() => {
    const prepararSistema = async () => {
      try {
        await inicializarBancoDeDados();
        setBancoPronto(true);
      } catch (erro: any) {
        setErroInicializacao(erro.message || 'Falha ao iniciar o banco de dados SQLite.');
      }
    };

    prepararSistema();
  }, []);

  if (erroInicializacao) {
    return (
      <SafeAreaView style={styles.containerCentralizado}>
        <Text style={styles.textoErro}>Erro Crítico: {erroInicializacao}</Text>
      </SafeAreaView>
    );
  }

  if (!bancoPronto) {
    return (
      <SafeAreaView style={styles.containerCentralizado}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.textoCarregando}>Iniciando banco de dados local...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {telaAtual === 'PRINCIPAL' && (
        <TelaPrincipal
          gerenciarAtendimentosUC={dependencias.gerenciarAtendimentosUC}
          adicionarProdutoUC={dependencias.adicionarProdutoUC}
          finalizarContaUC={dependencias.finalizarContaUC}
          controlarCardapioUC={dependencias.controlarCardapioUC}
          aoIrParaCardapio={() => setTelaAtual('CARDAPIO')}
          aoIrParaPurrinha={() => setTelaAtual('PURRINHA')}
        />
      )}

      {telaAtual === 'CARDAPIO' && (
        <TelaCardapio
          controlarCardapioUC={dependencias.controlarCardapioUC}
          aoVoltar={() => setTelaAtual('PRINCIPAL')}
        />
      )}

      {telaAtual === 'PURRINHA' && (
        <TelaPurrinha
          gerenciarAtendimentosUC={dependencias.gerenciarAtendimentosUC}
          aoVoltar={() => setTelaAtual('PRINCIPAL')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  containerCentralizado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  textoCarregando: {
    marginTop: 12,
    fontSize: 15,
    color: '#616161',
  },
  textoErro: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});