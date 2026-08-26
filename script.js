// Produtos: agora vêm do backend (SQLite), não mais do localStorage.
let produtos = [];

// Carrinho de compras (continua só na memória da aba, isso é intencional —
// o carrinho não precisa persistir entre sessões, só o estoque precisa)
let carrinho = [];

// Busca a lista de produtos na API e atualiza a variável global `produtos`
async function buscarProdutos() {
  try {
    const resposta = await fetch("/products");
    if (!resposta.ok) throw new Error("Falha ao buscar produtos");
    produtos = await resposta.json();
  } catch (erro) {
    console.error("Erro ao buscar produtos:", erro);
    produtos = [];
  }
  return produtos;
}

// Carregar produtos na página (público)
async function carregarProdutos() {
  await buscarProdutos();
  renderizarGridProdutos();
}

function renderizarGridProdutos() {
  const gridProdutos = document.getElementById("grid-produtos");
  gridProdutos.innerHTML = "";

  if (produtos.length === 0) {
    gridProdutos.innerHTML = `
            <div class="produtos-vazios-container">
                <div class="produtos-vazios-content">
                    <div class="produtos-vazios-emoji">📭</div>
                    <h3>Oops! Nenhum Produto Disponível</h3>
                    <p>Parece que todos os nossos produtos foram comprados ou ainda não temos nenhum cadastrado.</p>
                    <p class="produtos-vazios-subtexto">Volte em breve para mais essências extraordinárias!</p>
                    <button class="btn-admin-redirect" onclick="toggleAdmin()">⚙️ Ir para Admin</button>
                </div>
            </div>
        `;
    return;
  }

  produtos.forEach((produto) => {
    const estoque = produto.estoque ?? 0;
    const semEstoque = estoque <= 0;

    const card = document.createElement("div");
    card.className = "produto-card";
    card.innerHTML = `
            <div class="produto-info">
                <h3>${produto.nome}</h3>
                <p class="produto-descricao">${produto.descricao}</p>
                <p class="produto-preco">R$ ${produto.preco.toFixed(2).replace(".", ",")}</p>
                <p class="produto-estoque">${semEstoque ? "Esgotado" : `${estoque} em estoque`}</p>
                <button class="btn-adicionar" onclick="adicionarAoCarrinho(${produto.id})" ${semEstoque ? "disabled" : ""}>
                  ${semEstoque ? "Esgotado" : "Adicionar ao Carrinho"}
                </button>
            </div>
        `;
    gridProdutos.appendChild(card);
  });
}

// Adicionar produto ao carrinho
function adicionarAoCarrinho(produtoId) {
  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto) return;

  const estoqueDisponivel = produto.estoque ?? 0;
  const itemExistente = carrinho.find((item) => item.id === produtoId);
  const quantidadeNoCarrinho = itemExistente ? itemExistente.quantidade : 0;

  if (quantidadeNoCarrinho >= estoqueDisponivel) {
    alert(`❌ Não há mais estoque disponível de ${produto.nome}!`);
    return;
  }

  if (itemExistente) {
    itemExistente.quantidade++;
  } else {
    carrinho.push({
      ...produto,
      quantidade: 1,
    });
  }

  atualizarCarrinho();
  mostrarNotificacao(`${produto.nome} adicionado ao carrinho!`);
}

// Remover do carrinho
function removerDoCarrinho(produtoId) {
  carrinho = carrinho.filter((item) => item.id !== produtoId);
  atualizarCarrinho();
}

// Alterar quantidade
function alterarQuantidade(produtoId, novaQuantidade) {
  const item = carrinho.find((i) => i.id === produtoId);
  if (!item) return;

  if (novaQuantidade <= 0) {
    removerDoCarrinho(produtoId);
    return;
  }

  const produto = produtos.find((p) => p.id === produtoId);
  const estoqueDisponivel = produto ? (produto.estoque ?? 0) : 0;

  if (novaQuantidade > estoqueDisponivel) {
    alert(`❌ Só há ${estoqueDisponivel} unidade(s) em estoque!`);
    return;
  }

  item.quantidade = novaQuantidade;
  atualizarCarrinho();
}

