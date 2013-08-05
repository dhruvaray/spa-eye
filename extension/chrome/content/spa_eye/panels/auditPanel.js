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

// ********************************************************************************************* //

        var auditPanel = Firebug.auditPanel = BasePanel.extend({
            name:"spa_eye:audit",
            title:Locale.$STR("spa_eye.audit.title"),

            parentPanel:"spa_eye",
            tag:DOMReps.DirTablePlate.tag,
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
                    if (result) {
                        var audit = {};
                        _.each(result, function (item) {
                            var key = Object.keys(item)[0];
                            audit[key] = item[key]
                        });
                        this.tag.replace({object:audit}, this.panelNode);
                    }
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


        return Firebug.auditPanel;

// ********************************************************************************************* //

    });
