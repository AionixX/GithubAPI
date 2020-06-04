"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HTTP = require("http");
const Url = require("url");
const auth_1 = require("@octokit/auth");
const rest_1 = require("@octokit/rest");
const CLIENT_ID = "47db66f43b3e5e0c0b25";
const CLIENT_SECRET = "d1abfd3be9efe995399faad6a2f947b2dc4149a9";
const SCOPE = "repo, user";
var GithubAPI;
(function (GithubAPI) {
    let server = HTTP.createServer();
    let port = process.env.PORT;
    if (port == undefined)
        port = 5001;
    server.listen(port);
    server.addListener("request", handleRequest);
    async function handleRequest(_request, _response) {
        if (_request.url) {
            _response.setHeader("Access-Control-Allow-Origin", "*");
            _response.setHeader("Content-Type", "json");
            let url = Url.parse(_request.url, true); // try convert to global json-object to use in subsequent functions
            let parameters = getParameters(url);
            console.log(parameters);
            if (parameters.action) {
                switch (parameters.action) {
                    case "auth":
                        await auth(_request, _response, CLIENT_ID, SCOPE, parameters);
                        break;
                    case "fetchToken":
                        await fetchToken(_request, _response, parameters);
                        break;
                    case "fetchUsername":
                        await fetchUsername(_request, _response, parameters);
                        break;
                    case "getAllRepos":
                        await getRepoList(_request, _response, parameters);
                        break;
                    case "getRepoTree":
                        await getRepoTree(_request, _response, parameters);
                        break;
                    case "getTree":
                        await getTree(_request, _response, parameters);
                        break;
                    case "getFile":
                        await getFile(_request, _response, parameters);
                        break;
                    case "updateFile":
                        await updateFile(_request, _response, parameters);
                        break;
                    case "deleteFile":
                        await deleteFile(_request, _response, parameters);
                        break;
                    case "createFile":
                        await createFile(_request, _response, parameters);
                        break;
                }
            }
        }
        _response.end();
    }
    function getParameters(_url) {
        let parameters = {
            action: _url.query["a"] ? _url.query["a"] : null,
            at: _url.query["at"] ? _url.query["at"] : null,
            repoName: _url.query["name"] ? _url.query["name"] : null,
            repoPath: _url.query["path"] ? _url.query["path"] : null,
            fileName: _url.query["fileName"] ? _url.query["fileName"] : null,
            path: _url.query["path"] ? _url.query["path"] : null,
            name: _url.query["owner"] ? _url.query["owner"] : null,
            sha: _url.query["sha"] ? _url.query["sha"] : null,
            state: _url.query["state"] ? _url.query["state"] : null,
            code: _url.query["code"] ? _url.query["code"] : null
        };
        return parameters;
    }
    async function createFile(_request, _response, _parameters) {
        if (!_parameters.at || !_parameters.repoName || !_parameters.repoPath || !_parameters.fileName)
            return;
        const octokit = new rest_1.Octokit({
            auth: _parameters.at
        });
        let name = (await octokit.users.getAuthenticated()).data.login;
        let res = await octokit.repos.createOrUpdateFile({
            owner: name,
            repo: _parameters.repoName,
            path: _parameters.repoPath + "/" + _parameters.fileName,
            message: "create file",
            content: ""
        });
        _response.write(res.status.toString());
    }
    async function deleteFile(_request, _response, _parameters) {
        if (!_parameters.at || !_parameters.repoName || !_parameters.repoPath)
            return;
        const octokit = new rest_1.Octokit({
            auth: _parameters.at
        });
        let name = (await octokit.users.getAuthenticated()).data.login;
        const res = await octokit.repos.getContents({
            owner: name,
            repo: _parameters.repoName,
            path: _parameters.repoPath
        });
        console.log("DELETE /repos/" + name + "/" + _parameters.repoPath);
        let nres = await octokit.request("DELETE /repos/:owner/:repo/contents/:path", {
            owner: name,
            repo: _parameters.repoName,
            path: _parameters.repoPath,
            sha: res.data.sha,
            message: "delte"
        });
        _response.write(nres.status.toString());
    }
    async function updateFile(_request, _response, _parameters) {
        if (!_parameters.at || !_parameters.repoName || !_parameters.path)
            return;
        let body = "";
        _request.on("data", (data) => {
            body += data;
        });
        const octokit = new rest_1.Octokit({
            auth: _parameters.at
        });
        let name = (await octokit.users.getAuthenticated()).data.login;
        let ref = await octokit.git.getRef({
            owner: name,
            repo: _parameters.repoName,
            ref: "heads/master"
        });
        let createBlob = await octokit.git.createBlob({
            owner: name,
            repo: _parameters.repoName,
            content: body
        });
        let getTree = await octokit.git.getTree({
            owner: name,
            repo: _parameters.repoName,
            tree_sha: ref.data.object.sha
        });
        let createTree = await octokit.git.createTree({
            owner: name,
            repo: _parameters.repoName,
            tree: [
                {
                    path: _parameters.path,
                    mode: "100644",
                    type: "blob",
                    sha: createBlob.data.sha
                }
            ],
            base_tree: getTree.data.sha
        });
        let commit = await octokit.git.createCommit({
            owner: name,
            repo: _parameters.repoName,
            message: "Commit",
            tree: createTree.data.sha,
            parents: [getTree.data.sha]
        });
        let res = await octokit.git.updateRef({
            owner: name,
            repo: _parameters.repoName,
            ref: "heads/master",
            sha: commit.data.sha
        });
        _response.write(res.status.toString());
    }
    async function getFile(_request, _response, _parameters) {
        if (!_parameters.at || !_parameters.repoName || !_parameters.path || !_parameters.name)
            return;
        const octokit = new rest_1.Octokit({
            auth: _parameters.at
        });
        const res = await octokit.repos.getContents({
            owner: _parameters.name.trim(),
            repo: _parameters.repoName,
            path: "/" + _parameters.path
        });
        _response.write(res.data.download_url);
    }
    async function getRepoList(_request, _response, _parameters) {
        if (_parameters.at) {
            const octokit = new rest_1.Octokit({
                auth: _parameters.at
            });
            const result = await octokit.repos.listForAuthenticatedUser();
            _response.write(JSON.stringify(result.data));
        }
    }
    async function getTree(_request, _response, _parameters) {
        if (_parameters.sha && _parameters.at && _parameters.repoName && _parameters.name) {
            const octokit = new rest_1.Octokit({
                auth: _parameters.at
            });
            let getTree = await octokit.git.getTree({
                owner: _parameters.name,
                repo: _parameters.repoName,
                tree_sha: _parameters.sha
            });
            _response.write(JSON.stringify(getTree.data.tree));
        }
    }
    async function getRepoTree(_request, _response, _parameters) {
        if (_parameters.repoName && _parameters.at && _parameters.name) {
            const octokit = new rest_1.Octokit({
                auth: _parameters.at
            });
            let ref = await octokit.git.getRef({
                owner: _parameters.name,
                repo: _parameters.repoName,
                ref: "heads/master"
            });
            let getTree = await octokit.git.getTree({
                owner: _parameters.name,
                repo: _parameters.repoName,
                tree_sha: ref.data.object.sha
            });
            _response.write(JSON.stringify(getTree.data.tree));
        }
    }
    async function auth(_request, _response, _CLIENT_ID, _SCOPE, _parameters) {
        if (!_parameters.state)
            return;
        let url = "https://github.com/login/oauth/authorize";
        let params = new URLSearchParams("client_id=" + _CLIENT_ID + "&state=" + _parameters.state + "&scope=" + _SCOPE);
        url += "?" + params.toString();
        _response.writeHead(302, {
            "Location": url
        });
    }
    async function fetchToken(_request, _response, _parameters) {
        if (_parameters.code && _parameters.state) {
            const auth = auth_1.createOAuthAppAuth({
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET
            });
            const appAuthentication = await auth({
                type: "token",
                code: _parameters.code,
                state: _parameters.state
            });
            let result = JSON.stringify(appAuthentication);
            let data = JSON.parse(result);
            _response.write(data ? data.token : "Err:#10001: No data available");
        }
        else {
            _response.write("Err:#10002: No token or state provided");
        }
    }
    async function fetchUsername(_request, _response, _parameters) {
        if (!_parameters.at) {
            _response.write("Err:#10003: No token provided");
            return;
        }
        const octokit = new rest_1.Octokit({
            auth: _parameters.at
        });
        let name = (await octokit.users.getAuthenticated()).data.login;
        _response.write(name);
    }
})(GithubAPI = exports.GithubAPI || (exports.GithubAPI = {}));
//# sourceMappingURL=api.js.map