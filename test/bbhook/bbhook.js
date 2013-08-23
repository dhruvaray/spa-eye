function createModel(win) {
    FBTest.ok(true, "Backbone Model Created.");
    var config = {tagName: "div", classes: "logRow logRow-log"};
    FBTest.waitForDisplayedElement("console", config, function(row) {
        FBTest.ok(/cid:c(\d+)/.test(row.textContent), "The model cid must be displayed.");
        FBTest.testDone("BBHook.DONE");
    });
    FBTest.click(win.document.getElementById("createModelButton"));
}

function runTest() {
    FBTest.sysout("BBHook");
    FBTest.openNewTab(basePath + "bbpage.html", function(win) {
        FBTest.openFirebug();
        FBTest.enableAllPanels();
        FBTest.reload(createModel);
    });
}
