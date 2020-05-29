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
    /*
    Legend:
    a                 = action
    auth              = Send user to Github to authenticate
    fetchToken        = Exchange a code to get a personal accesstoken
    */
    async function handleRequest(_request, _response) {
        if (_request.url) {
            _response.setHeader("Access-Control-Allow-Origin", "*");
            _response.setHeader("Content-Type", "json");
            let url = Url.parse(_request.url, true);
            let action = url.query["a"];
            if (action) {
                switch (action) {
                    case "auth":
                        await auth(_request, _response, CLIENT_ID, SCOPE);
                        break;
                    case "fetchToken":
                        await fetchToken(_request, _response);
                        break;
                    case "fetchUsername":
                        await fetchUsername(_request, _response);
                        break;
                    case "getAllRepos":
                        await getRepoList(_request, _response);
                        break;
                    case "getRepoTree":
                        await getRepoTree(_request, _response);
                        break;
                    case "getTree":
                        await getTree(_request, _response);
                        break;
                    case "getFile":
                        await getFile(_request, _response);
                        break;
                    case "updateFile":
                        await updateFile(_request, _response);
                        break;
                    case "deleteFile":
                        await deleteFile(_request, _response);
                        break;
                    case "createFile":
                        await createFile(_request, _response);
                        break;
                }
            }
        }
        _response.end();
    }
    async function createFile(_request, _response) {
        let url = Url.parse(_request.url, true);
        let at = url.query["at"] ? url.query["at"] : null;
        let repoName = url.query["name"] ? url.query["name"] : null;
        let repoPath = url.query["path"] ? url.query["path"] : null;
        let fileName = url.query["fileName"] ? url.query["fileName"] : null;
        if (!at || !repoName || !repoPath || !fileName)
            return;
        const octokit = new rest_1.Octokit({
            auth: at
        });
        let name = (await octokit.users.getAuthenticated()).data.login;
        let res = await octokit.repos.createOrUpdateFile({
            owner: name,
            repo: repoName,
            path: repoPath + "/" + fileName,
            message: "create file",
            content: ""
        });
        _response.write(res.status.toString());
    }
    async function deleteFile(_request, _response) {
        let url = Url.parse(_request.url, true);
        let at = url.query["at"] ? url.query["at"] : null;
        let repoName = url.query["name"] ? url.query["name"] : null;
        let repoPath = url.query["path"] ? url.query["path"] : null;
        if (!at || !repoName || !repoPath)
            return;
        const octokit = new rest_1.Octokit({
            auth: at
        });
        let name = (await octokit.users.getAuthenticated()).data.login;
        const res = await octokit.repos.getContents({
            owner: name,
            repo: repoName,
            path: repoPath
        });
        console.log("DELETE /repos/" + name + "/" + repoPath);
        let nres = await octokit.request("DELETE /repos/:owner/:repo/contents/:path", {
            owner: name,
            repo: repoName,
            path: repoPath,
            sha: res.data.sha,
            message: "delte"
        });
        _response.write(nres.status.toString());
    }
    async function updateFile(_request, _response) {
        let url = Url.parse(_request.url, true);
        let at = url.query["at"] ? url.query["at"] : null;
        let repoName = url.query["name"] ? url.query["name"] : null;
        let path = url.query["path"] ? url.query["path"] : null;
        if (!at || !repoName || !path)
            return;
        let body = "";
        _request.on("data", (data) => {
            body += data;
        });
        const octokit = new rest_1.Octokit({
            auth: at
        });
        let name = (await octokit.users.getAuthenticated()).data.login;
        let ref = await octokit.git.getRef({
            owner: name,
            repo: repoName,
            ref: "heads/master"
        });
        let createBlob = await octokit.git.createBlob({
            owner: name,
            repo: repoName,
            content: body
        });
        let getTree = await octokit.git.getTree({
            owner: name,
            repo: repoName,
            tree_sha: ref.data.object.sha
        });
        let createTree = await octokit.git.createTree({
            owner: name,
            repo: repoName,
            tree: [
                {
                    path: path,
                    mode: "100644",
                    type: "blob",
                    sha: createBlob.data.sha
                }
            ],
            base_tree: getTree.data.sha
        });
        let commit = await octokit.git.createCommit({
            owner: name,
            repo: repoName,
            message: "Commit",
            tree: createTree.data.sha,
            parents: [getTree.data.sha]
        });
        let res = await octokit.git.updateRef({
            owner: name,
            repo: repoName,
            ref: "heads/master",
            sha: commit.data.sha
        });
        _response.write(res.status.toString());
    }
    async function getFile(_request, _response) {
        let url = Url.parse(_request.url, true);
        let at = url.query["at"] ? url.query["at"] : null;
        let repoName = url.query["name"] ? url.query["name"] : null;
        let path = url.query["path"] ? url.query["path"] : null;
        let name = url.query["owner"] ? url.query["owner"] : null;
        if (!at || !repoName || !path || !name)
            return;
        const octokit = new rest_1.Octokit({
            auth: at
        });
        //let name: string = (await octokit.users.getAuthenticated()).data.login;
        const res = await octokit.repos.getContents({
            owner: name,
            repo: repoName,
            path: path
        });
        _response.write(res.data.download_url);
    }
    async function getRepoList(_request, _response) {
        let url = Url.parse(_request.url, true);
        let at = url.query["at"] ? url.query["at"] : null;
        if (at) {
            const octokit = new rest_1.Octokit({
                auth: at
            });
            const result = await octokit.repos.listForAuthenticatedUser();
            _response.write(JSON.stringify(result.data));
        }
    }
    async function getTree(_request, _response) {
        let url = Url.parse(_request.url, true);
        let repoName = url.query["name"] ? url.query["name"] : null;
        let sha = url.query["sha"] ? url.query["sha"] : null;
        let at = url.query["at"] ? url.query["at"] : null;
        let name = url.query["owner"] ? url.query["owner"] : null;
        if (sha && at && repoName && name) {
            const octokit = new rest_1.Octokit({
                auth: at
            });
            //let name: string = (await octokit.users.getAuthenticated()).data.login;
            let getTree = await octokit.git.getTree({
                owner: name,
                repo: repoName,
                tree_sha: sha
            });
            _response.write(JSON.stringify(getTree.data.tree));
        }
    }
    async function getRepoTree(_request, _response) {
        let url = Url.parse(_request.url, true);
        let name = url.query["owner"] ? url.query["owner"] : null;
        let repoName = url.query["name"] ? url.query["name"] : null;
        let at = url.query["at"] ? url.query["at"] : null;
        if (repoName && at && name) {
            const octokit = new rest_1.Octokit({
                auth: at
            });
            //let name: string = (await octokit.users.getAuthenticated()).data.login;
            let ref = await octokit.git.getRef({
                owner: name,
                repo: repoName,
                ref: "heads/master"
            });
            let getTree = await octokit.git.getTree({
                owner: name,
                repo: repoName,
                tree_sha: ref.data.object.sha
            });
            _response.write(JSON.stringify(getTree.data.tree));
        }
    }
    async function auth(_request, _response, _CLIENT_ID, _SCOPE) {
        let urlRequest = Url.parse(_request.url, true);
        let state = urlRequest.query["state"];
        let url = "https://github.com/login/oauth/authorize";
        let params = new URLSearchParams("client_id=" + _CLIENT_ID + "&state=" + state + "&scope=" + _SCOPE);
        url += "?" + params.toString();
        _response.writeHead(302, {
            "Location": url
        });
    }
    async function fetchToken(_request, _response) {
        let url = Url.parse(_request.url, true);
        let _code = url.query["code"] ? url.query["code"] : null;
        let _state = url.query["state"] ? url.query["state"] : null;
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
            /*let result: string = JSON.stringify(appAuthentication);
            let data: AccessTokenData = JSON.parse(result);*/
            _response.write(appAuthentication ? appAuthentication.token : "Err:#10001: No data available");
        }
        else {
            _response.write("Err:#10002: No token or state provided");
        }
    }
    async function fetchUsername(_request, _response) {
        let url = Url.parse(_request.url, true);
        let at = url.query["at"] ? url.query["at"] : null;
        if (!at) {
            _response.write("Err:#10003: No token provided");
            return;
        }
        const octokit = new rest_1.Octokit({
            auth: at
        });
        let name = (await octokit.users.getAuthenticated()).data.login;
        _response.write(name);
    }
})(GithubAPI = exports.GithubAPI || (exports.GithubAPI = {}));
//# sourceMappingURL=api.js.map