// ============================================================
// SFAI — Utilitários de interface compartilhados
// Navegação "voltar" (usa o histórico real do navegador) e avisos.
// Usado por: Perfil (Profile/profile.js) e
// Configurações (Settings/settings.js).
// ============================================================
(function () {
  const back = (fallbackUrl = "index.html") => {
    const referencia = document.referrer;
    const veioDeAqui =
      referencia &&
      window.history.length > 1 &&
      (() => {
        try {
          return new URL(referencia).origin === window.location.origin;
        } catch {
          return false;
        }
      })();

    if (veioDeAqui) {
      window.history.back();
      return;
    }

    // Página aberta diretamente (sem página anterior): vai para o chat.
    window.location.replace(fallbackUrl);
  };

  const toast = (message, type = "info") => {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const variacoes = {
      info: "",
      success: "toast-success",
      danger: "toast-danger",
      warning: "toast-warning",
    };

    const elemento = document.createElement("div");
    elemento.className = `toast ${variacoes[type] || ""}`.trim();
    elemento.setAttribute("role", "status");
    elemento.textContent = message;

    container.appendChild(elemento);

    setTimeout(() => {
      elemento.classList.add("toast-leaving");
      setTimeout(() => elemento.remove(), 320);
    }, 2600);
  };

  window.SFAIUI = { back, toast };
})();
