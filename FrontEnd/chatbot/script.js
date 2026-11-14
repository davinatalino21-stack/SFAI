const input = document.getElementById("user-input");
const chatArea = document.getElementById("chat-area");
const chatContainer = document.getElementById("chat-container");
const modeBadge = document.getElementById("modeBadge");
const SECRET_CLEAR_CODE = "//clearAll";
const PLACEHOLDER_PADRAO = 'aperte no "+" e classifique seu projeto!';

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

// ============================================================
// Viewport visível (somente mobile)
// A barra do navegador e o teclado virtual reduzem a altura realmente
// visível da tela, mas o .app usava 100dvh (altura do layout). Isso
// deixava uma faixa vazia entre o campo de mensagem e a barra inferior.
// Medimos o viewport visível e usamos --app-height / --app-offset-top
// para o app ocupar só a parte visível; o transform mantém a barra
// inferior fixa junto ao campo. Em desktop nada muda.
// ============================================================
const QUERY_MOBILE = "(max-width: 932px)";
const appEl = document.querySelector(".app");

function alturaDisponivel() {
  const viewportVisual = window.visualViewport;
  if (!viewportVisual || !window.matchMedia(QUERY_MOBILE).matches) {
    return window.innerHeight;
  }
  return viewportVisual.height;
}

function sincronizarViewportVisual() {
  if (!appEl) return;

  const viewportVisual = window.visualViewport;
  const mobile = window.matchMedia(QUERY_MOBILE).matches;
  const alturaLayout = document.documentElement.clientHeight;
  const encolheu =
    mobile && viewportVisual && viewportVisual.height < alturaLayout - 1;

  if (encolheu) {
    appEl.style.setProperty(
      "--app-height",
      `${Math.round(viewportVisual.height)}px`,
    );
    appEl.style.setProperty(
      "--app-offset-top",
      `${Math.round(viewportVisual.offsetTop)}px`,
    );
  } else {
    appEl.style.removeProperty("--app-height");
    appEl.style.removeProperty("--app-offset-top");
  }

  // Com o teclado aberto o navegador pode rolar a página: volta ao topo.
  if (window.scrollY !== 0) window.scrollTo(0, 0);

  ajustarAlturaTextarea();
}

if (window.visualViewport) {
  window.visualViewport.addEventListener(
    "resize",
    sincronizarViewportVisual,
  );
  window.visualViewport.addEventListener(
    "scroll",
    sincronizarViewportVisual,
  );
  window.addEventListener("orientationchange", sincronizarViewportVisual);
}

const sidebarEl = document.querySelector(".sidebar");
const sidebarToggleBtn = document.querySelector(".sidebar-toggle");
function aplicarEstadoSidebar(colapsado) {
  if (!sidebarEl) return;
  sidebarEl.classList.toggle("collapsed", colapsado);
  if (sidebarToggleBtn) {
    sidebarToggleBtn.setAttribute("aria-expanded", String(!colapsado));
    sidebarToggleBtn.setAttribute(
      "aria-label",
      colapsado ? "Expandir menu" : "Compactar menu",
    );
    sidebarToggleBtn.setAttribute(
      "title",
      colapsado ? "Expandir menu" : "Compactar menu",
    );
  }
}
function alternarSidebar() {
  if (!sidebarEl) return;
  aplicarEstadoSidebar(!sidebarEl.classList.contains("collapsed"));
}
function initSidebar() {
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", alternarSidebar);
  }
  aplicarEstadoSidebar(false);
}

const token = localStorage.getItem("token");

const cabecalhosAutenticados = () => {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const encerrarSessaoInvalida = () => {
  window.SFAIAccount?.clear();
  window.location.href = "Login/login.html";
};

// Preferências definidas na página de Configurações (Settings/settings.js).
// Sem o módulo carregado (ou sem preferência salva), vale o padrão "ativo".
const preferenciaAtiva = (chave) => window.SFAIPrefs?.get(chave) !== false;

const getUserData = () => window.SFAIAccount?.get() ?? null;

const getUserInitials = (name) =>
  window.SFAIAccount?.getInitials(name, "US") ?? "US";

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
  window.location.href = "Login/login.html";
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
    input.placeholder = PLACEHOLDER_PADRAO;
    atualizarModoBadge();
  }
});

