namespace GithubAPI {

  window.addEventListener("load", Init);

  let accesToken: string;

  function Init(): void {
    let params: URLSearchParams = (new URL(document.location.href).searchParams);
    let token: string | null = params.get("code");
    let state: string | null = params.get("state");

    if (token && state) {
      getAccessToken(token, state);
    }

    document.querySelector("#repoButton")?.addEventListener("click", CreateRepo);
  }

  async function getAccessToken(token: string, state: string): Promise<void> {
    let url: string = "http://localhost:5001?action=fetchAccessToken&code=" + token + "&state=" + state;
    let response: Response = await fetch(url);
    let auth: string = await response.text();
    if (auth) {
      accesToken = auth;
    }
  }

  async function CreateRepo(): Promise<void> {
    let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#repoName");
    let privateInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#private");

    let name: string = nameInput.value;
    let privateRepo: boolean = privateInput.checked;

    let url: string = "http://localhost:5001?action=createNewRepository&name=" + name + "&private=" + privateRepo + "&accessToken=" + accesToken;
    let response: Response = await fetch(url);
    let responseText: string = await response.text();
    alert(responseText == "201" ? "Erfolgreich erstellt!" : "Dayum! Da ist leider etwas schief gelaufen.");
  }
}