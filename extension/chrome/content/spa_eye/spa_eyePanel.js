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

    "spa_eye/panels/modelPanel",
    "spa_eye/panels/collectionPanel",
    "spa_eye/panels/viewPanel"
],
    function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, Str, DOMEditor, ModelPanel, CollectionPanel, ViewPanel) {

        Firebug.registerStringBundle("chrome://spa_eye/locale/spa_eye.properties");
        Firebug.registerStylesheet("chrome://spa_eye/skin/models.css");

        var NetRequestEntry = Firebug.NetMonitor.NetRequestEntry;

        var spa_eyePanel = Firebug.spa_eyePanel = function spa_eyePanel() {
        };
        var childPanel = Firebug.spa_eyePanel.childPanel = {
            MODEL:'model',
            COLLECTION:'collection',
            VIEW:'view'
        };

        Firebug.spa_eyePanel.prototype = Obj.extend(Firebug.ActivablePanel, {
            name:"spa_eye",
            title:Locale.$STR("spa_eye.title"),
            searchable:true,
            editable:true,

            enableA11y:true,
            deriveA11yFrom:"dom",

            currentPanel:childPanel.MODEL,
            panels:{},

            initialize:function () {
                Firebug.registerUIListener(this);
                Firebug.Panel.initialize.apply(this, arguments);
                this.context.spa_eyeObj._spaHook.listener.addListener(this);

                // Initialize panels
                this.panels.model = new ModelPanel(this.context, this);
                this.panels.collection = new CollectionPanel(this.context, this);
                this.panels.view = new ViewPanel(this.context, this);
            },

            destroy:function () {
                Firebug.unregisterUIListener(this);
                Firebug.Panel.destroy.apply(this, arguments);

                if (this.context.spa_eyeObj) {
                    this.context.spa_eyeObj._spaHook.listener.removeListener(this);
                }

                this.removeListener(this);
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

            startInspecting:function () {

            },

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

            selectChildPanel:function (childPanelName) {
                childPanelName = childPanelName || this.currentPanel;
                if (!childPanelName) return false;

                var chrome = Firebug.chrome;

                ['model', 'collection', 'view'].forEach(function (cpName) {
                    chrome.$('spa_eye_panel_button_' + cpName).checked = false;
                });
                chrome.$('spa_eye_panel_button_' + childPanelName).checked = true;
                this.currentPanel = childPanelName;
                this.inspectable = (childPanelName === childPanel.VIEW);

                this.panels[childPanelName].render();
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
                    if (this.currentPanel === Firebug.spa_eyePanel.childPanel.MODEL) {
                        var model = row.domObject.value;

                        items.push(
                            "-",
                            {
                                label:"Audit_Model",
                                tooltiptext:"spa_eye.audit.title",
                                command:Obj.bindFixed(this.renderAuditForModel, this, row)
                            },
                            {
                                label:(model
                                    && model.cid
                                    && this.context.spa_eyeObj._pinned_models[model.cid])
                                    ? "Unpin_this_model" : "Pin_this_model",
                                command:Obj.bindFixed(this.pinOptionChange, this, row)
                            },
                            {
                                label:"spa_eye.event.title",
                                tooltiptext:"spa_eye.event.title",
                                command:Obj.bindFixed(this.showRelatedEvents, this, row)
                            }
                        );
                    }
                }
                return items;
            },

            onViewButton:function () {
                var args = {
                    views:this.context.spa_eyeObj.getViews()
                };
                spa_eyePanel.view_template.Views.replace(args, this.panelNode, null);
            },

            search:function (key) {
                if (this.currentPanel === Firebug.spa_eyePanel.childPanel.MODEL)
                    this.panels.model.search(key);
            },

            getEditor:function (target, value) {
                if (!this.editor) {
                    this.editor = new DOMEditor(this.document);
                }
                return this.editor;
            },

            onModelSave:function (model, file) {
                var isError = NetRequestEntry.isError(file);
                this.panels.model.onModelSet(model, isError ? 'row-error' : 'row-success');
            },

            setPropertyValue:function (row, value) {
                if (this.currentPanel === Firebug.spa_eyePanel.childPanel.MODEL)
                    this.panels.model.setModelPropertyValue(row, value);
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
        Firebug.registerStylesheet("chrome://spa_eye/skin/spa_eye.css");

        return Firebug.spa_eyePanel;

// ********************************************************************************************* //
    });
