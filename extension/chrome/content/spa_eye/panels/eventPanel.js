define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/lib/dom",
    "firebug/lib/css",
    "firebug/lib/events",
    "firebug/dom/domReps",

    "spa_eye/panels/basePanel"
],
    function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, DOMReps, BasePanel) {

        var eventPanel = Firebug.eventPanel = BasePanel.extend({
            name: "spa_eye:event",
            title: Locale.$STR("spa_eye.event.title"),

            parentPanel: "spa_eye",
            order: 1,

            show: function () {
                var win = this.context.window.wrappedJSObject;
                data = win.spa_eye.sequence;
                this.timeline.TIMELINE.replace({object:data}, this.panelNode);
            },

            onSequenceRecordCreated: function (record) {
                setTimeout(this.show, 2000, record);
            }
        });

// ********************************************************************************************* //
// Templates

        with (Domplate) {
            eventPanel.prototype.timeline = domplate(DOMReps.DirTablePlate, {
                TIMELINE: 
                    DIV(IFRAME({src:"chrome://spa_eye/content/panels/timeline.xul", 
                                width:"100%",
                                frameborder:"0"}),
                        HR(),
                        TAG("$tag", {object:"$data"})
                    )
                });
        }

// ********************************************************************************************* //
// Registration

        Firebug.registerPanel(eventPanel);
        return eventPanel;

// ********************************************************************************************* //

    });
