/* See license.txt for terms of usage */

define([
    "firebug/lib/trace",
    "firebug/lib/http",
    "firebug/lib/events",
    "firebug/lib/dom",


    "spa_eye/lib/sha",
    "spa_eye/lib/dom",
    "spa_eye/lib/uri",
    "spa_eye/lib/date",

    "spa_eye/lib/require/underscore",
    "spa_eye/util/common"
],
    function (FBTrace, Http, Events, Dom, SHA, DOM, URI, DateUtil, _, Common) {

// ********************************************************************************************* //
// Constants

        const Cc = Components.classes;
        const Ci = Components.interfaces;
        const Cr = Components.results;
        const bbhook_wp = "chrome://spa_eye/content/hooks/bb/bbhook_wp.js";

        var _csr, _msr, _vsr, _cm, _cc, _cv, _path = [], _sequences = {}, _templates = {};
        var _models, _collections, _views;

        var Operation = Common.Operation;

// ********************************************************************************************* //
//  BBHook Class
// ********************************************************************************************* //
        var BBHook = function (obj) {
            this.hooked = false;
            this.context = null;
            this.listener = new Firebug.Listener();
            this.registering = false;
            _models = [];
            _collections = []
            _views = [];
            if (obj) {
                for (var key in obj) {
                    this[key] = obj[key];
                }
            }
            var self = this;
            this.function_womb = {};
            this.function_womb.MODEL = function (root, model, type, fn, fnargs) {

                _cm = model;

                _path.push(model);

                self.recordSequenceEvent(root, {
                    cid:model.cid,
                    target:model.toJSON(),
                    operation:type,
                    args:fnargs
                });

                self.recordAuditEvent(model, {
                    cid:model.cid,
                    operation:type,
                    target:model.toJSON(),
                    args:fnargs
                });

                var result = fn.apply(model, Array.slice(fnargs));

                if (_cm === _msr)
                    _msr = undefined;

                _cm = undefined;

                _path.pop();

                Events.dispatch(self.listener.fbListeners, 'onBackboneEvent', [model, type]);

                return result;
            };
            this.function_womb.COLLECTION = function (root, collection, type, fn, fnargs) {

                _cc = collection;

                _path.push(collection);

                self.recordSequenceEvent(root, {
                    cid:collection.cid,
                    target:collection.toJSON(),
                    operation:type,
                    args:fnargs
                });

                self.recordAuditEvent(collection, {
                    cid:collection.cid,
                    operation:type,
                    target:collection.toJSON(),
                    args:fnargs
                });

                var result = fn.apply(collection, Array.slice(fnargs));

                if (_cc === _csr)
                    _csr = undefined;

                _cc = undefined;

                _path.pop();

                Events.dispatch(self.listener.fbListeners, 'onBackboneEvent', [collection, type]);

                return result;
            }
            this.function_womb.TEMPLATE = function (root, script_id, fn, fnargs, data) {
                var result;

                var attachTemplatesToViews = function () {
                    var rendered = _cv;
                    if (rendered) {
                        var templates = rendered.inferredTemplates;
                        if (templates.indexOf(script_id) == -1) {
                            templates.push(script_id);
                        }
                    }
                };

                self.recordSequenceEvent(root, {
                    operation:Operation.RENDER,
                    cid:_cv ? _cv.cid : "",
                    target:_cv,
                    args:fnargs
                });

                if (data) {
                    attachTemplatesToViews();
                    result = fn.call(self.UnderScore, data);
                }
                Events.dispatch(self.listener.fbListeners, 'onBackboneEvent', [_cv, Operation.RENDER]);
                return result;
            }

            this.function_womb.VIEW = {};
            this.function_womb.VIEW.render = function (root, view, fn, fnargs) {
                _cv = view;
                view.inferredTemplates = view.inferredTemplates || [];
                _path.push(view);
                var result = fn.apply(view, fnargs);
                _path.pop();
                _cv = undefined;
                return result;
            };
            this.function_womb.VIEW.remove = function (root, view, fn, fnargs) {
                var result = fn.apply(view, fnargs);
                view.mfd = true;
                Events.dispatch(self.listener.fbListeners, 'onBackboneEvent', [view, Operation.REMOVE]);
                return result;
            };

        }

        BBHook.prototype = {
            constructor:BBHook,

            registerViewHooks:function (root) {
                var self = this;
                var watch = function (id, oldval, newval) {
                    return function () {
                        var args = [root, newval];
                        args.push.apply(args, arguments);
                        return self.registerTemplateHook.apply(self, args);
                    }
                }
                if (root._) {
                    root._.watch("template", watch);
                    root._["template"] = root._["template"];
                }
            },

            registerTemplateHook:function (root, original, text, data, settings) {

                var self = this;
                try {
                    if (!text) {
                        if (FBTrace.DBG_SPA_EYE) {
                            FBTrace.sysout("spa_eye; template text is empty ");
                        }
                        return false;
                    }
                    var script = DOM.getMatchingNode(root, "script", text)
                    var script_id = (script && script.id) ? script.id : SHA.getTextHash(text);
                    var proxiedTemplateRef = '_t' + script_id;
                    var compiledTemplate = root[proxiedTemplateRef];

                    if (!compiledTemplate) {
                        compiledTemplate = original.call(root._, text);
                        var source = _.template.call(_, text).source;
                        if (source) {
                            var f = escape("window['" + proxiedTemplateRef + "']=" + source);
                            DOM.appendExternalScriptTagToHead(root.document,
                                "data:text/javascript;fileName=" + script_id + ";," + f);
                            _templates[script_id] = text;
                        }
                    }
                    var result = self.function_womb.TEMPLATE(root, script_id, compiledTemplate, [text, data, settings], data);
                    if (result) return result;

                } catch (e) {
                    if (FBTrace.DBG_ERRORS)
                        FBTrace.sysout("spa_eye; Unexpected error", e);
                }
                return function (templateData) {
                    var render = root[proxiedTemplateRef] ? root[proxiedTemplateRef] : compiledTemplate;
                    return self.function_womb.TEMPLATE(root, script_id, render, arguments, templateData);
                };
            },

            registerSetHooks:function (root) {
                var self = this;
                var ModelProto = self.Backbone.Model.prototype;
                var CollectionProto = self.Backbone.Collection.prototype;

                var getWatch = function (womb) {
                    var watch = function (id, oldval, newval) {
                        return function () {
                            return womb.call(self, root, this, id, newval, arguments);
                        }
                    }
                    return watch;
                }

                _.each(Operation, function (key) {
                    if (ModelProto[key]) {
                        ModelProto.watch(key, getWatch(self.function_womb.MODEL));
                        ModelProto[key] = ModelProto[key];
                    }
                    if (CollectionProto[key]) {
                        CollectionProto.watch(key, getWatch(self.function_womb.COLLECTION));
                        CollectionProto[key] = CollectionProto[key];
                    }
                });
            },

            registerWPHooks:function (root) {
                Firebug.CommandLine.evaluateInWebPage(
                    Http.getResource(bbhook_wp),
                    this.context,
                    root);
            },

            registerContentLoadedHook:function (root) {
                var self = this;
                var register = function () {
                    self.registerBBHooks(root);
                };
                root.document.addEventListener("afterscriptexecute", register);
                root.addEventListener("load", register);
                root.addEventListener('Backbone_Eye:ADD', function (e) {

                    /*var viewInstanceFnWomb = function (womb, view) {
                     return function (id, oldval, newval) {
                     return function () {
                     var args = [root, view, newval];
                     args.push.apply(args, arguments);
                     return womb.apply(view, args);
                     }
                     };
                     };*/

                    var viewInstanceFnWomb = function (womb, view, oldInstanceFn) {
                        return function () {
                            var args = [root, view, oldInstanceFn];
                            args.push.apply(args, arguments);
                            return womb.apply(view, args);
                        }
                    };

                    var target = e.detail.data;

                    if (target instanceof self.Backbone.View) {
                        _views.push(target);
                        target.cid = target.cid || _.uniqueId('view');
                        /*_.each(Operation, function (key) {
                         if (target[key]) {
                         target.watch(key, viewInstanceFnWomb(self.function_womb.VIEW[key], target));
                         target[key] = target[key];
                         }
                         });*/
                        //target.render = viewInstanceFnWomb(self.function_womb.VIEW[render], target, target.render)
                    }
                    if (target instanceof self.Backbone.Model) {
                        _models.push(target);
                        target.cid = target.cid || _.uniqueId('c');
                    }
                    if (target instanceof self.Backbone.Collection) {
                        _collections.push(target);
                        target.cid = target.cid || _.uniqueId('col');
                    }

                    Events.dispatch(self.listener.fbListeners, 'onBackboneEntityAdded', [e]);
                });

            },

            registerBBHooks:function (root) {
                var spa_eyeObj = this.context.spa_eyeObj;
                if (this.isBackboneInitialized(root)) {
                    if (!this.hooked && !this.registering) {
                        try {
                            this.registering = true;
                            this.root = root;
                            this.Backbone = root.Backbone;
                            this.UnderScore = root._;
                            this.registerWPHooks(root);
                            this.registerSetHooks(root);
                            this.registerViewHooks(root);
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

            isBackboneInitialized:function (root) {
                return root.Backbone;
            },

            recordSequenceEvent:function (root, record) {

                if (!this.context.spa_eyeObj.isRecord) {
                    return;
                }
                record.source = _path[_path.length - 2];

                var csr = _csr;
                var msr = _msr;
                var isNewInteractionModel = (!msr);
                var isNewInteractionCollection = (!csr);
                _csr = csr || _cc;
                _msr = msr || _cm;

                var process = [];
                _csr && (process.push(_csr));
                _msr && (process.push(_msr));


                try {
                    _.each(process, function (sr) {
                        if (sr && sr.cid) {
                            _sequences[sr.cid] = _sequences[sr.cid] || [];
                            var flows =
                                (_sequences[sr.cid].flows =
                                    _sequences[sr.cid].flows || []);
                            var isNewInteraction = sr instanceof this.Backbone.Model ?
                                isNewInteractionModel :
                                isNewInteractionCollection;

                            isNewInteraction ? flows.push([record]) : flows[flows.length - 1].push(record);
                        }

                    }, this);
                } catch (e) {
                    if (FBTrace.DBG_ERRORS)
                        FBTrace.sysout("spa_eye; Unexpected error", e);
                }
            },

            recordAuditEvent:function (model, record) {
                // return if `record` is off
                var spa_eyeObj = this.context.spa_eyeObj;

                if (!spa_eyeObj.isRecord) {
                    return;
                }
                t = DateUtil.getFormattedTime(new Date());
                var records = spa_eyeObj.auditRecords = spa_eyeObj.auditRecords || {};

                records[model.cid] || (records[model.cid] = []);
                var rec = {};
                rec[t] = record;
                records[model.cid].splice(0, 0, rec);
            },

            cleanup:function () {
                this.hooked = false;
                _models = [];
                _collections = [];
                _views = [];
                this.resetTrackingData();
            },

            resetTrackingData:function () {
                _sequences = _templates = {};
                _path = [];
                _csr = _msr = _vsr = undefined;
                _cm = _cc = _cv = undefined;
            },

            models:function () {
                return _models;
            },

            removeModel:function (model) {
                return this._removeElement(_models, model);
            },

            sequences:function () {
                return _sequences;
            },

            templates:function () {
                return _templates;
            },

            views:function (options) {
                if (!options || options.all)
                    return _views;

                return _.filter(_views, function (view) {
                    return !view.mfd == options.live;
                });
            },

            removeView:function (view) {
                return this._removeElement(_views, view);
            },

            collections:function () {
                return _collections;
            },

            removeCollection:function (col) {
                return this._removeElement(_collections, col);
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
