// ============================================================
// SFAI — Página de Configurações
// Reusa os sistemas já existentes:
//   - tema .............. Theme/theme.js   (window.Theme)
//   - conta ............. Theme/account.js (localStorage "usuario"/"token")
//   - preferências ...... Theme/preferences.js (localStorage "sfai_preferences")
//   - voltar / toast .... Theme/ui.js
// ============================================================

const API_BASE_URL =
  "https://davidumbproxmax-classificador-mostratec.hf.space";

// Mesmas chaves usadas por FrontEnd/chatbot/script.js (salvarConversaAtual).
const CHAT_STORAGE_SUFFIXES = ["chatMessages", "historicoConversa"];

const byId = (id) => document.getElementById(id);

const mostrarToast = (mensagem, tipo = "info") => window.SFAIUI.toast(mensagem, tipo);

const mostrarValor = (elemento, valor) => {
  if (!elemento) return;

  const vazio = !valor;
  elemento.textContent = vazio ? "Não informado" : valor;
  elemento.classList.toggle("is-empty", vazio);
};

// ============================================================
// Aparência: o tema já é salvo pelo Theme/theme.js
// ============================================================
const sincronizarTema = () => {
  const alternadorTema = byId("themeToggle");
  if (!alternadorTema) return;

  const aplicar = () => {
    alternadorTema.checked = window.Theme.get() === "dark";
  };

  aplicar();

  // O chat e outras páginas podem trocar o tema: o switch acompanha.
  window.addEventListener("themechange", aplicar);
  window.addEventListener("themeinit", aplicar);

  alternadorTema.addEventListener("change", () => {
    const tema = alternadorTema.checked ? "dark" : "light";

    if (typeof window.Theme?.apply === "function") {
      window.Theme.apply(tema);
    } else {
      document.documentElement.setAttribute("data-theme", tema);
    }

    alternadorTema.checked = window.Theme.get() === "dark";
    mostrarToast(
      alternadorTema.checked ? "Tema escuro ativado" : "Tema claro ativado",
    );
  });
};

// ============================================================
// Preferências do assistente
// ============================================================
const preferencias = () => window.SFAIPrefs.get();

const sincronizarPreferencias = () => {
  const definicoes = [
    {
      input: byId("typingAnimationToggle"),
      chave: "typingAnimation",
      ativo: "Animação de digitação ativada",
      inativo: "Resposta exibida de uma vez",
    },
    {
      input: byId("enterSendToggle"),
      chave: "enterSend",
      ativo: "Enter envia a mensagem",
      inativo: "Enter quebra linha (use o botão Enviar)",
    },
    {
      input: byId("autoSaveHistoryToggle"),
      chave: "autoSaveHistory",
      ativo: "Histórico salvo automaticamente",
      inativo: "Histórico não será salvo",
    },
  ];

  definicoes.forEach(({ input, chave, ativo, inativo }) => {
    if (!input) return;

    input.checked = preferencias()[chave];

    input.addEventListener("change", () => {
      window.SFAIPrefs.set(chave, input.checked);
      mostrarToast(input.checked ? ativo : inativo);

      if (chave === "autoSaveHistory") atualizarStatusHistorico();
    });
  });

  window.SFAIPrefs.onChange((detalhe) => {
    definicoes.forEach(({ input, chave }) => {
      if (input && detalhe.preferences) {
        input.checked = detalhe.preferences[chave];
      }
    });
  });
};

// ============================================================
// Histórico do chat
// ============================================================
const usuario = () => window.SFAIAccount.get();

const listarChavesHistoricoLocal = () => {
  const prefixo = window.SFAIAccount.getStoragePrefix(usuario());

  return Object.keys(localStorage).filter((chave) =>
    CHAT_STORAGE_SUFFIXES.some(
      (sufixo) => chave === sufixo || chave === `${prefixo}${sufixo}`,
    ),
  );
};

const limparHistoricoLocal = () => {
  const chaves = listarChavesHistoricoLocal();
  chaves.forEach((chave) => localStorage.removeItem(chave));
  return chaves.length;
};

