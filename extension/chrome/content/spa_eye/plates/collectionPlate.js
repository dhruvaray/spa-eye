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

    var NetRequestEntry = Firebug.NetMonitor.NetRequestEntry;
    var PANEL = BasePlate.extend({
        name: 'collection',

        createSections: function () {
            var sections = [];
            var allCollections = new ChildSection({
                name: 'all_collections',
                title: 'All Collections',
                parent: this.parent.panelNode,
                order: 0,

                container: 'allCollectionsDiv',
                body: 'allCollectionsDivBody',

                data: FBL.bindFixed(this.context.spa_eyeObj.getCollections, this.context.spa_eyeObj)
            });
            sections.push(allCollections);
            return sections;
        },

// ********************************************************************************************* //
// onModelSet and onModelSave
// ********************************************************************************************* //

        onModelSet:function (col, type) {
            if (this.isCurrentPlate() && this.isCollection(col)) {
                this.sections.forEach(function (p) {
                    this.onAddModel(col, p, type);
                }, this);
            }
        },

        onModelSave:function (col, file) {
            if (this.isCurrentPlate() && this.isCollection(col)) {
                var isError = NetRequestEntry.isError(file);
                var type = isError ? 'row-error' : 'row-success';
                this.sections.forEach(function (p) {
                    this.onAddModel(col, p, type);
                }, this);
            }
        },

        isCollection: function (col) {
            if (!col || !col.cid) return false;
            var collections = this.context.spa_eyeObj.getCollections() || [];
            return collections.indexOf(col) !== -1;
        }
    });

    return PANEL;
});
