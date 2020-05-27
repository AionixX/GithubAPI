"use strict";
var GithubAPI;
(function (GithubAPI) {
    function getCookie(name) {
        const value = "; " + document.cookie;
        const parts = value.split("; " + name + "=");
        if (parts.length == 2) {
            return parts.pop()?.split(";").shift();
        }
        return undefined;
    }
    GithubAPI.getCookie = getCookie;
    function setCookie(name, val) {
        const date = new Date();
        const value = val;
        // Set it expire in 7 days
        date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
        // Set it
        document.cookie = name + "=" + value + "; expires=" + date.toUTCString() + "; path=/";
    }
    GithubAPI.setCookie = setCookie;
    function generateAndSaveState(_lenght) {
        let state = generateState(_lenght);
        setCookie("state", state);
        return state;
    }
    GithubAPI.generateAndSaveState = generateAndSaveState;
    function deleteCookie(_name) {
        const date = new Date();
        date.setTime(date.getTime() - 1000);
        document.cookie = _name + "=" + "; expires=" + date.toUTCString() + "; path=/";
    }
    GithubAPI.deleteCookie = deleteCookie;
    function generateState(_length) {
        let result = "";
        let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let charactersLength = characters.length;
        for (let i = 0; i < _length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
})(GithubAPI || (GithubAPI = {}));
//# sourceMappingURL=util.js.map