/* See license.txt for terms of usage */

define([
    "firebug/lib/trace",
    "spa_eye/lib/sha"
],
    function (FBTrace, SHA) {

        var URI = {};

        URI.getEndPoint = function (url) {
            /*var tokens = url.split('/');
             return tokens.length > 0 ? tokens[tokens.length-1] : url;*/
            return encodeURIComponent(SHA.getTextHash(Firebug.currentContext.uid + url));
        }
        return URI;
    });
