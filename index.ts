namespace GithubAPI {

  window.addEventListener("load", Init);
  
  function Init(): void {
    document.querySelector("#login")?.addEventListener("click", login);
  }

  async function login(): Promise<void> {
    window.location.href = "http://localhost:5001?action=authenticate";
  }
}