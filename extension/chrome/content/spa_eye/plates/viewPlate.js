/* See license.txt for terms of usage */

define([
    "firebug/firebug",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/events",
    "firebug/lib/css",
    "firebug/lib/string",
    "firebug/lib/dom",
    "spa_eye/lib/require/underscore",

    "spa_eye/plates/basePlate",
    "spa_eye/util/common",

    "spa_eye/dom/section",
    "spa_eye/dom/modelReps"

],
    function (Firebug, FBTrace, Locale, Events, Css, Str, Dom, _, BasePlate, Common, ChildSection, ModelReps) {


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
                    name:'live_views',
                    title:Locale.$STR('spa_eye.views.live'),
                    parent:this.parent.panelNode,
                    container:'liveViewsDiv',
                    body:'liveViewsDivBody',
                    data:function () {
                        return self.spa_eyeObj.getViews({live:true})
                    }
                });

                var deadViews = new ChildSection({
                    name:'dead_views',
                    title:Locale.$STR('spa_eye.views.removed'),
                    parent:this.parent.panelNode,
                    container:'deadViewsDiv',
                    body:'deadViewsDivBody',
                    autoAdd:false,
                    data:function () {
                        return self.spa_eyeObj.getViews({live:false})
                    }
                });

                sections.push(liveViews);
                sections.push(deadViews);
                return sections;
            },

            onViewRemove:function (view) {
                var liveSection = this.sections[0];
                var deadSection = this.sections[1];
                liveSection._onRowRemove(view);
                deadSection._onRowAdd(view, {
                    autoAdd:true,
                    type:Common.OperationClass[Common.Operation.REMOVE]
                });
            },

            onSelectRow:function (row) {

                if (!row || !row.domObject.value) return;
                var v = row.domObject.value;
                if (v.el) {
                    var win = this.context.window.wrappedJSObject;
                    win.scroll(0, v.el.offsetTop);
                    Firebug.Inspector.highlightObject(v.el, this.context);
                }
                var spa_eyeObj = this.context.spa_eyeObj;
                spa_eyeObj.selectedEntity = v;
                Events.dispatch(spa_eyeObj._spaHook.listener.fbListeners, 'onSelectedEntityChange', [v]);

            }

        });


        return PANEL;
    });
