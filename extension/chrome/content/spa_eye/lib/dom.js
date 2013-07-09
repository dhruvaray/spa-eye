/* See license.txt for terms of usage */

define([
    "firebug/lib/trace"
],
    function(FBTrace) {

// ********************************************************************************************* //
// Constants

        const Cc = Components.classes;
        const Ci = Components.interfaces;
        const Cr = Components.results;

        var DOM = {};

// ********************************************************************************************* //
// Module Implementation

        DOM.getMatchingNode = function(window,tag,tagbody){
            var elements = window.document.getElementsByTagName(tag);
            for (var i = 0; i < elements.length; i++) {
                var val = elements[i].textContent
                if ( val == tagbody ) {
                    return elements[i];
                }
            }
            return undefined;
        }

        DOM.appendExternalScriptTagToBody = function(document, path){
            var script = document.createElement("script");
            script.src=path;
            script.type="text/javascript"
            document.body.appendChild(script);
        }


// ********************************************************************************************* //
// Registration

        return DOM;

// ********************************************************************************************* //
    });
