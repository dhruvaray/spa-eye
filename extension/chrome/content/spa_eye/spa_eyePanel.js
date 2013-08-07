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
    "firebug/chrome/toolbar",
    "firebug/dom/domEditor",

    "spa_eye/lib/require/underscore",

    "spa_eye/panels/basePanel",

    "spa_eye/plates/modelPlate",
    "spa_eye/plates/collectionPlate",
    "spa_eye/plates/viewPlate",

    "spa_eye/panels/basePanel"

],
    function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, Str, Toolbar, DOMEditor, _, BasePanel, ModelPlate, CollectionPlate, ViewPlate) {

        var childPlate = {
            MODEL:'model',
            COLLECTION:'collection',
            VIEW:'view'
        };
        var spa_eyePanel = Firebug.spa_eyePanel = BasePanel.extend(Obj.extend(Firebug.ActivablePanel, {
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
            sidePanels:[],

            initialize:function () {
                this._super.apply(this, arguments);
                Firebug.registerUIListener(this);

                // Initialize plates
                var args = {
                    context:this.context,
                    parent:this
                }
                this.plates = {};
                this.plates.model = new ModelPlate(args);
                this.plates.collection = new CollectionPlate(args);
                this.plates.view = new ViewPlate(args);
            },

            destroy:function () {
                _.each(this.sidePanels, function (panel) {
                    Firebug.unregisterPanel(panel);
                });
                this._super.apply(this, arguments);
            },

            onBackboneLoaded:function () {
                this.show();
            },

            show:function (state) {
                var enabled = this.isEnabled();
                if (!enabled) return;

                var scriptPanel = this.context.getPanel('script');
                var active = !this.showWarning() && !scriptPanel.showWarning();
                var panelToolbar = Firebug.chrome.$("fbPanelToolbar");

                if (active) {
                    var buttons = this.getSPA_EyeToolbar();
                    for (var i = 0; i < buttons.length; ++i)
                        Toolbar.createToolbarButton(panelToolbar, buttons[i]);

                    this.selectChildPlate();
                    Dom.collapse(panelToolbar, false);

                    if (!this.activated) {
                        var self = this;
                        define([
                            "spa_eye/panels/viewPanel",
                            "spa_eye/panels/auditPanel",
                            "spa_eye/panels/eventPanel"
                        ], function (ViewPanel, AuditPanel, EventPanel) {
                            Firebug.registerPanel(Firebug.auditPanel);
                            self.sidePanels.push(AuditPanel);
                            Firebug.registerPanel(Firebug.eventPanel);
                            self.sidePanels.push(EventPanel);
                            Firebug.registerPanel(Firebug.viewPanel);
                            self.sidePanels.push(ViewPanel);
                            Events.dispatch(Firebug.uiListeners, "updateSidePanels", [self]);
                        });
                        this.activated = true;
                    }

                } else {
                    Dom.collapse(panelToolbar, true);
                    this.activated = false;
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

                var box = this.WarningRep.tag.replace(args, this.panelNode);
                var description = box.getElementsByClassName("disabledPanelDescription").item(0);
                return FirebugReps.Description.render(args.suggestion,
                    description,
                    Obj.bindFixed(Firebug.TabWatcher.reloadPageFromMemory,
                        Firebug.TabWatcher,
                        Firebug.currentContext));
            },

            getSPA_EyeToolbar:function () {

                var buttons = [];

                var isRecord = !!this.context.spa_eyeObj.isRecord;
                buttons.push(
                    {
                        id:"spa_eye_panel_button_record",
                        tooltiptext:Locale.$STR("spa_eye.record_events"),
                        image:isRecord
                            ? "chrome://spa_eye/skin/recording.svg"
                            : "chrome://spa_eye/skin/recordon.svg",
                        type:"checkbox",
                        checked:isRecord,
                        className:"toolbar-image-button fbInternational",
                        command:FBL.bindFixed(this.toggleRecord, this)
                    },
                    "-",
                    {
                        tooltiptext:Locale.$STR("spa_eye.refresh"),
                        image:"chrome://firebug/skin/rerun.svg",
                        className:"toolbar-image-button fbInternational",
                        command:FBL.bindFixed(this.resetTrackingData, this)
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

            toggleRecord:function () {
                var recordButton = Firebug.chrome.$('spa_eye_panel_button_record');
                var spa_eyeObj = this.context.spa_eyeObj;
                if (recordButton) {
                    recordButton.image = recordButton.checked
                        ? "chrome://spa_eye/skin/recording.svg"
                        : "chrome://spa_eye/skin/recordon.svg";
                    spa_eyeObj.isRecord = recordButton.checked;
                }
            },

            resetTrackingData:function () {
                var spa_eyeObj = this.context.spa_eyeObj;
                var win = this.context.window.wrappedJSObject;
                win.spa_eye.sequence = {};
                spa_eyeObj.auditRecords = {};
                Events.dispatch(spa_eyeObj._spaHook.listener.fbListeners, 'onTrackingDataCleared');
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
                                label:(model
                                    && model.cid
                                    && this.context.spa_eyeObj._pinned_models[model.cid])
                                    ? "Un_Pin_Model" : "Pin_Model",
                                command:Obj.bindFixed(cp.pinOptionChange, cp, row)
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

        }));

// ********************************************************************************************* //
// Panel UI (Domplate)
// ********************************************************************************************* //
        with (Domplate) {
            spa_eyePanel.prototype.WarningRep = domplate(Firebug.ScriptPanel.WarningRep, {
                tag:DIV({"class":"disabledSPA_EyePanelBox"},
                    H1({"class":"disabledPanelHead"},
                        SPAN("$pageTitle")
                    ),
                    P({"class":"disabledPanelDescription", style:"margin-top: 15px;"},
                        SPAN("$suggestion")
                    )
                )

            });
        }

// ********************************************************************************************* //
// Registration

        Firebug.registerPanel(Firebug.spa_eyePanel);
        return Firebug.spa_eyePanel;

// ********************************************************************************************* //
    });