function ajustarAlturaTextarea() {
  // Campo vazio mantém a altura de uma linha: em telas estreitas o
  // placeholder quebraria em várias linhas e deixaria o campo alto.
  if (!input.value.trim()) {
    input.style.height = "";
    return;
  }

  // Limita o crescimento do campo pela altura realmente disponível
  // (com o teclado aberto sobra bem menos espaço).
  const maxHeight = alturaDisponivel() * 0.35;
  const newHeight = Math.min(input.scrollHeight, maxHeight);

  if (input.offsetHeight !== newHeight) {
    input.style.height = `${newHeight}px`;
  }
}

function resetarAlturaTextarea() {
  ajustarAlturaTextarea();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escaparHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================
// Gráficos do SFAI (Chart.js)
// A IA envia um bloco sfai-chart com JSON validado no frontend.
// A biblioteca só é carregada quando a resposta contém um gráfico.
// ============================================================
let sfaiChartJsPromise = null;
const sfaiChartsAtivos = new WeakMap();

function extrairBlocosGraficos(texto) {
  const graficos = [];
  const padraoGrafico = new RegExp("\\x60{3}sfai-chart\\s*([\\s\\S]*?)\\x60{3}", "gi");
  const textoProtegido = String(texto ?? "").replace(
    padraoGrafico,
    (bloco, json) => {
      const token = "SFAI_CHART_TOKEN_" + graficos.length + "_END";
      try {
        const config = JSON.parse(json.trim());
        if (!config || typeof config !== "object" || Array.isArray(config)) {
          throw new Error("Configuração de gráfico inválida.");
        }
        graficos.push({ token, config });
        return "\n\n" + token + "\n\n";
      } catch (erro) {
        console.error("Bloco de gráfico inválido:", erro);
        return "\n\nNão foi possível montar o gráfico: os dados recebidos são inválidos.\n\n";
      }
    },
  );
  return { texto: textoProtegido, graficos };
}

function carregarChartJs() {
  if (window.Chart) return Promise.resolve(window.Chart);
  if (sfaiChartJsPromise) return sfaiChartJsPromise;

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js";
  script.async = true;
  script.crossOrigin = "anonymous";

  sfaiChartJsPromise = new Promise((resolve, reject) => {
    script.onload = () => resolve(window.Chart);
    script.onerror = () => {
      sfaiChartJsPromise = null;
      reject(new Error("Não foi possível carregar o Chart.js."));
    };
  });

  document.head.appendChild(script);
  return sfaiChartJsPromise;
}

function validarConfigGrafico(config) {
  const tipos = ["line", "bar", "pie", "doughnut", "scatter"];
  if (!config || !tipos.includes(config.type)) return false;
  if (!Array.isArray(config.datasets) || config.datasets.length < 1 || config.datasets.length > 6) return false;

  if (config.type === "scatter") {
    return config.datasets.every((dataset) =>
      Array.isArray(dataset.data) &&
      dataset.data.length > 0 &&
      dataset.data.length <= 40 &&
      dataset.data.every((ponto) =>
        ponto && Number.isFinite(Number(ponto.x)) && Number.isFinite(Number(ponto.y))
      )
    );
  }

  if (!Array.isArray(config.labels) || config.labels.length < 1 || config.labels.length > 40) return false;

  // Pizza e rosca usam uma única série; label do dataset é opcional.
  if (config.type === "pie" || config.type === "doughnut") {
    if (config.datasets.length !== 1) return false;
    const dataset = config.datasets[0];
    return Array.isArray(dataset.data) &&
      dataset.data.length === config.labels.length &&
      dataset.data.every((valor) => Number.isFinite(Number(valor)) && Number(valor) >= 0) &&
      dataset.data.some((valor) => Number(valor) > 0);
  }

  return config.datasets.every((dataset) =>
    typeof dataset.label === "string" &&
    Array.isArray(dataset.data) &&
    dataset.data.length === config.labels.length &&
    dataset.data.every((valor) => Number.isFinite(Number(valor)))
  );
}

function montarHtmlGrafico(config) {
  const dados = escaparHtml(JSON.stringify(config));
  const titulo = escaparHtml(config.title || "Gráfico");
  return '<section class="sfai-chart-card">' +
    '<div class="sfai-chart-title">' + titulo + '</div>' +
    '<div class="sfai-chart-canvas-wrap"><canvas class="sfai-chart-canvas" role="img" aria-label="' + titulo + '"></canvas></div>' +
    '<div class="sfai-chart-data" hidden>' + dados + '</div>' +
    '</section>';
}

async function renderizarGraficos(elemento) {
  if (!elemento?.querySelector?.(".sfai-chart-canvas")) return;

  try {
    const ChartConstructor = await carregarChartJs();
    const cards = elemento.querySelectorAll(".sfai-chart-card");
    cards.forEach((card) => {
      const canvas = card.querySelector(".sfai-chart-canvas");
      const dadosEl = card.querySelector(".sfai-chart-data");
      if (!canvas || !dadosEl || sfaiChartsAtivos.has(canvas)) return;

      const config = JSON.parse(dadosEl.textContent);
      if (!validarConfigGrafico(config)) {
        card.insertAdjacentText("beforeend", "Os dados deste gráfico não passaram pela validação.");
        return;
      }

      const tipo = config.type;
      const opcoes = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 350 },
        plugins: {
          legend: { display: true, position: "bottom" },
          title: { display: false },
        },
      };

      if (tipo === "line" || tipo === "bar") {
        opcoes.scales = {
          x: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(128,128,128,.14)" } },
          y: { beginAtZero: tipo === "bar", ticks: { color: "#9ca3af" }, grid: { color: "rgba(128,128,128,.14)" } },
        };
      }

      const chart = new ChartConstructor(canvas, {
        type: tipo,
        data: {
          labels: config.labels,
          datasets: config.datasets.map((dataset) => {
            const datasetConfig = {
              label: dataset.label || (tipo === "pie" || tipo === "doughnut" ? "Proporções" : "Dados"),
              data: dataset.data,
              tension: 0.25,
              fill: false,
              borderWidth: 2,
            };

            if (tipo === "pie" || tipo === "doughnut") {
              const paleta = [
                "#38bdf8", "#2dd4bf", "#818cf8", "#fbbf24",
                "#fb7185", "#a3e635", "#c084fc", "#fb923c",
                "#22d3ee", "#f472b6"
              ];
              datasetConfig.backgroundColor = dataset.data.map((_, indice) => paleta[indice % paleta.length]);
              datasetConfig.borderColor = "rgba(15, 23, 42, 0.75)";
              datasetConfig.borderWidth = 2;
            }

            return datasetConfig;
          }),
        },
        options: opcoes,
      });
      sfaiChartsAtivos.set(canvas, chart);
    });
  } catch (erro) {
    console.error("Erro ao renderizar gráfico:", erro);
    elemento.querySelectorAll(".sfai-chart-card").forEach((card) => {
      if (!card.querySelector(".sfai-chart-error")) {
        const aviso = document.createElement("p");
        aviso.className = "sfai-chart-error";
        aviso.textContent = "Não foi possível carregar o gráfico. Verifique sua conexão e recarregue a conversa.";
        card.appendChild(aviso);
      }
    });
  }
}

