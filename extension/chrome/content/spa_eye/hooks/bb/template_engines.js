(function backbone_eye(root) {

    if ((typeof root.Backbone !== 'undefined') && (typeof root._ !== 'undefined')) {

        var debuggable = {};

        var getMatchingNode = function (tag, tagbody) {
            var elements = root.document.getElementsByTagName(tag);

            for (var i = 0; i < elements.length; i++) {
                var val = elements[i].textContent;
                if (val == tagbody) {
                    return elements[i];
                }
            }
            return undefined;
        };

        debuggable["_"] = function (id, oldval, newval) {
            var wrapper = function (text, data, settings) {
                _.extend(newval, wrapper);
                if (text) {
                    var script = getMatchingNode("script", text)
                    var script_id = (script && script.id) ? script.id : _.uniqueId("template_");
                    var proxiedTemplateRef = '_t' + script_id;
                    var compiledTemplate = root[proxiedTemplateRef];
                    if (!compiledTemplate) {
                        root.dispatchEvent(new CustomEvent('Backbone_Eye:TEMPLATE:ADD', {
                            'detail':{
                                script_id:script_id,
                                text:text,
                                settings:_.defaults({}, settings, _.templateSettings)
                            }
                        }));
                        compiledTemplate = newval.call(_, text, undefined, settings);
                    }
                    if (data) {//Data
                        root.dispatchEvent(
                            new CustomEvent('Backbone_Eye:TEMPLATE:INFER', {'detail':{script_id:script_id}}));
                        return compiledTemplate.call(_, data)
                    }
                    return function (tdata) {
                        root.dispatchEvent(
                            new CustomEvent('Backbone_Eye:TEMPLATE:INFER', {'detail':{script_id:script_id}}));

                        return root[proxiedTemplateRef] ?
                            root[proxiedTemplateRef].call(_, tdata) :
                            compiledTemplate.call(_, tdata);
                    }
                } else {
                    root.dispatchEvent(new CustomEvent('Backbone_Eye:ERROR',
                        {'detail':{error:"Template Text is empty"}}));
                    return newval.apply(_, arguments);
                }
            }
            return wrapper;
        };

        /*debuggable["HandleBars"] = function (id, oldval, newval) {

         var wrapper = function (text) {
         _.extend(newval, wrapper);
         if (text) {
         var script = getMatchingNode("script", text)
         var script_id = (script && script.id) ? script.id : _.uniqueId("template_");
         var proxiedTemplateRef = '_t' + script_id;
         var compiledTemplate = root[proxiedTemplateRef];
         if (!compiledTemplate) {
         root.dispatchEvent(new CustomEvent('Backbone_Eye:TEMPLATE:ADD', {
         'detail':{
         script_id:script_id,
         text:text,
         settings:{}
         }
         }));
         compiledTemplate = newval.call(text);
         }
         return function (context) {
         root.dispatchEvent(
         new CustomEvent('Backbone_Eye:TEMPLATE:INFER', {'detail':{script_id:script_id}}));

         return root[proxiedTemplateRef] ?
         root[proxiedTemplateRef].call(context) :
         compiledTemplate.call(context);
         }
         } else {
         root.dispatchEvent(new CustomEvent('Backbone_Eye:ERROR',
         {'detail':{error:"Template Text is empty"}}));
         return newval.call(text);
         }
         }
         return wrapper;
         };*/

        var engines = [
            {id:"_", template:"template", womb:debuggable["_"]}
        ];
        //{id:"HandleBars", template:"compile", womb:debuggable["HandleBars"]}];

        var _ = root._;

        _.each(engines, function (engine) {
            if (root[engine.id]) {
                engine.ref = root[engine.id];
                engine.ref.watch(engine.template, engine.womb);
                engine.ref[engine.template] = engine.ref[engine.template];
            }
        });


    }
})(window);

