define([
        "firebug/lib/trace",
    ], function (FBTrace) {

    var context = {
        exports: {}
    };
    try{
        Services.scriptloader.loadSubScript("chrome://spa_eye/content/lib/ext/underscore.js", context);
    } catch(e) {
        FBTrace.sysout("Error", e);
    }

    var _ = context.exports._;

    // Monkey patching template method
    var noMatch = /(.)^/;
    var escapes = {
        "'":      "'",
        '\\':     '\\',
        '\r':     'r',
        '\n':     'n',
        '\t':     't',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };
    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
    _.template = function (text, data, settings) {
        var render;
        settings = _.defaults({}, settings, _.templateSettings);

        // Combine delimiters into one regular expression via alternation.
        var matcher = new RegExp([
            (settings.escape || noMatch).source,
            (settings.interpolate || noMatch).source,
            (settings.evaluate || noMatch).source
        ].join('|') + '|$', 'g');

        // Compile the template source, escaping string literals appropriately.
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {

            /*Changes to make the debugger output attractive*/
            var comment = "\n\n/*" + text.slice(index, offset + match.length) + "*/\n\n";
            source = index ? (source + comment + "__p+='") : (comment + source);
            /*End debugger output changes*/

            source += text.slice(index, offset)
                .replace(escaper, function (match) {
                    return '\\' + escapes[match];
                });

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))\n";
            }
            if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)\n";
            }
            if (evaluate) {
                source += "';\n" + evaluate + "\n";
            }
            index = offset + match.length;
            return match;
        });
        source += "';\n";

        // If a variable is not specified, place data values in local scope.
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + "return __p;\n";

        try {
            render = new Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        if (data) return render(data, _);
        var template = function (data) {
            return render.call(this, data, _);
        };

        // Provide the compiled function source as a convenience for precompilation.
        template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

        return template;
    };
    return _;
});
