import * as HTTP from "http";
import * as Url from "url";

export namespace GithubAPI {
  export async function auth(_response: HTTP.ServerResponse, _request: HTTP.IncomingMessage, _CLIENT_ID: string, _SCOPE: string): Promise<void> {
    let urlRequest: Url.UrlWithParsedQuery = Url.parse(<string>_request.url, true);
    let state: string = <string>urlRequest.query["state"];
    let url: string = "https://github.com/login/oauth/authorize";
    let params: URLSearchParams = new URLSearchParams("client_id=" + _CLIENT_ID + "&state=" + state + "&scope=" + _SCOPE);
    url += "?" + params.toString();
    _response.writeHead(302, {
      "Location": url
    });
    _response.end();
  }
}