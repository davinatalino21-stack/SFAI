const input = document.getElementById("user-input");
const chatArea = document.getElementById("chat-area");
const chatContainer = document.getElementById("chat-container");
const modeBadge = document.getElementById("modeBadge");
const SECRET_CLEAR_CODE = "//clearAll";

const appMain = document.querySelector(".app-main");
function syncLayoutState() {
  if (!appMain || !chatContainer) return;
  const inChat = chatContainer.classList.contains("expanded");
  appMain.classList.toggle("state-chat", inChat);
  appMain.classList.toggle("state-initial", !inChat);
}
if (chatContainer && "MutationObserver" in window) {
  const observer = new MutationObserver(syncLayoutState);
  observer.observe(chatContainer, {
    attributes: true,
    attributeFilter: ["class"],
  });
}
syncLayoutState();

const sidebarEl = document.querySelector(".sidebar");
const sidebarCollapseBtn = document.querySelector(".sidebar-collapse");
function aplicarEstadoSidebar(colapsado) {
  if (!sidebarEl) return;
  sidebarEl.classList.toggle("collapsed", colapsado);
  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.setAttribute("aria-expanded", String(!colapsado));
    const lbl = sidebarCollapseBtn.querySelector(".nav-label");
    if (lbl) lbl.textContent = colapsado ? "Expandir" : "Recolher";
  }
}
function toggleSidebar() {
  if (!sidebarEl) return;
  const colapsado = !sidebarEl.classList.contains("collapsed");
  aplicarEstadoSidebar(colapsado);
  try {
    localStorage.setItem("sfai_sidebar_collapsed", colapsado ? "1" : "0");
  } catch (e) {}
}
function initSidebar() {
  let colapsado = false;
  try {
    colapsado = localStorage.getItem("sfai_sidebar_collapsed") === "1";
  } catch (e) {}
  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener("click", toggleSidebar);
  }
  aplicarEstadoSidebar(colapsado);
}

const token = localStorage.getItem("token");

const getUserData = () => {
  const rawUser = localStorage.getItem("usuario");
  if (!rawUser) {
    return null;
  }
  try {
    return JSON.parse(rawUser);
  } catch (error) {
    console.error("Falha ao ler usuário do localStorage:", error);
    return null;
  }
};

const getUserInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "US";
  }

  const initials =
    parts.length === 1
      ? parts[0].slice(0, 2)
      : `${parts[0][0]}${parts[parts.length - 1][0]}`;

  return initials.toUpperCase();
};

const closeUserMenu = () => {
  const button = document.getElementById("userMenuButton");
  const dropdown = document.getElementById("userMenuDropdown");
  if (dropdown && dropdown.classList.contains("is-open")) {
    dropdown.classList.remove("is-open");
  }
  if (button) {
    button.setAttribute("aria-expanded", "false");
  }
  if (dropdown) {
    dropdown.setAttribute("aria-hidden", "true");
  }
};

const toggleUserMenu = () => {
  const button = document.getElementById("userMenuButton");
  const dropdown = document.getElementById("userMenuDropdown");
  if (!button || !dropdown) {
    return;
  }

  const isOpen = dropdown.classList.toggle("is-open");
  button.setAttribute("aria-expanded", String(isOpen));
  dropdown.setAttribute("aria-hidden", String(!isOpen));
};

const populateUserMenu = () => {
  const user = getUserData();
  const headerAvatar = document.getElementById("userMenuHeaderAvatar");
  const icon = document.getElementById("userMenuIcon");
  const nameElement = document.getElementById("userMenuName");
  const emailElement = document.getElementById("userMenuEmail");

  if (!user || !nameElement || !emailElement || !headerAvatar || !icon) {
    return;
  }

  nameElement.textContent = user.nome || "Usuário";
  emailElement.textContent = user.email || "";

  const initials = getUserInitials(user.nome);

  if (user.foto) {
    const safeUrl = user.foto;
    const existingHeaderImg = headerAvatar.querySelector("img");
    if (
      !existingHeaderImg ||
      existingHeaderImg.getAttribute("src") !== safeUrl
    ) {
      const img = document.createElement("img");
      img.alt = "Foto do usuário";
      img.src = safeUrl;

      headerAvatar.replaceChildren(img);
    }
    const existingIconImg = icon.querySelector("img");
    if (!existingIconImg || existingIconImg.getAttribute("src") !== safeUrl) {
      const img = document.createElement("img");
      img.alt = "Avatar do usuário";
      img.src = safeUrl;

      icon.replaceChildren(img);
    }
  } else {
    const existingInitials = headerAvatar.querySelector(
      ".user-menu-header-initials",
    );
    if (!existingInitials || existingInitials.textContent !== initials) {
      headerAvatar.innerHTML = `<span class="user-menu-header-initials">${initials}</span>`;
    }
    if (icon.textContent !== initials) icon.textContent = initials;
  }
};

