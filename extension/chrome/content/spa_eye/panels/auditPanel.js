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
            order:0,

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


            show:function () {
                var spa_eyeObj = this.context.spa_eyeObj;
                var moi = spa_eyeObj && spa_eyeObj._moi;
                if (moi) {
                    var result = spa_eyeObj.auditRecords && spa_eyeObj.auditRecords[moi.cid];
                    this.tag.replace({object:result || {}}, this.panelNode);
                } else {
                    FirebugReps.Warning.tag.replace({object:"spa_eye.audit.nomodelselected"}, this.panelNode);
                }
            },

            getOptionsMenuItems:function (context) {
                return [
                    {
                        label:"spa_eye.refresh",
                        tooltiptext:"spa_eye.refresh",
                        command:Obj.bindFixed(this.refresh, this)
                    }
                ];
            },

            refresh:function () {
                this.show();
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
