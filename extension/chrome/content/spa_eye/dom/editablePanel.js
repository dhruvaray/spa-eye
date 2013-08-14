/* See license.txt for terms of usage */

define([
    "firebug/firebug",
    "firebug/lib/trace",
    "firebug/lib/css",
    "firebug/lib/string"
],
    function (Firebug, FBTrace, Css, Str) {

        "use strict";
        var E = {

            setPropertyValue:function (row, value) {
                var member = row.domObject;
                var name = member.name;
                var key = this._getRowName(row);
                var self = this;

                var object = Firebug.DOMBasePanel.prototype.getRowObject(row);
                if (name === 'this')
                    return;

                Firebug.CommandLine.evaluate(value,
                    this.context,
                    object,
                    this.context.getCurrentGlobal && this.context.getCurrentGlobal(),
                    function success(result, context) {
                        if (FBTrace.DBG_SPA_EYE) {
                            FBTrace.sysout("spa_eye; setPropertyValue evaluate success " +
                                "object.set(" + name + ", " + result + ");");

                        }
                        self.setValue && self.setValue(object, name, result);

                    },
                    function failed(exc, context) {
                        try {
                            self.setValue && self.setValue(object, name, value);
                        } catch (e) {
                            if (FBTrace.DBG_SPA_EYE) {
                                FBTrace.sysout("spa_eye; Error while setValue", e);
                            }
                        }
                    });

                this.refresh && this.refresh(this._getLogicalParentRow(row) || row);
            },

            editProperty:function (row, editValue) {
                var model = row.domObject;
                var object = Firebug.DOMBasePanel.prototype.getRowObject(row);
                if (!editValue) {
                    var propName = this._getRowName(row);
                    var propValue = object && (object.attributes ? object.attributes[propName] : object[propName]);

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
            }

        };

        return E;

    });