const handleUserMenuAction = (action) => {
  closeUserMenu();

  if (action === "logout") {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "Login/login.html";
    return;
  }

  if (action === "profile") {
    window.location.href = "profile.html";
    return;
  }

  if (action === "settings") {
    window.location.href = "settings.html";
    return;
  }

  if (action === "history") {
    browser();
  }
};

const initUserMenu = () => {
  const button = document.getElementById("userMenuButton");
  const dropdown = document.getElementById("userMenuDropdown");
  const actions = document.querySelectorAll(".user-menu-item");

  if (!button) {
    console.error("Botão do menu do usuário não encontrado.");
    return;
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleUserMenu();
  });

  actions.forEach((actionButton) => {
    actionButton.addEventListener("click", () => {
      const action = actionButton.dataset.action;
      handleUserMenuAction(action);
    });
  });

  populateUserMenu();
};

if (!token) {
  window.location.href = "Layout.html";
}

function atualizarModoBadge() {
  if (!feiraSelecionada) {
    modeBadge.classList.remove("show", "classificacao");
    modeBadge.textContent = "";
    return;
  }

  modeBadge.classList.add("show", "classificacao");
  let texto;
  if (feiraSelecionada === "MOSTRATEC") {
    texto = "Classificar para Mostratec";
  } else if (feiraSelecionada === "FEBRACE") {
    texto = "Classificar para Febrace";
  } else if (feiraSelecionada === "Ciências para Todos") {
    texto = "Classificar para Ciências para Todos";
  } else if (feiraSelecionada === "12ª DIREC") {
    texto = "Classificar para 12ª Direc";
  } else {
    texto = "Classificação ativa";
  }
  modeBadge.innerHTML = `<span class="mode-badge-close" aria-hidden="true">×</span>${texto}`;
}

modeBadge.addEventListener("click", () => {
  if (feiraSelecionada) {
    feiraSelecionada = "";
    input.placeholder = "O que vamos fazer hoje?";
    atualizarModoBadge();
  }
});

function ajustarAlturaTextarea() {
  const maxHeight = window.innerHeight * 0.35;
  const newHeight = Math.min(input.scrollHeight, maxHeight);

  if (input.offsetHeight !== newHeight) {
    input.style.height = `${newHeight}px`;
  }
}

