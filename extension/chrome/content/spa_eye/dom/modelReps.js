/* See license.txt for terms of usage */
/*jshint esnext:true, es5:true, curly:false */
/*global FBTrace:true, XPCNativeWrapper:true, Window:true, define:true */

define([
    "firebug/firebug",
    "firebug/lib/domplate",
    "firebug/chrome/reps",
    "firebug/lib/locale",
    "firebug/lib/events",
    "firebug/lib/dom",
    "firebug/lib/css",
    "firebug/lib/string",
    "firebug/dom/toggleBranch",
    "firebug/dom/domModule",
],
function(Firebug, D, FirebugReps, Locale, Events, Dom, Css, Str, ToggleBranch, DOMModule) {

"use strict";

// ********************************************************************************************* //
// Constants

const insertSliceSize = 18;
const insertInterval = 40;

// ********************************************************************************************* //

var WatchRowTag =
    D.TR({"class": "watchNewRow", level: 0},
        D.TD({"class": "watchEditCell", colspan: 3},
            D.DIV({"class": "watchEditBox a11yFocusNoTab", role: "button", tabindex: "0",
                "aria-label": Locale.$STR("a11y.labels.press enter to add new watch expression")},
                    Locale.$STR("NewWatch")
            )
        )
    );

var SizerRow =
    D.TR({role: "presentation"},
        D.TD(),
        D.TD({width: "30%"}),
        D.TD({width: "70%"})
    );

var DirTablePlate = D.domplate(Firebug.Rep, {

    memberRowTag:
        D.TR({"class": "memberRow $member.open $member.type\\Row $member.noMemberRow modelRow $member.level\\level",
            _domObject: "$member",
            $hasChildren: "$member.hasChildren",
            role: "presentation",
            level: "$member.level",
            breakable: "$member.breakable",
            breakpoint: "$member.breakpoint",
            disabledBreakpoint: "$member.disabledBreakpoint"},

            D.TD({"class": "memberHeaderCell"},
                D.DIV({"class": "sourceLine memberRowHeader", 
                    onclick: "$onClickRowHeader"},                    
                    "&nbsp;"
               )
            ),

            D.TD({"class": "memberLabelCell", 
                style: "padding-left: $member.indent\\px",
                role: "presentation"},
                D.DIV({"class": "memberLabel $member.type\\Label", title: "$member.title"},
                    D.SPAN({"class": "memberLabelPrefix green"}, "$member.prefix"),
                    D.SPAN({title: "$member|getMemberNameTooltip"}, "$member.name")
                )
            ),

            D.TD({"class": "memberValueCell",
                   $readOnly: "$member.readOnly",
                   role: "presentation"},
                D.TAG("$member.tag", {object: "$member.value"})
            )
        ),

    tag:
        D.DIV({"class": "modelDivision"},
            D.FOR("section", "$sections",
                D.TAG("$sectionTag", {
                    section: "$section",
                    mainPanel: "$mainPanel"
                })
            )
        ),

    rowTag:
        D.FOR("member", "$members",
            D.TAG("$memberRowTag", {member: "$member"})
        ),
    
    headerTag: 
        D.DIV({"class": "headerRow headerImage",
            title: "$headerTitle", 
            onclick: "$onHeaderClick"},
            D.SPAN({"class": "headerContext"}, "$headerTitle")
        ),

    sectionTag:
        D.DIV({"class": "modelSection $section.container"},
            D.TAG("$headerTag", {
                    //headerTitle: "Hello",
                    headerTitle: "$section.title",
                    onHeaderClick: "$toggleHeader"
                }),
            D.TABLE({"class": "domTable",
                    cellpadding: 0,
                    cellspacing: 0,
                    onclick: "$onClick",
                    _repObject: "$section.data|result",
                    role: "tree", 
                    _mainPanel: "$mainPanel",
                    "aria-label": Locale.$STR("aria.labels.dom properties")},
                    D.TBODY({role: "presentation", "class": "$section.body"},
                        SizerRow,
                        D.FOR("member", "$section.data|result|memberIterator",
                            D.TAG("$memberRowTag", {member: "$member"})
                        )
                    )
            )
        ),

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

    memberIterator: function(object) {
        var result = object;
        if (object && Array.isArray(object)){
            result = {}; 
            object.forEach(function(eachElement){
                result[eachElement.cid] = eachElement;
            });
        }

        var members = Firebug.DOMBasePanel.prototype.getMembers(result, 0, null);
        if (members.length)
            return members;

        return [{
            name: Locale.$STR("firebug.dom.noChildren2"),
            type: "string",
            rowClass: "memberRow-string",
            tag: Firebug.Rep.tag,
            noMemberRow: "noMemberRow",
            prefix: ""
        }];
    },

    getMemberNameTooltip: function(member) {
        return member.title || member.scopeNameTooltip;
    },

    result: function(obj) {
        if (typeof obj === 'function') {
            return obj();
        }
        return obj;
    },

    pinnedModelTag:
        D.DIV({"class": "modelSection pinnedModelsDiv"},
            D.TAG("$headerTag", {
                    headerTitle: "Pinned models",
                    onHeaderClick: "$toggleHeader"
                }),
            D.TABLE({"class": "domTable",
                    cellpadding: 0,
                    cellspacing: 0,
                    onclick: "$onClick",
                    _repObject: "$pinned",
                    role: "tree", 
                    _mainPanel: "$mainPanel",
                    "aria-label": Locale.$STR("aria.labels.dom properties")},
                    D.TBODY({role: "presentation", "class": "pinnedModelsDivBody"},
                        SizerRow,
                        D.FOR("member", "$pinned|memberIterator",
                            D.TAG("$memberRowTag", {member: "$member"})
                        )
                    )
            )
        ),

    mostUsedModelTag:
        D.DIV({"class": "modelSection mostUsedModelsDiv"},
            D.TAG("$headerTag", {
                        headerTitle: "Most used",
                        onHeaderClick: "$toggleHeader"
                    }),
            D.TABLE({"class": "domTable",
                    cellpadding: 0,
                    cellspacing: 0,
                    onclick: "$onClick",
                    _repObject: "$most_used",
                    role: "tree", 
                    _mainPanel: "$mainPanel",
                    "aria-label": Locale.$STR("aria.labels.dom properties")},
                    D.TBODY({role: "presentation", "class": "mostUsedModelsDivBody"},
                        SizerRow,
                        D.FOR("member", "$most_used|memberIterator",
                            D.TAG("$memberRowTag", {member: "$member"})
                        )
                    )
            )
        ),

    allModelTag:
        D.DIV({"class": "modelSection allModelsDiv"},
            D.TAG("$headerTag", {
                        headerTitle: "All models",
                        onHeaderClick: "$toggleHeader"
                    }),
            D.TABLE({"class": "domTable",
                    cellpadding: 0,
                    cellspacing: 0,
                    onclick: "$onClick",
                    _repObject: "$object",
                    role: "tree", 
                    _mainPanel: "$mainPanel",
                    "aria-label": Locale.$STR("aria.labels.dom properties")},
                    D.TBODY({role: "presentation", "class": "allModelsDivBody"},
                        SizerRow,
                        D.FOR("member", "$object|memberIterator",
                            D.TAG("$memberRowTag", {member: "$member"})
                        )
                    )
            )
        ),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

    onClick: function(event) {
        if (!Events.isLeftClick(event))
            return;

        var row = Dom.getAncestorByClass(event.target, "memberRow");
        var label = Dom.getAncestorByClass(event.target, "memberLabel");
        var valueCell = row.getElementsByClassName("memberValueCell").item(0);
        var object = Firebug.getRepObject(event.target);
        var target = row.lastChild.firstChild;
        var isString = Css.hasClass(target,"objectBox-string");
        var inValueCell = (event.target === valueCell || event.target === target);

        if (label && Css.hasClass(row, "hasChildren") && !(isString && inValueCell)) {
            row = label.parentNode.parentNode;
            this.toggleRow(row);
            Events.cancelEvent(event);
        } else {
            if (typeof(object) === "function") {
                Firebug.chrome.select(object, "script");
                Events.cancelEvent(event);
            } else if (Events.isDoubleClick(event)) {
                var table = Dom.getAncestorByClass(row, "domTable");
                var mainPanel = table.mainPanel;
                var member = row.domObject;
                var rowValue = member.value;

                if (typeof rowValue === "boolean")
                    mainPanel.setModelPropertyValue(row, ""+!rowValue);
                else
                    mainPanel.editModelProperty(row);

                Events.cancelEvent(event);
            }
        }
    },

    toggleRow: function(row, callback, context) {
        var level = parseInt(row.getAttribute("level"), 10);
        var table = Dom.getAncestorByClass(row, "domTable");
        var target = row.lastChild.firstChild;
        var isString = Css.hasClass(target, "objectBox-string");

        if (Css.hasClass(row, "opened")) {

            Css.removeClass(row, "opened");

            if (isString) {
                var rowValue = row.domObject.value;
                row.lastChild.firstChild.textContent = '"' + Str.cropMultipleLines(rowValue) + '"';

                callback && callback.call(context?context:this, row);

            } else {
                var rowTag = this.rowTag;
                var tbody = row.parentNode;

                setTimeout(function() {
                    for (var firstRow = row.nextSibling; firstRow; firstRow = row.nextSibling) {
                        if (parseInt(firstRow.getAttribute("level"), 10) <= level)
                            break;

                        tbody.removeChild(firstRow);
                    }
                    
                    callback && callback.call(context?context:this, row);

                }, row.insertTimeout ? row.insertTimeout : 0);
            }

        } else {
            Css.setClass(row, "opened");
            if (isString) {
                var rowValue = row.domObject.value;
                row.lastChild.firstChild.textContent = '"' + rowValue + '"';
                callback && callback.call(context?context:this, row);
            } else {
                var repObj = target.repObject;
                if (repObj && repObj.attributes) {
                    repObj = repObj.attributes; 
                }
                var members = Firebug.DOMBasePanel.prototype.getMembers(repObj, 
                        level+1, 
                        null);

                var rowTag = this.rowTag;
                var lastRow = row;

                var delay = 0;
                var setSize = members.length;
                var rowCount = 1;

                while (members.length) {
                    let slice = members.splice(0, insertSliceSize);
                    let isLast = !members.length;
                    setTimeout(function() {
                        if (lastRow.parentNode) {
                            var result = rowTag.insertRows({members: slice}, lastRow);
                            lastRow = result[1];

                            Events.dispatch(DOMModule.fbListeners,
                                "onMemberRowSliceAdded",
                                [null, result, rowCount, setSize]);

                            rowCount += insertSliceSize;
                        }

                        if (isLast) {
                            callback && callback.call(context?context:this, row);
                            delete row.insertTimeout;
                        }
                    }, delay);

                    delay += insertInterval;
                }

                row.insertTimeout = delay;
            }
        }
    },

    toggleHeader: function(event){
        var target = Dom.getAncestorByClass(event.target, "headerRow");
        var table = target.nextSibling;
        if (Css.hasClass(table, "hide")){
            Css.removeClass(table, "hide");
            Css.removeClass(target, "opened");
        } else {
            Css.setClass(table, "hide");
            Css.setClass(target, "opened");
        }
    },

    onClickRowHeader: function(event) {
        Events.cancelEvent(event);

        var rowHeader = event.target;
        if (!Css.hasClass(rowHeader, "memberRowHeader"))
            return;

        var row = Dom.getAncestorByClass(event.target, "memberRow");
        if (!row)
            return;

        var panel = row.parentNode.parentNode.domPanel;
        if (panel) {
            var scriptPanel = panel.context.getPanel("script", true);
            if (!scriptPanel || !scriptPanel.isEnabled())
                return;     // set the breakpoint only if the script panel will respond.
            panel.breakOnProperty(row);
        }
    }
});

// ********************************************************************************************* //
// Registration

return {
    DirTablePlate: DirTablePlate,
    insertSliceSize: insertSliceSize,
    insertInterval: insertInterval,
};

// ********************************************************************************************* //
});
