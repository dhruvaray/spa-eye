define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",


    "spa_eye/dom/section",
    "spa_eye/dom/modelReps",

    "spa_eye/panels/basePanel"
],
    function (Firebug, Obj, FBTrace, Locale, Domplate, ChildSection, ModelReps) {

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
                var output = [
                    Locale.$STR("spa_eye.script.view.nodata"),
                    Locale.$STR("spa_eye.script.view.noviewselected")
                ];
                var context = this.context;

                for (var i = 0; i < source.length; ++i)
                    Firebug.CommandLine.evaluate(source[i], context, null, context.getCurrentGlobal(),
                        function success(result, context) {
                            output[i] = result;
                        },
                        function failed(result, context) {
                            if (result.source !== source || result.name !== "ReferenceError")
                                output[i] = exc.message;
                        }
                    );


                var args = {
                    sections:[
                        new ChildSection({
                            name:'data',
                            title:Locale.$STR("spa_eye.script.view.data"),
                            parent:this.panelNode,
                            data:output[0]
                        }),
                        new ChildSection({
                            name:'view',
                            title:Locale.$STR("spa_eye.script.view.template"),
                            parent:this.panelNode,
                            data:{HTML:output[1]}
                        })
                    ],
                    mainPanel:this
                };
                ModelReps.DirTablePlate.tag.replace(args, this.panelNode);

            }

        });

        Firebug.registerPanel(Firebug.viewPanel);
        return Firebug.viewPanel;

    });
