function displayMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    const mensagem = urlParams.get('msg');
    const origem = mensagem === "index" ? 'index.html' : 'Layout.html';

    // Usa o histórico real do navegador quando a página veio do SFAI;
    // caso contrário, cai no destino original.
    if (window.SFAIUI) {
        window.SFAIUI.back(origem);
        return;
    }

    window.location.href = origem;
}


document.addEventListener("DOMContentLoaded", () => {
  const links = Array.from(document.querySelectorAll(".docs-toc a"));
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || !links.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = "#" + entry.target.id;
      links.forEach((link) => {
        const active = link.getAttribute("href") === id;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });

  sections.forEach((section) => observer.observe(section));
});