// ============================================================
// Renderização de fórmulas matemáticas (MathJax 3)
// A biblioteca é carregada sob demanda, apenas quando há fórmulas.
// ============================================================
let sfaiMathJaxPromise = null;

function carregarMathJax() {
  if (window.MathJax?.typesetPromise) {
    return Promise.resolve(window.MathJax);
  }

  if (sfaiMathJaxPromise) return sfaiMathJaxPromise;

  // A configuração deve existir antes de o script MathJax carregar.
  window.MathJax = {
    tex: {
      inlineMath: [["\\(", "\\)"]],
      displayMath: [["\\[", "\\]"], ["$", "$"]],
      processEscapes: true,
      packages: { "[+]": ["ams"] },
    },
    options: {
      skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
    },
    startup: {
      typeset: false,
    },
  };

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
  script.async = true;
  script.crossOrigin = "anonymous";

  sfaiMathJaxPromise = new Promise((resolve, reject) => {
    script.onload = () => resolve(window.MathJax);
    script.onerror = () => {
      sfaiMathJaxPromise = null;
      reject(new Error("Não foi possível carregar o MathJax."));
    };
  });

  document.head.appendChild(script);
  return sfaiMathJaxPromise;
}

async function renderizarMatematica(elemento) {
  if (!elemento) return;

  if (elemento.querySelector?.(".ans-math-block, .ans-math-inline")) {
    try {
      const mathJax = await carregarMathJax();
      if (mathJax?.typesetPromise) {
        await mathJax.typesetPromise([elemento]);
      }
    } catch (erro) {
      console.error("Erro ao renderizar fórmulas matemáticas:", erro);
    }
  }

  await renderizarGraficos(elemento);
}

// Extrai fórmulas antes do Markdown para não separar delimitadores,
// conteúdo e fechamento em diferentes elementos HTML.
function protegerEquacoesMatematicas(texto) {
  const equacoes = [];
  const padrao =
    /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$/g;

  const textoProtegido = String(texto ?? "").replace(
    padrao,
    (completo, display, inline, displayDolar) => {
      const tipo =
        display !== undefined || displayDolar !== undefined
          ? "display"
          : "inline";
      const conteudo = display ?? inline ?? displayDolar ?? "";
      const token = "SFAI_MATH_TOKEN_" + equacoes.length + "_END";

      equacoes.push({
        token,
        tipo,
        conteudo: String(conteudo).trim(),
      });

      return "\n\n" + token + "\n\n";
    },
  );

  return { texto: textoProtegido, equacoes };
}

