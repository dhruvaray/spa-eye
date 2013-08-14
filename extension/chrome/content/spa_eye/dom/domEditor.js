/* See license.txt for terms of usage */

define([
    "firebug/firebug",
    "firebug/lib/trace",
    "firebug/lib/events",
    "firebug/lib/domplate",
    "firebug/lib/dom",
    "firebug/lib/css",
    "firebug/lib/string"
],
function (Firebug, FBTrace, Events, D, Dom, Css, Str) {
    if (/^1\.12/.test(Firebug.version)) {
        try{
            return require("firebug/dom/domEditor");
        } catch(e) {
            FBTrace.sysout("spa_eye; DomEditor load error", e);
        }
    }

    // ********************************************************************************************* //
    // DOM Inline Editor

    function DOMEditor(doc) {
        this.box = this.tag.replace({}, doc, this);
        this.input = this.box.childNodes[1];

        var completionBox = this.box.childNodes[0];
        var options = {
            includeCurrentScope: true
        };

        this.setupCompleter(completionBox, options);
    }

    DOMEditor.prototype = D.domplate(Firebug.JSEditor.prototype, {
        tag:
            D.DIV({style: "position: absolute;"},
                D.INPUT({"class": "fixedWidthEditor completionBox", type: "text",
                    tabindex: "-1"}),
                D.INPUT({"class": "fixedWidthEditor completionInput", type: "text",
                    oninput: "$onInput", onkeypress: "$onKeyPress"})),

        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

        endEditing: function(target, value, cancel) {
            delete this.panel.context.thisValue;

            if (cancel || value === "")
                return;

            var row = Dom.getAncestorByClass(target, "memberRow");

            Events.dispatch(this.panel.fbListeners, "onWatchEndEditing", [this.panel]);

            if (!row)
                this.panel.addWatch(value);
            else if (Css.hasClass(row, "watchRow"))
                this.panel.setWatchValue(row, value);
            else
                this.panel.setPropertyValue(row, value);
        }
    });

    // ********************************************************************************************* //
    // Registration

    return DOMEditor;

    // ********************************************************************************************* //
});
