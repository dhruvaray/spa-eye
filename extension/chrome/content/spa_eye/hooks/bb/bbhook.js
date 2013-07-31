/* See license.txt for terms of usage */

define([
    "firebug/lib/trace",
    "firebug/lib/http",
    "firebug/lib/events",
    "firebug/lib/dom",


    "spa_eye/lib/sha",
    "spa_eye/lib/dom",
    "spa_eye/lib/uri",

    "spa_eye/lib/require/underscore"
],
    function (FBTrace, Http, Events, Dom, SHA, DOM, URI, _) {

// ********************************************************************************************* //
// Constants

        const Cc = Components.classes;
        const Ci = Components.interfaces;
        const Cr = Components.results;
        const bbhook_wp = "chrome://spa_eye/content/hooks/bb/bbhook_wp.js";
        const Operation = {SAVE:"save", FETCH:"fetch", SET:"set", VIEW:"render"};

// ********************************************************************************************* //
//  BBHook Class
// ********************************************************************************************* //
        var BBHook = function (obj) {
            this.hooked = false;
            this.context = null;
            this.listener = new Firebug.Listener();
            this.registering = false;
            if (obj) {
                for (var key in obj) {
                    this[key] = obj[key];
                }
            }
        }

        BBHook.prototype = {
            constructor:BBHook,

            registerViewHooks:function (win) {
                var self = this;

                var _templateProxy = win._ && win._.template;
                if (!_templateProxy) {
                    if (FBTrace.DBG_SPA_EYE) {
                        FBTrace.sysout("spa_eye; Could not add hook.Either _/_.template is not found. _ = " +
                            win._);
                    }
                    return false;
                }

                win.spa_eye.templates = win.spa_eye.templates || {};

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
                        var proxiedTemplateRef = '_t' + script_id;
                        var compiledTemplate = win[proxiedTemplateRef];

                        if (!compiledTemplate) {
                            compiledTemplate = _templateProxy.call(win._, text);
                            var source = compiledTemplate.source ?
                                compiledTemplate.source : (_.template.call(_, text)).source;
                            if (source) {
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


                        self.recordSequenceEvent(win, {
                            operation:Operation.VIEW,
                            cid:win.spa_eye.cv ? win.spa_eye.cv.cid : "",
                            target:win.spa_eye.cv,
                            args:arguments
                        });

                        if (data) {
                            attachTemplatesToViews();
                            return compiledTemplate.call(win._, data);
                        }
                        Events.dispatch(self.listener.fbListeners, 'onViewRender', [win.spa_eye.cv]);

                    } catch (e) {
                        if (FBTrace.DBG_ERRORS)
                            FBTrace.sysout("spa_eye; Unexpected error", e);
                    }

                    return function (data) {
                        if (win[proxiedTemplateRef]) {
                            win[proxiedTemplateRef].source = win[proxiedTemplateRef].source || source;
                            self.recordSequenceEvent(win, {
                                operation:Operation.VIEW,
                                cid:win.spa_eye.cv ? win.spa_eye.cv.cid : "",
                                target:win.spa_eye.cv,
                                args:arguments
                            });
                            attachTemplatesToViews();

                            Events.dispatch(self.listener.fbListeners, 'onViewRender', [win.spa_eye.cv]);
                            return win[proxiedTemplateRef].call(win._, data);
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
                            return self.modelFnWomb(win, this, Operation.SAVE, _saveProxy, arguments);
                        };
                        this.save._proxied = true;
                    }

                    if (!this.fetch._proxied) {
                        var _fetchProxy = this.fetch;
                        this.fetch = function () {
                            return self.modelFnWomb(win, this, Operation.FETCH, _fetchProxy, arguments);
                        };
                        this.fetch._proxied = true;
                    }

                    return self.modelFnWomb(win, this, Operation.SET, _setProxy, arguments);
                }
            },

            registerWPHooks:function (win) {
                Firebug.CommandLine.evaluateInWebPage(
                    Http.getResource(bbhook_wp),
                    this.context,
                    win);
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

            recordModelAudit:function (model, doc) {
                var spa_eyeObj = this.context.spa_eyeObj;
                Events.dispatch(this.listener.fbListeners, 'recordAudit', [model, doc]);
            },

            registerBBHooks:function (win) {
                if (this.isBackboneInitialized(win)) {
                    if (!this.hooked && !this.registering) {
                        try {
                            this.win = win;
                            this.registering = true;
                            this.registerWPHooks(win);
                            this.registerSetHooks(win);
                            this.registerViewHooks(win);
                            if (FBTrace.DBG_SPA_EYE) {
                                FBTrace.sysout("spa_eye; Successfully registered Backbone hooks for spa-eye module");
                            }
                            this.registering = false;
                            this.hooked = true;
                            Events.dispatch(this.listener.fbListeners, 'onBackboneLoaded', [this]);


                        } catch (e) {
                            this.hooked = false;
                            this.registering = false;
                            if (FBTrace.DBG_ERRORS)
                                FBTrace.sysout("Could not register Backbone hooks for spa_eye", e);
                        }
                    }
                }
            },

            isBackboneInitialized:function (win) {
                return win.Backbone;
            },

            modelFnWomb:function (win, model, type, fn, fnargs) {

                win.spa_eye.cm = model;

                win.spa_eye.path.push(model);

                this.recordSequenceEvent(win, {
                    cid:model.cid,
                    target:model,
                    operation:type,
                    args:fnargs
                });

                this.recordModelAudit(model, {
                    operation:type,
                    target:model,
                    args:fnargs
                });

                var result = fn.apply(model, Array.slice(fnargs));

                if (win.spa_eye.cm === win.spa_eye.sr)
                    win.spa_eye.sr = undefined;

                win.spa_eye.cm = undefined;

                win.spa_eye.path.pop();

                var cb = type.charAt(0).toUpperCase() + type.slice(1);
                Events.dispatch(this.listener.fbListeners, 'onModel' + cb, [model]);

                return result;
            },

            recordSequenceEvent:function (win, record) {
                var isNewInteraction = !win.spa_eye.sr;
                record.source = win.spa_eye.path[win.spa_eye.path.length - 2];
                win.spa_eye.sr = win.spa_eye.sr || win.spa_eye.cm;
                if (win.spa_eye.sr && win.spa_eye.sr.cid) {
                    win.spa_eye.sequence[win.spa_eye.sr.cid] = win.spa_eye.sequence[win.spa_eye.sr.cid] || [];
                    var flows =
                        (win.spa_eye.sequence[win.spa_eye.sr.cid].flows =
                            win.spa_eye.sequence[win.spa_eye.sr.cid].flows || []);
                    isNewInteraction ? flows.push([record]) : flows[flows.length - 1].push(record);

                }
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

            models:function () {
                if (this.win) {
                    return this.win.spa_eye.models;
                }
                return [];
            },

            removeModel:function (model) {
                return this._removeElement(this.win && this.win.spa_eye.models,
                    model);
            },

            views:function () {
                if (this.win) {
                    return this.win.spa_eye.views;
                }
                return [];
            },

            removeView:function (view) {
                return this._removeElement(this.win && this.win.spa_eye.views,
                    view);
            },

            collections:function () {
                if (this.win) {
                    return this.win.spa_eye.collections;
                }
                return [];
            },

            removeCollection:function (col) {
                return this._removeElement(this.win && this.win.spa_eye.collections,
                    col);
            },

            _removeElement:function (list, model) {
                if (!list || !model) return;
                var index = list.indexOf(model);
                if (index !== -1) {
                    return list.splice(index, 1);
                }
                return null;
            }
        };


// ********************************************************************************************* //

        return BBHook;

// ********************************************************************************************* //
    });
