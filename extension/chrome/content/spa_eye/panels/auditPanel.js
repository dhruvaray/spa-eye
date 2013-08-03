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

    "spa_eye/panels/basePanel"
],
    function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, FirebugReps, URI, BasePanel) {

// ********************************************************************************************* //

        var auditPanel = Firebug.auditPanel = BasePanel.extend({
            name:"spa_eye:audit",
            title:Locale.$STR("spa_eye.audit.title"),

            parentPanel:"spa_eye",
            tag:Firebug.DOMPanel.DirTable.tag,
            order:1,

            onModelOfInterestChange:function (m) {
                this.show();
            },

            onModelSet:function () {
                this.show();
            },

            onModelFetch:function () {
                this.show();
            },

            onModelSave:function () {
                this.show();
            },

            onTrackingDataCleared:function () {
                this.show();
            },


            show:function () {
                var spa_eyeObj = this.context.spa_eyeObj;
                var moi = spa_eyeObj && spa_eyeObj._moi;
                if (moi) {
                    var result = spa_eyeObj.auditRecords && spa_eyeObj.auditRecords[moi.cid];
                    if (result)
                        this.tag.replace({object:result || {}}, this.panelNode);
                    else
                        FirebugReps.Warning.tag.replace({object:"spa_eye.audit.nomodelselected"}, this.panelNode);
                } else {
                    FirebugReps.Warning.tag.replace({object:"spa_eye.audit.nomodelselected"}, this.panelNode);
                }
            }


        });

// ********************************************************************************************* //
// Templates

// ********************************************************************************************* //
// Registration

        Firebug.registerPanel(Firebug.auditPanel);
        return Firebug.auditPanel;

// ********************************************************************************************* //

    });
