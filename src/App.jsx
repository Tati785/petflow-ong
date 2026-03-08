import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- MEUS ESTADOS (BANCO DE DADOS LOCAL) ---
  const [abaAtiva, setAbaAtiva] = useState('estoque');
  
  // Aqui eu busco os dados salvos no navegador ou começo com uma lista vazia
  const [listaEstoque, setListaEstoque] = useState(() => JSON.parse(localStorage.getItem('petflow_estoque')) || []);
  const [historicoMovs, setHistoricoMovs] = useState(() => JSON.parse(localStorage.getItem('petflow_movs')) || []);
  const [registrosFinanceiros, setRegistrosFinanceiros] = useState(() => JSON.parse(localStorage.getItem('petflow_fin')) || []);

  // Filtro de mês que começa no mês atual
  const [mesSelecionado, setMesSelecionado] = useState(new Date().toISOString().substring(0, 7));

  // Estados dos meus formulários
  const [itemEstoque, setItemEstoque] = useState({ nome: '', quantidade: '', operacao: 'entrada' });
  const [itemFinanceiro, setItemFinanceiro] = useState({ descricao: '', valor: '', tipo: 'entrada' });

  // Toda vez que eu mudar algo, o React salva automaticamente no LocalStorage
  useEffect(() => {
    localStorage.setItem('petflow_estoque', JSON.stringify(listaEstoque));
    localStorage.setItem('petflow_movs', JSON.stringify(historicoMovs));
    localStorage.setItem('petflow_fin', JSON.stringify(registrosFinanceiros));
  }, [listaEstoque, historicoMovs, registrosFinanceiros]);

  // --- MINHAS FUNÇÕES DE ESTOQUE ---
  const gerenciarEstoque = (e) => {
    e.preventDefault();
    const nomeLimpo = itemEstoque.nome.trim();
    const qtdInformada = Number(itemEstoque.quantidade);

    // Registro no histórico (Log)
    const novaMovimentacao = {
      id: Date.now(),
      nome: nomeLimpo,
      qtd: qtdInformada,
      operacao: itemEstoque.operacao,
      dataHora: new Date().toLocaleString('pt-BR')
    };
    setHistoricoMovs([novaMovimentacao, ...historicoMovs]);

    // Atualizo o saldo do produto na lista principal
    const produtoExiste = listaEstoque.find(p => p.nome.toLowerCase() === nomeLimpo.toLowerCase());
    if (produtoExiste) {
      setListaEstoque(listaEstoque.map(p => {
        if (p.nome.toLowerCase() === nomeLimpo.toLowerCase()) {
          const novoTotal = itemEstoque.operacao === 'entrada' ? p.quantidade + qtdInformada : p.quantidade - qtdInformada;
          return { ...p, quantidade: Math.max(0, novoTotal) };
        }
        return p;
      }));
    } else {
      setListaEstoque([...listaEstoque, { id: Date.now(), nome: nomeLimpo, quantidade: qtdInformada }]);
    }
    setItemEstoque({ nome: '', quantidade: '', operacao: 'entrada' });
  };

  const excluirProdutoEHistorico = (produto) => {
    if (window.confirm(`Tem certeza que quer apagar o item "${produto.nome}" e todo o histórico dele?`)) {
      setListaEstoque(listaEstoque.filter(p => p.id !== produto.id));
      setHistoricoMovs(historicoMovs.filter(h => h.nome.toLowerCase() !== produto.nome.toLowerCase()));
    }
  };

  // --- MINHAS FUNÇÕES FINANCEIRAS ---
  const adicionarFinanca = (e) => {
    e.preventDefault();
    const novoLancamento = {
      id: Date.now(),
      descricao: itemFinanceiro.descricao,
      valor: Number(itemFinanceiro.valor),
      tipo: itemFinanceiro.tipo,
      dataBR: new Date().toLocaleDateString('pt-BR'),
      dataISO: new Date().toISOString() // Uso esse formato para filtrar o mês facinho
    };
    setRegistrosFinanceiros([...registrosFinanceiros, novoLancamento]);
    setItemFinanceiro({ descricao: '', valor: '', tipo: 'entrada' });
  };

  // Cálculos do Financeiro (Filtrados por mês)
  const dadosDoMes = registrosFinanceiros.filter(r => r.dataISO.startsWith(mesSelecionado));
  const totalEntradas = dadosDoMes.filter(d => d.tipo === 'entrada').reduce((acc, curr) => acc + curr.valor, 0);
  const totalSaidas = dadosDoMes.filter(d => d.tipo === 'saida').reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <div className="container-geral">
      <header className="topo">
        <h1>🐾 Gestão ONG </h1>
        <div className="abas-navegacao">
          <button onClick={() => setAbaAtiva('estoque')} className={abaAtiva === 'estoque' ? 'btn-aba ativa' : 'btn-aba'}>📦 Estoque</button>
          <button onClick={() => setAbaAtiva('financeiro')} className={abaAtiva === 'financeiro' ? 'btn-aba ativa' : 'btn-aba'}>💰 Financeiro</button>
        </div>
      </header>

      {abaAtiva === 'estoque' ? (
        <main className="secao-principal">
          <div className="card-formulario">
            <h3>Registrar Movimentação</h3>
            <form onSubmit={gerenciarEstoque}>
              <input placeholder="Ex: Ração Cão" value={itemEstoque.nome} onChange={e => setItemEstoque({...itemEstoque, nome: e.target.value})} required />
              <input type="number" placeholder="Quantidade" value={itemEstoque.quantidade} onChange={e => setItemEstoque({...itemEstoque, quantidade: e.target.value})} required />
              <select value={itemEstoque.operacao} onChange={e => setItemEstoque({...itemEstoque, operacao: e.target.value})}>
                <option value="entrada">Entrada (+)</option>
                <option value="saida">Saída (-)</option>
              </select>
              <button type="submit" className="btn-confirmar">Salvar</button>
            </form>
          </div>

          <div className="painel-estoque">
            <div className="coluna-inventario">
              <h4>📍 O que temos hoje</h4>
              {listaEstoque.map(p => (
                <div key={p.id} className="item-lista-estoque">
                  <span>{p.nome}: <strong>{p.quantidade} Kg</strong></span>
                  <button onClick={() => excluirProdutoEHistorico(p)} className="btn-lixo">🗑️</button>
                </div>
              ))}
            </div>
            <div className="coluna-historico">
              <h4>📜 Histórico de Uso</h4>
              <div className="lista-scroll">
                {historicoMovs.map(h => (
                  <div key={h.id} className={`log-movimento ${h.operacao}`}>
                    <small>{h.dataHora}</small>
                    <p>{h.nome}: {h.operacao === 'entrada' ? '+' : '-'}{h.qtd} un</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="secao-principal">
          <div className="filtro-periodo">
            <label>Filtrar mês:</label>
            <input type="month" value={mesSelecionado} onChange={e => setMesSelecionado(e.target.value)} />
          </div>

          <div className="cards-resumo">
            <div className="card-valor verde">Entrou: R$ {totalEntradas.toFixed(2)}</div>
            <div className="card-valor vermelho">Saiu: R$ {totalSaidas.toFixed(2)}</div>
            <div className="card-valor azul">Saldo: R$ {(totalEntradas - totalSaidas).toFixed(2)}</div>
          </div>

          <div className="card-formulario">
            <form onSubmit={adicionarFinanca}>
              <input placeholder="Ex: Doação" value={itemFinanceiro.descricao} onChange={e => setItemFinanceiro({...itemFinanceiro, descricao: e.target.value})} required />
              <input type="number" placeholder="Valor R$" value={itemFinanceiro.valor} onChange={e => setItemFinanceiro({...itemFinanceiro, valor: e.target.value})} required />
              <select value={itemFinanceiro.tipo} onChange={e => setItemFinanceiro({...itemFinanceiro, tipo: e.target.value})}>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
              <button type="submit" className="btn-confirmar">Lançar</button>
            </form>
          </div>

          <table className="tabela-financeira">
            <thead>
              <tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {dadosDoMes.map(d => (
                <tr key={d.id} className={d.tipo}>
                  <td>{d.dataBR}</td>
                  <td>{d.descricao}</td>
                  <td>{d.tipo === 'entrada' ? '+' : '-'} R$ {d.valor.toFixed(2)}</td>
                  <td><button onClick={() => setRegistrosFinanceiros(registrosFinanceiros.filter(x => x.id !== d.id))} className="btn-lixo">🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      )}
    </div>
  );
}

export default App;