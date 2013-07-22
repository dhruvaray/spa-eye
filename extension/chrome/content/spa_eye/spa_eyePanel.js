/* See license.txt for terms of usage */
define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/lib/dom",
    "firebug/lib/css",
    "firebug/lib/events",
    "firebug/lib/string",
    "firebug/dom/domEditor",

    "spa_eye/plates/modelPlate",
    "spa_eye/plates/collectionPlate",
    "spa_eye/plates/viewPlate",

    "spa_eye/panels/basePanel",

    "spa_eye/panels/viewPanel",
    "spa_eye/panels/auditPanel",
    "spa_eye/panels/eventPanel"
],
    function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, Str, DOMEditor, ModelPlate, CollectionPlate, ViewPlate) {

        var spa_eyePanel = Firebug.spa_eyePanel = function spa_eyePanel() {
        };
        var childPlate = Firebug.spa_eyePanel.childPlate = {
            MODEL:'model',
            COLLECTION:'collection',
            VIEW:'view'
        };

        Firebug.spa_eyePanel.prototype = Obj.extend(Firebug.ActivablePanel, {
            name:"spa_eye",
            title:Locale.$STR("spa_eye.title"),
            searchable:true,
            editable:true,
            inspectable:true,
            inspectHighlightColor:"green",
            inspectedViewIndex:-1,
            editor:undefined,

            enableA11y:true,
            deriveA11yFrom:"dom",

            currentPlate:childPlate.MODEL,
            plates:null,


            initialize:function () {
                this.plates = {};
                Firebug.registerUIListener(this);
                Firebug.Panel.initialize.apply(this, arguments);

                // Initialize plates
                this.plates.model = new ModelPlate(this.context, this);
                this.plates.collection = new CollectionPlate(this.context, this);
                this.plates.view = new ViewPlate(this.context, this);

                /*var listener = this.context.spa_eyeObj._spaHook.listener;

                 listener.addListener(this.context.getPanel("spa_eye:audit", true));
                 listener.addListener(this.context.getPanel("spa_eye:event", true));
                 listener.addListener(this.context.getPanel("spa_eye:script.view", true));*/
            },

            destroy:function () {
                Firebug.unregisterUIListener(this);
                Firebug.Panel.destroy.apply(this, arguments);

                this.removeListener(this);

                if (this.context.spa_eyeObj) {
                    try {
                        this.context.spa_eyeObj._spaHook.listener.removeListener(this);
                    } catch (e) {
                    }
                }
            },

            show:function (state) {
                var enabled = this.isEnabled();
                if (!enabled) return;


                var scriptPanel = this.context.getPanel('script');
                var active = !this.showWarning() && !scriptPanel.showWarning();

                if (active) {
                    this.selectChildPlate();
                }
            },

            onActivationChanged:function (enable) {
                if (enable)
                    Firebug.spa_eyeModule.addObserver(this);
                else
                    Firebug.spa_eyeModule.removeObserver(this);
            },


            inspectNode:function (node) {
                if (this.currentPlate === childPlate.VIEW) {
                    this.plates.view.expandSelectedView(this.inspectedViewIndex);
                }
                return false;
            },

            supportsObject:function (object, type) {
                var views = this.context.spa_eyeObj.getViews();
                for (i = 0; i < views.length; ++i) {
                    if (views[i].el.innerHTML === object.innerHTML) {
                        this.inspectedViewIndex = i;
                        return 1;
                    }
                }
                return 0;
            },

            showWarning:function () {

                var hooked = this.context.spa_eyeObj.hooked();
                var warn = !hooked;
                return warn ? this.showNotHooked() : false;

            },

            showNotHooked:function () {
                var args = {
                    pageTitle:Locale.$STR("spa_eye.warning.inactive_during_page_load"),
                    suggestion:Locale.$STR("spa_eye.suggestion.inactive_during_page_load2")
                };

                var box = Firebug.ScriptPanel.WarningRep.tag.replace(args, this.panelNode);
                var description = box.getElementsByClassName("disabledPanelDescription").item(0);
                FirebugReps.Description.render(args.suggestion,
                    description,
                    Obj.bindFixed(Firebug.TabWatcher.reloadPageFromMemory,
                        Firebug.TabWatcher,
                        Firebug.currentContext));
            },

            getPanelToolbarButtons:function () {

                var buttons = [];

                if (this.context.spa_eyeObj && this.context.spa_eyeObj.hooked()) {
                    buttons.push({
                            label:"spa_eye.refresh",
                            className:"refresh",
                            command:FBL.bindFixed(this.selectChildPlate, this)
                        },
                        "-",
                        {
                            id:"spa_eye_panel_button_model",
                            label:"spa_eye.models",
                            type:"radio",
                            checked:true,
                            className:"toolbar-text-button fbInternational",
                            tooltiptext:"spa_eye.models",
                            command:FBL.bindFixed(this.selectChildPlate, this, childPlate.MODEL)
                        },
                        {
                            id:"spa_eye_panel_button_collection",
                            label:"spa_eye.collections",
                            type:"radio",
                            className:"toolbar-text-button fbInternational",
                            tooltiptext:"spa_eye.collections",
                            command:FBL.bindFixed(this.selectChildPlate, this, childPlate.COLLECTION)
                        },
                        {
                            id:"spa_eye_panel_button_view",
                            label:"spa_eye.views",
                            type:"radio",
                            className:"toolbar-text-button fbInternational",
                            tooltiptext:"spa_eye.views",
                            command:FBL.bindFixed(this.selectChildPlate, this, childPlate.VIEW)
                        });
                }
                return buttons;
            },

            selectChildPlate:function (cpName) {
                cpName = cpName || this.currentPlate;
                if (!cpName) return false;

                var listener = this.context.spa_eyeObj._spaHook.listener,
                    chrome = Firebug.chrome;

                listener.removeListener(this.getCurrentPlate());

                Object.keys(childPlate).forEach(function (key) {
                    chrome.$('spa_eye_panel_button_' + childPlate[key]).checked = false;
                });
                chrome.$('spa_eye_panel_button_' + cpName).checked = true;

                this.currentPlate = cpName;

                listener.addListener(this.getCurrentPlate());
                this.getCurrentPlate().render();
            },

            getCurrentPlate:function (plateName) {
                return this.plates[plateName || this.currentPlate];
            },

            getOptionsMenuItems:function (context) {
                return [
                    this.optionMenu(Locale.$STR("spa_eye.all"), "spa_eye.all"),
                    "-",
                    this.optionMenu(Locale.$STR("spa_eye.views"), "spa_eye.views")
                ];
            },

            optionMenu:function (label, option) {
                var value = Firebug.getPref(Firebug.prefDomain, option);
                return {
                    label:label,
                    nol10n:true,
                    type:"checkbox",
                    checked:value,
                    command:FBL.bindFixed(Firebug.setPref, this, Firebug.prefDomain, option, !value)
                };
            },

            getContextMenuItems:function (object, target) {
                var row = Dom.getAncestorByClass(target, "memberRow");
                var items = [];
                if (row && row.domObject && (0 === parseInt(row.getAttribute('level'), 10))) {
                    var cp = this.plates[this.currentPlate];

                    if (this.currentPlate === childPlate.MODEL) {
                        var model = row.domObject.value;

                        items.push(
                            "-",
                            {
                                label:"Audit_Model",
                                tooltiptext:"spa_eye.audit.title",
                                command:Obj.bindFixed(cp.renderAuditForModel, cp, row)
                            },
                            {
                                label:(model
                                    && model.cid
                                    && this.context.spa_eyeObj._pinned_models[model.cid])
                                    ? "Unpin_this_model" : "Pin_this_model",
                                command:Obj.bindFixed(cp.pinOptionChange, cp, row)
                            },
                            {
                                label:"spa_eye.event.title",
                                tooltiptext:"spa_eye.event.title",
                                command:Obj.bindFixed(cp.showRelatedEvents, cp, row)
                            }
                        );
                    }
                }
                return items;
            },

            search:function () {
                var p = this.getCurrentPlate();
                return p && p.search && p.search.apply(p, arguments);
            },

            getEditor:function (target, value) {
                if (!this.editor) {
                    this.editor = new DOMEditor(this.document);
                }
                return this.editor;
            },

            setPropertyValue:function () {
                var p = this.getCurrentPlate();
                return p && p.setPropertyValue && p.setPropertyValue.apply(p, arguments);
            }

        });

// ********************************************************************************************* //
// Panel UI (Domplate)
// ********************************************************************************************* //
        with (Domplate) {
            Firebug.spa_eyePanel.prototype.reload_template = domplate({
                tag:DIV({onclick:"$handleClick", class:"$data|computeVisibility"}, Locale.$STR("spa_eye.reload")),

                handleClick:function (event) {

                    Firebug.Options.setPref("javascript", "enabled", true);
                    Firebug.TabWatcher.reloadPageFromMemory(Firebug.currentContext);
                },

                computeVisibility:function (data) {
                    return "show";//for now
                }

            });
        }

// ********************************************************************************************* //
// Registration

        Firebug.registerPanel(Firebug.spa_eyePanel);

        return Firebug.spa_eyePanel;

// ********************************************************************************************* //
    });