function resetarAlturaTextarea() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, window.innerHeight * 0.35)}px`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizarNome(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function encontrarFonteCitacao(nome, porNome) {
  const n = normalizarNome(nome);
  if (!n) return null;

  if (porNome.has(n)) return porNome.get(n);

  const semExt = n.replace(/\.pdf$/i, "").trim();
  if (porNome.has(semExt)) return porNome.get(semExt);
  if (porNome.has(semExt + ".pdf")) return porNome.get(semExt + ".pdf");

  if (semExt.length >= 6) {
    for (const [chave, fonte] of porNome) {
      const chaveNorm = normalizarNome(chave);
      const chaveLimpa = chaveNorm.replace(/\.pdf$/i, "");
      if (chaveNorm.includes(semExt) || semExt.includes(chaveLimpa)) {
        return fonte;
      }
    }
  }

  return null;
}

function converterCitacoesEmLinks(texto, fontes) {
  if (!texto) return texto;

  const temFontes = Array.isArray(fontes) && fontes.length > 0;

  const porNome = new Map();
  const nomesEscapados = [];

  if (temFontes) {
    fontes.forEach((fonte) => {
      const arquivo = fonte.arquivo || "";
      const semExt = arquivo.replace(/\.pdf$/i, "");

      porNome.set(arquivo.toLowerCase(), fonte);
      porNome.set(semExt.toLowerCase(), fonte);
      porNome.set(normalizarNome(arquivo), fonte);
      porNome.set(normalizarNome(semExt), fonte);

      [arquivo, semExt, normalizarNome(arquivo), normalizarNome(semExt)].forEach(
        (nome) => {
          nomesEscapados.push(nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
        },
      );
    });
  }

  const nomesUnicos = [...new Set(nomesEscapados)];
  nomesUnicos.sort((a, b) => b.length - a.length);

  const padraoNomes = nomesUnicos.length
    ? `|(${nomesUnicos.join("|")})`
    : "";

  const padrao = new RegExp(
    `\\(([^()]*?)\\s*,\\s*(?:p\\.?|p[áa]g\\.?|p[áa]gina|pagina)\\s*(\\d+)\\)` +
      `|\\(([^()]*?)\\)` +
      padraoNomes,
    "gi",
  );

  return texto.replace(
    padrao,
    (match, nomeComPagina, pagina, nomeSo, nomeBare) => {
      const nome = (nomeComPagina || nomeSo || nomeBare || "")
        .replace(/<[^>]*>/g, "")
        .trim();
      if (!nome) return match;

      let fonte = temFontes ? encontrarFonteCitacao(nome, porNome) : null;

      if (!fonte) {
        // Sem dados de fontes (ex.: histórico antigo), só vira link se a
        // citação referenciar claramente um arquivo .pdf.
        if (!/\.pdf\s*$/i.test(nome)) return match;
        fonte = { arquivo: nome, pagina: pagina || null };
      }

      const arquivoSeguro = String(fonte.arquivo || "")
        .replace(/<[^>]*>/g, "")
        .trim();

      const url = montarUrlDocumento(
        arquivoSeguro,
        pagina || fonte.pagina
);
      return `<a class="rag-citacao-link" href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    },
  );
}

function formatarRespostaIA(texto, fontes) {
  if (!texto) return "";

  // Primeiro transforma Markdown em HTML
  texto = texto
    .replace(/\*\*(.*?)\*\*/gs, "<strong>$1</strong>")
    .replace(/(?<![\w.])_([^_\n]+?)_(?![\w.])/g, "<em>$1</em>")
    .replace(/\*(.*?)\*/gs, "<em>$1</em>");

  // Só depois transforma as citações em links
  texto = converterCitacoesEmLinks(texto, fontes);

  texto = texto.replace(/^[\s*•-]+\s+/gm, "");

  return texto
    .split(/\n\n+/)
    .map((bloco) => {
      const linhas = bloco
        .split(/\n/)
        .map((linha) => linha.trim())
        .filter((linha) => linha !== "");

      if (linhas.length === 0) {
        return '<div class="ans-spacer"></div>';
      }

      const conteudo = linhas
        .map((linha) => `<div class="ans-line">${linha}</div>`)
        .join("");

      return `<div class="ans-block">${conteudo}</div>`;
    })
    .join("");
}

function montarUrlDocumento(arquivo, pagina) {
  const url = `${API_BASE_URL}/documentos/${encodeURIComponent(arquivo)}`;
  return pagina ? `${url}#page=${pagina}` : url;
}

async function digitarTexto(elemento, html, velocidade = 5) {
  elemento.innerHTML = "";
  let exibicaoParcial = "";
  let indice = 0;

  while (indice < html.length) {
    if (html[indice] === "<") {
      const fechamento = html.indexOf(">", indice);
      if (fechamento === -1) {
        exibicaoParcial += html[indice];
        indice += 1;
      } else {
        exibicaoParcial += html.slice(indice, fechamento + 1);
        indice = fechamento + 1;
      }
    } else {
      exibicaoParcial += html[indice];
      indice += 1;
      elemento.innerHTML = exibicaoParcial;
      await sleep(velocidade / 3);
    }
  }

  elemento.innerHTML = exibicaoParcial;
}

input.addEventListener("input", ajustarAlturaTextarea);
ajustarAlturaTextarea();

let primeiravez = true;

let historicoConversa = [];
let chatMessages = [];

