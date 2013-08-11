/* See license.txt for terms of usage */
/*jshint esnext:true, es5:true, curly:false */
/*global FBTrace:true, XPCNativeWrapper:true, Window:true, define:true */

define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/events",
    "firebug/lib/css",
    "firebug/lib/string",
    "firebug/lib/dom",

    "spa_eye/lib/lru",
    "spa_eye/plates/basePlate",

    "spa_eye/dom/section",
    "spa_eye/dom/modelReps",
    "spa_eye/dom/domEditor"

],
    function (Firebug, Obj, FBTrace, Locale, Events, Css, Str, Dom, MostUsed, BasePlate, ChildSection, ModelReps, DOMEditor) {

        var PANEL = BasePlate.extend({
            name:'model',

            initialize:function (options) {
                var spa_eyeObj = options.context.spa_eyeObj,
                    self = this;

                spa_eyeObj._mostused_models = spa_eyeObj._mostused_models ||
                    new MostUsed({
                        limit:10,
                        onPurge:function (node) {
                            var mSection = self.sections[1];
                            mSection && mSection._onRowRemove(node.value);
                        },
                        onAdd:function (node) {
                            var mSection = self.sections[1];
                            mSection && mSection._onRowAdd(node.value, {
                                autoAdd:true
                            });
                        }
                    });
                this._super.apply(this, arguments);
            },

            createSections:function () {
                var sections = [],
                    spa_eyeObj = this.context.spa_eyeObj;

                var pinned = new ChildSection({
                    name:'pinned_models',
                    title:Locale.$STR('spa_eye.models.pinned'),
                    parent:this.parent.panelNode,
                    order:0,
                    container:'pinnedModelsDiv',
                    body:'pinnedModelsDivBody',
                    autoAdd:false,
                    data:spa_eyeObj._pinned_models,
                    onRowRemove:function (model) {
                        if (!model || !model.cid) return;
                        delete spa_eyeObj._pinned_models[model.cid];
                    }
                });

                var mostUsed = new ChildSection({
                    name:'most_used_models',
                    title:Locale.$STR('spa_eye.models.mostused'),
                    parent:this.parent.panelNode,
                    order:1,
                    container:'mostUsedModelsDiv',
                    body:'mostUsedModelsDivBody',
                    autoAdd:false,
                    data:FBL.bindFixed(spa_eyeObj._mostused_models.values, spa_eyeObj._mostused_models),
                    onRowRemove:function (model) {
                        if (!model || !model.cid) return;
                        spa_eyeObj._mostused_models.remove(model.cid);
                    }
                });

                var allModels = new ChildSection({
                    name:'all_models',
                    title:Locale.$STR('spa_eye.all'),
                    parent:this.parent.panelNode,
                    order:2,
                    container:'allModelsDiv',
                    body:'allModelsDivBody',
                    data:FBL.bindFixed(spa_eyeObj.getModels, spa_eyeObj),
                    onRowRemove:function (model) {
                        if (!model || !model.cid) return;
                        return spa_eyeObj.removeModel(model);
                    }
                });

                sections.push(pinned, mostUsed, allModels);

                return sections;
            },

            onSelectRow:function (row) {
                var spa_eyeObj = this.context.spa_eyeObj;
                if (!row || !row.domObject.value) return;
                var m = row.domObject.value;
                if (!m || !m.cid) return;
                spa_eyeObj.selectedEntity = m;
                Events.dispatch(spa_eyeObj._spaHook.listener.fbListeners, 'onSelectedEntityChange', [m]);
            },

// ********************************************************************************************* //
// Pin Model
// ********************************************************************************************* //

            pinOptionChange:function (row) {
                var model = row.domObject.value,
                    cid = null;
                if (!model || !model.cid) return;

                cid = model.cid;

                if (this.context.spa_eyeObj._pinned_models[cid]) { // Already Pinned
                    this._unPinModel(model);
                } else { // Pin this model
                    this._pinModel(model);
                }
            },

            _pinModel:function (model) {
                if (this.context.spa_eyeObj._pinned_models[model.cid]) { // Already Pinned
                    return;
                }
                try {
                    this.context.spa_eyeObj._pinned_models[model.cid] = model;
                    var pinSection = this.sections[0];
                    pinSection._onRowAdd(model, {
                        autoAdd:true
                    });
                } catch (e) {
                    if (FBTrace.DBG_SPA_EYE) {
                        FBTrace.sysout("Error: model.cid - " + model.cid, e);
                    }
                }
            },

            _unPinModel:function (model) {
                var pinSection = this.sections[0];
                pinSection._onRowRemove(model);
            },

// ********************************************************************************************* //
// Editable
// ********************************************************************************************* //

            setValue:function (obj, key, value) {
                obj.set(key, value);
            },

// ********************************************************************************************* //
// onModelSet and onModelSave
// ********************************************************************************************* //
            onModelSet:function (model) {
                this.context.spa_eyeObj._mostused_models.add(model.cid, model, 'set');
            },

            onModelSave:function (model) {
                this.context.spa_eyeObj._mostused_models.add(model.cid, model, 'save');
            }

        });

        return PANEL;
    });
