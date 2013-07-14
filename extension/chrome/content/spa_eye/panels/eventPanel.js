define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/lib/dom",
    "firebug/lib/css",
    "firebug/lib/events",
    "firebug/chrome/reps",
    "spa_eye/lib/uri"
],
function(Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, FirebugReps, URI){

    var eventPanel = Firebug.eventPanel = function(){}
    eventPanel.prototype = Obj.extend(Firebug.Panel, {
        name: "event",
        title: Locale.$STR("spa_eye.event.title"),

        parentPanel: "spa_eye",
        tag: Firebug.DOMPanel.DirTable.tag,
        order: 1,

        initialize: function() {
            //Firebug.registerUIListener(this);
            Firebug.Panel.initialize.apply(this, arguments);
        },

        destroy: function(state) {
            //Firebug.unRegisterUIListener(this);
            Firebug.Panel.destroy.apply(this, arguments);
        },
        
        showEvents: function(model, context) {
            if (!model) return;
            context.spa_eyeObj.currentEventModel = model;

            var win = this.context.window.wrappedJSObject;
            if(FBTrace.DBG_SPA_EYE){
                FBTrace.sysout("spa_eye; show events for model - "+model.cid, model);
            }
            var objectResult = model._events;
            objectResult && this.tag.replace({object: objectResult}, this.panelNode);
        },

        show: function() {
            var cm = this.context.spa_eyeObj.currentEventModel;
            if (!cm) {
                FirebugReps.Warning.tag.replace({object: "spa_eye.event.nomodelselected"}, this.panelNode);
            } else {
                this.showEvents(cm, this.context);
            }
        },

        getOptionsMenuItems: function(context){
            return [
                {
                    label: "spa_eye.all",
                    tooltiptext: "spa_eye.all",
                    command: function(){}
                },
                "-",
                {
                    label: "spa_eye.refresh",
                    tooltiptext: "spa_eye.refresh",
                    command: Obj.bindFixed(this.refresh, this)
                }
            ];
        },

        refresh: function(){}
    });

// ********************************************************************************************* //
// Templates

// ********************************************************************************************* //
// Registration

    Firebug.registerPanel(Firebug.eventPanel);
    return Firebug.eventPanel;

// ********************************************************************************************* //
    
});
