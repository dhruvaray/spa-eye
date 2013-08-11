define([
    "firebug/lib/lib",
    "firebug/lib/object",
    "firebug/lib/events",
    "firebug/lib/dom",
    "firebug/lib/css",

    "spa_eye/dom/modelReps"
],
    function (FBL, Obj, Events, Dom, Css, ModelReps) {
        // Panel keys
        var KeyPanel = {
            keyListeners:null,
            smallJump:10,

            // Initialize key listeners
            attachKeyListeners:function () {
                var chrome = Firebug.chrome;
                this.keyListeners = this.keyListeners || [];

                // navigation key handlers
                this.keyListeners.push(
                    chrome.keyCodeListen("UP", null, Obj.bindFixed(this._navKeyHandler, this, -1)),
                    chrome.keyCodeListen("DOWN", null, Obj.bindFixed(this._navKeyHandler, this, 1)),
                    chrome.keyCodeListen("PAGE_UP", null, Obj.bindFixed(this._navKeyHandler, this, -this.smallJump)),
                    chrome.keyCodeListen("PAGE_DOWN", null, Obj.bindFixed(this._navKeyHandler, this, this.smallJump))
                );

                // expand-collapse key handlers
                /*this.keyListeners.push(
                    chrome.keyCodeListen("RIGHT", null, Obj.bindFixed(this._expandKeyHandler, this, false)),
                    chrome.keyCodeListen("LEFT", null, Obj.bindFixed(this._expandKeyHandler, this, true))
                );*/

                this.keyListeners.push(
                    chrome.keyCodeListen("RETURN", null, Obj.bindFixed(this._enterKeyHandler, this))
                );
            },

            // Detach key listeners
            detachKeyListeners:function () {
                if (!this.keyListeners)
                    return;

                var chrome = Firebug.chrome;
                if (chrome) {
                    for (var i = 0; i < this.keyListeners.length; i++) {
                        chrome.keyIgnore(this.keyListeners[i]);
                    }
                }
            },

            getPanelNode:function () {
                var context = Firebug.currentContext,
                    cp = context.currentPanel;

                return cp && cp.panelNode;
            },

            getSelectedRow:function () {
                return ModelReps.getSelectedRow(this.getPanelNode());
            },

            _expandKeyHandler:function (collapse) {
                var selectedRow = this.getSelectedRow();
                if (!selectedRow) return;

                var flag = Css.hasClass(selectedRow, 'opened') ^ collapse;
                if (!flag) {
                    ModelReps.DirTablePlate.toggleRow(selectedRow);
                }
            },

            _enterKeyHandler:function () {
                var selectedRow = this.getSelectedRow();
                if (!selectedRow) return;
                ModelReps.DirTablePlate.toggleRow(selectedRow);
            },

            _navKeyHandler:function (jump) {
                var selectedRow = this.getSelectedRow(),
                    panelNode = this.getPanelNode();
                if (!panelNode) return;

                if (!selectedRow) {
                    var firstRow = panelNode.getElementsByClassName("0level").item(0);
                    return ModelReps.selectRow(firstRow, panelNode);
                }

                var n = Math.abs(jump),
                    method = jump > 0 ? 'nextSibling' : 'previousSibling',
                    prev = null,
                    nr = null;

                while (n > 0) {
                    nr = selectedRow[method];

                    // If `nr` is undefined, select previously visited `prev`
                    if (!nr || !Css.hasClass(nr, "memberRow")) {
                        prev && ModelReps.selectRow(prev, panelNode);
                        break;
                    }

                    if (parseInt(nr.getAttribute("level"), 10) === 0) {
                        n--;
                        if (n === 0) {
                            ModelReps.selectRow(nr, panelNode);
                            break;
                        }
                        prev = nr;
                    }
                    selectedRow = nr;
                }
            }
        }

        return KeyPanel;
    });
