/// <reference path="typings/seedrandom/seedrandom.d.ts"/>

import seedrandom = require("seedrandom");
"use strict";
module Rant {
  export interface RantExpression<T> {
      (seed?: number | string): T | T[];
  }

  interface Expression<T> {
    (): T | T[];
  }

  let isArray = Array.isArray || function(obj: any) {
    return (obj + '') === '[object Array]';
  };

  function isArguments(obj: any) {
    return (obj + '') === '[object Arguments]';
  }

  function property(key: string) {
    return function(obj: any) {
      return obj == null ? void 0 : obj[key];
    }
  }

  const MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  let getLength = property('length');
  function isArrayLike(coll: any) {
    let length = getLength(coll);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  }

  // flatten and supporting functions are based on underscore's implementation.
  // http://underscorejs.org/docs/underscore.html
  function flatten(input: any): any[] {
    let output = [];
    let idx = 0;
    for (let i = 0, length = getLength(input); i < length; i++) {
      let value = input[i];
      if (isArrayLike(value) && (isArray(value) || isArguments(value))) {
        value = flatten(value);
        let j = 0;
        let len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else {
        output[idx++] = value;
      }
    }
    return output;
  }

  export type Ranting<T> = T | T[] | Expression<T> | RantExpression<T>;

  export class RantEngine {
    private currentRng: prng;
    private rngStack: prng[] = [];
    constructor(private seed?: number | string) {
      this.currentRng = typeof seed !== 'undefined' ? seedrandom(seed + '') : seedrandom();
    }

    private pushSeed(seed?: number | string) {
      if (typeof seed !== 'undefined') {
        this.rngStack.push(this.currentRng);
        this.currentRng = seedrandom(seed + '');
      }
    }

    private popSeed(seed?: number | string) {
      if (typeof seed !== 'undefined') {
        this.currentRng = this.rngStack.pop();
      }
    }

    private evaluate = <T>(rant: Ranting<T>): T | T[] => {
      return (rant && typeof rant === "function") ? this.evaluate((<Expression<T>>rant)()) : <T|T[]>rant;
    }

    private compressArray = <T>(arr: T | Array<T> | Array<Array<T>>): T | T[] => {
      arr = flatten(arr);
      return (<T[]>(arr)).length == 1 ? arr[0] : arr;
    }

    Fixed<T>(...args: Ranting<T>[]): RantExpression<T> {
      let argsCopy = <Ranting<T>[]>(flatten(args));
      return (seed?: number | string): T | T[] => {
        this.pushSeed(seed);

        let returnVal = [];
        for (let i = 0; i < args.length; i++) {
          let arg = this.evaluate(args[i]);

          if (Array.isArray(arg)) {
            returnVal = returnVal.concat(arg);
          } else {
            returnVal.push(<T>arg);
          }
        }

        this.popSeed(seed);

        return this.compressArray(returnVal);
      }
    }

    Pick<T>(...args : Ranting<T>[]) : RantExpression<T> {
      let argsCopy = <Ranting<T>[]>(flatten(args));
      return (seed?: number | string): T | T[] => {
        this.pushSeed(seed);
        let val:Ranting<T> = args[Math.floor(this.currentRng.quick() * args.length)];
        let returnVal = this.evaluate(val);
        this.popSeed(seed);

        return this.compressArray(returnVal);
      }
    }

    Shuffle<T>(...args : Ranting<T>[]) : RantExpression<T> {
        let numPicked = 0;
        let argsCopy = <Ranting<T>[]>(flatten(args));
        return (seed?: number | string): T | T[] => {
          this.pushSeed(seed);

          let interestedLength = argsCopy.length - numPicked;
          if (interestedLength <= 0) {
            numPicked = 0;
            interestedLength = argsCopy.length;
          }

          let pickedIndex = Math.floor(this.currentRng.quick() * interestedLength);
          ++numPicked;

          let val:Ranting<T> = argsCopy[pickedIndex];
          argsCopy[pickedIndex] = argsCopy[interestedLength - 1];
          argsCopy[interestedLength - 1] = val;

          let returnVal = this.evaluate(val);

          this.popSeed(seed);

          return this.compressArray(returnVal);
        }
    }

    Weighted<T>(...args: any[]) : RantExpression<T> {
      let weights: number[] = [];
      let values: Ranting<T>[] = [];
      let totalWeight = 0;
      for (let i = 0; i < args.length / 2; ++i) {
        weights.push(totalWeight += args[2 * i]);
        values.push(args[2 * i + 1]);
      }

      return (seed?: number | string): T | T[] => {
        this.pushSeed(seed);
        let prob = Math.floor(this.currentRng.quick() * totalWeight);
        let val:Ranting<T> = null;
        for (let i = 0; i < weights.length; ++i) {
          if (prob < weights[i]) {
            val = values[i];
            break;
          }
        }

        let returnVal = this.evaluate(val);

        this.popSeed(seed);

        return this.compressArray(returnVal);
      }
    }

    Repeat<T>(n: Ranting<number>, rant: Ranting<T>): RantExpression<T> {
      return (seed?: number | string): T | T[] => {
        let retArray = new Array;
        let num = this.evaluate(n);
        for (let i = 0; i < n; ++i) {
          retArray.push(this.evaluate(rant));
        }

        return this.compressArray(retArray);
      }
    }

  }
}
let rant = new Rant.RantEngine();
export let Fixed: <T>(...args: Rant.Ranting<T>[]) => Rant.RantExpression<T> = Rant.RantEngine.prototype.Fixed.bind(rant);
export let Pick: <T>(...args : Rant.Ranting<T>[]) => Rant.RantExpression<T> = Rant.RantEngine.prototype.Pick.bind(rant);
export let Shuffle: <T>(...args : Rant.Ranting<T>[]) => Rant.RantExpression<T> = Rant.RantEngine.prototype.Shuffle.bind(rant);
export let Weighted: <T>(...args: any[]) => Rant.RantExpression<T> = Rant.RantEngine.prototype.Weighted.bind(rant);
export let Repeat: <T>(n: Rant.Ranting<number>, rant: Rant.Ranting<T>) => Rant.RantExpression<T> = Rant.RantEngine.prototype.Repeat.bind(rant);
