define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/lib/dom",
    "firebug/lib/css",
    "firebug/lib/events",

    "spa_eye/dom/section",
    "spa_eye/dom/modelReps",

    "firebug/dom/domReps",

    "spa_eye/panels/basePanel"
],
    function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, ChildSection, ModelReps, DOMReps, BasePanel) {

        var eventPanel = Firebug.eventPanel = BasePanel.extend({
            name:"spa_eye:event",
            title:Locale.$STR("spa_eye.event.title"),

            parentPanel:"spa_eye",
            order:1,


            initialize:function () {
                Firebug.Panel.initialize.apply(this, arguments);
                var listener = this.context.spa_eyeObj._spaHook.listener;
                listener.addListener(this);

                //var splitter = Firebug.chrome.window.document.createElement("hr");
                /*splitter.setAttribute("orient","horizontal");
                 splitter.setAttribute("id","eventSplitter");
                 splitter.setAttribute("collapse","none");
                 splitter.setAttribute("tooltip","hello there");*/

                this.timeline.TIMELINE.replace({object:[]}, this.panelNode);
                this.timeline.TABLE.append({}, this.panelNode);
                this.timeline.tag.append({sections:[], mainPanel:this.panelNode}, this.panelNode.lastChild);
                //this.panelNode.parentNode.insertBefore(splitter, this.panelNode.lastChild);

                this.sequenceEditor = this.panelNode.firstChild.contentWindow;
            },

            destroy:function (state) {
                Firebug.Panel.destroy.apply(this, arguments);
            },

            showEvents:function (value, context) {
                var win = this.context.window.wrappedJSObject;
                this.sequenceData = value.cid && win.spa_eye.sequence[value.cid] ?
                    win.spa_eye.sequence[value.cid].flows : []
                this.sequenceData && this.show();
            },

            onSelectRow:function (row, panel) {
                if (panel !== this.panelNode) {
                    if (!row || !row.domObject.value) return;
                    var m = row.domObject.value;
                    if (!m || !m.cid) return;
                    this.showEvents(m);
                }
            },

            show:function () {

                this.sequenceEditor && this.sequenceEditor.draw(this.sequenceData);
                this.tabulateData();


            },

            tabulateData:function () {

                if (this.sequenceData) {
                    var sections = [];
                    for (var i = this.sequenceData.length - 1; i >= 0; --i) {
                        sections.push(new ChildSection({
                            title:'t=' + i,
                            parent:this.panelNode,
                            autoAdd:false,
                            data:this.sequenceData[i]
                        }));
                    }

                    var args = {
                        sections:sections,
                        mainPanel:this.panelNode
                    };

                    this.timeline.tag.replace(args, this.panelNode.lastChild);
                }
            }
        });

// ********************************************************************************************* //
// Templates

        with (Domplate) {
            eventPanel.prototype.timeline = domplate(ModelReps.DirTablePlate, {
                TIMELINE:IFRAME({src:"chrome://spa_eye/content/panels/timeline.xul",
                    width:"100%",
                    name:"timeline",
                    id:"timeline",
                    height:"60%",
                    frameborder:"0"
                }),

                TABLE:DIV({width:"100%", height:"40%"})
            });
        }

// ********************************************************************************************* //
// Registration

        Firebug.registerPanel(eventPanel);
        return eventPanel;

// ********************************************************************************************* //

    });
