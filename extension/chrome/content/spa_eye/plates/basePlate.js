define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",

    "spa_eye/lib/underscore",

    "spa_eye/panels/basePanel",
    "spa_eye/dom/modelReps",
    "spa_eye/dom/domEditor"
],
function (Firebug, Obj, FBTrace, _, BasePanel, ModelReps, DOMEditor) {

    var BasePlate = function(options) {
        this.initialize && this.initialize(options);
    };
    BasePlate.extend = BasePanel.extend;
    BasePlate.prototype = Obj.extend(DOMEditor, {
        constructor: BasePlate,

        initialize: function(options) {
            if (options) {
                this.context = options.context;
                this.parent = options.parent;
                this.sections = this.createSections();
            }
        },

        render: function() {
            var args = {
                sections:this.sections.sort(function (a, b) {
                    return a.order > b.order;
                }),
                mainPanel: this
            };

            ModelReps.DirTablePlate.tag.replace(args, this.parent.panelNode);
        },

        createSections: function(){
            return [];                
        },

        refresh:function (row) {
            ModelReps.DirTablePlate.toggleRow(row);
            ModelReps.DirTablePlate.toggleRow(row);
        },

        _bubbleUpRow:function (row) {
            var tbody = row.parentNode;

            var level = parseInt(row.getAttribute('level'), 10);
            var model = row.domObject.value;

            setTimeout(function () {
                var firstRow = row.previousSibling;
                while (firstRow) {
                    var l = parseInt(firstRow.getAttribute("level", 10));
                    if (isNaN(l)) break;
                    if (l === level) {
                        tbody.removeChild(row);
                        tbody.insertBefore(row, firstRow);
                        firstRow = row.previousSibling;
                    } else {
                        firstRow = firstRow.previousSibling;
                    }
                }
            }, 100);
        }
    });

    return BasePlate;
});
