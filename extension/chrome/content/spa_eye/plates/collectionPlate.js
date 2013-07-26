/* See license.txt for terms of usage */
/*jshint esnext:true, es5:true, curly:false */
/*global FBTrace:true, XPCNativeWrapper:true, Window:true, define:true */

define([
    "firebug/firebug",
    "firebug/lib/trace",
    "firebug/lib/css",
    "firebug/lib/string",
    "firebug/lib/dom",

    "spa_eye/plates/basePlate",

    "spa_eye/dom/section",
    "spa_eye/dom/modelReps"
],
function (Firebug, FBTrace, Css, Str, Dom, BasePlate, ChildSection, ModelReps) {

    var PANEL = BasePlate.extend({
        name: 'collection',

        createSections: function () {
            var sections = [];
            var allCollections = new ChildSection({
                name: 'all_collections',
                title: 'All Collections',
                parent: this.panelNode,
                order: 0,

                container: 'allCollectionsDiv',
                body: 'allCollectionsDivBody',

                data: FBL.bindFixed(this.context.spa_eyeObj.getCollections, this.context.spa_eyeObj)
            });
            sections.push(allCollections);
            return sections;
        }
    });

    return PANEL;
});
