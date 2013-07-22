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

    "spa_eye/dom/section",
    "spa_eye/dom/modelReps",
    "spa_eye/dom/domEditor"

],
    function (Firebug, Obj, FBTrace, Css, Str, Dom, ChildSection, ModelReps, DOMEditor) {

        var NetRequestEntry = Firebug.NetMonitor.NetRequestEntry;
        var PANEL = function (context, parent) {
            this.context = context;
            this.parent = parent;
            this.sections = this.createSections();
        };

        PANEL.prototype = Obj.extend(DOMEditor, {

            constructor:PANEL,
            name:'model',

            render:function () {

                var args = {
                    sections:this.sections.sort(function (a, b) {
                        return a.order > b.order;
                    }),
                    mainPanel:this
                };

                ModelReps.DirTablePlate.tag.replace(args, this.parent.panelNode);

            },

            createSections:function () {
                var sections = [];
                var pinned = new ChildSection({
                    name:'pinned_models',
                    title:'Pinned Models',
                    parent:this.parent.panelNode,
                    order:0,
                    container:'pinnedModelsDiv',
                    body:'pinnedModelsDivBody',
                    autoAdd:false,
                    data:this.context.spa_eyeObj._pinned_models
                });

                var mostUsed = new ChildSection({
                    name:'most_used_models',
                    title:'Most Used',
                    parent:this.parent.panelNode,
                    order:1,
                    container:'mostUsedModelsDiv',
                    body:'mostUsedModelsDivBody'
                });

                var allModels = new ChildSection({
                    name:'all_models',
                    title:'All Models',
                    parent:this.parent.panelNode,
                    order:2,
                    container:'allModelsDiv',
                    body:'allModelsDivBody',
                    data:FBL.bindFixed(this.context.spa_eyeObj.getModels, this.context.spa_eyeObj)
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
                Firebug.chrome.selectSidePanel("spa_eye:audit");
                var auditPanel = this.context.getPanel('audit', true);
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
                try {
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
                this.context.spa_eyeObj._pinned_models[model.cid] = model;
            },

            _unPinModel:function (model) {
                if (!model) return;
                try {
                    var tbody = Dom.getElementByClass(this.parent.panelNode, 'pinnedModelsDivBody');
                    var rows = tbody.getElementsByClassName("0level");

                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];
                        if (row.domObject.value.cid === model.cid) {

                            this._foldRow(row, function (r) {
                                tbody.removeChild(r);
                                var rs = tbody.getElementsByClassName("0level");
                                if (!rs || rs.length === 0) {
                                    var noObj = Dom.getChildByClass(tbody, 'noMemberRow');
                                    noObj && Css.removeClass(noObj, 'hide');
                                }
                            }, this);

                            break;
                        }
                    }


                } catch (e) {
                    if (FBTrace.DBG_SPA_EYE) {
                        FBTrace.sysout("Error:  model.cid - " + model.cid, e);
                    }
                }
                delete this.context.spa_eyeObj._pinned_models[model.cid];
            },

            showRelatedEvents:function (row) {
                Firebug.chrome.selectSidePanel("spa_eye:event");
                var eventPanel = this.context.getPanel('event', true);
                eventPanel.showEvents(row.domObject.value, this.context);
            },

// ********************************************************************************************* //
// Editable
// ********************************************************************************************* //

            setValue:function (obj, key, value) {
                obj.set(key, value);
            },

            refresh:function (row) {
                ModelReps.DirTablePlate.toggleRow(row);
                ModelReps.DirTablePlate.toggleRow(row);
            },

// ********************************************************************************************* //
// OnModelSet and OnModelSave
// ********************************************************************************************* //

            onModelSet:function (model, type) {
                this.sections.forEach(function (p) {
                    this._onModelSet(p, model, type);
                }, this);
            },

            onModelSave:function (model, file) {
                var isError = NetRequestEntry.isError(file);
                var type = isError ? 'row-error' : 'row-success';
                this.onModelSet(model, type);
            },

            _onModelSet:function (section, model, type) {
                var tbody = section.getBody();

                if (!model || !model.cid || !tbody) return;

                if (section.autoAdd) {
                    var noObjectRow = Dom.getChildByClass(tbody, 'noMemberRow');

                    if (noObjectRow) {
                        Css.removeClass(noObjectRow, 'hide');
                        Css.setClass(noObjectRow, 'hide');
                    }
                }

                var rows = tbody.getElementsByClassName('0level');
                var found = false;
                if (rows) {
                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];
                        var m = row.domObject.value;
                        if (model.cid == m.cid) {
                            found = true;
                            this._foldRow(row, function (r) {
                                this._highlightRow(r, type ? type : 'row-warning');
                                this._bubbleUpRow(r);
                            }, this);
                            break;
                        }
                    }
                }

                if (!found && section.autoAdd) {
                    var obj = {};
                    obj[model.cid] = model;
                    var members = ModelReps.DirTablePlate.memberIterator(obj);
                    var result = ModelReps.DirTablePlate.rowTag.insertRows({members:members}, tbody);
                    this._highlightRow(result[0], type ? type : 'row-warning');
                    this._bubbleUpRow(result[0]);
                }
            },

// ********************************************************************************************* //
// Bubble up and highlight row
// ********************************************************************************************* //

            _foldRow:function (row, cb, context, otherArgs) {
                var args = [row];
                otherArgs && args.push.apply(args, otherArgs);
                if (row && Css.hasClass(row, 'opened')) {
                    return ModelReps.DirTablePlate.toggleRow(row, function () {
                        cb && cb.apply(this, args);
                    }, context ? context : this);
                }
                return cb && cb.apply(context ? context : this, args);
            },

            _bubbleUpRow:function (row) {
                var tbody = row.parentNode;

                var level = parseInt(row.getAttribute('level'), 10);
                var model = row.domObject.value;

                setTimeout(function () {
                    var firstRow = row.previousSibling;
                    while (firstRow) {
                        var l = parseInt(firstRow.getAttribute("level", 10));
                        if (isNaN(l)) break;
                        if (l === level) {
                            tbody.removeChild(row);
                            tbody.insertBefore(row, firstRow);
                            firstRow = row.previousSibling;
                        } else {
                            firstRow = firstRow.previousSibling;
                        }
                    }
                }, 100);
            },

            _highlightRow:function (row, type) {
                Css.setClass(row, type);
                setTimeout(function () {
                    Css.setClass(row, 'fade-in');
                    Css.removeClass(row, type);
                    setTimeout(function () {
                        Css.removeClass(row, 'fade-in');
                    }, 2000);
                }, 1000);
            }
        });

        return PANEL;

    });


