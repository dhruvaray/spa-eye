define([
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/lib/dom",
    "firebug/lib/css",
    "firebug/lib/events",
    "firebug/chrome/reps",
    "firebug/chrome/tableRep",

    "spa_eye/lib/dom"
],
function(Obj, FBTrace, Locale, Domplate, Dom, Css, Events, FirebugReps, TableRep, DomUtil){

// ********************************************************************************************* //

    var viewPanel = Firebug.viewPanel = function(){}


    viewPanel.prototype = Obj.extend(Firebug.Panel, {
        name: "view",
        title: Locale.$STR("spa_eye.script.view.title"),

        parentPanel: "script",
        order: 4,

        initialize: function(){
            Firebug.Panel.initialize.apply(this, arguments);
        },

        destroy: function(state){
            Firebug.Panel.destroy.apply(this, arguments);
        },

        updateSelection: function(frame)
        {
            // this method is called while the debugger has halted JS,
            // so failures don't show up in FBS_ERRORS
            try
            {
                this.show(frame);
            }
            catch (exc)
            {
                if (FBTrace.DBG_ERRORS && FBTrace.DBG_STACK)
                    FBTrace.sysout("updateSelection FAILS " + exc, exc);
            }
        },

        show: function(){
            var partial = Locale.$STR("spa_eye.view.noview");
            var source ="__p";

            Firebug.CommandLine.evaluate(source, this.context, null, this.context.getCurrentGlobal(),
                function success(result, context)
                {
                    partial = result;
                },
                function failed(result, context)
                {
                    var exc = result;
                    if (exc.source !== source || exc.name !== "ReferenceError")
                        partial = exc.message;
                }
            );

            //this.registerAppStyleSheets();
            this.panelNode.innerHTML = partial;
            //this.unregisterAppStyleSheets();
        },

        registerAppStyleSheets : function(){
            var hrefs = DomUtil.getAllWebContextStyleSheets(this.context.window.document);
            for (var i = 0; i < hrefs.length; i++)
                Firebug.registerStylesheet(hrefs[i]);
        },

        unregisterAppStyleSheets : function(){
            var hrefs = DomUtil.getAllWebContextStyleSheets(this.context.window.document);
            for (var i = 0; i < hrefs.length; i++)
                Firebug.unregisterStylesheet(hrefs[i]);
        }

    });


// ********************************************************************************************* //
// Registration

    Firebug.registerPanel(Firebug.viewPanel);
    return Firebug.viewPanel;

// ********************************************************************************************* //
    
});
