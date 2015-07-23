/// <reference path="typings/qunit/qunit.d.ts"/>
/// <reference path="typings/node/node.d.ts"/>
/// <reference path="typings/seedrandom/seedrandom.d.ts"/>
var seedrandom = require("seedrandom");
"use strict";
var Rant;
(function (Rant) {
    var RantEngine = (function () {
        function RantEngine(seed) {
            var _this = this;
            this.seed = seed;
            this.rngStack = [];
            this.evaluate = function (rant) {
                return (rant && typeof rant === "function") ? _this.evaluate(rant()) : rant;
            };
            this.compressArray = function (arr) {
                if (Array.isArray(arr)) {
                    var blankArray = [];
                    blankArray = blankArray.concat.apply(blankArray, arr);
                    return blankArray.length == 1 ? blankArray[0] : blankArray;
                }
                else
                    return arr;
            };
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
                var returnVal = [];
                for (var i = 0; i < args.length; i++) {
                    var arg = _this.evaluate(args[i]);
                    if (Array.isArray(arg)) {
                        returnVal = returnVal.concat(arg);
                    }
                    else {
                        returnVal.push(arg);
                    }
                }
                _this.popSeed(seed);
                return _this.compressArray(returnVal);
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
                return _this.compressArray(returnVal);
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
                return _this.compressArray(returnVal);
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
                return _this.compressArray(returnVal);
            };
        };
        RantEngine.prototype.Repeat = function (n, rant) {
            var _this = this;
            return function (seed) {
                var retArray = new Array;
                var num = _this.evaluate(n);
                for (var i = 0; i < n; ++i) {
                    retArray.push(_this.evaluate(rant));
                }
                var returnVal = [];
                returnVal = returnVal.concat.apply(returnVal, retArray);
                return _this.compressArray(returnVal);
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
exports.Repeat = Rant.RantEngine.prototype.Repeat.bind(rant);
