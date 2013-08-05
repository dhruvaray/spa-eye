
var path = require("path");
var fs = require("fs");
var os = require("os");
var spawn = require("child_process").spawn;
var exec = require("child_process").exec;

// ********************************************************************************************* //
// Globals

var version = null;

// Compute various target directories.
var extensionDir = "./extension";

var buildDir = "./build";
var nightlyDir = "./nightly";
var releaseDir = "./releases";

// ********************************************************************************************* //

function help () {
    console.log('Usage:');
    console.log('');
    console.log('1. In order to build Firebug xpi run:');
    console.log('       $ node build.js');
    console.log('   The final xpi + update.rdf file will be located in the \'releases\' sub directory.');
    console.log('');
    console.log('2. In order to build Firebug final release run:');
    console.log('       $ node build.js nightly');
    console.log('   Again xpi files will be located in the \'nightly\' directory.');
    console.log('');
}

// ********************************************************************************************* //

function main () {
    if (!version) return;
    var args = process.argv;

    if (args.length < 3) {
        build(releaseDir);
    } else if (args.length >= 4 || args[2] === "help") {
        help();
    } else if (args[2] === "clean") {
        clean();
    } else if (args[2] === "nightly") {
        build(nightlyDir);
    } else {
        help();
    }
}

// ********************************************************************************************* //

/**
 * Build Firebug XPI
 */

function build (destination) {    
    clean();
    prepareBuild();

    // Update install.rdf with updated release version info
    copy(
        path.join(buildDir, "install.rdf"), 
        path.join(buildDir, "install.rdf"), 
        function (data) {
            return data.replace(/@VERSION@/gm, version);
        }
    );

    // Create XPI (zipping is asynchronous)
    var leaf = "spa_eye-" + version + ".xpi";
    var xpiPath = path.join(destination, leaf);
    createFirebugXPI(xpiPath,
        function () {
            copy(
                "update.rdf.tpl.xml",
                path.join(destination, "update.rdf"),
                function (data) {
                    var result = data.replace(/@VERSION@/gm, version);
                    result = result.replace(/@LEAF@/gm, leaf);
                    return result;
                }
            );
            console.log("spa-eye version: " + version + " in "+ destination);
        }
    );
}

// ********************************************************************************************* //
// Create final xpi package

function createFirebugXPI (filename, callback) {
    // Create final XPI package.    
    var zip = null;
    rm(filename);
    if (os.platform() === "win32") {
        var params = "a -tzip " + filename + " " + buildDir + "/*";
        zip = spawn("7z.exe", params.split(" "), { cwd: "." });
    } else {
        //zip = spawn("zip", ["-r", filename, buildDir + "/*"], {cwd: "."});
        zip = exec("zip -r ../" + filename + " * ", { cwd: buildDir }, function (err, stdout, stderr) {
            if (err) {
                console.log(err);
            }
        });
    }

    if (zip) {
        zip.on("exit", function () {
            callback();
        });
    } else {
        callback();
    }
}

// ********************************************************************************************* //

function clean () {
    rmdir(buildDir);
}

function prepareBuild () {
    mkdir(buildDir);
    mkdir(releaseDir);
    mkdir(nightlyDir);

    copyDir(extensionDir, buildDir);
    copy("install.rdf.tpl.xml", path.join(buildDir, "install.rdf"));
}

// ********************************************************************************************* //
// Utils
// ********************************************************************************************* //

function getGitRevision (callback) {
    exec("git describe --tags --always HEAD", function (err, stdout, stderr) {
        if (err) {
            throw err;
        }
        callback(stdout.trim());
    });
}

function rm (path) {
    try {
        fs.unlinkSync(path);
    } catch (e) {}
}

function mkdir (dir) {
    try {
        fs.mkdirSync(dir, 0755);
    } catch (e) {
        if (e.code != "EEXIST") {
            throw e;
        }
    }
}

function rmdir (dir) {
    try {
        fs.rmdirSync(dir);
    } catch (e) {}
}

function copyDir (src, dest) {
    mkdir(dest);
    var files = fs.readdirSync(src);
    for(var i = 0; i < files.length; i++) {
        var f = files[i],
            sPath = path.join(src, f),
            dPath = path.join(dest, f),
            current = fs.lstatSync(sPath);

        if(current.isDirectory()) {
            copyDir(sPath, dPath);
        } else {
            copy(sPath, dPath);
        }
    }
}

function copy (src, dest, filter) {
    var data = fs.readFileSync(src, 'utf-8');
    filter && (data = filter(data));
    fs.writeFileSync(dest, data);
}

// ********************************************************************************************* //
// Startup

getGitRevision(function (v) {
    version = v;
    main();
});

// ********************************************************************************************* //