const API_BASE_URL = "https://davidumbproxmax-classificador-mostratec.hf.space";
let conversaAtualId = null;
let listaConversas = [];

const perguntasFrequentes = [
  { pergunta: "O que é a Mostratec?", categoria: "Sobre feiras" },
  { pergunta: "Como participar da Febrace?", categoria: "Inscrição" },
  { pergunta: "Quais são as categorias científicas?", categoria: "Categorias" },
  { pergunta: "Como escrever um bom resumo?", categoria: "Metodologia" },
  { pergunta: "O que é metodologia científica?", categoria: "Metodologia" },
  { pergunta: "Como fazer uma tempestade de ideias?", categoria: "Planejamento" },
  { pergunta: "Quais documentos são necessários para uma feira?", categoria: "Documentação" },
  { pergunta: "Qual o cronograma da Mostratec?", categoria: "Cronograma" },
  { pergunta: "Qual o cronograma da Febrace?", categoria: "Cronograma" },
  { pergunta: "Qual o cronograma da 12ª DIREC?", categoria: "Cronograma" },
  { pergunta: "Qual o cronograma da Ciências para Todos?", categoria: "Cronograma" },
];

const cronogramas = {
  mostratec: [
    "📅 Cronograma MOSTRATEC 2026",
    "",
    "• Afiliação de feiras: 01/05 a 31/05",
    "• Submissão direta de projetos: 01/07 a 31/07",
    "• Inscrição de projetos credenciados por feiras afiliadas (realizadas até 30/06): até 31/07",
    "• Inscrição de projetos credenciados por feiras afiliadas (realizadas em 07/2026): até 31/08",
    "• Inscrição de projetos credenciados por feiras afiliadas (realizadas entre 08/2026 e 28/09/2026): até 30/09",
    "• Divulgação dos projetos selecionados: 01/09",
    "• Divulgação dos finalistas: 06/10",
    "• Envio do relatório científico (somente Ensino Médio e Técnico): até 14/10",
    "• Pagamento das inscrições: até 19/10",
    "• Realização da feira: 26/10 a 30/10",
    "",
    "ℹ️ Projetos credenciados por feiras afiliadas possuem vaga garantida desde que cumpram todas as exigências do regulamento. Apenas projetos do Ensino Médio e Técnico enviam relatório científico.",
  ].join("\n"),
  febrace: [
    "📅 Cronograma FEBRACE 2027",
    "",
    "• Abertura das inscrições dos projetos: 22/06/2026",
    "• Início da afiliação e renovação de feiras: 01/07/2026",
    "• Encerramento da afiliação de feiras: 31/08/2026 (18h)",
    "• Divulgação das feiras afiliadas: 22/09/2026",
    "• Prazo final para envio dos projetos: 20/10/2026 (18h)",
    "• Divulgação dos finalistas: 18/12/2026 (14h)",
    "• Prazo final para confirmação dos finalistas: 12/02/2027",
    "• Mostra Presencial: 15/03 a 19/03/2027",
    "• Cerimônia de Premiação: 19/03/2027",
    "",
    "ℹ️ A FEBRACE acontece anualmente no mês de março. Projetos podem participar por submissão direta ou através de feiras afiliadas.",
  ].join("\n"),
  direc: [
    "📅 Cronograma 12ª DIREC",
    "",
    "ℹ️ A 12ª DIREC não possui calendário fixo nacional.",
    "",
    "• O cronograma é divulgado anualmente pela SEEC/RN.",
    "• Normalmente a feira regional ocorre entre agosto e setembro.",
    "• Os projetos classificados podem receber credenciamento para feiras estaduais e nacionais, dependendo da edição.",
  ].join("\n"),
  ciencias: [
    "📅 Cronograma Ciências para Todos",
    "",
    "ℹ️ A Ciências para Todos não possui calendário oficial fixo.",
    "",
    "• O cronograma é divulgado anualmente pela organização da feira.",
    "• Normalmente ocorre durante o segundo semestre.",
    "• As datas variam conforme o edital publicado.",
  ].join("\n"),
};

