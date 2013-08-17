/* See license.txt for terms of usage */

define([
    "firebug/lib/trace",
    "firebug/trace/traceModule",
    "firebug/trace/traceListener",
    "spa_eye/spa_eyePanel",
    "spa_eye/spa_eyeModule"
],
function(FBTrace, TraceModule, TraceListener, SPAPanel, SPAModule) {

// ********************************************************************************************* //
// Documentation
//
// Firebug coding style: http://getfirebug.com/wiki/index.php/Coding_Style
// Firebug tracing: http://getfirebug.com/wiki/index.php/FBTrace

// ********************************************************************************************* //
// The application/extension object

var theApp = {
    initialize: function() {
        if (FBTrace.DBG_SPA_EYE)
            FBTrace.sysout("spa_eye; spa_eye extension initialize");
    },

    shutdown: function() {
        if (FBTrace.DBG_SPA_EYE)
            FBTrace.sysout("spa_eye; spa_eye extension shutdown");
    }
}

return theApp;

// ********************************************************************************************* //
});
