/* See license.txt for terms of usage */
define([
],
    function () {

        var Date = {};

        _zeroFill = function (n, p, c) {
            var pad_char = typeof c !== 'undefined' ? c : '0';
            var pad = new Array(1 + p).join(pad_char);
            return (pad + n).slice(-pad.length);
        },

            Date.getFormattedTime = function (d) {
                return _zeroFill(d.getMonth() + 1, 2) + "/"
                    + _zeroFill(d.getDate(), 2) + "/"
                    + (1900 + d.getYear()) + " "
                    + _zeroFill(d.getHours(), 2) + ":"
                    + _zeroFill(d.getMinutes(), 2) + ":"
                    + _zeroFill(d.getSeconds(), 2) + ":"
                    + _zeroFill(d.getMilliseconds(), 4);
            }
        return Date;
    });