// Remove as conversas do usuário no backend.
// Retorna: >= 0 = quantidade removida, -1 = endpoint indisponível,
// -2 = falha inesperada.
const apagarConversasNoServidor = async (usuarioId) => {
  try {
    const resposta = await fetch(
      `${API_BASE_URL}/conversas?usuario_id=${encodeURIComponent(usuarioId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${window.SFAIAccount.getToken()}` },
      },
    );

    if (resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      return Number(dados.removidas ?? 0);
    }

    return [404, 405, 501].includes(resposta.status) ? -1 : -2;
  } catch {
    return -2;
  }
};

const atualizarStatusHistorico = () => {
  const status = byId("historyStatus");
  if (!status) return;

  if (!preferencias().autoSaveHistory) {
    status.textContent = "Salvamento automático desativado.";
    return;
  }

  const temSalvo = listarChavesHistoricoLocal().length > 0;
  status.textContent = temSalvo
    ? "A conversa atual está salva neste navegador."
    : "Nenhuma conversa salva neste navegador.";
};

const abrirConfirmacao = () => {
  const modal = byId("confirmModal");
  if (!modal) return;

  modal.classList.remove("hidden");
  byId("confirmClearHistoryButton")?.focus();
};

const fecharConfirmacao = () => {
  byId("confirmModal")?.classList.add("hidden");
};

const confirmarLimpeza = async () => {
  const botao = byId("confirmClearHistoryButton");
  const dadosUsuario = usuario();

  if (botao) botao.disabled = true;
  fecharConfirmacao();

  limparHistoricoLocal();

  const removidas = dadosUsuario?.id
    ? await apagarConversasNoServidor(dadosUsuario.id)
    : -1;

  if (removidas >= 0) {
    mostrarToast(
      removidas === 1
        ? "Histórico limpo: 1 conversa removida."
        : `Histórico limpo: ${removidas} conversas removidas.`,
      "success",
    );
  } else if (removidas === -1) {
    mostrarToast(
      "Histórico deste navegador foi limpo. O servidor ainda não permite apagar conversas.",
      "warning",
    );
  } else {
    mostrarToast(
      "Histórico local limpo, mas o servidor não respondeu.",
      "warning",
    );
  }

  if (botao) botao.disabled = false;
  atualizarStatusHistorico();
};

const initHistorico = () => {
  byId("clearHistoryButton")?.addEventListener("click", abrirConfirmacao);
  byId("confirmClearHistoryButton")?.addEventListener(
    "click",
    confirmarLimpeza,
  );
  byId("cancelConfirmButton")?.addEventListener("click", fecharConfirmacao);
  byId("closeConfirmModalButton")?.addEventListener(
    "click",
    fecharConfirmacao,
  );

  byId("confirmModal")?.addEventListener("click", (evento) => {
    if (evento.target === byId("confirmModal")) fecharConfirmacao();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") fecharConfirmacao();
  });

  atualizarStatusHistorico();
};

// ============================================================
// Conta
// ============================================================
const mostrarConta = () => {
  const dadosUsuario = usuario();
  if (!dadosUsuario) return;

  const ehGoogle = window.SFAIAccount.isGoogleAccount(dadosUsuario);
  const metodo = window.SFAIAccount.getLoginMethod(dadosUsuario);

  mostrarValor(byId("settingsAccountName"), dadosUsuario.nome);
  mostrarValor(byId("settingsAccountEmail"), dadosUsuario.email);
  mostrarValor(
    byId("settingsAccountId"),
    dadosUsuario.id ? `#${dadosUsuario.id}` : null,
  );
  mostrarValor(byId("settingsAccountMethod"), metodo);

  const badge = byId("settingsAccountBadge");
  if (badge) {
    badge.textContent = metodo;
    badge.classList.toggle("is-google", ehGoogle);
  }
};

const initConta = () => {
  mostrarConta();

  byId("editProfileButton")?.addEventListener("click", () => {
    window.location.href = "profile.html";
  });

  byId("logoutButton")?.addEventListener("click", () => {
    window.SFAIAccount.clear();
    window.location.href = "Login/login.html";
  });
};

// ============================================================
// Página
// ============================================================
const initSettingsPage = () => {
  if (!window.SFAIAccount?.requireAuth()) return;

  byId("backButton")?.addEventListener("click", () => {
    window.SFAIUI.back("index.html");
  });

  sincronizarTema();
  sincronizarPreferencias();
  initHistorico();
  initConta();
};

window.addEventListener("DOMContentLoaded", initSettingsPage);
