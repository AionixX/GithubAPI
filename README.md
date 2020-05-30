# GithubAPI

Übersicht über die Benutzung der Github REST API v3.

Benutzt wurde die Github eigene Library **octokit/rest.js** v17.

* [Dokumentation der GithubAPI](https://developer.github.com/v3/)
* [Dokumentation zu Octokit](https://octokit.github.io/rest.js/v17)

## Table of Content

* [Installieren der Libraries](#installieren-der-libraries)
* [Accesstoken Generierung](#accesstoken-generierung)
* [Authentifizierung](#authentifizierung)
* [Username](#username)
* [Repositories](#repositories)
* [Referenz auf ein Repository](#referenz-auf-ein-repository)
* [Struktur eines Repositories](#struktur-eines-repositories)
* [Dateien lesen](#dateien-lesen)
* [Dateien verändern oder erstellen](#dateien-verändern-oder-erstellen)
* [Dateien löschen](#dateien-löschen)

## Setup

Als erstes muss die App unter `Github -> Settings -> Developer settings -> OAuth Apps` registriert werden.
Dort wird eine **Client ID** und ein **Client Secret** vergeben. Diese werden benötigt um ein **Accesstoken** zu generieren.
Mit diesem Accesstoken werden dann Anfragen an Github für den Nutzer gestellt

> **_NOTE:_**  Der Accesstoken wird nur benötigt um auf private Repositories zuzugreifen. Wird außschließlich mit öffentlichen Repositories gearbeitet, sind diese Schritte überflüssig.


### Installieren der Libraries

*rest.js library:* 

```npm install @octokist/rest```

*Authentifizierungs library:* 

```npm install @octokit/auth```

## Benutzung

Alle Funktionen werden über einen *Server* aufgerufen. Zusätzliche Parameter können in der Github API nachgelesen werden.

### Accesstoken Generierung

Bevor Requests an Github gestellt werden können, muss ein Accesstoken für den User generiert werden. Dafür wird der User an Github weiter geleitet. 
Als Parameter werden die *Client ID* , der *State* und der *Scope* übergeben.


>**Client ID** Die ID welche bei der Registrierung der OAuth App vergeben wurde.

>**State** Ein zufällig generierter String der später von Github, zur Überprüfung, zurück gegeben wird.Wird ein anderer String zurück gegeben, sollte der Vorgang abgebrochen werden. Dadurch können Anfragen, nicht autorisierter Clients, nicht bearbeitet werden.

>**Scope** Ein String der angibt, welche Berechtigungen vom User erteilt werden sollen. Beispiel: `scope: "repo, user"`

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

Jetzt kann die App authentifiziert werden:
```typescript
const auth = createOAuthAppAuth({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET
});
```

Wurde die App erfolgreich authentifiziert, kann der erhaltene Code gegen ein Token ausgetauscht werden:

```typescript
const data: {} = await auth({
  type: "token",
  code: _code,
  state: _state
});

return data ? data.token : "Error";
```

Das erhaltene Token sollte am besten in einem Cookie o.ä. gespeichert werden, damit der User sich nicht jedes mal neu anmelden muss.

### Authentifizierung

Wurde der Accesstoken gespeichert können beliebig viele Anfragen gestellt werden (lediglich zeitlich begrenzt auf 5000/h). Für eine Anfrage wird ein *Octokit* Objekt erstellt, welches ein Accesstoken als Parameter nimmt. Diese Authentifizierung muss immer durchgeführt werden. Daher wird sie in nachfolgenden Beispielen weggelassen.

```typescript
const octokit = new Octokit({
  auth: acesstoken
});
```

### Username

```typescript
let name: string = (await octokit.users.getAuthenticated()).data.login;
```

### Repositories

Diese Funktion listet alle Repositories des Users auf. Gespeichert sind die Repositories in *data*.

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

### Struktur eines Repositories

```typescript
let getTree = await octokit.git.getTree({
  owner: name,
  repo: repoName,
  tree_sha: sha
});
```

>**_NOTE:_** Den *SHA* Code bekommt man aus der [Referenz](#referenz-auf-ein-repository) des Repositories

>**_NOTE:_** Diese Funktion liefert immer nur **eine** Ebene der Hierarchie. Werden weitere Ebenen benötigt, können diese mit der gleichen Funktion erhalten werden. Der *SHA* Code dazu wird in `getTree` mitgeliefert

### Dateien lesen

```typescript
const res = await octokit.repos.getContents({
  owner: name,
  repo: repoName,
  path: path
});
return res.data.download_url;
```

Mit der Funktion `getContents` werden alle Daten der angefragten Datei ausgeliefert. Wird lediglich der Inhalt der Datei benötigt, kann darauf mit `res.data.download_url` zugegriffen werden.

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