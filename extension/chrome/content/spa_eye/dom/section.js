/* See license.txt for terms of usage */
/*jshint esnext:true, es5:true, curly:false */
/*global FBTrace:true, XPCNativeWrapper:true, Window:true, define:true */

define([
    "firebug/lib/dom"
],
    function (Dom) {

        "use strict";
        var ChildSection = function ChildSection(option) {
            for (var key in option) {
                this[key] = option[key];
            }
        };

        ChildSection.prototype = {
            constructor:ChildSection,

            name:'',
            title:'',
            parent:null,

            order:0,

            // Element class
            container:null,
            body:null,

            // data - array of object(or function which returns array)
            data:function () {
                return [];
            },

            // Other default property for its data
            autoAdd:true,
            highlight:true,
            bubble:true,

            // Utils
            getBody:function () {
                if (this.body && this.parent) {
                    return Dom.getElementByClass(this.parent, this.body);
                }
                return null;
            },

            getContainer:function () {
                if (this.container && this.parent) {
                    return Dom.getElementByClass(this.parent, this.container);
                }
                return null;
            }
        };

        return ChildSection;

    });