function detectarCronograma(texto) {
  const t = texto.toLowerCase();
  if (!t.includes("cronograma")) return null;
  if (t.includes("mostratec")) return cronogramas.mostratec;
  if (t.includes("febrace")) return cronogramas.febrace;
  if (t.includes("direc")) return cronogramas.direc;
  if (t.includes("ciência") || t.includes("ciencias") || t.includes("para todos")) return cronogramas.ciencias;
  return null;
}

async function carregarConversas() {
  const user = getUserData();
  if (!user?.id) return;

  try {
    const res = await fetch(`${API_BASE_URL}/conversas/${user.id}`);
    if (!res.ok) throw new Error("Erro ao carregar conversas");
    const data = await res.json();
    listaConversas = Array.isArray(data) ? data : [];
    renderizarListaConversas();
  } catch (err) {
    console.error("Erro ao carregar conversas:", err);
    listaConversas = [];
    renderizarListaConversas();
  }
}

function renderizarListaConversas() {
  const histList = document.getElementById("histList");
  const histEmpty = document.getElementById("histEmpty");
  if (!histList || !histEmpty) return;

  histList.innerHTML = "";

  if (listaConversas.length === 0) {
    histEmpty.style.display = "flex";
    return;
  }

  histEmpty.style.display = "none";

  listaConversas.forEach((conversa) => {
    const item = document.createElement("div");
    item.classList.add("hist-item");
    if (conversa.id === conversaAtualId) {
      item.classList.add("active");
    }

    const title = document.createElement("div");
    title.classList.add("hist-item-title");
    title.textContent = conversa.titulo || "Sem título";

    const date = document.createElement("div");
    date.classList.add("hist-item-date");
    date.textContent = formatarDataHist(conversa.atualizado_em);

    item.appendChild(title);
    item.appendChild(date);

    item.addEventListener("click", () => {
      abrirConversa(conversa.id);
    });

    histList.appendChild(item);
  });
}

function renderizarFaq() {
  const faqList = document.getElementById("faqList");
  if (!faqList) return;

  faqList.innerHTML = "";

  perguntasFrequentes.forEach((item) => {
    const faqItem = document.createElement("div");
    faqItem.classList.add("hist-item");

    const question = document.createElement("div");
    question.classList.add("hist-item-title");
    question.textContent = item.pergunta;

    const category = document.createElement("div");
    category.classList.add("hist-item-date");
    category.textContent = item.categoria;

    faqItem.appendChild(question);
    faqItem.appendChild(category);

    faqItem.addEventListener("click", () => {
      usarSugestao(item.pergunta);
      fecharFaq();
    });

    faqList.appendChild(faqItem);
  });
}

function formatarDataHist(timestamp) {
  if (!timestamp) return "";
  try {
    const d = new Date(timestamp);
    const agora = new Date();
    const diffMs = agora - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);

    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffH < 24) return `${diffH}h atrás`;

    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

async function abrirConversa(conversaId) {
  conversaAtualId = conversaId;
  chatMessages = [];
  historicoConversa = [];
  chatArea.innerHTML = "";

  renderizarListaConversas();

  const chatAra = document.getElementById("hero");
  if (chatAra) chatAra.style.display = "none";
  if (window.matchMedia("(max-width: 768px)").matches) {
    const footer = document.querySelector("footer");
    if (footer) footer.style.display = "none";
  }
  primeiravez = false;
  if (chatContainer) chatContainer.classList.add("expanded");

  try {
    const res = await fetch(`${API_BASE_URL}/conversas/${conversaId}/mensagens`);
    if (!res.ok) throw new Error("Erro ao carregar mensagens");
    const mensagens = await res.json();

    if (!Array.isArray(mensagens)) return;

    mensagens.forEach((msg) => {
      const role = msg.remetente === "assistant" ? "assistant" : "user";
      const messageElement = document.createElement("div");
      messageElement.classList.add("message", role === "assistant" ? "bot" : "user");

      if (role === "assistant") {
        let conteudo = msg.conteudo;

        messageElement.innerHTML = formatarRespostaIA(conteudo, msg.fontes);

        chatMessages.push({ role, content: conteudo, fontes: msg.fontes || [] });
        historicoConversa.push({ role, content: conteudo });

        chatArea.appendChild(messageElement);
      } else {
        messageElement.textContent = msg.conteudo;
        chatArea.appendChild(messageElement);
        chatMessages.push({ role, content: msg.conteudo });
        historicoConversa.push({ role, content: msg.conteudo });
      }
    });

    chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: "smooth" });
  } catch (err) {
    console.error("Erro ao abrir conversa:", err);
    const errorEl = document.createElement("div");
    errorEl.classList.add("message", "bot");
    errorEl.textContent = "Erro ao carregar esta conversa.";
    chatArea.appendChild(errorEl);
  }

  browser();
  fecharFaq();
}

