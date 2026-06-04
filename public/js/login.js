document.addEventListener("DOMContentLoaded", async () => {
  const hash = window.location.hash;

  // Intercepta a resposta do Supabase quando o usuário é redirecionado de volta
  if (hash && hash.includes("access_token")) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");

    if (accessToken) {
      const erroBox = document.getElementById("erro-mensagem");
      erroBox.classList.remove("alert-danger", "d-none");
      erroBox.classList.add("alert-info");
      erroBox.innerHTML = `Verificando credenciais de segurança...<br><span class="small spinner-border spinner-border-sm mt-2" role="status"></span>`;

      try {
        const res = await fetch("/api/login/social", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: accessToken }),
        });

        if (res.ok) {
          window.location.href = "admin.html";
        } else {
          const err = await res.json();
          erroBox.classList.replace("alert-info", "alert-danger");
          erroBox.innerHTML = err.erro || "Falha ao registrar sessão.";
          history.replaceState(null, null, " "); // Limpa o hash falho da URL
        }
      } catch (e) {
        erroBox.classList.replace("alert-info", "alert-danger");
        erroBox.innerHTML = "Erro ao se comunicar com o servidor.";
      }
    }
  }
});

document
  .getElementById("form-login")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const erroBox = document.getElementById("erro-mensagem");
    erroBox.classList.add("d-none");

    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    try {
      const resposta = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha }),
      });

      if (resposta.ok) {
        window.location.href = "admin.html";
        return;
      }

      const dados = await resposta.json();
      erroBox.textContent = dados.erro || "Credenciais invalidas.";
      erroBox.classList.remove("d-none");
    } catch {
      erroBox.textContent = "Erro ao conectar com o servidor.";
      erroBox.classList.remove("d-none");
    }
  });

window.loginSocial = async function (provedor) {
  const erroBox = document.getElementById("erro-mensagem");
  // Altera para uma cor azulada/informativa (info) em vez de erro (danger)
  erroBox.classList.remove("alert-danger");
  erroBox.classList.add("alert-info");

  erroBox.innerHTML = `Iniciando comunicação com o <b>${provedor.toUpperCase()}</b>...`;
  erroBox.classList.remove("d-none");

  try {
    const res = await fetch("/api/auth/config");
    const conf = await res.json();

    if (!conf.supabaseUrl) {
      erroBox.classList.replace("alert-info", "alert-danger");
      erroBox.innerHTML = `As variáveis do Supabase não estão configuradas no servidor (.env).`;
      return;
    }

    // Redireciona o usuário para o cofre seguro do Supabase
    const redirectTo = encodeURIComponent(
      window.location.origin + "/login.html",
    );
    const oauthUrl = `${conf.supabaseUrl}/auth/v1/authorize?provider=${provedor}&redirect_to=${redirectTo}`;
    window.location.href = oauthUrl;
  } catch (e) {
    erroBox.classList.replace("alert-info", "alert-danger");
    erroBox.innerHTML = `Falha ao tentar iniciar o login social.`;
  }
};
