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
    "spa_eye/lib/require/underscore",

    "spa_eye/plates/basePlate",

    "spa_eye/dom/section",
    "spa_eye/dom/modelReps"

],
    function (Firebug, FBTrace, Locale, Css, Str, Dom, _, BasePlate, ChildSection, ModelReps) {


        var PANEL = BasePlate.extend({
            name:'view',

            expandSelectedView:function (highlight) {
                var node = this.parent.panelNode;
                var rows = node.getElementsByClassName('0level');

                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    var view = row.domObject.value;
                    if (view === highlight) {
                        if (!Css.hasClass(row, "opened")) {
                            ModelReps.DirTablePlate.toggleRow(row);
                        }
                        ModelReps.highlightRow(row, "row-warning");
                        node.scrollTop = row.offsetTop;

                    } else {
                        if (Css.hasClass(row, "opened")) {
                            ModelReps.DirTablePlate.toggleRow(row)
                        }
                    }
                }
            },

            createSections:function () {
                var sections = [];
                var self = this;
                var liveViews = new ChildSection({
                    name:'all_views',
                    title:Locale.$STR('spa_eye.views.live'),
                    parent:this.parent.panelNode,
                    container:'allViewsDiv',
                    body:'allViewsDivBody',
                    data:function () {
                        return self.context.spa_eyeObj.getViews({live:true})
                    }
                });

                var deadViews = new ChildSection({
                    name:'all_views',
                    title:Locale.$STR('spa_eye.views.removed'),
                    parent:this.parent.panelNode,
                    container:'allViewsDiv',
                    body:'allViewsDivBody',
                    data:function () {
                        return self.context.spa_eyeObj.getViews({live:false})
                    }
                });

                sections.push(liveViews);
                sections.push(deadViews);
                return sections;
            },

            onViewRender:function () {
                this.render();
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