function novaConversa() {
  conversaAtualId = null;
  chatMessages = [];
  historicoConversa = [];
  chatArea.innerHTML = `<div class="message bot">Olá 👋 Pergunte qualquer coisa sobre as Feiras de Ciências, Horários e muito mais!</div>`;

  const chatAra = document.getElementById("hero");

  if (chatAra) chatAra.style.display = "block";
  if (chatContainer) chatContainer.classList.remove("expanded");

  primeiravez = true;
  input.value = "";
  resetarAlturaTextarea();

  const histList = document.getElementById("histList");
  if (histList) {
    histList.querySelectorAll(".hist-item").forEach((el) => {
      el.classList.toggle("active", false);
    });
  }

  browser();
  fecharFaq();
}

function limparHistorico() {
  historicoConversa = [];
}

function getUserStoragePrefix() {
  const user = getUserData();
  return user?.id ? `user_${user.id}_` : "";
}

function limparChatSalvo() {
  chatMessages = [];
  historicoConversa = [];
  conversaAtualId = null;
}

function salvarConversaAtual() {
  const prefix = getUserStoragePrefix();
  localStorage.setItem(prefix + "chatMessages", JSON.stringify(chatMessages));
  localStorage.setItem(prefix + "historicoConversa", JSON.stringify(historicoConversa));
}

function carregarConversaAtual() {
  const prefix = getUserStoragePrefix();

  Object.keys(localStorage).forEach((key) => {
    if (
      key.startsWith("user_") &&
      !key.startsWith(prefix) &&
      (key.endsWith("_chatMessages") ||
        key.endsWith("_historicoConversa"))
    ) {
      localStorage.removeItem(key);
    }
  });

  const dadosChat = localStorage.getItem(prefix + "chatMessages");
  const dadosHistorico = localStorage.getItem(prefix + "historicoConversa");

  if (dadosChat) {
    try {
      const mensagens = JSON.parse(dadosChat);
      if (Array.isArray(mensagens) && mensagens.length > 0) {
        chatMessages = mensagens;
        mensagens.forEach((item) => {
          const messageElement = document.createElement("div");
          messageElement.classList.add(
            "message",
            item.role === "assistant" ? "bot" : "user",
          );

          if (item.role === "assistant") {
            messageElement.innerHTML = formatarRespostaIA(item.content, item.fontes);
          } else {
            messageElement.textContent = item.content;
          }

          chatArea.appendChild(messageElement);
        });
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: "smooth" });
        primeiravez = false;
        if (chatContainer) chatContainer.classList.add("expanded");

        const chatAra = document.getElementById("hero");
        if (chatAra) chatAra.style.display = "none";
        if (window.matchMedia("(max-width: 768px)").matches) {
          const footer = document.querySelector("footer");
          if (footer) footer.style.display = "none";
        }
      }
    } catch (error) {
      console.error("Erro ao carregar chat salvo:", error);
      chatMessages = [];
    }
  }

  if (dadosHistorico) {
    try {
      const historico = JSON.parse(dadosHistorico);
      if (Array.isArray(historico)) {
        historicoConversa = historico;
      }
    } catch (error) {
      console.error("Erro ao carregar histórico salvo:", error);
      historicoConversa = [];
    }
  }
}

let contexto = "";
let feiraSelecionada = "";

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    if (event.shiftKey) {
      return;
    } else {
      event.preventDefault();
      enviarMensagem();
    }
  }
});

function toggleFeiraPopup() {
  const popup = document.getElementById("feiraPopup");
  popup.classList.toggle("show");
}