function montarHtmlEquacao(equacao) {
  const conteudo = escaparHtml(equacao.conteudo);

  if (equacao.tipo === "display") {
    return '<div class="ans-math-block">\\[' + conteudo + '\\]</div>';
  }

  return '<span class="ans-math-inline">\\(' + conteudo + '\\)</span>';
}

function normalizarNome(texto) {
  return String(texto || "")
    .replace(/^\s*fonte\s*:\s*/i, "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[“”‘’]/g, '"')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function montarUrlDocumento(arquivo, pagina) {
  const url = `${API_BASE_URL}/documentos/${encodeURIComponent(arquivo)}`;
  return pagina ? `${url}#page=${encodeURIComponent(pagina)}` : url;
}

function montarUrlFonte(fonte, pagina) {
  if (!fonte) return "";

  // Caminho preferencial: ID opaco gerado pelo backend a partir do PDF real.
  // A URL deixa de depender de espaços, acentos, hífens Unicode ou do título.
  const base = fonte.id
    ? `${API_BASE_URL}/documento/${encodeURIComponent(fonte.id)}`
    : montarUrlDocumento(fonte.arquivo, null); // Compatibilidade com históricos antigos.

  const paginaFinal = pagina || fonte.pagina;
  return paginaFinal
    ? `${base}#page=${encodeURIComponent(paginaFinal)}`
    : base;
}

function instalarEstilosFontesRag() {
  if (document.getElementById("sfai-rag-fontes-style")) return;

  const style = document.createElement("style");
  style.id = "sfai-rag-fontes-style";
  style.textContent = "    .rag-fontes { margin-top: 12px; font-size: .9em; }\n    .rag-fontes-dropdown { position: relative; display: inline-block; max-width: 100%; }\n    .rag-fontes-trigger {\n      display: inline-flex; align-items: center; gap: 10px; max-width: 100%;\n      padding: 5px 11px 5px 7px; border: 1px solid var(--border-color, rgba(128,128,128,.25));\n      border-radius: 999px; background: var(--surface-soft, rgba(128,128,128,.06));\n      color: var(--text, inherit); cursor: pointer; user-select: none; list-style: none;\n      transition: border-color .18s ease, background .18s ease;\n    }\n    .rag-fontes-trigger::-webkit-details-marker { display: none; }\n    .rag-fontes-trigger:hover { border-color: var(--accent, #38bdf8); }\n    .rag-fontes-icones { display: inline-flex; align-items: center; padding-left: 5px; flex-shrink: 0; }\n    .rag-fonte-icone {\n      position: relative; display: inline-flex; align-items: center; justify-content: center;\n      width: 27px; height: 27px; margin-left: -6px; overflow: hidden; flex-shrink: 0;\n      border: 2px solid var(--surface, #0f172a); border-radius: 50%;\n      background: var(--surface-hover, #334155); color: var(--text, #fff);\n      font-size: 8px; font-weight: 800; letter-spacing: -.3px;\n    }\n    .rag-fonte-icone:first-child { margin-left: 0; }\n    .rag-fonte-icone::after { content: attr(data-inicial); position: relative; z-index: 0; }\n    .rag-fonte-icone img { position: absolute; z-index: 1; inset: 0; width: 100%; height: 100%; object-fit: cover; background: var(--surface); }\n    .rag-fontes-mais {\n      display: inline-flex; align-items: center; justify-content: center; width: 27px; height: 27px;\n      margin-left: -6px; border: 2px solid var(--surface, #0f172a); border-radius: 50%;\n      background: var(--surface-hover, #334155); color: var(--text, inherit);\n      font-size: .68em; font-weight: 700; flex-shrink: 0;\n    }\n    .rag-fontes-legenda { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n    .rag-fontes-painel {\n      display: block; position: absolute; z-index: 80; left: 0; bottom: calc(100% - 2px);\n      width: min(420px, calc(100vw - 40px)); max-height: min(340px, 48vh); overflow-y: auto;\n      padding: 12px; box-sizing: border-box; border: 1px solid var(--border-color, rgba(128,128,128,.25));\n      border-radius: 13px; background: var(--surface, #111827); color: var(--text, inherit);\n      box-shadow: 0 14px 36px rgba(0,0,0,.28); opacity: 0; visibility: hidden;\n      pointer-events: none; transform: translateY(5px);\n      transition: opacity .16s ease, transform .16s ease, visibility .16s ease;\n    }\n    .rag-fontes-dropdown[open] { z-index: 99999; }\n    .rag-fontes-dropdown[open] > .rag-fontes-painel {\n      opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0);\n    }\n    .rag-fontes-painel { z-index: 99999; }\n    .rag-fontes-painel-titulo { margin: 0 0 10px; font-size: .95em; font-weight: 750; }\n    .rag-fontes-grupo + .rag-fontes-grupo { margin-top: 12px; }\n    .rag-fontes-titulo { margin: 0 0 6px; font-size: .78em; font-weight: 700; color: var(--text-secondary, #9ca3af); text-transform: uppercase; letter-spacing: .06em; }\n    .rag-fontes-lista { display: flex; flex-direction: column; gap: 3px; margin: 0; padding: 0; list-style: none; }\n    .rag-fontes-item a {\n      display: flex; align-items: center; gap: 9px; padding: 8px 7px; border-radius: 8px;\n      color: var(--text, inherit); text-decoration: none; min-width: 0;\n      transition: background .15s ease;\n    }\n    .rag-fontes-item a:hover, .rag-fontes-item a:focus-visible { background: var(--surface-hover, rgba(128,128,128,.12)); outline: none; }\n    .rag-fontes-item .rag-fonte-icone { width: 25px; height: 25px; margin: 0; border: 1px solid var(--border-color, rgba(128,128,128,.2)); }\n    .rag-fonte-info { display: flex; flex: 1; flex-direction: column; min-width: 0; gap: 2px; }\n    .rag-fonte-nome { font-size: .9em; line-height: 1.35; overflow-wrap: anywhere; }\n    .rag-fonte-detalhe { color: var(--text-secondary, #9ca3af); font-size: .78em; overflow-wrap: anywhere; }\n    .rag-fonte-abrir { flex-shrink: 0; color: var(--text-secondary, #9ca3af); font-size: 1.05em; }\n    .rag-citacao-link { color: var(--link-color, #4b91df); text-decoration: underline; text-underline-offset: 2px; overflow-wrap: anywhere; }\n    .ans-heading { font-weight: 700; line-height: 1.4; margin: 10px 0 4px; }\n    .ans-heading-1 { font-size: 1.15em; }\n    .ans-heading-2 { font-size: 1.08em; }\n    .ans-heading-3 { font-size: 1em; }\n    .ans-math-block { max-width: 100%; overflow-x: auto; overflow-y: hidden; margin: 10px 0; padding: 4px 0; text-align: left; }\n    .ans-math-inline { display: inline-block; max-width: 100%; vertical-align: middle; }\n    mjx-container { max-width: 100%; }\n    mjx-container[display=\"true\"] { margin: .8em 0 !important; }\n    .sfai-chart-card { width: min(100%, 760px); margin: 14px 0 20px; padding: 14px; border: 1px solid var(--border-color, rgba(128,128,128,.25)); border-radius: 14px; background: var(--surface-soft, rgba(128,128,128,.06)); box-sizing: border-box; }\n    .sfai-chart-title { margin-bottom: 10px; font-weight: 700; overflow-wrap: anywhere; }\n    .sfai-chart-canvas-wrap { position: relative; width: 100%; height: 300px; }\n    .sfai-chart-error { color: var(--text-secondary, #9ca3af); font-size: .9em; }\n    @media (max-width: 600px) {\n      .rag-fontes { font-size: .88em; }\n      .rag-fontes-painel { width: min(380px, calc(100vw - 28px)); max-height: 45vh; }\n      .ans-heading { margin: 8px 0 4px; }\n      .ans-heading-1 { font-size: 1.1em; }\n      .ans-heading-2 { font-size: 1.05em; }\n    }";
  document.head.appendChild(style);

  // Hover no ícone abre o painel; ele permanece aberto até um clique externo.
  document.addEventListener("pointerover", (event) => {
    const trigger = event.target.closest?.(".rag-fontes-trigger");
    if (!trigger) return;
    const dropdown = trigger.closest(".rag-fontes-dropdown");
    if (dropdown) dropdown.open = true;
  });

  // Fecha ao sair dos ícones, exceto quando o cursor está entrando no painel.
  // A ponte invisível do painel cobre o espaço entre o gatilho e a janela.
  document.addEventListener("pointerout", (event) => {
    const trigger = event.target.closest?.(".rag-fontes-trigger");
    if (!trigger) return;

    const related = event.relatedTarget;
    if (related?.closest?.(".rag-fontes-trigger") ||
        related?.closest?.(".rag-fontes-painel")) return;

    const dropdown = trigger.closest(".rag-fontes-dropdown");
    if (dropdown) dropdown.open = false;
  });

  // O clique no próprio ícone não fecha o painel recém-aberto pelo hover.
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.(".rag-fontes-trigger");
    if (trigger) {
      event.preventDefault();
      const dropdown = trigger.closest(".rag-fontes-dropdown");
      if (dropdown) dropdown.open = true;
      return;
    }

    if (event.target.closest?.(".rag-fontes-dropdown")) return;
    document.querySelectorAll(".rag-fontes-dropdown[open]").forEach((dropdown) => {
      dropdown.open = false;
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".rag-fontes-dropdown[open]").forEach((dropdown) => {
      dropdown.open = false;
    });
  });
}

