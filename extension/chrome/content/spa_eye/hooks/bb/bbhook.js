/* See license.txt for terms of usage */

define([
    "firebug/lib/trace",
    "firebug/lib/http",
    "firebug/lib/events",
    "firebug/debugger/debuggerLib",
    "firebug/lib/wrapper",

    "spa_eye/lib/dom",
    "spa_eye/lib/date",

    "spa_eye/lib/require/underscore",
    "spa_eye/util/common"
],
    function (FBTrace, Http, Events, DebuggerLib, Wrapper, DOM, DateUtil, _, Common) {

// ********************************************************************************************* //
// Constants

        const bbhook_wp = "chrome://spa_eye/content/hooks/bb/bbhook_wp.js";
        const bbhook_template_engines = "chrome://spa_eye/content/hooks/bb/template_engines.js";

        var Operation = Common.Operation;
        var EntityType = Common.EntityType;

        var BBHook = function (obj) {

            // Data container cleanup
            this.cleanup();

            // Creating new listener
            this.listener = new Firebug.Listener();

            // Options
            if (obj) {
                for (var key in obj) {
                    this[key] = obj[key];
                }
            }

            if (Firebug.getPref(Firebug.prefDomain, "extensions.firebug.spa_eye.check.deep")) {
                // Get a debugger for the current context (top level window and all iframes).
                this.dbg = DebuggerLib.makeDebuggerForContext(this.context);
                // Hook function calls.
                this.dbg.onEnterFrame = this.onEnterFrame.bind(this);
            }

            // Womb initialization
            var self = this;
            this.function_womb = {};
            this.function_womb.Operation = function (post, entity, entity_type, operation_type, fnargs) {
                var result;
                var state = '';

                try {
                    self._current[entity_type] = entity;
                    if (!post) {
                        self._frame.push(entity);
                        if (entity_type === EntityType.Model) {
                            try {
                                state = (typeof entity.attributes !== 'undefined') ?
                                    _.clone(entity.attributes) :
                                    entity
                            } catch (e) {
                                state = entity;
                            }
                        } else {
                            state = entity.cid;
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

                        if (!_.contains(self._deleted, entity.cid)) {
                            self.markAsZombie(entity);
                        }

                        if (Operation.DESTROY === operation_type || Operation.REMOVE === operation_type) {
                            if (!(entity_type === EntityType.Collection)) {
                                entity.__mfd__ = true;
                                self._deleted.push(entity.cid);
                            }
                        }

                        if (entity_type === EntityType.Model &&
                            self.context.spa_eyeObj &&
                            self.context.spa_eyeObj._mostused_models &&
                            (Operation.SAVE === operation_type || Operation.SET === operation_type)) {
                            self.context.spa_eyeObj._mostused_models.add(entity.cid, entity, operation_type);
                        }

                        Events.dispatch(self.listener.fbListeners, 'onBackboneEvent', [entity, operation_type]);
                    } else {
                        self._frame.pop();
                        if (!_.contains(self._frame, self._current[entity_type]))
                            self._sequence[entity_type] = undefined;

                        if (!self._frame.length) //empty
                            self._deleted = [];

                        self._current[entity_type] = undefined;
                    }
                } catch (e) {
                    self.logError(e);
                }
            };
        }

        BBHook.prototype = {
            constructor:BBHook,

            setDeepCheck: function (val) {
                this.deepCheck = val;
            },

            isDeepCheckEnabled: function () {
                return this.deepCheck;
            },

            onEnterFrame: function (frame) {

                if (frame.live && frame.script) {
                    frame.onPop = this.onPopFrame.bind(this, frame);
                }
            },

            onPopFrame: function (frame, completionValue) {

                var env = frame.environment;

                if (!env)
                    return;

                var root = DebuggerLib.unwrapDebuggeeValue(frame.script.global);
                var scope_ = DebuggerLib.unwrapDebuggeeValue(env.getVariable('_'));
                var scope_bb = DebuggerLib.unwrapDebuggeeValue(env.getVariable('Backbone'));

                if (root && scope_ && scope_bb) {

                    // backup for `_` and `Backbone`
                    var us = root._,
                        bb = root.Backbone;

                    root._ = scope_;
                    root.Backbone = scope_bb;

                    this.registerContentLoadedHook(root);
                    this.registerBBHooks(root);

                    // reset global `_` and `Backbone`
                    root._ = us;
                    root.Backbone = bb;

                    //remove since we have found a ref
                    this.dbg.onEnterFrame = undefined;
                    frame.onPop = undefined;//safe?
                    DebuggerLib.destroyDebuggerForContext(this.context, this.dbg);
                }

            },


            markAsZombie:function (entity) {
                if (entity.__mfd__) {
                    this._zombies[entity.cid] = entity;
                    Events.dispatch(this.listener.fbListeners, 'onBackboneZombieDetected', [entity]);
                }
            },


            inferScriptForView:function (script_id) {
                var rendered = this._current.View;
                var id = String.quote(script_id);
                if (rendered) {// Is this being rendered in context of a view?
                    var templates = rendered.__templates__;
                    if (templates.indexOf(id) == -1) {
                        templates.push(id);
                    }
                }
            },

            createDebuggableScript:function (root, script_id, text, settings) {
                var self = this;
                try {
                    var source = _.template.call(_, text, undefined, settings).source;
                    var f = encodeURIComponent("window[" + String.quote("_t"+ script_id) + "]=" + source);
                    DOM.appendExternalScriptTagToHead(root.document,
                        "data:text/javascript;fileName=" + String.quote(script_id) + ";," + f);
                    this._templates[String.quote(script_id)] = text;
                } catch (e) {
                    self.logError(e);
                }
            },

            registerContentHooks: function (root) {
                Firebug.CommandLine.evaluateInWebPage(
                    Http.getResource(bbhook_wp),
                    this.context,
                    root);
                Firebug.CommandLine.evaluateInWebPage(
                    Http.getResource(bbhook_template_engines),
                    this.context,
                    root);
            },

            registerContentLoadedHook:function (root) {

                if (_.indexOf(this._roots, root) != -1) //already registered
                    return;

                this._roots.push(root);

                var self = this;
                var register = function () {
                    self.registerBBHooks(root);
                };

                root.document && root.document.addEventListener("afterscriptexecute", register);
                root.addEventListener("load", register);
                root.addEventListener('Backbone_Eye:ADD', function (e) {

                    var target = e.detail && e.detail.data;
                    var entity_type = e.detail && e.detail.entity_type;

                    if (entity_type === EntityType.View) {
                        target.cid = target.cid || _.uniqueId('view');
                        self._views.push(_.extend(target, {__templates__:[], __mfd__:false}));
                    } else if (entity_type === EntityType.Model) {
                        self._models.push(target);
                        target.cid = target.cid || _.uniqueId('c');
                    } else if (entity_type === EntityType.Collection) {
                        self._collections.push(target);
                        target.cid = target.cid || _.uniqueId('col');
                    }

                    Events.dispatch(self.listener.fbListeners, 'onBackboneEntityAdded', [e]);
                });
                root.addEventListener('Backbone_Eye:RECORD', function (e) {
                    //{'detail':{entity:this, post:false, args:arguments, type:type}}
                    if (!e.detail) return;
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
                    self.createDebuggableScript(root,
                        e.detail.script_id,
                        e.detail.text,
                        e.detail.settings);
                });
                root.addEventListener('Backbone_Eye:TEMPLATE:INFER', function (e) {
                    self.inferScriptForView(e.detail.script_id);
                });

            },

            registerBBHooks: function (root) {
                if (this.isBackboneInitialized(root)) {
                    if (!this.hooked) {
                        try {
                            this.hooked = true;
                            this.Backbone = root.Backbone;
                            this.Underscore = root._;
                            this.registerContentHooks(root);
                            if (FBTrace.DBG_SPA_EYE) {
                                FBTrace.sysout("spa_eye; Successfully registered Backbone hooks for spa-eye module");
                            }
                            //Listen to the first Backbone instance only.
                            if (this.jsd) {
                                this.jsd.functionHook = null;
                                this.jsd = null;
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

                if (!Firebug.Options.get("spa_eye.record")) return;

                try {

                    record.source = this._frame[this._frame.length - 2];

                    var isNewInteractionModel = (!this._sequence.Model) || (!this._sequence.Model.entity);
                    var isNewInteractionCollection = (!this._sequence.Collection) || (!this._sequence.Collection.entity);
                    var isNewInteractionView = (!this._sequence.View) || (!this._sequence.View.entity);

                    if ((!this._sequence.Model) || (!this._sequence.Model.entity)) {
                        this._sequence.Model = {entity:this._current.Model, entity_type:EntityType.Model};
                    }
                    if ((!this._sequence.Collection) || (!this._sequence.Collection.entity)) {
                        this._sequence.Collection = {entity:this._current.Collection, entity_type:EntityType.Collection};
                    }
                    if ((!this._sequence.View) || (!this._sequence.View.entity)) {
                        this._sequence.View = {entity:this._current.View, entity_type:EntityType.View};
                    }

                    _.each([this._sequence.Model, this._sequence.Collection, this._sequence.View], function (seq_type) {
                        var sr = seq_type.entity;
                        var type = seq_type.entity_type;
                        if (sr && sr.cid) {
                            this._sequences[sr.cid] = this._sequences[sr.cid] || [];
                            var flows =
                                (this._sequences[sr.cid].flows =
                                    this._sequences[sr.cid].flows || []);
                            var isNewInteraction = false;

                            if (type === EntityType.Model)
                                isNewInteraction = isNewInteractionModel;
                            else if (type === EntityType.Collection)
                                isNewInteraction = isNewInteractionCollection;
                            else if (type === EntityType.View)
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
                if (!Firebug.Options.get("spa_eye.record")) return;

                if (record.cid) {
                    try {
                        t = DateUtil.getFormattedTime(new Date());
                        this._auditRecords[record.cid] || (this._auditRecords[record.cid] = []);
                        this._auditRecords[record.cid].push(record);
                    } catch (e) {
                        this.logError(e);
                    }
                }
            },

            cleanup:function () {
                this.hooked = false;
                this._models = [];
                this._collections = [];
                this._views = [];
                this._errors = [];
                this._zombies = {};
                this._roots = [];
                this.resetTrackingData();
            },

            resetTrackingData:function () {
                this._sequences = {};
                this._templates = {};
                this._auditRecords = {};
                this._frame = [];
                this._current = {Model:undefined, Collection:undefined, View:undefined};
                this._sequence = {Model:undefined, Collection:undefined, View:undefined};
                this._deleted = [];
            },

            models:function () {
                return this._models;
            },

            zombies:function () {
                return this._zombies;
            },

            removeModel:function (model) {
                return this._removeElement(this._models, model);
            },

            sequences:function () {
                return this._sequences;
            },

            templates:function () {
                return this._templates;
            },

            journals:function () {
                return this._auditRecords;
            },

            errors:function () {
                return this._errors;
            },

            logError:function (e) {
                this._errors.push(e);
                var eye_logs = this.context.getPanel("spa_eye:logs");
                eye_logs && Events.dispatch([eye_logs], 'onIntrospectionError', [e]);
                if (FBTrace.DBG_SPA_EYE) {
                    FBTrace.sysout("spa_eye; Unexpected error", e);
                }
            },

            views:function (options) {
                if (!options || options.all)
                    return this._views;

                return _.filter(this._views, function (view) {
                    return !view.__mfd__ == options.live;
                });
            },

            removeView:function (view) {
                return this._removeElement(this._views, view);
            },

            collections:function () {
                return this._collections;
            },

            removeCollection:function (col) {
                return this._removeElement(this._collections, col);
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

