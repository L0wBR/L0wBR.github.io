// Sistema de Autenticação
const ADMIN_PADRAO = {
  id: "admin-padrao",
  nome: "Administrador",
  email: "admin@araca.com",
  senha: "admin123",
  funcao: "admin",
  permissoes: {
    gerenciarProdutos: true,
    gerenciarUsuarios: true,
  },
  dataCadastro: "21/08/2026",
};

function carregarUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios")) || [];
}

function salvarUsuarios(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function garantirContaAdmin() {
  const usuarios = carregarUsuarios();
  const adminExistente = usuarios.find(
    (usuario) => usuario.email === ADMIN_PADRAO.email,
  );

  if (!adminExistente) {
    usuarios.push({ ...ADMIN_PADRAO });
    salvarUsuarios(usuarios);
    return;
  }

  adminExistente.nome = ADMIN_PADRAO.nome;
  adminExistente.senha = ADMIN_PADRAO.senha;
  adminExistente.funcao = "admin";
  adminExistente.permissoes = { ...ADMIN_PADRAO.permissoes };
  salvarUsuarios(usuarios);
}

function usuarioAtualEhAdmin() {
  return sessionStorage.getItem("usuarioFuncao") === "admin";
}

function usuarioTemPermissao(permissao) {
  if (usuarioAtualEhAdmin()) return true;

  const permissoes = JSON.parse(
    sessionStorage.getItem("usuarioPermissoes") || "{}",
  );
  return permissoes[permissao] === true;
}

function configurarAcessoAdmin() {
  const botaoAdmin = document.querySelector(".admin-btn");
  if (
    botaoAdmin &&
    !usuarioTemPermissao("gerenciarProdutos") &&
    !usuarioTemPermissao("gerenciarUsuarios")
  ) {
    botaoAdmin.hidden = true;
  }
}

// Verificar se usuário está autenticado ao carregar
window.addEventListener("DOMContentLoaded", function () {
  garantirContaAdmin();
  const usuarioAutenticado = sessionStorage.getItem("usuarioAutenticado");
  const paginaAtual = window.location.pathname.split("/").pop() || "index.html";

  // Se está em login.html e já está autenticado, redireciona para index.html
  if (paginaAtual === "login.html" && usuarioAutenticado) {
    window.location.href = "index.html";
  }

  // Se está em index.html e NÃO está autenticado, redireciona para login.html
  if (paginaAtual === "index.html" && !usuarioAutenticado) {
    window.location.href = "login.html";
  }

  // Se está em login.html, inicializar os formulários
  if (paginaAtual === "login.html") {
    inicializarLogin();
  }

  // Se está em index.html, mostrar nome do usuário
  if (paginaAtual === "index.html" && usuarioAutenticado) {
    const nomeusuario = sessionStorage.getItem("nomeusuario");
    adicionarBotaoLogout(nomeusuario);
    configurarAcessoAdmin();
  }
});

// Inicializar eventos de login
function inicializarLogin() {
  const loginForm = document.getElementById("login-form");
  const registroForm = document.getElementById("registro-form");
  const erroMensagem = document.getElementById("erro-mensagem");

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      fazerLogin();
    });
  }

  if (registroForm) {
    registroForm.addEventListener("submit", function (e) {
      e.preventDefault();
      criarConta();
    });
  }
}

// Alternar entre formulários de login e registro
function toggleForm(event) {
  event.preventDefault();
  const loginForm = document.getElementById("login-form");
  const registroForm = document.getElementById("registro-form");
  const erroMensagem = document.getElementById("erro-mensagem");

  loginForm.classList.toggle("ativo");
  registroForm.classList.toggle("ativo");

  // Limpar mensagens de erro
  erroMensagem.textContent = "";
}

// Fazer login
function fazerLogin() {
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;
  const erroMensagem = document.getElementById("erro-mensagem");

  // Recuperar usuários do localStorage
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  // Encontrar usuário com email e senha
  const usuario = usuarios.find((u) => u.email === email && u.senha === senha);

  if (usuario) {
    // Autenticar usuário
    sessionStorage.setItem("usuarioAutenticado", "true");
    sessionStorage.setItem("usuarioEmail", usuario.email);
    sessionStorage.setItem("nomeusuario", usuario.nome);
    sessionStorage.setItem("usuarioFuncao", usuario.funcao || "usuario");
    sessionStorage.setItem(
      "usuarioPermissoes",
      JSON.stringify(usuario.permissoes || {}),
    );

    erroMensagem.textContent = "";
    mostrarSucesso("Login realizado com sucesso!");

    // Redirecionar após 1 segundo
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } else {
    erroMensagem.textContent = "❌ Email ou senha incorretos!";
    erroMensagem.style.display = "block";
  }
}

