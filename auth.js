// Sistema de Autenticação — agora fala com a API no servidor (Node/Express + SQLite)
// em vez de guardar os usuários no localStorage do navegador.

function usuarioAtualEhAdmin() {
  return sessionStorage.getItem('usuarioFuncao') === 'admin';
}

function usuarioTemPermissao(permissao) {
  if (usuarioAtualEhAdmin()) return true;

  const permissoes = JSON.parse(
    sessionStorage.getItem('usuarioPermissoes') || '{}'
  );
  return permissoes[permissao] === true;
}

function configurarAcessoAdmin() {
  const botaoAdmin = document.querySelector('.admin-btn');
  if (botaoAdmin && !usuarioTemPermissao('privilegiosAdministrativos')) {
    botaoAdmin.hidden = true;
  }
}

// Verificar se usuário está autenticado ao carregar
window.addEventListener('DOMContentLoaded', function () {
  const usuarioAutenticado = sessionStorage.getItem('usuarioAutenticado');
  const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';

  // Se está em login.html e já está autenticado, redireciona para index.html
  if (paginaAtual === 'login.html' && usuarioAutenticado) {
    window.location.href = 'index.html';
  }

  // Se está em index.html e NÃO está autenticado, redireciona para login.html
  if (paginaAtual === 'index.html' && !usuarioAutenticado) {
    window.location.href = 'login.html';
  }

  // Se está em login.html, inicializar os formulários
  if (paginaAtual === 'login.html') {
    inicializarLogin();
  }

  // Se está em index.html, mostrar nome do usuário
  if (paginaAtual === 'index.html' && usuarioAutenticado) {
    const nomeusuario = sessionStorage.getItem('nomeusuario');
    adicionarBotaoLogout(nomeusuario);
    configurarAcessoAdmin();
  }
});

// Inicializar eventos de login
function inicializarLogin() {
  const loginForm = document.getElementById('login-form');
  const registroForm = document.getElementById('registro-form');

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      fazerLogin();
    });
  }

  if (registroForm) {
    registroForm.addEventListener('submit', function (e) {
      e.preventDefault();
      criarConta();
    });
  }
}

// Alternar entre formulários de login e registro
function toggleForm(event) {
  event.preventDefault();
  const loginForm = document.getElementById('login-form');
  const registroForm = document.getElementById('registro-form');
  const erroMensagem = document.getElementById('erro-mensagem');

  loginForm.classList.toggle('ativo');
  registroForm.classList.toggle('ativo');

  erroMensagem.textContent = '';
}

// Guarda na sessão da aba atual os dados que a API devolveu
// (a API é quem decide nome, função e permissões — não o navegador)
function salvarSessaoUsuario(usuario) {
  sessionStorage.setItem('usuarioAutenticado', 'true');
  sessionStorage.setItem('usuarioEmail', usuario.username);
  sessionStorage.setItem('nomeusuario', usuario.name);
  sessionStorage.setItem('usuarioFuncao', usuario.funcao);
  sessionStorage.setItem(
    'usuarioPermissoes',
    JSON.stringify(usuario.permissoes)
  );
  sessionStorage.setItem('authToken', usuario.token);
}

// Fazer login (via API)
async function fazerLogin() {
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;
  const erroMensagem = document.getElementById('erro-mensagem');

  try {
    const resposta = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password: senha }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      erroMensagem.textContent = '❌ ' + dados.error;
      erroMensagem.style.display = 'block';
      return;
    }

    salvarSessaoUsuario(dados);

    erroMensagem.textContent = '';
    mostrarSucesso('Login realizado com sucesso!');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (erro) {
    erroMensagem.textContent = '❌ Não foi possível conectar ao servidor.';
    erroMensagem.style.display = 'block';
  }
}

// Criar nova conta (via API)
async function criarConta() {
  const nome = document.getElementById('registro-nome').value;
  const email = document.getElementById('registro-email').value;
  const senha = document.getElementById('registro-senha').value;
  const confirmar = document.getElementById('registro-confirmar').value;
  const erroMensagem = document.getElementById('erro-mensagem');

  // Validações locais (não substituem as validações do servidor)
  if (senha !== confirmar) {
    erroMensagem.textContent = '❌ As senhas não conferem!';
    erroMensagem.style.display = 'block';
    return;
  }

  if (senha.length < 6) {
    erroMensagem.textContent = '❌ A senha deve ter pelo menos 6 caracteres!';
    erroMensagem.style.display = 'block';
    return;
  }

  try {
    const resposta = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nome, username: email, password: senha }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      erroMensagem.textContent = '❌ ' + dados.error;
      erroMensagem.style.display = 'block';
      return;
    }

    salvarSessaoUsuario(dados);

    erroMensagem.textContent = '';
    mostrarSucesso('Conta criada com sucesso! Redirecionando...');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (erro) {
    erroMensagem.textContent = '❌ Não foi possível conectar ao servidor.';
    erroMensagem.style.display = 'block';
  }
}

// Fazer logout (será chamado do index.html)
function fazerLogout() {
  if (confirm('Tem certeza que deseja sair?')) {
    sessionStorage.removeItem('usuarioAutenticado');
    sessionStorage.removeItem('usuarioEmail');
    sessionStorage.removeItem('nomeusuario');
    sessionStorage.removeItem('usuarioFuncao');
    sessionStorage.removeItem('usuarioPermissoes');
    sessionStorage.removeItem('authToken');
    window.location.href = 'login.html';
  }
}

// Adicionar botão de logout no header
function adicionarBotaoLogout(nome) {
  const header = document.querySelector('.header');
  if (!header) return;

  let logoutBtn = document.getElementById('logout-btn');

  if (!logoutBtn) {
    logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.className = 'logout-btn';
    logoutBtn.innerHTML = `👤 ${nome} <span class="logout-texto">Sair</span>`;
    logoutBtn.onclick = fazerLogout;

    const carrinhoBtn = document.querySelector('.carrinho-btn');
    if (carrinhoBtn) {
      carrinhoBtn.parentNode.insertBefore(logoutBtn, carrinhoBtn);
    } else {
      header.appendChild(logoutBtn);
    }
  }
}

// Mostrar mensagem de sucesso
function mostrarSucesso(mensagem) {
  const erroMensagem = document.getElementById('erro-mensagem');
  if (erroMensagem) {
    erroMensagem.textContent = '✅ ' + mensagem;
    erroMensagem.style.display = 'block';
    erroMensagem.style.color = '#4caf50';
  }
}
