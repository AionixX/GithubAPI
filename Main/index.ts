namespace GithubAPI {

  let loginButton: HTMLButtonElement;
  let userName: HTMLSpanElement;
  let content: HTMLDivElement;
  let repoList: HTMLDivElement;
  let detailedView: HTMLDivElement;
  let errorDiv: HTMLDivElement;
  let file: HTMLTextAreaElement;
  let saveButton: HTMLButtonElement;
  let deleteButton: HTMLButtonElement;
  let activePath: HTMLSpanElement;
  let createNewBG: HTMLDivElement;
  let newFileName: HTMLInputElement;
  let createNewButton: HTMLButtonElement;
  let closeNewButton: HTMLButtonElement;

  let selectedRepo: HTMLElement | null = null;
  let selectedElementPath: string;

  window.addEventListener("load", Init);

  function Init(): void {

    getReferences();                                                                          //First get all references

    loginButton.addEventListener("click", authorize);                                         //Authorize client on login click
    saveButton.addEventListener("click", saveFile);
    createNewButton.addEventListener("click", createFile);
    closeNewButton.addEventListener("click", () => {
      newFileName.value = "";
      createNewBG.classList.add("invisible");
    });
    deleteButton.addEventListener("click", deleteFile);

    let at: string | undefined = getCookie("at");                                              //Get the accesstoken if available

    if (at != undefined) {                                                                    //Check if we have a accesstoken
      login()                                                                                //If we do -> Login
    }
    else {

      let params: URLSearchParams = (new URL(document.location.href).searchParams);           //Get URL search params
      let code: string | null = params.get("code");
      let state: string | null = params.get("state");

      if (code && state) {                                                                    //Check if we came from authorization

        if (state == getCookie("state")) {                                                    //Check if the state we got is the same we generated
          fetchAccesstokenAndLogin(code, state);                                               //Exchange the code to an accesstoken and login the user
        }
        else {                                                                                //Abort the process if not and give an error alert
          console.error("Error#01: Invalid State");
          alert("State is not valid!");
        }
      }
    }
  }
  async function deleteFile(): Promise<void> {
    if (selectedRepo == null || selectedElementPath == null)
      return;

    let url: string = "http://localhost:5001?a=deleteFile&at=" + getCookie("at") + "&name=" + selectedRepo.innerText + "&path=" + selectedElementPath;
    let response: Response = await fetch(url);

    console.log(response);

  }
  async function createFile(): Promise<void> {
    if (selectedRepo == null || selectedElementPath == null || newFileName.value == "")
      return;

    let url: string = "http://localhost:5001?a=createFile&at=" + getCookie("at") + "&name=" + selectedRepo.innerText + "&path=" + selectedElementPath + "&fileName=" + newFileName.value;
    let response: Response = await fetch(url);

    console.log(response);
  }
  async function fetchAccesstokenAndLogin(_code: string, _state: string): Promise<void> {
    if (await fetchAccesstoken(_code, _state)) {
      await login();
    }
    else {
      console.error("Error#02: Not able to fetch accesstoken");
      alert("Not able to fetch accesstoken!");
    }
  }
  async function login(): Promise<void> {
    let username: string = await fetchUsername();                                           //Get username and put it to the HTML Element

    if (!username)
      return;

    userName.innerText = username;
    loginButton.innerText = "Logout";

    content.classList.remove("invisible");
    content.classList.add("visible");

    errorDiv.classList.remove("visible");
    errorDiv.classList.add("invisible");

    loginButton.removeEventListener("click", authorize);
    loginButton.addEventListener("click", logout);

    await fillRepoList();
  }
  async function saveFile(): Promise<void> {
    if (!selectedRepo || !selectedElementPath)
      return;

    let newFile: Blob = new Blob([file.value], { type: "text/plain" });

    let url: string = "http://localhost:5001?a=updateFile&at=" + getCookie("at") + "&name=" + selectedRepo.innerText + "&path=" + selectedElementPath;
    let response: Response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: newFile
    });
    console.log(await response.text());
  }
  async function showRepo(_repo: Repo, _element: HTMLElement): Promise<void> {
    let repoTree: TreeElement[] = await fetchRepoTree(_repo.name, _repo.owner.login);
    selectedRepo = _element;
    clearList(detailedView);
    for (let element of repoTree) {
      detailedView.appendChild(await createDetailedElement(element, _repo.name, "", _repo.owner.login));
    }
  }
  async function fillRepoList(): Promise<void> {
    let repos: Repo[] = await getAllRepositorys();
    clearList(repoList);
    repos.forEach(element => {
      repoList.appendChild(createRepoListElement(element));
    });
  }
  async function fetchRepoTree(_name: string, _owner: string): Promise<TreeElement[]> {
    let url: string = "http://localhost:5001?a=getRepoTree&at=" + getCookie("at") + "&name=" + _name + "&owner=" + _owner;
    let response: Response = await fetch(url);
    let tree: TreeElement[] = JSON.parse(await response.text());

    return tree;
  }
  async function fetchTree(_name: string, _sha: string, _owner: string): Promise<TreeElement[]> {
    let url: string = "http://localhost:5001?a=getTree&at=" + getCookie("at") + "&name=" + _name + "&sha=" + _sha + "&owner=" + _owner;
    let response: Response = await fetch(url);
    let tree: TreeElement[] = JSON.parse(await response.text());

    return tree;
  }
  async function getAllRepositorys(): Promise<Repo[]> {
    let url: string = "http://localhost:5001?a=getAllRepos&at=" + getCookie("at");
    let response: Response = await fetch(url);
    const data: Repo[] = JSON.parse(await response.text());
    return data;
  }
  function logout(): void {
    deleteCookie("at");
    window.location.href = "http://localhost:8080/";
  }
  async function fetchUsername(): Promise<string> {
    let url: string = "http://localhost:5001?a=fetchUsername&at=" + getCookie("at");
    let response: Response = await fetch(url);
    let username: string = await response.text();

    return username ? username : "Not able to fetch Username";
  }
  async function fetchAccesstoken(_code: string, _state: string): Promise<boolean> {
    let url: string = "http://localhost:8080/?a=fetchToken&code=" + _code + "&state=" + _state;
    let response: Response = await fetch(url);
    let auth: string = await response.text();
    if (auth) {
      setCookie("at", auth);
      return true;
    }
    return false;
  }
  function authorize(): void {
    let state: string = generateAndSaveState(15);
    window.location.href = "http://localhost:5001?a=auth&state=" + state;                      //Tell the server to redirect the client to github
  }
  function getReferences(): void {
    loginButton = <HTMLButtonElement>document.querySelector("#loginButton");
    userName = <HTMLSpanElement>document.querySelector("#userSpan");
    content = <HTMLDivElement>document.querySelector("#content");
    repoList = <HTMLDivElement>document.querySelector("#repoList");
    detailedView = <HTMLDivElement>document.querySelector("#detailedView");
    errorDiv = <HTMLDivElement>document.querySelector("#error");
    file = <HTMLTextAreaElement>document.querySelector("#file");
    saveButton = <HTMLButtonElement>document.querySelector("#saveFile");
    deleteButton = <HTMLButtonElement>document.querySelector("#deleteFile");
    activePath = <HTMLSpanElement>document.querySelector("#activePath");
    createNewBG = <HTMLDivElement>document.querySelector("#createNewBackground");
    newFileName = <HTMLInputElement>document.querySelector("#fileName");
    createNewButton = <HTMLButtonElement>document.querySelector("#createButton");
    closeNewButton = <HTMLButtonElement>document.querySelector("#closeNewRepo");
  }
  async function createDetailedElement(_element: TreeElement, _repoName: string, _path: string, _owner: string): Promise<HTMLLIElement> {
    let li: HTMLLIElement = document.createElement("li");
    li.innerText = _element.path;

    _path = _path != "" ? _path + "/" + _element.path : _element.path;

    li.addEventListener("click", () => {
      selectedElementPath = _path;
      activePath.innerText = "Active path: " + _path;
      focusObject(_element, _repoName, _path, _owner);
      if (event) {
        event.stopPropagation();
      }
    });

    if (_element.type == "tree") {
      let ul: HTMLUListElement = document.createElement("ul");
      let childs: TreeElement[] = await fetchTree(_repoName, _element.sha, _owner);

      let createButton: HTMLButtonElement = document.createElement("button");
      createButton.innerText = "Create";
      createButton.addEventListener("click", () => {
        openCreateRepo();
        selectedElementPath = _path;
      } );
      ul.appendChild(createButton);

      for (let element of childs) {
        let lie: HTMLLIElement = await createDetailedElement(element, _repoName, _path, _owner);
        ul.appendChild(lie);
      }
      li.appendChild(ul);
    }
    return li;
  }
  function openCreateRepo(): void {
    createNewBG.classList.remove("invisible");
  }
  async function fetchFile(_element: TreeElement, _repoName: string, _path: string, _owner: string): Promise<void> {
    let url: string = "http://localhost:5001?a=getFile&at=" + getCookie("at") + "&name=" + _repoName + "&path=" + _path + "&owner= " + _owner;
    let response: Response = await fetch(url);
    file.innerHTML = "";
    file.innerHTML = await (await fetch(await response.text())).text();
  }
  function focusObject(_element: TreeElement, _repoName: string, _path: string, _owner: string): void {
    switch (_element.type) {
      case "blob":
        fetchFile(_element, _repoName, _path, _owner);
        break;
      case "tree":
        selectedElementPath = _path;
        activePath.innerText = "Active path: " + _path;
        break;

    }
  }
  function createRepoListElement(_repo: Repo): HTMLLIElement {
    let li: HTMLLIElement = document.createElement("li");
    li.innerText = _repo.name;
    li.addEventListener("click", () => {
      showRepo(_repo, li);
    });
    return li;
  }
  function clearList(_list: HTMLElement): void {
    while (_list.firstChild) {
      _list.firstChild.remove();
    }
  }
}