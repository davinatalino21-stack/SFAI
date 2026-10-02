const getUserData = () => window.SFAIAccount.get();

const saveUserData = async (updatedUser) => {
  window.SFAIAccount.save(updatedUser);
};

const getInitials = (name) => window.SFAIAccount.getInitials(name);

const escapeHtml = (value) => {
  const p = document.createElement("p");
  p.textContent = value;
  return p.innerHTML;
};

const buildAvatar = (user) => {
  if (user.foto) {
    return `<img src="${escapeHtml(user.foto)}" alt="Avatar do usuário" />`;
  }
  return `<span>${getInitials(user.nome)}</span>`;
};

const updateNavbarAvatar = (user) => {
  const navbarIcon = document.getElementById("userMenuIcon");
  if (!navbarIcon) return;
  navbarIcon.innerHTML = buildAvatar(user);
};

const showToast = (message) => window.SFAIUI.toast(message);

const populateProfile = () => {
  const user = getUserData();
  if (!user) {
    window.SFAIAccount.requireAuth();
    return;
  }

  const profileAvatar = document.getElementById("profileAvatar");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileLoginMethod = document.getElementById("profileLoginMethod");
  const profileCreatedAt = document.getElementById("profileCreatedAt");
  const profileId = document.getElementById("profileId");
  const securityText = document.getElementById("securityText");
  const profileAvatarUrl = document.getElementById("editAvatarUrl");
  const avatarFieldNote = document.getElementById("avatarFieldNote");

  const loginMethod = window.SFAIAccount.getLoginMethod(user);
  const createdAt = user.createdAt || "Não disponível";
  const isGoogleAccount = window.SFAIAccount.isGoogleAccount(user);


  if (profileAvatar) profileAvatar.innerHTML = buildAvatar(user);
  if (profileName) profileName.textContent = user.nome || "Usuário";
  if (profileEmail) profileEmail.textContent = user.email || "";
  if (profileLoginMethod) profileLoginMethod.textContent = loginMethod;
  if (profileCreatedAt) profileCreatedAt.textContent = createdAt;
  if (profileId) profileId.textContent = user.id || "-";
  if (securityText) {
    securityText.textContent = isGoogleAccount
      ? "Conta vinculada ao Google"
      : "Conta protegida por senha";
  }

  if (profileAvatarUrl) {
    profileAvatarUrl.value = isGoogleAccount ? "" : user.foto || "";
    profileAvatarUrl.disabled = isGoogleAccount;
    avatarFieldNote.textContent = isGoogleAccount
      ? "Contas Google não podem alterar a foto por aqui."
      : "Envie o link de uma imagem válida para seu avatar.";
  }

  updateNavbarAvatar(user);
};

const openEditModal = () => {
  const user = getUserData();
  if (!user) {
    window.SFAIAccount.requireAuth();
    return;
  }

  const editName = document.getElementById("editName");
  const editAvatarUrl = document.getElementById("editAvatarUrl");
  const modal = document.getElementById("editProfileModal");
  const isGoogleAccount = window.SFAIAccount.isGoogleAccount(user);

  if (editName) editName.value = user.nome || "";
  if (editAvatarUrl) editAvatarUrl.value = isGoogleAccount ? "" : user.foto || "";
  if (editAvatarUrl) editAvatarUrl.disabled = isGoogleAccount;

  if (modal) {
    modal.classList.remove("hidden");
  }
};

const closeEditModal = () => {
  const modal = document.getElementById("editProfileModal");
  if (modal) modal.classList.add("hidden");
};

const submitProfileUpdate = async (event) => {
  event.preventDefault();

  const user = getUserData();
  if (!user) return;

  const editName = document.getElementById("editName");
  const editAvatarUrl = document.getElementById("editAvatarUrl");
  if (!editName || !editAvatarUrl) return;

  const isGoogleAccount = window.SFAIAccount.isGoogleAccount(user);
  const updatedUser = {
    ...user,
    nome: editName.value.trim() || user.nome,
    foto: isGoogleAccount
      ? user.foto
      : editAvatarUrl.value.trim() || user.foto,
  };

  const API_BASE_URL =
    "https://davidumbproxmax-classificador-mostratec.hf.space";

  try {
    const response = await fetch(`${API_BASE_URL}/usuario/atualizar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${window.SFAIAccount.getToken()}`,
      },
      body: JSON.stringify(updatedUser),
    });

    if (!response.ok) {
      throw new Error("Não foi possível atualizar o perfil no servidor.");
    }

    const result = await response.json().catch(() => null);
    const finalUser = result?.usuario || updatedUser;
    await saveUserData(finalUser);
  } catch (error) {
    await saveUserData(updatedUser);
  } finally {
    populateProfile();
    closeEditModal();
    showToast("Perfil atualizado com sucesso");
  }
};

const initProfilePage = () => {
  if (!window.SFAIAccount.requireAuth()) return;

  const backButton = document.getElementById("backButton");
  const editProfileButton = document.getElementById("editProfileButton");
  const logoutButton = document.getElementById("logoutFromProfile");
  const closeModalButton = document.getElementById("closeModalButton");
  const cancelEditButton = document.getElementById("cancelEditButton");
  const editProfileForm = document.getElementById("editProfileForm");
  const modal = document.getElementById("editProfileModal");

  populateProfile();

  if (backButton) {
    backButton.addEventListener("click", () => {
      window.SFAIUI.back("index.html");
    });
  }

  if (editProfileButton) {
    editProfileButton.addEventListener("click", openEditModal);
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      window.SFAIAccount.clear();
      window.location.href = "Login/login.html";
    });
  }

  if (closeModalButton) {
    closeModalButton.addEventListener("click", closeEditModal);
  }

  if (cancelEditButton) {
    cancelEditButton.addEventListener("click", closeEditModal);
  }

  if (editProfileForm) {
    editProfileForm.addEventListener("submit", submitProfileUpdate);
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeEditModal();
      }
    });
  }
};

window.addEventListener("DOMContentLoaded", initProfilePage);
