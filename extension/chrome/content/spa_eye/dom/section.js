/* See license.txt for terms of usage */
/*jshint esnext:true, es5:true, curly:false */
/*global FBTrace:true, XPCNativeWrapper:true, Window:true, define:true */

define([
    "firebug/firebug",
    "firebug/lib/domplate",
    "firebug/chrome/reps",
    "firebug/lib/locale",
    "firebug/lib/events",
    "firebug/lib/dom",
    "firebug/lib/css",
    "firebug/lib/string",
    "firebug/dom/domModule",

    "spa_eye/dom/modelReps"
],
    function (Firebug, D, FirebugReps, Locale, Events, Dom, Css, Str, DOMModule, ModelReps) {

        "use strict";
        var ChildSection = function ChildSection(option) {
            for (var key in option) {
                this[key] = option[key];
            }
        };

        ChildSection.prototype = {
            constructor:ChildSection,

            name:'',
            title:'',
            parent:null,

            order:0,

            // Default collapse behavior for section
            collapse:false,

            // Element class
            container:null,
            body:null,

            // data - array of object(or function which returns array)
            data:function () {
                return [];
            },

            // onRowRemove
            onRowRemove:null,

            // Other default property for its data
            autoAdd:true,
            highlight:true,
            bubble:true,

            // Utils
            getBody:function () {
                if (this.body && this.parent) {
                    return Dom.getElementByClass(this.parent, this.body);
                }
                return null;
            },

            getContainer:function () {
                if (this.container && this.parent) {
                    return Dom.getElementByClass(this.parent, this.container);
                }
                return null;
            },

            _onRowAdd:function (model, options) {
                options = options || {};
                options.autoAdd = options.autoAdd || this.autoAdd;

                var tbody = this.getBody();

                if (!model || !tbody) return;

                if (options.autoAdd) {
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
                        if (model === m) {
                            found = true;
                            ModelReps._foldRow(row, function (r) {
                                ModelReps.highlightRow(r, options.type || 'row-warning');
                                ModelReps._bubbleUpRow(r);
                            }, this);
                            break;
                        }
                    }
                }

                if (!found && options.autoAdd) {
                    var obj = {};
                    obj[model.cid] = model;
                    var members = ModelReps.DirTablePlate.memberIterator(obj);
                    var result = ModelReps.DirTablePlate.rowTag.insertRows({members:members}, tbody);
                    ModelReps.highlightRow(result[0], options.type || 'row-warning');
                    ModelReps._bubbleUpRow(result[0]);
                }
            },

            _onRowRemove:function (model) {
                if (!model) return;

                // Get section body
                var tbody = this.getBody();

                // All rows from this section
                var rows = tbody.getElementsByClassName("0level");

                try {
                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];

                        // If model's cid is same as row object's cid,
                        // fold and remove this `row`
                        if (row.domObject.value === model) {
                            ModelReps._foldRow(row, function (r) {
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
                        FBTrace.sysout("Error: ", e);
                    }
                } finally {
                    // Remove model from section
                    try {
                        this.onRowRemove && this.onRowRemove(model);
                    } catch (e) {}
                }

                return model;
            }
        };

        return ChildSection;
    });


