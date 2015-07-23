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
      if (Array.isArray(arr))
      {
        let blankArray: T[] = [];
        blankArray = blankArray.concat.apply(blankArray, arr);
        return blankArray.length == 1 ? blankArray[0] : blankArray;
      }
      else return arr;
    }

    Fixed<T>(...args: Ranting<T>[]): RantExpression<T> {
      let argsCopy: Ranting<T>[] = [];
      args = argsCopy.concat.apply(argsCopy, args);
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
      let argsCopy: Ranting<T>[] = [];
      args = argsCopy.concat.apply(argsCopy, args);
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
        let argsCopy: Ranting<T>[] = [];
        argsCopy = argsCopy.concat.apply(argsCopy, args);
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

        let returnVal = [];
        returnVal = returnVal.concat.apply(returnVal, retArray);

        return this.compressArray(returnVal);
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
