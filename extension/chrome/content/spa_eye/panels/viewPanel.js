define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/dom/domEditor",
    "firebug/dom/domReps",

    "spa_eye/panels/basePanel"
],
    function (Firebug, Obj, FBTrace, Locale, Domplate, DOMEditor, DOMReps) {

        var viewPanel = Firebug.viewPanel = function () {
        };

        viewPanel.prototype = Obj.extend(Firebug.Panel, {
            name:"view",
            title:Locale.$STR("spa_eye.script.view.title"),

            parentPanel:"script",
            order:4,
            editable:true,

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
                var attr = [
                    "Data",
                    "Template"
                ];
                var data = {};
                data[attr[0]] = Locale.$STR("spa_eye.script.view.nodata");
                data[attr[1]] = Locale.$STR("spa_eye.script.view.notemplate");

                var context = this.context;

                for (var i = 0; i < source.length; ++i)

                    Firebug.CommandLine.evaluate(source[i], context, null, context.getCurrentGlobal(),
                        function success(result, context) {
                            data[attr[i]] = result;
                        },
                        function failed(result, context) {
                            if (result.source !== source || result.name !== "ReferenceError")
                                data[attr[i]] = exc.message;
                        }
                    );

                //ModelReps.DirTablePlate.tag.replace(args, this.panelNode);
                DOMReps.DirTablePlate.tag.replace({object:data}, this.panelNode);

            },

            getEditor:function (target, value) {
                if (!this.editor) {
                    this.editor = new DOMEditor(this.document);
                }
                return this.editor;
            }

        });

        Firebug.registerPanel(Firebug.viewPanel);
        return Firebug.viewPanel;

    });
