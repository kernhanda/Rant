/// <reference path="typings/qunit/qunit.d.ts"/>
/// <reference path="typings/node/node.d.ts"/>
/// <reference path="typings/seedrandom/seedrandom.d.ts"/>

import seedrandom = require("seedrandom");
module Rant {
interface RantExpression<T> {
    (seed?: number | string): T | T[];
}

export type Ranting<T> = T | T[] | RantExpression<T>;

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
    let argsCopy: T[] = [];
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
        return argsCopy[0];
      } else {
        return argsCopy;
      }
    }
  }

  Pick<T>(...args : Ranting<T>[]) : RantExpression<T> {
    let argsCopy: T[] = [];
    args = argsCopy.concat.apply(argsCopy, args);
    return (seed?: number | string): T | T[] => {
      this.pushSeed(seed);
      let val:T|T[]|RantExpression<T> = args[Math.floor(this.currentRng.quick() * args.length)];
      if (isFunction(val)) {
        val = <T|T[]>((<RantExpression<T>>val)());
      }
      this.popSeed(seed);

      return <T|T[]>val;
    }
  }

  Shuffle<T>(...args : Ranting<T>[]) : RantExpression<T> {
      let numPicked = 0;
      let argsCopy: T[] | T[][] | RantExpression<T>[] = [];
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

        let val:T|T[]|RantExpression<T> = argsCopy[pickedIndex];
        argsCopy[pickedIndex] = argsCopy[interestedLength - 1];
        argsCopy[interestedLength - 1] = val;

        if (isFunction(val)) {
          val = (<RantExpression<T>>val)();
        }

        this.popSeed(seed);

        return <T|T[]>val;
      }
  }
}
}
let rant = new Rant.RantEngine();
export let Fixed = Rant.RantEngine.prototype.Fixed.bind(rant);
export let Pick = Rant.RantEngine.prototype.Pick.bind(rant);
export let Shuffle = Rant.RantEngine.prototype.Shuffle.bind(rant);
