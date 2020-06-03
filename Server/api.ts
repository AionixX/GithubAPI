import * as HTTP from "http";
import * as Url from "url";
import { createOAuthAppAuth } from "@octokit/auth";
import { Octokit } from "@octokit/rest";

export interface AccessTokenData {
  type: string;
  tokenType: string;
  token: string;
  scopes: string[];
}

const CLIENT_ID: string = "47db66f43b3e5e0c0b25";
const CLIENT_SECRET: string = "d1abfd3be9efe995399faad6a2f947b2dc4149a9";
const SCOPE: string = "repo, user";

export namespace GithubAPI {

  let server: HTTP.Server = HTTP.createServer();
  let port: number | string | undefined = process.env.PORT;

  if (port == undefined)
    port = 5001;

  server.listen(port);
  server.addListener("request", handleRequest);

  async function handleRequest(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    if (_request.url) {

      _response.setHeader("Access-Control-Allow-Origin", "*");
      _response.setHeader("Content-Type", "json");

      let url: Url.UrlWithParsedQuery = Url.parse(_request.url, true);
      let action: string = <string>url.query["a"];
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
  async function createFile(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    let url: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);

    let at: string | null = url.query["at"] ? <string>url.query["at"] : null;
    let repoName: string | null = url.query["name"] ? <string>url.query["name"] : null;
    let repoPath: string | null = url.query["path"] ? <string>url.query["path"] : null;
    let fileName: string | null = url.query["fileName"] ? <string>url.query["fileName"] : null;

    if (!at || !repoName || !repoPath || !fileName)
      return;

    const octokit = new Octokit({
      auth: at
    });

    let name: string = (await octokit.users.getAuthenticated()).data.login;

    let res = await octokit.repos.createOrUpdateFile({
      owner: name,
      repo: repoName,
      path: repoPath + "/" + fileName,
      message: "create file",
      content: ""
    });

    _response.write(res.status.toString());
  }

  async function deleteFile(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    let url: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);

    let at: string | null = url.query["at"] ? <string>url.query["at"] : null;
    let repoName: string | null = url.query["name"] ? <string>url.query["name"] : null;
    let repoPath: string | null = url.query["path"] ? <string>url.query["path"] : null;

    if (!at || !repoName || !repoPath)
      return;

    const octokit = new Octokit({
      auth: at
    });

    let name: string = (await octokit.users.getAuthenticated()).data.login;

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

  async function updateFile(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    let url: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);

    let at: string | null = url.query["at"] ? <string>url.query["at"] : null;
    let repoName: string | null = url.query["name"] ? <string>url.query["name"] : null;
    let path: string | null = url.query["path"] ? <string>url.query["path"] : null;

    if (!at || !repoName || !path)
      return;

    let body: string = "";
    _request.on("data", (data) => {
      body += data;
    });

    const octokit = new Octokit({
      auth: at
    });

    let name: string = (await octokit.users.getAuthenticated()).data.login;

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

  async function getFile(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    let url: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);

    let at: string | null = url.query["at"] ? <string>url.query["at"] : null;
    let repoName: string | null = url.query["name"] ? <string>url.query["name"] : null;
    let path: string | null = url.query["path"] ? <string>url.query["path"] : null;
    let name: string | null = url.query["owner"] ? <string>url.query["owner"] : null;

    if (!at || !repoName || !path || !name)
      return;

    const octokit = new Octokit({
      auth: at
    });

    const res = await octokit.repos.getContents({
      owner: name,
      repo: repoName,
      path: path
    });

    _response.write(res.data.download_url);
  }

  async function getRepoList(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    let url: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);

    let at: string | null = url.query["at"] ? <string>url.query["at"] : null;
    if (at) {

      const octokit = new Octokit({
        auth: at
      });
      const result = await octokit.repos.listForAuthenticatedUser();

      _response.write(JSON.stringify(result.data));
    }
  }

  async function getTree(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    let url: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);

    let repoName: string | null = url.query["name"] ? <string>url.query["name"] : null;
    let sha: string | null = url.query["sha"] ? <string>url.query["sha"] : null;
    let at: string | null = url.query["at"] ? <string>url.query["at"] : null;
    let name: string | null = url.query["owner"] ? <string>url.query["owner"] : null;

    if (sha && at && repoName && name) {
      const octokit = new Octokit({
        auth: at
      });

      let getTree = await octokit.git.getTree({
        owner: name,
        repo: repoName,
        tree_sha: sha
      });
      _response.write(JSON.stringify(getTree.data.tree));
    }
  }

  async function getRepoTree(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    let url: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);

    let name: string | null = url.query["owner"] ? <string>url.query["owner"] : null;
    let repoName: string | null = url.query["name"] ? <string>url.query["name"] : null;
    let at: string | null = url.query["at"] ? <string>url.query["at"] : null;

    if (repoName && at && name) {
      const octokit = new Octokit({
        auth: at
      });

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

  async function auth(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse, _CLIENT_ID: string, _SCOPE: string): Promise<void> {
    let urlRequest: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);
    let state: string = <string>urlRequest.query["state"];
    let url: string = "https://github.com/login/oauth/authorize";
    let params: URLSearchParams = new URLSearchParams("client_id=" + _CLIENT_ID + "&state=" + state + "&scope=" + _SCOPE);
    url += "?" + params.toString();
    _response.writeHead(302, {
      "Location": url
    });
  }

  async function fetchToken(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    let url: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);

    let _code: string | null = url.query["code"] ? <string>url.query["code"] : null;
    let _state: string | null = url.query["state"] ? <string>url.query["state"] : null;

    if (_code && _state) {

      const auth = createOAuthAppAuth({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
      });
      const appAuthentication: {} = await auth({
        type: "token",
        code: _code,
        state: _state
      });

      let result: string = JSON.stringify(appAuthentication);
      let data: AccessTokenData = JSON.parse(result);

      _response.write(data ? data.token : "Err:#10001: No data available");
    }
    else {
      _response.write("Err:#10002: No token or state provided");
    }
  }

  async function fetchUsername(_request: HTTP.IncomingMessage, _response: HTTP.ServerResponse): Promise<void> {
    let url: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);

    let at: string | null = url.query["at"] ? <string>url.query["at"] : null;

    if (!at) {
      _response.write("Err:#10003: No token provided");
      return;
    }

    const octokit = new Octokit({
      auth: at
    });

    let name: string = (await octokit.users.getAuthenticated()).data.login;

    _response.write(name);
  }
}