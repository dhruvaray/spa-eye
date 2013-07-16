define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",

    "spa_eye/panels/basePanel",
    "spa_eye/dom/section",
    "spa_eye/dom/modelReps"
],
function (Firebug, Obj, FBTrace, Locale, Domplate) {

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
            var source = ["obj", "__p"];
            var output =[
                Locale.$STR("spa_eye.script.view.nodata"),
                Locale.$STR("spa_eye.script.view.noviewselected")
            ];
            var context = this.context;

            for(var i=0;i<source.length;++i)
                Firebug.CommandLine.evaluate(source[i], context, null, context.getCurrentGlobal(),
                    function success(result, context) {
                        output[i] = result;
                    },
                    function failed(result, context) {
                        if (result.source !== source || result.name !== "ReferenceError")
                            output[i] = exc.message;
                    }
                );


            this.panelNode = partialHTML;

        }

    });

    with (Domplate) {

        Firebug.viewPanel.prototype.view_template = domplate({
            tag:DIV({onclick:"$handleClick", class:"$data|computeVisibility"}, Locale.$STR("spa_eye.reload")),

            handleClick:function (event) {

                Firebug.Options.setPref("javascript", "enabled", true);
                Firebug.TabWatcher.reloadPageFromMemory(Firebug.currentContext);
            },

            computeVisibility:function (data) {
                return "show";//for now
            }

        });
    }

    Firebug.registerPanel(Firebug.viewPanel);
    return Firebug.viewPanel;

});
