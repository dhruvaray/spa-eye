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
        name: 'view',

        expandSelectedView: function(index) {
            var node = this.parent.panelNode;
            var rows = node.getElementsByClassName('0level');
            var row = rows[index];
            if (row){
                if (!Css.hasClass(row, "opened")){
                    ModelReps.DirTablePlate.toggleRow(row);
                }
                Css.setClass(row, "row-success");
                setTimeout(function () {
                        Css.setClass(row, 'fade-in');
                        Css.removeClass(row, "row-success");
                        setTimeout(function () {
                            Css.removeClass(row, 'fade-in');
                        }, 6000);
                }),
                 node.scrollTop = row.offsetTop;
            }
            for (var i = 0; i<rows.length; i++){
                if (Css.hasClass(rows[i], "opened") && index !== i){
                    ModelReps.DirTablePlate.toggleRow(rows[i])
                }
            }
        },

        createSections: function () {
            var sections = [];
            var allViews = new ChildSection({
                name: 'all_views',
                title: 'All Views',
                parent: this.panelNode,
                order: 0,

                container: 'allViewsDiv',
                body: 'allViewsDivBody',

                data: FBL.bindFixed(this.context.spa_eyeObj.getViews, this.context.spa_eyeObj)
            });
            sections.push(allViews);
            return sections;
        }
    });

    return PANEL;
});