function converterCitacoesEmLinks(texto, fontes) {
  if (!texto || !Array.isArray(fontes) || fontes.length === 0) return texto;

  // Remove qualquer link Markdown que envolva uma citação numerada: o link
  // será reconstruído com o ID oficial do backend, nunca com a URL da IA.
  texto = texto.replace(
    /\[([^\]]*\bFonte\s*\d+\b[^\]]*)\]\((?:https?:\/\/|\/)[^)]+\)/gi,
    "$1"
  );

  // Remove também links para a rota local de documentos, mesmo quando o
  // rótulo não contém o nome do PDF. O painel de fontes colocará o link certo.
  texto = texto.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi,
    (match, rotulo, destino) => /\/documentos?\//i.test(destino) ? rotulo : match
  );

  // Citação numérica: Fonte 1 aponta sempre para fontes[0], Fonte 2 para fontes[1].
  texto = texto.replace(/\bFonte\s*(\d+)\b/gi, (match, numero, offset, original) => {
    const fonte = fontes[Number(numero) - 1];
    if (!fonte) return match;

    const antes = original.slice(0, offset);
    if (antes.lastIndexOf("<a") > antes.lastIndexOf("</a>")) return match;

    // A página vem sempre dos metadados do backend, nunca do número
    // escrito pela IA (que pode estar errado).
    const url = montarUrlFonte(fonte);

    return `<a class="rag-citacao-link" href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
  });

  // Formato legado: (Fonte: nome-exato.pdf, p. 3). A comparação é exata
  // após normalização; nomes parciais não são aceitos.
  texto = texto.replace(
    /\bFonte\s*:\s*["“]?([^,;()\n"”]+\.pdf)["”]?/gi,
    (match, nome) => {
      const nomeLimpo = nome.trim();
      const chave = normalizarNome(nomeLimpo);
      const fonte = fontes.find((item) => normalizarNome(item.arquivo || "") === chave);
      if (!fonte) return match;

      const url = montarUrlFonte(fonte);
      return `<a class="rag-citacao-link" href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    }
  );

  return texto;
}

