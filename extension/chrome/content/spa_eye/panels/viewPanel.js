define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "spa_eye/panels/basePanel"
],
function (Firebug, Obj, FBTrace, Locale) {


        var viewPanel = Firebug.viewPanel = function () {
        };


        viewPanel.prototype = Obj.extend(Firebug.Panel, {
            name:"view",
            title:Locale.$STR("spa_eye.script.view.title"),

            parentPanel:"script",
            order:4,

            initialize:function () {
                Firebug.Panel.initialize.apply(this, arguments);
            },

            destroy:function (state) {
                Firebug.Panel.destroy.apply(this, arguments);
            },

            updateSelection:function (frame) {
                // this method is called while the debugger has halted JS,
                // so failures don't show up in FBS_ERRORS
                try {
                    this.show(frame);
                }
                catch (exc) {
                    if (FBTrace.DBG_ERRORS && FBTrace.DBG_STACK)
                        FBTrace.sysout("updateSelection FAILS " + exc, exc);
                }
            },

            show:function () {
                var partial = Locale.$STR("spa_eye.view.noview");
                var source = "__p";

                Firebug.CommandLine.evaluate(source, Firebug.currentContext, null, Firebug.currentContext.getCurrentGlobal(),
                    function success(result, context) {
                        partial = result;
                    },
                    function failed(result, context) {
                        var exc = result;
                        if (exc.source !== source || exc.name !== "ReferenceError")
                            partial = exc.message;
                    }
                );


                this.panelNode.innerHTML = partial;

            }


        });


// ********************************************************************************************* //
// Registration

        Firebug.registerPanel(Firebug.viewPanel);
        return Firebug.viewPanel;

// ********************************************************************************************* //

    });
