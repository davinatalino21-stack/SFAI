document.addEventListener("DOMContentLoaded", () => {
  const buttonDiv = document.getElementById("buttonDiv");
  const loginForm = document.getElementById("loginForm");
  const cadastroForm = document.getElementById("cadastroForm");
  const switchLinks = document.querySelectorAll(".switch-link");
  const panels = document.querySelectorAll(".auth-panel");
  const API_BASE_URL = "https://davidumbproxmax-classificador-mostratec.hf.space";

  if (localStorage.getItem("token")) {
    window.location.href = "../index.html";
  }

  const corpoDoLogin = document.querySelector(".corpo-do-login");
  const authForms = document.querySelector(".auth-forms");

  const updateHeight = () => {
    const activePanel = document.querySelector(".auth-panel.is-active");
    if (activePanel && authForms) {
      activePanel.style.inset = "auto";
      activePanel.style.position = "relative";
      authForms.style.minHeight = activePanel.scrollHeight + "px";
      activePanel.style.inset = "";
      activePanel.style.position = "";
    }
  };

  const showPanel = (panelName) => {
    panels.forEach((panel) => {
      const isActive = panel.dataset.panel === panelName;
      panel.classList.toggle("is-active", isActive);
    });
    document.querySelectorAll(".auth-tab").forEach((tab) => {
      const isActive = tab.dataset.target === panelName;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
    corpoDoLogin?.classList.toggle("view-login", panelName === "login");
    corpoDoLogin?.classList.toggle("view-cadastro", panelName === "cadastro");
    requestAnimationFrame(updateHeight);
  };

  showPanel("login");

  window.addEventListener("resize", updateHeight);

  if (buttonDiv) {
    new MutationObserver(updateHeight).observe(buttonDiv, {
      childList: true,
      subtree: true,
    });
  }

  switchLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showPanel(link.dataset.target);
      clearAllErrors();
    });
  });

  document.querySelectorAll(".toggle-senha").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const wrapper = button.closest(".senha-wrapper");
      const input = wrapper?.querySelector("input");

      if (!input) {
        return;
      }

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      const eyeOpen = button.querySelector(".icon-eye-open");
      const eyeClosed = button.querySelector(".icon-eye-closed");

      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPassword ? "none" : "block";
        eyeClosed.style.display = isPassword ? "block" : "none";
      }

      button.setAttribute(
        "aria-label",
        isPassword ? "Esconder senha" : "Mostrar senha",
      );
      button.setAttribute(
        "title",
        isPassword ? "Esconder senha" : "Mostrar senha",
      );
    });
  });

  const clearAllErrors = () => {
    document.querySelectorAll(".field-error").forEach((error) => {
      error.textContent = "";
    });
    document.querySelectorAll("input").forEach((input) => {
      input.classList.remove("input-error");
    });
  };

  const showToast = (message, type = "info") => {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    toast.setAttribute("role", "status");
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  document.getElementById("forgotPassword")?.addEventListener("click", (event) => {
    event.preventDefault();
    showToast(
      "Recuperação de senha em breve. Fale com o professor responsável pelo suporte.",
      "info",
    );
  });

  const setFieldError = (input, message) => {
    const errorElement = document.querySelector(
      `[data-error-for="${input.id}"]`,
    );
    if (errorElement) {
      errorElement.textContent = message;
    }
    input.classList.add("input-error");
  };

  const setSubmitState = (form, isLoading, label) => {
    const button = form.querySelector("button[type='submit']");
    if (!button) {
      return;
    }

    button.disabled = isLoading;
    button.textContent = isLoading ? "Enviando..." : label;
  };

  const submitGoogleAuth = async (credential) => {
    if (!credential) {
      const errorElement = document.querySelector(
        `[data-error-for="loginEmail"]`,
      );
      if (errorElement) {
        errorElement.textContent = "Não foi possível obter o token do Google.";
      }
      return;
    }

    clearAllErrors();
    setSubmitState(loginForm, true, "Entrando com Google...");

    try {
      const response = await fetch(`${API_BASE_URL}/login/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.sucesso) {
        throw new Error(
          data?.mensagem ||
            data?.detail ||
            "Não foi possível concluir o login com o Google.",
        );
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      window.location.href = "../index.html";
    } catch (error) {
      const errorElement = document.querySelector(
        `[data-error-for="loginEmail"]`,
      );
      if (errorElement) {
        errorElement.textContent = error.message;
      }
    } finally {
      setSubmitState(loginForm, false, "Entrar");
    }
  };

  const validateLogin = () => {
    const email = document.getElementById("loginEmail");
    const senha = document.getElementById("loginSenha");
    clearAllErrors();

    let valid = true;

    if (!email?.value.trim()) {
      setFieldError(email, "Informe seu e-mail.");
      valid = false;
    }

    if (!senha?.value.trim()) {
      setFieldError(senha, "Informe sua senha.");
      valid = false;
    }

    return valid;
  };

  const validateCadastro = () => {
    const nome = document.getElementById("cadastroNome");
    const email = document.getElementById("cadastroEmail");
    const senha = document.getElementById("cadastroSenha");
    const confirmarSenha = document.getElementById("confirmarSenha");
    clearAllErrors();

    let valid = true;

    if (!nome?.value.trim()) {
      setFieldError(nome, "Informe seu nome.");
      valid = false;
    }

    if (!email?.value.trim()) {
      setFieldError(email, "Informe seu e-mail.");
      valid = false;
    }

    if (!senha?.value.trim()) {
      setFieldError(senha, "Crie uma senha.");
      valid = false;
    }

    if (!confirmarSenha?.value.trim()) {
      setFieldError(confirmarSenha, "Confirme sua senha.");
      valid = false;
    }

    if (
      senha?.value &&
      confirmarSenha?.value &&
      senha.value !== confirmarSenha.value
    ) {
      setFieldError(confirmarSenha, "As senhas não conferem.");
      valid = false;
    }

    return valid;
  };

  const submitAuth = async (form, endpoint, payload, successText) => {
    if (form.id === "loginForm" && !validateLogin()) {
      return;
    }

    if (form.id === "cadastroForm" && !validateCadastro()) {
      return;
    }

    setSubmitState(form, true, successText);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.sucesso) {
        throw new Error(
          data?.mensagem ||
            data?.detail ||
            "Não foi possível concluir a operação.",
        );
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      window.location.href = "../index.html";
    } catch (error) {
      const errorElement = document.querySelector(
        `[data-error-for="${form.querySelector("input").id}"]`,
      );
      if (errorElement) {
        errorElement.textContent = error.message;
      }
    } finally {
      setSubmitState(form, false, successText);
    }
  };

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitAuth(
      loginForm,
      "/login",
      {
        email: document.getElementById("loginEmail")?.value.trim(),
        senha: document.getElementById("loginSenha")?.value,
      },
      "Entrar",
    );
  });

  cadastroForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitAuth(
      cadastroForm,
      "/cadastro",
      {
        nome: document.getElementById("cadastroNome")?.value.trim(),
        email: document.getElementById("cadastroEmail")?.value.trim(),
        senha: document.getElementById("cadastroSenha")?.value,
      },
      "Criar conta",
    );
  });

  if (!buttonDiv) {
    console.error("Elemento #buttonDiv não encontrado.");
    return;
  }

  const initializeGoogleButton = () => {
    if (!window.google?.accounts?.id) {
      setTimeout(initializeGoogleButton, 200);
      return;
    }

    google.accounts.id.initialize({
      client_id:
        "400497708970-q577v5le8mhfth6j5n8oq5sprncgtef2.apps.googleusercontent.com",
      callback: (response) => {
        if (response?.credential) {
          submitGoogleAuth(response.credential);
        } else {
          console.error("Resposta do Google sem credential:", response);
          const errorElement = document.querySelector(
            `[data-error-for="loginEmail"]`,
          );
          if (errorElement) {
            errorElement.textContent =
              "Falha ao receber as credenciais do Google.";
          }
        }
      },
    });

    google.accounts.id.renderButton(buttonDiv, {
      theme: "filled_blue",
      size: "large",
      type: "standard",
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left",
    });
  };

  initializeGoogleButton();
});
