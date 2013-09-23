function runTest() {
    FBTest.sysout("Backbone present in any closure context");
    FBTest.openFirebug();
    FBTest.enableAllPanels();

    FBTest.openNewTab(basePath + "anywhere_bb/anywhere_bb.html", function(win) {
        var node = FBTest.selectPanel("spa_eye").panelNode;
        var config = {tagName: "tr", classes: "memberRow 0level c1"};

        FBTest.waitForDisplayedElement("spa_eye", config, function(row) {
            FBTest.ok(row.domObject.value.cid === "c1", "Found the model");
            FBTest.testDone("Backbone found in any closure context");
        });

    });
}
