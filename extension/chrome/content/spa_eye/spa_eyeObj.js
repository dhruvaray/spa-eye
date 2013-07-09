/* See license.txt for terms of usage */

define([
    "firebug/lib/lib",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/events"
],
function(FBL, FBTrace, Locale, Events) {

    var spa_eyeObj = function(initObj){
        this._currentSynced = {};
        this._pinned_models = {};
        this._spaHook = null;
        if (initObj) {
            for (var key in initObj) {
                this[key] = initObj[key];
            }
        }
        if (FBTrace.DBG_SPA_EYE) {
            FBTrace.sysout("spa_eye; Initialized spa_eyeObj for current context", this);
        }
    }
    
    spa_eyeObj.prototype = {
        constructor: spa_eyeObj,


        getHook: function() {
            return this._spaHook;
        },

        hooked: function () {
            return this._spaHook ? this._spaHook.hooked : false;
        },

        getModels : function(){
            return this._spaHook ? this._spaHook.models() : [];
        },

        getViews : function(){
            return this._spaHook ? this._spaHook.views() : [];
        },

        getCollections : function(){
            return this._spaHook ? this._spaHook.collections() : [];
        }
    };


// ********************************************************************************************* //
    return spa_eyeObj;

// ********************************************************************************************* //
 });
