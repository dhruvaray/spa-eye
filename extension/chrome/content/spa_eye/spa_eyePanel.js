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
    //"firebug/dom/domEditor",

    "spa_eye/plates/modelPlate",
    "spa_eye/plates/collectionPlate",
    "spa_eye/plates/viewPlate",

    "spa_eye/panels/basePanel",

    "spa_eye/panels/viewPanel",
    "spa_eye/panels/auditPanel",
    "spa_eye/panels/eventPanel"
],
function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, Str, ModelPlate, CollectionPlate, ViewPlate) {

        var NetRequestEntry = Firebug.NetMonitor.NetRequestEntry;

        var spa_eyePanel = Firebug.spa_eyePanel = function spa_eyePanel() {
        };
        var childPanel = Firebug.spa_eyePanel.childPanel = {
            MODEL:'model',
            COLLECTION:'collection',
            VIEW:'view'
        };

        Firebug.spa_eyePanel.prototype = Obj.extend(Firebug.ActivablePanel, {
            name: "spa_eye",
            title: Locale.$STR("spa_eye.title"),
            searchable: true,
            //editable: true,
            editor: undefined,

            enableA11y: true,
            deriveA11yFrom:"dom",

            currentPanel: childPanel.MODEL,
            panels: null,

            initialize:function () {
                this.panels = {};
                Firebug.registerUIListener(this);
                Firebug.Panel.initialize.apply(this, arguments);

                // Initialize plates
                this.panels.model = new ModelPlate(this.context, this);
                this.panels.collection = new CollectionPlate(this.context, this);
                this.panels.view = new ViewPlate(this.context, this);
            },

            destroy:function () {
                Firebug.unregisterUIListener(this);
                Firebug.Panel.destroy.apply(this, arguments);

                this.removeListener(this);

                if (this.context.spa_eyeObj) {
                    try{
                        this.context.spa_eyeObj._spaHook.listener.removeListener(this);
                    }catch(e){}
                }
            },

            show:function (state) {
                var enabled = this.isEnabled();
                if (!enabled) return;

                var active = !this.showWarning();

                if (active) {
                    this.selectChildPanel();
                }
            },

            onActivationChanged:function (enable) {
                if (enable)
                    Firebug.spa_eyeModule.addObserver(this);
                else
                    Firebug.spa_eyeModule.removeObserver(this);
            },

            startInspecting:function () {},

            inspectNode:function (node) {
                return false;
            },

            stopInspecting:function (node, canceled) {
                this.inspectable = false;
            },

            supportsObject:function (object, type) {},

            showWarning:function () {
                if (!this.context.spa_eyeObj.hooked()) {
                    this.showNotHooked();
                } else {
                    return false;
                }
                return true;
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
                            command:FBL.bindFixed(this.selectChildPanel, this)
                        },
                        "-",
                        {
                            id:"spa_eye_panel_button_model",
                            label:"spa_eye.models",
                            type:"radio",
                            checked:true,
                            className:"toolbar-text-button fbInternational",
                            tooltiptext:"spa_eye.models",
                            command:FBL.bindFixed(this.selectChildPanel, this, childPanel.MODEL)
                        },
                        {
                            id:"spa_eye_panel_button_collection",
                            label:"spa_eye.collections",
                            type:"radio",
                            className:"toolbar-text-button fbInternational",
                            tooltiptext:"spa_eye.collections",
                            command:FBL.bindFixed(this.selectChildPanel, this, childPanel.COLLECTION)
                        },
                        {
                            id:"spa_eye_panel_button_view",
                            label:"spa_eye.views",
                            type:"radio",
                            className:"toolbar-text-button fbInternational",
                            tooltiptext:"spa_eye.views",
                            command:FBL.bindFixed(this.selectChildPanel, this, childPanel.VIEW)
                        });
                }
                return buttons;
            },

            selectChildPanel:function (cpName) {
                cpName = cpName || this.currentPanel;
                if (!cpName) return false;

                var listener = this.context.spa_eyeObj._spaHook.listener,
                    chrome = Firebug.chrome;

                if (cpName !== this.currentPanel) {
                    listener.removeListener(this.getCurrentPanel());
                }

                Object.keys(childPanel).forEach(function (key) {
                    chrome.$('spa_eye_panel_button_' + childPanel[key]).checked = false;
                });
                chrome.$('spa_eye_panel_button_' + cpName).checked = true;

                this.currentPanel = cpName;
                this.inspectable = (cpName === childPanel.VIEW);

                listener.addListener(this.getCurrentPanel());
                this.getCurrentPanel().render();
            },

            getCurrentPanel: function(panelName) {
                return this.panels[panelName || this.currentPanel];
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
                    var cp = this.panels[this.currentPanel];

                    if (this.currentPanel === childPanel.MODEL) {
                        var model = row.domObject.value;

                        items.push(
                            "-",
                            {
                                label:"Audit_Model",
                                tooltiptext:"spa_eye.audit.title",
                                command: Obj.bindFixed(cp.renderAuditForModel, cp, row)
                            },
                            {
                                label:(model
                                    && model.cid
                                    && this.context.spa_eyeObj._pinned_models[model.cid])
                                    ? "Unpin_this_model" : "Pin_this_model",
                                command: Obj.bindFixed(cp.pinOptionChange, cp, row)
                            },
                            {
                                label:"spa_eye.event.title",
                                tooltiptext:"spa_eye.event.title",
                                command: Obj.bindFixed(cp.showRelatedEvents, cp, row)
                            }
                        );
                    }
                }
                return items;
            },

            search: function () {
                var p = this.getCurrentPanel();
                return p && p.search && p.search.apply(p, arguments);
            },

            getEditor: function (target, value) {
                if (!this.editor) {
                    this.editor = new DOMEditor(this.document);
                }
                return this.editor;
            },

            setPropertyValue: function() {
                var p = this.getCurrentPanel();
                return p && p.setPropertyValue && p.setPropertyValue.apply(p, arguments);
            },

            editProperty: function () {
                var p = this.getCurrentPanel();
                return p && p.editProperty && p.editProperty.apply(p, arguments);
            }
        });

// ********************************************************************************************* //
// Panel UI (Domplate)
// ********************************************************************************************* //
        with (Domplate) {
            Firebug.spa_eyePanel.prototype.reload_template = domplate({
                tag:DIV({onclick:"$handleClick", class:"$data|computeVisibility"}, Locale.$STR("spa_eye.reload")),

                handleClick:function (event) {
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
