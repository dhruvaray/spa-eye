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
    "firebug/dom/domModule"
],
    function (Firebug, D, FirebugReps, Locale, Events, Dom, Css, Str, DOMModule) {

        "use strict";

// ********************************************************************************************* //
// Constants

        const insertSliceSize = 18;
        const insertInterval = 40;

// ********************************************************************************************* //

        var WatchRowTag =
            D.TR({"class":"watchNewRow", level:0},
                D.TD({"class":"watchEditCell", colspan:3},
                    D.DIV({"class":"watchEditBox a11yFocusNoTab", role:"button", tabindex:"0",
                            "aria-label":Locale.$STR("a11y.labels.press enter to add new watch expression")},
                        Locale.$STR("NewWatch")
                    )
                )
            );

        var SizerRow =
            D.TR({role:"presentation"},
                D.TD(),
                D.TD({width:"30%"}),
                D.TD({width:"70%"})
            );

        var DirTablePlate = D.domplate(Firebug.Rep, {

            memberRowTag:D.TR({"class":"memberRow $member.open $member.type\\Row $member.noMemberRow modelRow $member.level\\level",
                    _domObject:"$member",
                    $hasChildren:"$member.hasChildren",
                    role:"presentation",
                    level:"$member.level",
                    breakable:"$member.breakable",
                    breakpoint:"$member.breakpoint",
                    disabledBreakpoint:"$member.disabledBreakpoint"},

                D.TD({"class":"memberHeaderCell"},
                    D.DIV({"class":"sourceLine memberRowHeader",
                            onclick:"$onClickRowHeader"},
                        "&nbsp;"
                    )
                ),

                D.TD({"class":"memberLabelCell",
                        style:"padding-left: $member.indent\\px",
                        role:"presentation"},
                    D.DIV({"class":"memberLabel $member.type\\Label", title:"$member.title"},
                        D.SPAN({"class":"memberLabelPrefix green"}, "$member.prefix"),
                        D.SPAN({title:"$member|getMemberNameTooltip"}, "$member.name")
                    )
                ),

                D.TD({"class":"memberValueCell",
                        $readOnly:"$member.readOnly",
                        role:"presentation"},
                    D.TAG("$member.tag", {object:"$member.value"})
                )
            ),

            tag:D.DIV({"class":"modelDivision"},
                D.FOR("section", "$sections",
                    D.TAG("$sectionTag", {
                        section:"$section",
                        mainPanel:"$mainPanel"
                    })
                )
            ),

            rowTag:D.FOR("member", "$members",
                D.TAG("$memberRowTag", {member:"$member"})
            ),

            headerTag:D.DIV({"class":"headerRow headerImage $section.collapse|_getCollapsedClass",
                    title:"$headerTitle",
                    _domObject:"$section",
                    _mainPanel:"$mainPanel",
                    onclick:"$onHeaderClick"},
                D.SPAN({"class":"headerContext"}, "$headerTitle")
            ),

            sectionTag:D.DIV({"class":"modelSection $section.container"},
                D.TAG("$headerTag", {
                    section:"$section",
                    mainPanel:"$mainPanel",
                    headerTitle:"$section.title",
                    onHeaderClick:"$toggleHeader"
                }),
                D.TABLE({"class":"domTable $section.collapse|_getHideClass",
                        cellpadding:0,
                        cellspacing:0,
                        onclick:"$onClick",
                        _repObject:"$section.data|result",
                        role:"tree",
                        _mainPanel:"$mainPanel",
                        "aria-label":Locale.$STR("aria.labels.dom properties")},
                    D.TBODY({role:"presentation", "class":"$section.body"},
                        SizerRow,
                        D.FOR("member", "$section|augment|memberIterator",
                            D.TAG("$memberRowTag", {member:"$member"})
                        )
                    )
                )
            ),

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

            memberIterator:function (obj) {
                var result = obj.data;
                if (!obj.section.ignoreKey && obj.data && Array.isArray(obj.data)) {
                    result = {};
                    obj.data.forEach(function (eachElement) {
                        result[eachElement.cid || index] = eachElement;
                    });
                }

                var members = Firebug.DOMBasePanel.prototype.getMembers(result, 0, null);
                if (members.length)
                    return members;

                return [
                    {
                        name:Locale.$STR("firebug.dom.noChildren2"),
                        type:"string",
                        rowClass:"memberRow-string",
                        tag:Firebug.Rep.tag,
                        noMemberRow:"noMemberRow",
                        prefix:""
                    }
                ];
            },

            getMemberNameTooltip:function (member) {
                return member.title || member.scopeNameTooltip;
            },

            result:function (obj) {
                if (typeof obj === 'function') {
                    return obj();
                }
                return obj;
            },

            augment:function (section) {
                var obj = section.data;
                var data = obj;
                if (typeof obj === 'function') {
                    data = obj();
                }
                return {
                    data:data,
                    section:section
                }
            },

            // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

            onClick:function (event) {
                if (!Events.isLeftClick(event))
                    return;

                var row = Dom.getAncestorByClass(event.target, "memberRow");
                var label = Dom.getAncestorByClass(event.target, "memberLabel");
                var valueCell = row.getElementsByClassName("memberValueCell").item(0);
                var object = Firebug.getRepObject(event.target);
                var target = row.lastChild.firstChild;
                var isString = Css.hasClass(target, "objectBox-string");
                var inValueCell = (event.target === valueCell || event.target === target);
                var table = Dom.getAncestorByClass(row, "domTable");
                var mainPanel = table.mainPanel;

                if (label && Css.hasClass(row, "hasChildren") && !(isString && inValueCell)) {
                    row = label.parentNode.parentNode;
                    this.toggleRow(row);
                    Events.cancelEvent(event);
                } else {
                    if (typeof(object) === "function") {
                        Firebug.chrome.select(object, "script");
                        Events.cancelEvent(event);
                    } else if (Events.isDoubleClick(event)) {
                        var member = row.domObject;
                        var rowValue = member.value;

                        if (typeof rowValue === "boolean")
                            mainPanel.setPropertyValue(row, "" + !rowValue);
                        else
                            mainPanel.editProperty(row);

                        Events.cancelEvent(event);
                    }
                }

                // Let's select this row
                selectRow(row, mainPanel);
            },

            toggleRow:function (row, callback, context) {
                var level = parseInt(row.getAttribute("level"), 10);
                var table = Dom.getAncestorByClass(row, "domTable");
                var target = row.lastChild.firstChild;
                var isString = Css.hasClass(target, "objectBox-string");

                if (Css.hasClass(row, "opened")) {

                    Css.removeClass(row, "opened");

                    if (isString) {
                        var rowValue = row.domObject.value;
                        row.lastChild.firstChild.textContent = '"' + Str.cropMultipleLines(rowValue) + '"';

                        callback && callback.call(context ? context : this, row);

                    } else {
                        var rowTag = this.rowTag;
                        var tbody = row.parentNode;

                        setTimeout(function () {
                            for (var firstRow = row.nextSibling; firstRow; firstRow = row.nextSibling) {
                                if (parseInt(firstRow.getAttribute("level"), 10) <= level)
                                    break;

                                tbody.removeChild(firstRow);
                            }

                            callback && callback.call(context ? context : this, row);

                        }, row.insertTimeout ? row.insertTimeout : 0);
                    }

                } else {
                    Css.setClass(row, "opened");
                    if (isString) {
                        var rowValue = row.domObject.value;
                        row.lastChild.firstChild.textContent = '"' + rowValue + '"';
                        callback && callback.call(context ? context : this, row);
                    } else {
                        var repObj = target.repObject;
                        if (repObj) {
                            if (repObj.attributes) {
                                repObj = repObj.attributes;
                            } else if (repObj.models) {
                                repObj = repObj.models;
                            } else if (repObj.el) {
                                repObj = {
                                    el:repObj.el,
                                    $el:repObj.$el,
                                    tagName:repObj.tagName,
                                    templates:repObj.__templates__
                                };
                            }
                        }

                        var members = Firebug.DOMBasePanel.prototype.getMembers(repObj,
                            level + 1,
                            null);

                        var rowTag = this.rowTag;
                        var lastRow = row;

                        var delay = 0;
                        var setSize = members.length;
                        var rowCount = 1;

                        while (members.length) {
                            let slice = members.splice(0, insertSliceSize);
                            let isLast = !members.length;
                            setTimeout(function () {
                                if (lastRow.parentNode) {
                                    var result = rowTag.insertRows({members:slice}, lastRow);
                                    lastRow = result[1];

                                    Events.dispatch(DOMModule.fbListeners,
                                        "onMemberRowSliceAdded",
                                        [null, result, rowCount, setSize]);

                                    rowCount += insertSliceSize;
                                }

                                if (isLast) {
                                    callback && callback.call(context ? context : this, row);
                                    delete row.insertTimeout;
                                }
                            }, delay);

                            delay += insertInterval;
                        }

                        row.insertTimeout = delay;
                    }
                }
            },

            _getCollapsedClass:function (collapse) {
                return collapse ? "opened" : "";
            },

            _getHideClass:function (hide) {
                return hide ? "hide" : "";
            },

            toggleHeader:function (event) {
                var target = Dom.getAncestorByClass(event.target, "headerRow");
                var table = target.nextSibling,
                    section = target.domObject,
                    panel = target.mainPanel;

                if (Css.hasClass(table, "hide")) {
                    Css.removeClass(table, "hide");
                    Css.removeClass(target, "opened");
                } else {
                    Css.setClass(table, "hide");
                    Css.setClass(target, "opened");
                }
                Events.dispatch(Firebug.currentContext.spa_eyeObj._spaHook.listener.fbListeners,
                    'onToggleHeader',
                    [section, panel]);
            },

            onClickRowHeader:function (event) {
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

        // Highlight row
        // @param row <domObject>
        // @param type <string>
        var highlightRow = function (row, type) {
            // Add class `type` to `row`
            Css.setClass(row, type);

            setTimeout(function () {
                // Add class `fade-in` to `row`
                Css.setClass(row, 'fade-in');

                // Remove `type` class
                Css.removeClass(row, type);

                // Add timeout to get fade effect
                setTimeout(function () {
                    // Remove `fade-in` class
                    Css.removeClass(row, 'fade-in');
                }, 2000);
            }, 1000);
        }

        var _bubbleUpRow = function (row) {
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

        var _dragToTop = function (row) {
            var tbody = row.parentNode,
                level = parseInt(row.getAttribute('level'), 10),
                firstRow = tbody.firstChild;

            if (isNaN(level) || (level !== 0) || (row === firstRow)) return;

            tbody.removeChild(row);
            tbody.insertBefore(row, firstRow);
        }

        var _foldRow = function (row, cb, context, otherArgs) {
            var args = [row];
            otherArgs && args.push.apply(args, otherArgs);
            if (row && Css.hasClass(row, 'opened')) {
                return DirTablePlate.toggleRow(row, function () {
                    cb && cb.apply(this, args);
                }, context ? context : this);
            }
            return cb && cb.apply(context ? context : this, args);
        }

        // Select row
        // @param row <domObject>
        var selectRow = function (row, panel) {
            // Ignore if row is not `level-0` or row is `null`
            if (!row || !Css.hasClass(row, "0level")) {
                return;
            }

            // Find top level parent
            var section = Dom.getAncestorByClass(row, "modelSection");
            if (section && section.parentNode) {
                // Get old selection using `section.parentNode`
                var old = getSelectedRow(section.parentNode);
                if (old) {
                    // Remove old selection in order to get new one
                    Css.removeClass(old, "row-selected")
                }
            }
            // Mark row as selected
            Css.setClass(row, "row-selected");
            Events.dispatch([panel], 'onSelectRow', [row]);
        }

        // Get selected row
        // @param target <domObject>
        var getSelectedRow = function (target) {
            if (!target) return;
            return target.getElementsByClassName("row-selected").item(0);
        }

// ********************************************************************************************* //
// Registration

        return {
            DirTablePlate:DirTablePlate,
            insertSliceSize:insertSliceSize,
            insertInterval:insertInterval,

            highlightRow:highlightRow,
            selectRow:selectRow,
            getSelectedRow:getSelectedRow,
            _bubbleUpRow:_bubbleUpRow,
            _dragToTop:_dragToTop,
            _foldRow:_foldRow
        };

// ********************************************************************************************* //
    });
