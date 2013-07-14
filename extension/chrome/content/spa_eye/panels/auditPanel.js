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
    "spa_eye/lib/uri"
],
function(Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, FirebugReps, URI){

    Firebug.registerStringBundle("chrome://spa_eye/locale/spa_eye.properties");
    Firebug.registerStylesheet("chrome://spa_eye/skin/models.css");
    Firebug.registerStylesheet("chrome://spa_eye/skin/spa_eye.css");

// ********************************************************************************************* //

    var auditPanel = Firebug.auditPanel = function(){}
    auditPanel.prototype = Obj.extend(Firebug.Panel, {
        name: "audit",
        title: Locale.$STR("spa_eye.audit.title"),

        parentPanel: "spa_eye",
        tag: Firebug.DOMPanel.DirTable.tag,
        order: 0,

        initialize: function(){
            //Firebug.registerUIListener(this);
            Firebug.Panel.initialize.apply(this, arguments);
        },

        destroy: function(state){
            //Firebug.unRegisterUIListener(this);
            Firebug.Panel.destroy.apply(this, arguments);
        },

        _zeroFill: function(n, p, c) {
            var pad_char = typeof c !== 'undefined' ? c : '0';
            var pad = new Array(1 + p).join(pad_char);
            return (pad + n).slice(-pad.length);
        },
        

        getFormattedTime: function(d){
            return this._zeroFill(d.getMonth()+1, 2)+"/"
                +this._zeroFill(d.getDate(), 2)+"/"
                +(1900+d.getYear())+" "
                +this._zeroFill(d.getHours(), 2)+":"
                +this._zeroFill(d.getMinutes(), 2)+":"
                +this._zeroFill(d.getSeconds(), 2)+":"
                +this._zeroFill(d.getMilliseconds(), 4);
        },

        showAudit: function(model, context){
            if (!model) return;

            context.spa_eyeObj.currentAuditModel = model;

            var win = this.context.window.wrappedJSObject;
            if(FBTrace.DBG_SPA_EYE){
                FBTrace.sysout("spa_eye; show audit for model - "+model.cid, model);
            }
            var result = context.spa_eyeObj.getHook().readModelAudit(URI.getEndPoint(win.location.href), model);
            var objectResult = {};
            if (result.length > 0){
                result = result.substr(0, result.length-1);
                result = JSON.parse('['+result+']');
            }
            for(var i=0;i<result.length;i++) {
                var item = result[i];
                var time = this.getFormattedTime(new Date(+item.t));
                objectResult[time] = item.v;
            }
            objectResult && this.tag.replace({object: objectResult}, this.panelNode);
        },

        show: function() {
            var cm = this.context.spa_eyeObj.currentAuditModel;
            if (!cm) {
                FirebugReps.Warning.tag.replace({object: "spa_eye.audit.nomodelselected"}, this.panelNode);
            } else {
                this.showAudit(cm, this.context);
            }
        },

        getOptionsMenuItems: function(context){
            return [
                {
                    label: "spa_eye.all",
                    tooltiptext: "spa_eye.all",
                    command: function(){}
                },
                "-",
                {
                    label: "spa_eye.refresh",
                    tooltiptext: "spa_eye.refresh",
                    command: Obj.bindFixed(this.refresh, this)
                }
            ];
        },

        refresh: function(){
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
