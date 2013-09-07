define([
    "firebug/firebug",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/chrome/reps",

    "spa_eye/dom/domReps",
    "spa_eye/panels/basePanel"
],
    function (Firebug, FBTrace, Locale, Domplate, FirebugReps, DOMReps, BasePanel) {

        var viewPanel = Firebug.viewPanel = BasePanel.extend({
            name:"spa_eye:script.view",
            title:Locale.$STR("spa_eye.script.view.title"),
            tooltip:Locale.$STR("spa_eye.script.view.tooltip"),

            parentPanel:"script",
            order:4,

            updateSelection:function (frame) {


                if (frame && frame.script && frame.script && frame.script.fileName) {
                    var matches = frame.script.fileName.match(/fileName=([^;]*)/)
                    matches && matches.length == 2 && (this.templateName = matches[1]);
                }

                try {
                    this.show(frame);
                }
                catch (e) {
                    this.context.spa_eyeObj._spaHook.logError(e);
                }
            },

            show:function () {
                var source = ["obj", "__p"];
                var attr = [
                    Locale.$STR("spa_eye.script.view.template.source"),
                    Locale.$STR("spa_eye.script.view.template.data"),
                    Locale.$STR("spa_eye.script.view.template.transform")
                ];
                var context = this.context;
                var data = {};
                data[attr[0]] = this.context.spa_eyeObj._spaHook.templates()[this.templateName];
                data[attr[1]] = source[0];
                data[attr[2]] = source[1];


                if (this.templateName) {
                    for (var i = 0; i < source.length; ++i) {
                        Firebug.CommandLine.evaluate(source[i], context, null, context.getCurrentGlobal(),
                            function success(result, context) {
                                data[attr[i + 1]] = result;
                            },
                            function failed(result, context) {
                                if (result.source !== source || result.name !== "ReferenceError")
                                    data[attr[i + 1]] = exc.message;
                            }
                        );
                    }

                    DOMReps.DirTablePlate.tag.replace({object:data}, this.panelNode);

                    //always expand transformed row
                    var transformRow = this.panelNode.getElementsByClassName("memberRow").item(2);
                    transformRow && DOMReps.DirTablePlate.toggleRow(transformRow);
                }

                if (data[attr[1]] === source[0]) {
                    FirebugReps.Warning.tag.replace({object:"spa_eye.script.view.noviewselected"}, this.panelNode);
                }


            }

        });

        Firebug.registerPanel(Firebug.viewPanel);

        return Firebug.viewPanel;

    });
