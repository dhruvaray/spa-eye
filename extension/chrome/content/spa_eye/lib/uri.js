/* See license.txt for terms of usage */

define([
    "firebug/lib/trace",
    "spa_eye/lib/sha"
],
function(FBTrace, SHA) {

// ********************************************************************************************* //
// Constants

        var URI = {};

// ********************************************************************************************* //
// Module Implementation

        URI.getEndPoint = function(url){
            /*var tokens = url.split('/');
            return tokens.length > 0 ? tokens[tokens.length-1] : url;*/
            return encodeURIComponent(SHA.getTextHash(Firebug.currentContext.uid+url));
        }

// ********************************************************************************************* //
// Registration

        return URI;

// ********************************************************************************************* //
    });
