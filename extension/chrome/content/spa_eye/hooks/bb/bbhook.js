/* See license.txt for terms of usage */

define([
    "firebug/lib/trace",
    "firebug/lib/http",
    "firebug/lib/events",
    "firebug/lib/dom",


    "spa_eye/lib/sha",
    "spa_eye/lib/dom",
    "spa_eye/lib/uri"
],
    function (FBTrace, Http, Events, Dom, SHA, DOM, URI) {

// ********************************************************************************************* //
// Constants

        const Cc = Components.classes;
        const Ci = Components.interfaces;
        const Cr = Components.results;
        const bbhook_wp = "chrome://spa_eye/content/hooks/bb/bbhook_wp.js";

// ********************************************************************************************* //
//  BBHook Class
// ********************************************************************************************* //
        var BBHook = function (obj) {
            this.hooked = false;
            this.context = null;
            this.listener = new Firebug.Listener();
            if (obj) {
                for (var key in obj) {
                    this[key] = obj[key];
                }
            }
        }

        BBHook.prototype = {
            constructor:BBHook,

            registerHooks:function (win) {
                var self = this;

                //Hook #1
                this.registerSetHooks(win);

                var _templateProxy = win._ && win._.template;
                if (!_templateProxy) {
                    if (FBTrace.DBG_SPA_EYE) {
                        FBTrace.sysout("spa_eye; Could not add hook.Either _/_.template is not found. _ = " +
                            win._);
                    }
                    return false;
                }

                win.spa_eye.templates = win.spa_eye.templates || {};

                //Hook #2
                win._.template = function (text, data, settings) {

                    try {
                        if (!text) {
                            if (FBTrace.DBG_SPA_EYE) {
                                FBTrace.sysout("spa_eye; template text is empty ");
                            }
                            return false;
                        }
                        var script = DOM.getMatchingNode(win, "script", text)
                        var script_id = (script && script.id) ? script.id : SHA.getTextHash(text);
                        var compiledTemplate = win.spa_eye.templates[script_id];

                        if (!compiledTemplate) {
                            compiledTemplate = _templateProxy.call(win._, text);
                            var source = compiledTemplate.source;
                            if (source) {
                                var proxiedTemplateRef = '_t' + script_id;

                                var f = escape("window['" + proxiedTemplateRef + "']=" + source);

                                // Attach to body
                                DOM.appendExternalScriptTagToHead(win.document,
                                    "data:text/javascript;fileName=" + script_id + ";," + f);

                                // Record using script_id
                                win.spa_eye.templates[script_id] = source;

                            } else {
                                if (FBTrace.DBG_ERRORS)
                                    FBTrace.sysout("spa_eye; No compiled template found for scriptid = " +
                                        script_id +
                                        " and template text = " +
                                        text
                                    );
                            }
                        }

                        var attachTemplatesToViews = function () {
                            var rendered = win.spa_eye.cv;
                            if (rendered) {
                                var templates = rendered.inferredTemplates;
                                if (templates.indexOf(script_id) == -1) {
                                    templates.push(script_id);
                                }
                            }
                        };

                        Events.dispatch(self.listener.fbListeners, 'onViewRender', [win.spa_eye.cv]);

                        if (data) {
                            attachTemplatesToViews();
                            return compiledTemplate(data, _);
                        }

                    } catch (e) {
                        if (FBTrace.DBG_ERRORS)
                            FBTrace.sysout("spa_eye; Unexpected error", e);
                    }

                    return function (data, _) {
                        if (win[proxiedTemplateRef]) {
                            win[proxiedTemplateRef].source = win[proxiedTemplateRef].source || source;
                            attachTemplatesToViews();
                            Events.dispatch(self.listener.fbListeners, 'onViewRender', [win.spa_eye.cv]);
                            return win[proxiedTemplateRef].call(this, data, _);
                        }
                        return undefined;
                    };
                }

            },

            registerSetHooks:function (win) {
                var _setProxy = win.Backbone.Model.prototype.set;
                var self = this;
                win.Backbone.Model.prototype.set = function (attributes, options) {
                    if (!this.save._proxied) {
                        var _saveProxy = this.save;
                        this.save = function () {
                            win.spa_eye.cm = this;
                            self.writeModelAudit(URI.getEndPoint(win.location.href), this, "Saved attributes");
                            var result = _saveProxy.apply(this, Array.slice(arguments));
                            win.spa_eye.cm = undefined;
                            return result;
                        };
                        this.save._proxied = true;
                    }

                    if (!this.fetch._proxied) {
                        var _fetchProxy = this.fetch;
                        this.fetch = function () {
                            win.spa_eye.cm = this;
                            self.writeModelAudit(URI.getEndPoint(win.location.href), this, "Fetched attributes");
                            var result = _fetchProxy.apply(this, Array.slice(arguments));
                            win.spa_eye.cm = undefined;
                            return result;
                        };
                        this.fetch._proxied = true;
                    }
                    win.spa_eye.cm = this;
                    var result = _setProxy.apply(this, Array.slice(arguments));
                    win.spa_eye.cm = undefined;
                    self.writeModelAudit(URI.getEndPoint(win.location.href), this, this);
                    Events.dispatch(self.listener.fbListeners, 'onModelSet', [this]);
                    return result;
                }
            },

            registerWPHooks:function (win) {
                Firebug.CommandLine.evaluateInWebPage(
                    Http.getResource(bbhook_wp),
                    this.context,
                    win);
            },

            readModelAudit:function (baseurl, model) {
                var ios = Cc["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
                var file = Cc["@mozilla.org/file/directory_service;1"]
                    .getService(Ci.nsIProperties)
                    .get("TmpD", Ci.nsIFile);

                file.append("firebug");
                file.append("spa_eye");
                file.append(baseurl)
                file.append(model.cid + ".txt");

                var istream = Cc["@mozilla.org/network/file-input-stream;1"]
                    .createInstance(Ci.nsIFileInputStream);

                istream.init(file, -1, -1, false);

                var bstream = Cc["@mozilla.org/binaryinputstream;1"]
                    .createInstance(Ci.nsIBinaryInputStream);
                bstream.setInputStream(istream);

                var bytes = bstream.readBytes(bstream.available());

                bstream.close();
                istream.close();

                return bytes;
            },

            _getAuditData:function (object) {
                var auditObject = {
                    t:new Date().getTime().toString(),
                    v:object
                };
                return JSON.stringify(auditObject);
            },

            writeModelAudit:function (baseurl, model, doc) {
                if (model && model.cid && !(model.cid in this.context.spa_eyeObj._pinned_models)) {
                    return;
                }

                try {
                    var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                        .createInstance(Ci.nsIFileOutputStream);
                    var file = Cc["@mozilla.org/file/directory_service;1"]
                        .getService(Ci.nsIProperties)
                        .get("TmpD", Ci.nsIFile);
                    var outputStream = Cc["@mozilla.org/intl/converter-output-stream;1"].
                        createInstance(Components.interfaces.nsIConverterOutputStream);

                    file.append("firebug");
                    file.append("spa_eye");
                    file.append(baseurl)
                    file.append(model.cid + ".txt");

                    if (!model.__audit) {
                        if (file.exists()) file.remove(true);
                        file.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0666);
                        model.__audit = file.path;
                        if (FBTrace.DBG_SPA_EYE) {
                            FBTrace.sysout("spa_eye; Creating model audit record @ " + file.path);
                        }
                    }

                    // write, create, append
                    foStream.init(file, 0x02 | 0x08 | 0x10, 0666, 0);
                    outputStream.init(foStream, "UTF-8", 0, 0);
                    outputStream.writeString(this._getAuditData(doc) + ",");

                    outputStream.close(); // this closes foStream
                    foStream.close();

                    if (FBTrace.DBG_SPA_EYE) {
                        FBTrace.sysout("spa_eye; Appending model audit record @ " + file.path);
                    }
                } catch (e) {
                    if (FBTrace.DBG_ERRORS)
                        FBTrace.sysout("spa_eye; Could not write the audit file for model : " +
                            model.cid +
                            " at location : \'" +
                            baseurl + "\'" + "Content : " + doc, e);
                }
            },

            registerBBHooks:function (win) {
                if (this.isBackboneInitialized(win)) {
                    if (!this.hooked) {
                        try {
                            this.win = win;
                            this.hooked = true;
                            this.registerWPHooks(win);
                            this.registerHooks(win);

                            if (FBTrace.DBG_SPA_EYE) {
                                FBTrace.sysout("spa_eye; Successfully registered Backbone hooks for spa-eye module");
                            }

                        } catch (e) {
                            this.hooked = false;
                            if (FBTrace.DBG_ERRORS)
                                FBTrace.sysout("Could not register Backbone hooks for spa_eye", e);
                        }
                    }
                }
            },

            isBackboneInitialized:function (win) {
                if (win._ && win._.VERSION) {
                    var uscore = win._.VERSION.split('.');
                    var major = parseInt(uscore[1]);
                    var minor = parseInt(uscore[2]);
                }
                return win.Backbone && major > 3 && minor >= 3;
            },

            cleanup:function () {
                this.hooked = false;
                if (this.win) {
                    this.win.spa_eye.templates = [];
                    this.win.spa_eye.models = [];
                    this.win.spa_eye.views = [];
                    this.win.spa_eye.collections = [];
                }
            },

            registerContentLoadedHook:function () {
                var self = this;
                var win = this.context.window.wrappedJSObject;
                var register = function () {
                    self.registerBBHooks(win);
                };
                win.document.addEventListener("afterscriptexecute", register);
                //probably not required.
                win.addEventListener("load", register);
            },

            models:function () {
                if (this.win) {
                    return this.win.spa_eye.models;
                }
                return [];
            },

            views:function () {
                if (this.win) {
                    return this.win.spa_eye.views;
                }
                return [];
            },

            collections:function () {
                if (this.win) {
                    return this.win.spa_eye.collections;
                }
                return [];
            }


        };


// ********************************************************************************************* //

        return BBHook;

// ********************************************************************************************* //
    });
