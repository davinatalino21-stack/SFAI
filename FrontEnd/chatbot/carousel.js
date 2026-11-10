
/* Carrossel infinito 3D das sugestões do SFAI.
   Arquivo independente do script.js principal. */
(() => {
  "use strict";

  const PAUSA_APOS_INTERACAO = 7000;
  const INTERVALO_AUTOMATICO = 5200;

  function iniciarCarrosselSugestoes() {
    const carousel = document.querySelector(".suggestion-carousel");
    const track = document.getElementById("suggestionGrid");

    if (!carousel || !track || track.dataset.carouselReady === "true") return;

    const originais = Array.from(track.querySelectorAll(".suggestion-card"));
    const quantidade = originais.length;
    if (quantidade < 2) return;

    track.dataset.carouselReady = "true";

    function clonarCard(card) {
      const clone = card.cloneNode(true);
      clone.classList.add("suggestion-card-clone");
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
      clone.querySelectorAll("a, button, input, textarea, select, [tabindex]")
        .forEach(el => el.tabIndex = -1);
      return clone;
    }

    originais.map(clonarCard).reverse()
      .forEach(card => track.insertBefore(card, track.firstChild));

    originais.map(clonarCard)
      .forEach(card => track.appendChild(card));

    const cards = Array.from(track.querySelectorAll(".suggestion-card"));

    let timerAutomatico = null;
    let timerPausa = null;
    let timerFimScroll = null;
    let frameAtualizacao = null;
    let ultimaInteracao = 0;

    function centroDoCard(card) {
      const rect = card.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      return rect.left + rect.width / 2 -
        (trackRect.left + track.clientWidth / 2);
    }

    function indiceMaisProximo() {
      const centro = track.getBoundingClientRect().left +
        track.clientWidth / 2;

      let indice = 0;
      let menorDistancia = Infinity;

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const distancia = Math.abs(
          rect.left + rect.width / 2 - centro
        );

        if (distancia < menorDistancia) {
          menorDistancia = distancia;
          indice = i;
        }
      });

      return indice;
    }

    function atualizarProfundidade() {
      frameAtualizacao = null;

      cards.forEach(card => {
        const distancia = centroDoCard(card) /
          Math.max(card.getBoundingClientRect().width, 1);

        const absoluta = Math.abs(distancia);
        const limitada = Math.min(absoluta, 2.5);
        const escala = Math.max(0.76, 1 - limitada * 0.105);
        const profundidade = -Math.min(limitada * 78, 205);
        const rotacao = Math.max(-34, Math.min(34, distancia * -19));
        const deslocamentoY = Math.min(absoluta * 7, 18);
        const opacidade = Math.max(0.38, 1 - absoluta * 0.23);
        const blur = Math.max(0, absoluta - 1.35) * 1.2;

        card.style.transform =
          `translate3d(0, ${deslocamentoY}px, ${profundidade}px) ` +
          `rotateY(${rotacao}deg) scale(${escala})`;

        card.style.opacity = String(opacidade);
        card.style.filter = `blur(${blur}px)`;
        card.style.zIndex = String(100 - Math.round(absoluta * 10));
        card.classList.toggle("is-carousel-center", absoluta < 0.18);
      });
    }

    function solicitarAtualizacao() {
      if (frameAtualizacao !== null) return;
      frameAtualizacao = requestAnimationFrame(atualizarProfundidade);
    }

    function centralizarCard(indice, comportamento = "smooth") {
      const card = cards[indice];
      if (!card) return;

      const trackRect = track.getBoundingClientRect();
      const alvo = card.getBoundingClientRect().left -
        trackRect.left + track.scrollLeft +
        card.offsetWidth / 2 - track.clientWidth / 2;

      track.scrollTo({ left: alvo, behavior: comportamento });
      solicitarAtualizacao();
    }

    function normalizarExtremos() {
      const indice = indiceMaisProximo();

      if (indice < quantidade) {
        centralizarCard(indice + quantidade, "auto");
      } else if (indice >= quantidade * 2) {
        centralizarCard(indice - quantidade, "auto");
      }

      solicitarAtualizacao();
    }

    function agendarAutomatico() {
      clearTimeout(timerAutomatico);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      timerAutomatico = setTimeout(() => {
        mover(1, false);
      }, 5200);
    }

    function pausarAposInteracao() {
      ultimaInteracao = Date.now();
      clearTimeout(timerAutomatico);
      clearTimeout(timerPausa);

      timerPausa = setTimeout(() => {
        if (Date.now() - ultimaInteracao >= PAUSA_APOS_INTERACAO) {
          agendarAutomatico();
        }
      }, PAUSA_APOS_INTERACAO);
    }

    function mover(direcao, interacao = true) {
      if (interacao) pausarAposInteracao();

      const atual = indiceMaisProximo();
      let proximo = atual + (direcao < 0 ? -1 : 1);

      if (proximo < 0) proximo = cards.length - 1;
      if (proximo >= cards.length) proximo = 0;

      centralizarCard(proximo, "smooth");
    }

    function aoTerminarRolagem() {
      clearTimeout(timerFimScroll);

      timerFimScroll = setTimeout(() => {
        normalizarExtremos();

        if (Date.now() - ultimaInteracao >= PAUSA_APOS_INTERACAO) {
          agendarAutomatico();
        }
      }, 180);
    }

    track.addEventListener("scroll", () => {
      solicitarAtualizacao();
      aoTerminarRolagem();
    }, { passive: true });

    carousel.addEventListener("pointerdown", pausarAposInteracao, { passive: true });
    carousel.addEventListener("touchstart", pausarAposInteracao, { passive: true });
    carousel.addEventListener("focusin", pausarAposInteracao);
    carousel.addEventListener("wheel", pausarAposInteracao, { passive: true });
    carousel.addEventListener("mouseenter", pausarAposInteracao);

    carousel.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        mover(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        mover(1);
      }
    });

    window.moverSugestoes = direcao =>
      mover(Number(direcao) || 1, true);

    window.SFAISuggestionCarousel = {
      move: window.moverSugestoes,
      pause: pausarAposInteracao
    };

    requestAnimationFrame(() => {
      centralizarCard(quantidade, "auto");
      solicitarAtualizacao();
      agendarAutomatico();
    });

    window.addEventListener("resize", () => {
      centralizarCard(indiceMaisProximo(), "auto");
      solicitarAtualizacao();
    }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarCarrosselSugestoes, { once: true });
  } else {
    iniciarCarrosselSugestoes();
  }
})();
