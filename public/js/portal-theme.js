function aplicarTemaPortal(config = {}) {
  const corPrincipal = config.corPrincipal || "#111111";
  const corAcento = config.corAcento || "#0f766e";
  const fundoHeaderCor = config.fundoHeaderCor || corPrincipal;
  const fundoHeaderTipo =
    config.fundoHeaderTipo === "imagem" && config.fundoHeaderImagemUrl
      ? "imagem"
      : "cor";
  const fundoSiteTipo =
    config.fundoSiteTipo === "imagem" && config.fundoSiteImagemUrl
      ? "imagem"
      : config.fundoSiteTipo === "cor"
        ? "cor"
        : "padrao";

  document.documentElement.style.setProperty("--nav", fundoHeaderCor);
  document.documentElement.style.setProperty("--nav-dark", fundoHeaderCor);
  document.documentElement.style.setProperty("--accent", corAcento);

  const valTremor = config.logoTremor !== undefined ? config.logoTremor : 4;
  const efeito = config.logoEfeito || "shake";
  const animLoad =
    efeito === "none"
      ? "none"
      : `logo${efeito.charAt(0).toUpperCase() + efeito.slice(1)}Load`;
  const animHover =
    efeito === "none"
      ? "none"
      : `logo${efeito.charAt(0).toUpperCase() + efeito.slice(1)}Hover`;

  document.documentElement.style.setProperty(
    "--logo-shake-px",
    `${valTremor}px`,
  );
  document.documentElement.style.setProperty(
    "--logo-shake-deg",
    `${valTremor / 2}deg`,
  );
  document.documentElement.style.setProperty("--logo-anim-load", animLoad);
  document.documentElement.style.setProperty("--logo-anim-hover", animHover);

  if (fundoHeaderTipo === "imagem") {
    document.documentElement.style.setProperty(
      "--nav-bg-image",
      `url("${config.fundoHeaderImagemUrl}")`,
    );
    document.documentElement.style.setProperty(
      "--nav-bg-overlay",
      String((Number(config.fundoHeaderOverlay) || 35) / 100),
    );
    document.documentElement.dataset.navFundo = "imagem";
  } else {
    document.documentElement.style.removeProperty("--nav-bg-image");
    document.documentElement.style.removeProperty("--nav-bg-overlay");
    delete document.documentElement.dataset.navFundo;
  }

  if (fundoSiteTipo === "imagem") {
    document.documentElement.style.setProperty(
      "--site-bg-image",
      `url("${config.fundoSiteImagemUrl}")`,
    );
    document.documentElement.style.setProperty(
      "--site-bg-color",
      config.fundoSiteCor || "#f7f8fa",
    );
    document.documentElement.style.setProperty(
      "--site-bg-overlay",
      String((Number(config.fundoSiteOverlay) || 0) / 100),
    );
    document.documentElement.dataset.siteFundo = "imagem";
  } else if (fundoSiteTipo === "cor") {
    document.documentElement.style.removeProperty("--site-bg-image");
    document.documentElement.style.setProperty(
      "--site-bg-color",
      config.fundoSiteCor || "#f7f8fa",
    );
    document.documentElement.style.removeProperty("--site-bg-overlay");
    document.documentElement.dataset.siteFundo = "cor";
  } else {
    document.documentElement.style.removeProperty("--site-bg-image");
    document.documentElement.style.removeProperty("--site-bg-color");
    document.documentElement.style.removeProperty("--site-bg-overlay");
    delete document.documentElement.dataset.siteFundo;
  }

  if (config.faviconUrl) {
    let iconLink = document.querySelector("link[rel~='icon']");
    if (!iconLink) {
      iconLink = document.createElement("link");
      iconLink.rel = "icon";
      document.head.appendChild(iconLink);
    }
    iconLink.href = config.faviconUrl;
  }
}

function initDarkMode() {
  const isDark = localStorage.getItem("portalDarkMode") === "true";
  const iconSun = document.getElementById("icon-sun");
  const iconMoon = document.getElementById("icon-moon");

  if (isDark) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
    if (iconSun) iconSun.classList.remove("d-none");
    if (iconMoon) iconMoon.classList.add("d-none");
  } else {
    document.documentElement.removeAttribute("data-bs-theme");
    if (iconSun) iconSun.classList.add("d-none");
    if (iconMoon) iconMoon.classList.remove("d-none");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
  const btnDark = document.getElementById("btn-dark-mode");
  if (btnDark) {
    btnDark.addEventListener("click", () => {
      const isDark =
        document.documentElement.getAttribute("data-bs-theme") === "dark";
      localStorage.setItem("portalDarkMode", !isDark);
      initDarkMode();
    });
  }
});
