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
        RantEngine.prototype.evaluate = function (rant) {
            return isFunction(rant) ? arguments.callee(rant) : rant;
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
                    var arg = _this.evaluate(args[i]);
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
                var returnVal = _this.evaluate(val);
                _this.popSeed(seed);
                return returnVal;
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
                var returnVal = _this.evaluate(val);
                _this.popSeed(seed);
                return returnVal;
            };
        };
        RantEngine.prototype.Weighted = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var weights = [];
            var values = [];
            var totalWeight = 0;
            for (var i = 0; i < args.length / 2; ++i) {
                weights.push(totalWeight += args[2 * i]);
                values.push(args[2 * i + 1]);
            }
            return function (seed) {
                _this.pushSeed(seed);
                var prob = Math.floor(_this.currentRng.quick() * totalWeight);
                var val = null;
                for (var i = 0; i < weights.length; ++i) {
                    if (prob < weights[i]) {
                        val = values[i];
                        break;
                    }
                }
                var returnVal = _this.evaluate(val);
                _this.popSeed(seed);
                return returnVal;
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
exports.Weighted = Rant.RantEngine.prototype.Weighted.bind(rant);
