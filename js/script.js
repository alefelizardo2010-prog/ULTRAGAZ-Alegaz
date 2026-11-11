document.addEventListener('DOMContentLoaded', function () {
    console.log("JavaScript da Ultragaz carregado com sucesso!");

    const miniaturas = document.querySelectorAll('.card-miniatura');
    const destaqueImg = document.querySelector('#imagem-destaque');
    const destaqueTitulo = document.querySelector('#titulo-destaque');
    const destaqueDesc = document.querySelector('#descricao-destaque');

    // Verifica se os elementos da galeria existem na página atual
    if (miniaturas.length > 0 && destaqueImg && destaqueTitulo && destaqueDesc) {
        miniaturas.forEach(function (miniatura) {
            miniatura.addEventListener('click', function () {
                
                // 1. Remove a classe 'ativo' de todas as miniaturas
                miniaturas.forEach(function (item) {
                    item.classList.remove('ativo');
                });

                // 2. Adiciona a classe 'ativo' apenas na miniatura clicada
                miniatura.classList.add('ativo');

                // 3. Captura os dados dos atributos data-*
                const novoTitulo = miniatura.getAttribute('data-titulo');
                const novaDesc = miniatura.getAttribute('data-desc');
                const novaImg = miniatura.getAttribute('data-img');

                // 4. Atualiza a tela dinamicamente usando textContent e src
                destaqueTitulo.textContent = novoTitulo;
                destaqueDesc.textContent = novaDesc;
                destaqueImg.src = novaImg;

                console.log(`Produto alterado para: ${novoTitulo}`);
            });
        });
    }

    // ===== Busca de CEP (API ViaCEP) =====
    const campoCep = document.querySelector('#cep');
    const cepStatus = document.querySelector('#cep-status');

    // Mostra uma mensagem de feedback abaixo do campo CEP
    function mostrarStatusCep(texto, tipo) {
        cepStatus.textContent = texto;
        cepStatus.className = 'cep-status ' + tipo; // 'carregando' | 'sucesso' | 'erro'
    }

    // Preenche (ou limpa) os campos de endereco no DOM
    function preencherEndereco(dados) {
        document.querySelector('#rua').value = dados.logradouro || '';
        document.querySelector('#bairro').value = dados.bairro || '';
        document.querySelector('#cidade').value = dados.localidade || '';
        document.querySelector('#uf').value = dados.uf || '';
    }

    async function buscarCEP(cep) {
        // Remove tudo que nao for numero (aceita "01001-000" ou "01001000")
        const cepLimpo = cep.replace(/\D/g, '');

        if (cepLimpo.length !== 8) {
            preencherEndereco({});
            mostrarStatusCep('⚠️ Digite um CEP com 8 números.', 'erro');
            return;
        }

        mostrarStatusCep('Buscando CEP...', 'carregando');

        try {
            const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            if (!resposta.ok) throw new Error('Falha na requisição: ' + resposta.status);

            const dados = await resposta.json();

            // O ViaCEP responde 200 com {"erro": true} quando o CEP nao existe
            if (dados.erro) throw new Error('CEP não encontrado');

            preencherEndereco(dados);
            mostrarStatusCep('✅ Endereço encontrado! Complete com o número.', 'sucesso');
            document.querySelector('#mensagem').focus();
        } catch (erro) {
            console.error('Erro ao buscar CEP:', erro);
            preencherEndereco({});
            mostrarStatusCep('❌ Não foi possível buscar o CEP. Verifique o número ou preencha o endereço manualmente.', 'erro');
        }
    }

    if (campoCep && cepStatus) {
        // Formata como 00000-000 enquanto digita
        campoCep.addEventListener('input', function () {
            const numeros = campoCep.value.replace(/\D/g, '').slice(0, 8);
            campoCep.value = numeros.length > 5 ? numeros.slice(0, 5) + '-' + numeros.slice(5) : numeros;
            if (numeros.length === 8) buscarCEP(numeros);
        });

        // Tambem busca ao sair do campo (caso o usuario cole ou digite incompleto)
        campoCep.addEventListener('blur', function () {
            if (campoCep.value.trim() !== '') buscarCEP(campoCep.value);
        });
    }

    // ===== Pedido: resumo de valor + envio ao servidor (PHP/MySQL) =====
    const formContato = document.querySelector('#form-contato');
    const mensagemStatus = document.querySelector('#mensagem-status');

    if (formContato && mensagemStatus) {
        const selProduto = document.querySelector('#produto');
        const inpQtd = document.querySelector('#quantidade');
        const resumo = document.querySelector('#resumo-pedido');
        const btn = document.querySelector('#btn-enviar');
        const moeda = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        let precos = {};   // codigo -> preco (vindo do banco, só para exibição)

        function atualizarResumo() {
            const p = precos[selProduto.value];
            const q = parseInt(inpQtd.value, 10) || 0;
            if (!p || q < 1) { resumo.textContent = 'Selecione um produto para ver o valor.'; return; }
            resumo.textContent = `${q} × ${moeda(p)} = ${moeda(p * q)} (pagamento na entrega)`;
        }

        // Carrega preços atuais do banco; se o PHP não estiver rodando, o servidor recusará o envio de qualquer forma
        fetch('../php/produtos.php').then(r => r.json()).then(lista => {
            lista.forEach(item => {
                precos[item.codigo] = parseFloat(item.preco);
                const opt = selProduto.querySelector(`option[value="${item.codigo}"]`);
                if (opt) opt.textContent = `${item.nome} - ${moeda(parseFloat(item.preco))}`;
            });
            atualizarResumo();
        }).catch(() => console.warn('Preços indisponíveis (PHP/MySQL não está em execução?).'));

        selProduto.addEventListener('change', atualizarResumo);
        inpQtd.addEventListener('input', atualizarResumo);

        // Máscara de telefone (11) 99999-9999
        const campoTel = document.querySelector('#telefone');
        campoTel.addEventListener('input', function () {
            const n = campoTel.value.replace(/\D/g, '').slice(0, 11);
            campoTel.value = n.length > 10 ? `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
                           : n.length > 6 ? `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
                           : n.length > 2 ? `(${n.slice(0,2)}) ${n.slice(2)}` : n;
        });

        function mostrar(texto, tipo) {
            mensagemStatus.classList.remove('oculto', 'sucesso', 'erro');
            mensagemStatus.classList.add(tipo);
            mensagemStatus.textContent = texto;
        }

        formContato.addEventListener('submit', async function (evento) {
            evento.preventDefault();
            const v = id => document.querySelector('#' + id).value.trim();
            const digitos = v('telefone').replace(/\D/g, '');

            if (!v('nome') || !digitos || !v('produto') || !v('pagamento') || !v('cep') ||
                !v('rua') || !v('numero') || !v('bairro') || !v('cidade') || !v('uf')) {
                return mostrar('⚠️ Preencha todos os campos obrigatórios (nome, telefone, produto, pagamento e endereço completo).', 'erro');
            }
            if (digitos.length < 10) return mostrar('⚠️ Telefone inválido. Use DDD + número.', 'erro');

            btn.disabled = true;
            btn.textContent = 'Enviando...';
            try {
                const resp = await fetch(formContato.action, { method: 'POST', body: new FormData(formContato) });
                const dados = await resp.json();
                if (!resp.ok || !dados.ok) throw new Error(dados.erro || 'Erro ao registrar o pedido.');

                mostrar(`✅ Pedido #${dados.id} recebido! ${dados.quantidade}× ${dados.produto} — total R$ ${dados.total}, pago na entrega. Entraremos em contato pelo telefone informado.`, 'sucesso');
                formContato.reset();
                inpQtd.value = 1;
                atualizarResumo();
                if (cepStatus) { cepStatus.textContent = ''; cepStatus.className = 'cep-status'; }
            } catch (erro) {
                console.error(erro);
                mostrar('❌ ' + (erro instanceof SyntaxError
                    ? 'Servidor indisponível. Abra o site por um servidor com PHP (ex.: XAMPP), não direto do arquivo.'
                    : erro.message), 'erro');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Enviar Pedido';
            }
            (function () {
  var PRECOS = {
    P13: 134.00,
    P20: 245.00,
    P45: 450.00
  };

  var selectProduto = document.getElementById('produto');
  var inputQtd = document.getElementById('quantidade');
  var resumo = document.getElementById('resumo-pedido');

  function formatarBRL(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function descobrirChave(texto) {
    var m = texto.match(/P(13|20|45)/i);
    return m ? 'P' + m[1] : null;
  }

  function atualizarResumo() {
    var opcao = selectProduto.options[selectProduto.selectedIndex];
    var chave = opcao ? descobrirChave(opcao.text) : null;

    if (!chave || !(chave in PRECOS)) {
      resumo.textContent = 'Selecione um produto para ver o valor.';
      return;
    }

    var qtd = parseInt(inputQtd.value, 10);
    if (isNaN(qtd) || qtd < 1) qtd = 1;

    var unitario = PRECOS[chave];
    var total = unitario * qtd;

    if (qtd === 1) {
      resumo.textContent = 'Valor: ' + formatarBRL(unitario);
    } else {
      resumo.textContent =
        'Valor unitário: ' + formatarBRL(unitario) +
        ' | Total (' + qtd + 'x): ' + formatarBRL(total);
    }
  }

  if (selectProduto && inputQtd && resumo) {
    selectProduto.addEventListener('change', atualizarResumo);
    inputQtd.addEventListener('input', atualizarResumo);
    atualizarResumo();
  }
})();
        });
    }
});

/* ===================================================
   PÁGINA DE PEDIDOS (pages/pedidos.html)
   Cole este bloco no final do seu arquivo JS.
   Só roda na página que tem a tabela de pedidos (#lista),
   então não interfere nas outras páginas.
   =================================================== */
(function iniciarPaginaPedidos() {
  if (!document.getElementById('lista')) return;

  // Os pedidos ficam salvos no navegador (localStorage) com esta chave.
  const CHAVE = 'ultragaz_pedidos';

  const el = (id) => document.getElementById(id);
  const lista = el('lista');
  const modal = el('modal');
  const form = el('form');
  let editandoId = null;

  /* ===== Armazenamento ===== */
  function carregar() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE)) || [];
    } catch (e) {
      return [];
    }
  }

  function salvar(pedidos) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(pedidos));
    } catch (e) {
      alert('Não foi possível salvar os pedidos neste navegador.');
    }
  }

  function proximoId(pedidos) {
    return pedidos.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  }

  function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
  }

  /* ===== Tabela ===== */
  function montarEndereco(p) {
    if (!p.rua) return '<span style="color:#6b7488">—</span>';
    const linha1 = escapar(p.rua) + (p.numero ? ', ' + escapar(p.numero) : '');
    const linha2 = [p.bairro, p.cidade && p.uf ? p.cidade + '/' + p.uf : p.cidade]
      .filter(Boolean).map(escapar).join(' - ');
    const cep = p.cep ? ' · CEP ' + escapar(p.cep) : '';
    return linha1 + '<small>' + linha2 + cep + '</small>';
  }

  function desenhar() {
    const pedidos = carregar();
    el('contador').textContent = pedidos.length === 1
      ? '1 pedido registrado'
      : pedidos.length + ' pedidos registrados';

    if (!pedidos.length) {
      lista.innerHTML = '<tr><td colspan="8" class="vazio">Nenhum pedido ainda. Clique em “Novo pedido” para cadastrar o primeiro.</td></tr>';
      return;
    }

    lista.innerHTML = pedidos.map((p) => `
      <tr>
        <td>${p.id}</td>
        <td>${escapar(p.nome)}</td>
        <td>${escapar(p.telefone)}</td>
        <td class="endereco">${montarEndereco(p)}</td>
        <td>${escapar(p.produto)}</td>
        <td>${escapar(p.qtd)}</td>
        <td class="mensagem">${escapar(p.mensagem)}</td>
        <td class="acoes">
          <button class="btn btn-editar" data-editar="${p.id}" type="button">Editar</button>
          <button class="btn btn-excluir" data-excluir="${p.id}" type="button">Excluir</button>
        </td>
      </tr>`).join('');
  }

  /* ===== Formulário ===== */
  function mostrarStatus(texto, tipo) {
    const s = el('cepStatus');
    s.textContent = texto || '';
    s.className = 'status' + (tipo ? ' ' + tipo : '');
  }

  function abrirModal(pedido) {
    editandoId = pedido ? pedido.id : null;
    el('tituloModal').textContent = pedido ? 'Editar pedido #' + pedido.id : 'Novo pedido';
    el('nome').value = pedido ? pedido.nome : '';
    el('telefone').value = pedido ? pedido.telefone : '';
    el('cep').value = pedido ? (pedido.cep || '') : '';
    el('rua').value = pedido ? (pedido.rua || '') : '';
    el('numero').value = pedido ? (pedido.numero || '') : '';
    el('bairro').value = pedido ? (pedido.bairro || '') : '';
    el('cidade').value = pedido ? (pedido.cidade || '') : '';
    el('uf').value = pedido ? (pedido.uf || '') : '';
    el('produto').value = pedido ? pedido.produto : '';
    el('qtd').value = pedido ? pedido.qtd : 1;
    el('mensagem').value = pedido ? pedido.mensagem : '';
    mostrarStatus('');
    modal.showModal();
    el('nome').focus();
  }

  /* Máscara de telefone: (00) 00000-0000 */
  el('telefone').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) {
      v = v.length > 10
        ? `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
        : `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    }
    e.target.value = v;
  });

  /* ===== CEP (API ViaCEP) ===== */
  async function buscarCep(cepLimpo) {
    mostrarStatus('Buscando endereço...');
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!resposta.ok) throw new Error('Falha na consulta');
      const dados = await resposta.json();

      if (dados.erro) {
        mostrarStatus('CEP não encontrado. Preencha o endereço manualmente.', 'erro');
        el('rua').focus();
        return;
      }

      el('rua').value = dados.logradouro || '';
      el('bairro').value = dados.bairro || '';
      el('cidade').value = dados.localidade || '';
      el('uf').value = dados.uf || '';
      mostrarStatus('Endereço encontrado.', 'ok');

      (el('rua').value ? el('numero') : el('rua')).focus();
    } catch (e) {
      mostrarStatus('Não foi possível consultar o CEP. Preencha o endereço manualmente.', 'erro');
    }
  }

  el('cep').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
    e.target.value = v;

    const limpo = v.replace(/\D/g, '');
    if (limpo.length === 8) {
      buscarCep(limpo);
    } else {
      mostrarStatus('');
    }
  });

  el('uf').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
  });

  /* ===== Eventos ===== */
  el('btnNovo').addEventListener('click', () => abrirModal(null));
  el('btnCancelar').addEventListener('click', () => modal.close());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pedidos = carregar();
    const dados = {
      nome: el('nome').value.trim(),
      telefone: el('telefone').value.trim(),
      cep: el('cep').value.trim(),
      rua: el('rua').value.trim(),
      numero: el('numero').value.trim(),
      bairro: el('bairro').value.trim(),
      cidade: el('cidade').value.trim(),
      uf: el('uf').value.trim().toUpperCase(),
      produto: el('produto').value.trim(),
      qtd: Math.max(1, parseInt(el('qtd').value, 10) || 1),
      mensagem: el('mensagem').value.trim()
    };

    if (editandoId) {
      const i = pedidos.findIndex((p) => p.id === editandoId);
      if (i > -1) pedidos[i] = { ...pedidos[i], ...dados };
    } else {
      pedidos.push({ id: proximoId(pedidos), ...dados });
    }

    salvar(pedidos);
    modal.close();
    desenhar();
  });

  lista.addEventListener('click', (e) => {
    const botao = e.target.closest('button');
    if (!botao) return;
    const pedidos = carregar();

    if (botao.dataset.editar) {
      const pedido = pedidos.find((p) => p.id === Number(botao.dataset.editar));
      if (pedido) abrirModal(pedido);
    }

    if (botao.dataset.excluir) {
      const id = Number(botao.dataset.excluir);
      if (confirm('Excluir o pedido #' + id + '?')) {
        salvar(pedidos.filter((p) => p.id !== id));
        desenhar();
      }
    }
  });

  desenhar();
})();
