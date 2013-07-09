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

    "spa_eye/dom/modelReps",

    "spa_eye/auditPanel",
    "spa_eye/eventPanel",
    "spa_eye/viewPanel"

],
function(Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events, Str, DOMEditor, ModelReps) {


        Firebug.registerStringBundle("chrome://spa_eye/locale/spa_eye.properties");
        Firebug.registerStylesheet("chrome://spa_eye/skin/models.css");



        var NetRequestEntry = Firebug.NetMonitor.NetRequestEntry; 


// ********************************************************************************************* //
// Menus: Toolbar and context menu
// ********************************************************************************************* //

        var ChildSection = function ChildSection(option){
            for(var key in option){
                this[key] = option[key];
            }
        };

        ChildSection.prototype = {
            constructor: ChildSection,
                         
            name: '',
            title: '',
            parent: null,

            order: 0,

            // Element class
            container: null,
            body: null,

            // data - array of object(or function which returns array)
            data: function() {
                return [];
            },
            
            // Other default property for its data
            autoAdd: true,
            highlight: true,
            bubble: true,

            // Utils
            getBody: function() {
                if (this.body && this.parent) { 
                    return Dom.getElementByClass(this.parent, this.body);
                }
                return null;
            },

            getContainer: function() {
                if (this.container && this.parent) {
                    return Dom.getElementByClass(this.parent, this.container);
                }
                return null;
            }
        }


// ********************************************************************************************* //
// Custom Panel Implementation
// ********************************************************************************************* //

        var spa_eyePanel = Firebug.spa_eyePanel = function spa_eyePanel() {};
        var childPanel = Firebug.spa_eyePanel.childPanel = {
            MODEL: 'model',
            COLLECTION: 'collection',
            VIEW: 'view'
        };

        Firebug.spa_eyePanel.prototype = Obj.extend(Firebug.ActivablePanel, {
            name: "spa_eye",
            title: Locale.$STR("spa_eye.title"),
            searchable: true,
            editable: true,

            enableA11y: true,
            deriveA11yFrom: "dom",

            currentPanel: childPanel.MODEL,
            modelSections: null,

            editor: undefined,


            initialize: function() {
                Firebug.registerUIListener(this);
                Firebug.Panel.initialize.apply(this, arguments);

                this.context.spa_eyeObj._spaHook.listener.addListener(this);

                this.modelSections || (this.modelSections = []);
                this._initModelSection();
            },

            destroy: function() {
                Firebug.unregisterUIListener(this);
                Firebug.Panel.destroy.apply(this, arguments);

                if (this.context.spa_eyeObj){
                    this.context.spa_eyeObj._spaHook.listener.removeListener(this);
                }

                this.removeListener(this);
            },
            
            show: function(state) {
                var enabled = this.isEnabled();
                if (!enabled) {
                    return;
                }
    
                var active = !this.showWarning();

                if (active) {
                    this.selectChildPanel();
                } else {
                    // Not Active
                }
            },

            _initModelSection: function() {
                var pinned = new ChildSection({
                    name: 'pinned_models',
                    title: 'Pinned Models',
                    parent: this.panelNode,
                    order: 0,                    

                    container: 'pinnedModelsDiv',
                    body: 'pinnedModelsDivBody',

                    autoAdd: false,

                    data: this.context.spa_eyeObj._pinned_models
                });

                var mostUsed = new ChildSection({
                    name: 'most_used_models',
                    title: 'Most Used',
                    parent: this.panelNode,
                    order: 1,                    

                    container: 'mostUsedModelsDiv',
                    body: 'mostUsedModelsDivBody'
                });

                var allModels = new ChildSection({
                    name: 'all_models',
                    title: 'All Models',
                    parent: this.panelNode,
                    order: 2,

                    container: 'allModelsDiv',
                    body: 'allModelsDivBody',

                    data: FBL.bindFixed(this.context.spa_eyeObj.getModels, this.context.spa_eyeObj)
                });

                this.modelSections.push(pinned, mostUsed, allModels);
                return this.modelsSections;
            },
// ********************************************************************************************* //
// Hook
// ********************************************************************************************* //

// ********************************************************************************************* //
// Activation of spa_eye Panel 
// ********************************************************************************************* //

            onActivationChanged: function(enable){
                if (enable)
                    Firebug.spa_eyeModule.addObserver(this);
                else
                    Firebug.spa_eyeModule.removeObserver(this);
            },

            startInspecting: function() {

            },

            inspectNode: function(node) {
                return false;
            },

            stopInspecting: function(node, canceled) {
                this.inspectable = false;
            },

            supportsObject: function(object, type) {

            },

            showWarning: function(){
                if (!this.context.spa_eyeObj.hooked()) {
                    this.showNotHooked();
                } else {
                    return false;
                }
                return true;
            },

            showNotHooked: function(){
                var args = {
                    pageTitle: Locale.$STR("spa_eye.warning.inactive_during_page_load"),
                    suggestion: Locale.$STR("spa_eye.suggestion.inactive_during_page_load2")
                };

                var box = Firebug.ScriptPanel.WarningRep.tag.replace(args, this.panelNode);
                var description = box.getElementsByClassName("disabledPanelDescription").item(0);
                FirebugReps.Description.render(args.suggestion,
                    description,
                    Obj.bindFixed(Firebug.TabWatcher.reloadPageFromMemory,
                                    Firebug.TabWatcher,
                                    Firebug.currentContext));
            },

// ********************************************************************************************* //
// Menus: Toolbar and context menu
// ********************************************************************************************* //

            getPanelToolbarButtons: function() {

                var buttons = [];

                if (this.context.spa_eyeObj && this.context.spa_eyeObj.hooked()){
                    buttons.push({
                        label: "spa_eye.refresh",
                        className: "refresh",
                        command: FBL.bindFixed(this.selectChildPanel, this)
                    },
                    "-",
                    {
                        id: "spa_eye_panel_button_model",
                        label: "spa_eye.models",
                        type: "radio",
                        checked: true,
                        className: "toolbar-text-button fbInternational",
                        tooltiptext:"spa_eye.models",
                        command: FBL.bindFixed(this.selectChildPanel, this, childPanel.MODEL)
                    },
                    {
                        id: "spa_eye_panel_button_collection",
                        label: "spa_eye.collections",
                        type: "radio",
                        className: "toolbar-text-button fbInternational",
                        tooltiptext: "spa_eye.collections",
                        command: FBL.bindFixed(this.selectChildPanel, this, childPanel.COLLECTION)
                    },
                    {
                        id: "spa_eye_panel_button_view",
                        label: "spa_eye.views",
                        type: "radio",
                        className: "toolbar-text-button fbInternational",
                        tooltiptext: "spa_eye.views",
                        command: FBL.bindFixed(this.selectChildPanel, this, childPanel.VIEW)
                    });
                }
                return buttons;
            },

            selectChildPanel: function(childPanelName){
                childPanelName = childPanelName || this.currentPanel;
                if (!childPanelName) return false;

                var chrome = Firebug.chrome;

                ['model', 'collection', 'view'].forEach(function(cpName){
                    chrome.$('spa_eye_panel_button_'+cpName).checked = false;
                });
                chrome.$('spa_eye_panel_button_'+childPanelName).checked = true;
                this.currentPanel = childPanelName;
                this.inspectable = (childPanelName === childPanel.VIEW);

                this['on'
                    + childPanelName.charAt(0).toUpperCase() 
                    + childPanelName.slice(1).toLowerCase() 
                    + 'Button']();
            },
            
            getOptionsMenuItems: function(context){
                return [
                    this.optionMenu(Locale.$STR("spa_eye.all"), "spa_eye.all"),
                    "-",
                    this.optionMenu(Locale.$STR("spa_eye.views"), "spa_eye.views")
                ];
            },

            optionMenu: function(label, option){
                var value = Firebug.getPref(Firebug.prefDomain, option);
                return {
                    label: label,
                    nol10n: true,
                    type: "checkbox",
                    checked: value,
                    command: FBL.bindFixed(Firebug.setPref, this, Firebug.prefDomain, option, !value)
                };
            },

            getContextMenuItems: function(object, target) {
                var row = Dom.getAncestorByClass(target, "memberRow");
                var items = [];
                if (row && row.domObject && (0 === parseInt(row.getAttribute('level'), 10))) {
                    if (this.currentPanel === Firebug.spa_eyePanel.childPanel.MODEL) {
                        var model = row.domObject.value;

                        items.push(
                            "-",
                            {
                                label: "Audit_Model",
                                tooltiptext: "spa_eye.audit.title",
                                command: Obj.bindFixed(this.renderAuditForModel, this, row)
                            },
                            {
                                label: (model 
                                        && model.cid 
                                        && this.context.spa_eyeObj._pinned_models[model.cid]) 
                                        ? "Unpin_this_model" : "Pin_this_model",
                                command: Obj.bindFixed(this.pinOptionChange, this, row)
                            },
                            {
                                label: "spa_eye.event.title",
                                tooltiptext: "spa_eye.event.title",
                                command: Obj.bindFixed(this.showRelatedEvents, this, row)
                            }
                        );
                    }
                }
                return items;
            },

// ********************************************************************************************* //
// Views for child panel 
// ********************************************************************************************* //

            onViewButton: function() {
                var args = {
                    views: this.context.spa_eyeObj.getViews()
                };
               spa_eyePanel.view_template.Views.replace(args, this.panelNode, null);
            },

            onCollectionButton: function() {
                var args = {
                    collections: this.context.spa_eyeObj.getCollections()
                };
                spa_eyePanel.collection_template.Collections.replace(args, this.panelNode, null);
            },

            onModelButton: function() {
                var args = {
                    sections: this.modelSections.sort(function(a, b){
                                return a.order > b.order;
                             }),
                    mainPanel: this
                };

                ModelReps.DirTablePlate.tag.replace(args, this.panelNode);
            },

// ********************************************************************************************* //
// Search Model 
// ********************************************************************************************* //

            search: function(key){                        
                if (this.currentPanel === Firebug.spa_eyePanel.childPanel.MODEL) {
                    if (!key) {
                        this._filter (function(row) {
                            Css.removeClass(row, 'hide');
                        },this);
                        return true;
                    }

                    var globalFound = false;
                    this._filter(function(row){
                        Css.setClass(row, 'hide');                        
                        if (row.domObject.value) {
                            var model = row.domObject.value,
                                cid = row.domObject.name,
                                sb = key,
                                type = 'attr',
                                re = null,
                                found = false;

                            if (/^#/.test(key)){
                                sb = key.substr(1);
                                type = 'cid';
                            }

                            re = new RegExp(sb);
                            
                            if (type === 'cid'){
                                if(re.test(cid)) {
                                    found = true;
                                }
                            } else {
                                var attrs = model.attributes;
                                for (var a in attrs) {
                                    if (re.test(a) || re.test(attrs[a])) {
                                        found = true;
                                        break;
                                    }
                                }
                            }
                            found && Css.removeClass(row, 'hide');
                            globalFound = globalFound || found;
                        }
                    },this);

                    return globalFound;
                }
            },

            _filter: function(iterator, context){
                var rows = this.panelNode.getElementsByClassName("0level");
                for(var i=0;i<rows.length;i++){
                    var row = rows[i];
                    if (Css.hasClass(row, "opened")) {
                        ModelReps.DirTablePlate.toggleRow(row);
                    }
                    iterator.call(context, row);
                }
            },

// ********************************************************************************************* //
// Audit Model 
// ********************************************************************************************* //

            renderAuditForModel: function(row){
                Firebug.chrome.selectSidePanel("audit");
                var auditPanel = this.context.getPanel('audit', true);
                auditPanel.showAudit(row.domObject.value, this.context);
            },

// ********************************************************************************************* //
// Pin Model
// ********************************************************************************************* //

            pinOptionChange: function(row){
                var model = row.domObject.value,
                    cid = null;
                if(!model || !model.cid) return;

                cid = model.cid;
                
                if (this.context.spa_eyeObj._pinned_models[cid]) { // Already Pinned
                    this._unPinModel(model);
                } else { // Pin this model
                    this._pinModel(model);
                }
            },

            _pinModel: function(model) {
                try{
                    var tbody = Dom.getElementByClass(this.panelNode, 'pinnedModelsDivBody');
                    var noObjectRow = Dom.getChildByClass(tbody, 'noMemberRow');

                    if (noObjectRow) {
                        Css.removeClass(noObjectRow, 'hide');
                        Css.setClass(noObjectRow, 'hide');
                    }

                    var obj = {}; 
                    obj[model.cid] = model;
                    var members = ModelReps.DirTablePlate.memberIterator(obj);
                    ModelReps.DirTablePlate.rowTag.insertRows({members: members}, tbody);

                } catch(e) {
                    if (FBTrace.DBG_SPA_EYE){
                        FBTrace.sysout("Error: model.cid - " + model.cid, e); 
                    }
                }
                this.context.spa_eyeObj._pinned_models[model.cid] = model;
            },

            _unPinModel: function(model){
                if (!model) return;
                try{
                    var tbody = Dom.getElementByClass(this.panelNode, 'pinnedModelsDivBody');
                    var rows = tbody.getElementsByClassName("0level");
                    
                    for(var i=0;i<rows.length;i++){
                        var row = rows[i];
                        if (row.domObject.value.cid === model.cid) {
                            
                            this._foldRow(row, function(r) {
                                tbody.removeChild(r);
                                var rs = tbody.getElementsByClassName("0level");
                                if (!rs || rs.length === 0) {
                                    var noObj = Dom.getChildByClass(tbody, 'noMemberRow');
                                    noObj && Css.removeClass(noObj, 'hide');
                                }
                            }, this);

                            break;
                        }
                    }


                } catch(e) {
                    if (FBTrace.DBG_SPA_EYE){
                        FBTrace.sysout("Error:  model.cid - " + model.cid, e); 
                    }
                }
                delete this.context.spa_eyeObj._pinned_models[model.cid];
            },

// ********************************************************************************************* //
// Related Events
// ********************************************************************************************* //

            showRelatedEvents: function(row) {
                Firebug.chrome.selectSidePanel("event");
                var eventPanel = this.context.getPanel('event', true);
                eventPanel.showEvents(row.domObject.value, this.context);
            },

// ********************************************************************************************* //
// Inline Editor        
// ********************************************************************************************* //

            getEditor: function(target, value) {
                if (!this.editor) {
                    this.editor = new DOMEditor(this.document);
                }
                return this.editor;
            },

            setPropertyValue: function(row, value) {
                this.setModelPropertyValue.apply(this, arguments);
            },

            setModelPropertyValue: function(row, value) {
                var member = row.domObject;
                var name = member.name;    
                var key = this._getRowName(row);

                var object = Firebug.DOMBasePanel.prototype.getRowObject(row);
                if (name === 'this')
                    return;

                Firebug.CommandLine.evaluate(value, 
                        this.context,
                        object,
                        this.context.getCurrentGlobal(),
                        function success(result, context) {                        
                            if (FBTrace.DBG_SPA_EYE){
                                FBTrace.sysout("spa_eye; setPropertyValue evaluate success " + 
                                            "object.set(" + name + ", " + result + ");");
                                            
                            }
                            object.set(name, result);
                        },
                        function failed (exc, context){
                            try{
                                if (FBTrace.DBG_SPA_EYE) {
                                    FBTrace.sysout("spa_eye; setModelPropertyValue evalute FAILED", exec);
                                }
                            } catch(exc) {}
                        });
            
                this.refresh(this._getLogicalParentRow(row) || row);
            },
            
            editModelProperty: function(row, editValue) {
                var model = row.domObject;
                var object = Firebug.DOMBasePanel.prototype.getRowObject(row);
                if (!editValue) {
                    var propName = this._getRowName(row);
                    var propValue = object && object.attributes[propName];

                    var type = typeof propValue;

                    if (type === "undefined" || type === "number" || type === "boolean")
                        editValue = "" + propValue;
                    else if (type === "string")
                        editValue = "\"" + Str.escapeJS(propValue) + "\"";
                    else if (propValue === null)
                        editValue = "null";
                    else if (object instanceof window.Window || object instanceof StackFrame.StackFrame)
                        editValue = this._getRowName(row);
                    else
                        editValue = "this." + this._getRowName(row);
                }
                Firebug.Editor.startEditing(row, editValue);
            },

            _getLogicalParentRow: function(row){
                var row_level = parseInt(row.getAttribute("level"), 10);
                if (row_level === 0) {
                    return null;
                }

                var parent = row;
                while(parent && parseInt(parent.getAttribute("level"), 10) !== (row_level-1)) {
                    parent = parent.previousSibling;
                }
                return parent;
            },

            _getRowName: function(row) {
                var labelNode = row.getElementsByClassName("memberLabelCell").item(0);
                return labelNode.textContent;
            },

            _getRowValue: function(row) {
                var valueNode = row.getElementsByClassName("memberValueCell").item(0);
                return valueNode.firstChild.repObject;
            },

// ********************************************************************************************* //
// Refresh
// ********************************************************************************************* //
            refresh: function(row){
                ModelReps.DirTablePlate.toggleRow(row);
                ModelReps.DirTablePlate.toggleRow(row);
            },

// ********************************************************************************************* //
// OnModelSet
// ********************************************************************************************* //

            onModelSet: function(model, type) {
                this.modelSections.forEach(function(p) {
                    this._onModelSet(p, model, type);
                }, this);
            },

            _onModelSet: function(section, model, type) {
                var tbody = section.getBody();

                if (!model || !model.cid || !tbody) return;

                if (section.autoAdd) {
                    var noObjectRow = Dom.getChildByClass(tbody, 'noMemberRow');

                    if (noObjectRow) {
                        Css.removeClass(noObjectRow, 'hide');
                        Css.setClass(noObjectRow, 'hide');
                    }
                }

                var rows = tbody.getElementsByClassName('0level');
                var found = false;
                if (rows) {
                    for (var i=0;i<rows.length;i++) {
                        var row = rows[i];
                        var m = row.domObject.value;
                        if (model.cid == m.cid) {
                            found = true;
                            this._foldRow(row, function(r){
                                this._highlightRow(r, type ? type : 'row-warning');
                                this._bubbleUpRow(r);
                            }, this);
                            break;
                        }
                    }
                }

                if (!found && section.autoAdd) {
                    var obj = {};                     
                    obj[model.cid] = model;
                    var members = ModelReps.DirTablePlate.memberIterator(obj);
                    var result = ModelReps.DirTablePlate.rowTag.insertRows({members: members}, tbody);
                    this._highlightRow(result[0], type ? type : 'row-warning');
                    this._bubbleUpRow(result[0]);
                }
            },

// ********************************************************************************************* //
// On Model Save 
// ********************************************************************************************* //

            onModelSave: function(model, file) {
                var isError = NetRequestEntry.isError(file);
                this.onModelSet(model,  isError ? 'row-error' : 'row-success');
            },

// ********************************************************************************************* //
// Bubble up and highlight row
// ********************************************************************************************* //

            _foldRow: function(row, cb, context, otherArgs) {
                var args = [row];                        
                otherArgs && args.push.apply(args, otherArgs);
                if (row && Css.hasClass(row, 'opened')) {
                    return ModelReps.DirTablePlate.toggleRow(row, function() {
                        cb && cb.apply(this, args);
                    }, context ? context : this);
                } 
                return cb && cb.apply(context ? context : this, args);
            },

            _bubbleUpRow: function (row) {
                var tbody = row.parentNode;

                var level = parseInt(row.getAttribute('level'), 10);
                var model = row.domObject.value;

                setTimeout(function() {
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
            },

            _highlightRow: function (row, type) {
                Css.setClass(row, type);
                setTimeout(function() {
                    Css.setClass(row, 'fade-in');
                    Css.removeClass(row, type);
                    setTimeout(function(){
                        Css.removeClass(row, 'fade-in');
                    }, 2000);
                }, 1000);
            }

// ********************************************************************************************* //
});

// ********************************************************************************************* //
// Panel UI (Domplate)
// ********************************************************************************************* //
        with(Domplate) {

            Firebug.spa_eyePanel.prototype.reload_template =  domplate({
                tag:
                    DIV({onclick: "$handleClick", class: "$data|computeVisibility"},Locale.$STR("spa_eye.reload")),

                handleClick : function(event){
                    Firebug.TabWatcher.reloadPageFromMemory(Firebug.currentContext);
                },

                computeVisibility : function(data){
                    return "show";//for now
                }

            });

            Firebug.spa_eyePanel.collection_template =  domplate({
                Collections:
                    FOR("item", "$collections",
                        DIV({_collection: "$item", onclick: "$handleClick"},"$item.cid")
                    ),
                handleClick: function(event) {
                    alert(event);
                }
            });

            Firebug.spa_eyePanel.view_template =  domplate({
                Views:
                    FOR("item", "$views",
                        DIV({_view: "$item", onclick: "$handleClick"},"$item|formatName")
                    ),
                handleClick: function(event){

                    var selectedView = event.target && event.target.view;
                    var context = Firebug.currentContext;
                    var win = context.window.wrappedJSObject;
                    if (selectedView) {
                        Firebug.Inspector.highlightObject([selectedView.el],
                            context,
                            "frame",
                            null,
                            ["#ff0000",{background:"#0000ff", border:"#ff0000"}]);
                    }
                },
                formatName : function(obj){
                    var aScript = obj.getAssociatedScript();
                    return obj.cid + (aScript ? " ("+ aScript +")": '');
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
