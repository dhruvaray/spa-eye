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
        constructor: PANEL,
        name: 'collection',
        render: function () {
            var args = {
                sections: this.sections.sort(function (a, b) {
                    return a.order > b.order;
                }),
                mainPanel: this.parent
            };
            ModelReps.DirTablePlate.tag.replace(args, this.parent.panelNode);
        },

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
    };

    return PANEL;
});