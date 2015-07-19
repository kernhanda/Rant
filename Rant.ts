/// <reference path="typings/qunit/qunit.d.ts"/>
/// <reference path="typings/node/node.d.ts"/>
/// <reference path="typings/seedrandom/seedrandom.d.ts"/>

import seedrandom = require("seedrandom");
module Rant {
  interface RantExpression<T> {
      (seed?: number | string): T | T[];
  }

  interface Expression<T> {
    (): T | T[];
  }

  export type Ranting<T> = T | T[] | Expression<T> | RantExpression<T>;

  function isFunction(func) {
    return func && typeof func === "function";
  }

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

    Fixed<T>(...args: Ranting<T>[]): RantExpression<T> {
      let argsCopy: Ranting<T>[] = [];
      args = argsCopy.concat.apply(argsCopy, args);
      return (seed?: number | string): T | T[] => {
        this.pushSeed(seed);

        argsCopy = [];
        for (let i = 0; i < args.length; i++) {
          let arg = args[i];
          if (isFunction(arg)) {
            arg = (<RantExpression<T>>arg)();
          }
          if (Array.isArray(arg)) {
            argsCopy = argsCopy.concat(arg);
          } else {
            argsCopy.push(<T>arg);
          }
        }

        this.popSeed(seed);

        if (argsCopy.length == 1) {
          return <T>argsCopy[0];
        } else {
          return <T[]>argsCopy;
        }
      }
    }

    Pick<T>(...args : Ranting<T>[]) : RantExpression<T> {
      let argsCopy: Ranting<T>[] = [];
      args = argsCopy.concat.apply(argsCopy, args);
      return (seed?: number | string): T | T[] => {
        this.pushSeed(seed);
        let val:Ranting<T> = args[Math.floor(this.currentRng.quick() * args.length)];
        if (isFunction(val)) {
          val = <T|T[]>((<RantExpression<T>>val)());
        }
        this.popSeed(seed);

        return <T|T[]>val;
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

          if (isFunction(val)) {
            val = (<RantExpression<T>>val)();
          }

          this.popSeed(seed);

          return <T|T[]>val;
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
        let returnVal:Ranting<T> = null;
        for (let i = 0; i < weights.length; ++i) {
          if (prob < weights[i]) {
            returnVal = values[i];
            break;
          }
        }

        if (isFunction(returnVal)) {
          returnVal = (<RantExpression<T>>returnVal)();
        }

        this.popSeed(seed);
        return <T|T[]>returnVal;
      }
    }

  }
}
let rant = new Rant.RantEngine();
export let Fixed = Rant.RantEngine.prototype.Fixed.bind(rant);
export let Pick = Rant.RantEngine.prototype.Pick.bind(rant);
export let Shuffle = Rant.RantEngine.prototype.Shuffle.bind(rant);
export let Weighted = Rant.RantEngine.prototype.Weighted.bind(rant);
