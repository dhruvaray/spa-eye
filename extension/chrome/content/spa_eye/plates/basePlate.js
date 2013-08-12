define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/dom",
    "firebug/lib/css",
    "firebug/lib/options",

    "spa_eye/lib/require/underscore",

    "spa_eye/util/common",
    "spa_eye/panels/basePanel",
    "spa_eye/dom/modelReps",
    "spa_eye/dom/domEditor"
],
    function (Firebug, Obj, FBTrace, Dom, Css, Options, _, Common, BasePanel, ModelReps, DOMEditor) {

        var BasePlate = function (options) {
            this.initialize && this.initialize(options);
        };
        BasePlate.extend = BasePanel.extend;
        BasePlate.prototype = Obj.extend(DOMEditor, {
            constructor:BasePlate,

            initialize:function (options) {
                if (options) {
                    this.context = options.context;
                    this.parent = options.parent;
                    this.sections = this.createSections();
                }
                this.spa_eyeObj = this.context.spa_eyeObj;
            },

            render:function () {
                var args = {
                    sections:this.sections.sort(function (a, b) {
                        return a.order > b.order;
                    }),
                    mainPanel:this
                };

                ModelReps.DirTablePlate.tag.replace(args, this.parent.panelNode);

                if (!this.context.spa_eyeObj.selectedEntity) {
                    var firstRow = this.parent.panelNode.getElementsByClassName("0level").item(0);
                    return ModelReps.selectRow(firstRow, this);
                }
            },

            isCurrentPlate:function () {
                if (!this.parent.isCurrentPanel()) return false;
                return !!(this.parent.getCurrentPlate && (this.parent.getCurrentPlate() === this));
            },

            createSections:function () {
                return [];
            },

            refresh:function (row) {
                ModelReps.DirTablePlate.toggleRow(row);
                ModelReps.DirTablePlate.toggleRow(row);
            },

            search:function (pattern, reverse) {
                if (!pattern) {
                    this._filter(function (row) {
                        Css.removeClass(row, 'hide');
                    }, this);
                    return true;
                }

                var globalFound = false,
                    caseSensitive = !!Options.get("searchCaseSensitive");

                this._filter(function (row) {
                    Css.setClass(row, 'hide');
                    if (row.domObject.value) {
                        var entity = row.domObject.value,
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

                        rKey = new RegExp(kPattern, caseSensitive ? '' : 'i');
                        rValue = new RegExp(vPattern, caseSensitive ? '' : 'i');

                        if (type === 'cid') {
                            if (rKey.test(cid)) {
                                found = true;
                            }
                        } else {
                            var repObj = entity;
                            if (repObj) {
                                if (repObj.el) {
                                    repObj = {
                                        el:repObj.el,
                                        $el:repObj.$el,
                                        tagName:repObj.tagName,
                                        templates:repObj.__templates__
                                    };
                                } else if (repObj.toJSON) {
                                    repObj = repObj.toJSON();
                                }
                            }

                            function searchPattern(v, k) {
                                if (_.isObject(v)) {
                                    return !!_.find(v, searchPattern);
                                } else if ((kPattern === vPattern && (rKey.test(k) || rKey.test(v)))
                                    || (rKey.test(k) && rValue.test(v))) {
                                    return true;
                                }
                            }

                            found = !!_.find(repObj, searchPattern);
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

            onBackboneEvent:function (bbentity, operation, args) {
                if (!this.parent.isCurrentPanel()) return false;

                //Note the case
                var Operation = operation.charAt(0).toUpperCase() + operation.slice(1);
                var type = '';
                if (this.name)
                    type = this.name.charAt(0).toUpperCase() + this.name.slice(1);

                if (type && (bbentity instanceof this.spa_eyeObj._spaHook.Backbone[type])) {
                    this.sections && this.sections.forEach(function (section) {
                        section._onRowAdd(bbentity, {type:Common.OperationClass[operation]});
                    }, this);

                    var catchall_args = [bbentity];
                    catchall_args.push.apply(catchall_args, args);
                    var method = 'on' + type + Operation;
                    this[method] && this[method].apply(this, catchall_args);
                }
            }
        });

        return BasePlate;
    });
