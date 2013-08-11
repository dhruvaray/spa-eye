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
    "spa_eye/lib/uri",
    "spa_eye/lib/require/underscore",
    "firebug/dom/domReps",

    "spa_eye/panels/basePanel"
],
    function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, FirebugReps, URI, _, DOMReps, BasePanel) {

        var auditPanel = Firebug.auditPanel = BasePanel.extend({
            name:"spa_eye:audit",
            title:Locale.$STR("spa_eye.audit.title"),
            tooltip:Locale.$STR("spa_eye.audit.tooltip"),

            parentPanel:"spa_eye",
            tag:DOMReps.DirTablePlate.tag,
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
                        this.tag.replace({object:result}, this.panelNode);
                    }
                    else
                        FirebugReps.Warning.tag.replace({object:"spa_eye.audit.nomodelselected"}, this.panelNode);
                } else {
                    FirebugReps.Warning.tag.replace({object:"spa_eye.audit.nomodelselected"}, this.panelNode);
                }
            }


        });

        return Firebug.auditPanel;

    });
