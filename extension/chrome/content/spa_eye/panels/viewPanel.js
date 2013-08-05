define([
    "firebug/firebug",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/dom/domEditor",
    "firebug/chrome/reps",
    "firebug/dom/domReps",

    "spa_eye/panels/basePanel"
],
    function (Firebug, FBTrace, Locale, Domplate, DOMEditor, FirebugReps, DOMReps, BasePanel) {

        var viewPanel = Firebug.viewPanel = BasePanel.extend({
            name:"spa_eye:script.view",
            title:Locale.$STR("spa_eye.script.view.title"),

            parentPanel:"script",
            order:4,

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
                    Locale.$STR("spa_eye.script.view.template.source"),
                    Locale.$STR("spa_eye.script.view.template.transform")
                ];
                var context = this.context;
                var win = context.window.wrappedJSObject;
                var data = {};
                data[attr[0]] = Locale.$STR("spa_eye.script.view.nodata");
                data[attr[1]] = win.spa_eye.templates[this.templateName];
                data[attr[2]] = Locale.$STR("spa_eye.script.view.noviewselected");


                if (this.templateName) {
                    for (var i = 0; i < source.length; ++i) {
                        Firebug.CommandLine.evaluate(source[i], context, null, context.getCurrentGlobal(),
                            function success(result, context) {
                                source[i] = result;
                            },
                            function failed(result, context) {
                                if (result.source !== source || result.name !== "ReferenceError")
                                    source[i] = exc.message;
                            }
                        );
                    }
                    data[attr[0]] = source[0];
                    data[attr[2]] = source[1];

                    DOMReps.DirTablePlate.tag.replace({object:data}, this.panelNode);
                }

                if (data[attr[2]] === Locale.$STR("spa_eye.script.view.noviewselected")) {
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

        return Firebug.viewPanel;

    });
