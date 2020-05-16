"use strict";
var GithubAPI;
(function (GithubAPI) {
    window.addEventListener("load", Init);
    function Init() {
        document.querySelector("#login")?.addEventListener("click", login);
    }
    async function login() {
        window.location.href = "http://localhost:5001?action=authenticate";
    }
})(GithubAPI || (GithubAPI = {}));
//# sourceMappingURL=index.js.map