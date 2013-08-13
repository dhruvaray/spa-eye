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

        var _frame = [], _sequences = {}, _templates = {}, _auditRecords = {}, _errors = [];
        var _current = {Model:undefined, Collection:undefined, View:undefined};
        var _sequence = {Model:undefined, Collection:undefined, View:undefined};
        var _models = [];
        var _collections = [];
        var _views = [];
        var _zombies = {};
        var _deleted = [];


        var Operation = Common.Operation;

        var BBHook = function (obj) {
            this.hooked = false;
            this.context = null;
            this.listener = new Firebug.Listener();
            if (obj) {
                for (var key in obj) {
                    this[key] = obj[key];
                }
            }
            var self = this;
            this.function_womb = {};
            this.function_womb.Operation = function (post, entity, entity_type, operation_type, fnargs) {
                var result;
                var state = '';

                try {

                    _current[entity_type] = entity;

                    if (!post) {

                        _frame.push(entity);

                        try {
                            state = (typeof entity.attributes !== 'undefined') ?
                                _.clone(entity.attributes) :
                                entity
                        } catch (e) {
                            state = entity;
                        }

                        self.recordSequenceEvent({
                            cid:entity.cid,
                            target:state,
                            operation:operation_type,
                            args:fnargs
                        });

                        self.recordAuditEvent({
                            cid:entity.cid,
                            operation:operation_type,
                            target:state,
                            args:fnargs
                        });

                        if (!_.contains(_deleted, entity.cid)) {
                            self.markAsZombie(entity);
                        }

                        if (Operation.DESTROY === operation_type || Operation.REMOVE === operation_type) {
                            if (!(entity instanceof self.Backbone.Collection)) {
                                entity.__mfd__ = true;
                                _deleted.push(entity.cid);
                            }
                        }

                        Events.dispatch(self.listener.fbListeners, 'onBackboneEvent', [entity, operation_type]);

                    } else {

                        if (_current[entity_type] === _sequence[entity_type])
                            _sequence[entity_type] = undefined;

                        _current[entity_type] = undefined;
                        _frame.pop();

                        if (!_frame.length) //empty
                            _deleted = [];
                    }
                } catch (e) {
                    self.logError(e);
                }

            };

        }

        BBHook.prototype = {
            constructor:BBHook,

            markAsZombie:function (entity) {
                if (entity.__mfd__) {
                    _zombies[entity.cid] = entity;
                    Events.dispatch(this.listener.fbListeners, 'onBackboneZombieDetected', [entity]);
                }
            },


            inferScriptForView:function (script_id) {
                var rendered = _current.View;
                if (rendered) {// Is this being rendered in context of a view?
                    var templates = rendered.__templates__;
                    if (templates.indexOf(script_id) == -1) {
                        templates.push(script_id);
                    }
                }
            },

            createDebuggableScript:function (root, script_id, text) {
                var self = this;
                try {
                    var source = _.template.call(_, text).source;
                    var proxiedTemplateRef = '_t' + script_id;
                    var f = escape("window['" + proxiedTemplateRef + "']=" + source);
                    DOM.appendExternalScriptTagToHead(root.document,
                        "data:text/javascript;fileName=" + script_id + ";," + f);
                    _templates[script_id] = text;
                } catch (e) {
                    self.logError(e);
                }
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

                root.document && root.document.addEventListener("afterscriptexecute", register);
                root.addEventListener("load", register);
                root.addEventListener('Backbone_Eye:ADD', function (e) {

                    var target = e.detail && e.detail.data;

                    if (target instanceof self.Backbone.View) {
                        target.cid = target.cid || _.uniqueId('view');
                        _views.push(_.extend(target, {__templates__:[], __mfd__:false}));
                    } else if (target instanceof self.Backbone.Model) {
                        _models.push(target);
                        target.cid = target.cid || _.uniqueId('c');
                    } else if (target instanceof self.Backbone.Collection) {
                        _collections.push(target);
                        target.cid = target.cid || _.uniqueId('col');
                    }

                    Events.dispatch(self.listener.fbListeners, 'onBackboneEntityAdded', [e]);
                });
                root.addEventListener('Backbone_Eye:RECORD', function (e) {

                    //{'detail':{entity:this, post:false, args:arguments, type:type}}
                    if (e.detail)
                        var data = e.detail;
                    self.function_womb.Operation(
                        data.post,
                        data.entity,
                        data.entity_type,
                        data.operation_type,
                        data.args
                    )

                });
                root.addEventListener('Backbone_Eye:ERROR', function (e) {
                    self.logError(e.detail.error);
                });
                root.addEventListener('Backbone_Eye:TEMPLATE:ADD', function (e) {
                    self.createDebuggableScript(root, e.detail.script_id, e.detail.text);
                });
                root.addEventListener('Backbone_Eye:TEMPLATE:INFER', function (e) {
                    self.inferScriptForView(e.detail.script_id);
                });

            },

            registerBBHooks:function (root) {
                if (this.isBackboneInitialized(root)) {
                    if (!this.hooked) {
                        try {
                            this.hooked = true;
                            this.root = root;
                            this.Backbone = root.Backbone;
                            this.Underscore = root._;
                            this.registerWPHooks(root);
                            if (FBTrace.DBG_SPA_EYE) {
                                FBTrace.sysout("spa_eye; Successfully registered Backbone hooks for spa-eye module");
                            }
                            Events.dispatch(this.listener.fbListeners, 'onBackboneLoaded', [this]);

                        } catch (e) {
                            this.hooked = false;
                            this.logError(e);
                        }
                    }
                }
            },

            isBackboneInitialized:function (root) {
                return root.Backbone;
            },

            recordSequenceEvent:function (record) {

                if (!this.context.spa_eyeObj.isRecording) return;

                try {

                    record.source = _frame[_frame.length - 2];

                    var isNewInteractionModel = (!_sequence.Model);
                    var isNewInteractionCollection = (!_sequence.Collection);
                    var isNewInteractionView = (!_sequence.View);

                    _sequence.Model = _sequence.Model || _current.Model;
                    _sequence.Collection = _sequence.Collection || _current.Collection;
                    _sequence.View = _sequence.View || _current.View;

                    _.each([_sequence.Model, _sequence.Collection, _sequence.View], function (sr) {
                        if (sr && sr.cid) {
                            _sequences[sr.cid] = _sequences[sr.cid] || [];
                            var flows =
                                (_sequences[sr.cid].flows =
                                    _sequences[sr.cid].flows || []);
                            var isNewInteraction = false;

                            if (sr instanceof this.Backbone.Model)
                                isNewInteraction = isNewInteractionModel;
                            if (sr instanceof this.Backbone.Collection)
                                isNewInteraction = isNewInteractionCollection;
                            if (sr instanceof this.Backbone.View)
                                isNewInteraction = isNewInteractionView;

                            isNewInteraction ? flows.push([record]) : flows[flows.length - 1].push(record);
                        }

                    }, this);
                } catch (e) {
                    this.logError(e);
                }
            },

            recordAuditEvent:function (record) {
                // return if `record` is off
                var spa_eyeObj = this.context.spa_eyeObj;
                if (!spa_eyeObj.isRecording) return;

                if (record.cid) {
                    try {
                        t = DateUtil.getFormattedTime(new Date());
                        _auditRecords[record.cid] || (_auditRecords[record.cid] = {});
                        _auditRecords[record.cid][t] = record;
                    } catch (e) {
                        this.logError(e);
                        t ?
                            (_auditRecords[record.cid][t] = e) :
                            (_auditRecords[record.cid][_.uniqueId('e')] = e)

                    }
                }
            },

            cleanup:function () {
                this.hooked = false;
                _models = [];
                _collections = [];
                _views = [];
                _errors = [];
                _zombies = {};
                this.resetTrackingData();
            },

            resetTrackingData:function () {
                _sequences = {}
                _templates = {};
                _auditRecords = {};
                _frame = [];
                _current = {Model:undefined, Collection:undefined, View:undefined};
                _sequence = {Model:undefined, Collection:undefined, View:undefined};
                _deleted = [];
            },

            models:function () {
                return _models;
            },

            zombies:function () {
                return _zombies;
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

            journals:function () {
                return _auditRecords;
            },

            errors:function () {
                return _errors;
            },

            logError:function (e) {
                //if (FBTrace.DBG_ERRORS) {
                _errors.push(e);
                Events.dispatch(self.listener.fbListeners, 'onIntrospectionError', [e]);
                FBTrace.sysout("spa_eye; Unexpected error", e);
                //}
            },

            views:function (options) {
                if (!options || options.all)
                    return _views;

                return _.filter(_views, function (view) {
                    return !view.__mfd__ == options.live;
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

        return BBHook;
    });