// Atualizar exibição do carrinho
function atualizarCarrinho() {
  const carrinhoItems = document.getElementById("carrinho-items");
  const contadorCarrinho = document.getElementById("contador-carrinho");
  const totalPreco = document.getElementById("total-preco");

  contadorCarrinho.textContent = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0,
  );

  if (carrinho.length === 0) {
    carrinhoItems.innerHTML =
      '<p class="carrinho-vazio">Seu carrinho está vazio</p>';
    totalPreco.textContent = "R$ 0,00";
  } else {
    carrinhoItems.innerHTML = carrinho
      .map(
        (item) => `
            <div class="carrinho-item">
                <div class="carrinho-item-nome">${item.nome}</div>
                <div class="carrinho-item-preco">R$ ${item.preco.toFixed(2).replace(".", ",")}</div>
                <div class="carrinho-item-quantidade">
                    <button class="qty-btn" onclick="alterarQuantidade(${item.id}, ${item.quantidade - 1})">−</button>
                    <span>${item.quantidade}</span>
                    <button class="qty-btn" onclick="alterarQuantidade(${item.id}, ${item.quantidade + 1})">+</button>
                </div>
                <button class="remover-btn" onclick="removerDoCarrinho(${item.id})">Remover</button>
            </div>
        `,
      )
      .join("");

    const total = carrinho.reduce(
      (sum, item) => sum + item.preco * item.quantidade,
      0,
    );
    totalPreco.textContent = "R$ " + total.toFixed(2).replace(".", ",");
  }
}

// Toggle do carrinho sidebar
function toggleCarrinho() {
  const sidebar = document.getElementById("carrinho-sidebar");
  const overlay = document.getElementById("overlay");
  sidebar.classList.toggle("ativo");
  overlay.classList.toggle("ativo");
}

// Checkout — o servidor confere e desconta o estoque de verdade;
// o navegador só avisa o resultado.
async function checkout() {
  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  const itens = carrinho.map((item) => ({
    id: item.id,
    quantidade: item.quantidade,
  }));
  const total = carrinho.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0,
  );
  const items = carrinho
    .map((item) => `${item.nome} (${item.quantidade}x)`)
    .join(", ");
  const token = sessionStorage.getItem("authToken");

  try {
    const resposta = await fetch("/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itens }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(
        `❌ ${dados.error}\n\nO carrinho foi atualizado com o estoque atual.`,
      );
      await carregarProdutos();
      return;
    }

    alert(
      `Pedido confirmado!\n\nProdutos: ${items}\n\nTotal: R$ ${total.toFixed(2).replace(".", ",")}\n\nObrigado pela compra!`,
    );

    carrinho = [];
    atualizarCarrinho();
    toggleCarrinho();
    await carregarProdutos();
  } catch (erro) {
    alert("❌ Não foi possível conectar ao servidor para finalizar a compra.");
  }
}

// Mostrar notificação
function mostrarNotificacao(mensagem) {
  console.log(mensagem);
  // Você pode expandir isso com um elemento visual de notificação
}

// Inicializar ao carregar a página
document.addEventListener("DOMContentLoaded", function () {
  carregarProdutos();
  inicializarFormularioProduto();
});

// ============= SISTEMA DE ADMIN =============

// Toggle modal admin
function toggleAdmin() {
  const modal = document.getElementById("modal-admin");
  const overlay = document.getElementById("modal-overlay");

  if (
    typeof usuarioTemPermissao === "function" &&
    !usuarioTemPermissao("gerenciarProdutos") &&
    !usuarioTemPermissao("gerenciarUsuarios")
  ) {
    alert("Acesso restrito ao administrador.");
    return;
  }

  modal.classList.toggle("ativo");
  overlay.classList.toggle("ativo");

  if (modal.classList.contains("ativo")) {
    listarProdutosAdmin();
    listarUsuariosAdmin();
    carregarPedidosAdmin();
  }
}

// Inicializar formulário de novo produto
function inicializarFormularioProduto() {
  const form = document.getElementById("form-novo-produto");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      criarNovoProduto();
    });
  }
}

