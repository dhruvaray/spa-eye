/* See license.txt for terms of usage */

define([
    "firebug/firebug",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/events",
    "firebug/lib/css",
    "firebug/lib/string",
    "firebug/lib/dom",

    "spa_eye/plates/basePlate",

    "spa_eye/dom/section",
    "spa_eye/dom/modelReps"
],
    function (Firebug, FBTrace, Locale, Events, Css, Str, Dom, BasePlate, ChildSection, ModelReps) {

        var PANEL = BasePlate.extend({
            name:'collection',

            createSections:function () {
                var sections = [];
                var allCollections = new ChildSection({
                    name:'all_collections',
                    title:Locale.$STR('spa_eye.all'),
                    parent:this.parent.panelNode,
                    order:0,
                    data:FBL.bindFixed(this.context.spa_eyeObj.getCollections, this.context.spa_eyeObj)
                });
                sections.push(allCollections);
                return sections;
            },

            onSelectRow:function (row) {
                var spa_eyeObj = this.context.spa_eyeObj;
                if (!row || !row.domObject.value) return;
                var m = row.domObject.value;
                if (!m || !m.cid) return;
                spa_eyeObj.selectedEntity = m;
                Events.dispatch(spa_eyeObj._spaHook.listener.fbListeners, 'onSelectedEntityChange', [m]);
            }
        });

        return PANEL;
    });
