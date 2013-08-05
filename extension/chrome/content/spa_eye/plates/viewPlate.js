/* See license.txt for terms of usage */
/*jshint esnext:true, es5:true, curly:false */
/*global FBTrace:true, XPCNativeWrapper:true, Window:true, define:true */

define([
    "firebug/firebug",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/css",
    "firebug/lib/string",
    "firebug/lib/dom",

    "spa_eye/plates/basePlate",

    "spa_eye/dom/section",
    "spa_eye/dom/modelReps"

],
    function (Firebug, FBTrace, Locale, Css, Str, Dom, BasePlate, ChildSection, ModelReps) {

        var PANEL = BasePlate.extend({
            name:'view',

            expandSelectedView:function (index) {
                var node = this.parent.panelNode;
                var rows = node.getElementsByClassName('0level');
                var row = rows[index];
                if (row) {
                    if (!Css.hasClass(row, "opened")) {
                        ModelReps.DirTablePlate.toggleRow(row);
                    }
                    ModelReps.highlightRow(row, "row-warning");
                    node.scrollTop = row.offsetTop;
                }
                for (var i = 0; i < rows.length; i++) {
                    if (Css.hasClass(rows[i], "opened") && index !== i) {
                        ModelReps.DirTablePlate.toggleRow(rows[i])
                    }
                }
            },

            createSections:function () {
                var sections = [];
                var allViews = new ChildSection({
                    name:'all_views',
                    title:Locale.$STR('spa_eye.all'),
                    parent:this.parent.panelNode,
                    order:0,

                    container:'allViewsDiv',
                    body:'allViewsDivBody',

                    data:FBL.bindFixed(this.context.spa_eyeObj.getViews, this.context.spa_eyeObj)
                });

                sections.push(allViews);
                return sections;
            },

            onSelectRow:function (row) {

                if (!row || !row.domObject.value) return;
                var v = row.domObject.value;
                if (v.el) {
                    var win = this.context.window.wrappedJSObject;
                    win.scroll(0, v.el.offsetTop);
                    Firebug.Inspector.highlightObject(v.el, this.context);
                }
            }
        });

        return PANEL;
    });