// Criar nova conta
function criarConta() {
  const nome = document.getElementById("registro-nome").value;
  const email = document.getElementById("registro-email").value;
  const senha = document.getElementById("registro-senha").value;
  const confirmar = document.getElementById("registro-confirmar").value;
  const erroMensagem = document.getElementById("erro-mensagem");

  // Validações
  if (senha !== confirmar) {
    erroMensagem.textContent = "❌ As senhas não conferem!";
    erroMensagem.style.display = "block";
    return;
  }

  if (senha.length < 6) {
    erroMensagem.textContent = "❌ A senha deve ter pelo menos 6 caracteres!";
    erroMensagem.style.display = "block";
    return;
  }

  // Recuperar usuários existentes
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  // Verificar se email já existe
  if (usuarios.some((u) => u.email === email)) {
    erroMensagem.textContent =
      "❌ Email já cadastrado! Faça login ou use outro email.";
    erroMensagem.style.display = "block";
    return;
  }

  // Criar novo usuário
  const novoUsuario = {
    id: Date.now(),
    nome: nome,
    email: email,
    senha: senha,
    funcao: "usuario",
    permissoes: {
      gerenciarProdutos: false,
      gerenciarUsuarios: false,
    },
    dataCadastro: new Date().toLocaleDateString("pt-BR"),
  };

  // Salvar no localStorage
  usuarios.push(novoUsuario);
  localStorage.setItem("usuarios", JSON.stringify(usuarios));

  // Autenticar automaticamente
  sessionStorage.setItem("usuarioAutenticado", "true");
  sessionStorage.setItem("usuarioEmail", email);
  sessionStorage.setItem("nomeusuario", nome);
  sessionStorage.setItem("usuarioFuncao", "usuario");
  sessionStorage.setItem(
    "usuarioPermissoes",
    JSON.stringify(novoUsuario.permissoes),
  );

  erroMensagem.textContent = "";
  mostrarSucesso("Conta criada com sucesso! Redirecionando...");

  // Redirecionar após 1 segundo
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}

// Fazer logout (será chamado do index.html)
function fazerLogout() {
  if (confirm("Tem certeza que deseja sair?")) {
    sessionStorage.removeItem("usuarioAutenticado");
    sessionStorage.removeItem("usuarioEmail");
    sessionStorage.removeItem("nomeusuario");
    sessionStorage.removeItem("usuarioFuncao");
    sessionStorage.removeItem("usuarioPermissoes");
    window.location.href = "login.html";
  }
}

// Adicionar botão de logout no header
function adicionarBotaoLogout(nome) {
  const header = document.querySelector(".header");
  if (!header) return;

  // Procurar botão de logout existente
  let logoutBtn = document.getElementById("logout-btn");

  if (!logoutBtn) {
    // Criar botão de logout
    logoutBtn = document.createElement("button");
    logoutBtn.id = "logout-btn";
    logoutBtn.className = "logout-btn";
    logoutBtn.innerHTML = `👤 ${nome} <span class="logout-texto">Sair</span>`;
    logoutBtn.onclick = fazerLogout;

    // Adicionar antes do botão de carrinho
    const carrinhoBtn = document.querySelector(".carrinho-btn");
    if (carrinhoBtn) {
      carrinhoBtn.parentNode.insertBefore(logoutBtn, carrinhoBtn);
    } else {
      header.appendChild(logoutBtn);
    }
  }
}

// Mostrar mensagem de sucesso
function mostrarSucesso(mensagem) {
  const erroMensagem = document.getElementById("erro-mensagem");
  if (erroMensagem) {
    erroMensagem.textContent = "✅ " + mensagem;
    erroMensagem.style.display = "block";
    erroMensagem.style.color = "#4caf50";
  }
}
