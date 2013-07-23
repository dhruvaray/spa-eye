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
    function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, FirebugReps, URI) {

// ********************************************************************************************* //

        var auditPanel = Firebug.auditPanel = function () {}
        auditPanel.prototype = Obj.extend(Firebug.Panel, {
            name:"spa_eye:audit",
            title:Locale.$STR("spa_eye.audit.title"),

            parentPanel:"spa_eye",
            tag:Firebug.DOMPanel.DirTable.tag,
            order:0,

            initialize:function () {
                //Firebug.registerUIListener(this);
                Firebug.Panel.initialize.apply(this, arguments);
                var listener = this.context.spa_eyeObj._spaHook.listener;
                listener.addListener(this);
            },

            destroy:function (state) {
                //Firebug.unRegisterUIListener(this);
                Firebug.Panel.destroy.apply(this, arguments);
            },

            _zeroFill:function (n, p, c) {
                var pad_char = typeof c !== 'undefined' ? c : '0';
                var pad = new Array(1 + p).join(pad_char);
                return (pad + n).slice(-pad.length);
            },

            getFormattedTime:function (d) {
                return this._zeroFill(d.getMonth() + 1, 2) + "/"
                    + this._zeroFill(d.getDate(), 2) + "/"
                    + (1900 + d.getYear()) + " "
                    + this._zeroFill(d.getHours(), 2) + ":"
                    + this._zeroFill(d.getMinutes(), 2) + ":"
                    + this._zeroFill(d.getSeconds(), 2) + ":"
                    + this._zeroFill(d.getMilliseconds(), 4);
            },

            // Show model audit
            showAudit:function (model) {
                if (!model || !model.cid) return;
                var spa_eyeObj = this.context.spa_eyeObj;
                var result = spa_eyeObj 
                        && spa_eyeObj.auditRecords
                        && spa_eyeObj.auditRecords[model.cid];

                result && this.tag.replace({object: result}, this.panelNode);
            },

            // Record audit for model
            recordAudit: function(model, doc) {
                var spa_eyeObj = this.context.spa_eyeObj,
                    t = this.getFormattedTime(new Date());

                // return if `record` is off
                if (!spa_eyeObj.isRecord) {
                    return;
                }

                spa_eyeObj.auditRecords = spa_eyeObj.auditRecords || {};
                spa_eyeObj.auditRecords[model.cid] = spa_eyeObj.auditRecords[model.cid] || {};
                spa_eyeObj.auditRecords[model.cid][t] = doc;
            },

            show:function () {
                var cm = this.context.spa_eyeObj.currentAuditModel;
                if (!cm) {
                    FirebugReps.Warning.tag.replace({object:"spa_eye.audit.nomodelselected"}, this.panelNode);
                } else {
                    this.showAudit(cm, this.context);
                }
            },

            getOptionsMenuItems:function (context) {
                return [
                    {
                        label:"spa_eye.all",
                        tooltiptext:"spa_eye.all",
                        command:function () {}
                    },
                    "-",
                    {
                        label:"spa_eye.refresh",
                        tooltiptext:"spa_eye.refresh",
                        command:Obj.bindFixed(this.refresh, this)
                    }
                ];
            },

            refresh:function () {
                var cm = this.context.spa_eyeObj.currentAuditModel;
                if (cm) {
                    this.showAudit(cm);
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
