/* See license.txt for terms of usage */

define([
    "firebug/lib/object",
    "firebug/firebug",
    "firebug/lib/http",
    "firebug/lib/lib",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/events",

    "spa_eye/hooks/bb/bbhook",
    "spa_eye/util/common",

    "spa_eye/spa_eyeObj",
    "spa_eye/dom/keyPanel"
],
    function (Obj, Firebug, Http, FBL, FBTrace, Locale, Events, BBHook, Common, spa_eyeObj, KeyPanel) {

        const Cc = Components.classes;
        const Ci = Components.interfaces;
        const Cr = Components.results;

        const nsIWebProgressListener = Ci.nsIWebProgressListener;
        const STATE_IS_REQUEST = nsIWebProgressListener.STATE_IS_REQUEST;
        const STATE_START = nsIWebProgressListener.STATE_START;

        Firebug.spa_eyeModule = FBL.extend(Firebug.ActivableModule, {

            initialize:function () {
                // Attach key listener
                KeyPanel.attachKeyListeners();
            },

            destroy:function () {
                // Attach key listener
                KeyPanel.detachKeyListeners();
            },

            // Called when a new context is created but before the page is loaded.
            initContext:function (context, persistedState) {
                // Initializing hooks
                if (!context.spa_eyeObj) {
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
                    persistedState && (spObj.currentPlate = persistedState.currentPlate);
                    context.browser.addProgressListener(Obj.extend(Http.BaseProgressListener, {

                        onStateChange:function (progress, request, flag, status) {

                            if (flag & STATE_IS_REQUEST && flag & STATE_START) {
                                // We need to get the hook in as soon as the new DOMWindow is created, but before
                                // it starts executing any scripts in the page.
                                var win = progress.DOMWindow;
                                if (win.parent != win &&
                                    win.location.href != "about:blank" &&
                                    win.document.URL != "about:blank"){//child window
                                    context.spa_eyeObj && //weird? I don't see the need for this check.
                                    context.spa_eyeObj._spaHook.registerContentLoadedHook(win.wrappedJSObject);
                                }
                            }
                            return;

                        }
                    }));
                }
            },

            // Called when a context is destroyed. Module may store info on persistedState
            // for reloaded pages.
            destroyContext:function (context, persistedState) {
                // Record persistedState for currentPlate
                persistedState.currentPlate = context.spa_eyeObj.currentPlate;

                context.spa_eyeObj._spaHook.cleanup();
                if (FBTrace.DBG_SPA_EYE) {
                    FBTrace.sysout("spa_eye; Successfully emptied maintenance collections for spa-eye module.");
                }
            }

        });

        Firebug.registerStringBundle("chrome://spa_eye/locale/spa_eye.properties");
        Firebug.registerActivableModule(Firebug.spa_eyeModule);

        return Firebug.spa_eyeModule;
    });