function selecionarFeira(opcao) {
  if (feiraSelecionada === opcao) {
    feiraSelecionada = "";
  } else {
    feiraSelecionada = opcao;
  }

  document.getElementById("feiraPopup").classList.remove("show");

  if (feiraSelecionada) {
    let feiraSlecionadaLowerCase = "";
    if (feiraSelecionada == "MOSTRATEC") {
      feiraSlecionadaLowerCase = "Mostratec";
    } else if (feiraSelecionada == "FEBRACE") {
      feiraSlecionadaLowerCase = "Febrace";
    } else if (feiraSelecionada == "Ciências para Todos") {
      feiraSlecionadaLowerCase = feiraSelecionada;
    } else if (feiraSelecionada == "12ª DIREC") {
      feiraSlecionadaLowerCase = "12ª Direc";
    }
    input.placeholder = `${feiraSlecionadaLowerCase}`;
  } else {
    input.placeholder = "O que vamos fazer hoje?";
  }

  atualizarModoBadge();
}

window.addEventListener("click", (event) => {
  const popup = document.getElementById("feiraPopup");
  const toggle = event.target.closest(".options-input-area");
  const insidePopup = event.target.closest(".feira-popup");
  if (!toggle && !insidePopup && popup) {
    popup.classList.remove("show");
  }

  const insideUserMenu = event.target.closest("#user-menu-widget");
  if (!insideUserMenu) {
    closeUserMenu();
  }
});

async function enviarMensagem() {
  const userMessage = input.value.trim();
  if (userMessage === "") return;

  if (userMessage === SECRET_CLEAR_CODE) {
    limparChatSalvo();
    chatArea.innerHTML = "";
    primeiravez = true;

    const chatAra = document.getElementById("hero");
    if (chatAra) chatAra.style.display = "block";
    if (chatContainer) chatContainer.classList.remove("expanded");

    input.value = "";
    resetarAlturaTextarea();
    window.location.reload();
    return;
  }

  const messageElement = document.createElement("div");
  messageElement.classList.add("message", "user");
  messageElement.textContent = userMessage;
  chatArea.appendChild(messageElement);
  chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: "smooth" });

  if (primeiravez === true) {
    const chatAra = document.getElementById("hero");

    if (chatAra) chatAra.classList.add("fade-out1");

    setTimeout(() => {
      if (chatAra) chatAra.style.display = "none";
      if (window.matchMedia("(max-width: 768px)").matches) {
        const footer = document.querySelector("footer");
        if (footer) footer.style.display = "none";
      }
    }, 500);
    primeiravez = false;
    if (chatContainer) chatContainer.classList.add("expanded");
  }

  input.value = "";
  resetarAlturaTextarea();

  const aiElement = document.createElement("div");
  aiElement.classList.add("message", "bot");
  aiElement.innerHTML = `<span class="typing-indicator" aria-label="Pensando"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>`;
  chatArea.appendChild(aiElement);

  chatMessages.push({ role: "user", content: userMessage });
  salvarConversaAtual();

  const cronogramaInfo = detectarCronograma(userMessage);

  const modo = feiraSelecionada ? "classificacao" : "conversa";

  let feiraMapeada = "";
  if (
    feiraSelecionada === "Ciências para Todos" ||
    feiraSelecionada === "12ª DIREC" ||
    feiraSelecionada === "FEBRACE"
  ) {
    feiraMapeada = "FEBRACE";
  } else if (feiraSelecionada === "MOSTRATEC") {
    feiraMapeada = "MOSTRATEC";
  }

  try {
    const user = getUserData();
    const usuarioId = user?.id || null;

    const url = `${API_BASE_URL}/classificar`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        usuario_id: usuarioId,
        conversa_id: conversaAtualId,
        resumo: userMessage,
        feira: feiraMapeada,
        modo: modo,
        mensagem: userMessage,
      }),
    });

    const data = await response.json();

    if (data.resultado) {
      let textoIA = data.resultado;

      if (data.conversa_id) {
        conversaAtualId = data.conversa_id;

        const existente = listaConversas.find((c) => c.id === data.conversa_id);
        if (existente) {
          if (data.titulo) existente.titulo = data.titulo;
          existente.atualizado_em = new Date().toISOString();
        } else {
          listaConversas.unshift({
            id: data.conversa_id,
            titulo: data.titulo || userMessage.slice(0, 40),
            atualizado_em: new Date().toISOString(),
          });
        }
        renderizarListaConversas();
      }

      if (modo === "conversa") {
        historicoConversa.push({
          role: "user",
          content: userMessage,
        });

        historicoConversa.push({
          role: "assistant",
          content: textoIA,
        });
      }

      chatMessages.push({
        role: "assistant",
        content: textoIA,
        fontes: data.fontes_rag || [],
      });
      salvarConversaAtual();

      if (historicoConversa.length > 10) {
        historicoConversa = historicoConversa.slice(-10);
      }

      const textoFormatado = formatarRespostaIA(textoIA, data.fontes_rag);

      chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: "smooth" });
      await digitarTexto(aiElement, textoFormatado, 6);

      if (cronogramaInfo) {
        const cronogramaEl = document.createElement("div");
        cronogramaEl.classList.add("message", "bot");
        cronogramaEl.innerHTML = formatarRespostaIA(cronogramaInfo);
        chatArea.appendChild(cronogramaEl);
        chatMessages.push({ role: "assistant", content: cronogramaInfo });
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: "smooth" });
      }

      salvarConversaAtual();
    } else {
      aiElement.classList.add("chat-error");
      aiElement.innerHTML = `<span class="chat-error-msg">Erro na resposta do backend da IA.</span>`;
      console.error("Erro detalhado:", data);
    }
  } catch (erro) {
    aiElement.classList.add("chat-error");
    aiElement.innerHTML = `<span class="chat-error-msg">Erro de conexão com o servidor de IA. Verifique sua internet e tente novamente.</span>`;
    console.error("Erro no Fetch:", erro);
  }
}