function separarFontes(fontes) {
  if (!Array.isArray(fontes)) return { rag: [], web: [] };
  return {
    // Entradas antigas sem "tipo" são PDFs e continuam compatíveis.
    rag: fontes.filter((fonte) => fonte && fonte.arquivo && fonte.tipo !== "web"),
    web: fontes.filter((fonte) => fonte && fonte.tipo === "web" && fonte.url),
  };
}

function formatarListaFontes(fontes) {
  if (!Array.isArray(fontes) || fontes.length === 0) return "";

  instalarEstilosFontesRag();
  const grupos = separarFontes(fontes);

  const documentos = grupos.rag.map((fonte, indice) => {
    const url = montarUrlFonte(fonte);
    if (!url) return null;
    return {
      tipo: "pdf",
      url,
      nome: "Documento " + (indice + 1) + " — " + String(fonte.arquivo || "Documento PDF"),
      detalhe: fonte.pagina ? "Página " + String(fonte.pagina) : "Documento PDF",
      inicial: "PDF",
      favicon: ""
    };
  }).filter(Boolean);

  const sites = grupos.web.map((fonte) => {
    let destino = "";
    let host = "";
    try {
      const url = new URL(String(fonte.url));
      if (url.protocol === "https:" || url.protocol === "http:") {
        destino = url.href;
        host = url.hostname.replace(/^www\./i, "");
      }
    } catch (_) {
      destino = "";
    }
    if (!destino) return null;

    return {
      tipo: "web",
      url: destino,
      nome: String(fonte.titulo || host),
      detalhe: host,
      inicial: host.slice(0, 2).toUpperCase() || "WEB",
      favicon: "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(host) + "&sz=64"
    };
  }).filter(Boolean);

  const todas = documentos.concat(sites);
  if (todas.length === 0) return "";

  const montarIcone = (fonte) => {
    const imagem = fonte.favicon
      ? '<img src="' + escaparHtml(fonte.favicon) + '" alt="" loading="lazy">'
      : "";
    return '<span class="rag-fonte-icone" data-inicial="' +
      escaparHtml(fonte.inicial) + '" aria-hidden="true">' + imagem + '</span>';
  };

  const icones = todas.slice(0, 3).map(montarIcone).join("");
  const extras = todas.length > 3
    ? '<span class="rag-fontes-mais" aria-hidden="true">+' + (todas.length - 3) + '</span>'
    : "";
  const montarGrupo = (titulo, itens) => {
    if (itens.length === 0) return "";
    const linhas = itens.map((fonte) => {
      const meta = fonte.detalhe
        ? '<span class="rag-fonte-detalhe">' + escaparHtml(fonte.detalhe) + '</span>'
        : "";
      return '<li class="rag-fontes-item"><a href="' + escaparHtml(fonte.url) +
        '" target="_blank" rel="noopener noreferrer">' +
        montarIcone(fonte) +
        '<span class="rag-fonte-info"><span class="rag-fonte-nome">' +
        escaparHtml(fonte.nome) + '</span>' + meta +
        '</span><span class="rag-fonte-abrir" aria-hidden="true">↗</span></a></li>';
    }).join("");

    return '<section class="rag-fontes-grupo"><h4 class="rag-fontes-titulo">' +
      titulo + '</h4><ul class="rag-fontes-lista">' + linhas + '</ul></section>';
  };

  const painel = montarGrupo("Documentos consultados", documentos) +
    montarGrupo("Sites consultados", sites);

  return '<section class="rag-fontes">' +
    '<details class="rag-fontes-dropdown">' +
    '<summary class="rag-fontes-trigger" aria-label="Abrir fontes consultadas" title="Fontes consultadas">' +
    '<span class="rag-fontes-icones" aria-hidden="true">' + icones + extras + '</span>' +
    '</summary>' +
    '<div class="rag-fontes-painel">' +
    '<div class="rag-fontes-painel-titulo">Fontes desta resposta</div>' +
    painel +
    '</div></details></section>';
}