// Criar novo produto (via API)
async function criarNovoProduto() {
  const nome = document.getElementById("prod-nome").value;
  const preco = parseFloat(document.getElementById("prod-preco").value);
  const descricao = document.getElementById("prod-descricao").value;
  const estoqueInput = document.getElementById("prod-estoque");
  const estoque = estoqueInput ? parseInt(estoqueInput.value, 10) : 0;

  if (
    !nome ||
    isNaN(preco) ||
    preco < 0 ||
    !descricao ||
    isNaN(estoque) ||
    estoque < 0
  ) {
    alert(
      "❌ Preencha todos os campos corretamente (preço e estoque não podem ser negativos)!",
    );
    return;
  }

  const token = sessionStorage.getItem("authToken");

  try {
    const resposta = await fetch("/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nome, descricao, preco, estoque }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert("❌ " + dados.error);
      return;
    }

    document.getElementById("form-novo-produto").reset();
    await carregarProdutos();
    await listarProdutosAdmin();

    alert("✅ Produto adicionado com sucesso!");
  } catch (erro) {
    alert("❌ Não foi possível conectar ao servidor.");
  }
}

// Listar produtos na interface admin (busca sempre atualizado da API)
async function listarProdutosAdmin() {
  const container = document.getElementById("produtos-admin");
  if (!usuarioTemPermissao("gerenciarProdutos")) {
    container.innerHTML =
      '<p class="produtos-vazio">Você não tem permissão para gerenciar produtos.</p>';
    return;
  }

  await buscarProdutos();

  if (produtos.length === 0) {
    container.innerHTML =
      '<p class="produtos-vazio">Nenhum produto cadastrado</p>';
    return;
  }

  container.innerHTML = produtos
    .map(
      (produto) => `
        <div class="produto-admin-card">
            <div class="produto-admin-header">
                <div class="produto-admin-info">
                    <h4>${produto.nome}</h4>
                    <p>${produto.descricao}</p>
                </div>
            </div>
            <div class="produto-admin-preco">R$ ${produto.preco.toFixed(2).replace(".", ",")}</div>
            <div class="produto-admin-estoque">Estoque: ${produto.estoque ?? 0}</div>
            <div class="produto-admin-actions">
                <button class="btn-editar" onclick="editarProduto(${produto.id})">✏️ Editar</button>
                <button class="btn-deletar" onclick="deletarProduto(${produto.id})">🗑️ Deletar</button>
            </div>
        </div>
    `,
    )
    .join("");
}

// ---------- Gestão de usuários e permissões (via API) ----------

// Listar contas e suas permissões
async function listarUsuariosAdmin() {
  const container = document.getElementById("usuarios-admin");
  if (!container) return;

  if (!usuarioTemPermissao("gerenciarUsuarios")) {
    container.innerHTML =
      '<p class="produtos-vazio">Você não tem permissão para gerenciar contas.</p>';
    return;
  }

  const token = sessionStorage.getItem("authToken");

  try {
    const resposta = await fetch("/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resposta.ok) {
      container.innerHTML =
        '<p class="produtos-vazio">Não foi possível carregar as contas.</p>';
      return;
    }

    const usuarios = await resposta.json();

    container.innerHTML = usuarios
      .map((usuario) => {
        const permissoes = usuario.permissoes || {};
        const contaPrincipal = usuario.username === "admin@araca.com";
        const controles = contaPrincipal
          ? '<p class="permissoes-bloqueadas">Administrador principal: permissões protegidas</p>'
          : `
            <label class="permissao-item">
              <input type="checkbox" ${permissoes.gerenciarProdutos ? "checked" : ""}
                onchange="alterarPermissaoUsuario('${usuario.username}', 'gerenciarProdutos', this.checked)">
              Gerenciar produtos
            </label>
            <label class="permissao-item">
              <input type="checkbox" ${permissoes.gerenciarUsuarios ? "checked" : ""}
                onchange="alterarPermissaoUsuario('${usuario.username}', 'gerenciarUsuarios', this.checked)">
              Gerenciar contas
            </label>
          `;

        return `
          <div class="usuario-admin-card">
            <div>
              <h4>${usuario.name}</h4>
              <p>${usuario.username} · ${usuario.funcao}</p>
            </div>
            <div class="permissoes-lista">${controles}</div>
          </div>
        `;
      })
      .join("");
  } catch (erro) {
    container.innerHTML =
      '<p class="produtos-vazio">Erro ao conectar ao servidor.</p>';
  }
}

