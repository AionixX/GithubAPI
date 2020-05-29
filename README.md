# GithubAPI

Übersicht über die Benutzung der Github REST API v3.

Benutzt wurde die Github eigene Libary **octokit/rest.js** v17.

* [Dokumentation der GithubAPI](https://developer.github.com/v3/)
* [Dokumentation zu Octokit](https://octokit.github.io/rest.js/v17)

## Table of Content

* [Installieren der Libarys](#installieren-der-libarys)
* [Accesstoken generierung](#accesstoken-generierung)
* [Authentifizierung](#authentifizierung)
* [Username](#username)
* [Repositorys](#repositorys)
* [Referenz auf ein Repository](#referenz-auf-ein-repository)
* [Struktur eines Repositorys](#struktur-eines-repositorys)
* [Dateien lesen](#dateien-lesen)
* [Dateien verändern oder erstellen](#dateien-verändern-oder-erstellen)
* [Dateien löschen](#dateien-löschen)

## Setup

Als erstes muss man seine App unter `Github -> Settings -> Developer settings -> OAuth Apps` registrieren.
Dort bekommt man dann eine **Client ID** und ein **Client Secret**. Diese braucht man um ein **Accesstoken** zu generieren.
Mit diesem Accesstoken werden dann anfragen an Github für den Nutzer gestellt

> **_NOTE:_**  Den Accesstoken braucht man nur um auf private Repository zuzugreifen. Arbeitet man außschließlich mit öffentlichen Repositorys sind diese Schritte überflüssig.


### Installieren der Libarys

*rest.js* libary:

```npm install @octokist/rest```

*authentifizierungs* libary:

```npm install @octokit/auth```

## Benutzung

Alle funktionen werden über einen *Server* aufgerufen. Zusätzliche Parameter können in der Github API nachgelesen werden.

### Accesstoken generierung

Bevor man irgendwelche Requests an Github stellen kann, muss man einen Accesstoken für den User generieren. Dafür leitet man den User an Github weiter. 
Als Parameter werden die *Client ID* , der *State* und der *Scope* übergeben.


>**Client ID** Die ID welche man bei der registrierung der OAuth App bekommen hat

>**State** Ein zufällig generierter String. Diesen bekommt man von Github später wieder zurück. Wenn man einen anderen String zurück bekommt sollte man den Vorgang abbrechen. Dies hat den Effekt das anfragen von nicht authorisierten Clients nicht bearbeitet werden.

>**Scope** Ein String welcher Github mitteilt welche Berechtigungen vom User bestätigt werden sollen. Beispiel: `scope: "repo, user"`

```typescript
let url: string = "https://github.com/login/oauth/authorize";
let params: URLSearchParams = new URLSearchParams("client_id=" + _CLIENT_ID + "&state=" + state + "&scope=" + _SCOPE);
url += "?" + params.toString();
_response.writeHead(302, {
  "Location": url
});
```

Nach erfolgreicher Autorisierung leitet Github den User an eine *Callback* Seite weiter. Diese hat man im Registrierungsprozess angegeben. Sie ist nachträglich auch änderbar.
Als Parameter werden ein **Code** und der zuvor übergebene **State** mit angegeben.

Jetzt kann man die App authentifizieren:
```typescript
const auth = createOAuthAppAuth({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET
});
```

Wurde die App erfolgreich authentifiziert kann der erhaltene Code gegen ein Token ausgetauscht werden:

```typescript
const data: {} = await auth({
  type: "token",
  code: _code,
  state: _state
});

return data ? data.token : "Error";
```

Das erhaltene Token sollte am besten in einem Cookie o.ä. gespeichert werden, damit der User sich nicht jedes mal neu bei Github anmelden muss.

### Authentifizierung

Wurde der Accesstoken gespeichert kann man damit beliebig viele Anfragen stellen (lediglich zeitlich begrenzt auf 5000/h). Für eine Anfrage wird ein *Octokit* Objekt erstellt welches ein Accesstoken als Parameter nimmt. Diese Authentifizierung muss immer gemacht werden, weshalt sie in nachfolgenden Beispielen nicht immer wieder aufgezeigt wird.

```typescript
const octokit = new Octokit({
  auth: acesstoken
});
```

### Username

```typescript
let name: string = (await octokit.users.getAuthenticated()).data.login;
```

### Repositorys

Diese Funktion listet alle Repositorys des Users auf. Gespeichert sind die Repos in *data*.

```typescript
const result = await octokit.repos.listForAuthenticatedUser();

return result.data;
```

### Referenz auf ein Repository

```typescript
let ref = await octokit.git.getRef({
  owner: name,
  repo: repoName,
  ref: "heads/master"
});
```

### Struktur eines Repositorys

```typescript
let getTree = await octokit.git.getTree({
  owner: name,
  repo: repoName,
  tree_sha: sha
});
```

>**_NOTE:_** Den *SHA* code bekommt man aus der [Referenz](#referenz-auf-ein-repository) des Repositorys

>**_NOTE:_** Mit dieser Funktion bekommt man immer nur **eine** Ebene der Hierarchie. Möchte man weitere Elemente, welche tiefer in der Hierarchie sind kann man diese mit der gleichen Funktion erhalten. Den *SHA* Code dafür bekommt man in `getTree` mitgeliefert

### Dateien lesen

```typescript
const res = await octokit.repos.getContents({
  owner: name,
  repo: repoName,
  path: path
});
return res.data.download_url;
```

Mit der Funktion `getContents` bekommt man eine menge Daten zur angefragten Datei. Möchte man den Inhalt der datei kann man darauf mit `res.data.download_url` zugreifen.

### Dateien verändern oder erstellen

```typescript
let res = await octokit.repos.createOrUpdateFile({
  owner: name,
  repo: repoName,
  path: repoPath + "/" + fileName,
  message: "create file",
  content: "This is brand new content"
});
```

Die Funktion `createOrUpdateFile` schreibt die Daten, welche in `content` mit gegeben werden in eine Datei mit dem angegebenen Pfad und Dateinamen. Existiert diese Datei nicht wird eine neue erstellt.

### Dateien löschen

```typescript
let res = await octokit.request("DELETE /repos/:owner/:repo/contents/:path", {
  owner: name,
  repo: repoName,
  path: repoPath,
  sha: data.sha,
  message: "delte"
});
```

>**_NOTE:_** Es können Anfragen aller Art (auch Anfragen welche hier mit anderen Funktionen vorgestellt wurden) über einen `request` geschickt werden.