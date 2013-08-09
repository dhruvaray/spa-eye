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

        var NetRequestEntry = Firebug.NetMonitor.NetRequestEntry;
        var Operation = Common.Operation;

        Firebug.spa_eyeModule = FBL.extend(Firebug.ActivableModule, {
            initialize:function (prefDomain, prefNames) {
                Firebug.Module.initialize.apply(this, arguments);
                // Add Listener
                Firebug.NetMonitor.addListener(this);
                Firebug.connection.addListener(this);

            },

            shutdown:function () {
                Firebug.Module.shutdown.apply(this, arguments);

                // Remove Listener
                Firebug.NetMonitor.removeListener(this);
                Firebug.connection.removeListener(this);
            },

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
                    spObj._spaHook.registerContentLoadedHook();

                }
            },

            // Called when a context is destroyed. Module may store info on persistedState
            // for reloaded pages.
            destroyContext:function (context, persistedState) {
                context.spa_eyeObj._spaHook.cleanup();
                if (FBTrace.DBG_SPA_EYE) {
                    FBTrace.sysout("spa_eye; Successfully emptied maintenance collections for spa-eye module.");
                }
            },


            onResponseBody:function (context, file) {
                var win = context.window.wrappedJSObject;
                var spObj = context.spa_eyeObj;
                var hook = spObj._spaHook;
                if (spObj.hooked()) {
                    if (file && file.href) {
                        win.spa_eye.cm = spObj._currentSynced[file.href];
                        delete spObj._currentSynced[file.href];
                    }
                    if (win.spa_eye.cm) {
                        if (FBTrace.DBG_SPA_EYE) {
                            FBTrace.sysout("spa_eye; on response, current model", win.spa_eye.cm);
                        }
                        hook.recordAuditEvent(win.spa_eye.cm, win.spa_eye.cm);
                        Events.dispatch(hook.listener.fbListeners, 'onBackboneEvent',
                            [win.spa_eye.cm, Operation.SYNC, NetRequestEntry.isError(file)]);
                    }
                }
            },

            onRequest:function (context, file) {
                var win = context.window.wrappedJSObject;
                var spObj = context.spa_eyeObj;
                if (spObj && spObj.hooked()) {
                    if (win.spa_eye.cm) {
                        context.spa_eyeObj._currentSynced[file.href] = win.spa_eye.cm;
                    }
                }
            },

            showPanel:function (browser, panel) {

            },

            onObserverChange:function (observer) {
                if (this.hasObservers()) {
                    // There are observers (plates) using this model,
                    // let's activate necessary service/server hooks.
                } else {
                    // There are no observer using this model, let's clean up
                    // registered hooks.
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
