// Limpar uma única vez os produtos antigos antes de iniciar o catálogo vazio.
if (!localStorage.getItem("catalogoAraçaVazioInicializado")) {
  localStorage.removeItem("produtosAraça");
  localStorage.setItem("catalogoAraçaVazioInicializado", "true");
}

// Começar sem produtos cadastrados; novos produtos continuam sendo salvos no localStorage.
let produtos = carregarProdutosLocal() || [];

// Carrinho de compras
let carrinho = [];

// Carregar produtos na página
function carregarProdutos() {
  const gridProdutos = document.getElementById("grid-produtos");
  gridProdutos.innerHTML = "";

  // Verificar se não há produtos
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
    const card = document.createElement("div");
    card.className = "produto-card";
    card.innerHTML = `
            <div class="produto-imagem">${produto.emoji}</div>
            <div class="produto-info">
                <h3>${produto.nome}</h3>
                <p class="produto-descricao">${produto.descricao}</p>
                <p class="produto-preco">R$ ${produto.preco.toFixed(2).replace(".", ",")}</p>
                <button class="btn-adicionar" onclick="adicionarAoCarrinho(${produto.id})">Adicionar ao Carrinho</button>
            </div>
        `;
    gridProdutos.appendChild(card);
  });
}

// Adicionar produto ao carrinho
function adicionarAoCarrinho(produtoId) {
  const produto = produtos.find((p) => p.id === produtoId);
  const itemExistente = carrinho.find((item) => item.id === produtoId);

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
  if (item) {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
    } else {
      item.quantidade = novaQuantidade;
      atualizarCarrinho();
    }
  }
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
                <div class="carrinho-item-nome">${item.emoji} ${item.nome}</div>
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

// Checkout
function checkout() {
  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  const total = carrinho.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0,
  );
  const items = carrinho
    .map((item) => `${item.nome} (${item.quantidade}x)`)
    .join(", ");

  alert(
    `Pedido confirmado!\n\nProdutos: ${items}\n\nTotal: R$ ${total.toFixed(2).replace(".", ",")}\n\nObrigado pela compra!`,
  );

  carrinho = [];
  atualizarCarrinho();
  toggleCarrinho();
}

// Enviar mensagem de contato
function enviarMensagem(event) {
  event.preventDefault();
  alert("Mensagem enviada com sucesso! Entraremos em contato em breve.");
  event.target.reset();
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

// Carregar produtos do localStorage
function carregarProdutosLocal() {
  const produtosLocal = localStorage.getItem("produtosAraça");
  return produtosLocal ? JSON.parse(produtosLocal) : null;
}

// Salvar produtos no localStorage
function salvarProdutosLocal() {
  localStorage.setItem("produtosAraça", JSON.stringify(produtos));
}

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

// Criar novo produto
function criarNovoProduto() {
  const nome = document.getElementById("prod-nome").value;
  const preco = parseFloat(document.getElementById("prod-preco").value);
  const descricao = document.getElementById("prod-descricao").value;
  const emoji = document.getElementById("prod-emoji").value;

  // Validar
  if (!nome || !preco || !descricao || !emoji) {
    alert("❌ Preencha todos os campos!");
    return;
  }

  // Criar novo produto
  const novoProduto = {
    id: Date.now(),
    nome: nome,
    descricao: descricao,
    preco: preco,
    emoji: emoji,
  };

  // Adicionar ao array
  produtos.push(novoProduto);
  salvarProdutosLocal();

  // Limpar formulário
  document.getElementById("form-novo-produto").reset();

  // Atualizar display
  carregarProdutos();
  listarProdutosAdmin();

  alert("✅ Produto adicionado com sucesso!");
}

// Listar produtos na interface admin
function listarProdutosAdmin() {
  const container = document.getElementById("produtos-admin");
  if (!usuarioTemPermissao("gerenciarProdutos")) {
    container.innerHTML =
      '<p class="produtos-vazio">Você não tem permissão para gerenciar produtos.</p>';
    return;
  }

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
                <div class="produto-admin-emoji">${produto.emoji}</div>
                <div class="produto-admin-info">
                    <h4>${produto.nome}</h4>
                    <p>${produto.descricao}</p>
                </div>
            </div>
            <div class="produto-admin-preco">R$ ${produto.preco.toFixed(2).replace(".", ",")}</div>
            <div class="produto-admin-actions">
                <button class="btn-editar" onclick="editarProduto(${produto.id})">✏️ Editar</button>
                <button class="btn-deletar" onclick="deletarProduto(${produto.id})">🗑️ Deletar</button>
            </div>
        </div>
    `,
    )
    .join("");
}

// Listar contas e suas permissões
function listarUsuariosAdmin() {
  const container = document.getElementById("usuarios-admin");
  if (!container || typeof carregarUsuarios !== "function") return;

  if (!usuarioTemPermissao("gerenciarUsuarios")) {
    container.innerHTML =
      '<p class="produtos-vazio">Você não tem permissão para gerenciar contas.</p>';
    return;
  }

  const usuarios = carregarUsuarios();
  container.innerHTML = usuarios
    .map((usuario) => {
      const permissoes = usuario.permissoes || {};
      const contaPrincipal = usuario.email === "admin@araca.com";
      const controles = contaPrincipal
        ? '<p class="permissoes-bloqueadas">Administrador principal: permissões protegidas</p>'
        : `
          <label class="permissao-item">
            <input type="checkbox" ${permissoes.gerenciarProdutos ? "checked" : ""}
              onchange="alterarPermissaoUsuario('${usuario.email}', 'gerenciarProdutos', this.checked)">
            Gerenciar produtos
          </label>
          <label class="permissao-item">
            <input type="checkbox" ${permissoes.gerenciarUsuarios ? "checked" : ""}
              onchange="alterarPermissaoUsuario('${usuario.email}', 'gerenciarUsuarios', this.checked)">
            Gerenciar contas
          </label>
        `;

      return `
        <div class="usuario-admin-card">
          <div>
            <h4>${usuario.nome}</h4>
            <p>${usuario.email} · ${usuario.funcao || "usuario"}</p>
          </div>
          <div class="permissoes-lista">${controles}</div>
        </div>
      `;
    })
    .join("");
}

function alterarPermissaoUsuario(email, permissao, habilitada) {
  if (!usuarioAtualEhAdmin() || email === "admin@araca.com") return;

  const usuarios = carregarUsuarios();
  const usuario = usuarios.find((item) => item.email === email);
  if (!usuario) return;

  usuario.permissoes = usuario.permissoes || {};
  usuario.permissoes[permissao] = habilitada;
  salvarUsuarios(usuarios);
}

// Deletar produto
function deletarProduto(produtoId) {
  if (confirm("Tem certeza que deseja deletar este produto?")) {
    produtos = produtos.filter((p) => p.id !== produtoId);
    salvarProdutosLocal();
    carregarProdutos();
    listarProdutosAdmin();
    alert("✅ Produto deletado com sucesso!");
  }
}

// Editar produto
function editarProduto(produtoId) {
  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto) return;

  const novoNome = prompt("Novo nome:", produto.nome);
  if (novoNome === null) return;

  const novaDescricao = prompt("Nova descrição:", produto.descricao);
  if (novaDescricao === null) return;

  const novoPreco = prompt("Novo preço:", produto.preco);
  if (novoPreco === null) return;

  produto.nome = novoNome;
  produto.descricao = novaDescricao;
  produto.preco = parseFloat(novoPreco);

  salvarProdutosLocal();
  carregarProdutos();
  listarProdutosAdmin();

  alert("✅ Produto editado com sucesso!");
}