function formatarRespostaIA(texto, fontes) {
  if (!texto) return "";

  instalarEstilosFontesRag();

  // Retira blocos de gráfico antes do Markdown e das expressões matemáticas.
  const graficosProtegidos = extrairBlocosGraficos(String(texto));
  const graficosPorToken = new Map(
    graficosProtegidos.graficos.map((grafico) => [grafico.token, grafico.config]),
  );

  const protegido = protegerEquacoesMatematicas(graficosProtegidos.texto);
  const equacoesPorToken = new Map(
    protegido.equacoes.map((equacao) => [equacao.token, equacao]),
  );

  texto = protegido.texto
    .replace(/\*\*(.*?)\*\*/gs, "<strong>$1</strong>")
    .replace(/(?<![\w.])_([^_\n]+?)_(?![\w.])/g, "<em>$1</em>")
    .replace(/\*(.*?)\*/gs, "<em>$1</em>");

  texto = converterCitacoesEmLinks(texto, separarFontes(fontes).rag);
  texto = texto.replace(/^[\s*•-]+\s+/gm, "");

  const corpo = texto
    .split(/\n\n+/)
    .map((bloco) => {
      const linhas = bloco
        .split(/\n/)
        .map((linha) => linha.trim())
        .filter((linha) => linha !== "");

      if (linhas.length === 0) return '<div class="ans-spacer"></div>';

      const conteudo = linhas
        .map((linha) => {
          // Uma equação em bloco ocupa seu próprio elemento.
          const equacaoSozinha = equacoesPorToken.get(linha);
          if (equacaoSozinha) {
            return montarHtmlEquacao(equacaoSozinha);
          }

          const grafico = graficosPorToken.get(linha);
          if (grafico) {
            if (!validarConfigGrafico(grafico)) {
              return '<div class="ans-line">Não foi possível montar o gráfico: os dados recebidos são inválidos.</div>';
            }
            return montarHtmlGrafico(grafico);
          }

          const titulo = linha.match(/^(#{1,6})\s+(.+)$/);
          if (titulo) {
            const nivel = Math.min(titulo[1].length, 3);
            return '<div class="ans-heading ans-heading-' + nivel + '">' +
              titulo[2] + '</div>';
          }

          // Fórmulas inline permanecem dentro da linha do parágrafo.
          const linhaComEquacoes = linha.replace(
            /SFAI_MATH_TOKEN_(\d+)_END/g,
            (token) => {
              const equacao = equacoesPorToken.get(token);
              return equacao ? montarHtmlEquacao(equacao) : token;
            },
          );

          return '<div class="ans-line">' + linhaComEquacoes + '</div>';
        })
        .join("");

      return '<div class="ans-block">' + conteudo + '</div>';
    })
    .join("");

  return corpo + formatarListaFontes(fontes);
}

async function digitarTexto(elemento, html, velocidade = 5) {
  // Configuração "Mostrar animação de digitação" desligada: exibe tudo de uma vez.
  if (!preferenciaAtiva("typingAnimation")) {
    elemento.innerHTML = html;
    await renderizarMatematica(elemento);
    return;
  }

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
  await renderizarMatematica(elemento);
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
    const res = await fetch(`${API_BASE_URL}/conversas/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      encerrarSessaoInvalida();
      return;
    }
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
    const res = await fetch(
      `${API_BASE_URL}/conversas/${conversaId}/mensagens`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.status === 401) {
      encerrarSessaoInvalida();
      return;
    }
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
        void renderizarMatematica(messageElement);
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

  if (chatAra) {
    chatAra.classList.remove("fade-out1");
    chatAra.style.display = "block";
  }

  if (chatContainer) {
    chatContainer.classList.remove("expanded");
  }

  // Restaura o rodapé em telas menores.
  const footer = document.querySelector("footer");
  if (footer) footer.style.display = "";

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
  return window.SFAIAccount?.getStoragePrefix(getUserData()) ?? "";
}

function limparChatSalvo() {
  chatMessages = [];
  historicoConversa = [];
  conversaAtualId = null;

  const prefix = getUserStoragePrefix();
  localStorage.removeItem(prefix + "chatMessages");
  localStorage.removeItem(prefix + "historicoConversa");
}

function salvarConversaAtual() {
  // Configuração "Salvar histórico automaticamente" desligada.
  if (!preferenciaAtiva("autoSaveHistory")) return;

  const prefix = getUserStoragePrefix();
  localStorage.setItem(prefix + "chatMessages", JSON.stringify(chatMessages));
  localStorage.setItem(prefix + "historicoConversa", JSON.stringify(historicoConversa));
}

function carregarConversaAtual() {
  if (!preferenciaAtiva("autoSaveHistory")) return;

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
          if (item.role === "assistant") {
            void renderizarMatematica(messageElement);
          }
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
  if (event.key !== "Enter") return;
  // Shift + Enter sempre quebra linha.
  if (event.shiftKey) return;
  // Configuração "Enviar com Enter" desligada: Enter quebra linha.
  if (!preferenciaAtiva("enterSend")) return;

  event.preventDefault();
  enviarMensagem();
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
    input.placeholder = PLACEHOLDER_PADRAO;
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
      headers: cabecalhosAutenticados(),
      body: JSON.stringify({
        usuario_id: usuarioId,
        conversa_id: conversaAtualId,
        resumo: userMessage,
        feira: feiraMapeada,
        modo: modo,
        mensagem: userMessage,
      }),
    });

    if (response.status === 401) {
      aiElement.classList.add("chat-error");
      aiElement.innerHTML = `<span class="chat-error-msg">Sua sessão expirou. Redirecionando para o login...</span>`;
      setTimeout(encerrarSessaoInvalida, 1500);
      return;
    }

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

      const fontesResposta = Array.isArray(data.fontes)
        ? data.fontes
        : (data.fontes_rag || []);

      chatMessages.push({
        role: "assistant",
        content: textoIA,
        fontes: fontesResposta,
      });
      salvarConversaAtual();

      if (historicoConversa.length > 10) {
        historicoConversa = historicoConversa.slice(-10);
      }

      const textoFormatado = formatarRespostaIA(textoIA, fontesResposta);

      chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: "smooth" });
      await digitarTexto(aiElement, textoFormatado, 6);

      if (cronogramaInfo) {
        const cronogramaEl = document.createElement("div");
        cronogramaEl.classList.add("message", "bot");
        cronogramaEl.innerHTML = formatarRespostaIA(cronogramaInfo);
        chatArea.appendChild(cronogramaEl);
        void renderizarMatematica(cronogramaEl);
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

  sincronizarViewportVisual();
};
