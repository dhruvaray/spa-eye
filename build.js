// ********************************************************************************************* //

var http = require("http"),
    path = require("path"),
    fs = require("fs");
    url = require("url"),
    os = require("os"),
    exec = require("child_process").exec;

// ********************************************************************************************* //
// Globals

var version = null,
    port = 8888,
    testUrl = "http://localhost:@PORT@/test/spa_eye.html";

// Compute various target directories.
var currentDir = ".",
    extensionDir = "./extension",
    testDir = "./test";

var buildDir = "./build",
    nightlyDir = "./nightly",
    releaseDir = "./releases";

// ********************************************************************************************* //

function help () {
    console.log('Usage:');
    console.log('');
    console.log('1. In order to build `spa_eye` xpi run:');
    console.log('');
    console.log('       $ node build.js');
    console.log('');
    console.log('   The final xpi + update.rdf file will be located in the \'releases\' sub directory.');
    console.log('');
    console.log('2. In order to build `spa_eye` final release run:');
    console.log('');
    console.log('       $ node build.js nightly');
    console.log('');
    console.log('   Again xpi files will be located in the \'nightly\' directory.');
    console.log('');
    console.log('3. Run testcase for `spa_eye`:');
    console.log('');
    console.log('       $ node build.js test <PROFILE> <PORT>');
    console.log('');
    console.log('   <PORT> is the port for local server. Default port is `8888`');
    console.log('   <PROFILE> ist the firefox profile name to run testcases. Default profile name is `dev`');
    console.log('');
    console.log('4. Start simple server to run test cases manually');
    console.log('');
    console.log('       $ node build.js server <PORT>');
    console.log('');
    console.log('   <PORT> is the port for local server. Default port is `8888`');
    console.log('');
}

// ********************************************************************************************* //

function main () {
    if (!version) return;
    var args = process.argv;

    if (args.length < 3) {
        build(releaseDir);
    } else if (args[2] === "help") {
        help();
    } else if (args[2] === "clean") {
        clean();
    } else if (args[2] === "nightly") {
        build(nightlyDir);
    } else if (args[2] === "test") {
        var profile = args[3] || 'dev';

        // Setting global values
        port = parseInt(args[4] || port, 10);
        testUrl = testUrl.replace(/@PORT@/g, port);

        // Run test case
        runTest(profile);

    } else if (args[2] === "server") {
        // Setting global values
        port = parseInt(args[3] || port, 10);

        // Start server
        startServer();

    } else {
        help();
    }
}

// ********************************************************************************************* //

/**
 * Build Firebug XPI
 */

function build (destination) {
    console.log("Version: " + version);
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

    console.log("XPI Filename: " + leaf);
    console.log("XPI Filepath: " + xpiPath);

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
            clean();
            console.log("spa-eye version: " + version + " in "+ destination);
        }
    );
}

// ********************************************************************************************* //
// Create final xpi package


function showError(err, stdout, stderr) {
    err && console.log(err);
}

function createFirebugXPI (filename, callback) {
    // Create final XPI package.
    var zip = null;
    rm(filename);
    if (os.platform() === "win32") {
        zip = exec("7z.exe a -tzip " + filename + " " + buildDir + "/* ", showError);
    } else {
        zip = exec("zip -r ../" + filename + " * ", { cwd: buildDir }, showError);
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
    rmDir(buildDir);
}

function prepareBuild () {
    mkdir(buildDir);
    mkdir(releaseDir);
    mkdir(nightlyDir);

    copyDir(extensionDir, buildDir);
    copy("install.rdf.tpl.xml", path.join(buildDir, "install.rdf"));
}

// ********************************************************************************************* //
// Test case
// ********************************************************************************************* //

function runTest (profile, callback) {
    var command = "firefox -P " + profile + " -runFBTests --no-remote " + testUrl;
    var testInstance = exec(command, showError);
    if (testInstance) {
        testInstance.on("exit", function(){
            callback && callback();
        });
    } else {
        callback && callback();
    }
}

// ********************************************************************************************* //
// Simple HTTP Server
// ********************************************************************************************* //

function startServer () {
    http.createServer(function(request, response) {
        var uri = url.parse(request.url).pathname,
            filename = path.join(process.cwd(), uri);

        var contentTypesByExtension = {
            '.html': "text/html",
            '.css':  "text/css",
            '.js':   "text/javascript"
        };

        fs.exists(filename, function(exists) {
            if(!exists) {
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.write("404 Not Found\n");
                response.end();
                return;
            }

            if (fs.statSync(filename).isDirectory()) filename += '/index.html';

            fs.readFile(filename, "utf8", function(err, file) {
                if(err) {
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    response.write(err + "\n");
                    response.end();
                    return;
                }

                var headers = {},
                    contentType = contentTypesByExtension[path.extname(filename)];

                if (contentType) headers["Content-Type"] = contentType;
                response.writeHead(200, headers);
                response.write(file, "utf8");
                response.end();
            });
        });
    }).listen(port);

    console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
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
    } catch (e) {
        if (e.code != "ENOENT") {
            throw e;
        }
    }
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

function rmDir (dir) {
    var files = [];
    try {
        files = fs.readdirSync(dir);
    } catch (e) {
        if (e.code != "ENOENT") {
            throw e;
        }
        return;
    }
    if (files.length > 0) {
        for (var i = 0; i < files.length; i++) {
            var filePath = path.join(dir, files[i]);
            if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            } else {
                rmDir(filePath);
            }
        }
    }
    fs.rmdirSync(dir);
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
