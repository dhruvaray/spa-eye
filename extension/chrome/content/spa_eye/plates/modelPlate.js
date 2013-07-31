/* See license.txt for terms of usage */
/*jshint esnext:true, es5:true, curly:false */
/*global FBTrace:true, XPCNativeWrapper:true, Window:true, define:true */

define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/css",
    "firebug/lib/string",
    "firebug/lib/dom",

    "spa_eye/lib/lru",
    "spa_eye/plates/basePlate",

    "spa_eye/dom/section",
    "spa_eye/dom/modelReps",
    "spa_eye/dom/domEditor"

],
    function (Firebug, Obj, FBTrace, Css, Str, Dom, MostUsed, BasePlate, ChildSection, ModelReps, DOMEditor) {

        var NetRequestEntry = Firebug.NetMonitor.NetRequestEntry;

        var PANEL = BasePlate.extend({
            name:'model',

            initialize:function (options) {
                var spa_eyeObj = options.context.spa_eyeObj,
                    self = this;

                spa_eyeObj._mostused_models = spa_eyeObj._mostused_models ||
                    new MostUsed({
                        limit:10,
                        onPurge:function (node) {
                            self.onRemoveModel(node.value, self.sections[1]);
                        },
                        onAdd:function (node) {
                            self.onAddModel(node.value, self.sections[1], {
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
                    title:'Pinned Models',
                    parent:this.parent.panelNode,
                    order:0,
                    container:'pinnedModelsDiv',
                    body:'pinnedModelsDivBody',
                    autoAdd:false,
                    data:spa_eyeObj._pinned_models,
                    onRemoveModel:function (model) {
                        if (!model || !model.cid) return;
                        delete spa_eyeObj._pinned_models[model.cid];
                    }
                });

                var mostUsed = new ChildSection({
                    name:'most_used_models',
                    title:'Most Used',
                    parent:this.parent.panelNode,
                    order:1,
                    container:'mostUsedModelsDiv',
                    body:'mostUsedModelsDivBody',
                    autoAdd:false,
                    data:FBL.bindFixed(spa_eyeObj._mostused_models.values, spa_eyeObj._mostused_models),
                    onRemoveModel:function (model) {
                        if (!model || !model.cid) return;
                        spa_eyeObj._mostused_models.remove(model.cid);
                    }
                });

                var allModels = new ChildSection({
                    name:'all_models',
                    title:'All Models',
                    parent:this.parent.panelNode,
                    order:2,
                    container:'allModelsDiv',
                    body:'allModelsDivBody',
                    data:FBL.bindFixed(spa_eyeObj.getModels, spa_eyeObj),
                    onRemoveModel:function (model) {
                        if (!model || !model.cid) return;
                        return spa_eyeObj.removeModel(model);
                    }
                });

                sections.push(pinned, mostUsed, allModels);

                return sections;
            },

            search:function (pattern) {
                if (!pattern) {
                    this._filter(function (row) {
                        Css.removeClass(row, 'hide');
                    }, this);
                    return true;
                }

                var globalFound = false;
                this._filter(function (row) {
                    Css.setClass(row, 'hide');
                    if (row.domObject.value) {
                        var model = row.domObject.value,
                            cid = row.domObject.name,
                            type = 'attr',
                            found = false,
                            rKey = null,
                            rValue = null,

                            kPattern = pattern,
                            vPattern = pattern;

                        if (/^#/.test(pattern)) {
                            kPattern = pattern.substr(1);
                            type = 'cid';
                        } else if (/:/.test(pattern)) {
                            var match = /^([^:]*):(.*)$/.exec(pattern);
                            if (pattern.trim() !== ':' && match) {
                                kPattern = match[1].trim();
                                vPattern = match[2].trim();
                            }
                        }

                        rKey = new RegExp(kPattern),
                            rValue = new RegExp(vPattern);

                        if (type === 'cid') {
                            if (rKey.test(cid)) {
                                found = true;
                            }
                        } else {
                            var attrs = model.attributes;
                            for (var a in attrs) {
                                if ((kPattern === vPattern && (rKey.test(a) || rKey.test(attrs[a])))
                                    || (rKey.test(a) && rValue.test(attrs[a]))) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                        found && Css.removeClass(row, 'hide');
                        globalFound = globalFound || found;
                    }
                }, this);

                return globalFound;
            },

            _filter:function (iterator, context) {
                var rows = this.parent.panelNode.getElementsByClassName("0level");
                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    if (Css.hasClass(row, "opened")) {
                        ModelReps.DirTablePlate.toggleRow(row);
                    }
                    iterator.call(context, row);
                }
            },

// ********************************************************************************************* //
// Audit Model
// ********************************************************************************************* //

            renderAuditForModel:function (row) {
                var model = row.domObject.value,
                    cid = null,
                    auditPanel = null;

                if (!model || !model.cid) return;
                cid = model.cid;

                // Pin this model
                // this._pinModel(model);

                // Select audit panel
                Firebug.chrome.selectSidePanel("spa_eye:audit");
                // Show audit
                auditPanel = this.context.getPanel('spa_eye:audit', true);
                auditPanel.showAudit(row.domObject.value, this.context);
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
                    var tbody = Dom.getElementByClass(this.parent.panelNode, 'pinnedModelsDivBody');
                    var noObjectRow = Dom.getChildByClass(tbody, 'noMemberRow');

                    if (noObjectRow) {
                        Css.removeClass(noObjectRow, 'hide');
                        Css.setClass(noObjectRow, 'hide');
                    }

                    var obj = {};
                    obj[model.cid] = model;
                    var members = ModelReps.DirTablePlate.memberIterator(obj);
                    ModelReps.DirTablePlate.rowTag.insertRows({members:members}, tbody);

                } catch (e) {
                    if (FBTrace.DBG_SPA_EYE) {
                        FBTrace.sysout("Error: model.cid - " + model.cid, e);
                    }
                }
            },

            _unPinModel:function (model) {
                this.onRemoveModel(model, this.sections[0]);
            },

            onSelectRow:function (row) {
                Firebug.chrome.selectSidePanel("spa_eye:event");
                var eventPanel = this.context.getPanel('event', true);
                eventPanel && eventPanel.onModelSelected(row);
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

            onModelSet:function (model, type) {
                this.context.spa_eyeObj._mostused_models.add(model.cid, model, 'set');

                this.sections.forEach(function (p) {
                    this.onAddModel(model, p, type);
                }, this);
            },

            onModelSave:function (model, file) {
                var isError = NetRequestEntry.isError(file);
                var type = isError ? 'row-error' : 'row-success';
                this.context.spa_eyeObj._mostused_models.add(model.cid, model, 'save');
                this.sections.forEach(function (p) {
                    this.onAddModel(model, p, type);
                }, this);
            }
        });

        return PANEL;
    });
