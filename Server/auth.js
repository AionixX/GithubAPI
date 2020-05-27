"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Url = require("url");
var GithubAPI;
(function (GithubAPI) {
    async function auth(_response, _request, _CLIENT_ID, _SCOPE) {
        let urlRequest = Url.parse(_request.url, true);
        let state = urlRequest.query["state"];
        let url = "https://github.com/login/oauth/authorize";
        let params = new URLSearchParams("client_id=" + _CLIENT_ID + "&state=" + state + "&scope=" + _SCOPE);
        url += "?" + params.toString();
        _response.writeHead(302, {
            "Location": url
        });
        _response.end();
    }
    GithubAPI.auth = auth;
})(GithubAPI = exports.GithubAPI || (exports.GithubAPI = {}));
//# sourceMappingURL=auth.js.map