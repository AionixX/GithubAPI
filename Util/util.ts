namespace GithubAPI {

  export interface Repo {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  }

  export interface Tree {
    elements: TreeElement[];
  }

  export interface TreeElement {
    mode: string;
    path: string;
    sha: string;
    size: number;
    type: string;
  }

  export function getCookie(name: string): string | undefined {
    const value: string = "; " + document.cookie;
    const parts: string[] = value.split("; " + name + "=");

    if (parts.length == 2) {
      return parts.pop()?.split(";").shift();
    }
    return undefined;
  }

  export function setCookie(_name: string, _val: string): void {
    const date: Date = new Date();
    const value: string = _val;

    // Set it expire in 7 days
    date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));

    // Set it
    document.cookie = _name + "=" + value + "; expires=" + date.toUTCString() + "; path=/";
  }
  export function generateAndSaveState(_lenght: number): string {
    let state: string = generateState(_lenght);
    setCookie("state", state);
    return state;
  }

  export function deleteCookie(_name: string): void {
    const date: Date = new Date();
    date.setTime(date.getTime() - 1000);
    
    document.cookie = _name + "=" + "; expires=" + date.toUTCString() + "; path=/";  // use string template
  }
  
  function generateState(_length: number): string {
    let result: string = "";
    let characters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";  // char functions exist
    let charactersLength: number = characters.length;
    for (let i: number = 0; i < _length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