function browser() {
  const el = document.getElementById("hist");
  const aberto = el.classList.contains("is-open");
  fecharPainéis();
  if (!aberto) {
    el.classList.add("is-open");
    atualizarBackdrop();
  }
}

function toggleFaq() {
  const el = document.getElementById("faqPanel");
  const aberto = el.classList.contains("is-open");
  fecharPainéis();
  if (!aberto) {
    el.classList.add("is-open");
    atualizarBackdrop();
  }
}

function fecharPainéis() {
  document.querySelectorAll(".drawer.is-open").forEach((el) => {
    el.classList.remove("is-open");
  });
  atualizarBackdrop();
}

function atualizarBackdrop() {
  const backdrop = document.getElementById("drawerBackdrop");
  const aberto = document.querySelectorAll(".drawer.is-open").length > 0;
  if (backdrop) {
    backdrop.classList.toggle("is-visible", aberto);
    backdrop.tabIndex = aberto ? 0 : -1;
  }
}

function fecharFaq() {
  const faq = document.getElementById("faqPanel");
  if (faq) faq.classList.remove("is-open");
  atualizarBackdrop();
}

function usarSugestao(texto) {
  if (!texto) return;

  if (feiraSelecionada) {
    feiraSelecionada = "";
    input.placeholder = "O que vamos fazer hoje?";
    atualizarModoBadge();
  }

  input.value = texto;
  enviarMensagem();
}

document.addEventListener("DOMContentLoaded", () => {
  const backdrop = document.getElementById("drawerBackdrop");
  if (backdrop) {
    backdrop.addEventListener("click", fecharPainéis);
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      fecharPainéis();
      closeUserMenu();
    }
  });
});

const urlParams = new URLSearchParams(window.location.search);
const mensagemInicial = urlParams.get("msg");
if (mensagemInicial) {
  input.value = mensagemInicial;
  enviarMensagem();
  const novaUrl = window.location.pathname;
  window.history.replaceState({}, document.title, novaUrl);
  if (primeiravez) {
    const chatAra = document.getElementById("hero");
    chatAra.classList.add("fade-out1");
    setTimeout(() => {
      chatAra.style.display = "none";
    }, 500);
    primeiravez = false;
    if (chatContainer) chatContainer.classList.add("expanded");
  }
  input.value = "";
}

window.onload = function () {
  carregarConversaAtual();

  initUserMenu();
  initSidebar();

  const btnNewChat = document.getElementById("btnNewChat");
  if (btnNewChat) {
    btnNewChat.addEventListener("click", novaConversa);
  }

  carregarConversas();

  renderizarFaq();
};
