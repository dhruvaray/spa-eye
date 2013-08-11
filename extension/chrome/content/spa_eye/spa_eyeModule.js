/* See license.txt for terms of usage */

define([
    "firebug/firebug",
    "firebug/lib/lib",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/events",

    "spa_eye/lib/uri",
    "spa_eye/hooks/bb/bbhook",
    "spa_eye/util/common",

    "spa_eye/spa_eyeObj"
],
    function (Firebug, FBL, FBTrace, Locale, Events, URI, BBHook, Common, spa_eyeObj) {

        Firebug.spa_eyeModule = FBL.extend(Firebug.ActivableModule, {

            // Called when a new context is created but before the page is loaded.
            initContext:function (context, persistedState) {
                // Initializing hooks
                if (!context.spa_eye) {
                    var spObj = context.spa_eyeObj = new spa_eyeObj({
                        context:context
                    });
                    spObj._spaHook = new BBHook({
                        context:context
                    });
                    spObj._spaHook.cleanup();
                    var enable = Firebug.Options.get("spa_eye.enableSites");
                    if (enable) {
                        spObj._spaHook.registerContentLoadedHook.call(
                            spObj._spaHook,
                            context.window.wrappedJSObject);
                    }
                }
            },

            // Called when a context is destroyed. Module may store info on persistedState
            // for reloaded pages.
            destroyContext:function (context, persistedState) {
                context.spa_eyeObj._spaHook.cleanup();
                if (FBTrace.DBG_SPA_EYE) {
                    FBTrace.sysout("spa_eye; Successfully emptied maintenance collections for spa-eye module.");
                }
            }
        });

// ********************************************************************************************* //
// Registration

        Firebug.registerStringBundle("chrome://spa_eye/locale/spa_eye.properties");
        Firebug.registerActivableModule(Firebug.spa_eyeModule);

        return Firebug.spa_eyeModule;

// ********************************************************************************************* //
    });
