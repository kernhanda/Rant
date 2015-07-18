/// <reference path="typings/qunit/qunit.d.ts"/>
/// <reference path="typings/node/node.d.ts"/>
/// <reference path="typings/seedrandom/seedrandom.d.ts"/>
var seedrandom = require("seedrandom");
var Rant;
(function (Rant) {
    function isFunction(func) {
        return func && typeof func === "function";
    }
    var RantEngine = (function () {
        function RantEngine(seed) {
            this.seed = seed;
            this.rngStack = [];
            this.currentRng = typeof seed !== 'undefined' ? seedrandom(seed + '') : seedrandom();
        }
        RantEngine.prototype.pushSeed = function (seed) {
            if (typeof seed !== 'undefined') {
                this.rngStack.push(this.currentRng);
                this.currentRng = seedrandom(seed + '');
            }
        };
        RantEngine.prototype.popSeed = function (seed) {
            if (typeof seed !== 'undefined') {
                this.currentRng = this.rngStack.pop();
            }
        };
        RantEngine.prototype.Fixed = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var argsCopy = [];
            args = argsCopy.concat.apply(argsCopy, args);
            return function (seed) {
                _this.pushSeed(seed);
                argsCopy = [];
                for (var i = 0; i < args.length; i++) {
                    var arg = args[i];
                    if (isFunction(arg)) {
                        arg = arg();
                    }
                    if (Array.isArray(arg)) {
                        argsCopy = argsCopy.concat(arg);
                    }
                    else {
                        argsCopy.push(arg);
                    }
                }
                _this.popSeed(seed);
                if (argsCopy.length == 1) {
                    return argsCopy[0];
                }
                else {
                    return argsCopy;
                }
            };
        };
        RantEngine.prototype.Pick = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var argsCopy = [];
            args = argsCopy.concat.apply(argsCopy, args);
            return function (seed) {
                _this.pushSeed(seed);
                var val = args[Math.floor(_this.currentRng.quick() * args.length)];
                if (isFunction(val)) {
                    val = (val());
                }
                _this.popSeed(seed);
                return val;
            };
        };
        RantEngine.prototype.Shuffle = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var numPicked = 0;
            var argsCopy = [];
            argsCopy = argsCopy.concat.apply(argsCopy, args);
            return function (seed) {
                _this.pushSeed(seed);
                var interestedLength = argsCopy.length - numPicked;
                if (interestedLength <= 0) {
                    numPicked = 0;
                    interestedLength = argsCopy.length;
                }
                var pickedIndex = Math.floor(_this.currentRng.quick() * interestedLength);
                ++numPicked;
                var val = argsCopy[pickedIndex];
                argsCopy[pickedIndex] = argsCopy[interestedLength - 1];
                argsCopy[interestedLength - 1] = val;
                if (isFunction(val)) {
                    val = val();
                }
                _this.popSeed(seed);
                return val;
            };
        };
        return RantEngine;
    })();
    Rant.RantEngine = RantEngine;
})(Rant || (Rant = {}));
var rant = new Rant.RantEngine();
exports.Fixed = Rant.RantEngine.prototype.Fixed.bind(rant);
exports.Pick = Rant.RantEngine.prototype.Pick.bind(rant);
exports.Shuffle = Rant.RantEngine.prototype.Shuffle.bind(rant);
