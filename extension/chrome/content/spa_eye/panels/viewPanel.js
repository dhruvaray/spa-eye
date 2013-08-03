define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/dom/domEditor",
    "firebug/chrome/reps",
    "firebug/dom/domReps",

    "spa_eye/panels/basePanel"
],
    function (Firebug, Obj, FBTrace, Locale, Domplate, DOMEditor, FirebugReps, DOMReps) {

        var viewPanel = Firebug.viewPanel = function () {
        };

        viewPanel.prototype = Obj.extend(Firebug.Panel, {
            name:"spa_eye:script.view",
            title:Locale.$STR("spa_eye.script.view.title"),

            parentPanel:"script",
            order:4,
            editable:true,


            initialize:function () {
                Firebug.Panel.initialize.apply(this, arguments);
                var listener = this.context.spa_eyeObj._spaHook.listener;
                listener.addListener(this);

            },

            destroy:function (state) {
                Firebug.Panel.destroy.apply(this, arguments);
            },


            updateSelection:function (frame) {


                if (frame && frame.script && frame.script && frame.script.fileName) {
                    var matches = frame.script.fileName.match(/fileName=([^;]*)/)
                    matches.length == 2 && (this.templateName = matches[1]);
                }

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
                    Locale.$STR("spa_eye.script.view.template.data"),
                    Locale.$STR("spa_eye.script.view.template.transform"),
                    Locale.$STR("spa_eye.script.view.template.source")
                ];
                var data = {};
                data[attr[0]] = Locale.$STR("spa_eye.script.view.nodata");
                data[attr[1]] = Locale.$STR("spa_eye.script.view.noviewselected");


                if (this.templateName) {
                    var context = this.context;
                    var win = context.window.wrappedJSObject;

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

                    data[attr[2]] = win.spa_eye.templates[this.templateName];
                    DOMReps.DirTablePlate.tag.replace({object:data}, this.panelNode);
                }
                if (data[attr[1]] === Locale.$STR("spa_eye.script.view.noviewselected")) {
                    FirebugReps.Warning.tag.replace({object:"spa_eye.script.view.noviewselected"}, this.panelNode);
                }


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
