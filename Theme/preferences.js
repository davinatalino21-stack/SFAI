// ============================================================
// SFAI — Preferências do usuário
// Fonte única das configurações de comportamento do chat.
// Usado por: Configurações (Settings/settings.js) e
// Chatbot (FrontEnd/chatbot/script.js).
// O tema NÃO vive aqui: é gerenciado por Theme/theme.js.
// ============================================================
(function () {
  const STORAGE_KEY = "sfai_preferences";
  const CHANGE_EVENT = "sfai:preferenceschange";

  const DEFAULTS = {
    typingAnimation: true,
    enterSend: true,
    autoSaveHistory: true,
  };

  const read = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };

      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return { ...DEFAULTS };

      return { ...DEFAULTS, ...saved };
    } catch (error) {
      console.error("Falha ao ler preferências:", error);
      return { ...DEFAULTS };
    }
  };

  let preferences = read();

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Falha ao salvar preferências:", error);
    }
  };

  const notify = (key) => {
    const detail = {
      key: key ?? null,
      value: key ? preferences[key] : undefined,
      preferences: { ...preferences },
    };

    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail }));
  };

  const get = (key) => {
    if (!key) return { ...preferences };
    return preferences[key];
  };

  const set = (key, value) => {
    if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
      console.error(`Preferência desconhecida: ${key}`);
      return;
    }

    if (preferences[key] === value) return;

    preferences = { ...preferences, [key]: value };
    persist();
    notify(key);
  };

  const onChange = (callback) => {
    window.addEventListener(CHANGE_EVENT, (event) => callback(event.detail));
  };

  // Mantém as preferências iguais entre abas abertas.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;

    preferences = read();
    notify(null);
  });

  window.SFAIPrefs = {
    get,
    set,
    onChange,
    defaults: { ...DEFAULTS },
  };
})();
