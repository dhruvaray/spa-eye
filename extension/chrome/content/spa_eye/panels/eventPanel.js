define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/lib/dom",
    "firebug/lib/css",
    "firebug/lib/events",
    "firebug/dom/domReps",

    "spa_eye/panels/basePanel"
],
    function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, DOMReps, BasePanel) {

        var eventPanel = Firebug.eventPanel = BasePanel.extend({
            name:"spa_eye:event",
            title:Locale.$STR("spa_eye.event.title"),

            parentPanel:"spa_eye",
            order:1,


            initialize:function () {
                Firebug.Panel.initialize.apply(this, arguments);
                var listener = this.context.spa_eyeObj._spaHook.listener;
                listener.addListener(this);
                this.timeline.TIMELINE.replace({object:[]}, this.panelNode);
                this.timeline.tag.append({object:[]}, this.panelNode);
                this.sequenceEditor = this.panelNode.firstChild.contentWindow;
            },

            destroy:function (state) {
                Firebug.Panel.destroy.apply(this, arguments);
            },

            showEvents:function (value, context) {
                var win = this.context.window.wrappedJSObject;
                this.sequenceData = value.cid ? win.spa_eye.sequence[value.cid].flows : []
                this.show();
            },

            onSelectRow:function (row) {
                if (!row || !row.domObject.value) return;
                var m = row.domObject.value;
                if (!m || !m.cid) return;
                this.showEvents(m);
            },

            show:function () {

                if (this.sequenceEditor) {
                    this.sequenceEditor.draw(this.sequenceData);
                }
                this.timeline.tag.replace({object:this.sequenceData || []}, this.panelNode.lastChild);

            },

            onSequenceRecordCreated:function (record) {
                //this.sequenceData = value.cid?win.spa_eye.sequence[value.cid]:{}
                //setTimeout(this.show, 2000, record);
            }
        });

// ********************************************************************************************* //
// Templates

        with (Domplate) {
            eventPanel.prototype.timeline = domplate(DOMReps.DirTablePlate, {
                TIMELINE:IFRAME({src:"chrome://spa_eye/content/panels/timeline.xul",
                    width:"100%",
                    name:"timeline",
                    id:"timeline",
                    height:"60%",
                    frameborder:"0"
                })
            });
        }

// ********************************************************************************************* //
// Registration

        Firebug.registerPanel(eventPanel);
        return eventPanel;

// ********************************************************************************************* //

    });
