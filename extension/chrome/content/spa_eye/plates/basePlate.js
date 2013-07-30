define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/dom",
    "firebug/lib/css",

    "spa_eye/lib/require/underscore",

    "spa_eye/panels/basePanel",
    "spa_eye/dom/modelReps",
    "spa_eye/dom/domEditor"
],
function (Firebug, Obj, FBTrace, Dom, Css, _, BasePanel, ModelReps, DOMEditor) {

    var BasePlate = function(options) {
        this.initialize && this.initialize(options);
    };
    BasePlate.extend = BasePanel.extend;
    BasePlate.prototype = Obj.extend(DOMEditor, {
        constructor: BasePlate,

        initialize: function(options) {
            if (options) {
                this.context = options.context;
                this.parent = options.parent;
                this.sections = this.createSections();
            }
        },

        render: function() {
            var args = {
                sections:this.sections.sort(function (a, b) {
                    return a.order > b.order;
                }),
                mainPanel: this
            };

            ModelReps.DirTablePlate.tag.replace(args, this.parent.panelNode);
        },

        createSections: function(){
            return [];                
        },

        refresh:function (row) {
            ModelReps.DirTablePlate.toggleRow(row);
            ModelReps.DirTablePlate.toggleRow(row);
        },

        onAddModel: function(model, section, options) {
            options = options || {};
            options.autoAdd = options.autoAdd || section.autoAdd;

            var tbody = section.getBody();

            if (!model || !model.cid || !tbody) return;

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
                    if (model.cid == m.cid) {
                        found = true;
                        this._foldRow(row, function (r) {
                            ModelReps.highlightRow(r, options.type || 'row-warning');
                            this._bubbleUpRow(r);
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
                this._bubbleUpRow(result[0]);
            }
        },

        onRemoveModel: function(model, section) {
            if (!model) return;

            // Iterate over section if section is not null,
            // else iterate over all sections.
            var sections = section
                ? ((this.sections.indexOf(section) !== -1) ? [section] : [])
                : this.sections;

            sections.forEach(function(section) {

                // Get section body
                var tbody = section.getBody();

                // All rows from this section
                var rows = tbody.getElementsByClassName("0level");

                try {
                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];

                        // If model's cid is same as row object's cid,
                        // fold and remove this `row`
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
                } finally {
                    // Remove model from section
                    try{
                        section.onRemoveModel && section.onRemoveModel(model);
                    } catch(e){}
                }
            }, this);
            return model;
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

        _foldRow:function (row, cb, context, otherArgs) {
            var args = [row];
            otherArgs && args.push.apply(args, otherArgs);
            if (row && Css.hasClass(row, 'opened')) {
                return ModelReps.DirTablePlate.toggleRow(row, function () {
                    cb && cb.apply(this, args);
                }, context ? context : this);
            }
            return cb && cb.apply(context ? context : this, args);
        }
    });

    return BasePlate;
});
