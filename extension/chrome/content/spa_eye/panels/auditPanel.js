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

    "spa_eye/lib/require/underscore",
    "spa_eye/dom/section",
    "spa_eye/dom/modelReps",
    "spa_eye/dom/domReps",
    "spa_eye/panels/basePanel"
],
    function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, FirebugReps, _, ChildSection, ModelReps, DOMReps, BasePanel) {

        var auditPanel = Firebug.auditPanel = BasePanel.extend({
            name:"spa_eye:audit",
            title:Locale.$STR("spa_eye.audit.title"),
            tooltip:Locale.$STR("spa_eye.audit.tooltip"),

            parentPanel:"spa_eye",
            tag:ModelReps.DirTablePlate.tag,
            order:0,
            follows:['Model', 'Collection'],

            onSelectedEntityChange:function (m) {
                this.show();
            },

            onTrackingDataCleared:function () {
                this.show();
            },

            show:function () {
                var spa_eyeObj = this.context.spa_eyeObj;
                var selectedEntity = spa_eyeObj && spa_eyeObj.selectedEntity;
                if (selectedEntity) {
                    var result = spa_eyeObj._spaHook.journals()[selectedEntity.cid];
                    if (result) {
                        var sections = [];
                        for (var i = result.length - 1; i >= 0; --i) {
                            sections.push(new ChildSection({
                                name:'journalsection_t' + i,
                                title:'t=' + i,
                                parent:this.panelNode,
                                autoAdd:false,
                                collapse:true,
                                ignoreKey:true,
                                data:result[i]
                            }));
                        }

                        var args = {
                            sections:sections,
                            mainPanel:this.panelNode
                        };

                        this.tag.replace(args, this.panelNode);
                    }
                    else
                        FirebugReps.Warning.tag.replace({object:"spa_eye.audit.nomodelselected"}, this.panelNode);
                } else {
                    FirebugReps.Warning.tag.replace({object:"spa_eye.audit.nomodelselected"}, this.panelNode);
                }
            }


        });

        Firebug.registerPanel(Firebug.auditPanel);

        return Firebug.auditPanel;

    });
