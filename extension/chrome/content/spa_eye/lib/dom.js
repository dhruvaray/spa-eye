/* See license.txt for terms of usage */

define([
    "firebug/lib/trace"
],
    function (FBTrace) {

// ********************************************************************************************* //
// Constants

        var DOM = {};

// ********************************************************************************************* //
// Module Implementation

        DOM.getMatchingNode = function (window, tag, tagbody) {
            var elements = window.document.getElementsByTagName(tag);
            for (var i = 0; i < elements.length; i++) {
                var val = elements[i].textContent;
                if (val == tagbody) {
                    return elements[i];
                }
            }
            return undefined;
        }

        DOM.appendExternalScriptTagToHead = function (document, path) {
            if (!/^(file|chrome|resource|data):/.test(path)) {
                throw Error('Invalid path');
            }
            var script = document.createElement("script");
            script.src = path;
            script.type = "text/javascript";
            script.async = false;
            document.head.appendChild(script);
        }

        DOM.getAllWebContextStyleSheets = function (document) {
            var links = document.getElementsByTagName("link");
            var hrefs = [];
            for (var i = 0; i < links.length; i++) {
                var href = links[i].getAttribute("href");
                href && hrefs.push(href);
            }
            return hrefs;
        }

        return DOM;
    });
