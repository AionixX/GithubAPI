"use strict";
var GithubAPI;
(function (GithubAPI) {
    window.addEventListener("load", Init);
    let accesToken;
    function Init() {
        let params = (new URL(document.location.href).searchParams);
        let token = params.get("code");
        let state = params.get("state");
        if (token && state) {
            getAccessToken(token, state);
        }
        document.querySelector("#repoButton")?.addEventListener("click", CreateRepo);
    }
    async function getAccessToken(token, state) {
        let url = "http://localhost:5001?action=fetchAccessToken&code=" + token + "&state=" + state;
        let response = await fetch(url);
        let auth = await response.text();
        if (auth) {
            accesToken = auth;
        }
    }
    async function CreateRepo() {
        let nameInput = document.querySelector("#repoName");
        let privateInput = document.querySelector("#private");
        let name = nameInput.value;
        let privateRepo = privateInput.checked;
        let url = "http://localhost:5001?action=createNewRepository&name=" + name + "&private=" + privateRepo + "&accessToken=" + accesToken;
        let response = await fetch(url);
        let responseText = await response.text();
        alert(responseText);
    }
})(GithubAPI || (GithubAPI = {}));
//# sourceMappingURL=callback.js.map