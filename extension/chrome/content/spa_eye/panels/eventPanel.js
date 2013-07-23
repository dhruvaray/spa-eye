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
    function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, DOMReps) {

        var eventPanel = Firebug.eventPanel = function () {
        }
        eventPanel.prototype = Obj.extend(Firebug.Panel, {
            name:"spa_eye:event",
            title:Locale.$STR("spa_eye.event.title"),

            parentPanel:"spa_eye",
            order:1,

            initialize:function () {
                Firebug.Panel.initialize.apply(this, arguments);
                var listener = this.context.spa_eyeObj._spaHook.listener;
                listener.addListener(this);
            },

            destroy:function (state) {
                Firebug.Panel.destroy.apply(this, arguments);
            },

            showEvents:function (value, context) {
                var win = this.context.window.wrappedJSObject;
                this.show(value.cid ? win.spa_eye.sequence[value.cid] : {});
            },

            show:function (data) {
                data = data || {};
                Firebug.eventPanel.prototype.timeline.TIMELINE.replace({object:data}, this.panelNode);
            },


            onSequenceRecordCreated:function (record) {
                setTimeout(this.show, 2000, record);
            }

        });

// ********************************************************************************************* //
// Templates

        with (Domplate) {
            Firebug.eventPanel.prototype.timeline = domplate(DOMReps.DirTablePlate, {
                TIMELINE:DIV(
                    IFRAME({src:"chrome://spa_eye/content/panels/timeline.xul?data=$object|format", width:"100%", frameborder:"0"}),
                    HR(),
                    TAG("$tag", {object:"$object"}
                    )),
                format:function (d) {
                    return JSON.stringify(d);
                }
            });
        }

// ********************************************************************************************* //
// Registration

        Firebug.registerPanel(Firebug.eventPanel);
        return Firebug.eventPanel;

// ********************************************************************************************* //

    });