// Alterar uma permissão de um usuário
async function alterarPermissaoUsuario(username, permissao, habilitada) {
  if (
    !usuarioTemPermissao("gerenciarUsuarios") ||
    username === "admin@araca.com"
  ) {
    return;
  }

  const token = sessionStorage.getItem("authToken");

  try {
    const resposta = await fetch(
      `/users/${encodeURIComponent(username)}/permissoes`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissao, habilitada }),
      },
    );

    if (!resposta.ok) {
      alert("❌ Não foi possível atualizar a permissão.");
      listarUsuariosAdmin();
    }
  } catch (erro) {
    alert("❌ Erro ao conectar ao servidor.");
    listarUsuariosAdmin();
  }
}

// ---------- Pedidos/reservas (só administradores) ----------

// Carrega e mostra quem reservou o quê. Só aparece pra quem é admin de
// verdade (não basta ter a permissão de gerenciar produtos ou contas).
async function carregarPedidosAdmin() {
  const secao = document.getElementById("secao-pedidos-admin");
  const container = document.getElementById("pedidos-admin");
  if (!secao || !container) return;

  if (typeof usuarioAtualEhAdmin !== "function" || !usuarioAtualEhAdmin()) {
    secao.hidden = true;
    return;
  }

  secao.hidden = false;

  const token = sessionStorage.getItem("authToken");

  try {
    const resposta = await fetch("/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resposta.ok) {
      container.innerHTML =
        '<p class="produtos-vazio">Não foi possível carregar os pedidos.</p>';
      return;
    }

    const pedidos = await resposta.json();

    if (pedidos.length === 0) {
      container.innerHTML =
        '<p class="produtos-vazio">Nenhum pedido registrado ainda.</p>';
      return;
    }

    container.innerHTML = pedidos
      .map((pedido) => {
        const itensHtml = pedido.itens
          .map(
            (item) =>
              `<li>${item.quantidade}x ${item.nome} — R$ ${item.preco.toFixed(2).replace(".", ",")} cada</li>`,
          )
          .join("");

        return `
          <div class="pedido-admin-card">
            <div class="pedido-admin-header">
              <strong>${pedido.username}</strong>
              <span>${pedido.data}</span>
            </div>
            <ul class="pedido-admin-itens">${itensHtml}</ul>
            <div class="pedido-admin-total">Total: R$ ${pedido.total.toFixed(2).replace(".", ",")}</div>
          </div>
        `;
      })
      .join("");
  } catch (erro) {
    container.innerHTML =
      '<p class="produtos-vazio">Erro ao conectar ao servidor.</p>';
  }
}

// Deletar produto (via API)
async function deletarProduto(produtoId) {
  if (!confirm("Tem certeza que deseja deletar este produto?")) return;

  const token = sessionStorage.getItem("authToken");

  try {
    const resposta = await fetch(`/products/${produtoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert("❌ " + (dados.error || "Erro ao deletar produto."));
      return;
    }

    await carregarProdutos();
    await listarProdutosAdmin();
    alert("✅ Produto deletado com sucesso!");
  } catch (erro) {
    alert("❌ Não foi possível conectar ao servidor.");
  }
}

// Editar produto (via API)
async function editarProduto(produtoId) {
  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto) return;

  const novoNome = prompt("Novo nome:", produto.nome);
  if (novoNome === null) return;

  const novaDescricao = prompt("Nova descrição:", produto.descricao);
  if (novaDescricao === null) return;

  const novoPreco = prompt("Novo preço:", produto.preco);
  if (novoPreco === null) return;

  const novoEstoque = prompt("Novo estoque:", produto.estoque ?? 0);
  if (novoEstoque === null) return;

  const token = sessionStorage.getItem("authToken");

  try {
    const resposta = await fetch(`/products/${produtoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nome: novoNome,
        descricao: novaDescricao,
        preco: parseFloat(novoPreco),
        estoque: parseInt(novoEstoque, 10),
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert("❌ " + (dados.error || "Erro ao editar produto."));
      return;
    }

    await carregarProdutos();
    await listarProdutosAdmin();
    alert("✅ Produto editado com sucesso!");
  } catch (erro) {
    alert("❌ Não foi possível conectar ao servidor.");
  }
}
