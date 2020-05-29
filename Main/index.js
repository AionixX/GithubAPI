"use strict";
var GithubAPI;
(function (GithubAPI) {
    let loginButton;
    let userName;
    let content;
    let repoList;
    let detailedView;
    let errorDiv;
    let file;
    let saveButton;
    let deleteButton;
    let activePath;
    let createNewBG;
    let newFileName;
    let createNewButton;
    let closeNewButton;
    let selectedRepo = null;
    let selectedElementPath;
    window.addEventListener("load", Init);
    function Init() {
        getReferences(); //First get all references
        loginButton.addEventListener("click", authorize); //Authorize client on login click
        saveButton.addEventListener("click", saveFile);
        createNewButton.addEventListener("click", createFile);
        closeNewButton.addEventListener("click", () => {
            newFileName.value = "";
            createNewBG.classList.add("invisible");
        });
        deleteButton.addEventListener("click", deleteFile);
        let at = GithubAPI.getCookie("at"); //Get the accesstoken if available
        if (at != undefined) { //Check if we have a accesstoken
            login(); //If we do -> Login
        }
        else {
            let params = (new URL(document.location.href).searchParams); //Get URL search params
            let code = params.get("code");
            let state = params.get("state");
            if (code && state) { //Check if we came from authorization
                if (state == GithubAPI.getCookie("state")) { //Check if the state we got is the same we generated
                    fetchAccesstokenAndLogin(code, state); //Exchange the code to an accesstoken and login the user
                }
                else { //Abort the process if not and give an error alert
                    console.error("Error#01: Invalid State");
                    alert("State is not valid!");
                }
            }
        }
    }
    async function deleteFile() {
        if (selectedRepo == null || selectedElementPath == null)
            return;
        let url = "http://localhost:5001?a=deleteFile&at=" + GithubAPI.getCookie("at") + "&name=" + selectedRepo.innerText + "&path=" + selectedElementPath;
        let response = await fetch(url);
        console.log(response);
    }
    async function createFile() {
        if (selectedRepo == null || selectedElementPath == null || newFileName.value == "")
            return;
        let url = "http://localhost:5001?a=createFile&at=" + GithubAPI.getCookie("at") + "&name=" + selectedRepo.innerText + "&path=" + selectedElementPath + "&fileName=" + newFileName.value;
        let response = await fetch(url);
        console.log(response);
    }
    async function fetchAccesstokenAndLogin(_code, _state) {
        if (await fetchAccesstoken(_code, _state)) {
            await login();
        }
        else {
            console.error("Error#02: Not able to fetch accesstoken");
            alert("Not able to fetch accesstoken!");
        }
    }
    async function login() {
        let username = await fetchUsername(); //Get username and put it to the HTML Element
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
    async function saveFile() {
        if (!selectedRepo || !selectedElementPath)
            return;
        let newFile = new Blob([file.value], { type: "text/plain" });
        let url = "http://localhost:5001?a=updateFile&at=" + GithubAPI.getCookie("at") + "&name=" + selectedRepo.innerText + "&path=" + selectedElementPath;
        let response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: newFile
        });
        console.log(await response.text());
    }
    async function showRepo(_repo, _element) {
        let repoTree = await fetchRepoTree(_repo.name, _repo.owner.login);
        selectedRepo = _element;
        clearList(detailedView);
        for (let element of repoTree) {
            detailedView.appendChild(await createDetailedElement(element, _repo.name, "", _repo.owner.login));
        }
    }
    async function fillRepoList() {
        let repos = await getAllRepositorys();
        clearList(repoList);
        repos.forEach(element => {
            repoList.appendChild(createRepoListElement(element));
        });
    }
    async function fetchRepoTree(_name, _owner) {
        let url = "http://localhost:5001?a=getRepoTree&at=" + GithubAPI.getCookie("at") + "&name=" + _name + "&owner=" + _owner;
        let response = await fetch(url);
        let tree = JSON.parse(await response.text());
        return tree;
    }
    async function fetchTree(_name, _sha, _owner) {
        let url = "http://localhost:5001?a=getTree&at=" + GithubAPI.getCookie("at") + "&name=" + _name + "&sha=" + _sha + "&owner=" + _owner;
        let response = await fetch(url);
        let tree = JSON.parse(await response.text());
        return tree;
    }
    async function getAllRepositorys() {
        let url = "http://localhost:5001?a=getAllRepos&at=" + GithubAPI.getCookie("at");
        let response = await fetch(url);
        const data = JSON.parse(await response.text());
        return data;
    }
    function logout() {
        GithubAPI.deleteCookie("at");
        window.location.href = "http://localhost:8080/";
    }
    async function fetchUsername() {
        let url = "http://localhost:5001?a=fetchUsername&at=" + GithubAPI.getCookie("at");
        let response = await fetch(url);
        let username = await response.text();
        return username ? username : "Not able to fetch Username";
    }
    async function fetchAccesstoken(_code, _state) {
        let url = "http://localhost:8080/?a=fetchToken&code=" + _code + "&state=" + _state;
        let response = await fetch(url);
        let auth = await response.text();
        if (auth) {
            GithubAPI.setCookie("at", auth);
            return true;
        }
        return false;
    }
    function authorize() {
        let state = GithubAPI.generateAndSaveState(15);
        window.location.href = "http://localhost:5001?a=auth&state=" + state; //Tell the server to redirect the client to github
    }
    function getReferences() {
        loginButton = document.querySelector("#loginButton");
        userName = document.querySelector("#userSpan");
        content = document.querySelector("#content");
        repoList = document.querySelector("#repoList");
        detailedView = document.querySelector("#detailedView");
        errorDiv = document.querySelector("#error");
        file = document.querySelector("#file");
        saveButton = document.querySelector("#saveFile");
        deleteButton = document.querySelector("#deleteFile");
        activePath = document.querySelector("#activePath");
        createNewBG = document.querySelector("#createNewBackground");
        newFileName = document.querySelector("#fileName");
        createNewButton = document.querySelector("#createButton");
        closeNewButton = document.querySelector("#closeNewRepo");
    }
    async function createDetailedElement(_element, _repoName, _path, _owner) {
        let li = document.createElement("li");
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
            let ul = document.createElement("ul");
            let childs = await fetchTree(_repoName, _element.sha, _owner);
            let createButton = document.createElement("button");
            createButton.innerText = "Create";
            createButton.addEventListener("click", () => {
                openCreateRepo();
                selectedElementPath = _path;
            });
            ul.appendChild(createButton);
            for (let element of childs) {
                let lie = await createDetailedElement(element, _repoName, _path, _owner);
                ul.appendChild(lie);
            }
            li.appendChild(ul);
        }
        return li;
    }
    function openCreateRepo() {
        createNewBG.classList.remove("invisible");
    }
    async function fetchFile(_element, _repoName, _path, _owner) {
        let url = "http://localhost:5001?a=getFile&at=" + GithubAPI.getCookie("at") + "&name=" + _repoName + "&path=" + _path + "&owner= " + _owner;
        let response = await fetch(url);
        file.innerHTML = "";
        file.innerHTML = await (await fetch(await response.text())).text();
    }
    function focusObject(_element, _repoName, _path, _owner) {
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
    function createRepoListElement(_repo) {
        let li = document.createElement("li");
        li.innerText = _repo.name;
        li.addEventListener("click", () => {
            showRepo(_repo, li);
        });
        return li;
    }
    function clearList(_list) {
        while (_list.firstChild) {
            _list.firstChild.remove();
        }
    }
})(GithubAPI || (GithubAPI = {}));
//# sourceMappingURL=index.js.map