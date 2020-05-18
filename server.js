"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HTTP = require("http");
const Url = require("url");
const auth_1 = require("@octokit/auth");
const request_1 = require("@octokit/request");
const CLIENT_ID = "47db66f43b3e5e0c0b25";
const CLIENT_SECRET = "d1abfd3be9efe995399faad6a2f947b2dc4149a9";
const SCOPE = "repo, user";
//State is going to generate from the client
const STATE = "D9XGyXfLbrSnDrpshfp4CPc7";
var GithubAPI;
(function (GithubAPI) {
    let server = HTTP.createServer();
    let port = process.env.PORT;
    if (port == undefined)
        port = 5001;
    server.listen(port);
    server.addListener("request", handleRequest);
    function handleRequest(_request, _response) {
        if (_request.url) {
            let url = Url.parse(_request.url, true);
            for (let key in url.query) {
                if (key == "action") {
                    switch (url.query[key]) {
                        case "authenticate":
                            authenticate(_response);
                            break;
                        case "fetchAccessToken":
                            fetchAccessToken(_request, _response);
                            break;
                        case "createNewRepository":
                            createNewRepository(_request, _response);
                            break;
                        default:
                            _response.write("No such action available");
                            _response.end();
                    }
                }
            }
        }
    }
    function authenticate(_response) {
        let url = "https://github.com/login/oauth/authorize";
        let params = new URLSearchParams("client_id=" + CLIENT_ID + "&state=" + STATE + "&scope=" + SCOPE);
        url += "?" + params.toString();
        _response.writeHead(302, {
            "Location": url
        });
        _response.end();
    }
    async function fetchAccessToken(_request, _response) {
        let url = Url.parse(_request.url, true);
        let _code = null;
        let _state = null;
        _code = url.query["code"] ? url.query["code"] : null;
        _state = url.query["state"] ? url.query["state"] : null;
        //TODO if state dont matches the original state, abort the process
        if (_code && _state) {
            const auth = auth_1.createOAuthAppAuth({
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET
            });
            const appAuthentication = await auth({
                type: "token",
                code: _code,
                state: _state
            });
            let result = JSON.stringify(appAuthentication);
            let data = JSON.parse(result);
            _response.setHeader("Access-Control-Allow-Origin", "*");
            _response.setHeader("Content-Type", "json");
            _response.write(data ? data.token : "Err:#10001: No data available");
            _response.end();
        }
    }
    async function createNewRepository(_request, _response) {
        let url = Url.parse(_request.url, true);
        let _name = null;
        let _private = null;
        let _accessToken = null;
        _name = url.query["name"] ? url.query["name"] : null;
        _private = url.query["private"] ? url.query["private"] : null;
        _accessToken = url.query["accessToken"] ? url.query["accessToken"] : null;
        _response.setHeader("Access-Control-Allow-Origin", "*");
        _response.setHeader("Content-Type", "json");
        if (_name && _private && _accessToken) {
            const auth = auth_1.createTokenAuth(_accessToken);
            await auth();
            const reqeustWithAuth = request_1.request.defaults({
                request: {
                    hook: auth.hook
                }
            });
            const result = await reqeustWithAuth("POST /user/repos", {
                name: _name,
                private: _private == "true" ? true : false
            });
            _response.write(result.status.toString());
        }
        _response.end();
    }
})(GithubAPI = exports.GithubAPI || (exports.GithubAPI = {}));
//# sourceMappingURL=server.js.map