// ============================================================
// SFAI — Dados da conta autenticada
// Fonte única dos dados do usuário (localStorage "usuario"/"token",
// gravados no login em Login/script.js e lidos pelo chat).
// Usado por: Perfil, Configurações e Chatbot.
// ============================================================
(function () {
  const USER_KEY = "usuario";
  const TOKEN_KEY = "token";

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  const get = () => {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser);
    } catch (error) {
      console.error("Falha ao ler usuário do localStorage:", error);
      return null;
    }
  };

  const save = (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const clear = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const isAuthenticated = () => Boolean(getToken());

  const requireAuth = (fallbackUrl = "Login/login.html") => {
    if (isAuthenticated()) return true;

    window.location.replace(fallbackUrl);
    return false;
  };

  const getLoginMethod = (user = get()) => {
    const dados = user || {};
    return dados.loginMethod || (dados.foto ? "Google" : "Conta SFAI");
  };

  const isGoogleAccount = (user = get()) => getLoginMethod(user) === "Google";

  const getInitials = (name, fallback = "U") => {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) return fallback;
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  // Prefixo das chaves do histórico de chat no navegador.
  const getStoragePrefix = (user = get()) =>
    user?.id ? `user_${user.id}_` : "";

  window.SFAIAccount = {
    getToken,
    get,
    save,
    clear,
    isAuthenticated,
    requireAuth,
    getLoginMethod,
    isGoogleAccount,
    getInitials,
    getStoragePrefix,
  };
})();
