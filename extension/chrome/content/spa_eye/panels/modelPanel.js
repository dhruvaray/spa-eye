/* See license.txt for terms of usage */
/*jshint esnext:true, es5:true, curly:false */
/*global FBTrace:true, XPCNativeWrapper:true, Window:true, define:true */

define([
    "firebug/firebug",
    "firebug/lib/trace",
    "firebug/lib/css",
    "firebug/lib/string",
    "firebug/dom/domEditor",
    "firebug/lib/dom",

    "spa_eye/dom/section",
    "spa_eye/dom/modelReps",

    "spa_eye/auditPanel",
    "spa_eye/eventPanel"
],
    function (Firebug, FBTrace, Css, Str, DOMEditor, Dom, ChildSection, ModelReps) {


        var PANEL = function (context, parent) {
            this.context = context;
            this.parent = parent;
            this.sections = this.createSections();
        };

        PANEL.prototype = {

            constructor:PANEL,
            name: 'model',

            render:function () {

                var args = {
                    sections:this.sections.sort(function (a, b) {
                        return a.order > b.order;
                    }),
                    mainPanel:this.parent
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

            search:function (key) {
                if (!key) {
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
                            sb = key,
                            type = 'attr',
                            re = null,
                            found = false;

                        if (/^#/.test(key)) {
                            sb = key.substr(1);
                            type = 'cid';
                        }

                        re = new RegExp(sb);

                        if (type === 'cid') {
                            if (re.test(cid)) {
                                found = true;
                            }
                        } else {
                            var attrs = model.attributes;
                            for (var a in attrs) {
                                if (re.test(a) || re.test(attrs[a])) {
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
                Firebug.chrome.selectSidePanel("audit");
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
                Firebug.chrome.selectSidePanel("event");
                var eventPanel = this.context.getPanel('event', true);
                eventPanel.showEvents(row.domObject.value, this.context);
            },

            setModelPropertyValue:function (row, value) {
                var member = row.domObject;
                var name = member.name;
                var key = this._getRowName(row);

                var object = Firebug.DOMBasePanel.prototype.getRowObject(row);
                if (name === 'this')
                    return;

                Firebug.CommandLine.evaluate(value,
                    this.context,
                    object,
                    this.context.getCurrentGlobal(),
                    function success(result, context) {
                        if (FBTrace.DBG_SPA_EYE) {
                            FBTrace.sysout("spa_eye; setPropertyValue evaluate success " +
                                "object.set(" + name + ", " + result + ");");

                        }
                        object.set(name, result);
                    },
                    function failed(exc, context) {
                        try {
                            if (FBTrace.DBG_SPA_EYE) {
                                FBTrace.sysout("spa_eye; setModelPropertyValue evalute FAILED", exec);
                            }
                        } catch (exc) {
                        }
                    });

                this.refresh(this._getLogicalParentRow(row) || row);
            },

            editModelProperty:function (row, editValue) {
                var model = row.domObject;
                var object = Firebug.DOMBasePanel.prototype.getRowObject(row);
                if (!editValue) {
                    var propName = this._getRowName(row);
                    var propValue = object && object.attributes[propName];

                    var type = typeof propValue;

                    if (type === "undefined" || type === "number" || type === "boolean")
                        editValue = "" + propValue;
                    else if (type === "string")
                        editValue = "\"" + Str.escapeJS(propValue) + "\"";
                    else if (propValue === null)
                        editValue = "null";
                    else if (object instanceof window.Window || object instanceof StackFrame.StackFrame)
                        editValue = this._getRowName(row);
                    else
                        editValue = "this." + this._getRowName(row);
                }
                Firebug.Editor.startEditing(row, editValue);
            },

            _getLogicalParentRow:function (row) {
                var row_level = parseInt(row.getAttribute("level"), 10);
                if (row_level === 0) {
                    return null;
                }

                var parent = row;
                while (parent && parseInt(parent.getAttribute("level"), 10) !== (row_level - 1)) {
                    parent = parent.previousSibling;
                }
                return parent;
            },

            _getRowName:function (row) {
                var labelNode = row.getElementsByClassName("memberLabelCell").item(0);
                return labelNode.textContent;
            },

            _getRowValue:function (row) {
                var valueNode = row.getElementsByClassName("memberValueCell").item(0);
                return valueNode.firstChild.repObject;
            },

            refresh:function (row) {
                ModelReps.DirTablePlate.toggleRow(row);
                ModelReps.DirTablePlate.toggleRow(row);
            },

// ********************************************************************************************* //
// OnModelSet
// ********************************************************************************************* //

            onModelSet:function (model, type) {
                this.sections.forEach(function (p) {
                    this._onModelSet(p, model, type);
                }, this);
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
// On Model Save
// ********************************************************************************************* //


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
        };

        return PANEL;

    });


