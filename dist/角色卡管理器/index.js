var __webpack_modules__ = {
  "./node_modules/.pnpm/@vue+reactivity@3.5.35/node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      ARRAY_ITERATE_KEY: () => ARRAY_ITERATE_KEY,
      EffectFlags: () => EffectFlags,
      EffectScope: () => EffectScope,
      ITERATE_KEY: () => ITERATE_KEY,
      MAP_KEY_ITERATE_KEY: () => MAP_KEY_ITERATE_KEY,
      ReactiveEffect: () => ReactiveEffect,
      ReactiveFlags: () => ReactiveFlags,
      TrackOpTypes: () => TrackOpTypes,
      TriggerOpTypes: () => TriggerOpTypes,
      WatchErrorCodes: () => WatchErrorCodes,
      computed: () => computed,
      customRef: () => customRef,
      effect: () => effect,
      effectScope: () => effectScope,
      enableTracking: () => enableTracking,
      getCurrentScope: () => getCurrentScope,
      getCurrentWatcher: () => getCurrentWatcher,
      isProxy: () => isProxy,
      isReactive: () => isReactive,
      isReadonly: () => isReadonly,
      isRef: () => isRef,
      isShallow: () => isShallow,
      markRaw: () => markRaw,
      onEffectCleanup: () => onEffectCleanup,
      onScopeDispose: () => onScopeDispose,
      onWatcherCleanup: () => onWatcherCleanup,
      pauseTracking: () => pauseTracking,
      proxyRefs: () => proxyRefs,
      reactive: () => reactive,
      reactiveReadArray: () => reactiveReadArray,
      readonly: () => readonly,
      ref: () => ref,
      resetTracking: () => resetTracking,
      shallowReactive: () => shallowReactive,
      shallowReadArray: () => shallowReadArray,
      shallowReadonly: () => shallowReadonly,
      shallowRef: () => shallowRef,
      stop: () => stop,
      toRaw: () => toRaw,
      toReactive: () => toReactive,
      toReadonly: () => toReadonly,
      toRef: () => toRef,
      toRefs: () => toRefs,
      toValue: () => toValue,
      track: () => track,
      traverse: () => traverse,
      trigger: () => trigger,
      triggerRef: () => triggerRef,
      unref: () => unref,
      watch: () => watch
    });
    var _vue_shared__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @vue/shared */ "./node_modules/.pnpm/@vue+shared@3.5.35/node_modules/@vue/shared/dist/shared.esm-bundler.js");
    /**
* @vue/reactivity v3.5.35
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/    function warn(msg, ...args) {
      console.warn(`[Vue warn] ${msg}`, ...args);
    }
    let activeEffectScope;
    class EffectScope {
      constructor(detached = false) {
        this.detached = detached;
        this._active = true;
        this._on = 0;
        this.effects = [];
        this.cleanups = [];
        this._isPaused = false;
        this._warnOnRun = true;
        this.__v_skip = true;
        if (!detached && activeEffectScope) {
          if (activeEffectScope.active) {
            this.parent = activeEffectScope;
            this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this) - 1;
          } else {
            this._active = false;
            this._warnOnRun = false;
          }
        }
      }
      get active() {
        return this._active;
      }
      pause() {
        if (this._active) {
          this._isPaused = true;
          let i, l;
          if (this.scopes) {
            for (i = 0, l = this.scopes.length; i < l; i++) {
              this.scopes[i].pause();
            }
          }
          for (i = 0, l = this.effects.length; i < l; i++) {
            this.effects[i].pause();
          }
        }
      }
      resume() {
        if (this._active) {
          if (this._isPaused) {
            this._isPaused = false;
            let i, l;
            if (this.scopes) {
              for (i = 0, l = this.scopes.length; i < l; i++) {
                this.scopes[i].resume();
              }
            }
            for (i = 0, l = this.effects.length; i < l; i++) {
              this.effects[i].resume();
            }
          }
        }
      }
      run(fn) {
        if (this._active) {
          const currentEffectScope = activeEffectScope;
          try {
            activeEffectScope = this;
            return fn();
          } finally {
            activeEffectScope = currentEffectScope;
          }
        } else if (true && this._warnOnRun) {
          warn(`cannot run an inactive effect scope.`);
        }
      }
      on() {
        if (++this._on === 1) {
          this.prevScope = activeEffectScope;
          activeEffectScope = this;
        }
      }
      off() {
        if (this._on > 0 && --this._on === 0) {
          if (activeEffectScope === this) {
            activeEffectScope = this.prevScope;
          } else {
            let current = activeEffectScope;
            while (current) {
              if (current.prevScope === this) {
                current.prevScope = this.prevScope;
                break;
              }
              current = current.prevScope;
            }
          }
          this.prevScope = void 0;
        }
      }
      stop(fromParent) {
        if (this._active) {
          this._active = false;
          let i, l;
          for (i = 0, l = this.effects.length; i < l; i++) {
            this.effects[i].stop();
          }
          this.effects.length = 0;
          for (i = 0, l = this.cleanups.length; i < l; i++) {
            this.cleanups[i]();
          }
          this.cleanups.length = 0;
          if (this.scopes) {
            for (i = 0, l = this.scopes.length; i < l; i++) {
              this.scopes[i].stop(true);
            }
            this.scopes.length = 0;
          }
          if (!this.detached && this.parent && !fromParent) {
            const last = this.parent.scopes.pop();
            if (last && last !== this) {
              this.parent.scopes[this.index] = last;
              last.index = this.index;
            }
          }
          this.parent = void 0;
        }
      }
    }
    function effectScope(detached) {
      return new EffectScope(detached);
    }
    function getCurrentScope() {
      return activeEffectScope;
    }
    function onScopeDispose(fn, failSilently = false) {
      if (activeEffectScope) {
        activeEffectScope.cleanups.push(fn);
      } else if (true && !failSilently) {
        warn(`onScopeDispose() is called when there is no active effect scope to be associated with.`);
      }
    }
    let activeSub;
    const EffectFlags = {
      ACTIVE: 1,
      1: "ACTIVE",
      RUNNING: 2,
      2: "RUNNING",
      TRACKING: 4,
      4: "TRACKING",
      NOTIFIED: 8,
      8: "NOTIFIED",
      DIRTY: 16,
      16: "DIRTY",
      ALLOW_RECURSE: 32,
      32: "ALLOW_RECURSE",
      PAUSED: 64,
      64: "PAUSED",
      EVALUATED: 128,
      128: "EVALUATED"
    };
    const pausedQueueEffects = new WeakSet;
    class ReactiveEffect {
      constructor(fn) {
        this.fn = fn;
        this.deps = void 0;
        this.depsTail = void 0;
        this.flags = 1 | 4;
        this.next = void 0;
        this.cleanup = void 0;
        this.scheduler = void 0;
        if (activeEffectScope) {
          if (activeEffectScope.active) {
            activeEffectScope.effects.push(this);
          } else {
            this.flags &= -2;
          }
        }
      }
      pause() {
        this.flags |= 64;
      }
      resume() {
        if (this.flags & 64) {
          this.flags &= -65;
          if (pausedQueueEffects.has(this)) {
            pausedQueueEffects.delete(this);
            this.trigger();
          }
        }
      }
      notify() {
        if (this.flags & 2 && !(this.flags & 32)) {
          return;
        }
        if (!(this.flags & 8)) {
          batch(this);
        }
      }
      run() {
        if (!(this.flags & 1)) {
          return this.fn();
        }
        this.flags |= 2;
        cleanupEffect(this);
        prepareDeps(this);
        const prevEffect = activeSub;
        const prevShouldTrack = shouldTrack;
        activeSub = this;
        shouldTrack = true;
        try {
          return this.fn();
        } finally {
          if (true && activeSub !== this) {
            warn("Active effect was not restored correctly - this is likely a Vue internal bug.");
          }
          cleanupDeps(this);
          activeSub = prevEffect;
          shouldTrack = prevShouldTrack;
          this.flags &= -3;
        }
      }
      stop() {
        if (this.flags & 1) {
          for (let link = this.deps; link; link = link.nextDep) {
            removeSub(link);
          }
          this.deps = this.depsTail = void 0;
          cleanupEffect(this);
          this.onStop && this.onStop();
          this.flags &= -2;
        }
      }
      trigger() {
        if (this.flags & 64) {
          pausedQueueEffects.add(this);
        } else if (this.scheduler) {
          this.scheduler();
        } else {
          this.runIfDirty();
        }
      }
      runIfDirty() {
        if (isDirty(this)) {
          this.run();
        }
      }
      get dirty() {
        return isDirty(this);
      }
    }
    let batchDepth = 0;
    let batchedSub;
    let batchedComputed;
    function batch(sub, isComputed = false) {
      sub.flags |= 8;
      if (isComputed) {
        sub.next = batchedComputed;
        batchedComputed = sub;
        return;
      }
      sub.next = batchedSub;
      batchedSub = sub;
    }
    function startBatch() {
      batchDepth++;
    }
    function endBatch() {
      if (--batchDepth > 0) {
        return;
      }
      if (batchedComputed) {
        let e = batchedComputed;
        batchedComputed = void 0;
        while (e) {
          const next = e.next;
          e.next = void 0;
          e.flags &= -9;
          e = next;
        }
      }
      let error;
      while (batchedSub) {
        let e = batchedSub;
        batchedSub = void 0;
        while (e) {
          const next = e.next;
          e.next = void 0;
          e.flags &= -9;
          if (e.flags & 1) {
            try {
              e.trigger();
            } catch (err) {
              if (!error) error = err;
            }
          }
          e = next;
        }
      }
      if (error) throw error;
    }
    function prepareDeps(sub) {
      for (let link = sub.deps; link; link = link.nextDep) {
        link.version = -1;
        link.prevActiveLink = link.dep.activeLink;
        link.dep.activeLink = link;
      }
    }
    function cleanupDeps(sub) {
      let head;
      let tail = sub.depsTail;
      let link = tail;
      while (link) {
        const prev = link.prevDep;
        if (link.version === -1) {
          if (link === tail) tail = prev;
          removeSub(link);
          removeDep(link);
        } else {
          head = link;
        }
        link.dep.activeLink = link.prevActiveLink;
        link.prevActiveLink = void 0;
        link = prev;
      }
      sub.deps = head;
      sub.depsTail = tail;
    }
    function isDirty(sub) {
      for (let link = sub.deps; link; link = link.nextDep) {
        if (link.dep.version !== link.version || link.dep.computed && (refreshComputed(link.dep.computed) || link.dep.version !== link.version)) {
          return true;
        }
      }
      if (sub._dirty) {
        return true;
      }
      return false;
    }
    function refreshComputed(computed) {
      if (computed.flags & 4 && !(computed.flags & 16)) {
        return;
      }
      computed.flags &= -17;
      if (computed.globalVersion === globalVersion) {
        return;
      }
      computed.globalVersion = globalVersion;
      if (!computed.isSSR && computed.flags & 128 && (!computed.deps && !computed._dirty || !isDirty(computed))) {
        return;
      }
      computed.flags |= 2;
      const dep = computed.dep;
      const prevSub = activeSub;
      const prevShouldTrack = shouldTrack;
      activeSub = computed;
      shouldTrack = true;
      try {
        prepareDeps(computed);
        const value = computed.fn(computed._value);
        if (dep.version === 0 || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(value, computed._value)) {
          computed.flags |= 128;
          computed._value = value;
          dep.version++;
        }
      } catch (err) {
        dep.version++;
        throw err;
      } finally {
        activeSub = prevSub;
        shouldTrack = prevShouldTrack;
        cleanupDeps(computed);
        computed.flags &= -3;
      }
    }
    function removeSub(link, soft = false) {
      const {dep, prevSub, nextSub} = link;
      if (prevSub) {
        prevSub.nextSub = nextSub;
        link.prevSub = void 0;
      }
      if (nextSub) {
        nextSub.prevSub = prevSub;
        link.nextSub = void 0;
      }
      if (true && dep.subsHead === link) {
        dep.subsHead = nextSub;
      }
      if (dep.subs === link) {
        dep.subs = prevSub;
        if (!prevSub && dep.computed) {
          dep.computed.flags &= -5;
          for (let l = dep.computed.deps; l; l = l.nextDep) {
            removeSub(l, true);
          }
        }
      }
      if (!soft && ! --dep.sc && dep.map) {
        dep.map.delete(dep.key);
      }
    }
    function removeDep(link) {
      const {prevDep, nextDep} = link;
      if (prevDep) {
        prevDep.nextDep = nextDep;
        link.prevDep = void 0;
      }
      if (nextDep) {
        nextDep.prevDep = prevDep;
        link.nextDep = void 0;
      }
    }
    function effect(fn, options) {
      if (fn.effect instanceof ReactiveEffect) {
        fn = fn.effect.fn;
      }
      const e = new ReactiveEffect(fn);
      if (options) {
        (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.extend)(e, options);
      }
      try {
        e.run();
      } catch (err) {
        e.stop();
        throw err;
      }
      const runner = e.run.bind(e);
      runner.effect = e;
      return runner;
    }
    function stop(runner) {
      runner.effect.stop();
    }
    let shouldTrack = true;
    const trackStack = [];
    function pauseTracking() {
      trackStack.push(shouldTrack);
      shouldTrack = false;
    }
    function enableTracking() {
      trackStack.push(shouldTrack);
      shouldTrack = true;
    }
    function resetTracking() {
      const last = trackStack.pop();
      shouldTrack = last === void 0 ? true : last;
    }
    function onEffectCleanup(fn, failSilently = false) {
      if (activeSub instanceof ReactiveEffect) {
        activeSub.cleanup = fn;
      } else if (true && !failSilently) {
        warn(`onEffectCleanup() was called when there was no active effect to associate with.`);
      }
    }
    function cleanupEffect(e) {
      const {cleanup} = e;
      e.cleanup = void 0;
      if (cleanup) {
        const prevSub = activeSub;
        activeSub = void 0;
        try {
          cleanup();
        } finally {
          activeSub = prevSub;
        }
      }
    }
    let globalVersion = 0;
    class Link {
      constructor(sub, dep) {
        this.sub = sub;
        this.dep = dep;
        this.version = dep.version;
        this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
      }
    }
    class Dep {
      constructor(computed) {
        this.computed = computed;
        this.version = 0;
        this.activeLink = void 0;
        this.subs = void 0;
        this.map = void 0;
        this.key = void 0;
        this.sc = 0;
        this.__v_skip = true;
        if (true) {
          this.subsHead = void 0;
        }
      }
      track(debugInfo) {
        if (!activeSub || !shouldTrack || activeSub === this.computed) {
          return;
        }
        let link = this.activeLink;
        if (link === void 0 || link.sub !== activeSub) {
          link = this.activeLink = new Link(activeSub, this);
          if (!activeSub.deps) {
            activeSub.deps = activeSub.depsTail = link;
          } else {
            link.prevDep = activeSub.depsTail;
            activeSub.depsTail.nextDep = link;
            activeSub.depsTail = link;
          }
          addSub(link);
        } else if (link.version === -1) {
          link.version = this.version;
          if (link.nextDep) {
            const next = link.nextDep;
            next.prevDep = link.prevDep;
            if (link.prevDep) {
              link.prevDep.nextDep = next;
            }
            link.prevDep = activeSub.depsTail;
            link.nextDep = void 0;
            activeSub.depsTail.nextDep = link;
            activeSub.depsTail = link;
            if (activeSub.deps === link) {
              activeSub.deps = next;
            }
          }
        }
        if (true && activeSub.onTrack) {
          activeSub.onTrack((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.extend)({
            effect: activeSub
          }, debugInfo));
        }
        return link;
      }
      trigger(debugInfo) {
        this.version++;
        globalVersion++;
        this.notify(debugInfo);
      }
      notify(debugInfo) {
        startBatch();
        try {
          if (true) {
            for (let head = this.subsHead; head; head = head.nextSub) {
              if (head.sub.onTrigger && !(head.sub.flags & 8)) {
                head.sub.onTrigger((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.extend)({
                  effect: head.sub
                }, debugInfo));
              }
            }
          }
          for (let link = this.subs; link; link = link.prevSub) {
            if (link.sub.notify()) {
              link.sub.dep.notify();
            }
          }
        } finally {
          endBatch();
        }
      }
    }
    function addSub(link) {
      link.dep.sc++;
      if (link.sub.flags & 4) {
        const computed = link.dep.computed;
        if (computed && !link.dep.subs) {
          computed.flags |= 4 | 16;
          for (let l = computed.deps; l; l = l.nextDep) {
            addSub(l);
          }
        }
        const currentTail = link.dep.subs;
        if (currentTail !== link) {
          link.prevSub = currentTail;
          if (currentTail) currentTail.nextSub = link;
        }
        if (true && link.dep.subsHead === void 0) {
          link.dep.subsHead = link;
        }
        link.dep.subs = link;
      }
    }
    const targetMap = new WeakMap;
    const ITERATE_KEY = Symbol(true ? "Object iterate" : 0);
    const MAP_KEY_ITERATE_KEY = Symbol(true ? "Map keys iterate" : 0);
    const ARRAY_ITERATE_KEY = Symbol(true ? "Array iterate" : 0);
    function track(target, type, key) {
      if (shouldTrack && activeSub) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
          targetMap.set(target, depsMap = new Map);
        }
        let dep = depsMap.get(key);
        if (!dep) {
          depsMap.set(key, dep = new Dep);
          dep.map = depsMap;
          dep.key = key;
        }
        if (true) {
          dep.track({
            target,
            type,
            key
          });
        } else {}
      }
    }
    function trigger(target, type, key, newValue, oldValue, oldTarget) {
      const depsMap = targetMap.get(target);
      if (!depsMap) {
        globalVersion++;
        return;
      }
      const run = dep => {
        if (dep) {
          if (true) {
            dep.trigger({
              target,
              type,
              key,
              newValue,
              oldValue,
              oldTarget
            });
          } else {}
        }
      };
      startBatch();
      if (type === "clear") {
        depsMap.forEach(run);
      } else {
        const targetIsArray = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isArray)(target);
        const isArrayIndex = targetIsArray && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isIntegerKey)(key);
        if (targetIsArray && key === "length") {
          const newLength = Number(newValue);
          depsMap.forEach((dep, key2) => {
            if (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isSymbol)(key2) && key2 >= newLength) {
              run(dep);
            }
          });
        } else {
          if (key !== void 0 || depsMap.has(void 0)) {
            run(depsMap.get(key));
          }
          if (isArrayIndex) {
            run(depsMap.get(ARRAY_ITERATE_KEY));
          }
          switch (type) {
           case "add":
            if (!targetIsArray) {
              run(depsMap.get(ITERATE_KEY));
              if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isMap)(target)) {
                run(depsMap.get(MAP_KEY_ITERATE_KEY));
              }
            } else if (isArrayIndex) {
              run(depsMap.get("length"));
            }
            break;

           case "delete":
            if (!targetIsArray) {
              run(depsMap.get(ITERATE_KEY));
              if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isMap)(target)) {
                run(depsMap.get(MAP_KEY_ITERATE_KEY));
              }
            }
            break;

           case "set":
            if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isMap)(target)) {
              run(depsMap.get(ITERATE_KEY));
            }
            break;
          }
        }
      }
      endBatch();
    }
    function getDepFromReactive(object, key) {
      const depMap = targetMap.get(object);
      return depMap && depMap.get(key);
    }
    function reactiveReadArray(array) {
      const raw = toRaw(array);
      if (raw === array) return raw;
      track(raw, "iterate", ARRAY_ITERATE_KEY);
      return isShallow(array) ? raw : raw.map(toReactive);
    }
    function shallowReadArray(arr) {
      track(arr = toRaw(arr), "iterate", ARRAY_ITERATE_KEY);
      return arr;
    }
    function toWrapped(target, item) {
      if (isReadonly(target)) {
        return isReactive(target) ? toReadonly(toReactive(item)) : toReadonly(item);
      }
      return toReactive(item);
    }
    const arrayInstrumentations = {
      __proto__: null,
      [Symbol.iterator]() {
        return iterator(this, Symbol.iterator, item => toWrapped(this, item));
      },
      concat(...args) {
        return reactiveReadArray(this).concat(...args.map(x => (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isArray)(x) ? reactiveReadArray(x) : x));
      },
      entries() {
        return iterator(this, "entries", value => {
          value[1] = toWrapped(this, value[1]);
          return value;
        });
      },
      every(fn, thisArg) {
        return apply(this, "every", fn, thisArg, void 0, arguments);
      },
      filter(fn, thisArg) {
        return apply(this, "filter", fn, thisArg, v => v.map(item => toWrapped(this, item)), arguments);
      },
      find(fn, thisArg) {
        return apply(this, "find", fn, thisArg, item => toWrapped(this, item), arguments);
      },
      findIndex(fn, thisArg) {
        return apply(this, "findIndex", fn, thisArg, void 0, arguments);
      },
      findLast(fn, thisArg) {
        return apply(this, "findLast", fn, thisArg, item => toWrapped(this, item), arguments);
      },
      findLastIndex(fn, thisArg) {
        return apply(this, "findLastIndex", fn, thisArg, void 0, arguments);
      },
      forEach(fn, thisArg) {
        return apply(this, "forEach", fn, thisArg, void 0, arguments);
      },
      includes(...args) {
        return searchProxy(this, "includes", args);
      },
      indexOf(...args) {
        return searchProxy(this, "indexOf", args);
      },
      join(separator) {
        return reactiveReadArray(this).join(separator);
      },
      lastIndexOf(...args) {
        return searchProxy(this, "lastIndexOf", args);
      },
      map(fn, thisArg) {
        return apply(this, "map", fn, thisArg, void 0, arguments);
      },
      pop() {
        return noTracking(this, "pop");
      },
      push(...args) {
        return noTracking(this, "push", args);
      },
      reduce(fn, ...args) {
        return reduce(this, "reduce", fn, args);
      },
      reduceRight(fn, ...args) {
        return reduce(this, "reduceRight", fn, args);
      },
      shift() {
        return noTracking(this, "shift");
      },
      some(fn, thisArg) {
        return apply(this, "some", fn, thisArg, void 0, arguments);
      },
      splice(...args) {
        return noTracking(this, "splice", args);
      },
      toReversed() {
        return reactiveReadArray(this).toReversed();
      },
      toSorted(comparer) {
        return reactiveReadArray(this).toSorted(comparer);
      },
      toSpliced(...args) {
        return reactiveReadArray(this).toSpliced(...args);
      },
      unshift(...args) {
        return noTracking(this, "unshift", args);
      },
      values() {
        return iterator(this, "values", item => toWrapped(this, item));
      }
    };
    function iterator(self, method, wrapValue) {
      const arr = shallowReadArray(self);
      const iter = arr[method]();
      if (arr !== self && !isShallow(self)) {
        iter._next = iter.next;
        iter.next = () => {
          const result = iter._next();
          if (!result.done) {
            result.value = wrapValue(result.value);
          }
          return result;
        };
      }
      return iter;
    }
    const arrayProto = Array.prototype;
    function apply(self, method, fn, thisArg, wrappedRetFn, args) {
      const arr = shallowReadArray(self);
      const needsWrap = arr !== self && !isShallow(self);
      const methodFn = arr[method];
      if (methodFn !== arrayProto[method]) {
        const result2 = methodFn.apply(self, args);
        return needsWrap ? toReactive(result2) : result2;
      }
      let wrappedFn = fn;
      if (arr !== self) {
        if (needsWrap) {
          wrappedFn = function(item, index) {
            return fn.call(this, toWrapped(self, item), index, self);
          };
        } else if (fn.length > 2) {
          wrappedFn = function(item, index) {
            return fn.call(this, item, index, self);
          };
        }
      }
      const result = methodFn.call(arr, wrappedFn, thisArg);
      return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
    }
    function reduce(self, method, fn, args) {
      const arr = shallowReadArray(self);
      const needsWrap = arr !== self && !isShallow(self);
      let wrappedFn = fn;
      let wrapInitialAccumulator = false;
      if (arr !== self) {
        if (needsWrap) {
          wrapInitialAccumulator = args.length === 0;
          wrappedFn = function(acc, item, index) {
            if (wrapInitialAccumulator) {
              wrapInitialAccumulator = false;
              acc = toWrapped(self, acc);
            }
            return fn.call(this, acc, toWrapped(self, item), index, self);
          };
        } else if (fn.length > 3) {
          wrappedFn = function(acc, item, index) {
            return fn.call(this, acc, item, index, self);
          };
        }
      }
      const result = arr[method](wrappedFn, ...args);
      return wrapInitialAccumulator ? toWrapped(self, result) : result;
    }
    function searchProxy(self, method, args) {
      const arr = toRaw(self);
      track(arr, "iterate", ARRAY_ITERATE_KEY);
      const res = arr[method](...args);
      if ((res === -1 || res === false) && isProxy(args[0])) {
        args[0] = toRaw(args[0]);
        return arr[method](...args);
      }
      return res;
    }
    function noTracking(self, method, args = []) {
      pauseTracking();
      startBatch();
      const res = toRaw(self)[method].apply(self, args);
      endBatch();
      resetTracking();
      return res;
    }
    const isNonTrackableKeys = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.makeMap)(`__proto__,__v_isRef,__isVue`);
    const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).filter(key => key !== "arguments" && key !== "caller").map(key => Symbol[key]).filter(_vue_shared__WEBPACK_IMPORTED_MODULE_0__.isSymbol));
    function hasOwnProperty(key) {
      if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isSymbol)(key)) key = String(key);
      const obj = toRaw(this);
      track(obj, "has", key);
      return obj.hasOwnProperty(key);
    }
    class BaseReactiveHandler {
      constructor(_isReadonly = false, _isShallow = false) {
        this._isReadonly = _isReadonly;
        this._isShallow = _isShallow;
      }
      get(target, key, receiver) {
        if (key === "__v_skip") return target["__v_skip"];
        const isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
        if (key === "__v_isReactive") {
          return !isReadonly2;
        } else if (key === "__v_isReadonly") {
          return isReadonly2;
        } else if (key === "__v_isShallow") {
          return isShallow2;
        } else if (key === "__v_raw") {
          if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) {
            return target;
          }
          return;
        }
        const targetIsArray = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isArray)(target);
        if (!isReadonly2) {
          let fn;
          if (targetIsArray && (fn = arrayInstrumentations[key])) {
            return fn;
          }
          if (key === "hasOwnProperty") {
            return hasOwnProperty;
          }
        }
        const res = Reflect.get(target, key, isRef(target) ? target : receiver);
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isSymbol)(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
          return res;
        }
        if (!isReadonly2) {
          track(target, "get", key);
        }
        if (isShallow2) {
          return res;
        }
        if (isRef(res)) {
          const value = targetIsArray && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isIntegerKey)(key) ? res : res.value;
          return isReadonly2 && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isObject)(value) ? readonly(value) : value;
        }
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isObject)(res)) {
          return isReadonly2 ? readonly(res) : reactive(res);
        }
        return res;
      }
    }
    class MutableReactiveHandler extends BaseReactiveHandler {
      constructor(isShallow2 = false) {
        super(false, isShallow2);
      }
      set(target, key, value, receiver) {
        let oldValue = target[key];
        const isArrayWithIntegerKey = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isArray)(target) && (0, 
        _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isIntegerKey)(key);
        if (!this._isShallow) {
          const isOldValueReadonly = isReadonly(oldValue);
          if (!isShallow(value) && !isReadonly(value)) {
            oldValue = toRaw(oldValue);
            value = toRaw(value);
          }
          if (!isArrayWithIntegerKey && isRef(oldValue) && !isRef(value)) {
            if (isOldValueReadonly) {
              if (true) {
                warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target[key]);
              }
              return true;
            } else {
              oldValue.value = value;
              return true;
            }
          }
        }
        const hadKey = isArrayWithIntegerKey ? Number(key) < target.length : (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasOwn)(target, key);
        const result = Reflect.set(target, key, value, isRef(target) ? target : receiver);
        if (target === toRaw(receiver)) {
          if (!hadKey) {
            trigger(target, "add", key, value);
          } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(value, oldValue)) {
            trigger(target, "set", key, value, oldValue);
          }
        }
        return result;
      }
      deleteProperty(target, key) {
        const hadKey = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasOwn)(target, key);
        const oldValue = target[key];
        const result = Reflect.deleteProperty(target, key);
        if (result && hadKey) {
          trigger(target, "delete", key, void 0, oldValue);
        }
        return result;
      }
      has(target, key) {
        const result = Reflect.has(target, key);
        if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isSymbol)(key) || !builtInSymbols.has(key)) {
          track(target, "has", key);
        }
        return result;
      }
      ownKeys(target) {
        track(target, "iterate", (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isArray)(target) ? "length" : ITERATE_KEY);
        return Reflect.ownKeys(target);
      }
    }
    class ReadonlyReactiveHandler extends BaseReactiveHandler {
      constructor(isShallow2 = false) {
        super(true, isShallow2);
      }
      set(target, key) {
        if (true) {
          warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
        }
        return true;
      }
      deleteProperty(target, key) {
        if (true) {
          warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
        }
        return true;
      }
    }
    const mutableHandlers = new MutableReactiveHandler;
    const readonlyHandlers = new ReadonlyReactiveHandler;
    const shallowReactiveHandlers = new MutableReactiveHandler(true);
    const shallowReadonlyHandlers = new ReadonlyReactiveHandler(true);
    const toShallow = value => value;
    const getProto = v => Reflect.getPrototypeOf(v);
    function createIterableMethod(method, isReadonly2, isShallow2) {
      return function(...args) {
        const target = this["__v_raw"];
        const rawTarget = toRaw(target);
        const targetIsMap = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isMap)(rawTarget);
        const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
        const isKeyOnly = method === "keys" && targetIsMap;
        const innerIterator = target[method](...args);
        const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
        !isReadonly2 && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
        return (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.extend)(Object.create(innerIterator), {
          next() {
            const {value, done} = innerIterator.next();
            return done ? {
              value,
              done
            } : {
              value: isPair ? [ wrap(value[0]), wrap(value[1]) ] : wrap(value),
              done
            };
          }
        });
      };
    }
    function createReadonlyMethod(type) {
      return function(...args) {
        if (true) {
          const key = args[0] ? `on key "${args[0]}" ` : ``;
          warn(`${(0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.capitalize)(type)} operation ${key}failed: target is readonly.`, toRaw(this));
        }
        return type === "delete" ? false : type === "clear" ? void 0 : this;
      };
    }
    function createInstrumentations(readonly, shallow) {
      const instrumentations = {
        get(key) {
          const target = this["__v_raw"];
          const rawTarget = toRaw(target);
          const rawKey = toRaw(key);
          if (!readonly) {
            if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(key, rawKey)) {
              track(rawTarget, "get", key);
            }
            track(rawTarget, "get", rawKey);
          }
          const {has} = getProto(rawTarget);
          const wrap = shallow ? toShallow : readonly ? toReadonly : toReactive;
          if (has.call(rawTarget, key)) {
            return wrap(target.get(key));
          } else if (has.call(rawTarget, rawKey)) {
            return wrap(target.get(rawKey));
          } else if (target !== rawTarget) {
            target.get(key);
          }
        },
        get size() {
          const target = this["__v_raw"];
          !readonly && track(toRaw(target), "iterate", ITERATE_KEY);
          return target.size;
        },
        has(key) {
          const target = this["__v_raw"];
          const rawTarget = toRaw(target);
          const rawKey = toRaw(key);
          if (!readonly) {
            if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(key, rawKey)) {
              track(rawTarget, "has", key);
            }
            track(rawTarget, "has", rawKey);
          }
          return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
        },
        forEach(callback, thisArg) {
          const observed = this;
          const target = observed["__v_raw"];
          const rawTarget = toRaw(target);
          const wrap = shallow ? toShallow : readonly ? toReadonly : toReactive;
          !readonly && track(rawTarget, "iterate", ITERATE_KEY);
          return target.forEach((value, key) => callback.call(thisArg, wrap(value), wrap(key), observed));
        }
      };
      (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.extend)(instrumentations, readonly ? {
        add: createReadonlyMethod("add"),
        set: createReadonlyMethod("set"),
        delete: createReadonlyMethod("delete"),
        clear: createReadonlyMethod("clear")
      } : {
        add(value) {
          const target = toRaw(this);
          const proto = getProto(target);
          const rawValue = toRaw(value);
          const valueToAdd = !shallow && !isShallow(value) && !isReadonly(value) ? rawValue : value;
          const hadKey = proto.has.call(target, valueToAdd) || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(value, valueToAdd) && proto.has.call(target, value) || (0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(rawValue, valueToAdd) && proto.has.call(target, rawValue);
          if (!hadKey) {
            target.add(valueToAdd);
            trigger(target, "add", valueToAdd, valueToAdd);
          }
          return this;
        },
        set(key, value) {
          if (!shallow && !isShallow(value) && !isReadonly(value)) {
            value = toRaw(value);
          }
          const target = toRaw(this);
          const {has, get} = getProto(target);
          let hadKey = has.call(target, key);
          if (!hadKey) {
            key = toRaw(key);
            hadKey = has.call(target, key);
          } else if (true) {
            checkIdentityKeys(target, has, key);
          }
          const oldValue = get.call(target, key);
          target.set(key, value);
          if (!hadKey) {
            trigger(target, "add", key, value);
          } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(value, oldValue)) {
            trigger(target, "set", key, value, oldValue);
          }
          return this;
        },
        delete(key) {
          const target = toRaw(this);
          const {has, get} = getProto(target);
          let hadKey = has.call(target, key);
          if (!hadKey) {
            key = toRaw(key);
            hadKey = has.call(target, key);
          } else if (true) {
            checkIdentityKeys(target, has, key);
          }
          const oldValue = get ? get.call(target, key) : void 0;
          const result = target.delete(key);
          if (hadKey) {
            trigger(target, "delete", key, void 0, oldValue);
          }
          return result;
        },
        clear() {
          const target = toRaw(this);
          const hadItems = target.size !== 0;
          const oldTarget = true ? (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isMap)(target) ? new Map(target) : new Set(target) : 0;
          const result = target.clear();
          if (hadItems) {
            trigger(target, "clear", void 0, void 0, oldTarget);
          }
          return result;
        }
      });
      const iteratorMethods = [ "keys", "values", "entries", Symbol.iterator ];
      iteratorMethods.forEach(method => {
        instrumentations[method] = createIterableMethod(method, readonly, shallow);
      });
      return instrumentations;
    }
    function createInstrumentationGetter(isReadonly2, shallow) {
      const instrumentations = createInstrumentations(isReadonly2, shallow);
      return (target, key, receiver) => {
        if (key === "__v_isReactive") {
          return !isReadonly2;
        } else if (key === "__v_isReadonly") {
          return isReadonly2;
        } else if (key === "__v_raw") {
          return target;
        }
        return Reflect.get((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasOwn)(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
      };
    }
    const mutableCollectionHandlers = {
      get: createInstrumentationGetter(false, false)
    };
    const shallowCollectionHandlers = {
      get: createInstrumentationGetter(false, true)
    };
    const readonlyCollectionHandlers = {
      get: createInstrumentationGetter(true, false)
    };
    const shallowReadonlyCollectionHandlers = {
      get: createInstrumentationGetter(true, true)
    };
    function checkIdentityKeys(target, has, key) {
      const rawKey = toRaw(key);
      if (rawKey !== key && has.call(target, rawKey)) {
        const type = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.toRawType)(target);
        warn(`Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`);
      }
    }
    const reactiveMap = new WeakMap;
    const shallowReactiveMap = new WeakMap;
    const readonlyMap = new WeakMap;
    const shallowReadonlyMap = new WeakMap;
    function targetTypeMap(rawType) {
      switch (rawType) {
       case "Object":
       case "Array":
        return 1;

       case "Map":
       case "Set":
       case "WeakMap":
       case "WeakSet":
        return 2;

       default:
        return 0;
      }
    }
    function reactive(target) {
      if (isReadonly(target)) {
        return target;
      }
      return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
    }
    function shallowReactive(target) {
      return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers, shallowReactiveMap);
    }
    function readonly(target) {
      return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
    }
    function shallowReadonly(target) {
      return createReactiveObject(target, true, shallowReadonlyHandlers, shallowReadonlyCollectionHandlers, shallowReadonlyMap);
    }
    function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
      if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isObject)(target)) {
        if (true) {
          warn(`value cannot be made ${isReadonly2 ? "readonly" : "reactive"}: ${String(target)}`);
        }
        return target;
      }
      if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) {
        return target;
      }
      if (target["__v_skip"] || !Object.isExtensible(target)) {
        return target;
      }
      const existingProxy = proxyMap.get(target);
      if (existingProxy) {
        return existingProxy;
      }
      const targetType = targetTypeMap((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.toRawType)(target));
      if (targetType === 0) {
        return target;
      }
      const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
      proxyMap.set(target, proxy);
      return proxy;
    }
    function isReactive(value) {
      if (isReadonly(value)) {
        return isReactive(value["__v_raw"]);
      }
      return !!(value && value["__v_isReactive"]);
    }
    function isReadonly(value) {
      return !!(value && value["__v_isReadonly"]);
    }
    function isShallow(value) {
      return !!(value && value["__v_isShallow"]);
    }
    function isProxy(value) {
      return value ? !!value["__v_raw"] : false;
    }
    function toRaw(observed) {
      const raw = observed && observed["__v_raw"];
      return raw ? toRaw(raw) : observed;
    }
    function markRaw(value) {
      if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasOwn)(value, "__v_skip") && Object.isExtensible(value)) {
        (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.def)(value, "__v_skip", true);
      }
      return value;
    }
    const toReactive = value => (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isObject)(value) ? reactive(value) : value;
    const toReadonly = value => (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isObject)(value) ? readonly(value) : value;
    function isRef(r) {
      return r ? r["__v_isRef"] === true : false;
    }
    function ref(value) {
      return createRef(value, false);
    }
    function shallowRef(value) {
      return createRef(value, true);
    }
    function createRef(rawValue, shallow) {
      if (isRef(rawValue)) {
        return rawValue;
      }
      return new RefImpl(rawValue, shallow);
    }
    class RefImpl {
      constructor(value, isShallow2) {
        this.dep = new Dep;
        this["__v_isRef"] = true;
        this["__v_isShallow"] = false;
        this._rawValue = isShallow2 ? value : toRaw(value);
        this._value = isShallow2 ? value : toReactive(value);
        this["__v_isShallow"] = isShallow2;
      }
      get value() {
        if (true) {
          this.dep.track({
            target: this,
            type: "get",
            key: "value"
          });
        } else {}
        return this._value;
      }
      set value(newValue) {
        const oldValue = this._rawValue;
        const useDirectValue = this["__v_isShallow"] || isShallow(newValue) || isReadonly(newValue);
        newValue = useDirectValue ? newValue : toRaw(newValue);
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(newValue, oldValue)) {
          this._rawValue = newValue;
          this._value = useDirectValue ? newValue : toReactive(newValue);
          if (true) {
            this.dep.trigger({
              target: this,
              type: "set",
              key: "value",
              newValue,
              oldValue
            });
          } else {}
        }
      }
    }
    function triggerRef(ref2) {
      if (ref2.dep) {
        if (true) {
          ref2.dep.trigger({
            target: ref2,
            type: "set",
            key: "value",
            newValue: ref2._value
          });
        } else {}
      }
    }
    function unref(ref2) {
      return isRef(ref2) ? ref2.value : ref2;
    }
    function toValue(source) {
      return (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isFunction)(source) ? source() : unref(source);
    }
    const shallowUnwrapHandlers = {
      get: (target, key, receiver) => key === "__v_raw" ? target : unref(Reflect.get(target, key, receiver)),
      set: (target, key, value, receiver) => {
        const oldValue = target[key];
        if (isRef(oldValue) && !isRef(value)) {
          oldValue.value = value;
          return true;
        } else {
          return Reflect.set(target, key, value, receiver);
        }
      }
    };
    function proxyRefs(objectWithRefs) {
      return isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
    }
    class CustomRefImpl {
      constructor(factory) {
        this["__v_isRef"] = true;
        this._value = void 0;
        const dep = this.dep = new Dep;
        const {get, set} = factory(dep.track.bind(dep), dep.trigger.bind(dep));
        this._get = get;
        this._set = set;
      }
      get value() {
        return this._value = this._get();
      }
      set value(newVal) {
        this._set(newVal);
      }
    }
    function customRef(factory) {
      return new CustomRefImpl(factory);
    }
    function toRefs(object) {
      if (true && !isProxy(object)) {
        warn(`toRefs() expects a reactive object but received a plain one.`);
      }
      const ret = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isArray)(object) ? new Array(object.length) : {};
      for (const key in object) {
        ret[key] = propertyToRef(object, key);
      }
      return ret;
    }
    class ObjectRefImpl {
      constructor(_object, key, _defaultValue) {
        this._object = _object;
        this._defaultValue = _defaultValue;
        this["__v_isRef"] = true;
        this._value = void 0;
        this._key = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isSymbol)(key) ? key : String(key);
        this._raw = toRaw(_object);
        let shallow = true;
        let obj = _object;
        if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isArray)(_object) || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isSymbol)(this._key) || !(0, 
        _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isIntegerKey)(this._key)) {
          do {
            shallow = !isProxy(obj) || isShallow(obj);
          } while (shallow && (obj = obj["__v_raw"]));
        }
        this._shallow = shallow;
      }
      get value() {
        let val = this._object[this._key];
        if (this._shallow) {
          val = unref(val);
        }
        return this._value = val === void 0 ? this._defaultValue : val;
      }
      set value(newVal) {
        if (this._shallow && isRef(this._raw[this._key])) {
          const nestedRef = this._object[this._key];
          if (isRef(nestedRef)) {
            nestedRef.value = newVal;
            return;
          }
        }
        this._object[this._key] = newVal;
      }
      get dep() {
        return getDepFromReactive(this._raw, this._key);
      }
    }
    class GetterRefImpl {
      constructor(_getter) {
        this._getter = _getter;
        this["__v_isRef"] = true;
        this["__v_isReadonly"] = true;
        this._value = void 0;
      }
      get value() {
        return this._value = this._getter();
      }
    }
    function toRef(source, key, defaultValue) {
      if (isRef(source)) {
        return source;
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isFunction)(source)) {
        return new GetterRefImpl(source);
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isObject)(source) && arguments.length > 1) {
        return propertyToRef(source, key, defaultValue);
      } else {
        return ref(source);
      }
    }
    function propertyToRef(source, key, defaultValue) {
      return new ObjectRefImpl(source, key, defaultValue);
    }
    class ComputedRefImpl {
      constructor(fn, setter, isSSR) {
        this.fn = fn;
        this.setter = setter;
        this._value = void 0;
        this.dep = new Dep(this);
        this.__v_isRef = true;
        this.deps = void 0;
        this.depsTail = void 0;
        this.flags = 16;
        this.globalVersion = globalVersion - 1;
        this.next = void 0;
        this.effect = this;
        this["__v_isReadonly"] = !setter;
        this.isSSR = isSSR;
      }
      notify() {
        this.flags |= 16;
        if (!(this.flags & 8) && activeSub !== this) {
          batch(this, true);
          return true;
        } else if (true) ;
      }
      get value() {
        const link = true ? this.dep.track({
          target: this,
          type: "get",
          key: "value"
        }) : 0;
        refreshComputed(this);
        if (link) {
          link.version = this.dep.version;
        }
        return this._value;
      }
      set value(newValue) {
        if (this.setter) {
          this.setter(newValue);
        } else if (true) {
          warn("Write operation failed: computed value is readonly");
        }
      }
    }
    function computed(getterOrOptions, debugOptions, isSSR = false) {
      let getter;
      let setter;
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isFunction)(getterOrOptions)) {
        getter = getterOrOptions;
      } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
      }
      const cRef = new ComputedRefImpl(getter, setter, isSSR);
      if (true && debugOptions && !isSSR) {
        cRef.onTrack = debugOptions.onTrack;
        cRef.onTrigger = debugOptions.onTrigger;
      }
      return cRef;
    }
    const TrackOpTypes = {
      GET: "get",
      HAS: "has",
      ITERATE: "iterate"
    };
    const TriggerOpTypes = {
      SET: "set",
      ADD: "add",
      DELETE: "delete",
      CLEAR: "clear"
    };
    const ReactiveFlags = {
      SKIP: "__v_skip",
      IS_REACTIVE: "__v_isReactive",
      IS_READONLY: "__v_isReadonly",
      IS_SHALLOW: "__v_isShallow",
      RAW: "__v_raw",
      IS_REF: "__v_isRef"
    };
    const WatchErrorCodes = {
      WATCH_GETTER: 2,
      2: "WATCH_GETTER",
      WATCH_CALLBACK: 3,
      3: "WATCH_CALLBACK",
      WATCH_CLEANUP: 4,
      4: "WATCH_CLEANUP"
    };
    const INITIAL_WATCHER_VALUE = {};
    const cleanupMap = new WeakMap;
    let activeWatcher = void 0;
    function getCurrentWatcher() {
      return activeWatcher;
    }
    function onWatcherCleanup(cleanupFn, failSilently = false, owner = activeWatcher) {
      if (owner) {
        let cleanups = cleanupMap.get(owner);
        if (!cleanups) cleanupMap.set(owner, cleanups = []);
        cleanups.push(cleanupFn);
      } else if (true && !failSilently) {
        warn(`onWatcherCleanup() was called when there was no active watcher to associate with.`);
      }
    }
    function watch(source, cb, options = _vue_shared__WEBPACK_IMPORTED_MODULE_0__.EMPTY_OBJ) {
      const {immediate, deep, once, scheduler, augmentJob, call} = options;
      const warnInvalidSource = s => {
        (options.onWarn || warn)(`Invalid watch source: `, s, `A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types.`);
      };
      const reactiveGetter = source2 => {
        if (deep) return source2;
        if (isShallow(source2) || deep === false || deep === 0) return traverse(source2, 1);
        return traverse(source2);
      };
      let effect;
      let getter;
      let cleanup;
      let boundCleanup;
      let forceTrigger = false;
      let isMultiSource = false;
      if (isRef(source)) {
        getter = () => source.value;
        forceTrigger = isShallow(source);
      } else if (isReactive(source)) {
        getter = () => reactiveGetter(source);
        forceTrigger = true;
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isArray)(source)) {
        isMultiSource = true;
        forceTrigger = source.some(s => isReactive(s) || isShallow(s));
        getter = () => source.map(s => {
          if (isRef(s)) {
            return s.value;
          } else if (isReactive(s)) {
            return reactiveGetter(s);
          } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isFunction)(s)) {
            return call ? call(s, 2) : s();
          } else {
            true && warnInvalidSource(s);
          }
        });
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isFunction)(source)) {
        if (cb) {
          getter = call ? () => call(source, 2) : source;
        } else {
          getter = () => {
            if (cleanup) {
              pauseTracking();
              try {
                cleanup();
              } finally {
                resetTracking();
              }
            }
            const currentEffect = activeWatcher;
            activeWatcher = effect;
            try {
              return call ? call(source, 3, [ boundCleanup ]) : source(boundCleanup);
            } finally {
              activeWatcher = currentEffect;
            }
          };
        }
      } else {
        getter = _vue_shared__WEBPACK_IMPORTED_MODULE_0__.NOOP;
        true && warnInvalidSource(source);
      }
      if (cb && deep) {
        const baseGetter = getter;
        const depth = deep === true ? Infinity : deep;
        getter = () => traverse(baseGetter(), depth);
      }
      const scope = getCurrentScope();
      const watchHandle = () => {
        effect.stop();
        if (scope && scope.active) {
          (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.remove)(scope.effects, effect);
        }
      };
      if (once && cb) {
        const _cb = cb;
        cb = (...args) => {
          _cb(...args);
          watchHandle();
        };
      }
      let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
      const job = immediateFirstRun => {
        if (!(effect.flags & 1) || !effect.dirty && !immediateFirstRun) {
          return;
        }
        if (cb) {
          const newValue = effect.run();
          if (deep || forceTrigger || (isMultiSource ? newValue.some((v, i) => (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(v, oldValue[i])) : (0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(newValue, oldValue))) {
            if (cleanup) {
              cleanup();
            }
            const currentWatcher = activeWatcher;
            activeWatcher = effect;
            try {
              const args = [ newValue, oldValue === INITIAL_WATCHER_VALUE ? void 0 : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue, boundCleanup ];
              oldValue = newValue;
              call ? call(cb, 3, args) : cb(...args);
            } finally {
              activeWatcher = currentWatcher;
            }
          }
        } else {
          effect.run();
        }
      };
      if (augmentJob) {
        augmentJob(job);
      }
      effect = new ReactiveEffect(getter);
      effect.scheduler = scheduler ? () => scheduler(job, false) : job;
      boundCleanup = fn => onWatcherCleanup(fn, false, effect);
      cleanup = effect.onStop = () => {
        const cleanups = cleanupMap.get(effect);
        if (cleanups) {
          if (call) {
            call(cleanups, 4);
          } else {
            for (const cleanup2 of cleanups) cleanup2();
          }
          cleanupMap.delete(effect);
        }
      };
      if (true) {
        effect.onTrack = options.onTrack;
        effect.onTrigger = options.onTrigger;
      }
      if (cb) {
        if (immediate) {
          job(true);
        } else {
          oldValue = effect.run();
        }
      } else if (scheduler) {
        scheduler(job.bind(null, true), true);
      } else {
        effect.run();
      }
      watchHandle.pause = effect.pause.bind(effect);
      watchHandle.resume = effect.resume.bind(effect);
      watchHandle.stop = watchHandle;
      return watchHandle;
    }
    function traverse(value, depth = Infinity, seen) {
      if (depth <= 0 || !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isObject)(value) || value["__v_skip"]) {
        return value;
      }
      seen = seen || new Map;
      if ((seen.get(value) || 0) >= depth) {
        return value;
      }
      seen.set(value, depth);
      depth--;
      if (isRef(value)) {
        traverse(value.value, depth, seen);
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isArray)(value)) {
        for (let i = 0; i < value.length; i++) {
          traverse(value[i], depth, seen);
        }
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isSet)(value) || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isMap)(value)) {
        value.forEach(v => {
          traverse(v, depth, seen);
        });
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_0__.isPlainObject)(value)) {
        for (const key in value) {
          traverse(value[key], depth, seen);
        }
        for (const key of Object.getOwnPropertySymbols(value)) {
          if (Object.prototype.propertyIsEnumerable.call(value, key)) {
            traverse(value[key], depth, seen);
          }
        }
      }
      return value;
    }
  },
  "./node_modules/.pnpm/@vue+runtime-core@3.5.35/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      BaseTransition: () => BaseTransition,
      BaseTransitionPropsValidators: () => BaseTransitionPropsValidators,
      Comment: () => Comment,
      DeprecationTypes: () => DeprecationTypes,
      EffectScope: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.EffectScope,
      ErrorCodes: () => ErrorCodes,
      ErrorTypeStrings: () => ErrorTypeStrings,
      Fragment: () => Fragment,
      KeepAlive: () => KeepAlive,
      ReactiveEffect: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.ReactiveEffect,
      Static: () => Static,
      Suspense: () => Suspense,
      Teleport: () => Teleport,
      Text: () => Text,
      TrackOpTypes: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.TrackOpTypes,
      TriggerOpTypes: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.TriggerOpTypes,
      assertNumber: () => assertNumber,
      callWithAsyncErrorHandling: () => callWithAsyncErrorHandling,
      callWithErrorHandling: () => callWithErrorHandling,
      camelize: () => _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize,
      capitalize: () => _vue_shared__WEBPACK_IMPORTED_MODULE_1__.capitalize,
      cloneVNode: () => cloneVNode,
      compatUtils: () => compatUtils,
      computed: () => computed,
      createBlock: () => createBlock,
      createCommentVNode: () => createCommentVNode,
      createElementBlock: () => createElementBlock,
      createElementVNode: () => createBaseVNode,
      createHydrationRenderer: () => createHydrationRenderer,
      createPropsRestProxy: () => createPropsRestProxy,
      createRenderer: () => createRenderer,
      createSlots: () => createSlots,
      createStaticVNode: () => createStaticVNode,
      createTextVNode: () => createTextVNode,
      createVNode: () => createVNode,
      customRef: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.customRef,
      defineAsyncComponent: () => defineAsyncComponent,
      defineComponent: () => defineComponent,
      defineEmits: () => defineEmits,
      defineExpose: () => defineExpose,
      defineModel: () => defineModel,
      defineOptions: () => defineOptions,
      defineProps: () => defineProps,
      defineSlots: () => defineSlots,
      devtools: () => devtools,
      effect: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.effect,
      effectScope: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.effectScope,
      getCurrentInstance: () => getCurrentInstance,
      getCurrentScope: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.getCurrentScope,
      getCurrentWatcher: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.getCurrentWatcher,
      getTransitionRawChildren: () => getTransitionRawChildren,
      guardReactiveProps: () => guardReactiveProps,
      h: () => h,
      handleError: () => handleError,
      hasInjectionContext: () => hasInjectionContext,
      hydrateOnIdle: () => hydrateOnIdle,
      hydrateOnInteraction: () => hydrateOnInteraction,
      hydrateOnMediaQuery: () => hydrateOnMediaQuery,
      hydrateOnVisible: () => hydrateOnVisible,
      initCustomFormatter: () => initCustomFormatter,
      inject: () => inject,
      isMemoSame: () => isMemoSame,
      isProxy: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isProxy,
      isReactive: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isReactive,
      isReadonly: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isReadonly,
      isRef: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isRef,
      isRuntimeOnly: () => isRuntimeOnly,
      isShallow: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isShallow,
      isVNode: () => isVNode,
      markRaw: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.markRaw,
      mergeDefaults: () => mergeDefaults,
      mergeModels: () => mergeModels,
      mergeProps: () => mergeProps,
      nextTick: () => nextTick,
      normalizeClass: () => _vue_shared__WEBPACK_IMPORTED_MODULE_1__.normalizeClass,
      normalizeProps: () => _vue_shared__WEBPACK_IMPORTED_MODULE_1__.normalizeProps,
      normalizeStyle: () => _vue_shared__WEBPACK_IMPORTED_MODULE_1__.normalizeStyle,
      onActivated: () => onActivated,
      onBeforeMount: () => onBeforeMount,
      onBeforeUnmount: () => onBeforeUnmount,
      onBeforeUpdate: () => onBeforeUpdate,
      onDeactivated: () => onDeactivated,
      onErrorCaptured: () => onErrorCaptured,
      onMounted: () => onMounted,
      onRenderTracked: () => onRenderTracked,
      onRenderTriggered: () => onRenderTriggered,
      onScopeDispose: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.onScopeDispose,
      onServerPrefetch: () => onServerPrefetch,
      onUnmounted: () => onUnmounted,
      onUpdated: () => onUpdated,
      onWatcherCleanup: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.onWatcherCleanup,
      openBlock: () => openBlock,
      popScopeId: () => popScopeId,
      provide: () => provide,
      proxyRefs: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.proxyRefs,
      pushScopeId: () => pushScopeId,
      queuePostFlushCb: () => queuePostFlushCb,
      reactive: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.reactive,
      readonly: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.readonly,
      ref: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.ref,
      registerRuntimeCompiler: () => registerRuntimeCompiler,
      renderList: () => renderList,
      renderSlot: () => renderSlot,
      resolveComponent: () => resolveComponent,
      resolveDirective: () => resolveDirective,
      resolveDynamicComponent: () => resolveDynamicComponent,
      resolveFilter: () => resolveFilter,
      resolveTransitionHooks: () => resolveTransitionHooks,
      setBlockTracking: () => setBlockTracking,
      setDevtoolsHook: () => setDevtoolsHook,
      setTransitionHooks: () => setTransitionHooks,
      shallowReactive: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReactive,
      shallowReadonly: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly,
      shallowRef: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowRef,
      ssrContextKey: () => ssrContextKey,
      ssrUtils: () => ssrUtils,
      stop: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.stop,
      toDisplayString: () => _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toDisplayString,
      toHandlerKey: () => _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toHandlerKey,
      toHandlers: () => toHandlers,
      toRaw: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw,
      toRef: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRef,
      toRefs: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRefs,
      toValue: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toValue,
      transformVNodeArgs: () => transformVNodeArgs,
      triggerRef: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.triggerRef,
      unref: () => _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.unref,
      useAttrs: () => useAttrs,
      useId: () => useId,
      useModel: () => useModel,
      useSSRContext: () => useSSRContext,
      useSlots: () => useSlots,
      useTemplateRef: () => useTemplateRef,
      useTransitionState: () => useTransitionState,
      version: () => version,
      warn: () => warn,
      watch: () => watch,
      watchEffect: () => watchEffect,
      watchPostEffect: () => watchPostEffect,
      watchSyncEffect: () => watchSyncEffect,
      withAsyncContext: () => withAsyncContext,
      withCtx: () => withCtx,
      withDefaults: () => withDefaults,
      withDirectives: () => withDirectives,
      withMemo: () => withMemo,
      withScopeId: () => withScopeId
    });
    var _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @vue/reactivity */ "./node_modules/.pnpm/@vue+reactivity@3.5.35/node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js");
    var _vue_shared__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @vue/shared */ "./node_modules/.pnpm/@vue+shared@3.5.35/node_modules/@vue/shared/dist/shared.esm-bundler.js");
    /**
* @vue/runtime-core v3.5.35
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/    const stack = [];
    function pushWarningContext(vnode) {
      stack.push(vnode);
    }
    function popWarningContext() {
      stack.pop();
    }
    let isWarning = false;
    function warn$1(msg, ...args) {
      if (isWarning) return;
      isWarning = true;
      (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.pauseTracking)();
      const instance = stack.length ? stack[stack.length - 1].component : null;
      const appWarnHandler = instance && instance.appContext.config.warnHandler;
      const trace = getComponentTrace();
      if (appWarnHandler) {
        callWithErrorHandling(appWarnHandler, instance, 11, [ msg + args.map(a => {
          var _a, _b;
          return (_b = (_a = a.toString) == null ? void 0 : _a.call(a)) != null ? _b : JSON.stringify(a);
        }).join(""), instance && instance.proxy, trace.map(({vnode}) => `at <${formatComponentName(instance, vnode.type)}>`).join("\n"), trace ]);
      } else {
        const warnArgs = [ `[Vue warn]: ${msg}`, ...args ];
        if (trace.length && true) {
          warnArgs.push(`\n`, ...formatTrace(trace));
        }
        console.warn(...warnArgs);
      }
      (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.resetTracking)();
      isWarning = false;
    }
    function getComponentTrace() {
      let currentVNode = stack[stack.length - 1];
      if (!currentVNode) {
        return [];
      }
      const normalizedStack = [];
      while (currentVNode) {
        const last = normalizedStack[0];
        if (last && last.vnode === currentVNode) {
          last.recurseCount++;
        } else {
          normalizedStack.push({
            vnode: currentVNode,
            recurseCount: 0
          });
        }
        const parentInstance = currentVNode.component && currentVNode.component.parent;
        currentVNode = parentInstance && parentInstance.vnode;
      }
      return normalizedStack;
    }
    function formatTrace(trace) {
      const logs = [];
      trace.forEach((entry, i) => {
        logs.push(...i === 0 ? [] : [ `\n` ], ...formatTraceEntry(entry));
      });
      return logs;
    }
    function formatTraceEntry({vnode, recurseCount}) {
      const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
      const isRoot = vnode.component ? vnode.component.parent == null : false;
      const open = ` at <${formatComponentName(vnode.component, vnode.type, isRoot)}`;
      const close = `>` + postfix;
      return vnode.props ? [ open, ...formatProps(vnode.props), close ] : [ open + close ];
    }
    function formatProps(props) {
      const res = [];
      const keys = Object.keys(props);
      keys.slice(0, 3).forEach(key => {
        res.push(...formatProp(key, props[key]));
      });
      if (keys.length > 3) {
        res.push(` ...`);
      }
      return res;
    }
    function formatProp(key, value, raw) {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(value)) {
        value = JSON.stringify(value);
        return raw ? value : [ `${key}=${value}` ];
      } else if (typeof value === "number" || typeof value === "boolean" || value == null) {
        return raw ? value : [ `${key}=${value}` ];
      } else if ((0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isRef)(value)) {
        value = formatProp(key, (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(value.value), true);
        return raw ? value : [ `${key}=Ref<`, value, `>` ];
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(value)) {
        return [ `${key}=fn${value.name ? `<${value.name}>` : ``}` ];
      } else {
        value = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(value);
        return raw ? value : [ `${key}=`, value ];
      }
    }
    function assertNumber(val, type) {
      if (false) {}
      if (val === void 0) {
        return;
      } else if (typeof val !== "number") {
        warn$1(`${type} is not a valid number - got ${JSON.stringify(val)}.`);
      } else if (isNaN(val)) {
        warn$1(`${type} is NaN - the duration expression might be incorrect.`);
      }
    }
    const ErrorCodes = {
      SETUP_FUNCTION: 0,
      0: "SETUP_FUNCTION",
      RENDER_FUNCTION: 1,
      1: "RENDER_FUNCTION",
      NATIVE_EVENT_HANDLER: 5,
      5: "NATIVE_EVENT_HANDLER",
      COMPONENT_EVENT_HANDLER: 6,
      6: "COMPONENT_EVENT_HANDLER",
      VNODE_HOOK: 7,
      7: "VNODE_HOOK",
      DIRECTIVE_HOOK: 8,
      8: "DIRECTIVE_HOOK",
      TRANSITION_HOOK: 9,
      9: "TRANSITION_HOOK",
      APP_ERROR_HANDLER: 10,
      10: "APP_ERROR_HANDLER",
      APP_WARN_HANDLER: 11,
      11: "APP_WARN_HANDLER",
      FUNCTION_REF: 12,
      12: "FUNCTION_REF",
      ASYNC_COMPONENT_LOADER: 13,
      13: "ASYNC_COMPONENT_LOADER",
      SCHEDULER: 14,
      14: "SCHEDULER",
      COMPONENT_UPDATE: 15,
      15: "COMPONENT_UPDATE",
      APP_UNMOUNT_CLEANUP: 16,
      16: "APP_UNMOUNT_CLEANUP"
    };
    const ErrorTypeStrings$1 = {
      ["sp"]: "serverPrefetch hook",
      ["bc"]: "beforeCreate hook",
      ["c"]: "created hook",
      ["bm"]: "beforeMount hook",
      ["m"]: "mounted hook",
      ["bu"]: "beforeUpdate hook",
      ["u"]: "updated",
      ["bum"]: "beforeUnmount hook",
      ["um"]: "unmounted hook",
      ["a"]: "activated hook",
      ["da"]: "deactivated hook",
      ["ec"]: "errorCaptured hook",
      ["rtc"]: "renderTracked hook",
      ["rtg"]: "renderTriggered hook",
      [0]: "setup function",
      [1]: "render function",
      [2]: "watcher getter",
      [3]: "watcher callback",
      [4]: "watcher cleanup function",
      [5]: "native event handler",
      [6]: "component event handler",
      [7]: "vnode hook",
      [8]: "directive hook",
      [9]: "transition hook",
      [10]: "app errorHandler",
      [11]: "app warnHandler",
      [12]: "ref function",
      [13]: "async component loader",
      [14]: "scheduler flush",
      [15]: "component update",
      [16]: "app unmount cleanup function"
    };
    function callWithErrorHandling(fn, instance, type, args) {
      try {
        return args ? fn(...args) : fn();
      } catch (err) {
        handleError(err, instance, type);
      }
    }
    function callWithAsyncErrorHandling(fn, instance, type, args) {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(fn)) {
        const res = callWithErrorHandling(fn, instance, type, args);
        if (res && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isPromise)(res)) {
          res.catch(err => {
            handleError(err, instance, type);
          });
        }
        return res;
      }
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(fn)) {
        const values = [];
        for (let i = 0; i < fn.length; i++) {
          values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
        }
        return values;
      } else if (true) {
        warn$1(`Invalid value type passed to callWithAsyncErrorHandling(): ${typeof fn}`);
      }
    }
    function handleError(err, instance, type, throwInDev = true) {
      const contextVNode = instance ? instance.vnode : null;
      const {errorHandler, throwUnhandledErrorInProduction} = instance && instance.appContext.config || _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ;
      if (instance) {
        let cur = instance.parent;
        const exposedInstance = instance.proxy;
        const errorInfo = true ? ErrorTypeStrings$1[type] : 0;
        while (cur) {
          const errorCapturedHooks = cur.ec;
          if (errorCapturedHooks) {
            for (let i = 0; i < errorCapturedHooks.length; i++) {
              if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
                return;
              }
            }
          }
          cur = cur.parent;
        }
        if (errorHandler) {
          (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.pauseTracking)();
          callWithErrorHandling(errorHandler, null, 10, [ err, exposedInstance, errorInfo ]);
          (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.resetTracking)();
          return;
        }
      }
      logError(err, type, contextVNode, throwInDev, throwUnhandledErrorInProduction);
    }
    function logError(err, type, contextVNode, throwInDev = true, throwInProd = false) {
      if (true) {
        const info = ErrorTypeStrings$1[type];
        if (contextVNode) {
          pushWarningContext(contextVNode);
        }
        warn$1(`Unhandled error${info ? ` during execution of ${info}` : ``}`);
        if (contextVNode) {
          popWarningContext();
        }
        if (throwInDev) {
          throw err;
        } else {
          console.error(err);
        }
      } else {}
    }
    const queue = [];
    let flushIndex = -1;
    const pendingPostFlushCbs = [];
    let activePostFlushCbs = null;
    let postFlushIndex = 0;
    const resolvedPromise = Promise.resolve();
    let currentFlushPromise = null;
    const RECURSION_LIMIT = 100;
    function nextTick(fn) {
      const p = currentFlushPromise || resolvedPromise;
      return fn ? p.then(this ? fn.bind(this) : fn) : p;
    }
    function findInsertionIndex(id) {
      let start = flushIndex + 1;
      let end = queue.length;
      while (start < end) {
        const middle = start + end >>> 1;
        const middleJob = queue[middle];
        const middleJobId = getId(middleJob);
        if (middleJobId < id || middleJobId === id && middleJob.flags & 2) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      return start;
    }
    function queueJob(job) {
      if (!(job.flags & 1)) {
        const jobId = getId(job);
        const lastJob = queue[queue.length - 1];
        if (!lastJob || !(job.flags & 2) && jobId >= getId(lastJob)) {
          queue.push(job);
        } else {
          queue.splice(findInsertionIndex(jobId), 0, job);
        }
        job.flags |= 1;
        queueFlush();
      }
    }
    function queueFlush() {
      if (!currentFlushPromise) {
        currentFlushPromise = resolvedPromise.then(flushJobs);
      }
    }
    function queuePostFlushCb(cb) {
      if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(cb)) {
        if (activePostFlushCbs && cb.id === -1) {
          activePostFlushCbs.splice(postFlushIndex + 1, 0, cb);
        } else if (!(cb.flags & 1)) {
          pendingPostFlushCbs.push(cb);
          cb.flags |= 1;
        }
      } else {
        pendingPostFlushCbs.push(...cb);
      }
      queueFlush();
    }
    function flushPreFlushCbs(instance, seen, i = flushIndex + 1) {
      if (true) {
        seen = seen || new Map;
      }
      for (;i < queue.length; i++) {
        const cb = queue[i];
        if (cb && cb.flags & 2) {
          if (instance && cb.id !== instance.uid) {
            continue;
          }
          if (true && checkRecursiveUpdates(seen, cb)) {
            continue;
          }
          queue.splice(i, 1);
          i--;
          if (cb.flags & 4) {
            cb.flags &= -2;
          }
          cb();
          if (!(cb.flags & 4)) {
            cb.flags &= -2;
          }
        }
      }
    }
    function flushPostFlushCbs(seen) {
      if (pendingPostFlushCbs.length) {
        const deduped = [ ...new Set(pendingPostFlushCbs) ].sort((a, b) => getId(a) - getId(b));
        pendingPostFlushCbs.length = 0;
        if (activePostFlushCbs) {
          activePostFlushCbs.push(...deduped);
          return;
        }
        activePostFlushCbs = deduped;
        if (true) {
          seen = seen || new Map;
        }
        for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
          const cb = activePostFlushCbs[postFlushIndex];
          if (true && checkRecursiveUpdates(seen, cb)) {
            continue;
          }
          if (cb.flags & 4) {
            cb.flags &= -2;
          }
          if (!(cb.flags & 8)) cb();
          cb.flags &= -2;
        }
        activePostFlushCbs = null;
        postFlushIndex = 0;
      }
    }
    const getId = job => job.id == null ? job.flags & 2 ? -1 : Infinity : job.id;
    function flushJobs(seen) {
      if (true) {
        seen = seen || new Map;
      }
      const check = true ? job => checkRecursiveUpdates(seen, job) : 0;
      try {
        for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
          const job = queue[flushIndex];
          if (job && !(job.flags & 8)) {
            if (true && check(job)) {
              continue;
            }
            if (job.flags & 4) {
              job.flags &= ~1;
            }
            callWithErrorHandling(job, job.i, job.i ? 15 : 14);
            if (!(job.flags & 4)) {
              job.flags &= ~1;
            }
          }
        }
      } finally {
        for (;flushIndex < queue.length; flushIndex++) {
          const job = queue[flushIndex];
          if (job) {
            job.flags &= -2;
          }
        }
        flushIndex = -1;
        queue.length = 0;
        flushPostFlushCbs(seen);
        currentFlushPromise = null;
        if (queue.length || pendingPostFlushCbs.length) {
          flushJobs(seen);
        }
      }
    }
    function checkRecursiveUpdates(seen, fn) {
      const count = seen.get(fn) || 0;
      if (count > RECURSION_LIMIT) {
        const instance = fn.i;
        const componentName = instance && getComponentName(instance.type);
        handleError(`Maximum recursive updates exceeded${componentName ? ` in component <${componentName}>` : ``}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`, null, 10);
        return true;
      }
      seen.set(fn, count + 1);
      return false;
    }
    let isHmrUpdating = false;
    const setHmrUpdating = v => {
      try {
        return isHmrUpdating;
      } finally {
        isHmrUpdating = v;
      }
    };
    const hmrDirtyComponents = new Map;
    if (true) {
      (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.getGlobalThis)().__VUE_HMR_RUNTIME__ = {
        createRecord: tryWrap(createRecord),
        rerender: tryWrap(rerender),
        reload: tryWrap(reload)
      };
    }
    const map = new Map;
    function registerHMR(instance) {
      const id = instance.type.__hmrId;
      let record = map.get(id);
      if (!record) {
        createRecord(id, instance.type);
        record = map.get(id);
      }
      record.instances.add(instance);
    }
    function unregisterHMR(instance) {
      map.get(instance.type.__hmrId).instances.delete(instance);
    }
    function createRecord(id, initialDef) {
      if (map.has(id)) {
        return false;
      }
      map.set(id, {
        initialDef: normalizeClassComponent(initialDef),
        instances: new Set
      });
      return true;
    }
    function normalizeClassComponent(component) {
      return isClassComponent(component) ? component.__vccOpts : component;
    }
    function rerender(id, newRender) {
      const record = map.get(id);
      if (!record) {
        return;
      }
      record.initialDef.render = newRender;
      [ ...record.instances ].forEach(instance => {
        if (newRender) {
          instance.render = newRender;
          normalizeClassComponent(instance.type).render = newRender;
        }
        instance.renderCache = [];
        isHmrUpdating = true;
        if (!(instance.job.flags & 8)) {
          instance.update();
        }
        isHmrUpdating = false;
      });
    }
    function reload(id, newComp) {
      const record = map.get(id);
      if (!record) return;
      newComp = normalizeClassComponent(newComp);
      updateComponentDef(record.initialDef, newComp);
      const instances = [ ...record.instances ];
      for (let i = 0; i < instances.length; i++) {
        const instance = instances[i];
        const oldComp = normalizeClassComponent(instance.type);
        let dirtyInstances = hmrDirtyComponents.get(oldComp);
        if (!dirtyInstances) {
          if (oldComp !== record.initialDef) {
            updateComponentDef(oldComp, newComp);
          }
          hmrDirtyComponents.set(oldComp, dirtyInstances = new Set);
        }
        dirtyInstances.add(instance);
        instance.appContext.propsCache.delete(instance.type);
        instance.appContext.emitsCache.delete(instance.type);
        instance.appContext.optionsCache.delete(instance.type);
        if (instance.ceReload) {
          dirtyInstances.add(instance);
          instance.ceReload(newComp.styles);
          dirtyInstances.delete(instance);
        } else if (instance.parent) {
          queueJob(() => {
            if (!(instance.job.flags & 8)) {
              isHmrUpdating = true;
              instance.parent.update();
              isHmrUpdating = false;
              dirtyInstances.delete(instance);
            }
          });
        } else if (instance.appContext.reload) {
          instance.appContext.reload();
        } else if (typeof window !== "undefined") {
          window.location.reload();
        } else {
          console.warn("[HMR] Root or manually mounted instance modified. Full reload required.");
        }
        if (instance.root.ce && instance !== instance.root) {
          instance.root.ce._removeChildStyle(oldComp);
        }
      }
      queuePostFlushCb(() => {
        hmrDirtyComponents.clear();
      });
    }
    function updateComponentDef(oldComp, newComp) {
      (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)(oldComp, newComp);
      for (const key in oldComp) {
        if (key !== "__file" && !(key in newComp)) {
          delete oldComp[key];
        }
      }
    }
    function tryWrap(fn) {
      return (id, arg) => {
        try {
          return fn(id, arg);
        } catch (e) {
          console.error(e);
          console.warn(`[HMR] Something went wrong during Vue component hot-reload. Full reload required.`);
        }
      };
    }
    let devtools$1;
    let buffer = [];
    let devtoolsNotInstalled = false;
    function emit$1(event, ...args) {
      if (devtools$1) {
        devtools$1.emit(event, ...args);
      } else if (!devtoolsNotInstalled) {
        buffer.push({
          event,
          args
        });
      }
    }
    function setDevtoolsHook$1(hook, target) {
      var _a, _b;
      devtools$1 = hook;
      if (devtools$1) {
        devtools$1.enabled = true;
        buffer.forEach(({event, args}) => devtools$1.emit(event, ...args));
        buffer = [];
      } else if (typeof window !== "undefined" && window.HTMLElement && !((_b = (_a = window.navigator) == null ? void 0 : _a.userAgent) == null ? void 0 : _b.includes("jsdom"))) {
        const replay = target.__VUE_DEVTOOLS_HOOK_REPLAY__ = target.__VUE_DEVTOOLS_HOOK_REPLAY__ || [];
        replay.push(newHook => {
          setDevtoolsHook$1(newHook, target);
        });
        setTimeout(() => {
          if (!devtools$1) {
            target.__VUE_DEVTOOLS_HOOK_REPLAY__ = null;
            devtoolsNotInstalled = true;
            buffer = [];
          }
        }, 3e3);
      } else {
        devtoolsNotInstalled = true;
        buffer = [];
      }
    }
    function devtoolsInitApp(app, version) {
      emit$1("app:init", app, version, {
        Fragment,
        Text,
        Comment,
        Static
      });
    }
    function devtoolsUnmountApp(app) {
      emit$1("app:unmount", app);
    }
    const devtoolsComponentAdded = createDevtoolsComponentHook("component:added");
    const devtoolsComponentUpdated = createDevtoolsComponentHook("component:updated");
    const _devtoolsComponentRemoved = createDevtoolsComponentHook("component:removed");
    const devtoolsComponentRemoved = component => {
      if (devtools$1 && typeof devtools$1.cleanupBuffer === "function" && !devtools$1.cleanupBuffer(component)) {
        _devtoolsComponentRemoved(component);
      }
    };
    function createDevtoolsComponentHook(hook) {
      return component => {
        emit$1(hook, component.appContext.app, component.uid, component.parent ? component.parent.uid : void 0, component);
      };
    }
    const devtoolsPerfStart = createDevtoolsPerformanceHook("perf:start");
    const devtoolsPerfEnd = createDevtoolsPerformanceHook("perf:end");
    function createDevtoolsPerformanceHook(hook) {
      return (component, type, time) => {
        emit$1(hook, component.appContext.app, component.uid, component, type, time);
      };
    }
    function devtoolsComponentEmit(component, event, params) {
      emit$1("component:emit", component.appContext.app, component, event, params);
    }
    let currentRenderingInstance = null;
    let currentScopeId = null;
    function setCurrentRenderingInstance(instance) {
      const prev = currentRenderingInstance;
      currentRenderingInstance = instance;
      currentScopeId = instance && instance.type.__scopeId || null;
      return prev;
    }
    function pushScopeId(id) {
      currentScopeId = id;
    }
    function popScopeId() {
      currentScopeId = null;
    }
    const withScopeId = _id => withCtx;
    function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
      if (!ctx) return fn;
      if (fn._n) {
        return fn;
      }
      const renderFnWithContext = (...args) => {
        if (renderFnWithContext._d) {
          setBlockTracking(-1);
        }
        const prevInstance = setCurrentRenderingInstance(ctx);
        let res;
        try {
          res = fn(...args);
        } finally {
          setCurrentRenderingInstance(prevInstance);
          if (renderFnWithContext._d) {
            setBlockTracking(1);
          }
        }
        if (true) {
          devtoolsComponentUpdated(ctx);
        }
        return res;
      };
      renderFnWithContext._n = true;
      renderFnWithContext._c = true;
      renderFnWithContext._d = true;
      return renderFnWithContext;
    }
    function validateDirectiveName(name) {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isBuiltInDirective)(name)) {
        warn$1("Do not use built-in directive ids as custom directive id: " + name);
      }
    }
    function withDirectives(vnode, directives) {
      if (currentRenderingInstance === null) {
        true && warn$1(`withDirectives can only be used inside render functions.`);
        return vnode;
      }
      const instance = getComponentPublicInstance(currentRenderingInstance);
      const bindings = vnode.dirs || (vnode.dirs = []);
      for (let i = 0; i < directives.length; i++) {
        let [dir, value, arg, modifiers = _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ] = directives[i];
        if (dir) {
          if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(dir)) {
            dir = {
              mounted: dir,
              updated: dir
            };
          }
          if (dir.deep) {
            (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.traverse)(value);
          }
          bindings.push({
            dir,
            instance,
            value,
            oldValue: void 0,
            arg,
            modifiers
          });
        }
      }
      return vnode;
    }
    function invokeDirectiveHook(vnode, prevVNode, instance, name) {
      const bindings = vnode.dirs;
      const oldBindings = prevVNode && prevVNode.dirs;
      for (let i = 0; i < bindings.length; i++) {
        const binding = bindings[i];
        if (oldBindings) {
          binding.oldValue = oldBindings[i].value;
        }
        let hook = binding.dir[name];
        if (hook) {
          (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.pauseTracking)();
          callWithAsyncErrorHandling(hook, instance, 8, [ vnode.el, binding, vnode, prevVNode ]);
          (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.resetTracking)();
        }
      }
    }
    function provide(key, value) {
      if (true) {
        if (!currentInstance || currentInstance.isMounted) {
          warn$1(`provide() can only be used inside setup().`);
        }
      }
      if (currentInstance) {
        let provides = currentInstance.provides;
        const parentProvides = currentInstance.parent && currentInstance.parent.provides;
        if (parentProvides === provides) {
          provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
      }
    }
    function inject(key, defaultValue, treatDefaultAsFactory = false) {
      const instance = getCurrentInstance();
      if (instance || currentApp) {
        let provides = currentApp ? currentApp._context.provides : instance ? instance.parent == null || instance.ce ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides : void 0;
        if (provides && key in provides) {
          return provides[key];
        } else if (arguments.length > 1) {
          return treatDefaultAsFactory && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(defaultValue) ? defaultValue.call(instance && instance.proxy) : defaultValue;
        } else if (true) {
          warn$1(`injection "${String(key)}" not found.`);
        }
      } else if (true) {
        warn$1(`inject() can only be used inside setup() or functional components.`);
      }
    }
    function hasInjectionContext() {
      return !!(getCurrentInstance() || currentApp);
    }
    const ssrContextKey = Symbol.for("v-scx");
    const useSSRContext = () => {
      {
        const ctx = inject(ssrContextKey);
        if (!ctx) {
          true && warn$1(`Server rendering context not provided. Make sure to only call useSSRContext() conditionally in the server build.`);
        }
        return ctx;
      }
    };
    function watchEffect(effect, options) {
      return doWatch(effect, null, options);
    }
    function watchPostEffect(effect, options) {
      return doWatch(effect, null, true ? (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({}, options, {
        flush: "post"
      }) : 0);
    }
    function watchSyncEffect(effect, options) {
      return doWatch(effect, null, true ? (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({}, options, {
        flush: "sync"
      }) : 0);
    }
    function watch(source, cb, options) {
      if (true && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(cb)) {
        warn$1(`\`watch(fn, options?)\` signature has been moved to a separate API. Use \`watchEffect(fn, options?)\` instead. \`watch\` now only supports \`watch(source, cb, options?) signature.`);
      }
      return doWatch(source, cb, options);
    }
    function doWatch(source, cb, options = _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ) {
      const {immediate, deep, flush, once} = options;
      if (true && !cb) {
        if (immediate !== void 0) {
          warn$1(`watch() "immediate" option is only respected when using the watch(source, callback, options?) signature.`);
        }
        if (deep !== void 0) {
          warn$1(`watch() "deep" option is only respected when using the watch(source, callback, options?) signature.`);
        }
        if (once !== void 0) {
          warn$1(`watch() "once" option is only respected when using the watch(source, callback, options?) signature.`);
        }
      }
      const baseWatchOptions = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({}, options);
      if (true) baseWatchOptions.onWarn = warn$1;
      const runsImmediately = cb && immediate || !cb && flush !== "post";
      let ssrCleanup;
      if (isInSSRComponentSetup) {
        if (flush === "sync") {
          const ctx = useSSRContext();
          ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
        } else if (!runsImmediately) {
          const watchStopHandle = () => {};
          watchStopHandle.stop = _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP;
          watchStopHandle.resume = _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP;
          watchStopHandle.pause = _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP;
          return watchStopHandle;
        }
      }
      const instance = currentInstance;
      baseWatchOptions.call = (fn, type, args) => callWithAsyncErrorHandling(fn, instance, type, args);
      let isPre = false;
      if (flush === "post") {
        baseWatchOptions.scheduler = job => {
          queuePostRenderEffect(job, instance && instance.suspense);
        };
      } else if (flush !== "sync") {
        isPre = true;
        baseWatchOptions.scheduler = (job, isFirstRun) => {
          if (isFirstRun) {
            job();
          } else {
            queueJob(job);
          }
        };
      }
      baseWatchOptions.augmentJob = job => {
        if (cb) {
          job.flags |= 4;
        }
        if (isPre) {
          job.flags |= 2;
          if (instance) {
            job.id = instance.uid;
            job.i = instance;
          }
        }
      };
      const watchHandle = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.watch)(source, cb, baseWatchOptions);
      if (isInSSRComponentSetup) {
        if (ssrCleanup) {
          ssrCleanup.push(watchHandle);
        } else if (runsImmediately) {
          watchHandle();
        }
      }
      return watchHandle;
    }
    function instanceWatch(source, value, options) {
      const publicThis = this.proxy;
      const getter = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(source) ? source.includes(".") ? createPathGetter(publicThis, source) : () => publicThis[source] : source.bind(publicThis, publicThis);
      let cb;
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(value)) {
        cb = value;
      } else {
        cb = value.handler;
        options = value;
      }
      const reset = setCurrentInstance(this);
      const res = doWatch(getter, cb.bind(publicThis), options);
      reset();
      return res;
    }
    function createPathGetter(ctx, path) {
      const segments = path.split(".");
      return () => {
        let cur = ctx;
        for (let i = 0; i < segments.length && cur; i++) {
          cur = cur[segments[i]];
        }
        return cur;
      };
    }
    const pendingMounts = new WeakMap;
    const TeleportEndKey = Symbol("_vte");
    const isTeleport = type => type.__isTeleport;
    const isTeleportDisabled = props => props && (props.disabled || props.disabled === "");
    const isTeleportDeferred = props => props && (props.defer || props.defer === "");
    const isTargetSVG = target => typeof SVGElement !== "undefined" && target instanceof SVGElement;
    const isTargetMathML = target => typeof MathMLElement === "function" && target instanceof MathMLElement;
    const resolveTarget = (props, select) => {
      const targetSelector = props && props.to;
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(targetSelector)) {
        if (!select) {
          true && warn$1(`Current renderer does not support string target for Teleports. (missing querySelector renderer option)`);
          return null;
        } else {
          const target = select(targetSelector);
          if (true && !target && !isTeleportDisabled(props)) {
            warn$1(`Failed to locate Teleport target with selector "${targetSelector}". Note the target element must exist before the component is mounted - i.e. the target cannot be rendered by the component itself, and ideally should be outside of the entire Vue component tree.`);
          }
          return target;
        }
      } else {
        if (true && !targetSelector && !isTeleportDisabled(props)) {
          warn$1(`Invalid Teleport target: ${targetSelector}`);
        }
        return targetSelector;
      }
    };
    const TeleportImpl = {
      name: "Teleport",
      __isTeleport: true,
      process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals) {
        const {mc: mountChildren, pc: patchChildren, pbc: patchBlockChildren, o: {insert, querySelector, createText, createComment, parentNode}} = internals;
        const disabled = isTeleportDisabled(n2.props);
        let {dynamicChildren} = n2;
        if (true && isHmrUpdating) {
          optimized = false;
          dynamicChildren = null;
        }
        const mount = (vnode, container2, anchor2) => {
          if (vnode.shapeFlag & 16) {
            mountChildren(vnode.children, container2, anchor2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
          }
        };
        const mountToTarget = (vnode = n2) => {
          const disabled2 = isTeleportDisabled(vnode.props);
          const target = vnode.target = resolveTarget(vnode.props, querySelector);
          const targetAnchor = prepareAnchor(target, vnode, createText, insert);
          if (target) {
            if (namespace !== "svg" && isTargetSVG(target)) {
              namespace = "svg";
            } else if (namespace !== "mathml" && isTargetMathML(target)) {
              namespace = "mathml";
            }
            if (parentComponent && parentComponent.isCE) {
              (parentComponent.ce._teleportTargets || (parentComponent.ce._teleportTargets = new Set)).add(target);
            }
            if (!disabled2) {
              mount(vnode, target, targetAnchor);
              updateCssVars(vnode, false);
            }
          } else if (true && !disabled2) {
            warn$1("Invalid Teleport target on mount:", target, `(${typeof target})`);
          }
        };
        const queuePendingMount = vnode => {
          const mountJob = () => {
            if (pendingMounts.get(vnode) !== mountJob) return;
            pendingMounts.delete(vnode);
            if (isTeleportDisabled(vnode.props)) {
              const mountContainer = parentNode(vnode.el) || container;
              mount(vnode, mountContainer, vnode.anchor);
              updateCssVars(vnode, true);
            }
            mountToTarget(vnode);
          };
          pendingMounts.set(vnode, mountJob);
          queuePostRenderEffect(mountJob, parentSuspense);
        };
        if (n1 == null) {
          const placeholder = n2.el = true ? createComment("teleport start") : 0;
          const mainAnchor = n2.anchor = true ? createComment("teleport end") : 0;
          insert(placeholder, container, anchor);
          insert(mainAnchor, container, anchor);
          if (isTeleportDeferred(n2.props) || parentSuspense && parentSuspense.pendingBranch) {
            queuePendingMount(n2);
            return;
          }
          if (disabled) {
            mount(n2, container, mainAnchor);
            updateCssVars(n2, true);
          }
          mountToTarget();
        } else {
          n2.el = n1.el;
          const mainAnchor = n2.anchor = n1.anchor;
          const pendingMount = pendingMounts.get(n1);
          if (pendingMount) {
            pendingMount.flags |= 8;
            pendingMounts.delete(n1);
            queuePendingMount(n2);
            return;
          }
          n2.targetStart = n1.targetStart;
          const target = n2.target = n1.target;
          const targetAnchor = n2.targetAnchor = n1.targetAnchor;
          const wasDisabled = isTeleportDisabled(n1.props);
          const currentContainer = wasDisabled ? container : target;
          const currentAnchor = wasDisabled ? mainAnchor : targetAnchor;
          if (namespace === "svg" || isTargetSVG(target)) {
            namespace = "svg";
          } else if (namespace === "mathml" || isTargetMathML(target)) {
            namespace = "mathml";
          }
          if (dynamicChildren) {
            patchBlockChildren(n1.dynamicChildren, dynamicChildren, currentContainer, parentComponent, parentSuspense, namespace, slotScopeIds);
            traverseStaticChildren(n1, n2, !!!("development" !== "production"));
          } else if (!optimized) {
            patchChildren(n1, n2, currentContainer, currentAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, false);
          }
          if (disabled) {
            if (!wasDisabled) {
              moveTeleport(n2, container, mainAnchor, internals, 1);
            } else {
              if (n2.props && n1.props && n2.props.to !== n1.props.to) {
                n2.props.to = n1.props.to;
              }
            }
          } else {
            if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) {
              const nextTarget = n2.target = resolveTarget(n2.props, querySelector);
              if (nextTarget) {
                moveTeleport(n2, nextTarget, null, internals, 0);
              } else if (true) {
                warn$1("Invalid Teleport target on update:", target, `(${typeof target})`);
              }
            } else if (wasDisabled) {
              moveTeleport(n2, target, targetAnchor, internals, 1);
            }
          }
          updateCssVars(n2, disabled);
        }
      },
      remove(vnode, parentComponent, parentSuspense, {um: unmount, o: {remove: hostRemove}}, doRemove) {
        const {shapeFlag, children, anchor, targetStart, targetAnchor, target, props} = vnode;
        const shouldRemove = doRemove || !isTeleportDisabled(props);
        const pendingMount = pendingMounts.get(vnode);
        if (pendingMount) {
          pendingMount.flags |= 8;
          pendingMounts.delete(vnode);
        }
        if (target) {
          hostRemove(targetStart);
          hostRemove(targetAnchor);
        }
        doRemove && hostRemove(anchor);
        if (!pendingMount && shapeFlag & 16) {
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            unmount(child, parentComponent, parentSuspense, shouldRemove, !!child.dynamicChildren);
          }
        }
      },
      move: moveTeleport,
      hydrate: hydrateTeleport
    };
    function moveTeleport(vnode, container, parentAnchor, {o: {insert}, m: move}, moveType = 2) {
      if (moveType === 0) {
        insert(vnode.targetAnchor, container, parentAnchor);
      }
      const {el, anchor, shapeFlag, children, props} = vnode;
      const isReorder = moveType === 2;
      if (isReorder) {
        insert(el, container, parentAnchor);
      }
      if (!pendingMounts.has(vnode) && (!isReorder || isTeleportDisabled(props))) {
        if (shapeFlag & 16) {
          for (let i = 0; i < children.length; i++) {
            move(children[i], container, parentAnchor, 2);
          }
        }
      }
      if (isReorder) {
        insert(anchor, container, parentAnchor);
      }
    }
    function hydrateTeleport(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized, {o: {nextSibling, parentNode, querySelector, insert, createText}}, hydrateChildren) {
      function hydrateAnchor(target2, targetNode) {
        let targetAnchor = targetNode;
        while (targetAnchor) {
          if (targetAnchor && targetAnchor.nodeType === 8) {
            if (targetAnchor.data === "teleport start anchor") {
              vnode.targetStart = targetAnchor;
            } else if (targetAnchor.data === "teleport anchor") {
              vnode.targetAnchor = targetAnchor;
              target2._lpa = vnode.targetAnchor && nextSibling(vnode.targetAnchor);
              break;
            }
          }
          targetAnchor = nextSibling(targetAnchor);
        }
      }
      function hydrateDisabledTeleport(node2, vnode2) {
        vnode2.anchor = hydrateChildren(nextSibling(node2), vnode2, parentNode(node2), parentComponent, parentSuspense, slotScopeIds, optimized);
      }
      const target = vnode.target = resolveTarget(vnode.props, querySelector);
      const disabled = isTeleportDisabled(vnode.props);
      if (target) {
        const targetNode = target._lpa || target.firstChild;
        if (vnode.shapeFlag & 16) {
          if (disabled) {
            hydrateDisabledTeleport(node, vnode);
            hydrateAnchor(target, targetNode);
            if (!vnode.targetAnchor) {
              prepareAnchor(target, vnode, createText, insert, parentNode(node) === target ? node : null);
            }
          } else {
            vnode.anchor = nextSibling(node);
            hydrateAnchor(target, targetNode);
            if (!vnode.targetAnchor) {
              prepareAnchor(target, vnode, createText, insert);
            }
            hydrateChildren(targetNode && nextSibling(targetNode), vnode, target, parentComponent, parentSuspense, slotScopeIds, optimized);
          }
        }
        updateCssVars(vnode, disabled);
      } else if (disabled) {
        if (vnode.shapeFlag & 16) {
          hydrateDisabledTeleport(node, vnode);
          vnode.targetStart = node;
          vnode.targetAnchor = nextSibling(node);
        }
      }
      return vnode.anchor && nextSibling(vnode.anchor);
    }
    const Teleport = TeleportImpl;
    function updateCssVars(vnode, isDisabled) {
      const ctx = vnode.ctx;
      if (ctx && ctx.ut) {
        let node, anchor;
        if (isDisabled) {
          node = vnode.el;
          anchor = vnode.anchor;
        } else {
          node = vnode.targetStart;
          anchor = vnode.targetAnchor;
        }
        while (node && node !== anchor) {
          if (node.nodeType === 1) node.setAttribute("data-v-owner", ctx.uid);
          node = node.nextSibling;
        }
        ctx.ut();
      }
    }
    function prepareAnchor(target, vnode, createText, insert, anchor = null) {
      const targetStart = vnode.targetStart = createText("");
      const targetAnchor = vnode.targetAnchor = createText("");
      targetStart[TeleportEndKey] = targetAnchor;
      if (target) {
        insert(targetStart, target, anchor);
        insert(targetAnchor, target, anchor);
      }
      return targetAnchor;
    }
    const leaveCbKey = Symbol("_leaveCb");
    const enterCbKey = Symbol("_enterCb");
    function useTransitionState() {
      const state = {
        isMounted: false,
        isLeaving: false,
        isUnmounting: false,
        leavingVNodes: new Map
      };
      onMounted(() => {
        state.isMounted = true;
      });
      onBeforeUnmount(() => {
        state.isUnmounting = true;
      });
      return state;
    }
    const TransitionHookValidator = [ Function, Array ];
    const BaseTransitionPropsValidators = {
      mode: String,
      appear: Boolean,
      persisted: Boolean,
      onBeforeEnter: TransitionHookValidator,
      onEnter: TransitionHookValidator,
      onAfterEnter: TransitionHookValidator,
      onEnterCancelled: TransitionHookValidator,
      onBeforeLeave: TransitionHookValidator,
      onLeave: TransitionHookValidator,
      onAfterLeave: TransitionHookValidator,
      onLeaveCancelled: TransitionHookValidator,
      onBeforeAppear: TransitionHookValidator,
      onAppear: TransitionHookValidator,
      onAfterAppear: TransitionHookValidator,
      onAppearCancelled: TransitionHookValidator
    };
    const recursiveGetSubtree = instance => {
      const subTree = instance.subTree;
      return subTree.component ? recursiveGetSubtree(subTree.component) : subTree;
    };
    const BaseTransitionImpl = {
      name: `BaseTransition`,
      props: BaseTransitionPropsValidators,
      setup(props, {slots}) {
        const instance = getCurrentInstance();
        const state = useTransitionState();
        return () => {
          const children = slots.default && getTransitionRawChildren(slots.default(), true);
          const child = children && children.length ? findNonCommentChild(children) : instance.subTree ? createCommentVNode() : void 0;
          if (!child) {
            return;
          }
          const rawProps = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(props);
          const {mode} = rawProps;
          if (true && mode && mode !== "in-out" && mode !== "out-in" && mode !== "default") {
            warn$1(`invalid <transition> mode: ${mode}`);
          }
          if (state.isLeaving) {
            return emptyPlaceholder(child);
          }
          const innerChild = getInnerChild$1(child);
          if (!innerChild) {
            return emptyPlaceholder(child);
          }
          let enterHooks = resolveTransitionHooks(innerChild, rawProps, state, instance, hooks => enterHooks = hooks);
          if (innerChild.type !== Comment) {
            setTransitionHooks(innerChild, enterHooks);
          }
          let oldInnerChild = instance.subTree && getInnerChild$1(instance.subTree);
          if (oldInnerChild && oldInnerChild.type !== Comment && !isSameVNodeType(oldInnerChild, innerChild) && recursiveGetSubtree(instance).type !== Comment) {
            let leavingHooks = resolveTransitionHooks(oldInnerChild, rawProps, state, instance);
            setTransitionHooks(oldInnerChild, leavingHooks);
            if (mode === "out-in" && innerChild.type !== Comment) {
              state.isLeaving = true;
              leavingHooks.afterLeave = () => {
                state.isLeaving = false;
                if (!(instance.job.flags & 8)) {
                  instance.update();
                }
                delete leavingHooks.afterLeave;
                oldInnerChild = void 0;
              };
              return emptyPlaceholder(child);
            } else if (mode === "in-out" && innerChild.type !== Comment) {
              leavingHooks.delayLeave = (el, earlyRemove, delayedLeave) => {
                const leavingVNodesCache = getLeavingNodesForType(state, oldInnerChild);
                leavingVNodesCache[String(oldInnerChild.key)] = oldInnerChild;
                el[leaveCbKey] = () => {
                  earlyRemove();
                  el[leaveCbKey] = void 0;
                  delete enterHooks.delayedLeave;
                  oldInnerChild = void 0;
                };
                enterHooks.delayedLeave = () => {
                  delayedLeave();
                  delete enterHooks.delayedLeave;
                  oldInnerChild = void 0;
                };
              };
            } else {
              oldInnerChild = void 0;
            }
          } else if (oldInnerChild) {
            oldInnerChild = void 0;
          }
          return child;
        };
      }
    };
    function findNonCommentChild(children) {
      let child = children[0];
      if (children.length > 1) {
        let hasFound = false;
        for (const c of children) {
          if (c.type !== Comment) {
            if (true && hasFound) {
              warn$1("<transition> can only be used on a single element or component. Use <transition-group> for lists.");
              break;
            }
            child = c;
            hasFound = true;
            if (false) {}
          }
        }
      }
      return child;
    }
    const BaseTransition = BaseTransitionImpl;
    function getLeavingNodesForType(state, vnode) {
      const {leavingVNodes} = state;
      let leavingVNodesCache = leavingVNodes.get(vnode.type);
      if (!leavingVNodesCache) {
        leavingVNodesCache = Object.create(null);
        leavingVNodes.set(vnode.type, leavingVNodesCache);
      }
      return leavingVNodesCache;
    }
    function resolveTransitionHooks(vnode, props, state, instance, postClone) {
      const {appear, mode, persisted = false, onBeforeEnter, onEnter, onAfterEnter, onEnterCancelled, onBeforeLeave, onLeave, onAfterLeave, onLeaveCancelled, onBeforeAppear, onAppear, onAfterAppear, onAppearCancelled} = props;
      const key = String(vnode.key);
      const leavingVNodesCache = getLeavingNodesForType(state, vnode);
      const callHook = (hook, args) => {
        hook && callWithAsyncErrorHandling(hook, instance, 9, args);
      };
      const callAsyncHook = (hook, args) => {
        const done = args[1];
        callHook(hook, args);
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(hook)) {
          if (hook.every(hook2 => hook2.length <= 1)) done();
        } else if (hook.length <= 1) {
          done();
        }
      };
      const hooks = {
        mode,
        persisted,
        beforeEnter(el) {
          let hook = onBeforeEnter;
          if (!state.isMounted) {
            if (appear) {
              hook = onBeforeAppear || onBeforeEnter;
            } else {
              return;
            }
          }
          if (el[leaveCbKey]) {
            el[leaveCbKey](true);
          }
          const leavingVNode = leavingVNodesCache[key];
          if (leavingVNode && isSameVNodeType(vnode, leavingVNode) && leavingVNode.el[leaveCbKey]) {
            leavingVNode.el[leaveCbKey]();
          }
          callHook(hook, [ el ]);
        },
        enter(el) {
          if (!isHmrUpdating && leavingVNodesCache[key] === vnode) return;
          let hook = onEnter;
          let afterHook = onAfterEnter;
          let cancelHook = onEnterCancelled;
          if (!state.isMounted) {
            if (appear) {
              hook = onAppear || onEnter;
              afterHook = onAfterAppear || onAfterEnter;
              cancelHook = onAppearCancelled || onEnterCancelled;
            } else {
              return;
            }
          }
          let called = false;
          el[enterCbKey] = cancelled => {
            if (called) return;
            called = true;
            if (cancelled) {
              callHook(cancelHook, [ el ]);
            } else {
              callHook(afterHook, [ el ]);
            }
            if (hooks.delayedLeave) {
              hooks.delayedLeave();
            }
            el[enterCbKey] = void 0;
          };
          const done = el[enterCbKey].bind(null, false);
          if (hook) {
            callAsyncHook(hook, [ el, done ]);
          } else {
            done();
          }
        },
        leave(el, remove) {
          const key2 = String(vnode.key);
          if (el[enterCbKey]) {
            el[enterCbKey](true);
          }
          if (state.isUnmounting) {
            return remove();
          }
          callHook(onBeforeLeave, [ el ]);
          let called = false;
          el[leaveCbKey] = cancelled => {
            if (called) return;
            called = true;
            remove();
            if (cancelled) {
              callHook(onLeaveCancelled, [ el ]);
            } else {
              callHook(onAfterLeave, [ el ]);
            }
            el[leaveCbKey] = void 0;
            if (leavingVNodesCache[key2] === vnode) {
              delete leavingVNodesCache[key2];
            }
          };
          const done = el[leaveCbKey].bind(null, false);
          leavingVNodesCache[key2] = vnode;
          if (onLeave) {
            callAsyncHook(onLeave, [ el, done ]);
          } else {
            done();
          }
        },
        clone(vnode2) {
          const hooks2 = resolveTransitionHooks(vnode2, props, state, instance, postClone);
          if (postClone) postClone(hooks2);
          return hooks2;
        }
      };
      return hooks;
    }
    function emptyPlaceholder(vnode) {
      if (isKeepAlive(vnode)) {
        vnode = cloneVNode(vnode);
        vnode.children = null;
        return vnode;
      }
    }
    function getInnerChild$1(vnode) {
      if (!isKeepAlive(vnode)) {
        if (isTeleport(vnode.type) && vnode.children) {
          return findNonCommentChild(vnode.children);
        }
        return vnode;
      }
      if (vnode.component) {
        return vnode.component.subTree;
      }
      const {shapeFlag, children} = vnode;
      if (children) {
        if (shapeFlag & 16) {
          return children[0];
        }
        if (shapeFlag & 32 && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(children.default)) {
          return children.default();
        }
      }
    }
    function setTransitionHooks(vnode, hooks) {
      if (vnode.shapeFlag & 6 && vnode.component) {
        vnode.transition = hooks;
        setTransitionHooks(vnode.component.subTree, hooks);
      } else if (vnode.shapeFlag & 128) {
        vnode.ssContent.transition = hooks.clone(vnode.ssContent);
        vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
      } else {
        vnode.transition = hooks;
      }
    }
    function getTransitionRawChildren(children, keepComment = false, parentKey) {
      let ret = [];
      let keyedFragmentCount = 0;
      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        const key = parentKey == null ? child.key : String(parentKey) + String(child.key != null ? child.key : i);
        if (child.type === Fragment) {
          if (child.patchFlag & 128) keyedFragmentCount++;
          ret = ret.concat(getTransitionRawChildren(child.children, keepComment, key));
        } else if (keepComment || child.type !== Comment) {
          ret.push(key != null ? cloneVNode(child, {
            key
          }) : child);
        }
      }
      if (keyedFragmentCount > 1) {
        for (let i = 0; i < ret.length; i++) {
          ret[i].patchFlag = -2;
        }
      }
      return ret;
    }
    function defineComponent(options, extraOptions) {
      return (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(options) ? (() => (0, 
      _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({
        name: options.name
      }, extraOptions, {
        setup: options
      }))() : options;
    }
    function useId() {
      const i = getCurrentInstance();
      if (i) {
        return (i.appContext.config.idPrefix || "v") + "-" + i.ids[0] + i.ids[1]++;
      } else if (true) {
        warn$1(`useId() is called when there is no active component instance to be associated with.`);
      }
      return "";
    }
    function markAsyncBoundary(instance) {
      instance.ids = [ instance.ids[0] + instance.ids[2]++ + "-", 0, 0 ];
    }
    const knownTemplateRefs = new WeakSet;
    function useTemplateRef(key) {
      const i = getCurrentInstance();
      const r = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowRef)(null);
      if (i) {
        const refs = i.refs === _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ ? i.refs = {} : i.refs;
        if (true && isTemplateRefKey(refs, key)) {
          warn$1(`useTemplateRef('${key}') already exists.`);
        } else {
          Object.defineProperty(refs, key, {
            enumerable: true,
            get: () => r.value,
            set: val => r.value = val
          });
        }
      } else if (true) {
        warn$1(`useTemplateRef() is called when there is no active component instance to be associated with.`);
      }
      const ret = true ? (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.readonly)(r) : 0;
      if (true) {
        knownTemplateRefs.add(ret);
      }
      return ret;
    }
    function isTemplateRefKey(refs, key) {
      let desc;
      return !!((desc = Object.getOwnPropertyDescriptor(refs, key)) && !desc.configurable);
    }
    const pendingSetRefMap = new WeakMap;
    function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(rawRef)) {
        rawRef.forEach((r, i) => setRef(r, oldRawRef && ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(oldRawRef) ? oldRawRef[i] : oldRawRef), parentSuspense, vnode, isUnmount));
        return;
      }
      if (isAsyncWrapper(vnode) && !isUnmount) {
        if (vnode.shapeFlag & 512 && vnode.type.__asyncResolved && vnode.component.subTree.component) {
          setRef(rawRef, oldRawRef, parentSuspense, vnode.component.subTree);
        }
        return;
      }
      const refValue = vnode.shapeFlag & 4 ? getComponentPublicInstance(vnode.component) : vnode.el;
      const value = isUnmount ? null : refValue;
      const {i: owner, r: ref} = rawRef;
      if (true && !owner) {
        warn$1(`Missing ref owner context. ref cannot be used on hoisted vnodes. A vnode with ref must be created inside the render function.`);
        return;
      }
      const oldRef = oldRawRef && oldRawRef.r;
      const refs = owner.refs === _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ ? owner.refs = {} : owner.refs;
      const setupState = owner.setupState;
      const rawSetupState = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(setupState);
      const canSetSetupRef = setupState === _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ ? _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NO : key => {
        if (true) {
          if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(rawSetupState, key) && !(0, 
          _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isRef)(rawSetupState[key])) {
            warn$1(`Template ref "${key}" used on a non-ref value. It will not work in the production build.`);
          }
          if (knownTemplateRefs.has(rawSetupState[key])) {
            return false;
          }
        }
        if (isTemplateRefKey(refs, key)) {
          return false;
        }
        return (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(rawSetupState, key);
      };
      const canSetRef = (ref2, key) => {
        if (true && knownTemplateRefs.has(ref2)) {
          return false;
        }
        if (key && isTemplateRefKey(refs, key)) {
          return false;
        }
        return true;
      };
      if (oldRef != null && oldRef !== ref) {
        invalidatePendingSetRef(oldRawRef);
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(oldRef)) {
          refs[oldRef] = null;
          if (canSetSetupRef(oldRef)) {
            setupState[oldRef] = null;
          }
        } else if ((0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isRef)(oldRef)) {
          const oldRawRefAtom = oldRawRef;
          if (canSetRef(oldRef, oldRawRefAtom.k)) {
            oldRef.value = null;
          }
          if (oldRawRefAtom.k) refs[oldRawRefAtom.k] = null;
        }
      }
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(ref)) {
        callWithErrorHandling(ref, owner, 12, [ value, refs ]);
      } else {
        const _isString = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(ref);
        const _isRef = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isRef)(ref);
        if (_isString || _isRef) {
          const doSet = () => {
            if (rawRef.f) {
              const existing = _isString ? canSetSetupRef(ref) ? setupState[ref] : refs[ref] : canSetRef(ref) || !rawRef.k ? ref.value : refs[rawRef.k];
              if (isUnmount) {
                (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(existing) && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.remove)(existing, refValue);
              } else {
                if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(existing)) {
                  if (_isString) {
                    refs[ref] = [ refValue ];
                    if (canSetSetupRef(ref)) {
                      setupState[ref] = refs[ref];
                    }
                  } else {
                    const newVal = [ refValue ];
                    if (canSetRef(ref, rawRef.k)) {
                      ref.value = newVal;
                    }
                    if (rawRef.k) refs[rawRef.k] = newVal;
                  }
                } else if (!existing.includes(refValue)) {
                  existing.push(refValue);
                }
              }
            } else if (_isString) {
              refs[ref] = value;
              if (canSetSetupRef(ref)) {
                setupState[ref] = value;
              }
            } else if (_isRef) {
              if (canSetRef(ref, rawRef.k)) {
                ref.value = value;
              }
              if (rawRef.k) refs[rawRef.k] = value;
            } else if (true) {
              warn$1("Invalid template ref type:", ref, `(${typeof ref})`);
            }
          };
          if (value) {
            const job = () => {
              doSet();
              pendingSetRefMap.delete(rawRef);
            };
            job.id = -1;
            pendingSetRefMap.set(rawRef, job);
            queuePostRenderEffect(job, parentSuspense);
          } else {
            invalidatePendingSetRef(rawRef);
            doSet();
          }
        } else if (true) {
          warn$1("Invalid template ref type:", ref, `(${typeof ref})`);
        }
      }
    }
    function invalidatePendingSetRef(rawRef) {
      const pendingSetRef = pendingSetRefMap.get(rawRef);
      if (pendingSetRef) {
        pendingSetRef.flags |= 8;
        pendingSetRefMap.delete(rawRef);
      }
    }
    let hasLoggedMismatchError = false;
    const logMismatchError = () => {
      if (hasLoggedMismatchError) {
        return;
      }
      console.error("Hydration completed but contains mismatches.");
      hasLoggedMismatchError = true;
    };
    const isSVGContainer = container => container.namespaceURI.includes("svg") && container.tagName !== "foreignObject";
    const isMathMLContainer = container => container.namespaceURI.includes("MathML");
    const getContainerType = container => {
      if (container.nodeType !== 1) return void 0;
      if (isSVGContainer(container)) return "svg";
      if (isMathMLContainer(container)) return "mathml";
      return void 0;
    };
    const isComment = node => node.nodeType === 8;
    function createHydrationFunctions(rendererInternals) {
      const {mt: mountComponent, p: patch, o: {patchProp, createText, nextSibling, parentNode, remove, insert, createComment}} = rendererInternals;
      const hydrate = (vnode, container) => {
        if (!container.hasChildNodes()) {
          true && warn$1(`Attempting to hydrate existing markup but container is empty. Performing full mount instead.`);
          patch(null, vnode, container);
          flushPostFlushCbs();
          container._vnode = vnode;
          return;
        }
        hydrateNode(container.firstChild, vnode, null, null, null);
        flushPostFlushCbs();
        container._vnode = vnode;
      };
      const hydrateNode = (node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized = false) => {
        optimized = optimized || !!vnode.dynamicChildren;
        const isFragmentStart = isComment(node) && node.data === "[";
        const onMismatch = () => handleMismatch(node, vnode, parentComponent, parentSuspense, slotScopeIds, isFragmentStart);
        const {type, ref, shapeFlag, patchFlag} = vnode;
        let domType = node.nodeType;
        vnode.el = node;
        if (true) {
          (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.def)(node, "__vnode", vnode, true);
          (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.def)(node, "__vueParentComponent", parentComponent, true);
        }
        if (patchFlag === -2) {
          optimized = false;
          vnode.dynamicChildren = null;
        }
        let nextNode = null;
        switch (type) {
         case Text:
          if (domType !== 3) {
            if (vnode.children === "") {
              insert(vnode.el = createText(""), parentNode(node), node);
              nextNode = node;
            } else {
              nextNode = onMismatch();
            }
          } else {
            if (node.data !== vnode.children) {
              true && warn$1(`Hydration text mismatch in`, node.parentNode, `\n  - rendered on server: ${JSON.stringify(node.data)}\n  - expected on client: ${JSON.stringify(vnode.children)}`);
              logMismatchError();
              node.data = vnode.children;
            }
            nextNode = nextSibling(node);
          }
          break;

         case Comment:
          if (isTemplateNode(node)) {
            nextNode = nextSibling(node);
            replaceNode(vnode.el = node.content.firstChild, node, parentComponent);
          } else if (domType !== 8 || isFragmentStart) {
            nextNode = onMismatch();
          } else {
            nextNode = nextSibling(node);
          }
          break;

         case Static:
          if (isFragmentStart) {
            node = nextSibling(node);
            domType = node.nodeType;
          }
          if (domType === 1 || domType === 3) {
            nextNode = node;
            const needToAdoptContent = !vnode.children.length;
            for (let i = 0; i < vnode.staticCount; i++) {
              if (needToAdoptContent) vnode.children += nextNode.nodeType === 1 ? nextNode.outerHTML : nextNode.data;
              if (i === vnode.staticCount - 1) {
                vnode.anchor = nextNode;
              }
              nextNode = nextSibling(nextNode);
            }
            return isFragmentStart ? nextSibling(nextNode) : nextNode;
          } else {
            onMismatch();
          }
          break;

         case Fragment:
          if (!isFragmentStart) {
            nextNode = onMismatch();
          } else {
            nextNode = hydrateFragment(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized);
          }
          break;

         default:
          if (shapeFlag & 1) {
            if ((domType !== 1 || vnode.type.toLowerCase() !== node.tagName.toLowerCase()) && !isTemplateNode(node)) {
              nextNode = onMismatch();
            } else {
              nextNode = hydrateElement(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized);
            }
          } else if (shapeFlag & 6) {
            vnode.slotScopeIds = slotScopeIds;
            const container = parentNode(node);
            if (isFragmentStart) {
              nextNode = locateClosingAnchor(node);
            } else if (isComment(node) && node.data === "teleport start") {
              nextNode = locateClosingAnchor(node, node.data, "teleport end");
            } else {
              nextNode = nextSibling(node);
            }
            mountComponent(vnode, container, null, parentComponent, parentSuspense, getContainerType(container), optimized);
            if (isAsyncWrapper(vnode) && !vnode.type.__asyncResolved) {
              let subTree;
              if (isFragmentStart) {
                subTree = createVNode(Fragment);
                subTree.anchor = nextNode ? nextNode.previousSibling : container.lastChild;
              } else {
                subTree = node.nodeType === 3 ? createTextVNode("") : createVNode("div");
              }
              subTree.el = node;
              vnode.component.subTree = subTree;
            }
          } else if (shapeFlag & 64) {
            if (domType !== 8) {
              nextNode = onMismatch();
            } else {
              nextNode = vnode.type.hydrate(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized, rendererInternals, hydrateChildren);
            }
          } else if (shapeFlag & 128) {
            nextNode = vnode.type.hydrate(node, vnode, parentComponent, parentSuspense, getContainerType(parentNode(node)), slotScopeIds, optimized, rendererInternals, hydrateNode);
          } else if (true) {
            warn$1("Invalid HostVNode type:", type, `(${typeof type})`);
          }
        }
        if (ref != null) {
          setRef(ref, null, parentSuspense, vnode);
        }
        return nextNode;
      };
      const hydrateElement = (el, vnode, parentComponent, parentSuspense, slotScopeIds, optimized) => {
        optimized = optimized || !!vnode.dynamicChildren;
        const {type, props, patchFlag, shapeFlag, dirs, transition} = vnode;
        const forcePatch = type === "input" || type === "option";
        if (true) {
          if (dirs) {
            invokeDirectiveHook(vnode, null, parentComponent, "created");
          }
          let needCallTransitionHooks = false;
          if (isTemplateNode(el)) {
            needCallTransitionHooks = needTransition(null, transition) && parentComponent && parentComponent.vnode.props && parentComponent.vnode.props.appear;
            const content = el.content.firstChild;
            if (needCallTransitionHooks) {
              const cls = content.getAttribute("class");
              if (cls) content.$cls = cls;
              transition.beforeEnter(content);
            }
            replaceNode(content, el, parentComponent);
            vnode.el = el = content;
          }
          if (shapeFlag & 16 && !(props && (props.innerHTML || props.textContent))) {
            let next = hydrateChildren(el.firstChild, vnode, el, parentComponent, parentSuspense, slotScopeIds, optimized);
            if (next && !isMismatchAllowed(el, 1)) {
              true && warn$1(`Hydration children mismatch on`, el, `\nServer rendered element contains more child nodes than client vdom.`);
              logMismatchError();
            }
            while (next) {
              const cur = next;
              next = next.nextSibling;
              remove(cur);
            }
          } else if (shapeFlag & 8) {
            let clientText = vnode.children;
            if (clientText[0] === "\n" && (el.tagName === "PRE" || el.tagName === "TEXTAREA")) {
              clientText = clientText.slice(1);
            }
            const {textContent} = el;
            if (textContent !== clientText && textContent !== clientText.replace(/\r\n|\r/g, "\n")) {
              if (!isMismatchAllowed(el, 0)) {
                true && warn$1(`Hydration text content mismatch on`, el, `\n  - rendered on server: ${textContent}\n  - expected on client: ${clientText}`);
                logMismatchError();
              }
              el.textContent = vnode.children;
            }
          }
          if (props) {
            if (true) {
              const isCustomElement = el.tagName.includes("-");
              for (const key in props) {
                if (true && !(dirs && dirs.some(d => d.dir.created)) && propHasMismatch(el, key, props[key], vnode, parentComponent)) {
                  logMismatchError();
                }
                if (forcePatch && (key.endsWith("value") || key === "indeterminate") || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isOn)(key) && !(0, 
                _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isReservedProp)(key) || key[0] === "." || isCustomElement && !(0, 
                _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isReservedProp)(key)) {
                  patchProp(el, key, null, props[key], void 0, parentComponent);
                }
              }
            } else {}
          }
          let vnodeHooks;
          if (vnodeHooks = props && props.onVnodeBeforeMount) {
            invokeVNodeHook(vnodeHooks, parentComponent, vnode);
          }
          if (dirs) {
            invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
          }
          if ((vnodeHooks = props && props.onVnodeMounted) || dirs || needCallTransitionHooks) {
            queueEffectWithSuspense(() => {
              vnodeHooks && invokeVNodeHook(vnodeHooks, parentComponent, vnode);
              needCallTransitionHooks && transition.enter(el);
              dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
            }, parentSuspense);
          }
        }
        return el.nextSibling;
      };
      const hydrateChildren = (node, parentVNode, container, parentComponent, parentSuspense, slotScopeIds, optimized) => {
        optimized = optimized || !!parentVNode.dynamicChildren;
        const children = parentVNode.children;
        const l = children.length;
        let hasCheckedMismatch = false;
        for (let i = 0; i < l; i++) {
          const vnode = optimized ? children[i] : children[i] = normalizeVNode(children[i]);
          const isText = vnode.type === Text;
          if (node) {
            if (isText && !optimized) {
              if (i + 1 < l && normalizeVNode(children[i + 1]).type === Text) {
                insert(createText(node.data.slice(vnode.children.length)), container, nextSibling(node));
                node.data = vnode.children;
              }
            }
            node = hydrateNode(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized);
          } else if (isText && !vnode.children) {
            insert(vnode.el = createText(""), container);
          } else {
            if (!hasCheckedMismatch) {
              hasCheckedMismatch = true;
              if (!isMismatchAllowed(container, 1)) {
                true && warn$1(`Hydration children mismatch on`, container, `\nServer rendered element contains fewer child nodes than client vdom.`);
                logMismatchError();
              }
            }
            patch(null, vnode, container, null, parentComponent, parentSuspense, getContainerType(container), slotScopeIds);
          }
        }
        return node;
      };
      const hydrateFragment = (node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized) => {
        const {slotScopeIds: fragmentSlotScopeIds} = vnode;
        if (fragmentSlotScopeIds) {
          slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
        }
        const container = parentNode(node);
        const next = hydrateChildren(nextSibling(node), vnode, container, parentComponent, parentSuspense, slotScopeIds, optimized);
        if (next && isComment(next) && next.data === "]") {
          return nextSibling(vnode.anchor = next);
        } else {
          logMismatchError();
          insert(vnode.anchor = createComment(`]`), container, next);
          return next;
        }
      };
      const handleMismatch = (node, vnode, parentComponent, parentSuspense, slotScopeIds, isFragment) => {
        if (!isMismatchAllowed(node.parentElement, 1)) {
          true && warn$1(`Hydration node mismatch:\n- rendered on server:`, node, node.nodeType === 3 ? `(text)` : isComment(node) && node.data === "[" ? `(start of fragment)` : ``, `\n- expected on client:`, vnode.type);
          logMismatchError();
        }
        vnode.el = null;
        if (isFragment) {
          const end = locateClosingAnchor(node);
          while (true) {
            const next2 = nextSibling(node);
            if (next2 && next2 !== end) {
              remove(next2);
            } else {
              break;
            }
          }
        }
        const next = nextSibling(node);
        const container = parentNode(node);
        remove(node);
        patch(null, vnode, container, next, parentComponent, parentSuspense, getContainerType(container), slotScopeIds);
        if (parentComponent) {
          parentComponent.vnode.el = vnode.el;
          updateHOCHostEl(parentComponent, vnode.el);
        }
        return next;
      };
      const locateClosingAnchor = (node, open = "[", close = "]") => {
        let match = 0;
        while (node) {
          node = nextSibling(node);
          if (node && isComment(node)) {
            if (node.data === open) match++;
            if (node.data === close) {
              if (match === 0) {
                return nextSibling(node);
              } else {
                match--;
              }
            }
          }
        }
        return node;
      };
      const replaceNode = (newNode, oldNode, parentComponent) => {
        const parentNode2 = oldNode.parentNode;
        if (parentNode2) {
          parentNode2.replaceChild(newNode, oldNode);
        }
        let parent = parentComponent;
        while (parent) {
          if (parent.vnode.el === oldNode) {
            parent.vnode.el = parent.subTree.el = newNode;
          }
          parent = parent.parent;
        }
      };
      const isTemplateNode = node => node.nodeType === 1 && node.tagName === "TEMPLATE";
      return [ hydrate, hydrateNode ];
    }
    function propHasMismatch(el, key, clientValue, vnode, instance) {
      let mismatchType;
      let mismatchKey;
      let actual;
      let expected;
      if (key === "class") {
        if (el.$cls) {
          actual = el.$cls;
          delete el.$cls;
        } else {
          actual = el.getAttribute("class");
        }
        expected = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.normalizeClass)(clientValue);
        if (!isSetEqual(toClassSet(actual || ""), toClassSet(expected))) {
          mismatchType = 2;
          mismatchKey = `class`;
        }
      } else if (key === "style") {
        actual = el.getAttribute("style") || "";
        expected = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(clientValue) ? clientValue : (0, 
        _vue_shared__WEBPACK_IMPORTED_MODULE_1__.stringifyStyle)((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.normalizeStyle)(clientValue));
        const actualMap = toStyleMap(actual);
        const expectedMap = toStyleMap(expected);
        if (vnode.dirs) {
          for (const {dir, value} of vnode.dirs) {
            if (dir.name === "show" && !value) {
              expectedMap.set("display", "none");
            }
          }
        }
        if (instance) {
          resolveCssVars(instance, vnode, expectedMap);
        }
        if (!isMapEqual(actualMap, expectedMap)) {
          mismatchType = 3;
          mismatchKey = "style";
        }
      } else if (el instanceof SVGElement && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isKnownSvgAttr)(key) || el instanceof HTMLElement && ((0, 
      _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isBooleanAttr)(key) || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isKnownHtmlAttr)(key))) {
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isBooleanAttr)(key)) {
          actual = el.hasAttribute(key);
          expected = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.includeBooleanAttr)(clientValue);
        } else if (clientValue == null) {
          actual = el.hasAttribute(key);
          expected = false;
        } else {
          if (el.hasAttribute(key)) {
            actual = el.getAttribute(key);
          } else if (key === "value" && el.tagName === "TEXTAREA") {
            actual = el.value;
          } else {
            actual = false;
          }
          expected = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isRenderableAttrValue)(clientValue) ? String(clientValue) : false;
        }
        if (actual !== expected) {
          mismatchType = 4;
          mismatchKey = key;
        }
      }
      if (mismatchType != null && !isMismatchAllowed(el, mismatchType)) {
        const format = v => v === false ? `(not rendered)` : `${mismatchKey}="${v}"`;
        const preSegment = `Hydration ${MismatchTypeString[mismatchType]} mismatch on`;
        const postSegment = `\n  - rendered on server: ${format(actual)}\n  - expected on client: ${format(expected)}\n  Note: this mismatch is check-only. The DOM will not be rectified in production due to performance overhead.\n  You should fix the source of the mismatch.`;
        {
          warn$1(preSegment, el, postSegment);
        }
        return true;
      }
      return false;
    }
    function toClassSet(str) {
      return new Set(str.trim().split(/\s+/));
    }
    function isSetEqual(a, b) {
      if (a.size !== b.size) {
        return false;
      }
      for (const s of a) {
        if (!b.has(s)) {
          return false;
        }
      }
      return true;
    }
    function toStyleMap(str) {
      const styleMap = new Map;
      for (const item of str.split(";")) {
        let [key, value] = item.split(":");
        key = key.trim();
        value = value && value.trim();
        if (key && value) {
          styleMap.set(key, value);
        }
      }
      return styleMap;
    }
    function isMapEqual(a, b) {
      if (a.size !== b.size) {
        return false;
      }
      for (const [key, value] of a) {
        if (value !== b.get(key)) {
          return false;
        }
      }
      return true;
    }
    function resolveCssVars(instance, vnode, expectedMap) {
      const root = instance.subTree;
      if (instance.getCssVars && (vnode === root || root && root.type === Fragment && root.children.includes(vnode))) {
        const cssVars = instance.getCssVars();
        for (const key in cssVars) {
          const value = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.normalizeCssVarValue)(cssVars[key]);
          expectedMap.set(`--${(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.getEscapedCssVarName)(key, false)}`, value);
        }
      }
      if (vnode === root && instance.parent) {
        resolveCssVars(instance.parent, instance.vnode, expectedMap);
      }
    }
    const allowMismatchAttr = "data-allow-mismatch";
    const MismatchTypeString = {
      [0]: "text",
      [1]: "children",
      [2]: "class",
      [3]: "style",
      [4]: "attribute"
    };
    function isMismatchAllowed(el, allowedType) {
      if (allowedType === 0 || allowedType === 1) {
        while (el && !el.hasAttribute(allowMismatchAttr)) {
          el = el.parentElement;
        }
      }
      const allowedAttr = el && el.getAttribute(allowMismatchAttr);
      if (allowedAttr == null) {
        return false;
      } else if (allowedAttr === "") {
        return true;
      } else {
        const list = allowedAttr.split(",");
        if (allowedType === 0 && list.includes("children")) {
          return true;
        }
        return list.includes(MismatchTypeString[allowedType]);
      }
    }
    const requestIdleCallback = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.getGlobalThis)().requestIdleCallback || (cb => setTimeout(cb, 1));
    const cancelIdleCallback = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.getGlobalThis)().cancelIdleCallback || (id => clearTimeout(id));
    const hydrateOnIdle = (timeout = 1e4) => hydrate => {
      const id = requestIdleCallback(hydrate, {
        timeout
      });
      return () => cancelIdleCallback(id);
    };
    function elementIsVisibleInViewport(el) {
      const {top, left, bottom, right} = el.getBoundingClientRect();
      const {innerHeight, innerWidth} = window;
      return (top > 0 && top < innerHeight || bottom > 0 && bottom < innerHeight) && (left > 0 && left < innerWidth || right > 0 && right < innerWidth);
    }
    const hydrateOnVisible = opts => (hydrate, forEach) => {
      const ob = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          ob.disconnect();
          hydrate();
          break;
        }
      }, opts);
      forEach(el => {
        if (!(el instanceof Element)) return;
        if (elementIsVisibleInViewport(el)) {
          hydrate();
          ob.disconnect();
          return false;
        }
        ob.observe(el);
      });
      return () => ob.disconnect();
    };
    const hydrateOnMediaQuery = query => hydrate => {
      if (query) {
        const mql = matchMedia(query);
        if (mql.matches) {
          hydrate();
        } else {
          mql.addEventListener("change", hydrate, {
            once: true
          });
          return () => mql.removeEventListener("change", hydrate);
        }
      }
    };
    const hydrateOnInteraction = (interactions = []) => (hydrate, forEach) => {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(interactions)) interactions = [ interactions ];
      let hasHydrated = false;
      const doHydrate = e => {
        if (!hasHydrated) {
          hasHydrated = true;
          teardown();
          hydrate();
          e.target.dispatchEvent(new e.constructor(e.type, e));
        }
      };
      const teardown = () => {
        forEach(el => {
          for (const i of interactions) {
            el.removeEventListener(i, doHydrate);
          }
        });
      };
      forEach(el => {
        for (const i of interactions) {
          el.addEventListener(i, doHydrate, {
            once: true
          });
        }
      });
      return teardown;
    };
    function forEachElement(node, cb) {
      if (isComment(node) && node.data === "[") {
        let depth = 1;
        let next = node.nextSibling;
        while (next) {
          if (next.nodeType === 1) {
            const result = cb(next);
            if (result === false) {
              break;
            }
          } else if (isComment(next)) {
            if (next.data === "]") {
              if (--depth === 0) break;
            } else if (next.data === "[") {
              depth++;
            }
          }
          next = next.nextSibling;
        }
      } else {
        cb(node);
      }
    }
    const isAsyncWrapper = i => !!i.type.__asyncLoader;
    function defineAsyncComponent(source) {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(source)) {
        source = {
          loader: source
        };
      }
      const {loader, loadingComponent, errorComponent, delay = 200, hydrate: hydrateStrategy, timeout, suspensible = true, onError: userOnError} = source;
      let pendingRequest = null;
      let resolvedComp;
      let retries = 0;
      const retry = () => {
        retries++;
        pendingRequest = null;
        return load();
      };
      const load = () => {
        let thisRequest;
        return pendingRequest || (thisRequest = pendingRequest = loader().catch(err => {
          err = err instanceof Error ? err : new Error(String(err));
          if (userOnError) {
            return new Promise((resolve, reject) => {
              const userRetry = () => resolve(retry());
              const userFail = () => reject(err);
              userOnError(err, userRetry, userFail, retries + 1);
            });
          } else {
            throw err;
          }
        }).then(comp => {
          if (thisRequest !== pendingRequest && pendingRequest) {
            return pendingRequest;
          }
          if (true && !comp) {
            warn$1(`Async component loader resolved to undefined. If you are using retry(), make sure to return its return value.`);
          }
          if (comp && (comp.__esModule || comp[Symbol.toStringTag] === "Module")) {
            comp = comp.default;
          }
          if (true && comp && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(comp) && !(0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(comp)) {
            throw new Error(`Invalid async component load result: ${comp}`);
          }
          resolvedComp = comp;
          return comp;
        }));
      };
      return defineComponent({
        name: "AsyncComponentWrapper",
        __asyncLoader: load,
        __asyncHydrate(el, instance, hydrate) {
          let patched = false;
          (instance.bu || (instance.bu = [])).push(() => patched = true);
          const performHydrate = () => {
            if (patched) {
              if (true) {
                warn$1(`Skipping lazy hydration for component '${getComponentName(resolvedComp) || resolvedComp.__file}': it was updated before lazy hydration performed.`);
              }
              return;
            }
            hydrate();
          };
          const doHydrate = hydrateStrategy ? () => {
            const teardown = hydrateStrategy(performHydrate, cb => forEachElement(el, cb));
            if (teardown) {
              (instance.bum || (instance.bum = [])).push(teardown);
            }
          } : performHydrate;
          if (resolvedComp) {
            doHydrate();
          } else {
            load().then(() => !instance.isUnmounted && doHydrate());
          }
        },
        get __asyncResolved() {
          return resolvedComp;
        },
        setup() {
          const instance = currentInstance;
          markAsyncBoundary(instance);
          if (resolvedComp) {
            return () => createInnerComp(resolvedComp, instance);
          }
          const onError = err => {
            pendingRequest = null;
            handleError(err, instance, 13, !errorComponent);
          };
          if (suspensible && instance.suspense || isInSSRComponentSetup) {
            return load().then(comp => () => createInnerComp(comp, instance)).catch(err => {
              onError(err);
              return () => errorComponent ? createVNode(errorComponent, {
                error: err
              }) : null;
            });
          }
          const loaded = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
          const error = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.ref)();
          const delayed = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.ref)(!!delay);
          if (delay) {
            setTimeout(() => {
              delayed.value = false;
            }, delay);
          }
          if (timeout != null) {
            setTimeout(() => {
              if (!loaded.value && !error.value) {
                const err = new Error(`Async component timed out after ${timeout}ms.`);
                onError(err);
                error.value = err;
              }
            }, timeout);
          }
          load().then(() => {
            loaded.value = true;
            if (instance.parent && isKeepAlive(instance.parent.vnode)) {
              instance.parent.update();
            }
          }).catch(err => {
            onError(err);
            error.value = err;
          });
          return () => {
            if (loaded.value && resolvedComp) {
              return createInnerComp(resolvedComp, instance);
            } else if (error.value && errorComponent) {
              return createVNode(errorComponent, {
                error: error.value
              });
            } else if (loadingComponent && !delayed.value) {
              return createInnerComp(loadingComponent, instance);
            }
          };
        }
      });
    }
    function createInnerComp(comp, parent) {
      const {ref: ref2, props, children, ce} = parent.vnode;
      const vnode = createVNode(comp, props, children);
      vnode.ref = ref2;
      vnode.ce = ce;
      delete parent.vnode.ce;
      return vnode;
    }
    const isKeepAlive = vnode => vnode.type.__isKeepAlive;
    const KeepAliveImpl = {
      name: `KeepAlive`,
      __isKeepAlive: true,
      props: {
        include: [ String, RegExp, Array ],
        exclude: [ String, RegExp, Array ],
        max: [ String, Number ]
      },
      setup(props, {slots}) {
        const instance = getCurrentInstance();
        const sharedContext = instance.ctx;
        if (!sharedContext.renderer) {
          return () => {
            const children = slots.default && slots.default();
            return children && children.length === 1 ? children[0] : children;
          };
        }
        const cache = new Map;
        const keys = new Set;
        let current = null;
        if (true) {
          instance.__v_cache = cache;
        }
        const parentSuspense = instance.suspense;
        const {renderer: {p: patch, m: move, um: _unmount, o: {createElement}}} = sharedContext;
        const storageContainer = createElement("div");
        sharedContext.activate = (vnode, container, anchor, namespace, optimized) => {
          const instance2 = vnode.component;
          move(vnode, container, anchor, 0, parentSuspense);
          patch(instance2.vnode, vnode, container, anchor, instance2, parentSuspense, namespace, vnode.slotScopeIds, optimized);
          queuePostRenderEffect(() => {
            instance2.isDeactivated = false;
            if (instance2.a) {
              (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.invokeArrayFns)(instance2.a);
            }
            const vnodeHook = vnode.props && vnode.props.onVnodeMounted;
            if (vnodeHook) {
              invokeVNodeHook(vnodeHook, instance2.parent, vnode);
            }
          }, parentSuspense);
          if (true) {
            devtoolsComponentAdded(instance2);
          }
        };
        sharedContext.deactivate = vnode => {
          const instance2 = vnode.component;
          invalidateMount(instance2.m);
          invalidateMount(instance2.a);
          move(vnode, storageContainer, null, 1, parentSuspense);
          queuePostRenderEffect(() => {
            if (instance2.da) {
              (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.invokeArrayFns)(instance2.da);
            }
            const vnodeHook = vnode.props && vnode.props.onVnodeUnmounted;
            if (vnodeHook) {
              invokeVNodeHook(vnodeHook, instance2.parent, vnode);
            }
            instance2.isDeactivated = true;
          }, parentSuspense);
          if (true) {
            devtoolsComponentAdded(instance2);
          }
          if (true) {
            instance2.__keepAliveStorageContainer = storageContainer;
          }
        };
        function unmount(vnode) {
          resetShapeFlag(vnode);
          _unmount(vnode, instance, parentSuspense, true);
        }
        function pruneCache(filter) {
          cache.forEach((vnode, key) => {
            const name = getComponentName(isAsyncWrapper(vnode) ? vnode.type.__asyncResolved || {} : vnode.type);
            if (name && !filter(name)) {
              pruneCacheEntry(key);
            }
          });
        }
        function pruneCacheEntry(key) {
          const cached = cache.get(key);
          if (cached && (!current || !isSameVNodeType(cached, current))) {
            unmount(cached);
          } else if (current) {
            resetShapeFlag(current);
          }
          cache.delete(key);
          keys.delete(key);
        }
        watch(() => [ props.include, props.exclude ], ([include, exclude]) => {
          include && pruneCache(name => matches(include, name));
          exclude && pruneCache(name => !matches(exclude, name));
        }, {
          flush: "post",
          deep: true
        });
        let pendingCacheKey = null;
        const cacheSubtree = () => {
          if (pendingCacheKey != null) {
            if (isSuspense(instance.subTree.type)) {
              queuePostRenderEffect(() => {
                cache.set(pendingCacheKey, getInnerChild(instance.subTree));
              }, instance.subTree.suspense);
            } else {
              cache.set(pendingCacheKey, getInnerChild(instance.subTree));
            }
          }
        };
        onMounted(cacheSubtree);
        onUpdated(cacheSubtree);
        onBeforeUnmount(() => {
          cache.forEach(cached => {
            const {subTree, suspense} = instance;
            const vnode = getInnerChild(subTree);
            if (cached.type === vnode.type && cached.key === vnode.key) {
              resetShapeFlag(vnode);
              const da = vnode.component.da;
              da && queuePostRenderEffect(da, suspense);
              return;
            }
            unmount(cached);
          });
        });
        return () => {
          pendingCacheKey = null;
          if (!slots.default) {
            return current = null;
          }
          const children = slots.default();
          const rawVNode = children[0];
          if (children.length > 1) {
            if (true) {
              warn$1(`KeepAlive should contain exactly one component child.`);
            }
            current = null;
            return children;
          } else if (!isVNode(rawVNode) || !(rawVNode.shapeFlag & 4) && !(rawVNode.shapeFlag & 128)) {
            current = null;
            return rawVNode;
          }
          let vnode = getInnerChild(rawVNode);
          if (vnode.type === Comment) {
            current = null;
            return vnode;
          }
          const comp = vnode.type;
          const name = getComponentName(isAsyncWrapper(vnode) ? vnode.type.__asyncResolved || {} : comp);
          const {include, exclude, max} = props;
          if (include && (!name || !matches(include, name)) || exclude && name && matches(exclude, name)) {
            vnode.shapeFlag &= -257;
            current = vnode;
            return rawVNode;
          }
          const key = vnode.key == null ? comp : vnode.key;
          const cachedVNode = cache.get(key);
          if (vnode.el) {
            vnode = cloneVNode(vnode);
            if (rawVNode.shapeFlag & 128) {
              rawVNode.ssContent = vnode;
            }
          }
          pendingCacheKey = key;
          if (cachedVNode) {
            vnode.el = cachedVNode.el;
            vnode.component = cachedVNode.component;
            if (vnode.transition) {
              setTransitionHooks(vnode, vnode.transition);
            }
            vnode.shapeFlag |= 512;
            keys.delete(key);
            keys.add(key);
          } else {
            keys.add(key);
            if (max && keys.size > parseInt(max, 10)) {
              pruneCacheEntry(keys.values().next().value);
            }
          }
          vnode.shapeFlag |= 256;
          current = vnode;
          return isSuspense(rawVNode.type) ? rawVNode : vnode;
        };
      }
    };
    const KeepAlive = KeepAliveImpl;
    function matches(pattern, name) {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(pattern)) {
        return pattern.some(p => matches(p, name));
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(pattern)) {
        return pattern.split(",").includes(name);
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isRegExp)(pattern)) {
        pattern.lastIndex = 0;
        return pattern.test(name);
      }
      return false;
    }
    function onActivated(hook, target) {
      registerKeepAliveHook(hook, "a", target);
    }
    function onDeactivated(hook, target) {
      registerKeepAliveHook(hook, "da", target);
    }
    function registerKeepAliveHook(hook, type, target = currentInstance) {
      const wrappedHook = hook.__wdc || (hook.__wdc = () => {
        let current = target;
        while (current) {
          if (current.isDeactivated) {
            return;
          }
          current = current.parent;
        }
        return hook();
      });
      injectHook(type, wrappedHook, target);
      if (target) {
        let current = target.parent;
        while (current && current.parent) {
          if (isKeepAlive(current.parent.vnode)) {
            injectToKeepAliveRoot(wrappedHook, type, target, current);
          }
          current = current.parent;
        }
      }
    }
    function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
      const injected = injectHook(type, hook, keepAliveRoot, true);
      onUnmounted(() => {
        (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.remove)(keepAliveRoot[type], injected);
      }, target);
    }
    function resetShapeFlag(vnode) {
      vnode.shapeFlag &= -257;
      vnode.shapeFlag &= -513;
    }
    function getInnerChild(vnode) {
      return vnode.shapeFlag & 128 ? vnode.ssContent : vnode;
    }
    function injectHook(type, hook, target = currentInstance, prepend = false) {
      if (target) {
        const hooks = target[type] || (target[type] = []);
        const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
          (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.pauseTracking)();
          const reset = setCurrentInstance(target);
          const res = callWithAsyncErrorHandling(hook, target, type, args);
          reset();
          (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.resetTracking)();
          return res;
        });
        if (prepend) {
          hooks.unshift(wrappedHook);
        } else {
          hooks.push(wrappedHook);
        }
        return wrappedHook;
      } else if (true) {
        const apiName = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toHandlerKey)(ErrorTypeStrings$1[type].replace(/ hook$/, ""));
        warn$1(`${apiName} is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup().` + ` If you are using async setup(), make sure to register lifecycle hooks before the first await statement.`);
      }
    }
    const createHook = lifecycle => (hook, target = currentInstance) => {
      if (!isInSSRComponentSetup || lifecycle === "sp") {
        injectHook(lifecycle, (...args) => hook(...args), target);
      }
    };
    const onBeforeMount = createHook("bm");
    const onMounted = createHook("m");
    const onBeforeUpdate = createHook("bu");
    const onUpdated = createHook("u");
    const onBeforeUnmount = createHook("bum");
    const onUnmounted = createHook("um");
    const onServerPrefetch = createHook("sp");
    const onRenderTriggered = createHook("rtg");
    const onRenderTracked = createHook("rtc");
    function onErrorCaptured(hook, target = currentInstance) {
      injectHook("ec", hook, target);
    }
    const COMPONENTS = "components";
    const DIRECTIVES = "directives";
    function resolveComponent(name, maybeSelfReference) {
      return resolveAsset(COMPONENTS, name, true, maybeSelfReference) || name;
    }
    const NULL_DYNAMIC_COMPONENT = Symbol.for("v-ndc");
    function resolveDynamicComponent(component) {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(component)) {
        return resolveAsset(COMPONENTS, component, false) || component;
      } else {
        return component || NULL_DYNAMIC_COMPONENT;
      }
    }
    function resolveDirective(name) {
      return resolveAsset(DIRECTIVES, name);
    }
    function resolveAsset(type, name, warnMissing = true, maybeSelfReference = false) {
      const instance = currentRenderingInstance || currentInstance;
      if (instance) {
        const Component = instance.type;
        if (type === COMPONENTS) {
          const selfName = getComponentName(Component, false);
          if (selfName && (selfName === name || selfName === (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(name) || selfName === (0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_1__.capitalize)((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(name)))) {
            return Component;
          }
        }
        const res = resolve(instance[type] || Component[type], name) || resolve(instance.appContext[type], name);
        if (!res && maybeSelfReference) {
          return Component;
        }
        if (true && warnMissing && !res) {
          const extra = type === COMPONENTS ? `\nIf this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement.` : ``;
          warn$1(`Failed to resolve ${type.slice(0, -1)}: ${name}${extra}`);
        }
        return res;
      } else if (true) {
        warn$1(`resolve${(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.capitalize)(type.slice(0, -1))} can only be used in render() or setup().`);
      }
    }
    function resolve(registry, name) {
      return registry && (registry[name] || registry[(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(name)] || registry[(0, 
      _vue_shared__WEBPACK_IMPORTED_MODULE_1__.capitalize)((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(name))]);
    }
    function renderList(source, renderItem, cache, index) {
      let ret;
      const cached = cache && cache[index];
      const sourceIsArray = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(source);
      if (sourceIsArray || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(source)) {
        const sourceIsReactiveArray = sourceIsArray && (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isReactive)(source);
        let needsWrap = false;
        let isReadonlySource = false;
        if (sourceIsReactiveArray) {
          needsWrap = !(0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isShallow)(source);
          isReadonlySource = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isReadonly)(source);
          source = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadArray)(source);
        }
        ret = new Array(source.length);
        for (let i = 0, l = source.length; i < l; i++) {
          ret[i] = renderItem(needsWrap ? isReadonlySource ? (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toReadonly)((0, 
          _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toReactive)(source[i])) : (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toReactive)(source[i]) : source[i], i, void 0, cached && cached[i]);
        }
      } else if (typeof source === "number") {
        if (true && (!Number.isInteger(source) || source < 0)) {
          warn$1(`The v-for range expects a positive integer value but got ${source}.`);
          ret = [];
        } else {
          ret = new Array(source);
          for (let i = 0; i < source; i++) {
            ret[i] = renderItem(i + 1, i, void 0, cached && cached[i]);
          }
        }
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(source)) {
        if (source[Symbol.iterator]) {
          ret = Array.from(source, (item, i) => renderItem(item, i, void 0, cached && cached[i]));
        } else {
          const keys = Object.keys(source);
          ret = new Array(keys.length);
          for (let i = 0, l = keys.length; i < l; i++) {
            const key = keys[i];
            ret[i] = renderItem(source[key], key, i, cached && cached[i]);
          }
        }
      } else {
        ret = [];
      }
      if (cache) {
        cache[index] = ret;
      }
      return ret;
    }
    function createSlots(slots, dynamicSlots) {
      for (let i = 0; i < dynamicSlots.length; i++) {
        const slot = dynamicSlots[i];
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(slot)) {
          for (let j = 0; j < slot.length; j++) {
            slots[slot[j].name] = slot[j].fn;
          }
        } else if (slot) {
          slots[slot.name] = slot.key ? (...args) => {
            const res = slot.fn(...args);
            if (res) res.key = slot.key;
            return res;
          } : slot.fn;
        }
      }
      return slots;
    }
    function renderSlot(slots, name, props = {}, fallback, noSlotted) {
      if (currentRenderingInstance.ce || currentRenderingInstance.parent && isAsyncWrapper(currentRenderingInstance.parent) && currentRenderingInstance.parent.ce) {
        const hasProps = Object.keys(props).length > 0;
        if (name !== "default") props.name = name;
        return openBlock(), createBlock(Fragment, null, [ createVNode("slot", props, fallback && fallback()) ], hasProps ? -2 : 64);
      }
      let slot = slots[name];
      if (true && slot && slot.length > 1) {
        warn$1(`SSR-optimized slot function detected in a non-SSR-optimized render function. You need to mark this component with $dynamic-slots in the parent template.`);
        slot = () => [];
      }
      if (slot && slot._c) {
        slot._d = false;
      }
      openBlock();
      const validSlotContent = slot && ensureValidVNode(slot(props));
      const slotKey = props.key || validSlotContent && validSlotContent.key;
      const rendered = createBlock(Fragment, {
        key: (slotKey && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isSymbol)(slotKey) ? slotKey : `_${name}`) + (!validSlotContent && fallback ? "_fb" : "")
      }, validSlotContent || (fallback ? fallback() : []), validSlotContent && slots._ === 1 ? 64 : -2);
      if (!noSlotted && rendered.scopeId) {
        rendered.slotScopeIds = [ rendered.scopeId + "-s" ];
      }
      if (slot && slot._c) {
        slot._d = true;
      }
      return rendered;
    }
    function ensureValidVNode(vnodes) {
      return vnodes.some(child => {
        if (!isVNode(child)) return true;
        if (child.type === Comment) return false;
        if (child.type === Fragment && !ensureValidVNode(child.children)) return false;
        return true;
      }) ? vnodes : null;
    }
    function toHandlers(obj, preserveCaseIfNecessary) {
      const ret = {};
      if (true && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(obj)) {
        warn$1(`v-on with no argument expects an object value.`);
        return ret;
      }
      for (const key in obj) {
        ret[preserveCaseIfNecessary && /[A-Z]/.test(key) ? `on:${key}` : (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toHandlerKey)(key)] = obj[key];
      }
      return ret;
    }
    const getPublicInstance = i => {
      if (!i) return null;
      if (isStatefulComponent(i)) return getComponentPublicInstance(i);
      return getPublicInstance(i.parent);
    };
    const publicPropertiesMap = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)(Object.create(null), {
      $: i => i,
      $el: i => i.vnode.el,
      $data: i => i.data,
      $props: i => true ? (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly)(i.props) : 0,
      $attrs: i => true ? (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly)(i.attrs) : 0,
      $slots: i => true ? (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly)(i.slots) : 0,
      $refs: i => true ? (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly)(i.refs) : 0,
      $parent: i => getPublicInstance(i.parent),
      $root: i => getPublicInstance(i.root),
      $host: i => i.ce,
      $emit: i => i.emit,
      $options: i => false ? 0 : i.type,
      $forceUpdate: i => i.f || (i.f = () => {
        queueJob(i.update);
      }),
      $nextTick: i => i.n || (i.n = nextTick.bind(i.proxy)),
      $watch: i => false ? 0 : _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP
    });
    const isReservedPrefix = key => key === "_" || key === "$";
    const hasSetupBinding = (state, key) => state !== _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ && !state.__isScriptSetup && (0, 
    _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(state, key);
    const PublicInstanceProxyHandlers = {
      get({_: instance}, key) {
        if (key === "__v_skip") {
          return true;
        }
        const {ctx, setupState, data, props, accessCache, type, appContext} = instance;
        if (true && key === "__isVue") {
          return true;
        }
        if (key[0] !== "$") {
          const n = accessCache[key];
          if (n !== void 0) {
            switch (n) {
             case 1:
              return setupState[key];

             case 2:
              return data[key];

             case 4:
              return ctx[key];

             case 3:
              return props[key];
            }
          } else if (hasSetupBinding(setupState, key)) {
            accessCache[key] = 1;
            return setupState[key];
          } else if (false) {} else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(props, key)) {
            accessCache[key] = 3;
            return props[key];
          } else if (ctx !== _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(ctx, key)) {
            accessCache[key] = 4;
            return ctx[key];
          } else if (true) {
            accessCache[key] = 0;
          }
        }
        const publicGetter = publicPropertiesMap[key];
        let cssModule, globalProperties;
        if (publicGetter) {
          if (key === "$attrs") {
            (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.track)(instance.attrs, "get", "");
            true && markAttrsAccessed();
          } else if (true && key === "$slots") {
            (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.track)(instance, "get", key);
          }
          return publicGetter(instance);
        } else if ((cssModule = type.__cssModules) && (cssModule = cssModule[key])) {
          return cssModule;
        } else if (ctx !== _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(ctx, key)) {
          accessCache[key] = 4;
          return ctx[key];
        } else if (globalProperties = appContext.config.globalProperties, (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(globalProperties, key)) {
          {
            return globalProperties[key];
          }
        } else if (true && currentRenderingInstance && (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(key) || key.indexOf("__v") !== 0)) {
          if (data !== _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ && isReservedPrefix(key[0]) && (0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(data, key)) {
            warn$1(`Property ${JSON.stringify(key)} must be accessed via $data because it starts with a reserved character ("$" or "_") and is not proxied on the render context.`);
          } else if (instance === currentRenderingInstance) {
            warn$1(`Property ${JSON.stringify(key)} was accessed during render but is not defined on instance.`);
          }
        }
      },
      set({_: instance}, key, value) {
        const {data, setupState, ctx} = instance;
        if (hasSetupBinding(setupState, key)) {
          setupState[key] = value;
          return true;
        } else if (true && setupState.__isScriptSetup && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(setupState, key)) {
          warn$1(`Cannot mutate <script setup> binding "${key}" from Options API.`);
          return false;
        } else if (false) {} else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(instance.props, key)) {
          true && warn$1(`Attempting to mutate prop "${key}". Props are readonly.`);
          return false;
        }
        if (key[0] === "$" && key.slice(1) in instance) {
          true && warn$1(`Attempting to mutate public property "${key}". Properties starting with $ are reserved and readonly.`);
          return false;
        } else {
          if (true && key in instance.appContext.config.globalProperties) {
            Object.defineProperty(ctx, key, {
              enumerable: true,
              configurable: true,
              value
            });
          } else {
            ctx[key] = value;
          }
        }
        return true;
      },
      has({_: {data, setupState, accessCache, ctx, appContext, props, type}}, key) {
        let cssModules;
        return !!(accessCache[key] || false && 0 || hasSetupBinding(setupState, key) || (0, 
        _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(props, key) || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(ctx, key) || (0, 
        _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(publicPropertiesMap, key) || (0, 
        _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(appContext.config.globalProperties, key) || (cssModules = type.__cssModules) && cssModules[key]);
      },
      defineProperty(target, key, descriptor) {
        if (descriptor.get != null) {
          target._.accessCache[key] = 0;
        } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(descriptor, "value")) {
          this.set(target, key, descriptor.value, null);
        }
        return Reflect.defineProperty(target, key, descriptor);
      }
    };
    if (true) {
      PublicInstanceProxyHandlers.ownKeys = target => {
        warn$1(`Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead.`);
        return Reflect.ownKeys(target);
      };
    }
    const RuntimeCompiledPublicInstanceProxyHandlers = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({}, PublicInstanceProxyHandlers, {
      get(target, key) {
        if (key === Symbol.unscopables) {
          return;
        }
        return PublicInstanceProxyHandlers.get(target, key, target);
      },
      has(_, key) {
        const has = key[0] !== "_" && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isGloballyAllowed)(key);
        if (true && !has && PublicInstanceProxyHandlers.has(_, key)) {
          warn$1(`Property ${JSON.stringify(key)} should not start with _ which is a reserved prefix for Vue internals.`);
        }
        return has;
      }
    });
    function createDevRenderContext(instance) {
      const target = {};
      Object.defineProperty(target, `_`, {
        configurable: true,
        enumerable: false,
        get: () => instance
      });
      Object.keys(publicPropertiesMap).forEach(key => {
        Object.defineProperty(target, key, {
          configurable: true,
          enumerable: false,
          get: () => publicPropertiesMap[key](instance),
          set: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP
        });
      });
      return target;
    }
    function exposePropsOnRenderContext(instance) {
      const {ctx, propsOptions: [propsOptions]} = instance;
      if (propsOptions) {
        Object.keys(propsOptions).forEach(key => {
          Object.defineProperty(ctx, key, {
            enumerable: true,
            configurable: true,
            get: () => instance.props[key],
            set: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP
          });
        });
      }
    }
    function exposeSetupStateOnRenderContext(instance) {
      const {ctx, setupState} = instance;
      Object.keys((0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(setupState)).forEach(key => {
        if (!setupState.__isScriptSetup) {
          if (isReservedPrefix(key[0])) {
            warn$1(`setup() return property ${JSON.stringify(key)} should not start with "$" or "_" which are reserved prefixes for Vue internals.`);
            return;
          }
          Object.defineProperty(ctx, key, {
            enumerable: true,
            configurable: true,
            get: () => setupState[key],
            set: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP
          });
        }
      });
    }
    const warnRuntimeUsage = method => warn$1(`${method}() is a compiler-hint helper that is only usable inside <script setup> of a single file component. Its arguments should be compiled away and passing it at runtime has no effect.`);
    function defineProps() {
      if (true) {
        warnRuntimeUsage(`defineProps`);
      }
      return null;
    }
    function defineEmits() {
      if (true) {
        warnRuntimeUsage(`defineEmits`);
      }
      return null;
    }
    function defineExpose(exposed) {
      if (true) {
        warnRuntimeUsage(`defineExpose`);
      }
    }
    function defineOptions(options) {
      if (true) {
        warnRuntimeUsage(`defineOptions`);
      }
    }
    function defineSlots() {
      if (true) {
        warnRuntimeUsage(`defineSlots`);
      }
      return null;
    }
    function defineModel() {
      if (true) {
        warnRuntimeUsage("defineModel");
      }
    }
    function withDefaults(props, defaults) {
      if (true) {
        warnRuntimeUsage(`withDefaults`);
      }
      return null;
    }
    function useSlots() {
      return getContext("useSlots").slots;
    }
    function useAttrs() {
      return getContext("useAttrs").attrs;
    }
    function getContext(calledFunctionName) {
      const i = getCurrentInstance();
      if (true && !i) {
        warn$1(`${calledFunctionName}() called without active instance.`);
      }
      return i.setupContext || (i.setupContext = createSetupContext(i));
    }
    function normalizePropsOrEmits(props) {
      return (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(props) ? props.reduce((normalized, p) => (normalized[p] = null, 
      normalized), {}) : props;
    }
    function mergeDefaults(raw, defaults) {
      const props = normalizePropsOrEmits(raw);
      for (const key in defaults) {
        if (key.startsWith("__skip")) continue;
        let opt = props[key];
        if (opt) {
          if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(opt) || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(opt)) {
            opt = props[key] = {
              type: opt,
              default: defaults[key]
            };
          } else {
            opt.default = defaults[key];
          }
        } else if (opt === null) {
          opt = props[key] = {
            default: defaults[key]
          };
        } else if (true) {
          warn$1(`props default key "${key}" has no corresponding declaration.`);
        }
        if (opt && defaults[`__skip_${key}`]) {
          opt.skipFactory = true;
        }
      }
      return props;
    }
    function mergeModels(a, b) {
      if (!a || !b) return a || b;
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(a) && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(b)) return a.concat(b);
      return (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({}, normalizePropsOrEmits(a), normalizePropsOrEmits(b));
    }
    function createPropsRestProxy(props, excludedKeys) {
      const ret = {};
      for (const key in props) {
        if (!excludedKeys.includes(key)) {
          Object.defineProperty(ret, key, {
            enumerable: true,
            get: () => props[key]
          });
        }
      }
      return ret;
    }
    function withAsyncContext(getAwaitable) {
      const ctx = getCurrentInstance();
      const inSSRSetup = isInSSRComponentSetup;
      if (true && !ctx) {
        warn$1(`withAsyncContext called without active current instance. This is likely a bug.`);
      }
      let awaitable = getAwaitable();
      unsetCurrentInstance();
      if (inSSRSetup) {
        setInSSRSetupState(false);
      }
      const restore = () => {
        setCurrentInstance(ctx);
        if (inSSRSetup) {
          setInSSRSetupState(true);
        }
      };
      const cleanup = () => {
        if (getCurrentInstance() !== ctx) ctx.scope.off();
        unsetCurrentInstance();
        if (inSSRSetup) {
          setInSSRSetupState(false);
        }
      };
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isPromise)(awaitable)) {
        awaitable = awaitable.catch(e => {
          restore();
          Promise.resolve().then(() => Promise.resolve().then(cleanup));
          throw e;
        });
      }
      return [ awaitable, () => {
        restore();
        Promise.resolve().then(cleanup);
      } ];
    }
    function createDuplicateChecker() {
      const cache = Object.create(null);
      return (type, key) => {
        if (cache[key]) {
          warn$1(`${type} property "${key}" is already defined in ${cache[key]}.`);
        } else {
          cache[key] = type;
        }
      };
    }
    let shouldCacheAccess = true;
    function applyOptions(instance) {
      const options = resolveMergedOptions(instance);
      const publicThis = instance.proxy;
      const ctx = instance.ctx;
      shouldCacheAccess = false;
      if (options.beforeCreate) {
        callHook(options.beforeCreate, instance, "bc");
      }
      const {data: dataOptions, computed: computedOptions, methods, watch: watchOptions, provide: provideOptions, inject: injectOptions, created, beforeMount, mounted, beforeUpdate, updated, activated, deactivated, beforeDestroy, beforeUnmount, destroyed, unmounted, render, renderTracked, renderTriggered, errorCaptured, serverPrefetch, expose, inheritAttrs, components, directives, filters} = options;
      const checkDuplicateProperties = true ? createDuplicateChecker() : 0;
      if (true) {
        const [propsOptions] = instance.propsOptions;
        if (propsOptions) {
          for (const key in propsOptions) {
            checkDuplicateProperties("Props", key);
          }
        }
      }
      if (injectOptions) {
        resolveInjections(injectOptions, ctx, checkDuplicateProperties);
      }
      if (methods) {
        for (const key in methods) {
          const methodHandler = methods[key];
          if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(methodHandler)) {
            if (true) {
              Object.defineProperty(ctx, key, {
                value: methodHandler.bind(publicThis),
                configurable: true,
                enumerable: true,
                writable: true
              });
            } else {}
            if (true) {
              checkDuplicateProperties("Methods", key);
            }
          } else if (true) {
            warn$1(`Method "${key}" has type "${typeof methodHandler}" in the component definition. Did you reference the function correctly?`);
          }
        }
      }
      if (dataOptions) {
        if (true && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(dataOptions)) {
          warn$1(`The data option must be a function. Plain object usage is no longer supported.`);
        }
        const data = dataOptions.call(publicThis, publicThis);
        if (true && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isPromise)(data)) {
          warn$1(`data() returned a Promise - note data() cannot be async; If you intend to perform data fetching before component renders, use async setup() + <Suspense>.`);
        }
        if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(data)) {
          true && warn$1(`data() should return an object.`);
        } else {
          instance.data = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.reactive)(data);
          if (true) {
            for (const key in data) {
              checkDuplicateProperties("Data", key);
              if (!isReservedPrefix(key[0])) {
                Object.defineProperty(ctx, key, {
                  configurable: true,
                  enumerable: true,
                  get: () => data[key],
                  set: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP
                });
              }
            }
          }
        }
      }
      shouldCacheAccess = true;
      if (computedOptions) {
        for (const key in computedOptions) {
          const opt = computedOptions[key];
          const get = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(opt) ? opt.bind(publicThis, publicThis) : (0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(opt.get) ? opt.get.bind(publicThis, publicThis) : _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP;
          if (true && get === _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP) {
            warn$1(`Computed property "${key}" has no getter.`);
          }
          const set = !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(opt) && (0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(opt.set) ? opt.set.bind(publicThis) : true ? () => {
            warn$1(`Write operation failed: computed property "${key}" is readonly.`);
          } : 0;
          const c = computed({
            get,
            set
          });
          Object.defineProperty(ctx, key, {
            enumerable: true,
            configurable: true,
            get: () => c.value,
            set: v => c.value = v
          });
          if (true) {
            checkDuplicateProperties("Computed", key);
          }
        }
      }
      if (watchOptions) {
        for (const key in watchOptions) {
          createWatcher(watchOptions[key], ctx, publicThis, key);
        }
      }
      if (provideOptions) {
        const provides = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(provideOptions) ? provideOptions.call(publicThis) : provideOptions;
        Reflect.ownKeys(provides).forEach(key => {
          provide(key, provides[key]);
        });
      }
      if (created) {
        callHook(created, instance, "c");
      }
      function registerLifecycleHook(register, hook) {
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(hook)) {
          hook.forEach(_hook => register(_hook.bind(publicThis)));
        } else if (hook) {
          register(hook.bind(publicThis));
        }
      }
      registerLifecycleHook(onBeforeMount, beforeMount);
      registerLifecycleHook(onMounted, mounted);
      registerLifecycleHook(onBeforeUpdate, beforeUpdate);
      registerLifecycleHook(onUpdated, updated);
      registerLifecycleHook(onActivated, activated);
      registerLifecycleHook(onDeactivated, deactivated);
      registerLifecycleHook(onErrorCaptured, errorCaptured);
      registerLifecycleHook(onRenderTracked, renderTracked);
      registerLifecycleHook(onRenderTriggered, renderTriggered);
      registerLifecycleHook(onBeforeUnmount, beforeUnmount);
      registerLifecycleHook(onUnmounted, unmounted);
      registerLifecycleHook(onServerPrefetch, serverPrefetch);
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(expose)) {
        if (expose.length) {
          const exposed = instance.exposed || (instance.exposed = {});
          expose.forEach(key => {
            Object.defineProperty(exposed, key, {
              get: () => publicThis[key],
              set: val => publicThis[key] = val,
              enumerable: true
            });
          });
        } else if (!instance.exposed) {
          instance.exposed = {};
        }
      }
      if (render && instance.render === _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP) {
        instance.render = render;
      }
      if (inheritAttrs != null) {
        instance.inheritAttrs = inheritAttrs;
      }
      if (components) instance.components = components;
      if (directives) instance.directives = directives;
      if (serverPrefetch) {
        markAsyncBoundary(instance);
      }
    }
    function resolveInjections(injectOptions, ctx, checkDuplicateProperties = _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP) {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(injectOptions)) {
        injectOptions = normalizeInject(injectOptions);
      }
      for (const key in injectOptions) {
        const opt = injectOptions[key];
        let injected;
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(opt)) {
          if ("default" in opt) {
            injected = inject(opt.from || key, opt.default, true);
          } else {
            injected = inject(opt.from || key);
          }
        } else {
          injected = inject(opt);
        }
        if ((0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isRef)(injected)) {
          Object.defineProperty(ctx, key, {
            enumerable: true,
            configurable: true,
            get: () => injected.value,
            set: v => injected.value = v
          });
        } else {
          ctx[key] = injected;
        }
        if (true) {
          checkDuplicateProperties("Inject", key);
        }
      }
    }
    function callHook(hook, instance, type) {
      callWithAsyncErrorHandling((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(hook) ? hook.map(h => h.bind(instance.proxy)) : hook.bind(instance.proxy), instance, type);
    }
    function createWatcher(raw, ctx, publicThis, key) {
      let getter = key.includes(".") ? createPathGetter(publicThis, key) : () => publicThis[key];
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(raw)) {
        const handler = ctx[raw];
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(handler)) {
          {
            watch(getter, handler);
          }
        } else if (true) {
          warn$1(`Invalid watch handler specified by key "${raw}"`, handler);
        }
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(raw)) {
        {
          watch(getter, raw.bind(publicThis));
        }
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(raw)) {
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(raw)) {
          raw.forEach(r => createWatcher(r, ctx, publicThis, key));
        } else {
          const handler = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler];
          if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(handler)) {
            watch(getter, handler, raw);
          } else if (true) {
            warn$1(`Invalid watch handler specified by key "${raw.handler}"`, handler);
          }
        }
      } else if (true) {
        warn$1(`Invalid watch option: "${key}"`, raw);
      }
    }
    function resolveMergedOptions(instance) {
      const base = instance.type;
      const {mixins, extends: extendsOptions} = base;
      const {mixins: globalMixins, optionsCache: cache, config: {optionMergeStrategies}} = instance.appContext;
      const cached = cache.get(base);
      let resolved;
      if (cached) {
        resolved = cached;
      } else if (!globalMixins.length && !mixins && !extendsOptions) {
        {
          resolved = base;
        }
      } else {
        resolved = {};
        if (globalMixins.length) {
          globalMixins.forEach(m => mergeOptions(resolved, m, optionMergeStrategies, true));
        }
        mergeOptions(resolved, base, optionMergeStrategies);
      }
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(base)) {
        cache.set(base, resolved);
      }
      return resolved;
    }
    function mergeOptions(to, from, strats, asMixin = false) {
      const {mixins, extends: extendsOptions} = from;
      if (extendsOptions) {
        mergeOptions(to, extendsOptions, strats, true);
      }
      if (mixins) {
        mixins.forEach(m => mergeOptions(to, m, strats, true));
      }
      for (const key in from) {
        if (asMixin && key === "expose") {
          true && warn$1(`"expose" option is ignored when declared in mixins or extends. It should only be declared in the base component itself.`);
        } else {
          const strat = internalOptionMergeStrats[key] || strats && strats[key];
          to[key] = strat ? strat(to[key], from[key]) : from[key];
        }
      }
      return to;
    }
    const internalOptionMergeStrats = {
      data: mergeDataFn,
      props: mergeEmitsOrPropsOptions,
      emits: mergeEmitsOrPropsOptions,
      methods: mergeObjectOptions,
      computed: mergeObjectOptions,
      beforeCreate: mergeAsArray,
      created: mergeAsArray,
      beforeMount: mergeAsArray,
      mounted: mergeAsArray,
      beforeUpdate: mergeAsArray,
      updated: mergeAsArray,
      beforeDestroy: mergeAsArray,
      beforeUnmount: mergeAsArray,
      destroyed: mergeAsArray,
      unmounted: mergeAsArray,
      activated: mergeAsArray,
      deactivated: mergeAsArray,
      errorCaptured: mergeAsArray,
      serverPrefetch: mergeAsArray,
      components: mergeObjectOptions,
      directives: mergeObjectOptions,
      watch: mergeWatchOptions,
      provide: mergeDataFn,
      inject: mergeInject
    };
    function mergeDataFn(to, from) {
      if (!from) {
        return to;
      }
      if (!to) {
        return from;
      }
      return function mergedDataFn() {
        return (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(to) ? to.call(this, this) : to, (0, 
        _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(from) ? from.call(this, this) : from);
      };
    }
    function mergeInject(to, from) {
      return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
    }
    function normalizeInject(raw) {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(raw)) {
        const res = {};
        for (let i = 0; i < raw.length; i++) {
          res[raw[i]] = raw[i];
        }
        return res;
      }
      return raw;
    }
    function mergeAsArray(to, from) {
      return to ? [ ...new Set([].concat(to, from)) ] : from;
    }
    function mergeObjectOptions(to, from) {
      return to ? (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)(Object.create(null), to, from) : from;
    }
    function mergeEmitsOrPropsOptions(to, from) {
      if (to) {
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(to) && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(from)) {
          return [ ...new Set([ ...to, ...from ]) ];
        }
        return (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)(Object.create(null), normalizePropsOrEmits(to), normalizePropsOrEmits(from != null ? from : {}));
      } else {
        return from;
      }
    }
    function mergeWatchOptions(to, from) {
      if (!to) return from;
      if (!from) return to;
      const merged = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)(Object.create(null), to);
      for (const key in from) {
        merged[key] = mergeAsArray(to[key], from[key]);
      }
      return merged;
    }
    function createAppContext() {
      return {
        app: null,
        config: {
          isNativeTag: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NO,
          performance: false,
          globalProperties: {},
          optionMergeStrategies: {},
          errorHandler: void 0,
          warnHandler: void 0,
          compilerOptions: {}
        },
        mixins: [],
        components: {},
        directives: {},
        provides: Object.create(null),
        optionsCache: new WeakMap,
        propsCache: new WeakMap,
        emitsCache: new WeakMap
      };
    }
    let uid$1 = 0;
    function createAppAPI(render, hydrate) {
      return function createApp(rootComponent, rootProps = null) {
        if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(rootComponent)) {
          rootComponent = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({}, rootComponent);
        }
        if (rootProps != null && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(rootProps)) {
          true && warn$1(`root props passed to app.mount() must be an object.`);
          rootProps = null;
        }
        const context = createAppContext();
        const installedPlugins = new WeakSet;
        const pluginCleanupFns = [];
        let isMounted = false;
        const app = context.app = {
          _uid: uid$1++,
          _component: rootComponent,
          _props: rootProps,
          _container: null,
          _context: context,
          _instance: null,
          version,
          get config() {
            return context.config;
          },
          set config(v) {
            if (true) {
              warn$1(`app.config cannot be replaced. Modify individual options instead.`);
            }
          },
          use(plugin, ...options) {
            if (installedPlugins.has(plugin)) {
              true && warn$1(`Plugin has already been applied to target app.`);
            } else if (plugin && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(plugin.install)) {
              installedPlugins.add(plugin);
              plugin.install(app, ...options);
            } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(plugin)) {
              installedPlugins.add(plugin);
              plugin(app, ...options);
            } else if (true) {
              warn$1(`A plugin must either be a function or an object with an "install" function.`);
            }
            return app;
          },
          mixin(mixin) {
            if (false) {} else if (true) {
              warn$1("Mixins are only available in builds supporting Options API");
            }
            return app;
          },
          component(name, component) {
            if (true) {
              validateComponentName(name, context.config);
            }
            if (!component) {
              return context.components[name];
            }
            if (true && context.components[name]) {
              warn$1(`Component "${name}" has already been registered in target app.`);
            }
            context.components[name] = component;
            return app;
          },
          directive(name, directive) {
            if (true) {
              validateDirectiveName(name);
            }
            if (!directive) {
              return context.directives[name];
            }
            if (true && context.directives[name]) {
              warn$1(`Directive "${name}" has already been registered in target app.`);
            }
            context.directives[name] = directive;
            return app;
          },
          mount(rootContainer, isHydrate, namespace) {
            if (!isMounted) {
              if (true && rootContainer.__vue_app__) {
                warn$1(`There is already an app instance mounted on the host container.\n If you want to mount another app on the same host container, you need to unmount the previous app by calling \`app.unmount()\` first.`);
              }
              const vnode = app._ceVNode || createVNode(rootComponent, rootProps);
              vnode.appContext = context;
              if (namespace === true) {
                namespace = "svg";
              } else if (namespace === false) {
                namespace = void 0;
              }
              if (true) {
                context.reload = () => {
                  const cloned = cloneVNode(vnode);
                  cloned.el = null;
                  render(cloned, rootContainer, namespace);
                };
              }
              if (isHydrate && hydrate) {
                hydrate(vnode, rootContainer);
              } else {
                render(vnode, rootContainer, namespace);
              }
              isMounted = true;
              app._container = rootContainer;
              rootContainer.__vue_app__ = app;
              if (true) {
                app._instance = vnode.component;
                devtoolsInitApp(app, version);
              }
              return getComponentPublicInstance(vnode.component);
            } else if (true) {
              warn$1(`App has already been mounted.\nIf you want to remount the same app, move your app creation logic into a factory function and create fresh app instances for each mount - e.g. \`const createMyApp = () => createApp(App)\``);
            }
          },
          onUnmount(cleanupFn) {
            if (true && typeof cleanupFn !== "function") {
              warn$1(`Expected function as first argument to app.onUnmount(), but got ${typeof cleanupFn}`);
            }
            pluginCleanupFns.push(cleanupFn);
          },
          unmount() {
            if (isMounted) {
              callWithAsyncErrorHandling(pluginCleanupFns, app._instance, 16);
              render(null, app._container);
              if (true) {
                app._instance = null;
                devtoolsUnmountApp(app);
              }
              delete app._container.__vue_app__;
            } else if (true) {
              warn$1(`Cannot unmount an app that is not mounted.`);
            }
          },
          provide(key, value) {
            if (true && key in context.provides) {
              if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(context.provides, key)) {
                warn$1(`App already provides property with key "${String(key)}". It will be overwritten with the new value.`);
              } else {
                warn$1(`App already provides property with key "${String(key)}" inherited from its parent element. It will be overwritten with the new value.`);
              }
            }
            context.provides[key] = value;
            return app;
          },
          runWithContext(fn) {
            const lastApp = currentApp;
            currentApp = app;
            try {
              return fn();
            } finally {
              currentApp = lastApp;
            }
          }
        };
        return app;
      };
    }
    let currentApp = null;
    function useModel(props, name, options = _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ) {
      const i = getCurrentInstance();
      if (true && !i) {
        warn$1(`useModel() called without active instance.`);
        return (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.ref)();
      }
      const camelizedName = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(name);
      if (true && !i.propsOptions[0][camelizedName]) {
        warn$1(`useModel() called with prop "${name}" which is not declared.`);
        return (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.ref)();
      }
      const hyphenatedName = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hyphenate)(name);
      const modifiers = getModelModifiers(props, camelizedName);
      const res = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.customRef)((track, trigger) => {
        let localValue;
        let prevSetValue = _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ;
        let prevEmittedValue;
        watchSyncEffect(() => {
          const propValue = props[camelizedName];
          if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasChanged)(localValue, propValue)) {
            localValue = propValue;
            trigger();
          }
        });
        return {
          get() {
            track();
            return options.get ? options.get(localValue) : localValue;
          },
          set(value) {
            const emittedValue = options.set ? options.set(value) : value;
            if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasChanged)(emittedValue, localValue) && !(prevSetValue !== _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ && (0, 
            _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasChanged)(value, prevSetValue))) {
              return;
            }
            const rawProps = i.vnode.props;
            if (!(rawProps && (name in rawProps || camelizedName in rawProps || hyphenatedName in rawProps) && (`onUpdate:${name}` in rawProps || `onUpdate:${camelizedName}` in rawProps || `onUpdate:${hyphenatedName}` in rawProps))) {
              localValue = value;
              trigger();
            }
            i.emit(`update:${name}`, emittedValue);
            if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasChanged)(value, emittedValue) && (0, 
            _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasChanged)(value, prevSetValue) && !(0, 
            _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasChanged)(emittedValue, prevEmittedValue)) {
              trigger();
            }
            prevSetValue = value;
            prevEmittedValue = emittedValue;
          }
        };
      });
      res[Symbol.iterator] = () => {
        let i2 = 0;
        return {
          next() {
            if (i2 < 2) {
              return {
                value: i2++ ? modifiers || _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ : res,
                done: false
              };
            } else {
              return {
                done: true
              };
            }
          }
        };
      };
      return res;
    }
    const getModelModifiers = (props, modelName) => modelName === "modelValue" || modelName === "model-value" ? props.modelModifiers : props[`${modelName}Modifiers`] || props[`${(0, 
    _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(modelName)}Modifiers`] || props[`${(0, 
    _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hyphenate)(modelName)}Modifiers`];
    function emit(instance, event, ...rawArgs) {
      if (instance.isUnmounted) return;
      const props = instance.vnode.props || _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ;
      if (true) {
        const {emitsOptions, propsOptions: [propsOptions]} = instance;
        if (emitsOptions) {
          if (!(event in emitsOptions) && true) {
            if (!propsOptions || !((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toHandlerKey)((0, 
            _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(event)) in propsOptions)) {
              warn$1(`Component emitted event "${event}" but it is neither declared in the emits option nor as an "${(0, 
              _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toHandlerKey)((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(event))}" prop.`);
            }
          } else {
            const validator = emitsOptions[event];
            if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(validator)) {
              const isValid = validator(...rawArgs);
              if (!isValid) {
                warn$1(`Invalid event arguments: event validation failed for event "${event}".`);
              }
            }
          }
        }
      }
      let args = rawArgs;
      const isModelListener = event.startsWith("update:");
      const modifiers = isModelListener && getModelModifiers(props, event.slice(7));
      if (modifiers) {
        if (modifiers.trim) {
          args = rawArgs.map(a => (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(a) ? a.trim() : a);
        }
        if (modifiers.number) {
          args = rawArgs.map(_vue_shared__WEBPACK_IMPORTED_MODULE_1__.looseToNumber);
        }
      }
      if (true) {
        devtoolsComponentEmit(instance, event, args);
      }
      if (true) {
        const lowerCaseEvent = event.toLowerCase();
        if (lowerCaseEvent !== event && props[(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toHandlerKey)(lowerCaseEvent)]) {
          warn$1(`Event "${lowerCaseEvent}" is emitted in component ${formatComponentName(instance, instance.type)} but the handler is registered for "${event}". Note that HTML attributes are case-insensitive and you cannot use v-on to listen to camelCase events when using in-DOM templates. You should probably use "${(0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hyphenate)(event)}" instead of "${event}".`);
        }
      }
      let handlerName;
      let handler = props[handlerName = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toHandlerKey)(event)] || props[handlerName = (0, 
      _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toHandlerKey)((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(event))];
      if (!handler && isModelListener) {
        handler = props[handlerName = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toHandlerKey)((0, 
        _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hyphenate)(event))];
      }
      if (handler) {
        callWithAsyncErrorHandling(handler, instance, 6, args);
      }
      const onceHandler = props[handlerName + `Once`];
      if (onceHandler) {
        if (!instance.emitted) {
          instance.emitted = {};
        } else if (instance.emitted[handlerName]) {
          return;
        }
        instance.emitted[handlerName] = true;
        callWithAsyncErrorHandling(onceHandler, instance, 6, args);
      }
    }
    const mixinEmitsCache = new WeakMap;
    function normalizeEmitsOptions(comp, appContext, asMixin = false) {
      const cache = false ? 0 : appContext.emitsCache;
      const cached = cache.get(comp);
      if (cached !== void 0) {
        return cached;
      }
      const raw = comp.emits;
      let normalized = {};
      let hasExtends = false;
      if (false) {}
      if (!raw && !hasExtends) {
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(comp)) {
          cache.set(comp, null);
        }
        return null;
      }
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(raw)) {
        raw.forEach(key => normalized[key] = null);
      } else {
        (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)(normalized, raw);
      }
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(comp)) {
        cache.set(comp, normalized);
      }
      return normalized;
    }
    function isEmitListener(options, key) {
      if (!options || !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isOn)(key)) {
        return false;
      }
      key = key.slice(2).replace(/Once$/, "");
      return (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(options, key[0].toLowerCase() + key.slice(1)) || (0, 
      _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(options, (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hyphenate)(key)) || (0, 
      _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(options, key);
    }
    let accessedAttrs = false;
    function markAttrsAccessed() {
      accessedAttrs = true;
    }
    function renderComponentRoot(instance) {
      const {type: Component, vnode, proxy, withProxy, propsOptions: [propsOptions], slots, attrs, emit, render, renderCache, props, data, setupState, ctx, inheritAttrs} = instance;
      const prev = setCurrentRenderingInstance(instance);
      let result;
      let fallthroughAttrs;
      if (true) {
        accessedAttrs = false;
      }
      try {
        if (vnode.shapeFlag & 4) {
          const proxyToUse = withProxy || proxy;
          const thisProxy = true && setupState.__isScriptSetup ? new Proxy(proxyToUse, {
            get(target, key, receiver) {
              warn$1(`Property '${String(key)}' was accessed via 'this'. Avoid using 'this' in templates.`);
              return Reflect.get(target, key, receiver);
            }
          }) : proxyToUse;
          result = normalizeVNode(render.call(thisProxy, proxyToUse, renderCache, true ? (0, 
          _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly)(props) : 0, setupState, data, ctx));
          fallthroughAttrs = attrs;
        } else {
          const render2 = Component;
          if (true && attrs === props) {
            markAttrsAccessed();
          }
          result = normalizeVNode(render2.length > 1 ? render2(true ? (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly)(props) : 0, true ? {
            get attrs() {
              markAttrsAccessed();
              return (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly)(attrs);
            },
            slots,
            emit
          } : 0) : render2(true ? (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly)(props) : 0, null));
          fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
        }
      } catch (err) {
        blockStack.length = 0;
        handleError(err, instance, 1);
        result = createVNode(Comment);
      }
      let root = result;
      let setRoot = void 0;
      if (true && result.patchFlag > 0 && result.patchFlag & 2048) {
        [root, setRoot] = getChildRoot(result);
      }
      if (fallthroughAttrs && inheritAttrs !== false) {
        const keys = Object.keys(fallthroughAttrs);
        const {shapeFlag} = root;
        if (keys.length) {
          if (shapeFlag & (1 | 6)) {
            if (propsOptions && keys.some(_vue_shared__WEBPACK_IMPORTED_MODULE_1__.isModelListener)) {
              fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
            }
            root = cloneVNode(root, fallthroughAttrs, false, true);
          } else if (true && !accessedAttrs && root.type !== Comment) {
            const allAttrs = Object.keys(attrs);
            const eventAttrs = [];
            const extraAttrs = [];
            for (let i = 0, l = allAttrs.length; i < l; i++) {
              const key = allAttrs[i];
              if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isOn)(key)) {
                if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isModelListener)(key)) {
                  eventAttrs.push(key[2].toLowerCase() + key.slice(3));
                }
              } else {
                extraAttrs.push(key);
              }
            }
            if (extraAttrs.length) {
              warn$1(`Extraneous non-props attributes (${extraAttrs.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.`);
            }
            if (eventAttrs.length) {
              warn$1(`Extraneous non-emits event listeners (${eventAttrs.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text root nodes. If the listener is intended to be a component custom event listener only, declare it using the "emits" option.`);
            }
          }
        }
      }
      if (vnode.dirs) {
        if (true && !isElementRoot(root)) {
          warn$1(`Runtime directive used on component with non-element root node. The directives will not function as intended.`);
        }
        root = cloneVNode(root, null, false, true);
        root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
      }
      if (vnode.transition) {
        if (true && !isElementRoot(root)) {
          warn$1(`Component inside <Transition> renders non-element root node that cannot be animated.`);
        }
        setTransitionHooks(root, vnode.transition);
      }
      if (true && setRoot) {
        setRoot(root);
      } else {
        result = root;
      }
      setCurrentRenderingInstance(prev);
      return result;
    }
    const getChildRoot = vnode => {
      const rawChildren = vnode.children;
      const dynamicChildren = vnode.dynamicChildren;
      const childRoot = filterSingleRoot(rawChildren, false);
      if (!childRoot) {
        return [ vnode, void 0 ];
      } else if (true && childRoot.patchFlag > 0 && childRoot.patchFlag & 2048) {
        return getChildRoot(childRoot);
      }
      const index = rawChildren.indexOf(childRoot);
      const dynamicIndex = dynamicChildren ? dynamicChildren.indexOf(childRoot) : -1;
      const setRoot = updatedRoot => {
        rawChildren[index] = updatedRoot;
        if (dynamicChildren) {
          if (dynamicIndex > -1) {
            dynamicChildren[dynamicIndex] = updatedRoot;
          } else if (updatedRoot.patchFlag > 0) {
            vnode.dynamicChildren = [ ...dynamicChildren, updatedRoot ];
          }
        }
      };
      return [ normalizeVNode(childRoot), setRoot ];
    };
    function filterSingleRoot(children, recurse = true) {
      let singleRoot;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isVNode(child)) {
          if (child.type !== Comment || child.children === "v-if") {
            if (singleRoot) {
              return;
            } else {
              singleRoot = child;
              if (true && recurse && singleRoot.patchFlag > 0 && singleRoot.patchFlag & 2048) {
                return filterSingleRoot(singleRoot.children);
              }
            }
          }
        } else {
          return;
        }
      }
      return singleRoot;
    }
    const getFunctionalFallthrough = attrs => {
      let res;
      for (const key in attrs) {
        if (key === "class" || key === "style" || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isOn)(key)) {
          (res || (res = {}))[key] = attrs[key];
        }
      }
      return res;
    };
    const filterModelListeners = (attrs, props) => {
      const res = {};
      for (const key in attrs) {
        if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isModelListener)(key) || !(key.slice(9) in props)) {
          res[key] = attrs[key];
        }
      }
      return res;
    };
    const isElementRoot = vnode => vnode.shapeFlag & (6 | 1) || vnode.type === Comment;
    function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
      const {props: prevProps, children: prevChildren, component} = prevVNode;
      const {props: nextProps, children: nextChildren, patchFlag} = nextVNode;
      const emits = component.emitsOptions;
      if (true && (prevChildren || nextChildren) && isHmrUpdating) {
        return true;
      }
      if (nextVNode.dirs || nextVNode.transition) {
        return true;
      }
      if (optimized && patchFlag >= 0) {
        if (patchFlag & 1024) {
          return true;
        }
        if (patchFlag & 16) {
          if (!prevProps) {
            return !!nextProps;
          }
          return hasPropsChanged(prevProps, nextProps, emits);
        } else if (patchFlag & 8) {
          const dynamicProps = nextVNode.dynamicProps;
          for (let i = 0; i < dynamicProps.length; i++) {
            const key = dynamicProps[i];
            if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emits, key)) {
              return true;
            }
          }
        }
      } else {
        if (prevChildren || nextChildren) {
          if (!nextChildren || !nextChildren.$stable) {
            return true;
          }
        }
        if (prevProps === nextProps) {
          return false;
        }
        if (!prevProps) {
          return !!nextProps;
        }
        if (!nextProps) {
          return true;
        }
        return hasPropsChanged(prevProps, nextProps, emits);
      }
      return false;
    }
    function hasPropsChanged(prevProps, nextProps, emitsOptions) {
      const nextKeys = Object.keys(nextProps);
      if (nextKeys.length !== Object.keys(prevProps).length) {
        return true;
      }
      for (let i = 0; i < nextKeys.length; i++) {
        const key = nextKeys[i];
        if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emitsOptions, key)) {
          return true;
        }
      }
      return false;
    }
    function hasPropValueChanged(nextProps, prevProps, key) {
      const nextProp = nextProps[key];
      const prevProp = prevProps[key];
      if (key === "style" && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(nextProp) && (0, 
      _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(prevProp)) {
        return !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.looseEqual)(nextProp, prevProp);
      }
      return nextProp !== prevProp;
    }
    function updateHOCHostEl({vnode, parent, suspense}, el) {
      while (parent) {
        const root = parent.subTree;
        if (root.suspense && root.suspense.activeBranch === vnode) {
          root.suspense.vnode.el = root.el = el;
          vnode = root;
        }
        if (root === vnode) {
          (vnode = parent.vnode).el = el;
          parent = parent.parent;
        } else {
          break;
        }
      }
      if (suspense && suspense.activeBranch === vnode) {
        suspense.vnode.el = el;
      }
    }
    const internalObjectProto = {};
    const createInternalObject = () => Object.create(internalObjectProto);
    const isInternalObject = obj => Object.getPrototypeOf(obj) === internalObjectProto;
    function initProps(instance, rawProps, isStateful, isSSR = false) {
      const props = {};
      const attrs = createInternalObject();
      instance.propsDefaults = Object.create(null);
      setFullProps(instance, rawProps, props, attrs);
      for (const key in instance.propsOptions[0]) {
        if (!(key in props)) {
          props[key] = void 0;
        }
      }
      if (true) {
        validateProps(rawProps || {}, props, instance);
      }
      if (isStateful) {
        instance.props = isSSR ? props : (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReactive)(props);
      } else {
        if (!instance.type.props) {
          instance.props = attrs;
        } else {
          instance.props = props;
        }
      }
      instance.attrs = attrs;
    }
    function isInHmrContext(instance) {
      while (instance) {
        if (instance.type.__hmrId) return true;
        instance = instance.parent;
      }
    }
    function updateProps(instance, rawProps, rawPrevProps, optimized) {
      const {props, attrs, vnode: {patchFlag}} = instance;
      const rawCurrentProps = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(props);
      const [options] = instance.propsOptions;
      let hasAttrsChanged = false;
      if (!(true && isInHmrContext(instance)) && (optimized || patchFlag > 0) && !(patchFlag & 16)) {
        if (patchFlag & 8) {
          const propsToUpdate = instance.vnode.dynamicProps;
          for (let i = 0; i < propsToUpdate.length; i++) {
            let key = propsToUpdate[i];
            if (isEmitListener(instance.emitsOptions, key)) {
              continue;
            }
            const value = rawProps[key];
            if (options) {
              if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(attrs, key)) {
                if (value !== attrs[key]) {
                  attrs[key] = value;
                  hasAttrsChanged = true;
                }
              } else {
                const camelizedKey = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(key);
                props[camelizedKey] = resolvePropValue(options, rawCurrentProps, camelizedKey, value, instance, false);
              }
            } else {
              if (value !== attrs[key]) {
                attrs[key] = value;
                hasAttrsChanged = true;
              }
            }
          }
        }
      } else {
        if (setFullProps(instance, rawProps, props, attrs)) {
          hasAttrsChanged = true;
        }
        let kebabKey;
        for (const key in rawCurrentProps) {
          if (!rawProps || !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(rawProps, key) && ((kebabKey = (0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hyphenate)(key)) === key || !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(rawProps, kebabKey))) {
            if (options) {
              if (rawPrevProps && (rawPrevProps[key] !== void 0 || rawPrevProps[kebabKey] !== void 0)) {
                props[key] = resolvePropValue(options, rawCurrentProps, key, void 0, instance, true);
              }
            } else {
              delete props[key];
            }
          }
        }
        if (attrs !== rawCurrentProps) {
          for (const key in attrs) {
            if (!rawProps || !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(rawProps, key) && true) {
              delete attrs[key];
              hasAttrsChanged = true;
            }
          }
        }
      }
      if (hasAttrsChanged) {
        (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.trigger)(instance.attrs, "set", "");
      }
      if (true) {
        validateProps(rawProps || {}, props, instance);
      }
    }
    function setFullProps(instance, rawProps, props, attrs) {
      const [options, needCastKeys] = instance.propsOptions;
      let hasAttrsChanged = false;
      let rawCastValues;
      if (rawProps) {
        for (let key in rawProps) {
          if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isReservedProp)(key)) {
            continue;
          }
          const value = rawProps[key];
          let camelKey;
          if (options && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(options, camelKey = (0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(key))) {
            if (!needCastKeys || !needCastKeys.includes(camelKey)) {
              props[camelKey] = value;
            } else {
              (rawCastValues || (rawCastValues = {}))[camelKey] = value;
            }
          } else if (!isEmitListener(instance.emitsOptions, key)) {
            if (!(key in attrs) || value !== attrs[key]) {
              attrs[key] = value;
              hasAttrsChanged = true;
            }
          }
        }
      }
      if (needCastKeys) {
        const rawCurrentProps = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(props);
        const castValues = rawCastValues || _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ;
        for (let i = 0; i < needCastKeys.length; i++) {
          const key = needCastKeys[i];
          props[key] = resolvePropValue(options, rawCurrentProps, key, castValues[key], instance, !(0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(castValues, key));
        }
      }
      return hasAttrsChanged;
    }
    function resolvePropValue(options, props, key, value, instance, isAbsent) {
      const opt = options[key];
      if (opt != null) {
        const hasDefault = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(opt, "default");
        if (hasDefault && value === void 0) {
          const defaultValue = opt.default;
          if (opt.type !== Function && !opt.skipFactory && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(defaultValue)) {
            const {propsDefaults} = instance;
            if (key in propsDefaults) {
              value = propsDefaults[key];
            } else {
              const reset = setCurrentInstance(instance);
              value = propsDefaults[key] = defaultValue.call(null, props);
              reset();
            }
          } else {
            value = defaultValue;
          }
          if (instance.ce) {
            instance.ce._setProp(key, value);
          }
        }
        if (opt[0]) {
          if (isAbsent && !hasDefault) {
            value = false;
          } else if (opt[1] && (value === "" || value === (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hyphenate)(key))) {
            value = true;
          }
        }
      }
      return value;
    }
    const mixinPropsCache = new WeakMap;
    function normalizePropsOptions(comp, appContext, asMixin = false) {
      const cache = false ? 0 : appContext.propsCache;
      const cached = cache.get(comp);
      if (cached) {
        return cached;
      }
      const raw = comp.props;
      const normalized = {};
      const needCastKeys = [];
      let hasExtends = false;
      if (false) {}
      if (!raw && !hasExtends) {
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(comp)) {
          cache.set(comp, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_ARR);
        }
        return _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_ARR;
      }
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(raw)) {
        for (let i = 0; i < raw.length; i++) {
          if (true && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(raw[i])) {
            warn$1(`props must be strings when using array syntax.`, raw[i]);
          }
          const normalizedKey = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(raw[i]);
          if (validatePropName(normalizedKey)) {
            normalized[normalizedKey] = _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ;
          }
        }
      } else if (raw) {
        if (true && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(raw)) {
          warn$1(`invalid props options`, raw);
        }
        for (const key in raw) {
          const normalizedKey = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(key);
          if (validatePropName(normalizedKey)) {
            const opt = raw[key];
            const prop = normalized[normalizedKey] = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(opt) || (0, 
            _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(opt) ? {
              type: opt
            } : (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({}, opt);
            const propType = prop.type;
            let shouldCast = false;
            let shouldCastTrue = true;
            if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(propType)) {
              for (let index = 0; index < propType.length; ++index) {
                const type = propType[index];
                const typeName = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(type) && type.name;
                if (typeName === "Boolean") {
                  shouldCast = true;
                  break;
                } else if (typeName === "String") {
                  shouldCastTrue = false;
                }
              }
            } else {
              shouldCast = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(propType) && propType.name === "Boolean";
            }
            prop[0] = shouldCast;
            prop[1] = shouldCastTrue;
            if (shouldCast || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasOwn)(prop, "default")) {
              needCastKeys.push(normalizedKey);
            }
          }
        }
      }
      const res = [ normalized, needCastKeys ];
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(comp)) {
        cache.set(comp, res);
      }
      return res;
    }
    function validatePropName(key) {
      if (key[0] !== "$" && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isReservedProp)(key)) {
        return true;
      } else if (true) {
        warn$1(`Invalid prop name: "${key}" is a reserved property.`);
      }
      return false;
    }
    function getType(ctor) {
      if (ctor === null) {
        return "null";
      }
      if (typeof ctor === "function") {
        return ctor.name || "";
      } else if (typeof ctor === "object") {
        const name = ctor.constructor && ctor.constructor.name;
        return name || "";
      }
      return "";
    }
    function validateProps(rawProps, props, instance) {
      const resolvedValues = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(props);
      const options = instance.propsOptions[0];
      const camelizePropsKey = Object.keys(rawProps).map(key => (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.camelize)(key));
      for (const key in options) {
        let opt = options[key];
        if (opt == null) continue;
        validateProp(key, resolvedValues[key], opt, true ? (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly)(resolvedValues) : 0, !camelizePropsKey.includes(key));
      }
    }
    function validateProp(name, value, prop, props, isAbsent) {
      const {type, required, validator, skipCheck} = prop;
      if (required && isAbsent) {
        warn$1('Missing required prop: "' + name + '"');
        return;
      }
      if (value == null && !required) {
        return;
      }
      if (type != null && type !== true && !skipCheck) {
        let isValid = false;
        const types = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(type) ? type : [ type ];
        const expectedTypes = [];
        for (let i = 0; i < types.length && !isValid; i++) {
          const {valid, expectedType} = assertType(value, types[i]);
          expectedTypes.push(expectedType || "");
          isValid = valid;
        }
        if (!isValid) {
          warn$1(getInvalidTypeMessage(name, value, expectedTypes));
          return;
        }
      }
      if (validator && !validator(value, props)) {
        warn$1('Invalid prop: custom validator check failed for prop "' + name + '".');
      }
    }
    const isSimpleType = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.makeMap)("String,Number,Boolean,Function,Symbol,BigInt");
    function assertType(value, type) {
      let valid;
      const expectedType = getType(type);
      if (expectedType === "null") {
        valid = value === null;
      } else if (isSimpleType(expectedType)) {
        const t = typeof value;
        valid = t === expectedType.toLowerCase();
        if (!valid && t === "object") {
          valid = value instanceof type;
        }
      } else if (expectedType === "Object") {
        valid = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(value);
      } else if (expectedType === "Array") {
        valid = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(value);
      } else {
        valid = value instanceof type;
      }
      return {
        valid,
        expectedType
      };
    }
    function getInvalidTypeMessage(name, value, expectedTypes) {
      if (expectedTypes.length === 0) {
        return `Prop type [] for prop "${name}" won't match anything. Did you mean to use type Array instead?`;
      }
      let message = `Invalid prop: type check failed for prop "${name}". Expected ${expectedTypes.map(_vue_shared__WEBPACK_IMPORTED_MODULE_1__.capitalize).join(" | ")}`;
      const expectedType = expectedTypes[0];
      const receivedType = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toRawType)(value);
      const expectedValue = styleValue(value, expectedType);
      const receivedValue = styleValue(value, receivedType);
      if (expectedTypes.length === 1 && isExplicable(expectedType) && isCoercible(expectedType, receivedType)) {
        message += ` with value ${expectedValue}`;
      }
      message += `, got ${receivedType} `;
      if (isExplicable(receivedType)) {
        message += `with value ${receivedValue}.`;
      }
      return message;
    }
    function styleValue(value, type) {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isSymbol)(value)) {
        return value.toString();
      } else if (type === "String") {
        return `"${value}"`;
      } else if (type === "Number") {
        return `${Number(value)}`;
      } else {
        return `${value}`;
      }
    }
    function isExplicable(type) {
      const explicitTypes = [ "string", "number", "boolean" ];
      return explicitTypes.some(elem => type.toLowerCase() === elem);
    }
    function isCoercible(...args) {
      return args.every(elem => {
        const value = elem.toLowerCase();
        return value !== "boolean" && value !== "symbol";
      });
    }
    const isInternalKey = key => key === "_" || key === "_ctx" || key === "$stable";
    const normalizeSlotValue = value => (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(value) ? value.map(normalizeVNode) : [ normalizeVNode(value) ];
    const normalizeSlot = (key, rawSlot, ctx) => {
      if (rawSlot._n) {
        return rawSlot;
      }
      const normalized = withCtx((...args) => {
        if (true && currentInstance && !(ctx === null && currentRenderingInstance) && !(ctx && ctx.root !== currentInstance.root)) {
          warn$1(`Slot "${key}" invoked outside of the render function: this will not track dependencies used in the slot. Invoke the slot function inside the render function instead.`);
        }
        return normalizeSlotValue(rawSlot(...args));
      }, ctx);
      normalized._c = false;
      return normalized;
    };
    const normalizeObjectSlots = (rawSlots, slots, instance) => {
      const ctx = rawSlots._ctx;
      for (const key in rawSlots) {
        if (isInternalKey(key)) continue;
        const value = rawSlots[key];
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(value)) {
          slots[key] = normalizeSlot(key, value, ctx);
        } else if (value != null) {
          if (true) {
            warn$1(`Non-function value encountered for slot "${key}". Prefer function slots for better performance.`);
          }
          const normalized = normalizeSlotValue(value);
          slots[key] = () => normalized;
        }
      }
    };
    const normalizeVNodeSlots = (instance, children) => {
      if (true && !isKeepAlive(instance.vnode) && true) {
        warn$1(`Non-function value encountered for default slot. Prefer function slots for better performance.`);
      }
      const normalized = normalizeSlotValue(children);
      instance.slots.default = () => normalized;
    };
    const assignSlots = (slots, children, optimized) => {
      for (const key in children) {
        if (optimized || !isInternalKey(key)) {
          slots[key] = children[key];
        }
      }
    };
    const initSlots = (instance, children, optimized) => {
      const slots = instance.slots = createInternalObject();
      if (instance.vnode.shapeFlag & 32) {
        const type = children._;
        if (type) {
          assignSlots(slots, children, optimized);
          if (optimized) {
            (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.def)(slots, "_", type, true);
          }
        } else {
          normalizeObjectSlots(children, slots);
        }
      } else if (children) {
        normalizeVNodeSlots(instance, children);
      }
    };
    const updateSlots = (instance, children, optimized) => {
      const {vnode, slots} = instance;
      let needDeletionCheck = true;
      let deletionComparisonTarget = _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ;
      if (vnode.shapeFlag & 32) {
        const type = children._;
        if (type) {
          if (true && isHmrUpdating) {
            assignSlots(slots, children, optimized);
            (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.trigger)(instance, "set", "$slots");
          } else if (optimized && type === 1) {
            needDeletionCheck = false;
          } else {
            assignSlots(slots, children, optimized);
          }
        } else {
          needDeletionCheck = !children.$stable;
          normalizeObjectSlots(children, slots);
        }
        deletionComparisonTarget = children;
      } else if (children) {
        normalizeVNodeSlots(instance, children);
        deletionComparisonTarget = {
          default: 1
        };
      }
      if (needDeletionCheck) {
        for (const key in slots) {
          if (!isInternalKey(key) && deletionComparisonTarget[key] == null) {
            delete slots[key];
          }
        }
      }
    };
    let supported;
    let perf;
    function startMeasure(instance, type) {
      if (instance.appContext.config.performance && isSupported()) {
        perf.mark(`vue-${type}-${instance.uid}`);
      }
      if (true) {
        devtoolsPerfStart(instance, type, isSupported() ? perf.now() : Date.now());
      }
    }
    function endMeasure(instance, type) {
      if (instance.appContext.config.performance && isSupported()) {
        const startTag = `vue-${type}-${instance.uid}`;
        const endTag = startTag + `:end`;
        const measureName = `<${formatComponentName(instance, instance.type)}> ${type}`;
        perf.mark(endTag);
        perf.measure(measureName, startTag, endTag);
        perf.clearMeasures(measureName);
        perf.clearMarks(startTag);
        perf.clearMarks(endTag);
      }
      if (true) {
        devtoolsPerfEnd(instance, type, isSupported() ? perf.now() : Date.now());
      }
    }
    function isSupported() {
      if (supported !== void 0) {
        return supported;
      }
      if (typeof window !== "undefined" && window.performance) {
        supported = true;
        perf = window.performance;
      } else {
        supported = false;
      }
      return supported;
    }
    function initFeatureFlags() {
      const needWarn = [];
      if (false) {}
      if (false) {}
      if (false) {}
      if (true && needWarn.length) {
        const multi = needWarn.length > 1;
        console.warn(`Feature flag${multi ? `s` : ``} ${needWarn.join(", ")} ${multi ? `are` : `is`} not explicitly defined. You are running the esm-bundler build of Vue, which expects these compile-time feature flags to be globally injected via the bundler config in order to get better tree-shaking in the production bundle.\n\nFor more details, see https://link.vuejs.org/feature-flags.`);
      }
    }
    const queuePostRenderEffect = queueEffectWithSuspense;
    function createRenderer(options) {
      return baseCreateRenderer(options);
    }
    function createHydrationRenderer(options) {
      return baseCreateRenderer(options, createHydrationFunctions);
    }
    function baseCreateRenderer(options, createHydrationFns) {
      {
        initFeatureFlags();
      }
      const target = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.getGlobalThis)();
      target.__VUE__ = true;
      if (true) {
        setDevtoolsHook$1(target.__VUE_DEVTOOLS_GLOBAL_HOOK__, target);
      }
      const {insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, parentNode: hostParentNode, nextSibling: hostNextSibling, setScopeId: hostSetScopeId = _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP, insertStaticContent: hostInsertStaticContent} = options;
      const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, namespace = void 0, slotScopeIds = null, optimized = (true && isHmrUpdating ? false : !!n2.dynamicChildren)) => {
        if (n1 === n2) {
          return;
        }
        if (n1 && !isSameVNodeType(n1, n2)) {
          anchor = getNextHostNode(n1);
          unmount(n1, parentComponent, parentSuspense, true);
          n1 = null;
        }
        if (n2.patchFlag === -2) {
          optimized = false;
          n2.dynamicChildren = null;
        }
        const {type, ref, shapeFlag} = n2;
        switch (type) {
         case Text:
          processText(n1, n2, container, anchor);
          break;

         case Comment:
          processCommentNode(n1, n2, container, anchor);
          break;

         case Static:
          if (n1 == null) {
            mountStaticNode(n2, container, anchor, namespace);
          } else if (true) {
            patchStaticNode(n1, n2, container, namespace);
          }
          break;

         case Fragment:
          processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
          break;

         default:
          if (shapeFlag & 1) {
            processElement(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
          } else if (shapeFlag & 6) {
            processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
          } else if (shapeFlag & 64) {
            type.process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals);
          } else if (shapeFlag & 128) {
            type.process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, internals);
          } else if (true) {
            warn$1("Invalid VNode type:", type, `(${typeof type})`);
          }
        }
        if (ref != null && parentComponent) {
          setRef(ref, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
        } else if (ref == null && n1 && n1.ref != null) {
          setRef(n1.ref, null, parentSuspense, n1, true);
        }
      };
      const processText = (n1, n2, container, anchor) => {
        if (n1 == null) {
          hostInsert(n2.el = hostCreateText(n2.children), container, anchor);
        } else {
          const el = n2.el = n1.el;
          if (n2.children !== n1.children) {
            hostSetText(el, n2.children);
          }
        }
      };
      const processCommentNode = (n1, n2, container, anchor) => {
        if (n1 == null) {
          hostInsert(n2.el = hostCreateComment(n2.children || ""), container, anchor);
        } else {
          n2.el = n1.el;
        }
      };
      const mountStaticNode = (n2, container, anchor, namespace) => {
        [n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, namespace, n2.el, n2.anchor);
      };
      const patchStaticNode = (n1, n2, container, namespace) => {
        if (n2.children !== n1.children) {
          const anchor = hostNextSibling(n1.anchor);
          removeStaticNode(n1);
          [n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, namespace);
        } else {
          n2.el = n1.el;
          n2.anchor = n1.anchor;
        }
      };
      const moveStaticNode = ({el, anchor}, container, nextSibling) => {
        let next;
        while (el && el !== anchor) {
          next = hostNextSibling(el);
          hostInsert(el, container, nextSibling);
          el = next;
        }
        hostInsert(anchor, container, nextSibling);
      };
      const removeStaticNode = ({el, anchor}) => {
        let next;
        while (el && el !== anchor) {
          next = hostNextSibling(el);
          hostRemove(el);
          el = next;
        }
        hostRemove(anchor);
      };
      const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
        if (n2.type === "svg") {
          namespace = "svg";
        } else if (n2.type === "math") {
          namespace = "mathml";
        }
        if (n1 == null) {
          mountElement(n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
        } else {
          const customElement = n1.el && n1.el._isVueCE ? n1.el : null;
          try {
            if (customElement) {
              customElement._beginPatch();
            }
            patchElement(n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
          } finally {
            if (customElement) {
              customElement._endPatch();
            }
          }
        }
      };
      const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
        let el;
        let vnodeHook;
        const {props, shapeFlag, transition, dirs} = vnode;
        el = vnode.el = hostCreateElement(vnode.type, namespace, props && props.is, props);
        if (shapeFlag & 8) {
          hostSetElementText(el, vnode.children);
        } else if (shapeFlag & 16) {
          mountChildren(vnode.children, el, null, parentComponent, parentSuspense, resolveChildrenNamespace(vnode, namespace), slotScopeIds, optimized);
        }
        if (dirs) {
          invokeDirectiveHook(vnode, null, parentComponent, "created");
        }
        setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
        if (props) {
          for (const key in props) {
            if (key !== "value" && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isReservedProp)(key)) {
              hostPatchProp(el, key, null, props[key], namespace, parentComponent);
            }
          }
          if ("value" in props) {
            hostPatchProp(el, "value", null, props.value, namespace);
          }
          if (vnodeHook = props.onVnodeBeforeMount) {
            invokeVNodeHook(vnodeHook, parentComponent, vnode);
          }
        }
        if (true) {
          (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.def)(el, "__vnode", vnode, true);
          (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.def)(el, "__vueParentComponent", parentComponent, true);
        }
        if (dirs) {
          invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
        }
        const needCallTransitionHooks = needTransition(parentSuspense, transition);
        if (needCallTransitionHooks) {
          transition.beforeEnter(el);
        }
        hostInsert(el, container, anchor);
        if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) {
          const isHmr = true && isHmrUpdating;
          queuePostRenderEffect(() => {
            let prev;
            if (true) prev = setHmrUpdating(isHmr);
            try {
              vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
              needCallTransitionHooks && transition.enter(el);
              dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
            } finally {
              if (true) setHmrUpdating(prev);
            }
          }, parentSuspense);
        }
      };
      const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
        if (scopeId) {
          hostSetScopeId(el, scopeId);
        }
        if (slotScopeIds) {
          for (let i = 0; i < slotScopeIds.length; i++) {
            hostSetScopeId(el, slotScopeIds[i]);
          }
        }
        if (parentComponent) {
          let subTree = parentComponent.subTree;
          if (true && subTree.patchFlag > 0 && subTree.patchFlag & 2048) {
            subTree = filterSingleRoot(subTree.children) || subTree;
          }
          if (vnode === subTree || isSuspense(subTree.type) && (subTree.ssContent === vnode || subTree.ssFallback === vnode)) {
            const parentVNode = parentComponent.vnode;
            setScopeId(el, parentVNode, parentVNode.scopeId, parentVNode.slotScopeIds, parentComponent.parent);
          }
        }
      };
      const mountChildren = (children, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, start = 0) => {
        for (let i = start; i < children.length; i++) {
          const child = children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]);
          patch(null, child, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
        }
      };
      const patchElement = (n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
        const el = n2.el = n1.el;
        if (true) {
          el.__vnode = n2;
        }
        let {patchFlag, dynamicChildren, dirs} = n2;
        patchFlag |= n1.patchFlag & 16;
        const oldProps = n1.props || _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ;
        const newProps = n2.props || _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ;
        let vnodeHook;
        parentComponent && toggleRecurse(parentComponent, false);
        if (vnodeHook = newProps.onVnodeBeforeUpdate) {
          invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
        }
        if (dirs) {
          invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
        }
        parentComponent && toggleRecurse(parentComponent, true);
        if (true && isHmrUpdating) {
          patchFlag = 0;
          optimized = false;
          dynamicChildren = null;
        }
        if (oldProps.innerHTML && newProps.innerHTML == null || oldProps.textContent && newProps.textContent == null) {
          hostSetElementText(el, "");
        }
        if (dynamicChildren) {
          patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, parentComponent, parentSuspense, resolveChildrenNamespace(n2, namespace), slotScopeIds);
          if (true) {
            traverseStaticChildren(n1, n2);
          }
        } else if (!optimized) {
          patchChildren(n1, n2, el, null, parentComponent, parentSuspense, resolveChildrenNamespace(n2, namespace), slotScopeIds, false);
        }
        if (patchFlag > 0) {
          if (patchFlag & 16) {
            patchProps(el, oldProps, newProps, parentComponent, namespace);
          } else {
            if (patchFlag & 2) {
              if (oldProps.class !== newProps.class) {
                hostPatchProp(el, "class", null, newProps.class, namespace);
              }
            }
            if (patchFlag & 4) {
              hostPatchProp(el, "style", oldProps.style, newProps.style, namespace);
            }
            if (patchFlag & 8) {
              const propsToUpdate = n2.dynamicProps;
              for (let i = 0; i < propsToUpdate.length; i++) {
                const key = propsToUpdate[i];
                const prev = oldProps[key];
                const next = newProps[key];
                if (next !== prev || key === "value") {
                  hostPatchProp(el, key, prev, next, namespace, parentComponent);
                }
              }
            }
          }
          if (patchFlag & 1) {
            if (n1.children !== n2.children) {
              hostSetElementText(el, n2.children);
            }
          }
        } else if (!optimized && dynamicChildren == null) {
          patchProps(el, oldProps, newProps, parentComponent, namespace);
        }
        if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
          queuePostRenderEffect(() => {
            vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
            dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
          }, parentSuspense);
        }
      };
      const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, namespace, slotScopeIds) => {
        for (let i = 0; i < newChildren.length; i++) {
          const oldVNode = oldChildren[i];
          const newVNode = newChildren[i];
          const container = oldVNode.el && (oldVNode.type === Fragment || !isSameVNodeType(oldVNode, newVNode) || oldVNode.shapeFlag & (6 | 64 | 128)) ? hostParentNode(oldVNode.el) : fallbackContainer;
          patch(oldVNode, newVNode, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, true);
        }
      };
      const patchProps = (el, oldProps, newProps, parentComponent, namespace) => {
        if (oldProps !== newProps) {
          if (oldProps !== _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ) {
            for (const key in oldProps) {
              if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isReservedProp)(key) && !(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], null, namespace, parentComponent);
              }
            }
          }
          for (const key in newProps) {
            if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isReservedProp)(key)) continue;
            const next = newProps[key];
            const prev = oldProps[key];
            if (next !== prev && key !== "value") {
              hostPatchProp(el, key, prev, next, namespace, parentComponent);
            }
          }
          if ("value" in newProps) {
            hostPatchProp(el, "value", oldProps.value, newProps.value, namespace);
          }
        }
      };
      const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
        const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
        const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
        let {patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds} = n2;
        if (true && (isHmrUpdating || patchFlag & 2048)) {
          patchFlag = 0;
          optimized = false;
          dynamicChildren = null;
        }
        if (fragmentSlotScopeIds) {
          slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
        }
        if (n1 == null) {
          hostInsert(fragmentStartAnchor, container, anchor);
          hostInsert(fragmentEndAnchor, container, anchor);
          mountChildren(n2.children || [], container, fragmentEndAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
        } else {
          if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && n1.dynamicChildren && n1.dynamicChildren.length === dynamicChildren.length) {
            patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, namespace, slotScopeIds);
            if (true) {
              traverseStaticChildren(n1, n2);
            } else {}
          } else {
            patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
          }
        }
      };
      const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
        n2.slotScopeIds = slotScopeIds;
        if (n1 == null) {
          if (n2.shapeFlag & 512) {
            parentComponent.ctx.activate(n2, container, anchor, namespace, optimized);
          } else {
            mountComponent(n2, container, anchor, parentComponent, parentSuspense, namespace, optimized);
          }
        } else {
          updateComponent(n1, n2, optimized);
        }
      };
      const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, namespace, optimized) => {
        const instance = initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense);
        if (true && instance.type.__hmrId) {
          registerHMR(instance);
        }
        if (true) {
          pushWarningContext(initialVNode);
          startMeasure(instance, `mount`);
        }
        if (isKeepAlive(initialVNode)) {
          instance.ctx.renderer = internals;
        }
        {
          if (true) {
            startMeasure(instance, `init`);
          }
          setupComponent(instance, false, optimized);
          if (true) {
            endMeasure(instance, `init`);
          }
        }
        if (true && isHmrUpdating) initialVNode.el = null;
        if (instance.asyncDep) {
          parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect, optimized);
          if (!initialVNode.el) {
            const placeholder = instance.subTree = createVNode(Comment);
            processCommentNode(null, placeholder, container, anchor);
            initialVNode.placeholder = placeholder.el;
          }
        } else {
          setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, namespace, optimized);
        }
        if (true) {
          popWarningContext();
          endMeasure(instance, `mount`);
        }
      };
      const updateComponent = (n1, n2, optimized) => {
        const instance = n2.component = n1.component;
        if (shouldUpdateComponent(n1, n2, optimized)) {
          if (instance.asyncDep && !instance.asyncResolved) {
            if (true) {
              pushWarningContext(n2);
            }
            updateComponentPreRender(instance, n2, optimized);
            if (true) {
              popWarningContext();
            }
            return;
          } else {
            instance.next = n2;
            instance.update();
          }
        } else {
          n2.el = n1.el;
          instance.vnode = n2;
        }
      };
      const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, namespace, optimized) => {
        const componentUpdateFn = () => {
          if (!instance.isMounted) {
            let vnodeHook;
            const {el, props} = initialVNode;
            const {bm, m, parent, root, type} = instance;
            const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
            toggleRecurse(instance, false);
            if (bm) {
              (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.invokeArrayFns)(bm);
            }
            if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) {
              invokeVNodeHook(vnodeHook, parent, initialVNode);
            }
            toggleRecurse(instance, true);
            if (el && hydrateNode) {
              const hydrateSubTree = () => {
                if (true) {
                  startMeasure(instance, `render`);
                }
                instance.subTree = renderComponentRoot(instance);
                if (true) {
                  endMeasure(instance, `render`);
                }
                if (true) {
                  startMeasure(instance, `hydrate`);
                }
                hydrateNode(el, instance.subTree, instance, parentSuspense, null);
                if (true) {
                  endMeasure(instance, `hydrate`);
                }
              };
              if (isAsyncWrapperVNode && type.__asyncHydrate) {
                type.__asyncHydrate(el, instance, hydrateSubTree);
              } else {
                hydrateSubTree();
              }
            } else {
              if (root.ce && root.ce._hasShadowRoot()) {
                root.ce._injectChildStyle(type, instance.parent ? instance.parent.type : void 0);
              }
              if (true) {
                startMeasure(instance, `render`);
              }
              const subTree = instance.subTree = renderComponentRoot(instance);
              if (true) {
                endMeasure(instance, `render`);
              }
              if (true) {
                startMeasure(instance, `patch`);
              }
              patch(null, subTree, container, anchor, instance, parentSuspense, namespace);
              if (true) {
                endMeasure(instance, `patch`);
              }
              initialVNode.el = subTree.el;
            }
            if (m) {
              queuePostRenderEffect(m, parentSuspense);
            }
            if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
              const scopedInitialVNode = initialVNode;
              queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode), parentSuspense);
            }
            if (initialVNode.shapeFlag & 256 || parent && isAsyncWrapper(parent.vnode) && parent.vnode.shapeFlag & 256) {
              instance.a && queuePostRenderEffect(instance.a, parentSuspense);
            }
            instance.isMounted = true;
            if (true) {
              devtoolsComponentAdded(instance);
            }
            initialVNode = container = anchor = null;
          } else {
            let {next, bu, u, parent, vnode} = instance;
            {
              const nonHydratedAsyncRoot = locateNonHydratedAsyncRoot(instance);
              if (nonHydratedAsyncRoot) {
                if (next) {
                  next.el = vnode.el;
                  updateComponentPreRender(instance, next, optimized);
                }
                nonHydratedAsyncRoot.asyncDep.then(() => {
                  queuePostRenderEffect(() => {
                    if (!instance.isUnmounted) update();
                  }, parentSuspense);
                });
                return;
              }
            }
            let originNext = next;
            let vnodeHook;
            if (true) {
              pushWarningContext(next || instance.vnode);
            }
            toggleRecurse(instance, false);
            if (next) {
              next.el = vnode.el;
              updateComponentPreRender(instance, next, optimized);
            } else {
              next = vnode;
            }
            if (bu) {
              (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.invokeArrayFns)(bu);
            }
            if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) {
              invokeVNodeHook(vnodeHook, parent, next, vnode);
            }
            toggleRecurse(instance, true);
            if (true) {
              startMeasure(instance, `render`);
            }
            const nextTree = renderComponentRoot(instance);
            if (true) {
              endMeasure(instance, `render`);
            }
            const prevTree = instance.subTree;
            instance.subTree = nextTree;
            if (true) {
              startMeasure(instance, `patch`);
            }
            patch(prevTree, nextTree, hostParentNode(prevTree.el), getNextHostNode(prevTree), instance, parentSuspense, namespace);
            if (true) {
              endMeasure(instance, `patch`);
            }
            next.el = nextTree.el;
            if (originNext === null) {
              updateHOCHostEl(instance, nextTree.el);
            }
            if (u) {
              queuePostRenderEffect(u, parentSuspense);
            }
            if (vnodeHook = next.props && next.props.onVnodeUpdated) {
              queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, next, vnode), parentSuspense);
            }
            if (true) {
              devtoolsComponentUpdated(instance);
            }
            if (true) {
              popWarningContext();
            }
          }
        };
        instance.scope.on();
        const effect = instance.effect = new _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.ReactiveEffect(componentUpdateFn);
        instance.scope.off();
        const update = instance.update = effect.run.bind(effect);
        const job = instance.job = effect.runIfDirty.bind(effect);
        job.i = instance;
        job.id = instance.uid;
        effect.scheduler = () => queueJob(job);
        toggleRecurse(instance, true);
        if (true) {
          effect.onTrack = instance.rtc ? e => (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.invokeArrayFns)(instance.rtc, e) : void 0;
          effect.onTrigger = instance.rtg ? e => (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.invokeArrayFns)(instance.rtg, e) : void 0;
        }
        update();
      };
      const updateComponentPreRender = (instance, nextVNode, optimized) => {
        nextVNode.component = instance;
        const prevProps = instance.vnode.props;
        instance.vnode = nextVNode;
        instance.next = null;
        updateProps(instance, nextVNode.props, prevProps, optimized);
        updateSlots(instance, nextVNode.children, optimized);
        (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.pauseTracking)();
        flushPreFlushCbs(instance);
        (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.resetTracking)();
      };
      const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized = false) => {
        const c1 = n1 && n1.children;
        const prevShapeFlag = n1 ? n1.shapeFlag : 0;
        const c2 = n2.children;
        const {patchFlag, shapeFlag} = n2;
        if (patchFlag > 0) {
          if (patchFlag & 128) {
            patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
            return;
          } else if (patchFlag & 256) {
            patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
            return;
          }
        }
        if (shapeFlag & 8) {
          if (prevShapeFlag & 16) {
            unmountChildren(c1, parentComponent, parentSuspense);
          }
          if (c2 !== c1) {
            hostSetElementText(container, c2);
          }
        } else {
          if (prevShapeFlag & 16) {
            if (shapeFlag & 16) {
              patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
            } else {
              unmountChildren(c1, parentComponent, parentSuspense, true);
            }
          } else {
            if (prevShapeFlag & 8) {
              hostSetElementText(container, "");
            }
            if (shapeFlag & 16) {
              mountChildren(c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
            }
          }
        }
      };
      const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
        c1 = c1 || _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_ARR;
        c2 = c2 || _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_ARR;
        const oldLength = c1.length;
        const newLength = c2.length;
        const commonLength = Math.min(oldLength, newLength);
        let i;
        for (i = 0; i < commonLength; i++) {
          const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
          patch(c1[i], nextChild, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
        }
        if (oldLength > newLength) {
          unmountChildren(c1, parentComponent, parentSuspense, true, false, commonLength);
        } else {
          mountChildren(c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, commonLength);
        }
      };
      const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
        let i = 0;
        const l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        while (i <= e1 && i <= e2) {
          const n1 = c1[i];
          const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
          if (isSameVNodeType(n1, n2)) {
            patch(n1, n2, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
          } else {
            break;
          }
          i++;
        }
        while (i <= e1 && i <= e2) {
          const n1 = c1[e1];
          const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
          if (isSameVNodeType(n1, n2)) {
            patch(n1, n2, container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
          } else {
            break;
          }
          e1--;
          e2--;
        }
        if (i > e1) {
          if (i <= e2) {
            const nextPos = e2 + 1;
            const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
            while (i <= e2) {
              patch(null, c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]), container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
              i++;
            }
          }
        } else if (i > e2) {
          while (i <= e1) {
            unmount(c1[i], parentComponent, parentSuspense, true);
            i++;
          }
        } else {
          const s1 = i;
          const s2 = i;
          const keyToNewIndexMap = new Map;
          for (i = s2; i <= e2; i++) {
            const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
            if (nextChild.key != null) {
              if (true && keyToNewIndexMap.has(nextChild.key)) {
                warn$1(`Duplicate keys found during update:`, JSON.stringify(nextChild.key), `Make sure keys are unique.`);
              }
              keyToNewIndexMap.set(nextChild.key, i);
            }
          }
          let j;
          let patched = 0;
          const toBePatched = e2 - s2 + 1;
          let moved = false;
          let maxNewIndexSoFar = 0;
          const newIndexToOldIndexMap = new Array(toBePatched);
          for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
          for (i = s1; i <= e1; i++) {
            const prevChild = c1[i];
            if (patched >= toBePatched) {
              unmount(prevChild, parentComponent, parentSuspense, true);
              continue;
            }
            let newIndex;
            if (prevChild.key != null) {
              newIndex = keyToNewIndexMap.get(prevChild.key);
            } else {
              for (j = s2; j <= e2; j++) {
                if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
                  newIndex = j;
                  break;
                }
              }
            }
            if (newIndex === void 0) {
              unmount(prevChild, parentComponent, parentSuspense, true);
            } else {
              newIndexToOldIndexMap[newIndex - s2] = i + 1;
              if (newIndex >= maxNewIndexSoFar) {
                maxNewIndexSoFar = newIndex;
              } else {
                moved = true;
              }
              patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
              patched++;
            }
          }
          const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_ARR;
          j = increasingNewIndexSequence.length - 1;
          for (i = toBePatched - 1; i >= 0; i--) {
            const nextIndex = s2 + i;
            const nextChild = c2[nextIndex];
            const anchorVNode = c2[nextIndex + 1];
            const anchor = nextIndex + 1 < l2 ? anchorVNode.el || resolveAsyncComponentPlaceholder(anchorVNode) : parentAnchor;
            if (newIndexToOldIndexMap[i] === 0) {
              patch(null, nextChild, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized);
            } else if (moved) {
              if (j < 0 || i !== increasingNewIndexSequence[j]) {
                move(nextChild, container, anchor, 2);
              } else {
                j--;
              }
            }
          }
        }
      };
      const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
        const {el, type, transition, children, shapeFlag} = vnode;
        if (shapeFlag & 6) {
          move(vnode.component.subTree, container, anchor, moveType);
          return;
        }
        if (shapeFlag & 128) {
          vnode.suspense.move(container, anchor, moveType);
          return;
        }
        if (shapeFlag & 64) {
          type.move(vnode, container, anchor, internals);
          return;
        }
        if (type === Fragment) {
          hostInsert(el, container, anchor);
          for (let i = 0; i < children.length; i++) {
            move(children[i], container, anchor, moveType);
          }
          hostInsert(vnode.anchor, container, anchor);
          return;
        }
        if (type === Static) {
          moveStaticNode(vnode, container, anchor);
          return;
        }
        const needTransition2 = moveType !== 2 && shapeFlag & 1 && transition;
        if (needTransition2) {
          if (moveType === 0) {
            if (transition.persisted && !el[leaveCbKey]) {
              hostInsert(el, container, anchor);
            } else {
              transition.beforeEnter(el);
              hostInsert(el, container, anchor);
              queuePostRenderEffect(() => transition.enter(el), parentSuspense);
            }
          } else {
            const {leave, delayLeave, afterLeave} = transition;
            const remove2 = () => {
              if (vnode.ctx.isUnmounted) {
                hostRemove(el);
              } else {
                hostInsert(el, container, anchor);
              }
            };
            const performLeave = () => {
              const wasLeaving = el._isLeaving || !!el[leaveCbKey];
              if (el._isLeaving) {
                el[leaveCbKey](true);
              }
              if (transition.persisted && !wasLeaving) {
                remove2();
              } else {
                leave(el, () => {
                  remove2();
                  afterLeave && afterLeave();
                });
              }
            };
            if (delayLeave) {
              delayLeave(el, remove2, performLeave);
            } else {
              performLeave();
            }
          }
        } else {
          hostInsert(el, container, anchor);
        }
      };
      const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
        const {type, props, ref, children, dynamicChildren, shapeFlag, patchFlag, dirs, cacheIndex, memo} = vnode;
        if (patchFlag === -2) {
          optimized = false;
        }
        if (ref != null) {
          (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.pauseTracking)();
          setRef(ref, null, parentSuspense, vnode, true);
          (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.resetTracking)();
        }
        if (cacheIndex != null) {
          parentComponent.renderCache[cacheIndex] = void 0;
        }
        if (shapeFlag & 256) {
          parentComponent.ctx.deactivate(vnode);
          return;
        }
        const shouldInvokeDirs = shapeFlag & 1 && dirs;
        const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
        let vnodeHook;
        if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) {
          invokeVNodeHook(vnodeHook, parentComponent, vnode);
        }
        if (shapeFlag & 6) {
          unmountComponent(vnode.component, parentSuspense, doRemove);
        } else {
          if (shapeFlag & 128) {
            vnode.suspense.unmount(parentSuspense, doRemove);
            return;
          }
          if (shouldInvokeDirs) {
            invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
          }
          if (shapeFlag & 64) {
            vnode.type.remove(vnode, parentComponent, parentSuspense, internals, doRemove);
          } else if (dynamicChildren && !dynamicChildren.hasOnce && (type !== Fragment || patchFlag > 0 && patchFlag & 64)) {
            unmountChildren(dynamicChildren, parentComponent, parentSuspense, false, true);
          } else if (type === Fragment && patchFlag & (128 | 256) || !optimized && shapeFlag & 16) {
            unmountChildren(children, parentComponent, parentSuspense);
          }
          if (doRemove) {
            remove(vnode);
          }
        }
        const shouldInvalidateMemo = memo != null && cacheIndex == null;
        if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs || shouldInvalidateMemo) {
          queuePostRenderEffect(() => {
            vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
            shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
            if (shouldInvalidateMemo) {
              vnode.el = null;
            }
          }, parentSuspense);
        }
      };
      const remove = vnode => {
        const {type, el, anchor, transition} = vnode;
        if (type === Fragment) {
          if (true && vnode.patchFlag > 0 && vnode.patchFlag & 2048 && transition && !transition.persisted) {
            vnode.children.forEach(child => {
              if (child.type === Comment) {
                hostRemove(child.el);
              } else {
                remove(child);
              }
            });
          } else {
            removeFragment(el, anchor);
          }
          return;
        }
        if (type === Static) {
          removeStaticNode(vnode);
          return;
        }
        const performRemove = () => {
          hostRemove(el);
          if (transition && !transition.persisted && transition.afterLeave) {
            transition.afterLeave();
          }
        };
        if (vnode.shapeFlag & 1 && transition && !transition.persisted) {
          const {leave, delayLeave} = transition;
          const performLeave = () => leave(el, performRemove);
          if (delayLeave) {
            delayLeave(vnode.el, performRemove, performLeave);
          } else {
            performLeave();
          }
        } else {
          performRemove();
        }
      };
      const removeFragment = (cur, end) => {
        let next;
        while (cur !== end) {
          next = hostNextSibling(cur);
          hostRemove(cur);
          cur = next;
        }
        hostRemove(end);
      };
      const unmountComponent = (instance, parentSuspense, doRemove) => {
        if (true && instance.type.__hmrId) {
          unregisterHMR(instance);
        }
        const {bum, scope, job, subTree, um, m, a} = instance;
        invalidateMount(m);
        invalidateMount(a);
        if (bum) {
          (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.invokeArrayFns)(bum);
        }
        scope.stop();
        if (job) {
          job.flags |= 8;
          unmount(subTree, instance, parentSuspense, doRemove);
        }
        if (um) {
          queuePostRenderEffect(um, parentSuspense);
        }
        queuePostRenderEffect(() => {
          instance.isUnmounted = true;
        }, parentSuspense);
        if (true) {
          devtoolsComponentRemoved(instance);
        }
      };
      const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
        for (let i = start; i < children.length; i++) {
          unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
        }
      };
      const getNextHostNode = vnode => {
        if (vnode.shapeFlag & 6) {
          return getNextHostNode(vnode.component.subTree);
        }
        if (vnode.shapeFlag & 128) {
          return vnode.suspense.next();
        }
        const el = hostNextSibling(vnode.anchor || vnode.el);
        const teleportEnd = el && el[TeleportEndKey];
        return teleportEnd ? hostNextSibling(teleportEnd) : el;
      };
      let isFlushing = false;
      const render = (vnode, container, namespace) => {
        let instance;
        if (vnode == null) {
          if (container._vnode) {
            unmount(container._vnode, null, null, true);
            instance = container._vnode.component;
          }
        } else {
          patch(container._vnode || null, vnode, container, null, null, null, namespace);
        }
        container._vnode = vnode;
        if (!isFlushing) {
          isFlushing = true;
          flushPreFlushCbs(instance);
          flushPostFlushCbs();
          isFlushing = false;
        }
      };
      const internals = {
        p: patch,
        um: unmount,
        m: move,
        r: remove,
        mt: mountComponent,
        mc: mountChildren,
        pc: patchChildren,
        pbc: patchBlockChildren,
        n: getNextHostNode,
        o: options
      };
      let hydrate;
      let hydrateNode;
      if (createHydrationFns) {
        [hydrate, hydrateNode] = createHydrationFns(internals);
      }
      return {
        render,
        hydrate,
        createApp: createAppAPI(render, hydrate)
      };
    }
    function resolveChildrenNamespace({type, props}, currentNamespace) {
      return currentNamespace === "svg" && type === "foreignObject" || currentNamespace === "mathml" && type === "annotation-xml" && props && props.encoding && props.encoding.includes("html") ? void 0 : currentNamespace;
    }
    function toggleRecurse({effect, job}, allowed) {
      if (allowed) {
        effect.flags |= 32;
        job.flags |= 4;
      } else {
        effect.flags &= -33;
        job.flags &= -5;
      }
    }
    function needTransition(parentSuspense, transition) {
      return (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
    }
    function traverseStaticChildren(n1, n2, shallow = false) {
      const ch1 = n1.children;
      const ch2 = n2.children;
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(ch1) && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(ch2)) {
        for (let i = 0; i < ch1.length; i++) {
          const c1 = ch1[i];
          let c2 = ch2[i];
          if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
            if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
              c2 = ch2[i] = cloneIfMounted(ch2[i]);
              c2.el = c1.el;
            }
            if (!shallow && c2.patchFlag !== -2) traverseStaticChildren(c1, c2);
          }
          if (c2.type === Text) {
            if (c2.patchFlag === -1) {
              c2 = ch2[i] = cloneIfMounted(c2);
            }
            c2.el = c1.el;
          }
          if (c2.type === Comment && !c2.el) {
            c2.el = c1.el;
          }
          if (true) {
            c2.el && (c2.el.__vnode = c2);
          }
        }
      }
    }
    function getSequence(arr) {
      const p = arr.slice();
      const result = [ 0 ];
      let i, j, u, v, c;
      const len = arr.length;
      for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
          j = result[result.length - 1];
          if (arr[j] < arrI) {
            p[i] = j;
            result.push(i);
            continue;
          }
          u = 0;
          v = result.length - 1;
          while (u < v) {
            c = u + v >> 1;
            if (arr[result[c]] < arrI) {
              u = c + 1;
            } else {
              v = c;
            }
          }
          if (arrI < arr[result[u]]) {
            if (u > 0) {
              p[i] = result[u - 1];
            }
            result[u] = i;
          }
        }
      }
      u = result.length;
      v = result[u - 1];
      while (u-- > 0) {
        result[u] = v;
        v = p[v];
      }
      return result;
    }
    function locateNonHydratedAsyncRoot(instance) {
      const subComponent = instance.subTree.component;
      if (subComponent) {
        if (subComponent.asyncDep && !subComponent.asyncResolved) {
          return subComponent;
        } else {
          return locateNonHydratedAsyncRoot(subComponent);
        }
      }
    }
    function invalidateMount(hooks) {
      if (hooks) {
        for (let i = 0; i < hooks.length; i++) hooks[i].flags |= 8;
      }
    }
    function resolveAsyncComponentPlaceholder(anchorVnode) {
      if (anchorVnode.placeholder) {
        return anchorVnode.placeholder;
      }
      const instance = anchorVnode.component;
      if (instance) {
        return resolveAsyncComponentPlaceholder(instance.subTree);
      }
      return null;
    }
    const isSuspense = type => type.__isSuspense;
    let suspenseId = 0;
    const SuspenseImpl = {
      name: "Suspense",
      __isSuspense: true,
      process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, rendererInternals) {
        if (n1 == null) {
          mountSuspense(n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, rendererInternals);
        } else {
          if (parentSuspense && parentSuspense.deps > 0 && !n1.suspense.isInFallback) {
            n2.suspense = n1.suspense;
            n2.suspense.vnode = n2;
            n2.el = n1.el;
            return;
          }
          patchSuspense(n1, n2, container, anchor, parentComponent, namespace, slotScopeIds, optimized, rendererInternals);
        }
      },
      hydrate: hydrateSuspense,
      normalize: normalizeSuspenseChildren
    };
    const Suspense = SuspenseImpl;
    function triggerEvent(vnode, name) {
      const eventListener = vnode.props && vnode.props[name];
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(eventListener)) {
        eventListener();
      }
    }
    function mountSuspense(vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, rendererInternals) {
      const {p: patch, o: {createElement}} = rendererInternals;
      const hiddenContainer = createElement("div");
      const suspense = vnode.suspense = createSuspenseBoundary(vnode, parentSuspense, parentComponent, container, hiddenContainer, anchor, namespace, slotScopeIds, optimized, rendererInternals);
      patch(null, suspense.pendingBranch = vnode.ssContent, hiddenContainer, null, parentComponent, suspense, namespace, slotScopeIds);
      if (suspense.deps > 0) {
        triggerEvent(vnode, "onPending");
        triggerEvent(vnode, "onFallback");
        patch(null, vnode.ssFallback, container, anchor, parentComponent, null, namespace, slotScopeIds);
        setActiveBranch(suspense, vnode.ssFallback);
      } else {
        suspense.resolve(false, true);
      }
    }
    function patchSuspense(n1, n2, container, anchor, parentComponent, namespace, slotScopeIds, optimized, {p: patch, um: unmount, o: {createElement}}) {
      const suspense = n2.suspense = n1.suspense;
      suspense.vnode = n2;
      n2.el = n1.el;
      const newBranch = n2.ssContent;
      const newFallback = n2.ssFallback;
      const {activeBranch, pendingBranch, isInFallback, isHydrating} = suspense;
      if (pendingBranch) {
        suspense.pendingBranch = newBranch;
        if (isSameVNodeType(pendingBranch, newBranch)) {
          patch(pendingBranch, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, namespace, slotScopeIds, optimized);
          if (suspense.deps <= 0) {
            suspense.resolve();
          } else if (isInFallback) {
            if (!isHydrating) {
              patch(activeBranch, newFallback, container, anchor, parentComponent, null, namespace, slotScopeIds, optimized);
              setActiveBranch(suspense, newFallback);
            }
          }
        } else {
          suspense.pendingId = suspenseId++;
          if (isHydrating) {
            suspense.isHydrating = false;
            suspense.activeBranch = pendingBranch;
          } else {
            unmount(pendingBranch, parentComponent, suspense);
          }
          suspense.deps = 0;
          suspense.effects.length = 0;
          suspense.hiddenContainer = createElement("div");
          if (isInFallback) {
            patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, namespace, slotScopeIds, optimized);
            if (suspense.deps <= 0) {
              suspense.resolve();
            } else {
              patch(activeBranch, newFallback, container, anchor, parentComponent, null, namespace, slotScopeIds, optimized);
              setActiveBranch(suspense, newFallback);
            }
          } else if (activeBranch && isSameVNodeType(activeBranch, newBranch)) {
            patch(activeBranch, newBranch, container, anchor, parentComponent, suspense, namespace, slotScopeIds, optimized);
            suspense.resolve(true);
          } else {
            patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, namespace, slotScopeIds, optimized);
            if (suspense.deps <= 0) {
              suspense.resolve();
            }
          }
        }
      } else {
        if (activeBranch && isSameVNodeType(activeBranch, newBranch)) {
          patch(activeBranch, newBranch, container, anchor, parentComponent, suspense, namespace, slotScopeIds, optimized);
          setActiveBranch(suspense, newBranch);
        } else {
          triggerEvent(n2, "onPending");
          suspense.pendingBranch = newBranch;
          if (newBranch.shapeFlag & 512) {
            suspense.pendingId = newBranch.component.suspenseId;
          } else {
            suspense.pendingId = suspenseId++;
          }
          patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, namespace, slotScopeIds, optimized);
          if (suspense.deps <= 0) {
            suspense.resolve();
          } else {
            const {timeout, pendingId} = suspense;
            if (timeout > 0) {
              setTimeout(() => {
                if (suspense.pendingId === pendingId) {
                  suspense.fallback(newFallback);
                }
              }, timeout);
            } else if (timeout === 0) {
              suspense.fallback(newFallback);
            }
          }
        }
      }
    }
    let hasWarned = false;
    function createSuspenseBoundary(vnode, parentSuspense, parentComponent, container, hiddenContainer, anchor, namespace, slotScopeIds, optimized, rendererInternals, isHydrating = false) {
      if (true && !hasWarned) {
        hasWarned = true;
        console[console.info ? "info" : "log"](`<Suspense> is an experimental feature and its API will likely change.`);
      }
      const {p: patch, m: move, um: unmount, n: next, o: {parentNode, remove}} = rendererInternals;
      let parentSuspenseId;
      const isSuspensible = isVNodeSuspensible(vnode);
      if (isSuspensible) {
        if (parentSuspense && parentSuspense.pendingBranch) {
          parentSuspenseId = parentSuspense.pendingId;
          parentSuspense.deps++;
        }
      }
      const timeout = vnode.props ? (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.toNumber)(vnode.props.timeout) : void 0;
      if (true) {
        assertNumber(timeout, `Suspense timeout`);
      }
      const initialAnchor = anchor;
      const suspense = {
        vnode,
        parent: parentSuspense,
        parentComponent,
        namespace,
        container,
        hiddenContainer,
        deps: 0,
        pendingId: suspenseId++,
        timeout: typeof timeout === "number" ? timeout : -1,
        activeBranch: null,
        isFallbackMountPending: false,
        pendingBranch: null,
        isInFallback: !isHydrating,
        isHydrating,
        isUnmounted: false,
        effects: [],
        resolve(resume = false, sync = false) {
          if (true) {
            if (!resume && !suspense.pendingBranch) {
              throw new Error(`suspense.resolve() is called without a pending branch.`);
            }
            if (suspense.isUnmounted) {
              throw new Error(`suspense.resolve() is called on an already unmounted suspense boundary.`);
            }
          }
          const {vnode: vnode2, activeBranch, pendingBranch, pendingId, effects, parentComponent: parentComponent2, container: container2, isInFallback} = suspense;
          let delayEnter = false;
          if (suspense.isHydrating) {
            suspense.isHydrating = false;
          } else if (!resume) {
            delayEnter = activeBranch && pendingBranch.transition && pendingBranch.transition.mode === "out-in";
            let hasUpdatedAnchor = false;
            if (delayEnter) {
              activeBranch.transition.afterLeave = () => {
                if (pendingId === suspense.pendingId) {
                  move(pendingBranch, container2, anchor === initialAnchor && !hasUpdatedAnchor ? next(activeBranch) : anchor, 0);
                  queuePostFlushCb(effects);
                  if (isInFallback && vnode2.ssFallback) {
                    vnode2.ssFallback.el = null;
                  }
                }
              };
            }
            if (activeBranch && !suspense.isFallbackMountPending) {
              if (parentNode(activeBranch.el) === container2) {
                anchor = next(activeBranch);
                hasUpdatedAnchor = true;
              }
              unmount(activeBranch, parentComponent2, suspense, true);
              if (!delayEnter && isInFallback && vnode2.ssFallback) {
                queuePostRenderEffect(() => vnode2.ssFallback.el = null, suspense);
              }
            }
            if (!delayEnter) {
              move(pendingBranch, container2, anchor, 0);
            }
          }
          suspense.isFallbackMountPending = false;
          setActiveBranch(suspense, pendingBranch);
          suspense.pendingBranch = null;
          suspense.isInFallback = false;
          let parent = suspense.parent;
          let hasUnresolvedAncestor = false;
          while (parent) {
            if (parent.pendingBranch) {
              parent.effects.push(...effects);
              hasUnresolvedAncestor = true;
              break;
            }
            parent = parent.parent;
          }
          if (!hasUnresolvedAncestor && !delayEnter) {
            queuePostFlushCb(effects);
          }
          suspense.effects = [];
          if (isSuspensible) {
            if (parentSuspense && parentSuspense.pendingBranch && parentSuspenseId === parentSuspense.pendingId) {
              parentSuspense.deps--;
              if (parentSuspense.deps === 0 && !sync) {
                parentSuspense.resolve();
              }
            }
          }
          triggerEvent(vnode2, "onResolve");
        },
        fallback(fallbackVNode) {
          if (!suspense.pendingBranch) {
            return;
          }
          const {vnode: vnode2, activeBranch, parentComponent: parentComponent2, container: container2, namespace: namespace2} = suspense;
          triggerEvent(vnode2, "onFallback");
          const anchor2 = next(activeBranch);
          const mountFallback = () => {
            suspense.isFallbackMountPending = false;
            if (!suspense.isInFallback) {
              return;
            }
            patch(null, fallbackVNode, container2, anchor2, parentComponent2, null, namespace2, slotScopeIds, optimized);
            setActiveBranch(suspense, fallbackVNode);
          };
          const delayEnter = fallbackVNode.transition && fallbackVNode.transition.mode === "out-in";
          if (delayEnter) {
            suspense.isFallbackMountPending = true;
            activeBranch.transition.afterLeave = mountFallback;
          }
          suspense.isInFallback = true;
          unmount(activeBranch, parentComponent2, null, true);
          if (!delayEnter) {
            mountFallback();
          }
        },
        move(container2, anchor2, type) {
          suspense.activeBranch && move(suspense.activeBranch, container2, anchor2, type);
          suspense.container = container2;
        },
        next() {
          return suspense.activeBranch && next(suspense.activeBranch);
        },
        registerDep(instance, setupRenderEffect, optimized2) {
          const isInPendingSuspense = !!suspense.pendingBranch;
          if (isInPendingSuspense) {
            suspense.deps++;
          }
          const hydratedEl = instance.vnode.el;
          instance.asyncDep.catch(err => {
            handleError(err, instance, 0);
          }).then(asyncSetupResult => {
            if (instance.isUnmounted || suspense.isUnmounted || suspense.pendingId !== instance.suspenseId) {
              return;
            }
            unsetCurrentInstance();
            instance.asyncResolved = true;
            const {vnode: vnode2} = instance;
            if (true) {
              pushWarningContext(vnode2);
            }
            handleSetupResult(instance, asyncSetupResult, false);
            if (hydratedEl) {
              vnode2.el = hydratedEl;
            }
            const placeholder = !hydratedEl && instance.subTree.el;
            setupRenderEffect(instance, vnode2, parentNode(hydratedEl || instance.subTree.el), hydratedEl ? null : next(instance.subTree), suspense, namespace, optimized2);
            if (placeholder) {
              vnode2.placeholder = null;
              remove(placeholder);
            }
            updateHOCHostEl(instance, vnode2.el);
            if (true) {
              popWarningContext();
            }
            if (isInPendingSuspense && --suspense.deps === 0) {
              suspense.resolve();
            }
          });
        },
        unmount(parentSuspense2, doRemove) {
          suspense.isUnmounted = true;
          if (suspense.activeBranch) {
            unmount(suspense.activeBranch, parentComponent, parentSuspense2, doRemove);
          }
          if (suspense.pendingBranch) {
            unmount(suspense.pendingBranch, parentComponent, parentSuspense2, doRemove);
          }
        }
      };
      return suspense;
    }
    function hydrateSuspense(node, vnode, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, rendererInternals, hydrateNode) {
      const suspense = vnode.suspense = createSuspenseBoundary(vnode, parentSuspense, parentComponent, node.parentNode, document.createElement("div"), null, namespace, slotScopeIds, optimized, rendererInternals, true);
      const result = hydrateNode(node, suspense.pendingBranch = vnode.ssContent, parentComponent, suspense, slotScopeIds, optimized);
      if (suspense.deps === 0) {
        suspense.resolve(false, true);
      }
      return result;
    }
    function normalizeSuspenseChildren(vnode) {
      const {shapeFlag, children} = vnode;
      const isSlotChildren = shapeFlag & 32;
      vnode.ssContent = normalizeSuspenseSlot(isSlotChildren ? children.default : children);
      vnode.ssFallback = isSlotChildren ? normalizeSuspenseSlot(children.fallback) : createVNode(Comment);
    }
    function normalizeSuspenseSlot(s) {
      let block;
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(s)) {
        const trackBlock = isBlockTreeEnabled && s._c;
        if (trackBlock) {
          s._d = false;
          openBlock();
        }
        s = s();
        if (trackBlock) {
          s._d = true;
          block = currentBlock;
          closeBlock();
        }
      }
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(s)) {
        const singleChild = filterSingleRoot(s);
        if (true && !singleChild && s.filter(child => child !== NULL_DYNAMIC_COMPONENT).length > 0) {
          warn$1(`<Suspense> slots expect a single root node.`);
        }
        s = singleChild;
      }
      s = normalizeVNode(s);
      if (block && !s.dynamicChildren) {
        s.dynamicChildren = block.filter(c => c !== s);
      }
      return s;
    }
    function queueEffectWithSuspense(fn, suspense) {
      if (suspense && suspense.pendingBranch) {
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(fn)) {
          suspense.effects.push(...fn);
        } else {
          suspense.effects.push(fn);
        }
      } else {
        queuePostFlushCb(fn);
      }
    }
    function setActiveBranch(suspense, branch) {
      suspense.activeBranch = branch;
      const {vnode, parentComponent} = suspense;
      let el = branch.el;
      while (!el && branch.component) {
        branch = branch.component.subTree;
        el = branch.el;
      }
      vnode.el = el;
      if (parentComponent && parentComponent.subTree === vnode) {
        parentComponent.vnode.el = el;
        updateHOCHostEl(parentComponent, el);
      }
    }
    function isVNodeSuspensible(vnode) {
      const suspensible = vnode.props && vnode.props.suspensible;
      return suspensible != null && suspensible !== false;
    }
    const Fragment = Symbol.for("v-fgt");
    const Text = Symbol.for("v-txt");
    const Comment = Symbol.for("v-cmt");
    const Static = Symbol.for("v-stc");
    const blockStack = [];
    let currentBlock = null;
    function openBlock(disableTracking = false) {
      blockStack.push(currentBlock = disableTracking ? null : []);
    }
    function closeBlock() {
      blockStack.pop();
      currentBlock = blockStack[blockStack.length - 1] || null;
    }
    let isBlockTreeEnabled = 1;
    function setBlockTracking(value, inVOnce = false) {
      isBlockTreeEnabled += value;
      if (value < 0 && currentBlock && inVOnce) {
        currentBlock.hasOnce = true;
      }
    }
    function setupBlock(vnode) {
      vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_ARR : null;
      closeBlock();
      if (isBlockTreeEnabled > 0 && currentBlock) {
        currentBlock.push(vnode);
      }
      return vnode;
    }
    function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
      return setupBlock(createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, true));
    }
    function createBlock(type, props, children, patchFlag, dynamicProps) {
      return setupBlock(createVNode(type, props, children, patchFlag, dynamicProps, true));
    }
    function isVNode(value) {
      return value ? value.__v_isVNode === true : false;
    }
    function isSameVNodeType(n1, n2) {
      if (true && n2.shapeFlag & 6 && n1.component) {
        const dirtyInstances = hmrDirtyComponents.get(n2.type);
        if (dirtyInstances && dirtyInstances.has(n1.component)) {
          n1.shapeFlag &= -257;
          n2.shapeFlag &= -513;
          return false;
        }
      }
      return n1.type === n2.type && n1.key === n2.key;
    }
    let vnodeArgsTransformer;
    function transformVNodeArgs(transformer) {
      vnodeArgsTransformer = transformer;
    }
    const createVNodeWithArgsTransform = (...args) => _createVNode(...vnodeArgsTransformer ? vnodeArgsTransformer(args, currentRenderingInstance) : args);
    const normalizeKey = ({key}) => key != null ? key : null;
    const normalizeRef = ({ref, ref_key, ref_for}) => {
      if (typeof ref === "number") {
        ref = "" + ref;
      }
      return ref != null ? (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(ref) || (0, 
      _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isRef)(ref) || (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(ref) ? {
        i: currentRenderingInstance,
        r: ref,
        k: ref_key,
        f: !!ref_for
      } : ref : null;
    };
    function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = (type === Fragment ? 0 : 1), isBlockNode = false, needFullChildrenNormalization = false) {
      const vnode = {
        __v_isVNode: true,
        __v_skip: true,
        type,
        props,
        key: props && normalizeKey(props),
        ref: props && normalizeRef(props),
        scopeId: currentScopeId,
        slotScopeIds: null,
        children,
        component: null,
        suspense: null,
        ssContent: null,
        ssFallback: null,
        dirs: null,
        transition: null,
        el: null,
        anchor: null,
        target: null,
        targetStart: null,
        targetAnchor: null,
        staticCount: 0,
        shapeFlag,
        patchFlag,
        dynamicProps,
        dynamicChildren: null,
        appContext: null,
        ctx: currentRenderingInstance
      };
      if (needFullChildrenNormalization) {
        normalizeChildren(vnode, children);
        if (shapeFlag & 128) {
          type.normalize(vnode);
        }
      } else if (children) {
        vnode.shapeFlag |= (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(children) ? 8 : 16;
      }
      if (true && vnode.key !== vnode.key) {
        warn$1(`VNode created with invalid key (NaN). VNode type:`, vnode.type);
      }
      if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock && (vnode.patchFlag > 0 || shapeFlag & 6) && vnode.patchFlag !== 32) {
        currentBlock.push(vnode);
      }
      return vnode;
    }
    const createVNode = true ? createVNodeWithArgsTransform : 0;
    function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
      if (!type || type === NULL_DYNAMIC_COMPONENT) {
        if (true && !type) {
          warn$1(`Invalid vnode type when creating vnode: ${type}.`);
        }
        type = Comment;
      }
      if (isVNode(type)) {
        const cloned = cloneVNode(type, props, true);
        if (children) {
          normalizeChildren(cloned, children);
        }
        if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
          if (cloned.shapeFlag & 6) {
            currentBlock[currentBlock.indexOf(type)] = cloned;
          } else {
            currentBlock.push(cloned);
          }
        }
        cloned.patchFlag = -2;
        return cloned;
      }
      if (isClassComponent(type)) {
        type = type.__vccOpts;
      }
      if (props) {
        props = guardReactiveProps(props);
        let {class: klass, style} = props;
        if (klass && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(klass)) {
          props.class = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.normalizeClass)(klass);
        }
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(style)) {
          if ((0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isProxy)(style) && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(style)) {
            style = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({}, style);
          }
          props.style = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.normalizeStyle)(style);
        }
      }
      const shapeFlag = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isString)(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : (0, 
      _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(type) ? 4 : (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(type) ? 2 : 0;
      if (true && shapeFlag & 4 && (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isProxy)(type)) {
        type = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(type);
        warn$1(`Vue received a Component that was made a reactive object. This can lead to unnecessary performance overhead and should be avoided by marking the component with \`markRaw\` or using \`shallowRef\` instead of \`ref\`.`, `\nComponent that was made reactive: `, type);
      }
      return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode, true);
    }
    function guardReactiveProps(props) {
      if (!props) return null;
      return (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isProxy)(props) || isInternalObject(props) ? (0, 
      _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({}, props) : props;
    }
    function cloneVNode(vnode, extraProps, mergeRef = false, cloneTransition = false) {
      const {props, ref, patchFlag, children, transition} = vnode;
      const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
      const cloned = {
        __v_isVNode: true,
        __v_skip: true,
        type: vnode.type,
        props: mergedProps,
        key: mergedProps && normalizeKey(mergedProps),
        ref: extraProps && extraProps.ref ? mergeRef && ref ? (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(ref) ? ref.concat(normalizeRef(extraProps)) : [ ref, normalizeRef(extraProps) ] : normalizeRef(extraProps) : ref,
        scopeId: vnode.scopeId,
        slotScopeIds: vnode.slotScopeIds,
        children: true && patchFlag === -1 && (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(children) ? children.map(deepCloneVNode) : children,
        target: vnode.target,
        targetStart: vnode.targetStart,
        targetAnchor: vnode.targetAnchor,
        staticCount: vnode.staticCount,
        shapeFlag: vnode.shapeFlag,
        patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
        dynamicProps: vnode.dynamicProps,
        dynamicChildren: vnode.dynamicChildren,
        appContext: vnode.appContext,
        dirs: vnode.dirs,
        transition,
        component: vnode.component,
        suspense: vnode.suspense,
        ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
        ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
        placeholder: vnode.placeholder,
        el: vnode.el,
        anchor: vnode.anchor,
        ctx: vnode.ctx,
        ce: vnode.ce
      };
      if (transition && cloneTransition) {
        setTransitionHooks(cloned, transition.clone(cloned));
      }
      return cloned;
    }
    function deepCloneVNode(vnode) {
      const cloned = cloneVNode(vnode);
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(vnode.children)) {
        cloned.children = vnode.children.map(deepCloneVNode);
      }
      return cloned;
    }
    function createTextVNode(text = " ", flag = 0) {
      return createVNode(Text, null, text, flag);
    }
    function createStaticVNode(content, numberOfNodes) {
      const vnode = createVNode(Static, null, content);
      vnode.staticCount = numberOfNodes;
      return vnode;
    }
    function createCommentVNode(text = "", asBlock = false) {
      return asBlock ? (openBlock(), createBlock(Comment, null, text)) : createVNode(Comment, null, text);
    }
    function normalizeVNode(child) {
      if (child == null || typeof child === "boolean") {
        return createVNode(Comment);
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(child)) {
        return createVNode(Fragment, null, child.slice());
      } else if (isVNode(child)) {
        return cloneIfMounted(child);
      } else {
        return createVNode(Text, null, String(child));
      }
    }
    function cloneIfMounted(child) {
      return child.el === null && child.patchFlag !== -1 || child.memo ? child : cloneVNode(child);
    }
    function normalizeChildren(vnode, children) {
      let type = 0;
      const {shapeFlag} = vnode;
      if (children == null) {
        children = null;
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(children)) {
        type = 16;
      } else if (typeof children === "object") {
        if (shapeFlag & (1 | 64)) {
          const slot = children.default;
          if (slot) {
            slot._c && (slot._d = false);
            normalizeChildren(vnode, slot());
            slot._c && (slot._d = true);
          }
          return;
        } else {
          type = 32;
          const slotFlag = children._;
          if (!slotFlag && !isInternalObject(children)) {
            children._ctx = currentRenderingInstance;
          } else if (slotFlag === 3 && currentRenderingInstance) {
            if (currentRenderingInstance.slots._ === 1) {
              children._ = 1;
            } else {
              children._ = 2;
              vnode.patchFlag |= 1024;
            }
          }
        }
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(children)) {
        children = {
          default: children,
          _ctx: currentRenderingInstance
        };
        type = 32;
      } else {
        children = String(children);
        if (shapeFlag & 64) {
          type = 16;
          children = [ createTextVNode(children) ];
        } else {
          type = 8;
        }
      }
      vnode.children = children;
      vnode.shapeFlag |= type;
    }
    function mergeProps(...args) {
      const ret = {};
      for (let i = 0; i < args.length; i++) {
        const toMerge = args[i];
        for (const key in toMerge) {
          if (key === "class") {
            if (ret.class !== toMerge.class) {
              ret.class = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.normalizeClass)([ ret.class, toMerge.class ]);
            }
          } else if (key === "style") {
            ret.style = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.normalizeStyle)([ ret.style, toMerge.style ]);
          } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isOn)(key)) {
            const existing = ret[key];
            const incoming = toMerge[key];
            if (incoming && existing !== incoming && !((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(existing) && existing.includes(incoming))) {
              ret[key] = existing ? [].concat(existing, incoming) : incoming;
            } else if (incoming == null && existing == null && !(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isModelListener)(key)) {
              ret[key] = incoming;
            }
          } else if (key !== "") {
            ret[key] = toMerge[key];
          }
        }
      }
      return ret;
    }
    function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
      callWithAsyncErrorHandling(hook, instance, 7, [ vnode, prevVNode ]);
    }
    const emptyAppContext = createAppContext();
    let uid = 0;
    function createComponentInstance(vnode, parent, suspense) {
      const type = vnode.type;
      const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
      const instance = {
        uid: uid++,
        vnode,
        type,
        parent,
        appContext,
        root: null,
        next: null,
        subTree: null,
        effect: null,
        update: null,
        job: null,
        scope: new _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.EffectScope(true),
        render: null,
        proxy: null,
        exposed: null,
        exposeProxy: null,
        withProxy: null,
        provides: parent ? parent.provides : Object.create(appContext.provides),
        ids: parent ? parent.ids : [ "", 0, 0 ],
        accessCache: null,
        renderCache: [],
        components: null,
        directives: null,
        propsOptions: normalizePropsOptions(type, appContext),
        emitsOptions: normalizeEmitsOptions(type, appContext),
        emit: null,
        emitted: null,
        propsDefaults: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ,
        inheritAttrs: type.inheritAttrs,
        ctx: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ,
        data: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ,
        props: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ,
        attrs: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ,
        slots: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ,
        refs: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ,
        setupState: _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ,
        setupContext: null,
        suspense,
        suspenseId: suspense ? suspense.pendingId : 0,
        asyncDep: null,
        asyncResolved: false,
        isMounted: false,
        isUnmounted: false,
        isDeactivated: false,
        bc: null,
        c: null,
        bm: null,
        m: null,
        bu: null,
        u: null,
        um: null,
        bum: null,
        da: null,
        a: null,
        rtg: null,
        rtc: null,
        ec: null,
        sp: null
      };
      if (true) {
        instance.ctx = createDevRenderContext(instance);
      } else {}
      instance.root = parent ? parent.root : instance;
      instance.emit = emit.bind(null, instance);
      if (vnode.ce) {
        vnode.ce(instance);
      }
      return instance;
    }
    let currentInstance = null;
    const getCurrentInstance = () => currentInstance || currentRenderingInstance;
    let internalSetCurrentInstance;
    let setInSSRSetupState;
    {
      const g = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.getGlobalThis)();
      const registerGlobalSetter = (key, setter) => {
        let setters;
        if (!(setters = g[key])) setters = g[key] = [];
        setters.push(setter);
        return v => {
          if (setters.length > 1) setters.forEach(set => set(v)); else setters[0](v);
        };
      };
      internalSetCurrentInstance = registerGlobalSetter(`__VUE_INSTANCE_SETTERS__`, v => currentInstance = v);
      setInSSRSetupState = registerGlobalSetter(`__VUE_SSR_SETTERS__`, v => isInSSRComponentSetup = v);
    }
    const setCurrentInstance = instance => {
      const prev = currentInstance;
      internalSetCurrentInstance(instance);
      instance.scope.on();
      return () => {
        instance.scope.off();
        internalSetCurrentInstance(prev);
      };
    };
    const unsetCurrentInstance = () => {
      currentInstance && currentInstance.scope.off();
      internalSetCurrentInstance(null);
    };
    const isBuiltInTag = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.makeMap)("slot,component");
    function validateComponentName(name, {isNativeTag}) {
      if (isBuiltInTag(name) || isNativeTag(name)) {
        warn$1("Do not use built-in or reserved HTML elements as component id: " + name);
      }
    }
    function isStatefulComponent(instance) {
      return instance.vnode.shapeFlag & 4;
    }
    let isInSSRComponentSetup = false;
    function setupComponent(instance, isSSR = false, optimized = false) {
      isSSR && setInSSRSetupState(isSSR);
      const {props, children} = instance.vnode;
      const isStateful = isStatefulComponent(instance);
      initProps(instance, props, isStateful, isSSR);
      initSlots(instance, children, optimized || isSSR);
      const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
      isSSR && setInSSRSetupState(false);
      return setupResult;
    }
    function setupStatefulComponent(instance, isSSR) {
      const Component = instance.type;
      if (true) {
        if (Component.name) {
          validateComponentName(Component.name, instance.appContext.config);
        }
        if (Component.components) {
          const names = Object.keys(Component.components);
          for (let i = 0; i < names.length; i++) {
            validateComponentName(names[i], instance.appContext.config);
          }
        }
        if (Component.directives) {
          const names = Object.keys(Component.directives);
          for (let i = 0; i < names.length; i++) {
            validateDirectiveName(names[i]);
          }
        }
        if (Component.compilerOptions && isRuntimeOnly()) {
          warn$1(`"compilerOptions" is only supported when using a build of Vue that includes the runtime compiler. Since you are using a runtime-only build, the options should be passed via your build tool config instead.`);
        }
      }
      instance.accessCache = Object.create(null);
      instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
      if (true) {
        exposePropsOnRenderContext(instance);
      }
      const {setup} = Component;
      if (setup) {
        (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.pauseTracking)();
        const setupContext = instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null;
        const reset = setCurrentInstance(instance);
        const setupResult = callWithErrorHandling(setup, instance, 0, [ true ? (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly)(instance.props) : 0, setupContext ]);
        const isAsyncSetup = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isPromise)(setupResult);
        (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.resetTracking)();
        reset();
        if ((isAsyncSetup || instance.sp) && !isAsyncWrapper(instance)) {
          markAsyncBoundary(instance);
        }
        if (isAsyncSetup) {
          setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
          if (isSSR) {
            return setupResult.then(resolvedResult => {
              handleSetupResult(instance, resolvedResult, isSSR);
            }).catch(e => {
              handleError(e, instance, 0);
            });
          } else {
            instance.asyncDep = setupResult;
            if (true && !instance.suspense) {
              const name = formatComponentName(instance, Component);
              warn$1(`Component <${name}>: setup function returned a promise, but no <Suspense> boundary was found in the parent component tree. A component with async setup() must be nested in a <Suspense> in order to be rendered.`);
            }
          }
        } else {
          handleSetupResult(instance, setupResult, isSSR);
        }
      } else {
        finishComponentSetup(instance, isSSR);
      }
    }
    function handleSetupResult(instance, setupResult, isSSR) {
      if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(setupResult)) {
        if (instance.type.__ssrInlineRender) {
          instance.ssrRender = setupResult;
        } else {
          instance.render = setupResult;
        }
      } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(setupResult)) {
        if (true && isVNode(setupResult)) {
          warn$1(`setup() should not return VNodes directly - return a render function instead.`);
        }
        if (true) {
          instance.devtoolsRawSetupState = setupResult;
        }
        instance.setupState = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.proxyRefs)(setupResult);
        if (true) {
          exposeSetupStateOnRenderContext(instance);
        }
      } else if (true && setupResult !== void 0) {
        warn$1(`setup() should return an object. Received: ${setupResult === null ? "null" : typeof setupResult}`);
      }
      finishComponentSetup(instance, isSSR);
    }
    let compile;
    let installWithProxy;
    function registerRuntimeCompiler(_compile) {
      compile = _compile;
      installWithProxy = i => {
        if (i.render._rc) {
          i.withProxy = new Proxy(i.ctx, RuntimeCompiledPublicInstanceProxyHandlers);
        }
      };
    }
    const isRuntimeOnly = () => !compile;
    function finishComponentSetup(instance, isSSR, skipOptions) {
      const Component = instance.type;
      if (!instance.render) {
        if (!isSSR && compile && !Component.render) {
          const template = Component.template || false && 0;
          if (template) {
            if (true) {
              startMeasure(instance, `compile`);
            }
            const {isCustomElement, compilerOptions} = instance.appContext.config;
            const {delimiters, compilerOptions: componentCompilerOptions} = Component;
            const finalCompilerOptions = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)((0, 
            _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({
              isCustomElement,
              delimiters
            }, compilerOptions), componentCompilerOptions);
            Component.render = compile(template, finalCompilerOptions);
            if (true) {
              endMeasure(instance, `compile`);
            }
          }
        }
        instance.render = Component.render || _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP;
        if (installWithProxy) {
          installWithProxy(instance);
        }
      }
      if (false) {}
      if (true && !Component.render && instance.render === _vue_shared__WEBPACK_IMPORTED_MODULE_1__.NOOP && !isSSR) {
        if (!compile && Component.template) {
          warn$1(`Component provided template option but runtime compilation is not supported in this build of Vue.` + ` Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".`);
        } else {
          warn$1(`Component is missing template or render function: `, Component);
        }
      }
    }
    const attrsProxyHandlers = true ? {
      get(target, key) {
        markAttrsAccessed();
        (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.track)(target, "get", "");
        return target[key];
      },
      set() {
        warn$1(`setupContext.attrs is readonly.`);
        return false;
      },
      deleteProperty() {
        warn$1(`setupContext.attrs is readonly.`);
        return false;
      }
    } : 0;
    function getSlotsProxy(instance) {
      return new Proxy(instance.slots, {
        get(target, key) {
          (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.track)(instance, "get", "$slots");
          return target[key];
        }
      });
    }
    function createSetupContext(instance) {
      const expose = exposed => {
        if (true) {
          if (instance.exposed) {
            warn$1(`expose() should be called only once per setup().`);
          }
          if (exposed != null) {
            let exposedType = typeof exposed;
            if (exposedType === "object") {
              if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(exposed)) {
                exposedType = "array";
              } else if ((0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isRef)(exposed)) {
                exposedType = "ref";
              }
            }
            if (exposedType !== "object") {
              warn$1(`expose() should be passed a plain object, received ${exposedType}.`);
            }
          }
        }
        instance.exposed = exposed || {};
      };
      if (true) {
        let attrsProxy;
        let slotsProxy;
        return Object.freeze({
          get attrs() {
            return attrsProxy || (attrsProxy = new Proxy(instance.attrs, attrsProxyHandlers));
          },
          get slots() {
            return slotsProxy || (slotsProxy = getSlotsProxy(instance));
          },
          get emit() {
            return (event, ...args) => instance.emit(event, ...args);
          },
          expose
        });
      } else {}
    }
    function getComponentPublicInstance(instance) {
      if (instance.exposed) {
        return instance.exposeProxy || (instance.exposeProxy = new Proxy((0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.proxyRefs)((0, 
        _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.markRaw)(instance.exposed)), {
          get(target, key) {
            if (key in target) {
              return target[key];
            } else if (key in publicPropertiesMap) {
              return publicPropertiesMap[key](instance);
            }
          },
          has(target, key) {
            return key in target || key in publicPropertiesMap;
          }
        }));
      } else {
        return instance.proxy;
      }
    }
    const classifyRE = /(?:^|[-_])\w/g;
    const classify = str => str.replace(classifyRE, c => c.toUpperCase()).replace(/[-_]/g, "");
    function getComponentName(Component, includeInferred = true) {
      return (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(Component) ? Component.displayName || Component.name : Component.name || includeInferred && Component.__name;
    }
    function formatComponentName(instance, Component, isRoot = false) {
      let name = getComponentName(Component);
      if (!name && Component.__file) {
        const match = Component.__file.match(/([^/\\]+)\.\w+$/);
        if (match) {
          name = match[1];
        }
      }
      if (!name && instance) {
        const inferFromRegistry = registry => {
          for (const key in registry) {
            if (registry[key] === Component) {
              return key;
            }
          }
        };
        name = inferFromRegistry(instance.components) || instance.parent && inferFromRegistry(instance.parent.type.components) || inferFromRegistry(instance.appContext.components);
      }
      return name ? classify(name) : isRoot ? `App` : `Anonymous`;
    }
    function isClassComponent(value) {
      return (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(value) && "__vccOpts" in value;
    }
    const computed = (getterOrOptions, debugOptions) => {
      const c = (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.computed)(getterOrOptions, debugOptions, isInSSRComponentSetup);
      if (true) {
        const i = getCurrentInstance();
        if (i && i.appContext.config.warnRecursiveComputed) {
          c._warnRecursive = true;
        }
      }
      return c;
    };
    function h(type, propsOrChildren, children) {
      try {
        setBlockTracking(-1);
        const l = arguments.length;
        if (l === 2) {
          if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(propsOrChildren) && !(0, 
          _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(propsOrChildren)) {
            if (isVNode(propsOrChildren)) {
              return createVNode(type, null, [ propsOrChildren ]);
            }
            return createVNode(type, propsOrChildren);
          } else {
            return createVNode(type, null, propsOrChildren);
          }
        } else {
          if (l > 3) {
            children = Array.prototype.slice.call(arguments, 2);
          } else if (l === 3 && isVNode(children)) {
            children = [ children ];
          }
          return createVNode(type, propsOrChildren, children);
        }
      } finally {
        setBlockTracking(1);
      }
    }
    function initCustomFormatter() {
      if (false || typeof window === "undefined") {
        return;
      }
      const vueStyle = {
        style: "color:#3ba776"
      };
      const numberStyle = {
        style: "color:#1677ff"
      };
      const stringStyle = {
        style: "color:#f5222d"
      };
      const keywordStyle = {
        style: "color:#eb2f96"
      };
      const formatter = {
        __vue_custom_formatter: true,
        header(obj) {
          if (!(0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(obj)) {
            return null;
          }
          if (obj.__isVue) {
            return [ "div", vueStyle, `VueInstance` ];
          } else if ((0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isRef)(obj)) {
            (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.pauseTracking)();
            const value = obj.value;
            (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.resetTracking)();
            return [ "div", {}, [ "span", vueStyle, genRefFlag(obj) ], "<", formatValue(value), `>` ];
          } else if ((0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isReactive)(obj)) {
            return [ "div", {}, [ "span", vueStyle, (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isShallow)(obj) ? "ShallowReactive" : "Reactive" ], "<", formatValue(obj), `>${(0, 
            _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isReadonly)(obj) ? ` (readonly)` : ``}` ];
          } else if ((0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isReadonly)(obj)) {
            return [ "div", {}, [ "span", vueStyle, (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isShallow)(obj) ? "ShallowReadonly" : "Readonly" ], "<", formatValue(obj), ">" ];
          }
          return null;
        },
        hasBody(obj) {
          return obj && obj.__isVue;
        },
        body(obj) {
          if (obj && obj.__isVue) {
            return [ "div", {}, ...formatInstance(obj.$) ];
          }
        }
      };
      function formatInstance(instance) {
        const blocks = [];
        if (instance.type.props && instance.props) {
          blocks.push(createInstanceBlock("props", (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(instance.props)));
        }
        if (instance.setupState !== _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ) {
          blocks.push(createInstanceBlock("setup", instance.setupState));
        }
        if (instance.data !== _vue_shared__WEBPACK_IMPORTED_MODULE_1__.EMPTY_OBJ) {
          blocks.push(createInstanceBlock("data", (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(instance.data)));
        }
        const computed = extractKeys(instance, "computed");
        if (computed) {
          blocks.push(createInstanceBlock("computed", computed));
        }
        const injected = extractKeys(instance, "inject");
        if (injected) {
          blocks.push(createInstanceBlock("injected", injected));
        }
        blocks.push([ "div", {}, [ "span", {
          style: keywordStyle.style + ";opacity:0.66"
        }, "$ (internal): " ], [ "object", {
          object: instance
        } ] ]);
        return blocks;
      }
      function createInstanceBlock(type, target) {
        target = (0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.extend)({}, target);
        if (!Object.keys(target).length) {
          return [ "span", {} ];
        }
        return [ "div", {
          style: "line-height:1.25em;margin-bottom:0.6em"
        }, [ "div", {
          style: "color:#476582"
        }, type ], [ "div", {
          style: "padding-left:1.25em"
        }, ...Object.keys(target).map(key => [ "div", {}, [ "span", keywordStyle, key + ": " ], formatValue(target[key], false) ]) ] ];
      }
      function formatValue(v, asRaw = true) {
        if (typeof v === "number") {
          return [ "span", numberStyle, v ];
        } else if (typeof v === "string") {
          return [ "span", stringStyle, JSON.stringify(v) ];
        } else if (typeof v === "boolean") {
          return [ "span", keywordStyle, v ];
        } else if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(v)) {
          return [ "object", {
            object: asRaw ? (0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.toRaw)(v) : v
          } ];
        } else {
          return [ "span", stringStyle, String(v) ];
        }
      }
      function extractKeys(instance, type) {
        const Comp = instance.type;
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isFunction)(Comp)) {
          return;
        }
        const extracted = {};
        for (const key in instance.ctx) {
          if (isKeyOfType(Comp, key, type)) {
            extracted[key] = instance.ctx[key];
          }
        }
        return extracted;
      }
      function isKeyOfType(Comp, key, type) {
        const opts = Comp[type];
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isArray)(opts) && opts.includes(key) || (0, 
        _vue_shared__WEBPACK_IMPORTED_MODULE_1__.isObject)(opts) && key in opts) {
          return true;
        }
        if (Comp.extends && isKeyOfType(Comp.extends, key, type)) {
          return true;
        }
        if (Comp.mixins && Comp.mixins.some(m => isKeyOfType(m, key, type))) {
          return true;
        }
      }
      function genRefFlag(v) {
        if ((0, _vue_reactivity__WEBPACK_IMPORTED_MODULE_0__.isShallow)(v)) {
          return `ShallowRef`;
        }
        if (v.effect) {
          return `ComputedRef`;
        }
        return `Ref`;
      }
      if (window.devtoolsFormatters) {
        window.devtoolsFormatters.push(formatter);
      } else {
        window.devtoolsFormatters = [ formatter ];
      }
    }
    function withMemo(memo, render, cache, index) {
      const cached = cache[index];
      if (cached && isMemoSame(cached, memo)) {
        return cached;
      }
      const ret = render();
      ret.memo = memo.slice();
      ret.cacheIndex = index;
      return cache[index] = ret;
    }
    function isMemoSame(cached, memo) {
      const prev = cached.memo;
      if (prev.length != memo.length) {
        return false;
      }
      for (let i = 0; i < prev.length; i++) {
        if ((0, _vue_shared__WEBPACK_IMPORTED_MODULE_1__.hasChanged)(prev[i], memo[i])) {
          return false;
        }
      }
      if (isBlockTreeEnabled > 0 && currentBlock) {
        currentBlock.push(cached);
      }
      return true;
    }
    const version = "3.5.35";
    const warn = true ? warn$1 : 0;
    const ErrorTypeStrings = ErrorTypeStrings$1;
    const devtools = true ? devtools$1 : 0;
    const setDevtoolsHook = true ? setDevtoolsHook$1 : 0;
    const _ssrUtils = {
      createComponentInstance,
      setupComponent,
      renderComponentRoot,
      setCurrentRenderingInstance,
      isVNode,
      normalizeVNode,
      getComponentPublicInstance,
      ensureValidVNode,
      pushWarningContext,
      popWarningContext
    };
    const ssrUtils = _ssrUtils;
    const resolveFilter = null;
    const compatUtils = null;
    const DeprecationTypes = null;
  },
  "./node_modules/.pnpm/@vue+runtime-dom@3.5.35/node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      BaseTransition: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.BaseTransition,
      BaseTransitionPropsValidators: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.BaseTransitionPropsValidators,
      Comment: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.Comment,
      DeprecationTypes: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.DeprecationTypes,
      EffectScope: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.EffectScope,
      ErrorCodes: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.ErrorCodes,
      ErrorTypeStrings: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.ErrorTypeStrings,
      Fragment: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.Fragment,
      KeepAlive: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.KeepAlive,
      ReactiveEffect: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.ReactiveEffect,
      Static: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.Static,
      Suspense: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.Suspense,
      Teleport: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.Teleport,
      Text: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.Text,
      TrackOpTypes: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.TrackOpTypes,
      Transition: () => Transition,
      TransitionGroup: () => TransitionGroup,
      TriggerOpTypes: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.TriggerOpTypes,
      VueElement: () => VueElement,
      assertNumber: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.assertNumber,
      callWithAsyncErrorHandling: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.callWithAsyncErrorHandling,
      callWithErrorHandling: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.callWithErrorHandling,
      camelize: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.camelize,
      capitalize: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.capitalize,
      cloneVNode: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.cloneVNode,
      compatUtils: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.compatUtils,
      computed: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.computed,
      createApp: () => createApp,
      createBlock: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createBlock,
      createCommentVNode: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode,
      createElementBlock: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createElementBlock,
      createElementVNode: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createElementVNode,
      createHydrationRenderer: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createHydrationRenderer,
      createPropsRestProxy: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createPropsRestProxy,
      createRenderer: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createRenderer,
      createSSRApp: () => createSSRApp,
      createSlots: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createSlots,
      createStaticVNode: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createStaticVNode,
      createTextVNode: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createTextVNode,
      createVNode: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createVNode,
      customRef: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.customRef,
      defineAsyncComponent: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.defineAsyncComponent,
      defineComponent: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.defineComponent,
      defineCustomElement: () => defineCustomElement,
      defineEmits: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.defineEmits,
      defineExpose: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.defineExpose,
      defineModel: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.defineModel,
      defineOptions: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.defineOptions,
      defineProps: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.defineProps,
      defineSSRCustomElement: () => defineSSRCustomElement,
      defineSlots: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.defineSlots,
      devtools: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.devtools,
      effect: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.effect,
      effectScope: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.effectScope,
      getCurrentInstance: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.getCurrentInstance,
      getCurrentScope: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.getCurrentScope,
      getCurrentWatcher: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.getCurrentWatcher,
      getTransitionRawChildren: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.getTransitionRawChildren,
      guardReactiveProps: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.guardReactiveProps,
      h: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.h,
      handleError: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.handleError,
      hasInjectionContext: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.hasInjectionContext,
      hydrate: () => hydrate,
      hydrateOnIdle: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.hydrateOnIdle,
      hydrateOnInteraction: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.hydrateOnInteraction,
      hydrateOnMediaQuery: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.hydrateOnMediaQuery,
      hydrateOnVisible: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.hydrateOnVisible,
      initCustomFormatter: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.initCustomFormatter,
      initDirectivesForSSR: () => initDirectivesForSSR,
      inject: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.inject,
      isMemoSame: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.isMemoSame,
      isProxy: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.isProxy,
      isReactive: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.isReactive,
      isReadonly: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.isReadonly,
      isRef: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.isRef,
      isRuntimeOnly: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.isRuntimeOnly,
      isShallow: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.isShallow,
      isVNode: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.isVNode,
      markRaw: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.markRaw,
      mergeDefaults: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.mergeDefaults,
      mergeModels: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.mergeModels,
      mergeProps: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.mergeProps,
      nextTick: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.nextTick,
      nodeOps: () => nodeOps,
      normalizeClass: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.normalizeClass,
      normalizeProps: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.normalizeProps,
      normalizeStyle: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.normalizeStyle,
      onActivated: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onActivated,
      onBeforeMount: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onBeforeMount,
      onBeforeUnmount: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onBeforeUnmount,
      onBeforeUpdate: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onBeforeUpdate,
      onDeactivated: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onDeactivated,
      onErrorCaptured: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onErrorCaptured,
      onMounted: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onMounted,
      onRenderTracked: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onRenderTracked,
      onRenderTriggered: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onRenderTriggered,
      onScopeDispose: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onScopeDispose,
      onServerPrefetch: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onServerPrefetch,
      onUnmounted: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onUnmounted,
      onUpdated: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onUpdated,
      onWatcherCleanup: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onWatcherCleanup,
      openBlock: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.openBlock,
      patchProp: () => patchProp,
      popScopeId: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.popScopeId,
      provide: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.provide,
      proxyRefs: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.proxyRefs,
      pushScopeId: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.pushScopeId,
      queuePostFlushCb: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.queuePostFlushCb,
      reactive: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.reactive,
      readonly: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.readonly,
      ref: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.ref,
      registerRuntimeCompiler: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.registerRuntimeCompiler,
      render: () => render,
      renderList: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.renderList,
      renderSlot: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.renderSlot,
      resolveComponent: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.resolveComponent,
      resolveDirective: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.resolveDirective,
      resolveDynamicComponent: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.resolveDynamicComponent,
      resolveFilter: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.resolveFilter,
      resolveTransitionHooks: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.resolveTransitionHooks,
      setBlockTracking: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.setBlockTracking,
      setDevtoolsHook: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.setDevtoolsHook,
      setTransitionHooks: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.setTransitionHooks,
      shallowReactive: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.shallowReactive,
      shallowReadonly: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.shallowReadonly,
      shallowRef: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.shallowRef,
      ssrContextKey: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.ssrContextKey,
      ssrUtils: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.ssrUtils,
      stop: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.stop,
      toDisplayString: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.toDisplayString,
      toHandlerKey: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.toHandlerKey,
      toHandlers: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.toHandlers,
      toRaw: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.toRaw,
      toRef: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.toRef,
      toRefs: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.toRefs,
      toValue: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.toValue,
      transformVNodeArgs: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.transformVNodeArgs,
      triggerRef: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.triggerRef,
      unref: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.unref,
      useAttrs: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.useAttrs,
      useCssModule: () => useCssModule,
      useCssVars: () => useCssVars,
      useHost: () => useHost,
      useId: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.useId,
      useModel: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.useModel,
      useSSRContext: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.useSSRContext,
      useShadowRoot: () => useShadowRoot,
      useSlots: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.useSlots,
      useTemplateRef: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.useTemplateRef,
      useTransitionState: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.useTransitionState,
      vModelCheckbox: () => vModelCheckbox,
      vModelDynamic: () => vModelDynamic,
      vModelRadio: () => vModelRadio,
      vModelSelect: () => vModelSelect,
      vModelText: () => vModelText,
      vShow: () => vShow,
      version: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.version,
      warn: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn,
      watch: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.watch,
      watchEffect: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.watchEffect,
      watchPostEffect: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.watchPostEffect,
      watchSyncEffect: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.watchSyncEffect,
      withAsyncContext: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.withAsyncContext,
      withCtx: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.withCtx,
      withDefaults: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.withDefaults,
      withDirectives: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.withDirectives,
      withKeys: () => withKeys,
      withMemo: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.withMemo,
      withModifiers: () => withModifiers,
      withScopeId: () => _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.withScopeId
    });
    var _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @vue/runtime-core */ "./node_modules/.pnpm/@vue+runtime-core@3.5.35/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js");
    var _vue_runtime_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @vue/runtime-core */ "./node_modules/.pnpm/@vue+reactivity@3.5.35/node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js");
    var _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @vue/shared */ "./node_modules/.pnpm/@vue+shared@3.5.35/node_modules/@vue/shared/dist/shared.esm-bundler.js");
    /**
* @vue/runtime-dom v3.5.35
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/    let policy = void 0;
    const tt = typeof window !== "undefined" && window.trustedTypes;
    if (tt) {
      try {
        policy = tt.createPolicy("vue", {
          createHTML: val => val
        });
      } catch (e) {
        true && (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`Error creating trusted types policy: ${e}`);
      }
    }
    const unsafeToTrustedHTML = policy ? val => policy.createHTML(val) : val => val;
    const svgNS = "http://www.w3.org/2000/svg";
    const mathmlNS = "http://www.w3.org/1998/Math/MathML";
    const doc = typeof document !== "undefined" ? document : null;
    const templateContainer = doc && doc.createElement("template");
    const nodeOps = {
      insert: (child, parent, anchor) => {
        parent.insertBefore(child, anchor || null);
      },
      remove: child => {
        const parent = child.parentNode;
        if (parent) {
          parent.removeChild(child);
        }
      },
      createElement: (tag, namespace, is, props) => {
        const el = namespace === "svg" ? doc.createElementNS(svgNS, tag) : namespace === "mathml" ? doc.createElementNS(mathmlNS, tag) : is ? doc.createElement(tag, {
          is
        }) : doc.createElement(tag);
        if (tag === "select" && props && props.multiple != null) {
          el.setAttribute("multiple", props.multiple);
        }
        return el;
      },
      createText: text => doc.createTextNode(text),
      createComment: text => doc.createComment(text),
      setText: (node, text) => {
        node.nodeValue = text;
      },
      setElementText: (el, text) => {
        el.textContent = text;
      },
      parentNode: node => node.parentNode,
      nextSibling: node => node.nextSibling,
      querySelector: selector => doc.querySelector(selector),
      setScopeId(el, id) {
        el.setAttribute(id, "");
      },
      insertStaticContent(content, parent, anchor, namespace, start, end) {
        const before = anchor ? anchor.previousSibling : parent.lastChild;
        if (start && (start === end || start.nextSibling)) {
          while (true) {
            parent.insertBefore(start.cloneNode(true), anchor);
            if (start === end || !(start = start.nextSibling)) break;
          }
        } else {
          templateContainer.innerHTML = unsafeToTrustedHTML(namespace === "svg" ? `<svg>${content}</svg>` : namespace === "mathml" ? `<math>${content}</math>` : content);
          const template = templateContainer.content;
          if (namespace === "svg" || namespace === "mathml") {
            const wrapper = template.firstChild;
            while (wrapper.firstChild) {
              template.appendChild(wrapper.firstChild);
            }
            template.removeChild(wrapper);
          }
          parent.insertBefore(template, anchor);
        }
        return [ before ? before.nextSibling : parent.firstChild, anchor ? anchor.previousSibling : parent.lastChild ];
      }
    };
    const TRANSITION = "transition";
    const ANIMATION = "animation";
    const vtcKey = Symbol("_vtc");
    const DOMTransitionPropsValidators = {
      name: String,
      type: String,
      css: {
        type: Boolean,
        default: true
      },
      duration: [ String, Number, Object ],
      enterFromClass: String,
      enterActiveClass: String,
      enterToClass: String,
      appearFromClass: String,
      appearActiveClass: String,
      appearToClass: String,
      leaveFromClass: String,
      leaveActiveClass: String,
      leaveToClass: String
    };
    const TransitionPropsValidators = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.extend)({}, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.BaseTransitionPropsValidators, DOMTransitionPropsValidators);
    const decorate$1 = t => {
      t.displayName = "Transition";
      t.props = TransitionPropsValidators;
      return t;
    };
    const Transition = decorate$1((props, {slots}) => (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.h)(_vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.BaseTransition, resolveTransitionProps(props), slots));
    const callHook = (hook, args = []) => {
      if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(hook)) {
        hook.forEach(h2 => h2(...args));
      } else if (hook) {
        hook(...args);
      }
    };
    const hasExplicitCallback = hook => hook ? (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(hook) ? hook.some(h2 => h2.length > 1) : hook.length > 1 : false;
    function resolveTransitionProps(rawProps) {
      const baseProps = {};
      for (const key in rawProps) {
        if (!(key in DOMTransitionPropsValidators)) {
          baseProps[key] = rawProps[key];
        }
      }
      if (rawProps.css === false) {
        return baseProps;
      }
      const {name = "v", type, duration, enterFromClass = `${name}-enter-from`, enterActiveClass = `${name}-enter-active`, enterToClass = `${name}-enter-to`, appearFromClass = enterFromClass, appearActiveClass = enterActiveClass, appearToClass = enterToClass, leaveFromClass = `${name}-leave-from`, leaveActiveClass = `${name}-leave-active`, leaveToClass = `${name}-leave-to`} = rawProps;
      const durations = normalizeDuration(duration);
      const enterDuration = durations && durations[0];
      const leaveDuration = durations && durations[1];
      const {onBeforeEnter, onEnter, onEnterCancelled, onLeave, onLeaveCancelled, onBeforeAppear = onBeforeEnter, onAppear = onEnter, onAppearCancelled = onEnterCancelled} = baseProps;
      const finishEnter = (el, isAppear, done, isCancelled) => {
        el._enterCancelled = isCancelled;
        removeTransitionClass(el, isAppear ? appearToClass : enterToClass);
        removeTransitionClass(el, isAppear ? appearActiveClass : enterActiveClass);
        done && done();
      };
      const finishLeave = (el, done) => {
        el._isLeaving = false;
        removeTransitionClass(el, leaveFromClass);
        removeTransitionClass(el, leaveToClass);
        removeTransitionClass(el, leaveActiveClass);
        done && done();
      };
      const makeEnterHook = isAppear => (el, done) => {
        const hook = isAppear ? onAppear : onEnter;
        const resolve = () => finishEnter(el, isAppear, done);
        callHook(hook, [ el, resolve ]);
        nextFrame(() => {
          removeTransitionClass(el, isAppear ? appearFromClass : enterFromClass);
          addTransitionClass(el, isAppear ? appearToClass : enterToClass);
          if (!hasExplicitCallback(hook)) {
            whenTransitionEnds(el, type, enterDuration, resolve);
          }
        });
      };
      return (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.extend)(baseProps, {
        onBeforeEnter(el) {
          callHook(onBeforeEnter, [ el ]);
          addTransitionClass(el, enterFromClass);
          addTransitionClass(el, enterActiveClass);
        },
        onBeforeAppear(el) {
          callHook(onBeforeAppear, [ el ]);
          addTransitionClass(el, appearFromClass);
          addTransitionClass(el, appearActiveClass);
        },
        onEnter: makeEnterHook(false),
        onAppear: makeEnterHook(true),
        onLeave(el, done) {
          el._isLeaving = true;
          const resolve = () => finishLeave(el, done);
          addTransitionClass(el, leaveFromClass);
          if (!el._enterCancelled) {
            forceReflow(el);
            addTransitionClass(el, leaveActiveClass);
          } else {
            addTransitionClass(el, leaveActiveClass);
            forceReflow(el);
          }
          nextFrame(() => {
            if (!el._isLeaving) {
              return;
            }
            removeTransitionClass(el, leaveFromClass);
            addTransitionClass(el, leaveToClass);
            if (!hasExplicitCallback(onLeave)) {
              whenTransitionEnds(el, type, leaveDuration, resolve);
            }
          });
          callHook(onLeave, [ el, resolve ]);
        },
        onEnterCancelled(el) {
          finishEnter(el, false, void 0, true);
          callHook(onEnterCancelled, [ el ]);
        },
        onAppearCancelled(el) {
          finishEnter(el, true, void 0, true);
          callHook(onAppearCancelled, [ el ]);
        },
        onLeaveCancelled(el) {
          finishLeave(el);
          callHook(onLeaveCancelled, [ el ]);
        }
      });
    }
    function normalizeDuration(duration) {
      if (duration == null) {
        return null;
      } else if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isObject)(duration)) {
        return [ NumberOf(duration.enter), NumberOf(duration.leave) ];
      } else {
        const n = NumberOf(duration);
        return [ n, n ];
      }
    }
    function NumberOf(val) {
      const res = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.toNumber)(val);
      if (true) {
        (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.assertNumber)(res, "<transition> explicit duration");
      }
      return res;
    }
    function addTransitionClass(el, cls) {
      cls.split(/\s+/).forEach(c => c && el.classList.add(c));
      (el[vtcKey] || (el[vtcKey] = new Set)).add(cls);
    }
    function removeTransitionClass(el, cls) {
      cls.split(/\s+/).forEach(c => c && el.classList.remove(c));
      const _vtc = el[vtcKey];
      if (_vtc) {
        _vtc.delete(cls);
        if (!_vtc.size) {
          el[vtcKey] = void 0;
        }
      }
    }
    function nextFrame(cb) {
      requestAnimationFrame(() => {
        requestAnimationFrame(cb);
      });
    }
    let endId = 0;
    function whenTransitionEnds(el, expectedType, explicitTimeout, resolve) {
      const id = el._endId = ++endId;
      const resolveIfNotStale = () => {
        if (id === el._endId) {
          resolve();
        }
      };
      if (explicitTimeout != null) {
        return setTimeout(resolveIfNotStale, explicitTimeout);
      }
      const {type, timeout, propCount} = getTransitionInfo(el, expectedType);
      if (!type) {
        return resolve();
      }
      const endEvent = type + "end";
      let ended = 0;
      const end = () => {
        el.removeEventListener(endEvent, onEnd);
        resolveIfNotStale();
      };
      const onEnd = e => {
        if (e.target === el && ++ended >= propCount) {
          end();
        }
      };
      setTimeout(() => {
        if (ended < propCount) {
          end();
        }
      }, timeout + 1);
      el.addEventListener(endEvent, onEnd);
    }
    function getTransitionInfo(el, expectedType) {
      const styles = window.getComputedStyle(el);
      const getStyleProperties = key => (styles[key] || "").split(", ");
      const transitionDelays = getStyleProperties(`${TRANSITION}Delay`);
      const transitionDurations = getStyleProperties(`${TRANSITION}Duration`);
      const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
      const animationDelays = getStyleProperties(`${ANIMATION}Delay`);
      const animationDurations = getStyleProperties(`${ANIMATION}Duration`);
      const animationTimeout = getTimeout(animationDelays, animationDurations);
      let type = null;
      let timeout = 0;
      let propCount = 0;
      if (expectedType === TRANSITION) {
        if (transitionTimeout > 0) {
          type = TRANSITION;
          timeout = transitionTimeout;
          propCount = transitionDurations.length;
        }
      } else if (expectedType === ANIMATION) {
        if (animationTimeout > 0) {
          type = ANIMATION;
          timeout = animationTimeout;
          propCount = animationDurations.length;
        }
      } else {
        timeout = Math.max(transitionTimeout, animationTimeout);
        type = timeout > 0 ? transitionTimeout > animationTimeout ? TRANSITION : ANIMATION : null;
        propCount = type ? type === TRANSITION ? transitionDurations.length : animationDurations.length : 0;
      }
      const hasTransform = type === TRANSITION && /\b(?:transform|all)(?:,|$)/.test(getStyleProperties(`${TRANSITION}Property`).toString());
      return {
        type,
        timeout,
        propCount,
        hasTransform
      };
    }
    function getTimeout(delays, durations) {
      while (delays.length < durations.length) {
        delays = delays.concat(delays);
      }
      return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])));
    }
    function toMs(s) {
      if (s === "auto") return 0;
      return Number(s.slice(0, -1).replace(",", ".")) * 1e3;
    }
    function forceReflow(el) {
      const targetDocument = el ? el.ownerDocument : document;
      return targetDocument.body.offsetHeight;
    }
    function patchClass(el, value, isSVG) {
      const transitionClasses = el[vtcKey];
      if (transitionClasses) {
        value = (value ? [ value, ...transitionClasses ] : [ ...transitionClasses ]).join(" ");
      }
      if (value == null) {
        el.removeAttribute("class");
      } else if (isSVG) {
        el.setAttribute("class", value);
      } else {
        el.className = value;
      }
    }
    const vShowOriginalDisplay = Symbol("_vod");
    const vShowHidden = Symbol("_vsh");
    const vShow = {
      name: "show",
      beforeMount(el, {value}, {transition}) {
        el[vShowOriginalDisplay] = el.style.display === "none" ? "" : el.style.display;
        if (transition && value) {
          transition.beforeEnter(el);
        } else {
          setDisplay(el, value);
        }
      },
      mounted(el, {value}, {transition}) {
        if (transition && value) {
          transition.enter(el);
        }
      },
      updated(el, {value, oldValue}, {transition}) {
        if (!value === !oldValue) return;
        if (transition) {
          if (value) {
            transition.beforeEnter(el);
            setDisplay(el, true);
            transition.enter(el);
          } else {
            transition.leave(el, () => {
              setDisplay(el, false);
            });
          }
        } else {
          setDisplay(el, value);
        }
      },
      beforeUnmount(el, {value}) {
        setDisplay(el, value);
      }
    };
    function setDisplay(el, value) {
      el.style.display = value ? el[vShowOriginalDisplay] : "none";
      el[vShowHidden] = !value;
    }
    function initVShowForSSR() {
      vShow.getSSRProps = ({value}) => {
        if (!value) {
          return {
            style: {
              display: "none"
            }
          };
        }
      };
    }
    const CSS_VAR_TEXT = Symbol(true ? "CSS_VAR_TEXT" : 0);
    function useCssVars(getter) {
      const instance = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.getCurrentInstance)();
      if (!instance) {
        true && (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`useCssVars is called without current active component instance.`);
        return;
      }
      const updateTeleports = instance.ut = (vars = getter(instance.proxy)) => {
        Array.from(document.querySelectorAll(`[data-v-owner="${instance.uid}"]`)).forEach(node => setVarsOnNode(node, vars));
      };
      if (true) {
        instance.getCssVars = () => getter(instance.proxy);
      }
      const setVars = () => {
        const vars = getter(instance.proxy);
        if (instance.ce) {
          setVarsOnNode(instance.ce, vars);
        } else {
          setVarsOnVNode(instance.subTree, vars);
        }
        updateTeleports(vars);
      };
      (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onBeforeUpdate)(() => {
        (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.queuePostFlushCb)(setVars);
      });
      (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onMounted)(() => {
        (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.watch)(setVars, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.NOOP, {
          flush: "post"
        });
        const ob = new MutationObserver(setVars);
        ob.observe(instance.subTree.el.parentNode, {
          childList: true
        });
        (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onUnmounted)(() => ob.disconnect());
      });
    }
    function setVarsOnVNode(vnode, vars) {
      if (vnode.shapeFlag & 128) {
        const suspense = vnode.suspense;
        vnode = suspense.activeBranch;
        if (suspense.pendingBranch && !suspense.isHydrating) {
          suspense.effects.push(() => {
            setVarsOnVNode(suspense.activeBranch, vars);
          });
        }
      }
      while (vnode.component) {
        vnode = vnode.component.subTree;
      }
      if (vnode.shapeFlag & 1 && vnode.el) {
        setVarsOnNode(vnode.el, vars);
      } else if (vnode.type === _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.Fragment) {
        vnode.children.forEach(c => setVarsOnVNode(c, vars));
      } else if (vnode.type === _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.Static) {
        let {el, anchor} = vnode;
        while (el) {
          setVarsOnNode(el, vars);
          if (el === anchor) break;
          el = el.nextSibling;
        }
      }
    }
    function setVarsOnNode(el, vars) {
      if (el.nodeType === 1) {
        const style = el.style;
        let cssText = "";
        for (const key in vars) {
          const value = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.normalizeCssVarValue)(vars[key]);
          style.setProperty(`--${key}`, value);
          cssText += `--${key}: ${value};`;
        }
        style[CSS_VAR_TEXT] = cssText;
      }
    }
    const displayRE = /(?:^|;)\s*display\s*:/;
    function patchStyle(el, prev, next) {
      const style = el.style;
      const isCssString = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isString)(next);
      let hasControlledDisplay = false;
      if (next && !isCssString) {
        if (prev) {
          if (!(0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isString)(prev)) {
            for (const key in prev) {
              if (next[key] == null) {
                setStyle(style, key, "");
              }
            }
          } else {
            for (const prevStyle of prev.split(";")) {
              const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
              if (next[key] == null) {
                setStyle(style, key, "");
              }
            }
          }
        }
        for (const key in next) {
          if (key === "display") {
            hasControlledDisplay = true;
          }
          const value = next[key];
          if (value != null) {
            if (!shouldPreserveTextareaResizeStyle(el, key, !(0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isString)(prev) && prev ? prev[key] : void 0, value)) {
              setStyle(style, key, value);
            }
          } else {
            setStyle(style, key, "");
          }
        }
      } else {
        if (isCssString) {
          if (prev !== next) {
            const cssVarText = style[CSS_VAR_TEXT];
            if (cssVarText) {
              next += ";" + cssVarText;
            }
            style.cssText = next;
            hasControlledDisplay = displayRE.test(next);
          }
        } else if (prev) {
          el.removeAttribute("style");
        }
      }
      if (vShowOriginalDisplay in el) {
        el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : "";
        if (el[vShowHidden]) {
          style.display = "none";
        }
      }
    }
    const semicolonRE = /[^\\];\s*$/;
    const importantRE = /\s*!important$/;
    function setStyle(style, name, val) {
      if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(val)) {
        val.forEach(v => setStyle(style, name, v));
      } else {
        if (val == null) val = "";
        if (true) {
          if (semicolonRE.test(val)) {
            (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`Unexpected semicolon at the end of '${name}' style value: '${val}'`);
          }
        }
        if (name.startsWith("--")) {
          style.setProperty(name, val);
        } else {
          const prefixed = autoPrefix(style, name);
          if (importantRE.test(val)) {
            style.setProperty((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.hyphenate)(prefixed), val.replace(importantRE, ""), "important");
          } else {
            style[prefixed] = val;
          }
        }
      }
    }
    const prefixes = [ "Webkit", "Moz", "ms" ];
    const prefixCache = {};
    function autoPrefix(style, rawName) {
      const cached = prefixCache[rawName];
      if (cached) {
        return cached;
      }
      let name = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.camelize)(rawName);
      if (name !== "filter" && name in style) {
        return prefixCache[rawName] = name;
      }
      name = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.capitalize)(name);
      for (let i = 0; i < prefixes.length; i++) {
        const prefixed = prefixes[i] + name;
        if (prefixed in style) {
          return prefixCache[rawName] = prefixed;
        }
      }
      return rawName;
    }
    function shouldPreserveTextareaResizeStyle(el, key, prev, next) {
      return el.tagName === "TEXTAREA" && (key === "width" || key === "height") && (0, 
      _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isString)(next) && prev === next;
    }
    const xlinkNS = "http://www.w3.org/1999/xlink";
    function patchAttr(el, key, value, isSVG, instance, isBoolean = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isSpecialBooleanAttr)(key)) {
      if (isSVG && key.startsWith("xlink:")) {
        if (value == null) {
          el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
        } else {
          el.setAttributeNS(xlinkNS, key, value);
        }
      } else {
        if (value == null || isBoolean && !(0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.includeBooleanAttr)(value)) {
          el.removeAttribute(key);
        } else {
          el.setAttribute(key, isBoolean ? "" : (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isSymbol)(value) ? String(value) : value);
        }
      }
    }
    function patchDOMProp(el, key, value, parentComponent, attrName) {
      if (key === "innerHTML" || key === "textContent") {
        if (value != null) {
          el[key] = key === "innerHTML" ? unsafeToTrustedHTML(value) : value;
        }
        return;
      }
      const tag = el.tagName;
      if (key === "value" && tag !== "PROGRESS" && !tag.includes("-")) {
        const oldValue = tag === "OPTION" ? el.getAttribute("value") || "" : el.value;
        const newValue = value == null ? el.type === "checkbox" ? "on" : "" : String(value);
        if (oldValue !== newValue || !("_value" in el)) {
          el.value = newValue;
        }
        if (value == null) {
          el.removeAttribute(key);
        }
        el._value = value;
        return;
      }
      let needRemove = false;
      if (value === "" || value == null) {
        const type = typeof el[key];
        if (type === "boolean") {
          value = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.includeBooleanAttr)(value);
        } else if (value == null && type === "string") {
          value = "";
          needRemove = true;
        } else if (type === "number") {
          value = 0;
          needRemove = true;
        }
      }
      try {
        el[key] = value;
      } catch (e) {
        if (true && !needRemove) {
          (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`Failed setting prop "${key}" on <${tag.toLowerCase()}>: value ${value} is invalid.`, e);
        }
      }
      needRemove && el.removeAttribute(attrName || key);
    }
    function addEventListener(el, event, handler, options) {
      el.addEventListener(event, handler, options);
    }
    function removeEventListener(el, event, handler, options) {
      el.removeEventListener(event, handler, options);
    }
    const veiKey = Symbol("_vei");
    function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
      const invokers = el[veiKey] || (el[veiKey] = {});
      const existingInvoker = invokers[rawName];
      if (nextValue && existingInvoker) {
        existingInvoker.value = true ? sanitizeEventValue(nextValue, rawName) : 0;
      } else {
        const [name, options] = parseName(rawName);
        if (nextValue) {
          const invoker = invokers[rawName] = createInvoker(true ? sanitizeEventValue(nextValue, rawName) : 0, instance);
          addEventListener(el, name, invoker, options);
        } else if (existingInvoker) {
          removeEventListener(el, name, existingInvoker, options);
          invokers[rawName] = void 0;
        }
      }
    }
    const optionsModifierRE = /(?:Once|Passive|Capture)$/;
    function parseName(name) {
      let options;
      if (optionsModifierRE.test(name)) {
        options = {};
        let m;
        while (m = name.match(optionsModifierRE)) {
          name = name.slice(0, name.length - m[0].length);
          options[m[0].toLowerCase()] = true;
        }
      }
      const event = name[2] === ":" ? name.slice(3) : (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.hyphenate)(name.slice(2));
      return [ event, options ];
    }
    let cachedNow = 0;
    const p = Promise.resolve();
    const getNow = () => cachedNow || (p.then(() => cachedNow = 0), cachedNow = Date.now());
    function createInvoker(initialValue, instance) {
      const invoker = e => {
        if (!e._vts) {
          e._vts = Date.now();
        } else if (e._vts <= invoker.attached) {
          return;
        }
        const value = invoker.value;
        if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(value)) {
          const originalStop = e.stopImmediatePropagation;
          e.stopImmediatePropagation = () => {
            originalStop.call(e);
            e._stopped = true;
          };
          const handlers = value.slice();
          const args = [ e ];
          for (let i = 0; i < handlers.length; i++) {
            if (e._stopped) {
              break;
            }
            const handler = handlers[i];
            if (handler) {
              (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.callWithAsyncErrorHandling)(handler, instance, 5, args);
            }
          }
        } else {
          (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.callWithAsyncErrorHandling)(value, instance, 5, [ e ]);
        }
      };
      invoker.value = initialValue;
      invoker.attached = getNow();
      return invoker;
    }
    function sanitizeEventValue(value, propName) {
      if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isFunction)(value) || (0, 
      _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(value)) {
        return value;
      }
      (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`Wrong type passed as event handler to ${propName} - did you forget @ or : in front of your prop?\nExpected function or array of functions, received type ${typeof value}.`);
      return _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.NOOP;
    }
    const isNativeOn = key => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && key.charCodeAt(2) > 96 && key.charCodeAt(2) < 123;
    const patchProp = (el, key, prevValue, nextValue, namespace, parentComponent) => {
      const isSVG = namespace === "svg";
      if (key === "class") {
        patchClass(el, nextValue, isSVG);
      } else if (key === "style") {
        patchStyle(el, prevValue, nextValue);
      } else if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isOn)(key)) {
        if (!(0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isModelListener)(key)) {
          patchEvent(el, key, prevValue, nextValue, parentComponent);
        }
      } else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), 
      false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
        patchDOMProp(el, key, nextValue);
        if (!el.tagName.includes("-") && (key === "value" || key === "checked" || key === "selected")) {
          patchAttr(el, key, nextValue, isSVG, parentComponent, key !== "value");
        }
      } else if (el._isVueCE && (shouldSetAsPropForVueCE(el, key) || el._def.__asyncLoader && (/[A-Z]/.test(key) || !(0, 
      _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isString)(nextValue)))) {
        patchDOMProp(el, (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.camelize)(key), nextValue, parentComponent, key);
      } else {
        if (key === "true-value") {
          el._trueValue = nextValue;
        } else if (key === "false-value") {
          el._falseValue = nextValue;
        }
        patchAttr(el, key, nextValue, isSVG);
      }
    };
    function shouldSetAsProp(el, key, value, isSVG) {
      if (isSVG) {
        if (key === "innerHTML" || key === "textContent") {
          return true;
        }
        if (key in el && isNativeOn(key) && (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isFunction)(value)) {
          return true;
        }
        return false;
      }
      if (key === "spellcheck" || key === "draggable" || key === "translate" || key === "autocorrect") {
        return false;
      }
      if (key === "sandbox" && el.tagName === "IFRAME") {
        return false;
      }
      if (key === "form") {
        return false;
      }
      if (key === "list" && el.tagName === "INPUT") {
        return false;
      }
      if (key === "type" && el.tagName === "TEXTAREA") {
        return false;
      }
      if (key === "width" || key === "height") {
        const tag = el.tagName;
        if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SOURCE") {
          return false;
        }
      }
      if (isNativeOn(key) && (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isString)(value)) {
        return false;
      }
      return key in el;
    }
    function shouldSetAsPropForVueCE(el, key) {
      const props = el._def.props;
      if (!props) {
        return false;
      }
      const camelKey = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.camelize)(key);
      return Array.isArray(props) ? props.some(prop => (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.camelize)(prop) === camelKey) : Object.keys(props).some(prop => (0, 
      _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.camelize)(prop) === camelKey);
    }
    const REMOVAL = {};
    function defineCustomElement(options, extraOptions, _createApp) {
      let Comp = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.defineComponent)(options, extraOptions);
      if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isPlainObject)(Comp)) Comp = (0, 
      _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.extend)({}, Comp, extraOptions);
      class VueCustomElement extends VueElement {
        constructor(initialProps) {
          super(Comp, initialProps, _createApp);
        }
      }
      VueCustomElement.def = Comp;
      return VueCustomElement;
    }
    const defineSSRCustomElement = (options, extraOptions) => defineCustomElement(options, extraOptions, createSSRApp);
    const BaseClass = typeof HTMLElement !== "undefined" ? HTMLElement : class {};
    class VueElement extends BaseClass {
      constructor(_def, _props = {}, _createApp = createApp) {
        super();
        this._def = _def;
        this._props = _props;
        this._createApp = _createApp;
        this._isVueCE = true;
        this._instance = null;
        this._app = null;
        this._nonce = this._def.nonce;
        this._connected = false;
        this._resolved = false;
        this._patching = false;
        this._dirty = false;
        this._numberProps = null;
        this._styleChildren = new WeakSet;
        this._styleAnchors = new WeakMap;
        this._ob = null;
        if (this.shadowRoot && _createApp !== createApp) {
          this._root = this.shadowRoot;
        } else {
          if (true && this.shadowRoot) {
            (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`Custom element has pre-rendered declarative shadow root but is not defined as hydratable. Use \`defineSSRCustomElement\`.`);
          }
          if (_def.shadowRoot !== false) {
            this.attachShadow((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.extend)({}, _def.shadowRootOptions, {
              mode: "open"
            }));
            this._root = this.shadowRoot;
          } else {
            this._root = this;
          }
        }
      }
      connectedCallback() {
        if (!this.isConnected) return;
        if (!this.shadowRoot && !this._resolved) {
          this._parseSlots();
        }
        this._connected = true;
        let parent = this;
        while (parent = parent && (parent.assignedSlot || parent.parentNode || parent.host)) {
          if (parent instanceof VueElement) {
            this._parent = parent;
            break;
          }
        }
        if (!this._instance) {
          if (this._resolved) {
            this._mount(this._def);
          } else {
            if (parent && parent._pendingResolve) {
              this._pendingResolve = parent._pendingResolve.then(() => {
                this._pendingResolve = void 0;
                this._resolveDef();
              });
            } else {
              this._resolveDef();
            }
          }
        }
      }
      _setParent(parent = this._parent) {
        if (parent) {
          this._instance.parent = parent._instance;
          this._inheritParentContext(parent);
        }
      }
      _inheritParentContext(parent = this._parent) {
        if (parent && this._app) {
          Object.setPrototypeOf(this._app._context.provides, parent._instance.provides);
        }
      }
      disconnectedCallback() {
        this._connected = false;
        (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.nextTick)(() => {
          if (!this._connected) {
            if (this._ob) {
              this._ob.disconnect();
              this._ob = null;
            }
            this._app && this._app.unmount();
            if (this._instance) this._instance.ce = void 0;
            this._app = this._instance = null;
            if (this._teleportTargets) {
              this._teleportTargets.clear();
              this._teleportTargets = void 0;
            }
          }
        });
      }
      _processMutations(mutations) {
        for (const m of mutations) {
          this._setAttr(m.attributeName);
        }
      }
      _resolveDef() {
        if (this._pendingResolve) {
          return;
        }
        for (let i = 0; i < this.attributes.length; i++) {
          this._setAttr(this.attributes[i].name);
        }
        this._ob = new MutationObserver(this._processMutations.bind(this));
        this._ob.observe(this, {
          attributes: true
        });
        const resolve = (def, isAsync = false) => {
          this._resolved = true;
          this._pendingResolve = void 0;
          const {props, styles} = def;
          let numberProps;
          if (props && !(0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(props)) {
            for (const key in props) {
              const opt = props[key];
              if (opt === Number || opt && opt.type === Number) {
                if (key in this._props) {
                  this._props[key] = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.toNumber)(this._props[key]);
                }
                (numberProps || (numberProps = Object.create(null)))[(0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.camelize)(key)] = true;
              }
            }
          }
          this._numberProps = numberProps;
          this._resolveProps(def);
          if (this.shadowRoot) {
            this._applyStyles(styles);
          } else if (true && styles) {
            (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)("Custom element style injection is not supported when using shadowRoot: false");
          }
          this._mount(def);
        };
        const asyncDef = this._def.__asyncLoader;
        if (asyncDef) {
          this._pendingResolve = asyncDef().then(def => {
            def.configureApp = this._def.configureApp;
            resolve(this._def = def, true);
          });
        } else {
          resolve(this._def);
        }
      }
      _mount(def) {
        if (true && !def.name) {
          def.name = "VueElement";
        }
        this._app = this._createApp(def);
        this._inheritParentContext();
        if (def.configureApp) {
          def.configureApp(this._app);
        }
        this._app._ceVNode = this._createVNode();
        this._app.mount(this._root);
        const exposed = this._instance && this._instance.exposed;
        if (!exposed) return;
        for (const key in exposed) {
          if (!(0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.hasOwn)(this, key)) {
            Object.defineProperty(this, key, {
              get: () => (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_1__.unref)(exposed[key])
            });
          } else if (true) {
            (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`Exposed property "${key}" already exists on custom element.`);
          }
        }
      }
      _resolveProps(def) {
        const {props} = def;
        const declaredPropKeys = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(props) ? props : Object.keys(props || {});
        for (const key of Object.keys(this)) {
          if (key[0] !== "_" && declaredPropKeys.includes(key)) {
            this._setProp(key, this[key]);
          }
        }
        for (const key of declaredPropKeys.map(_vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.camelize)) {
          Object.defineProperty(this, key, {
            get() {
              return this._getProp(key);
            },
            set(val) {
              this._setProp(key, val, true, !this._patching);
            }
          });
        }
      }
      _setAttr(key) {
        if (key.startsWith("data-v-")) return;
        const has = this.hasAttribute(key);
        let value = has ? this.getAttribute(key) : REMOVAL;
        const camelKey = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.camelize)(key);
        if (has && this._numberProps && this._numberProps[camelKey]) {
          value = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.toNumber)(value);
        }
        this._setProp(camelKey, value, false, true);
      }
      _getProp(key) {
        return this._props[key];
      }
      _setProp(key, val, shouldReflect = true, shouldUpdate = false) {
        if (val !== this._props[key]) {
          this._dirty = true;
          if (val === REMOVAL) {
            delete this._props[key];
          } else {
            this._props[key] = val;
            if (key === "key" && this._app) {
              this._app._ceVNode.key = val;
            }
          }
          if (shouldUpdate && this._instance) {
            this._update();
          }
          if (shouldReflect) {
            const ob = this._ob;
            if (ob) {
              this._processMutations(ob.takeRecords());
              ob.disconnect();
            }
            if (val === true) {
              this.setAttribute((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.hyphenate)(key), "");
            } else if (typeof val === "string" || typeof val === "number") {
              this.setAttribute((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.hyphenate)(key), val + "");
            } else if (!val) {
              this.removeAttribute((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.hyphenate)(key));
            }
            ob && ob.observe(this, {
              attributes: true
            });
          }
        }
      }
      _update() {
        const vnode = this._createVNode();
        if (this._app) vnode.appContext = this._app._context;
        render(vnode, this._root);
      }
      _createVNode() {
        const baseProps = {};
        if (!this.shadowRoot) {
          baseProps.onVnodeMounted = baseProps.onVnodeUpdated = this._renderSlots.bind(this);
        }
        const vnode = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createVNode)(this._def, (0, 
        _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.extend)(baseProps, this._props));
        if (!this._instance) {
          vnode.ce = instance => {
            this._instance = instance;
            instance.ce = this;
            instance.isCE = true;
            if (true) {
              instance.ceReload = newStyles => {
                if (this._styles) {
                  this._styles.forEach(s => this._root.removeChild(s));
                  this._styles.length = 0;
                }
                this._styleAnchors.delete(this._def);
                this._applyStyles(newStyles);
                this._instance = null;
                this._update();
              };
            }
            const dispatch = (event, args) => {
              this.dispatchEvent(new CustomEvent(event, (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isPlainObject)(args[0]) ? (0, 
              _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.extend)({
                detail: args
              }, args[0]) : {
                detail: args
              }));
            };
            instance.emit = (event, ...args) => {
              dispatch(event, args);
              if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.hyphenate)(event) !== event) {
                dispatch((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.hyphenate)(event), args);
              }
            };
            this._setParent();
          };
        }
        return vnode;
      }
      _applyStyles(styles, owner, parentComp) {
        if (!styles) return;
        if (owner) {
          if (owner === this._def || this._styleChildren.has(owner)) {
            return;
          }
          this._styleChildren.add(owner);
        }
        const nonce = this._nonce;
        const root = this.shadowRoot;
        const insertionAnchor = parentComp ? this._getStyleAnchor(parentComp) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(root);
        let last = null;
        for (let i = styles.length - 1; i >= 0; i--) {
          const s = document.createElement("style");
          if (nonce) s.setAttribute("nonce", nonce);
          s.textContent = styles[i];
          root.insertBefore(s, last || insertionAnchor);
          last = s;
          if (i === 0) {
            if (!parentComp) this._styleAnchors.set(this._def, s);
            if (owner) this._styleAnchors.set(owner, s);
          }
          if (true) {
            if (owner) {
              if (owner.__hmrId) {
                if (!this._childStyles) this._childStyles = new Map;
                let entry = this._childStyles.get(owner.__hmrId);
                if (!entry) {
                  this._childStyles.set(owner.__hmrId, entry = []);
                }
                entry.push(s);
              }
            } else {
              (this._styles || (this._styles = [])).push(s);
            }
          }
        }
      }
      _getStyleAnchor(comp) {
        if (!comp) {
          return null;
        }
        const anchor = this._styleAnchors.get(comp);
        if (anchor && anchor.parentNode === this.shadowRoot) {
          return anchor;
        }
        if (anchor) {
          this._styleAnchors.delete(comp);
        }
        return null;
      }
      _getRootStyleInsertionAnchor(root) {
        for (let i = 0; i < root.childNodes.length; i++) {
          const node = root.childNodes[i];
          if (!(node instanceof HTMLStyleElement)) {
            return node;
          }
        }
        return null;
      }
      _parseSlots() {
        const slots = this._slots = {};
        let n;
        while (n = this.firstChild) {
          const slotName = n.nodeType === 1 && n.getAttribute("slot") || "default";
          (slots[slotName] || (slots[slotName] = [])).push(n);
          this.removeChild(n);
        }
      }
      _renderSlots() {
        const outlets = this._getSlots();
        const scopeId = this._instance.type.__scopeId;
        for (let i = 0; i < outlets.length; i++) {
          const o = outlets[i];
          const slotName = o.getAttribute("name") || "default";
          const content = this._slots[slotName];
          const parent = o.parentNode;
          if (content) {
            for (const n of content) {
              if (scopeId && n.nodeType === 1) {
                const id = scopeId + "-s";
                const walker = document.createTreeWalker(n, 1);
                n.setAttribute(id, "");
                let child;
                while (child = walker.nextNode()) {
                  child.setAttribute(id, "");
                }
              }
              parent.insertBefore(n, o);
            }
          } else {
            while (o.firstChild) parent.insertBefore(o.firstChild, o);
          }
          parent.removeChild(o);
        }
      }
      _getSlots() {
        const roots = [ this ];
        if (this._teleportTargets) {
          roots.push(...this._teleportTargets);
        }
        const slots = new Set;
        for (const root of roots) {
          const found = root.querySelectorAll("slot");
          for (let i = 0; i < found.length; i++) {
            slots.add(found[i]);
          }
        }
        return Array.from(slots);
      }
      _injectChildStyle(comp, parentComp) {
        this._applyStyles(comp.styles, comp, parentComp);
      }
      _beginPatch() {
        this._patching = true;
        this._dirty = false;
      }
      _endPatch() {
        this._patching = false;
        if (this._dirty && this._instance) {
          this._update();
        }
      }
      _hasShadowRoot() {
        return this._def.shadowRoot !== false;
      }
      _removeChildStyle(comp) {
        if (true) {
          this._styleChildren.delete(comp);
          this._styleAnchors.delete(comp);
          if (this._childStyles && comp.__hmrId) {
            const oldStyles = this._childStyles.get(comp.__hmrId);
            if (oldStyles) {
              oldStyles.forEach(s => this._root.removeChild(s));
              oldStyles.length = 0;
            }
          }
        }
      }
    }
    function useHost(caller) {
      const instance = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.getCurrentInstance)();
      const el = instance && instance.ce;
      if (el) {
        return el;
      } else if (true) {
        if (!instance) {
          (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`${caller || "useHost"} called without an active component instance.`);
        } else {
          (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`${caller || "useHost"} can only be used in components defined via defineCustomElement.`);
        }
      }
      return null;
    }
    function useShadowRoot() {
      const el = true ? useHost("useShadowRoot") : 0;
      return el && el.shadowRoot;
    }
    function useCssModule(name = "$style") {
      {
        const instance = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.getCurrentInstance)();
        if (!instance) {
          true && (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`useCssModule must be called inside setup()`);
          return _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.EMPTY_OBJ;
        }
        const modules = instance.type.__cssModules;
        if (!modules) {
          true && (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`Current instance does not have CSS modules injected.`);
          return _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.EMPTY_OBJ;
        }
        const mod = modules[name];
        if (!mod) {
          true && (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`Current instance does not have CSS module named "${name}".`);
          return _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.EMPTY_OBJ;
        }
        return mod;
      }
    }
    const positionMap = new WeakMap;
    const newPositionMap = new WeakMap;
    const moveCbKey = Symbol("_moveCb");
    const enterCbKey = Symbol("_enterCb");
    const decorate = t => {
      delete t.props.mode;
      return t;
    };
    const TransitionGroupImpl = decorate({
      name: "TransitionGroup",
      props: (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.extend)({}, TransitionPropsValidators, {
        tag: String,
        moveClass: String
      }),
      setup(props, {slots}) {
        const instance = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.getCurrentInstance)();
        const state = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.useTransitionState)();
        let prevChildren;
        let children;
        (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.onUpdated)(() => {
          if (!prevChildren.length) {
            return;
          }
          const moveClass = props.moveClass || `${props.name || "v"}-move`;
          if (!hasCSSTransform(prevChildren[0].el, instance.vnode.el, moveClass)) {
            prevChildren = [];
            return;
          }
          prevChildren.forEach(callPendingCbs);
          prevChildren.forEach(recordPosition);
          const movedChildren = prevChildren.filter(applyTranslation);
          forceReflow(instance.vnode.el);
          movedChildren.forEach(c => {
            const el = c.el;
            const style = el.style;
            addTransitionClass(el, moveClass);
            style.transform = style.webkitTransform = style.transitionDuration = "";
            const cb = el[moveCbKey] = e => {
              if (e && e.target !== el) {
                return;
              }
              if (!e || e.propertyName.endsWith("transform")) {
                el.removeEventListener("transitionend", cb);
                el[moveCbKey] = null;
                removeTransitionClass(el, moveClass);
              }
            };
            el.addEventListener("transitionend", cb);
          });
          prevChildren = [];
        });
        return () => {
          const rawProps = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_1__.toRaw)(props);
          const cssTransitionProps = resolveTransitionProps(rawProps);
          let tag = rawProps.tag || _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.Fragment;
          prevChildren = [];
          if (children) {
            for (let i = 0; i < children.length; i++) {
              const child = children[i];
              if (child.el && child.el instanceof Element) {
                prevChildren.push(child);
                (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.setTransitionHooks)(child, (0, 
                _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.resolveTransitionHooks)(child, cssTransitionProps, state, instance));
                positionMap.set(child, getPosition(child.el));
              }
            }
          }
          children = slots.default ? (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.getTransitionRawChildren)(slots.default()) : [];
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.key != null) {
              (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.setTransitionHooks)(child, (0, 
              _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.resolveTransitionHooks)(child, cssTransitionProps, state, instance));
            } else if (true && child.type !== _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.Text) {
              (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`<TransitionGroup> children must be keyed.`);
            }
          }
          return (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createVNode)(tag, null, children);
        };
      }
    });
    const TransitionGroup = TransitionGroupImpl;
    function callPendingCbs(c) {
      const el = c.el;
      if (el[moveCbKey]) {
        el[moveCbKey]();
      }
      if (el[enterCbKey]) {
        el[enterCbKey]();
      }
    }
    function recordPosition(c) {
      newPositionMap.set(c, getPosition(c.el));
    }
    function applyTranslation(c) {
      const oldPos = positionMap.get(c);
      const newPos = newPositionMap.get(c);
      const dx = oldPos.left - newPos.left;
      const dy = oldPos.top - newPos.top;
      if (dx || dy) {
        const el = c.el;
        const s = el.style;
        const rect = el.getBoundingClientRect();
        let scaleX = 1;
        let scaleY = 1;
        if (el.offsetWidth) scaleX = rect.width / el.offsetWidth;
        if (el.offsetHeight) scaleY = rect.height / el.offsetHeight;
        if (!Number.isFinite(scaleX) || scaleX === 0) scaleX = 1;
        if (!Number.isFinite(scaleY) || scaleY === 0) scaleY = 1;
        if (Math.abs(scaleX - 1) < .01) scaleX = 1;
        if (Math.abs(scaleY - 1) < .01) scaleY = 1;
        s.transform = s.webkitTransform = `translate(${dx / scaleX}px,${dy / scaleY}px)`;
        s.transitionDuration = "0s";
        return c;
      }
    }
    function getPosition(el) {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top
      };
    }
    function hasCSSTransform(el, root, moveClass) {
      const clone = el.cloneNode();
      const _vtc = el[vtcKey];
      if (_vtc) {
        _vtc.forEach(cls => {
          cls.split(/\s+/).forEach(c => c && clone.classList.remove(c));
        });
      }
      moveClass.split(/\s+/).forEach(c => c && clone.classList.add(c));
      clone.style.display = "none";
      const container = root.nodeType === 1 ? root : root.parentNode;
      container.appendChild(clone);
      const {hasTransform} = getTransitionInfo(clone);
      container.removeChild(clone);
      return hasTransform;
    }
    const getModelAssigner = vnode => {
      const fn = vnode.props["onUpdate:modelValue"] || false;
      return (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(fn) ? value => (0, 
      _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.invokeArrayFns)(fn, value) : fn;
    };
    function onCompositionStart(e) {
      e.target.composing = true;
    }
    function onCompositionEnd(e) {
      const target = e.target;
      if (target.composing) {
        target.composing = false;
        target.dispatchEvent(new Event("input"));
      }
    }
    const assignKey = Symbol("_assign");
    function castValue(value, trim, number) {
      if (trim) value = value.trim();
      if (number) value = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseToNumber)(value);
      return value;
    }
    const vModelText = {
      created(el, {modifiers: {lazy, trim, number}}, vnode) {
        el[assignKey] = getModelAssigner(vnode);
        const castToNumber = number || vnode.props && vnode.props.type === "number";
        addEventListener(el, lazy ? "change" : "input", e => {
          if (e.target.composing) return;
          el[assignKey](castValue(el.value, trim, castToNumber));
        });
        if (trim || castToNumber) {
          addEventListener(el, "change", () => {
            el.value = castValue(el.value, trim, castToNumber);
          });
        }
        if (!lazy) {
          addEventListener(el, "compositionstart", onCompositionStart);
          addEventListener(el, "compositionend", onCompositionEnd);
          addEventListener(el, "change", onCompositionEnd);
        }
      },
      mounted(el, {value}) {
        el.value = value == null ? "" : value;
      },
      beforeUpdate(el, {value, oldValue, modifiers: {lazy, trim, number}}, vnode) {
        el[assignKey] = getModelAssigner(vnode);
        if (el.composing) return;
        const elValue = (number || el.type === "number") && !/^0\d/.test(el.value) ? (0, 
        _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseToNumber)(el.value) : el.value;
        const newValue = value == null ? "" : value;
        if (elValue === newValue) {
          return;
        }
        const rootNode = el.getRootNode();
        if ((rootNode instanceof Document || rootNode instanceof ShadowRoot) && rootNode.activeElement === el && el.type !== "range") {
          if (lazy && value === oldValue) {
            return;
          }
          if (trim && el.value.trim() === newValue) {
            return;
          }
        }
        el.value = newValue;
      }
    };
    const vModelCheckbox = {
      deep: true,
      created(el, _, vnode) {
        el[assignKey] = getModelAssigner(vnode);
        addEventListener(el, "change", () => {
          const modelValue = el._modelValue;
          const elementValue = getValue(el);
          const checked = el.checked;
          const assign = el[assignKey];
          if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(modelValue)) {
            const index = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseIndexOf)(modelValue, elementValue);
            const found = index !== -1;
            if (checked && !found) {
              assign(modelValue.concat(elementValue));
            } else if (!checked && found) {
              const filtered = [ ...modelValue ];
              filtered.splice(index, 1);
              assign(filtered);
            }
          } else if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isSet)(modelValue)) {
            const cloned = new Set(modelValue);
            if (checked) {
              cloned.add(elementValue);
            } else {
              cloned.delete(elementValue);
            }
            assign(cloned);
          } else {
            assign(getCheckboxValue(el, checked));
          }
        });
      },
      mounted: setChecked,
      beforeUpdate(el, binding, vnode) {
        el[assignKey] = getModelAssigner(vnode);
        setChecked(el, binding, vnode);
      }
    };
    function setChecked(el, {value, oldValue}, vnode) {
      el._modelValue = value;
      let checked;
      if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(value)) {
        checked = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseIndexOf)(value, vnode.props.value) > -1;
      } else if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isSet)(value)) {
        checked = value.has(vnode.props.value);
      } else {
        if (value === oldValue) return;
        checked = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseEqual)(value, getCheckboxValue(el, true));
      }
      if (el.checked !== checked) {
        el.checked = checked;
      }
    }
    const vModelRadio = {
      created(el, {value}, vnode) {
        el.checked = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseEqual)(value, vnode.props.value);
        el[assignKey] = getModelAssigner(vnode);
        addEventListener(el, "change", () => {
          el[assignKey](getValue(el));
        });
      },
      beforeUpdate(el, {value, oldValue}, vnode) {
        el[assignKey] = getModelAssigner(vnode);
        if (value !== oldValue) {
          el.checked = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseEqual)(value, vnode.props.value);
        }
      }
    };
    const vModelSelect = {
      deep: true,
      created(el, {value, modifiers: {number}}, vnode) {
        const isSetModel = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isSet)(value);
        addEventListener(el, "change", () => {
          const selectedVal = Array.prototype.filter.call(el.options, o => o.selected).map(o => number ? (0, 
          _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseToNumber)(getValue(o)) : getValue(o));
          el[assignKey](el.multiple ? isSetModel ? new Set(selectedVal) : selectedVal : selectedVal[0]);
          el._assigning = true;
          (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.nextTick)(() => {
            el._assigning = false;
          });
        });
        el[assignKey] = getModelAssigner(vnode);
      },
      mounted(el, {value}) {
        setSelected(el, value);
      },
      beforeUpdate(el, _binding, vnode) {
        el[assignKey] = getModelAssigner(vnode);
      },
      updated(el, {value}) {
        if (!el._assigning) {
          setSelected(el, value);
        }
      }
    };
    function setSelected(el, value) {
      const isMultiple = el.multiple;
      const isArrayValue = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(value);
      if (isMultiple && !isArrayValue && !(0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isSet)(value)) {
        true && (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`<select multiple v-model> expects an Array or Set value for its binding, but got ${Object.prototype.toString.call(value).slice(8, -1)}.`);
        return;
      }
      for (let i = 0, l = el.options.length; i < l; i++) {
        const option = el.options[i];
        const optionValue = getValue(option);
        if (isMultiple) {
          if (isArrayValue) {
            const optionType = typeof optionValue;
            if (optionType === "string" || optionType === "number") {
              option.selected = value.some(v => String(v) === String(optionValue));
            } else {
              option.selected = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseIndexOf)(value, optionValue) > -1;
            }
          } else {
            option.selected = value.has(optionValue);
          }
        } else if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseEqual)(getValue(option), value)) {
          if (el.selectedIndex !== i) el.selectedIndex = i;
          return;
        }
      }
      if (!isMultiple && el.selectedIndex !== -1) {
        el.selectedIndex = -1;
      }
    }
    function getValue(el) {
      return "_value" in el ? el._value : el.value;
    }
    function getCheckboxValue(el, checked) {
      const key = checked ? "_trueValue" : "_falseValue";
      return key in el ? el[key] : checked;
    }
    const vModelDynamic = {
      created(el, binding, vnode) {
        callModelHook(el, binding, vnode, null, "created");
      },
      mounted(el, binding, vnode) {
        callModelHook(el, binding, vnode, null, "mounted");
      },
      beforeUpdate(el, binding, vnode, prevVNode) {
        callModelHook(el, binding, vnode, prevVNode, "beforeUpdate");
      },
      updated(el, binding, vnode, prevVNode) {
        callModelHook(el, binding, vnode, prevVNode, "updated");
      }
    };
    function resolveDynamicModel(tagName, type) {
      switch (tagName) {
       case "SELECT":
        return vModelSelect;

       case "TEXTAREA":
        return vModelText;

       default:
        switch (type) {
         case "checkbox":
          return vModelCheckbox;

         case "radio":
          return vModelRadio;

         default:
          return vModelText;
        }
      }
    }
    function callModelHook(el, binding, vnode, prevVNode, hook) {
      const modelToUse = resolveDynamicModel(el.tagName, vnode.props && vnode.props.type);
      const fn = modelToUse[hook];
      fn && fn(el, binding, vnode, prevVNode);
    }
    function initVModelForSSR() {
      vModelText.getSSRProps = ({value}) => ({
        value
      });
      vModelRadio.getSSRProps = ({value}, vnode) => {
        if (vnode.props && (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseEqual)(vnode.props.value, value)) {
          return {
            checked: true
          };
        }
      };
      vModelCheckbox.getSSRProps = ({value}, vnode) => {
        if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isArray)(value)) {
          if (vnode.props && (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.looseIndexOf)(value, vnode.props.value) > -1) {
            return {
              checked: true
            };
          }
        } else if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isSet)(value)) {
          if (vnode.props && value.has(vnode.props.value)) {
            return {
              checked: true
            };
          }
        } else if (value) {
          return {
            checked: true
          };
        }
      };
      vModelDynamic.getSSRProps = (binding, vnode) => {
        if (typeof vnode.type !== "string") {
          return;
        }
        const modelToUse = resolveDynamicModel(vnode.type.toUpperCase(), vnode.props && vnode.props.type);
        if (modelToUse.getSSRProps) {
          return modelToUse.getSSRProps(binding, vnode);
        }
      };
    }
    const systemModifiers = [ "ctrl", "shift", "alt", "meta" ];
    const modifierGuards = {
      stop: e => e.stopPropagation(),
      prevent: e => e.preventDefault(),
      self: e => e.target !== e.currentTarget,
      ctrl: e => !e.ctrlKey,
      shift: e => !e.shiftKey,
      alt: e => !e.altKey,
      meta: e => !e.metaKey,
      left: e => "button" in e && e.button !== 0,
      middle: e => "button" in e && e.button !== 1,
      right: e => "button" in e && e.button !== 2,
      exact: (e, modifiers) => systemModifiers.some(m => e[`${m}Key`] && !modifiers.includes(m))
    };
    const withModifiers = (fn, modifiers) => {
      if (!fn) return fn;
      const cache = fn._withMods || (fn._withMods = {});
      const cacheKey = modifiers.join(".");
      return cache[cacheKey] || (cache[cacheKey] = (event, ...args) => {
        for (let i = 0; i < modifiers.length; i++) {
          const guard = modifierGuards[modifiers[i]];
          if (guard && guard(event, modifiers)) return;
        }
        return fn(event, ...args);
      });
    };
    const keyNames = {
      esc: "escape",
      space: " ",
      up: "arrow-up",
      left: "arrow-left",
      right: "arrow-right",
      down: "arrow-down",
      delete: "backspace"
    };
    const withKeys = (fn, modifiers) => {
      const cache = fn._withKeys || (fn._withKeys = {});
      const cacheKey = modifiers.join(".");
      return cache[cacheKey] || (cache[cacheKey] = event => {
        if (!("key" in event)) {
          return;
        }
        const eventKey = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.hyphenate)(event.key);
        if (modifiers.some(k => k === eventKey || keyNames[k] === eventKey)) {
          return fn(event);
        }
      });
    };
    const rendererOptions = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.extend)({
      patchProp
    }, nodeOps);
    let renderer;
    let enabledHydration = false;
    function ensureRenderer() {
      return renderer || (renderer = (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createRenderer)(rendererOptions));
    }
    function ensureHydrationRenderer() {
      renderer = enabledHydration ? renderer : (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.createHydrationRenderer)(rendererOptions);
      enabledHydration = true;
      return renderer;
    }
    const render = (...args) => {
      ensureRenderer().render(...args);
    };
    const hydrate = (...args) => {
      ensureHydrationRenderer().hydrate(...args);
    };
    const createApp = (...args) => {
      const app = ensureRenderer().createApp(...args);
      if (true) {
        injectNativeTagCheck(app);
        injectCompilerOptionsCheck(app);
      }
      const {mount} = app;
      app.mount = containerOrSelector => {
        const container = normalizeContainer(containerOrSelector);
        if (!container) return;
        const component = app._component;
        if (!(0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isFunction)(component) && !component.render && !component.template) {
          component.template = container.innerHTML;
        }
        if (container.nodeType === 1) {
          container.textContent = "";
        }
        const proxy = mount(container, false, resolveRootNamespace(container));
        if (container instanceof Element) {
          container.removeAttribute("v-cloak");
          container.setAttribute("data-v-app", "");
        }
        return proxy;
      };
      return app;
    };
    const createSSRApp = (...args) => {
      const app = ensureHydrationRenderer().createApp(...args);
      if (true) {
        injectNativeTagCheck(app);
        injectCompilerOptionsCheck(app);
      }
      const {mount} = app;
      app.mount = containerOrSelector => {
        const container = normalizeContainer(containerOrSelector);
        if (container) {
          return mount(container, true, resolveRootNamespace(container));
        }
      };
      return app;
    };
    function resolveRootNamespace(container) {
      if (container instanceof SVGElement) {
        return "svg";
      }
      if (typeof MathMLElement === "function" && container instanceof MathMLElement) {
        return "mathml";
      }
    }
    function injectNativeTagCheck(app) {
      Object.defineProperty(app.config, "isNativeTag", {
        value: tag => (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isHTMLTag)(tag) || (0, 
        _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isSVGTag)(tag) || (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isMathMLTag)(tag),
        writable: false
      });
    }
    function injectCompilerOptionsCheck(app) {
      if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.isRuntimeOnly)()) {
        const isCustomElement = app.config.isCustomElement;
        Object.defineProperty(app.config, "isCustomElement", {
          get() {
            return isCustomElement;
          },
          set() {
            (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`The \`isCustomElement\` config option is deprecated. Use \`compilerOptions.isCustomElement\` instead.`);
          }
        });
        const compilerOptions = app.config.compilerOptions;
        const msg = `The \`compilerOptions\` config option is only respected when using a build of Vue.js that includes the runtime compiler (aka "full build"). Since you are using the runtime-only build, \`compilerOptions\` must be passed to \`@vue/compiler-dom\` in the build setup instead.\n- For vue-loader: pass it via vue-loader's \`compilerOptions\` loader option.\n- For vue-cli: see https://cli.vuejs.org/guide/webpack.html#modifying-options-of-a-loader\n- For vite: pass it via @vitejs/plugin-vue options. See https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue#example-for-passing-options-to-vuecompiler-sfc`;
        Object.defineProperty(app.config, "compilerOptions", {
          get() {
            (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(msg);
            return compilerOptions;
          },
          set() {
            (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(msg);
          }
        });
      }
    }
    function normalizeContainer(container) {
      if ((0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_2__.isString)(container)) {
        const res = document.querySelector(container);
        if (true && !res) {
          (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`Failed to mount app: mount target selector "${container}" returned null.`);
        }
        return res;
      }
      if (true && window.ShadowRoot && container instanceof window.ShadowRoot && container.mode === "closed") {
        (0, _vue_runtime_core__WEBPACK_IMPORTED_MODULE_0__.warn)(`mounting on a ShadowRoot with \`{mode: "closed"}\` may lead to unpredictable bugs`);
      }
      return container;
    }
    let ssrDirectiveInitialized = false;
    const initDirectivesForSSR = () => {
      if (!ssrDirectiveInitialized) {
        ssrDirectiveInitialized = true;
        initVModelForSSR();
        initVShowForSSR();
      }
    };
  },
  "./node_modules/.pnpm/@vue+shared@3.5.35/node_modules/@vue/shared/dist/shared.esm-bundler.js"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      EMPTY_ARR: () => EMPTY_ARR,
      EMPTY_OBJ: () => EMPTY_OBJ,
      NO: () => NO,
      NOOP: () => NOOP,
      PatchFlagNames: () => PatchFlagNames,
      PatchFlags: () => PatchFlags,
      ShapeFlags: () => ShapeFlags,
      SlotFlags: () => SlotFlags,
      camelize: () => camelize,
      capitalize: () => capitalize,
      cssVarNameEscapeSymbolsRE: () => cssVarNameEscapeSymbolsRE,
      def: () => def,
      escapeHtml: () => escapeHtml,
      escapeHtmlComment: () => escapeHtmlComment,
      extend: () => extend,
      genCacheKey: () => genCacheKey,
      genPropsAccessExp: () => genPropsAccessExp,
      generateCodeFrame: () => generateCodeFrame,
      getEscapedCssVarName: () => getEscapedCssVarName,
      getGlobalThis: () => getGlobalThis,
      hasChanged: () => hasChanged,
      hasOwn: () => hasOwn,
      hyphenate: () => hyphenate,
      includeBooleanAttr: () => includeBooleanAttr,
      invokeArrayFns: () => invokeArrayFns,
      isArray: () => isArray,
      isBooleanAttr: () => isBooleanAttr,
      isBuiltInDirective: () => isBuiltInDirective,
      isDate: () => isDate,
      isFunction: () => isFunction,
      isGloballyAllowed: () => isGloballyAllowed,
      isGloballyWhitelisted: () => isGloballyWhitelisted,
      isHTMLTag: () => isHTMLTag,
      isIntegerKey: () => isIntegerKey,
      isKnownHtmlAttr: () => isKnownHtmlAttr,
      isKnownMathMLAttr: () => isKnownMathMLAttr,
      isKnownSvgAttr: () => isKnownSvgAttr,
      isMap: () => isMap,
      isMathMLTag: () => isMathMLTag,
      isModelListener: () => isModelListener,
      isObject: () => isObject,
      isOn: () => isOn,
      isPlainObject: () => isPlainObject,
      isPromise: () => isPromise,
      isRegExp: () => isRegExp,
      isRenderableAttrValue: () => isRenderableAttrValue,
      isReservedProp: () => isReservedProp,
      isSSRSafeAttrName: () => isSSRSafeAttrName,
      isSVGTag: () => isSVGTag,
      isSet: () => isSet,
      isSpecialBooleanAttr: () => isSpecialBooleanAttr,
      isString: () => isString,
      isSymbol: () => isSymbol,
      isVoidTag: () => isVoidTag,
      looseEqual: () => looseEqual,
      looseIndexOf: () => looseIndexOf,
      looseToNumber: () => looseToNumber,
      makeMap: () => makeMap,
      normalizeClass: () => normalizeClass,
      normalizeCssVarValue: () => normalizeCssVarValue,
      normalizeProps: () => normalizeProps,
      normalizeStyle: () => normalizeStyle,
      objectToString: () => objectToString,
      parseStringStyle: () => parseStringStyle,
      propsToAttrMap: () => propsToAttrMap,
      remove: () => remove,
      slotFlagsText: () => slotFlagsText,
      stringifyStyle: () => stringifyStyle,
      toDisplayString: () => toDisplayString,
      toHandlerKey: () => toHandlerKey,
      toNumber: () => toNumber,
      toRawType: () => toRawType,
      toTypeString: () => toTypeString
    });
    /**
* @vue/shared v3.5.35
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/    function makeMap(str) {
      const map = Object.create(null);
      for (const key of str.split(",")) map[key] = 1;
      return val => val in map;
    }
    const EMPTY_OBJ = true ? Object.freeze({}) : 0;
    const EMPTY_ARR = true ? Object.freeze([]) : 0;
    const NOOP = () => {};
    const NO = () => false;
    const isOn = key => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
    const isModelListener = key => key.startsWith("onUpdate:");
    const extend = Object.assign;
    const remove = (arr, el) => {
      const i = arr.indexOf(el);
      if (i > -1) {
        arr.splice(i, 1);
      }
    };
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const hasOwn = (val, key) => hasOwnProperty.call(val, key);
    const isArray = Array.isArray;
    const isMap = val => toTypeString(val) === "[object Map]";
    const isSet = val => toTypeString(val) === "[object Set]";
    const isDate = val => toTypeString(val) === "[object Date]";
    const isRegExp = val => toTypeString(val) === "[object RegExp]";
    const isFunction = val => typeof val === "function";
    const isString = val => typeof val === "string";
    const isSymbol = val => typeof val === "symbol";
    const isObject = val => val !== null && typeof val === "object";
    const isPromise = val => (isObject(val) || isFunction(val)) && isFunction(val.then) && isFunction(val.catch);
    const objectToString = Object.prototype.toString;
    const toTypeString = value => objectToString.call(value);
    const toRawType = value => toTypeString(value).slice(8, -1);
    const isPlainObject = val => toTypeString(val) === "[object Object]";
    const isIntegerKey = key => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
    const isReservedProp = makeMap(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted");
    const isBuiltInDirective = makeMap("bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo");
    const cacheStringFunction = fn => {
      const cache = Object.create(null);
      return str => {
        const hit = cache[str];
        return hit || (cache[str] = fn(str));
      };
    };
    const camelizeRE = /-\w/g;
    const camelize = cacheStringFunction(str => str.replace(camelizeRE, c => c.slice(1).toUpperCase()));
    const hyphenateRE = /\B([A-Z])/g;
    const hyphenate = cacheStringFunction(str => str.replace(hyphenateRE, "-$1").toLowerCase());
    const capitalize = cacheStringFunction(str => str.charAt(0).toUpperCase() + str.slice(1));
    const toHandlerKey = cacheStringFunction(str => {
      const s = str ? `on${capitalize(str)}` : ``;
      return s;
    });
    const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
    const invokeArrayFns = (fns, ...arg) => {
      for (let i = 0; i < fns.length; i++) {
        fns[i](...arg);
      }
    };
    const def = (obj, key, value, writable = false) => {
      Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: false,
        writable,
        value
      });
    };
    const looseToNumber = val => {
      const n = parseFloat(val);
      return isNaN(n) ? val : n;
    };
    const toNumber = val => {
      const n = isString(val) ? Number(val) : NaN;
      return isNaN(n) ? val : n;
    };
    let _globalThis;
    const getGlobalThis = () => _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : {});
    const identRE = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/;
    function genPropsAccessExp(name) {
      return identRE.test(name) ? `__props.${name}` : `__props[${JSON.stringify(name)}]`;
    }
    function genCacheKey(source, options) {
      return source + JSON.stringify(options, (_, val) => typeof val === "function" ? val.toString() : val);
    }
    const PatchFlags = {
      TEXT: 1,
      1: "TEXT",
      CLASS: 2,
      2: "CLASS",
      STYLE: 4,
      4: "STYLE",
      PROPS: 8,
      8: "PROPS",
      FULL_PROPS: 16,
      16: "FULL_PROPS",
      NEED_HYDRATION: 32,
      32: "NEED_HYDRATION",
      STABLE_FRAGMENT: 64,
      64: "STABLE_FRAGMENT",
      KEYED_FRAGMENT: 128,
      128: "KEYED_FRAGMENT",
      UNKEYED_FRAGMENT: 256,
      256: "UNKEYED_FRAGMENT",
      NEED_PATCH: 512,
      512: "NEED_PATCH",
      DYNAMIC_SLOTS: 1024,
      1024: "DYNAMIC_SLOTS",
      DEV_ROOT_FRAGMENT: 2048,
      2048: "DEV_ROOT_FRAGMENT",
      CACHED: -1,
      "-1": "CACHED",
      BAIL: -2,
      "-2": "BAIL"
    };
    const PatchFlagNames = {
      [1]: `TEXT`,
      [2]: `CLASS`,
      [4]: `STYLE`,
      [8]: `PROPS`,
      [16]: `FULL_PROPS`,
      [32]: `NEED_HYDRATION`,
      [64]: `STABLE_FRAGMENT`,
      [128]: `KEYED_FRAGMENT`,
      [256]: `UNKEYED_FRAGMENT`,
      [512]: `NEED_PATCH`,
      [1024]: `DYNAMIC_SLOTS`,
      [2048]: `DEV_ROOT_FRAGMENT`,
      [-1]: `CACHED`,
      [-2]: `BAIL`
    };
    const ShapeFlags = {
      ELEMENT: 1,
      1: "ELEMENT",
      FUNCTIONAL_COMPONENT: 2,
      2: "FUNCTIONAL_COMPONENT",
      STATEFUL_COMPONENT: 4,
      4: "STATEFUL_COMPONENT",
      TEXT_CHILDREN: 8,
      8: "TEXT_CHILDREN",
      ARRAY_CHILDREN: 16,
      16: "ARRAY_CHILDREN",
      SLOTS_CHILDREN: 32,
      32: "SLOTS_CHILDREN",
      TELEPORT: 64,
      64: "TELEPORT",
      SUSPENSE: 128,
      128: "SUSPENSE",
      COMPONENT_SHOULD_KEEP_ALIVE: 256,
      256: "COMPONENT_SHOULD_KEEP_ALIVE",
      COMPONENT_KEPT_ALIVE: 512,
      512: "COMPONENT_KEPT_ALIVE",
      COMPONENT: 6,
      6: "COMPONENT"
    };
    const SlotFlags = {
      STABLE: 1,
      1: "STABLE",
      DYNAMIC: 2,
      2: "DYNAMIC",
      FORWARDED: 3,
      3: "FORWARDED"
    };
    const slotFlagsText = {
      [1]: "STABLE",
      [2]: "DYNAMIC",
      [3]: "FORWARDED"
    };
    const GLOBALS_ALLOWED = "Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt,console,Error,Symbol";
    const isGloballyAllowed = makeMap(GLOBALS_ALLOWED);
    const isGloballyWhitelisted = isGloballyAllowed;
    const range = 2;
    function generateCodeFrame(source, start = 0, end = source.length) {
      start = Math.max(0, Math.min(start, source.length));
      end = Math.max(0, Math.min(end, source.length));
      if (start > end) return "";
      let lines = source.split(/(\r?\n)/);
      const newlineSequences = lines.filter((_, idx) => idx % 2 === 1);
      lines = lines.filter((_, idx) => idx % 2 === 0);
      let count = 0;
      const res = [];
      for (let i = 0; i < lines.length; i++) {
        count += lines[i].length + (newlineSequences[i] && newlineSequences[i].length || 0);
        if (count >= start) {
          for (let j = i - range; j <= i + range || end > count; j++) {
            if (j < 0 || j >= lines.length) continue;
            const line = j + 1;
            res.push(`${line}${" ".repeat(Math.max(3 - String(line).length, 0))}|  ${lines[j]}`);
            const lineLength = lines[j].length;
            const newLineSeqLength = newlineSequences[j] && newlineSequences[j].length || 0;
            if (j === i) {
              const pad = start - (count - (lineLength + newLineSeqLength));
              const length = Math.max(1, end > count ? lineLength - pad : end - start);
              res.push(`   |  ` + " ".repeat(pad) + "^".repeat(length));
            } else if (j > i) {
              if (end > count) {
                const length = Math.max(Math.min(end - count, lineLength), 1);
                res.push(`   |  ` + "^".repeat(length));
              }
              count += lineLength + newLineSeqLength;
            }
          }
          break;
        }
      }
      return res.join("\n");
    }
    function normalizeStyle(value) {
      if (isArray(value)) {
        const res = {};
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
          if (normalized) {
            for (const key in normalized) {
              res[key] = normalized[key];
            }
          }
        }
        return res;
      } else if (isString(value) || isObject(value)) {
        return value;
      }
    }
    const listDelimiterRE = /;(?![^(]*\))/g;
    const propertyDelimiterRE = /:([^]+)/;
    const styleCommentRE = /\/\*[^]*?\*\//g;
    function parseStringStyle(cssText) {
      const ret = {};
      cssText.replace(styleCommentRE, "").split(listDelimiterRE).forEach(item => {
        if (item) {
          const tmp = item.split(propertyDelimiterRE);
          tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
        }
      });
      return ret;
    }
    function stringifyStyle(styles) {
      if (!styles) return "";
      if (isString(styles)) return styles;
      let ret = "";
      for (const key in styles) {
        const value = styles[key];
        if (isString(value) || typeof value === "number") {
          const normalizedKey = key.startsWith(`--`) ? key : hyphenate(key);
          ret += `${normalizedKey}:${value};`;
        }
      }
      return ret;
    }
    function normalizeClass(value) {
      let res = "";
      if (isString(value)) {
        res = value;
      } else if (isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const normalized = normalizeClass(value[i]);
          if (normalized) {
            res += normalized + " ";
          }
        }
      } else if (isObject(value)) {
        for (const name in value) {
          if (value[name]) {
            res += name + " ";
          }
        }
      }
      return res.trim();
    }
    function normalizeProps(props) {
      if (!props) return null;
      let {class: klass, style} = props;
      if (klass && !isString(klass)) {
        props.class = normalizeClass(klass);
      }
      if (style) {
        props.style = normalizeStyle(style);
      }
      return props;
    }
    const HTML_TAGS = "html,body,base,head,link,meta,style,title,address,article,aside,footer,header,hgroup,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot";
    const SVG_TAGS = "svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view";
    const MATH_TAGS = "annotation,annotation-xml,maction,maligngroup,malignmark,math,menclose,merror,mfenced,mfrac,mfraction,mglyph,mi,mlabeledtr,mlongdiv,mmultiscripts,mn,mo,mover,mpadded,mphantom,mprescripts,mroot,mrow,ms,mscarries,mscarry,msgroup,msline,mspace,msqrt,msrow,mstack,mstyle,msub,msubsup,msup,mtable,mtd,mtext,mtr,munder,munderover,none,semantics";
    const VOID_TAGS = "area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr";
    const isHTMLTag = makeMap(HTML_TAGS);
    const isSVGTag = makeMap(SVG_TAGS);
    const isMathMLTag = makeMap(MATH_TAGS);
    const isVoidTag = makeMap(VOID_TAGS);
    const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
    const isSpecialBooleanAttr = makeMap(specialBooleanAttrs);
    const isBooleanAttr = makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,inert,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
    function includeBooleanAttr(value) {
      return !!value || value === "";
    }
    const unsafeAttrCharRE = /[>/="'\u0009\u000a\u000c\u0020]/;
    const attrValidationCache = {};
    function isSSRSafeAttrName(name) {
      if (attrValidationCache.hasOwnProperty(name)) {
        return attrValidationCache[name];
      }
      const isUnsafe = unsafeAttrCharRE.test(name);
      if (isUnsafe) {
        console.error(`unsafe attribute name: ${name}`);
      }
      return attrValidationCache[name] = !isUnsafe;
    }
    const propsToAttrMap = {
      acceptCharset: "accept-charset",
      className: "class",
      htmlFor: "for",
      httpEquiv: "http-equiv"
    };
    const isKnownHtmlAttr = makeMap(`accept,accept-charset,accesskey,action,align,allow,alt,async,autocapitalize,autocomplete,autofocus,autoplay,background,bgcolor,border,buffered,capture,challenge,charset,checked,cite,class,code,codebase,color,cols,colspan,content,contenteditable,contextmenu,controls,coords,crossorigin,csp,data,datetime,decoding,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,enterkeyhint,for,form,formaction,formenctype,formmethod,formnovalidate,formtarget,headers,height,hidden,high,href,hreflang,http-equiv,icon,id,importance,inert,integrity,ismap,itemprop,keytype,kind,label,lang,language,loading,list,loop,low,manifest,max,maxlength,minlength,media,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,referrerpolicy,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,selected,shape,size,sizes,slot,span,spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,target,title,translate,type,usemap,value,width,wrap`);
    const isKnownSvgAttr = makeMap(`xmlns,accent-height,accumulate,additive,alignment-baseline,alphabetic,amplitude,arabic-form,ascent,attributeName,attributeType,azimuth,baseFrequency,baseline-shift,baseProfile,bbox,begin,bias,by,calcMode,cap-height,class,clip,clipPathUnits,clip-path,clip-rule,color,color-interpolation,color-interpolation-filters,color-profile,color-rendering,contentScriptType,contentStyleType,crossorigin,cursor,cx,cy,d,decelerate,descent,diffuseConstant,direction,display,divisor,dominant-baseline,dur,dx,dy,edgeMode,elevation,enable-background,end,exponent,fill,fill-opacity,fill-rule,filter,filterRes,filterUnits,flood-color,flood-opacity,font-family,font-size,font-size-adjust,font-stretch,font-style,font-variant,font-weight,format,from,fr,fx,fy,g1,g2,glyph-name,glyph-orientation-horizontal,glyph-orientation-vertical,glyphRef,gradientTransform,gradientUnits,hanging,height,href,hreflang,horiz-adv-x,horiz-origin-x,id,ideographic,image-rendering,in,in2,intercept,k,k1,k2,k3,k4,kernelMatrix,kernelUnitLength,kerning,keyPoints,keySplines,keyTimes,lang,lengthAdjust,letter-spacing,lighting-color,limitingConeAngle,local,marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mask,maskContentUnits,maskUnits,mathematical,max,media,method,min,mode,name,numOctaves,offset,opacity,operator,order,orient,orientation,origin,overflow,overline-position,overline-thickness,panose-1,paint-order,path,pathLength,patternContentUnits,patternTransform,patternUnits,ping,pointer-events,points,pointsAtX,pointsAtY,pointsAtZ,preserveAlpha,preserveAspectRatio,primitiveUnits,r,radius,referrerPolicy,refX,refY,rel,rendering-intent,repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,result,rotate,rx,ry,scale,seed,shape-rendering,slope,spacing,specularConstant,specularExponent,speed,spreadMethod,startOffset,stdDeviation,stemh,stemv,stitchTiles,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,string,stroke,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke-width,style,surfaceScale,systemLanguage,tabindex,tableValues,target,targetX,targetY,text-anchor,text-decoration,text-rendering,textLength,to,transform,transform-origin,type,u1,u2,underline-position,underline-thickness,unicode,unicode-bidi,unicode-range,units-per-em,v-alphabetic,v-hanging,v-ideographic,v-mathematical,values,vector-effect,version,vert-adv-y,vert-origin-x,vert-origin-y,viewBox,viewTarget,visibility,width,widths,word-spacing,writing-mode,x,x-height,x1,x2,xChannelSelector,xlink:actuate,xlink:arcrole,xlink:href,xlink:role,xlink:show,xlink:title,xlink:type,xmlns:xlink,xml:base,xml:lang,xml:space,y,y1,y2,yChannelSelector,z,zoomAndPan`);
    const isKnownMathMLAttr = makeMap(`accent,accentunder,actiontype,align,alignmentscope,altimg,altimg-height,altimg-valign,altimg-width,alttext,bevelled,close,columnsalign,columnlines,columnspan,denomalign,depth,dir,display,displaystyle,encoding,equalcolumns,equalrows,fence,fontstyle,fontweight,form,frame,framespacing,groupalign,height,href,id,indentalign,indentalignfirst,indentalignlast,indentshift,indentshiftfirst,indentshiftlast,indextype,justify,largetop,largeop,lquote,lspace,mathbackground,mathcolor,mathsize,mathvariant,maxsize,minlabelspacing,mode,other,overflow,position,rowalign,rowlines,rowspan,rquote,rspace,scriptlevel,scriptminsize,scriptsizemultiplier,selection,separator,separators,shift,side,src,stackalign,stretchy,subscriptshift,superscriptshift,symmetric,voffset,width,widths,xlink:href,xlink:show,xlink:type,xmlns`);
    function isRenderableAttrValue(value) {
      if (value == null) {
        return false;
      }
      const type = typeof value;
      return type === "string" || type === "number" || type === "boolean";
    }
    const escapeRE = /["'&<>]/;
    function escapeHtml(string) {
      const str = "" + string;
      const match = escapeRE.exec(str);
      if (!match) {
        return str;
      }
      let html = "";
      let escaped;
      let index;
      let lastIndex = 0;
      for (index = match.index; index < str.length; index++) {
        switch (str.charCodeAt(index)) {
         case 34:
          escaped = "&quot;";
          break;

         case 38:
          escaped = "&amp;";
          break;

         case 39:
          escaped = "&#39;";
          break;

         case 60:
          escaped = "&lt;";
          break;

         case 62:
          escaped = "&gt;";
          break;

         default:
          continue;
        }
        if (lastIndex !== index) {
          html += str.slice(lastIndex, index);
        }
        lastIndex = index + 1;
        html += escaped;
      }
      return lastIndex !== index ? html + str.slice(lastIndex, index) : html;
    }
    const commentStripRE = /^-?>|<!--|-->|--!>|<!-$/g;
    function escapeHtmlComment(src) {
      return src.replace(commentStripRE, "");
    }
    const cssVarNameEscapeSymbolsRE = /[ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g;
    function getEscapedCssVarName(key, doubleEscape) {
      return key.replace(cssVarNameEscapeSymbolsRE, s => doubleEscape ? s === '"' ? '\\\\\\"' : `\\\\${s}` : `\\${s}`);
    }
    function looseCompareArrays(a, b) {
      if (a.length !== b.length) return false;
      let equal = true;
      for (let i = 0; equal && i < a.length; i++) {
        equal = looseEqual(a[i], b[i]);
      }
      return equal;
    }
    function looseEqual(a, b) {
      if (a === b) return true;
      let aValidType = isDate(a);
      let bValidType = isDate(b);
      if (aValidType || bValidType) {
        return aValidType && bValidType ? a.getTime() === b.getTime() : false;
      }
      aValidType = isSymbol(a);
      bValidType = isSymbol(b);
      if (aValidType || bValidType) {
        return a === b;
      }
      aValidType = isArray(a);
      bValidType = isArray(b);
      if (aValidType || bValidType) {
        return aValidType && bValidType ? looseCompareArrays(a, b) : false;
      }
      aValidType = isObject(a);
      bValidType = isObject(b);
      if (aValidType || bValidType) {
        if (!aValidType || !bValidType) {
          return false;
        }
        const aKeysCount = Object.keys(a).length;
        const bKeysCount = Object.keys(b).length;
        if (aKeysCount !== bKeysCount) {
          return false;
        }
        for (const key in a) {
          const aHasKey = a.hasOwnProperty(key);
          const bHasKey = b.hasOwnProperty(key);
          if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key])) {
            return false;
          }
        }
      }
      return String(a) === String(b);
    }
    function looseIndexOf(arr, val) {
      return arr.findIndex(item => looseEqual(item, val));
    }
    const isRef = val => !!(val && val["__v_isRef"] === true);
    const toDisplayString = val => isString(val) ? val : val == null ? "" : isArray(val) || isObject(val) && (val.toString === objectToString || !isFunction(val.toString)) ? isRef(val) ? toDisplayString(val.value) : JSON.stringify(val, replacer, 2) : String(val);
    const replacer = (_key, val) => {
      if (isRef(val)) {
        return replacer(_key, val.value);
      } else if (isMap(val)) {
        return {
          [`Map(${val.size})`]: [ ...val.entries() ].reduce((entries, [key, val2], i) => {
            entries[stringifySymbol(key, i) + " =>"] = val2;
            return entries;
          }, {})
        };
      } else if (isSet(val)) {
        return {
          [`Set(${val.size})`]: [ ...val.values() ].map(v => stringifySymbol(v))
        };
      } else if (isSymbol(val)) {
        return stringifySymbol(val);
      } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
        return String(val);
      }
      return val;
    };
    const stringifySymbol = (v, i = "") => {
      var _a;
      return isSymbol(v) ? `Symbol(${(_a = v.description) != null ? _a : i})` : v;
    };
    function normalizeCssVarValue(value) {
      if (value == null) {
        return "initial";
      }
      if (typeof value === "string") {
        return value === "" ? " " : value;
      }
      if (typeof value !== "number" || !Number.isFinite(value)) {
        if (true) {
          console.warn("[Vue warn] Invalid value used for CSS binding. Expected a string or a finite number but received:", value);
        }
      }
      return String(value);
    }
  },
  "./node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/cjs.js??clonedRuleSet-48.use[1]!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/stylePostLoader.js!./node_modules/.pnpm/postcss-loader@8.2.1_postcs_6cf2f04cb0b05bf1e03b98407ffe6d5b/node_modules/postcss-loader/dist/cjs.js!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./src/角色卡管理器/App.vue?vue&type=style&index=0&id=8f9db926&scoped=true&lang=css"(module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      default: () => __WEBPACK_DEFAULT_EXPORT__
    });
    var _node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/runtime/noSourceMaps.js */ "./node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/runtime/noSourceMaps.js");
    var _node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
    var _node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/runtime/api.js */ "./node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/runtime/api.js");
    var _node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = __webpack_require__.n(_node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
    var ___CSS_LOADER_EXPORT___ = _node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()(_node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default());
    ___CSS_LOADER_EXPORT___.push([ module.id, `.cm-shell[data-v-8f9db926]{--cm-bg:oklch(16% 0.012 248);--cm-panel:oklch(20% 0.012 248);--cm-panel-2:oklch(24% 0.014 248);--cm-control-bg:var(--cm-bg);--cm-card-bg:var(--cm-bg);--cm-border:oklch(34% 0.018 248);--cm-text:oklch(91% 0.01 248);--cm-muted:oklch(70% 0.018 248);--cm-weak:oklch(55% 0.018 248);--cm-accent:oklch(62% 0.16 250);--cm-accent-text:oklch(87% 0.06 250);--cm-accent-bg:oklch(24% 0.025 250);--cm-accent-contrast:oklch(18% 0.014 248);--cm-hover:oklch(92% 0.01 248/8%);--cm-toggle-color:oklch(78% 0.018 248/54%);--cm-toggle-hover:oklch(88% 0.025 248/82%);--cm-media-bg:oklch(13% 0.01 248);--cm-scrim:oklch(13% 0.012 248/84%);--cm-badge-bg:oklch(13% 0.012 248/82%);--cm-backdrop:oklch(8% 0.01 248/76%);--cm-primary-bg:oklch(28% 0.055 250);--cm-warning:oklch(76% 0.13 82);--cm-danger:oklch(65% 0.16 25);height:100vh;min-height:0;box-sizing:border-box;display:grid;grid-template-rows:auto minmax(0,1fr);padding:16px;overflow:hidden;background:var(--cm-bg);color:var(--cm-text);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px}.cm-header[data-v-8f9db926]{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 14px;border:1px solid var(--cm-border);border-radius:8px;background:var(--cm-panel)}.cm-header-actions[data-v-8f9db926]{display:flex;align-items:center;gap:8px}.cm-header h1[data-v-8f9db926],.cm-preview h2[data-v-8f9db926],.cm-section h3[data-v-8f9db926]{margin:0;letter-spacing:0}.cm-header h1[data-v-8f9db926]{font-size:18px;line-height:1.25}.cm-preview p[data-v-8f9db926],.cm-list-head>span[data-v-8f9db926]{color:var(--cm-muted)}.cm-icon-button[data-v-8f9db926]{width:34px;height:34px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-panel-2);color:var(--cm-text);cursor:pointer}.cm-header-primary[data-v-8f9db926]{height:34px;border:1px solid var(--cm-accent);border-radius:6px;background:var(--cm-primary-bg);color:var(--cm-text);padding:0 12px;cursor:pointer;font-weight:700}.cm-header-primary[aria-pressed='true'][data-v-8f9db926]{background:var(--cm-accent-bg);color:var(--cm-accent-text)}.cm-header-primary[data-v-8f9db926]:hover,.cm-header-primary[data-v-8f9db926]:focus-visible{background:var(--cm-accent-bg)}.cm-header-primary[data-v-8f9db926]:focus-visible{outline:1px solid var(--cm-accent);outline-offset:2px}.cm-icon-button[data-v-8f9db926]:disabled{cursor:wait;opacity:0.65}.cm-icon-button[aria-pressed='true'][data-v-8f9db926]{border-color:var(--cm-accent);color:var(--cm-accent-text)}.cm-icon-button.danger[data-v-8f9db926]{font-size:20px}.cm-workspace[data-v-8f9db926]{--cm-left-rail-width:240px;--cm-right-rail-width:360px;display:grid;position:relative;grid-template-columns:minmax(210px,240px) minmax(480px,1fr) minmax(300px,360px);gap:12px;margin-top:12px;height:calc(100% - 12px);min-height:0;align-items:stretch;overflow:hidden;transition:grid-template-columns 160ms ease}.cm-workspace.left-collapsed[data-v-8f9db926]{grid-template-columns:0 minmax(480px,1fr) minmax(300px,360px)}.cm-workspace.right-collapsed[data-v-8f9db926]{grid-template-columns:minmax(210px,240px) minmax(480px,1fr) 0}.cm-workspace.left-collapsed.right-collapsed[data-v-8f9db926]{grid-template-columns:0 minmax(480px,1fr) 0}.cm-panel-toggle[data-v-8f9db926]{position:absolute;top:50%;z-index:3;width:22px;height:72px;display:grid;place-items:center;border:0;border-radius:999px;background:transparent;color:var(--cm-toggle-color);cursor:pointer;opacity:0.58;transform:translateY(-50%);transition:opacity 140ms ease,background 140ms ease,color 140ms ease,left 160ms ease,right 160ms ease}.cm-panel-toggle[data-v-8f9db926]:hover,.cm-panel-toggle[data-v-8f9db926]:focus-visible{background:var(--cm-hover);color:var(--cm-toggle-hover);opacity:1}.cm-panel-toggle[data-v-8f9db926]:focus-visible{outline:1px solid var(--cm-accent);outline-offset:2px}.cm-panel-toggle[data-v-8f9db926]::before{content:'';width:0;height:0;border-top:9px solid transparent;border-bottom:9px solid transparent}.cm-panel-toggle.left[data-v-8f9db926]{left:calc(var(--cm-left-rail-width) + 1px)}.cm-panel-toggle.left[data-v-8f9db926]::before{border-right:9px solid currentColor}.cm-workspace.left-collapsed .cm-panel-toggle.left[data-v-8f9db926]{left:1px}.cm-workspace.left-collapsed .cm-panel-toggle.left[data-v-8f9db926]::before{border-right:0;border-left:9px solid currentColor}.cm-panel-toggle.right[data-v-8f9db926]{right:calc(var(--cm-right-rail-width) + 1px)}.cm-panel-toggle.right[data-v-8f9db926]::before{border-left:9px solid currentColor}.cm-workspace.right-collapsed .cm-panel-toggle.right[data-v-8f9db926]{right:1px}.cm-workspace.right-collapsed .cm-panel-toggle.right[data-v-8f9db926]::before{border-left:0;border-right:9px solid currentColor}.cm-controls[data-v-8f9db926],.cm-list-panel[data-v-8f9db926],.cm-preview[data-v-8f9db926]{min-height:0;height:100%;max-height:100%;border:1px solid var(--cm-border);border-radius:8px;background:var(--cm-panel)}.cm-controls[data-v-8f9db926],.cm-preview[data-v-8f9db926]{padding:12px;overflow:auto;transition:opacity 140ms ease,padding 140ms ease,border-width 140ms ease}.cm-workspace.left-collapsed .cm-controls[data-v-8f9db926],.cm-workspace.right-collapsed .cm-preview[data-v-8f9db926]{width:0;min-width:0;padding:0;border-width:0;opacity:0;pointer-events:none;overflow:hidden}.cm-shell[data-v-8f9db926],.cm-controls[data-v-8f9db926],.cm-list-panel[data-v-8f9db926],.cm-preview[data-v-8f9db926]{scrollbar-width:none;-ms-overflow-style:none}.cm-shell[data-v-8f9db926]::-webkit-scrollbar,.cm-controls[data-v-8f9db926]::-webkit-scrollbar,.cm-list-panel[data-v-8f9db926]::-webkit-scrollbar,.cm-preview[data-v-8f9db926]::-webkit-scrollbar{width:0;height:0;display:none}.cm-field[data-v-8f9db926]{display:grid;gap:6px;margin-bottom:12px}.cm-field span[data-v-8f9db926]{color:var(--cm-muted);font-size:12px}.cm-field input[data-v-8f9db926],.cm-field select[data-v-8f9db926]{-webkit-appearance:none;appearance:none;width:100%;box-sizing:border-box;height:34px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg);color:var(--cm-text);padding:0 10px}.cm-tag-filter[data-v-8f9db926]{display:grid;gap:6px}.cm-tag-filter[data-v-8f9db926]{margin-top:0}.cm-side-heading[data-v-8f9db926]{display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;color:var(--cm-muted);font-size:12px}.cm-tag-filter .cm-clear-tags[data-v-8f9db926]{width:24px;height:24px;display:grid;place-items:center;min-height:0;border:0;border-radius:5px;background:transparent;color:var(--cm-weak);cursor:pointer;font-size:15px;line-height:1}.cm-tag-filter .cm-clear-tags[data-v-8f9db926]:hover:not(:disabled),.cm-tag-filter .cm-clear-tags[data-v-8f9db926]:focus-visible{background:var(--cm-panel-2);color:var(--cm-text)}.cm-tag-filter .cm-clear-tags[data-v-8f9db926]:focus-visible{outline:1px solid var(--cm-accent);outline-offset:2px}.cm-tag-filter .cm-clear-tags[data-v-8f9db926]:disabled{cursor:not-allowed;opacity:0.35}.cm-side-empty[data-v-8f9db926]{color:var(--cm-weak);font-size:12px;line-height:1.5}.cm-tag-filter button[data-v-8f9db926]{display:flex;justify-content:space-between;align-items:center;min-height:34px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-panel-2);color:var(--cm-text);cursor:pointer}.cm-tag-filter button[data-v-8f9db926]{gap:8px}.cm-tag-filter button.active[data-v-8f9db926]{border-color:var(--cm-accent);color:var(--cm-accent-text)}.cm-tag-filter span[data-v-8f9db926]{min-width:0;display:inline-flex;align-items:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cm-tag-filter strong[data-v-8f9db926]{color:var(--cm-muted);font-size:12px}.cm-issue-box[data-v-8f9db926],.cm-risk-list[data-v-8f9db926]{margin-top:12px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg);padding:10px}.cm-issue-box strong[data-v-8f9db926]{display:block;margin-bottom:6px}.cm-issue-box p[data-v-8f9db926],.cm-risk-list p[data-v-8f9db926]{margin:6px 0 0;color:var(--cm-muted);line-height:1.5}.cm-risk-list .warning[data-v-8f9db926]{color:var(--cm-warning)}.cm-risk-list .error[data-v-8f9db926]{color:var(--cm-danger)}.cm-list-panel[data-v-8f9db926]{display:grid;grid-template-rows:auto minmax(0,1fr);overflow:hidden;scroll-padding-top:0}.cm-list-panel.import-mode[data-v-8f9db926]{grid-template-rows:minmax(0,1fr)}.cm-list-head[data-v-8f9db926]{position:relative;z-index:4;display:flex;align-items:center;flex-wrap:nowrap;gap:10px;padding:11px 12px;border-bottom:1px solid var(--cm-border);background:var(--cm-panel);overflow:hidden}.cm-list-status[data-v-8f9db926]{flex:0 0 auto;min-width:110px;display:grid;gap:2px}.cm-list-status span[data-v-8f9db926]{color:var(--cm-muted);font-size:12px}.cm-search-field[data-v-8f9db926],.cm-sort-field[data-v-8f9db926]{margin-bottom:0}.cm-list-head .cm-field[data-v-8f9db926]{display:block}.cm-list-head .cm-field>span[data-v-8f9db926]{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}.cm-search-field[data-v-8f9db926]{flex:1 1 260px;min-width:180px}.cm-sort-field[data-v-8f9db926]{flex:0 0 150px}.cm-list-head>span[data-v-8f9db926]{margin-left:auto}.cm-list-tools[data-v-8f9db926]{flex:0 0 auto;display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-left:auto}.cm-list-tools button[data-v-8f9db926],.cm-list-tools output[data-v-8f9db926],.cm-selection-toggle[data-v-8f9db926]{min-height:28px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg);color:var(--cm-text);padding:0 9px;font-size:12px}.cm-list-tools button[data-v-8f9db926]{cursor:pointer}.cm-selection-toggle[aria-pressed='true'][data-v-8f9db926]{border-color:var(--cm-accent);color:var(--cm-accent-text)}.cm-list-tools output[data-v-8f9db926]{display:inline-flex;align-items:center;color:var(--cm-muted)}.cm-gallery-tools[data-v-8f9db926]{display:inline-flex;align-items:center;gap:4px;padding:2px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg)}.cm-gallery-tools button[data-v-8f9db926]{width:26px;height:24px;border:0;border-radius:4px;background:transparent;color:var(--cm-text);cursor:pointer;font-size:15px;line-height:1}.cm-gallery-tools button[data-v-8f9db926]:hover:not(:disabled){background:var(--cm-panel-2)}.cm-gallery-tools button[data-v-8f9db926]:disabled{cursor:not-allowed;opacity:0.45}.cm-gallery-tools output[data-v-8f9db926]{min-width:28px;color:var(--cm-muted);font-size:12px;text-align:center}.cm-card-grid[data-v-8f9db926]{display:grid;grid-template-columns:repeat(var(--cm-card-cols,5),minmax(0,1fr));gap:8px;align-items:start;align-content:start;min-height:0;padding:10px;overflow:auto;scrollbar-width:none;-ms-overflow-style:none}.cm-import-workspace[data-v-8f9db926],.cm-card-grid[data-v-8f9db926]{min-height:0}.cm-card-grid[data-v-8f9db926]::-webkit-scrollbar{width:0;height:0;display:none}.cm-import-workspace[data-v-8f9db926]{display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:0;min-height:0;overflow:hidden;scrollbar-width:none;-ms-overflow-style:none}.cm-import-workspace[data-v-8f9db926]::-webkit-scrollbar{width:0;height:0;display:none}.cm-import-summary[data-v-8f9db926],.cm-diff-section dl[data-v-8f9db926]{border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg)}.cm-import-sourcebar[data-v-8f9db926]{display:grid;grid-template-columns:minmax(240px,0.75fr) minmax(360px,1.25fr);gap:10px;align-items:center;min-width:0;border-bottom:1px solid var(--cm-border);background:var(--cm-control-bg);padding:12px 14px}.cm-import-card em[data-v-8f9db926]{margin:0;color:var(--cm-muted);line-height:1.5}.cm-import-drop[data-v-8f9db926]{display:flex;align-items:center;gap:10px;min-width:0}.cm-import-drop span[data-v-8f9db926]{min-width:0;overflow:hidden;color:var(--cm-muted);font-size:12px;text-overflow:ellipsis;white-space:nowrap}.cm-file-button[data-v-8f9db926]{width:-moz-fit-content;width:fit-content;min-height:34px;flex:0 0 auto;display:inline-flex;align-items:center;border:1px solid var(--cm-accent);border-radius:6px;background:var(--cm-primary-bg);color:var(--cm-text);padding:0 10px;cursor:pointer}.cm-file-button input[data-v-8f9db926]{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}.cm-import-url[data-v-8f9db926]{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;min-width:0}.cm-import-url .cm-field[data-v-8f9db926]{margin-bottom:0}.cm-import-summary[data-v-8f9db926]{display:flex;align-items:center;justify-content:flex-start;gap:10px;border-right:0;border-left:0;border-radius:0;padding:9px 12px}.cm-import-summary span[data-v-8f9db926]{color:var(--cm-muted)}.cm-import-summary button[data-v-8f9db926]{flex:0 0 auto}.cm-import-summary button[data-v-8f9db926]:first-of-type{margin-left:auto}.cm-import-summary button[data-v-8f9db926],.cm-import-card button[data-v-8f9db926]{min-height:28px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-panel-2);color:var(--cm-text);cursor:pointer}.cm-import-summary .cm-import-confirm[data-v-8f9db926]{min-height:34px;border-color:var(--cm-accent);background:var(--cm-accent);color:var(--cm-accent-contrast);padding:0 14px;font-weight:800;box-shadow:0 0 0 1px oklch(92% 0.05 250/16%)}.cm-import-summary .cm-import-confirm[data-v-8f9db926]:hover:not(:disabled),.cm-import-summary .cm-import-confirm[data-v-8f9db926]:focus-visible{filter:brightness(1.08)}.cm-import-list[data-v-8f9db926]{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));align-content:start;gap:8px;min-height:0;padding:10px 12px 12px;overflow:auto;scrollbar-width:none;-ms-overflow-style:none}.cm-import-list[data-v-8f9db926]::-webkit-scrollbar{width:0;height:0;display:none}.cm-import-card[data-v-8f9db926]{position:relative;min-width:0;display:block;padding:0;border:1px solid transparent;border-radius:8px;background:var(--cm-card-bg);color:var(--cm-text);text-align:left;cursor:pointer;overflow:hidden}.cm-import-card.active[data-v-8f9db926]{border-color:var(--cm-accent)}.cm-import-card.error[data-v-8f9db926]{border-color:var(--cm-danger)}.cm-import-thumb[data-v-8f9db926]{position:relative;display:block;width:100%;aspect-ratio:3/4;height:auto;overflow:hidden;background:var(--cm-media-bg)}.cm-import-thumb[data-v-8f9db926]::before{content:'';display:block;width:100%;padding-top:133.3333%}.cm-import-thumb[data-v-8f9db926]::after{content:'';position:absolute;inset:auto 0 0;height:54%;pointer-events:none;background:linear-gradient(to bottom,oklch(13% 0.012 248/0%),oklch(11% 0.012 248/64%) 42%,oklch(9% 0.012 248/94%) 100%)}.cm-import-thumb img[data-v-8f9db926]{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;background:var(--cm-media-bg)}.cm-import-thumb>b[data-v-8f9db926]{position:absolute;inset:0;width:100%;height:100%;display:grid;place-items:center;color:var(--cm-muted);font-size:22px;letter-spacing:0}.cm-import-card-tags[data-v-8f9db926]{position:absolute;top:8px;left:8px;right:42px;z-index:2;display:flex;flex-wrap:wrap;gap:4px}.cm-import-card-tags b[data-v-8f9db926]{min-width:0;max-width:100%;overflow:hidden;border:1px solid oklch(94% 0.01 248/26%);border-radius:999px;background:oklch(16% 0.012 248/66%);color:var(--cm-text);padding:2px 7px;font-size:11px;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}.cm-import-card button[data-v-8f9db926]{position:absolute;top:8px;right:8px;z-index:3;width:28px;min-height:28px;padding:0}.cm-import-card-text[data-v-8f9db926]{position:absolute;right:0;bottom:0;left:0;z-index:2;display:grid;gap:3px;min-width:0;padding:58px 11px 11px;pointer-events:none}.cm-import-card-text strong[data-v-8f9db926],.cm-import-card-text small[data-v-8f9db926],.cm-import-card-text em[data-v-8f9db926]{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cm-import-card-text strong[data-v-8f9db926]{color:var(--cm-text);font-size:14px;line-height:1.25;text-shadow:0 1px 8px oklch(7% 0.01 248/82%)}.cm-import-card-text small[data-v-8f9db926]{color:var(--cm-muted);font-size:12px}.cm-import-card-text em[data-v-8f9db926]{color:var(--cm-warning);font-size:12px;font-style:normal}.cm-import-avatar[data-v-8f9db926]{width:48px;height:48px;display:grid;place-items:center;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-media-bg);color:var(--cm-muted);font-size:11px;font-weight:800}.cm-diff-section dl[data-v-8f9db926]{display:grid;gap:0;margin:8px 0 0;overflow:hidden}.cm-diff-section div[data-v-8f9db926]{display:grid;gap:5px;padding:8px;border-bottom:1px solid var(--cm-border)}.cm-diff-section div[data-v-8f9db926]:last-child{border-bottom:0}.cm-diff-section div.changed[data-v-8f9db926]{background:var(--cm-panel-2)}.cm-diff-section div.preserved[data-v-8f9db926]{color:var(--cm-accent-text)}.cm-diff-section dt[data-v-8f9db926]{color:var(--cm-text);font-weight:800;font-size:12px}.cm-diff-section dd[data-v-8f9db926]{display:grid;gap:3px;margin:0;color:var(--cm-muted);line-height:1.45;overflow-wrap:anywhere}.cm-diff-section dd strong[data-v-8f9db926]{color:var(--cm-text)}.cm-card[data-v-8f9db926]{position:relative;min-width:0;scroll-margin-top:112px;display:block;width:100%;height:var(--cm-card-height,320px);padding:0;border:1px solid transparent;border-radius:8px;background:var(--cm-card-bg);color:var(--cm-text);text-align:left;cursor:pointer;overflow:hidden}.cm-card[data-v-8f9db926]:hover,.cm-card.active[data-v-8f9db926],.cm-card.selected[data-v-8f9db926]{border-color:var(--cm-accent);background:var(--cm-card-bg)}.cm-card.selected[data-v-8f9db926]{box-shadow:inset 0 0 0 1px var(--cm-accent)}.cm-card-check[data-v-8f9db926]{position:absolute;top:10px;right:10px;z-index:4;display:grid;place-items:center;width:28px;height:28px;border-radius:6px;background:var(--cm-scrim);cursor:pointer}.cm-card-check input[data-v-8f9db926]{width:16px;height:16px;accent-color:var(--cm-accent)}.cm-thumb[data-v-8f9db926]{position:absolute;inset:0;display:block;width:100%;height:100%;border-radius:8px;overflow:hidden;background:var(--cm-media-bg)}.cm-thumb[data-v-8f9db926]::before{content:none}.cm-thumb[data-v-8f9db926]::after{content:'';position:absolute;inset:auto 0 0;z-index:1;height:54%;pointer-events:none;background:linear-gradient(to bottom,rgba(7,11,18,0) 0%,rgba(7,11,18,0.18) 28%,rgba(7,11,18,0.68) 70%,rgba(7,11,18,0.9) 100%)}.cm-thumb img[data-v-8f9db926]{position:absolute;inset:0;z-index:0;display:block;width:100%;height:100%;object-fit:cover;image-rendering:auto;background:var(--cm-media-bg)}.cm-card-tags[data-v-8f9db926]{position:absolute;top:8px;left:8px;right:8px;z-index:2;display:flex;flex-wrap:wrap;gap:3px;max-height:39px;overflow:hidden;pointer-events:none}.cm-card-tags b[data-v-8f9db926]{max-width:100%;min-width:0;display:inline-block;overflow:hidden;border:1px solid oklch(94% 0.01 248/28%);border-radius:999px;background:oklch(16% 0.012 248/58%);color:var(--cm-text);padding:2px 6px;font-size:11px;line-height:1.25;text-overflow:ellipsis;white-space:nowrap;backdrop-filter:blur(4px)}.cm-card-actions[data-v-8f9db926]{position:absolute;right:9px;bottom:9px;z-index:4;display:inline-flex;gap:5px}.cm-card-action[data-v-8f9db926]{width:28px;height:28px;display:inline-grid;place-items:center;border:1px solid oklch(94% 0.01 248/20%);border-radius:7px;background:var(--cm-badge-bg);color:var(--cm-text);cursor:pointer;font-size:14px;line-height:1;backdrop-filter:blur(4px)}.cm-card-action[data-v-8f9db926]:hover:not(:disabled),.cm-card-action[data-v-8f9db926]:focus-visible,.cm-card-action.active[data-v-8f9db926]{border-color:var(--cm-accent);color:var(--cm-accent-text);background:var(--cm-accent-bg)}.cm-card-action[data-v-8f9db926]:disabled{cursor:wait;opacity:0.56}.cm-card-action svg[data-v-8f9db926]{width:17px;height:17px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2.2}.cm-preview-head img[data-v-8f9db926]{width:100%;height:100%;object-fit:cover;image-rendering:auto;background:var(--cm-media-bg)}.cm-card-text[data-v-8f9db926]{position:absolute;left:0;right:0;bottom:0;z-index:2;min-width:0;padding:54px 78px 12px 12px;pointer-events:none;background:linear-gradient(to bottom,rgba(7,11,18,0) 0%,rgba(7,11,18,0.42) 48%,rgba(7,11,18,0.82) 100%)}.cm-card-text strong[data-v-8f9db926]{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--cm-text);font-size:14px;line-height:1.3;text-shadow:0 1px 8px oklch(7% 0.01 248/82%)}.cm-empty[data-v-8f9db926],.cm-inline-status[data-v-8f9db926]{padding:24px 14px;color:var(--cm-muted);text-align:center}.cm-preview[data-v-8f9db926]{display:grid;align-content:start;gap:10px;overscroll-behavior:contain}.cm-preview-head[data-v-8f9db926]{display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:start;gap:10px}.cm-preview-head img[data-v-8f9db926]{width:48px;height:48px;border-radius:6px}.cm-title-input[data-v-8f9db926]{width:100%;min-height:30px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--cm-text);padding:0 4px;font:inherit;font-size:17px;font-weight:800;line-height:1.25}.cm-title-input[data-v-8f9db926]:hover,.cm-title-input[data-v-8f9db926]:focus{border-color:var(--cm-border);background:var(--cm-control-bg);outline:none}.cm-preview-actions[data-v-8f9db926]{display:inline-flex;align-items:center;gap:8px;padding-top:2px;white-space:nowrap}.cm-launch-action[data-v-8f9db926]{min-height:34px;display:inline-flex;align-items:center;gap:5px;border:1px solid var(--cm-accent);border-radius:8px;background:var(--cm-accent-bg);color:var(--cm-accent-text);padding:0 11px;cursor:pointer;font-size:13px;font-weight:800;line-height:1}.cm-launch-action[data-v-8f9db926]:hover:not(:disabled),.cm-launch-action[data-v-8f9db926]:focus-visible{background:var(--cm-accent);color:var(--cm-accent-contrast);outline:none}.cm-launch-action[data-v-8f9db926]:disabled{cursor:wait;opacity:0.58}.cm-launch-action svg[data-v-8f9db926]{width:14px;height:14px;fill:currentColor}.cm-preview-actions .cm-danger-action.compact[data-v-8f9db926]{min-height:34px;border-radius:8px;padding:0 12px;font-weight:800;line-height:1}.cm-preview-head p[data-v-8f9db926]{margin:3px 0 0;color:var(--cm-muted);font-size:12px}.cm-meta-list[data-v-8f9db926]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;margin:0;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg);overflow:hidden}.cm-meta-list.compact dd[data-v-8f9db926]{white-space:normal}.cm-meta-list div[data-v-8f9db926]{min-width:0;display:grid;grid-template-columns:46px minmax(0,1fr);gap:8px;align-items:baseline;padding:7px 9px;border-bottom:1px solid var(--cm-border);color:var(--cm-muted);overflow-wrap:anywhere}.cm-meta-list div[data-v-8f9db926]:nth-last-child(-n+2){border-bottom:0}.cm-meta-list div[data-v-8f9db926]:nth-child(odd){border-right:1px solid var(--cm-border)}.cm-meta-list dt[data-v-8f9db926]{color:var(--cm-weak);font-size:11px;font-weight:700}.cm-meta-list dd[data-v-8f9db926]{margin:0;min-width:0;overflow:hidden;color:var(--cm-muted);text-overflow:ellipsis;white-space:nowrap}.cm-section[data-v-8f9db926]{border-top:1px solid var(--cm-border);padding-top:9px}.cm-detail-tags[data-v-8f9db926],.cm-chat-panel[data-v-8f9db926],.cm-danger-zone[data-v-8f9db926],.cm-tag-editor[data-v-8f9db926],.cm-mutation-preview[data-v-8f9db926],.cm-selection-summary[data-v-8f9db926]{border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg);padding:10px}.cm-detail-tags[data-v-8f9db926]{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.cm-detail-tags strong[data-v-8f9db926],.cm-tag-editor h3[data-v-8f9db926],.cm-selection-summary h2[data-v-8f9db926]{margin:0;font-size:12px}.cm-detail-tags>span[data-v-8f9db926]:not(.cm-detail-tag-chip),.cm-detail-tags button[data-v-8f9db926]{border:1px solid var(--cm-border);border-radius:999px;color:var(--cm-muted);padding:2px 7px;font-size:12px}.cm-detail-tags button[data-v-8f9db926]{background:transparent;cursor:pointer;line-height:1.4}.cm-detail-tags button[data-v-8f9db926]:hover,.cm-detail-tags button[data-v-8f9db926]:focus-visible{border-color:var(--cm-accent);color:var(--cm-text);background:var(--cm-panel-2)}.cm-detail-tags button[data-v-8f9db926]:focus-visible{outline:1px solid var(--cm-accent);outline-offset:2px}.cm-detail-tags .cm-detail-tag-chip.active[data-v-8f9db926]{border-color:var(--cm-accent);color:var(--cm-accent-text);background:var(--cm-accent-bg)}.cm-detail-tag-chip[data-v-8f9db926]{min-width:0;display:inline-flex;align-items:center;overflow:hidden;border:1px solid var(--cm-border);border-radius:999px;color:var(--cm-muted)}.cm-detail-tag-chip button[data-v-8f9db926]{min-height:26px;border:0;border-radius:0;padding:2px 7px}.cm-detail-tag-chip button[data-v-8f9db926]:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis}.cm-detail-tag-chip button[data-v-8f9db926]:last-child{width:24px;padding:0;border-left:1px solid var(--cm-border);color:var(--cm-weak)}.cm-detail-tag-chip.active button[data-v-8f9db926]{color:var(--cm-accent-text)}.cm-detail-tag-add[data-v-8f9db926]{width:28px;min-height:28px;display:inline-grid;place-items:center;padding:0;font-weight:900}.cm-source-url[data-v-8f9db926]{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:end}.cm-source-field[data-v-8f9db926]{min-width:0;display:grid;gap:4px}.cm-source-field span[data-v-8f9db926]{color:var(--cm-muted);font-size:12px;font-weight:700}.cm-source-field input[data-v-8f9db926]{width:100%;min-height:32px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg);color:var(--cm-text);padding:0 9px;font:inherit}.cm-source-field input[data-v-8f9db926]:focus{border-color:var(--cm-accent);outline:none}.cm-source-actions[data-v-8f9db926]{display:flex;gap:4px}.cm-source-actions button[data-v-8f9db926]{width:32px;height:32px;display:inline-grid;place-items:center;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg);color:var(--cm-muted);cursor:pointer}.cm-source-actions button[data-v-8f9db926]:hover:not(:disabled),.cm-source-actions button[data-v-8f9db926]:focus-visible:not(:disabled){border-color:var(--cm-accent);color:var(--cm-text);background:var(--cm-panel-2)}.cm-source-actions button[data-v-8f9db926]:disabled{cursor:not-allowed;opacity:0.45}.cm-source-url p[data-v-8f9db926]{grid-column:1/-1;margin:0;color:var(--cm-danger);font-size:12px}.cm-tag-dialog-backdrop[data-v-8f9db926]{position:fixed;inset:0;z-index:30;display:grid;place-items:center;padding:16px;background:var(--cm-backdrop)}.cm-tag-dialog[data-v-8f9db926]{width:min(420px,100%);display:grid;gap:12px;border:1px solid var(--cm-border);border-radius:8px;background:var(--cm-panel);padding:14px;box-shadow:0 18px 50px oklch(4% 0.01 248/46%)}.cm-tag-dialog header[data-v-8f9db926]{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.cm-tag-dialog h3[data-v-8f9db926],.cm-tag-dialog p[data-v-8f9db926]{margin:0}.cm-tag-dialog header p[data-v-8f9db926],.cm-dialog-note[data-v-8f9db926]{color:var(--cm-muted);line-height:1.45}.cm-tag-dialog header button[data-v-8f9db926]{width:32px;height:32px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg);color:var(--cm-text);cursor:pointer}.cm-tag-dialog .cm-field[data-v-8f9db926]{margin-bottom:0}.cm-tag-choice-grid[data-v-8f9db926]{display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:36px}.cm-tag-choice-grid button[data-v-8f9db926]{min-height:30px;border:1px solid var(--cm-border);border-radius:999px;background:var(--cm-control-bg);color:var(--cm-muted);padding:0 11px;cursor:pointer}.cm-tag-choice-grid button[data-v-8f9db926]:hover,.cm-tag-choice-grid button[data-v-8f9db926]:focus-visible{border-color:var(--cm-accent);color:var(--cm-text)}.cm-tag-choice-grid button.active[data-v-8f9db926]{border-color:var(--cm-accent);background:var(--cm-accent-bg);color:var(--cm-accent-text)}.cm-tag-editor[data-v-8f9db926]{display:grid;gap:10px}.cm-danger-zone[data-v-8f9db926]{display:grid;gap:9px;border-color:oklch(62% 0.18 28/55%)}.cm-danger-zone h3[data-v-8f9db926],.cm-chat-panel h3[data-v-8f9db926]{margin:0;font-size:12px}.cm-danger-zone label[data-v-8f9db926]{display:flex;gap:7px;align-items:center;color:var(--cm-muted);font-size:12px}.cm-danger-action[data-v-8f9db926]{min-height:32px;border:1px solid oklch(62% 0.18 28/70%);border-radius:6px;background:oklch(28% 0.12 28/58%);color:var(--cm-text);padding:0 10px;cursor:pointer}.cm-danger-action.compact[data-v-8f9db926]{min-height:30px;padding:0 10px}.cm-danger-action.strong[data-v-8f9db926]{background:oklch(42% 0.18 28/78%);font-weight:800}.cm-danger-action[data-v-8f9db926]:disabled{cursor:not-allowed;opacity:0.55}.cm-delete-preview[data-v-8f9db926]{display:grid;gap:8px}.cm-delete-preview article[data-v-8f9db926]{display:grid;gap:3px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-bg);padding:8px}.cm-delete-preview article span[data-v-8f9db926],.cm-delete-preview p[data-v-8f9db926],.cm-chat-list article span[data-v-8f9db926]{color:var(--cm-muted);font-size:12px;line-height:1.45}.cm-delete-preview .warning[data-v-8f9db926]{color:var(--cm-warning)}.cm-delete-preview .error[data-v-8f9db926],.cm-inline-status.error[data-v-8f9db926]{color:var(--cm-danger)}.cm-chat-panel[data-v-8f9db926]{display:grid;gap:8px}.cm-chat-list[data-v-8f9db926]{display:grid;gap:6px}.cm-chat-list article[data-v-8f9db926]{display:grid;gap:7px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-bg);padding:7px 8px}.cm-chat-row[data-v-8f9db926]{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}.cm-chat-main[data-v-8f9db926]{min-width:0;display:grid;gap:3px}.cm-chat-main input[data-v-8f9db926]{width:100%;min-width:0;border:1px solid transparent;border-radius:5px;background:transparent;color:var(--cm-text);padding:2px 4px;font:inherit;font-weight:800}.cm-chat-main input[data-v-8f9db926]:hover,.cm-chat-main input[data-v-8f9db926]:focus{border-color:var(--cm-border);background:var(--cm-control-bg);outline:none}.cm-chat-actions[data-v-8f9db926]{display:inline-flex;gap:4px}.cm-chat-actions button[data-v-8f9db926]{width:28px;height:28px;display:inline-grid;place-items:center;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg);color:var(--cm-muted);cursor:pointer}.cm-chat-actions button[data-v-8f9db926]:hover,.cm-chat-actions button[data-v-8f9db926]:focus-visible{border-color:var(--cm-accent);color:var(--cm-text);background:var(--cm-panel-2)}.cm-chat-actions button.danger[data-v-8f9db926]:hover,.cm-chat-actions button.danger[data-v-8f9db926]:focus-visible{border-color:var(--cm-danger);color:var(--cm-danger)}.cm-chat-actions button[data-v-8f9db926]:disabled{cursor:not-allowed;opacity:0.55}.cm-chat-actions svg[data-v-8f9db926]{width:15px;height:15px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2.1}.cm-chat-content[data-v-8f9db926]{max-height:none;margin:0;overflow:visible;white-space:pre-wrap;overflow-wrap:anywhere;border-top:1px solid var(--cm-border);padding:8px 2px 0;color:var(--cm-muted);font:inherit;font-size:12px;line-height:1.5}.cm-tag-editor .cm-field[data-v-8f9db926]{margin-bottom:0}.cm-management-actions[data-v-8f9db926]{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.cm-primary-action[data-v-8f9db926]{min-height:32px;border:1px solid var(--cm-accent);border-radius:6px;background:var(--cm-primary-bg);color:var(--cm-text);cursor:pointer}.cm-secondary-action[data-v-8f9db926]{min-height:30px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg);color:var(--cm-text);padding:0 9px;cursor:pointer}.cm-primary-action[data-v-8f9db926]:disabled,.cm-secondary-action[data-v-8f9db926]:disabled{cursor:not-allowed;opacity:0.55}.cm-mutation-preview[data-v-8f9db926]{display:grid;gap:6px}.cm-mutation-preview p[data-v-8f9db926]{margin:0;color:var(--cm-muted);line-height:1.5}.cm-mutation-preview .error[data-v-8f9db926]{color:var(--cm-danger)}.cm-selection-summary[data-v-8f9db926]{display:grid;gap:10px}.cm-section h3[data-v-8f9db926]{font-size:12px}.cm-section-head[data-v-8f9db926]{display:flex;align-items:center;justify-content:space-between;gap:8px}.cm-section p[data-v-8f9db926]{margin:5px 0 0;color:var(--cm-muted);line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}.cm-greeting-body[data-v-8f9db926]{margin-top:8px}.cm-greeting-pager[data-v-8f9db926]{display:inline-flex;align-items:center;gap:4px;min-width:0}.cm-greeting-pager button[data-v-8f9db926],.cm-greeting-pager select[data-v-8f9db926]{height:26px;border:1px solid var(--cm-border);border-radius:6px;background:var(--cm-control-bg);color:var(--cm-text)}.cm-greeting-pager button[data-v-8f9db926]{width:28px;padding:0;font-size:12px;cursor:pointer}.cm-greeting-pager output[data-v-8f9db926]{min-width:44px;color:var(--cm-muted);font-size:12px;text-align:center}.cm-greeting-pager select[data-v-8f9db926]{width:52px;padding:0 6px;font-size:12px}.cm-greeting-pager button[data-v-8f9db926]:hover:not(:disabled),.cm-greeting-pager button[data-v-8f9db926]:focus-visible,.cm-greeting-pager select[data-v-8f9db926]:focus-visible{border-color:var(--cm-accent);background:var(--cm-panel-2)}.cm-greeting-pager button[data-v-8f9db926]:focus-visible,.cm-greeting-pager select[data-v-8f9db926]:focus-visible{outline:1px solid var(--cm-accent);outline-offset:2px}.cm-greeting-pager button[data-v-8f9db926]:disabled{cursor:not-allowed;opacity:0.42}.cm-settings-backdrop[data-v-8f9db926]{position:fixed;inset:0;z-index:10;display:grid;place-items:center;padding:18px;background:var(--cm-backdrop)}.cm-settings[data-v-8f9db926]{width:min(560px,100%);max-height:min(620px,calc(100vh - 36px));display:grid;grid-template-rows:auto minmax(0,1fr);border:1px solid var(--cm-border);border-radius:8px;background:var(--cm-panel);color:var(--cm-text);overflow:hidden}.cm-settings>header[data-v-8f9db926]{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;border-bottom:1px solid var(--cm-border)}.cm-settings h2[data-v-8f9db926],.cm-settings h3[data-v-8f9db926]{margin:0;letter-spacing:0}.cm-settings h2[data-v-8f9db926]{font-size:18px}.cm-settings header p[data-v-8f9db926],.cm-settings-group p[data-v-8f9db926]{margin:4px 0 0;color:var(--cm-muted);line-height:1.45}.cm-settings-group[data-v-8f9db926]{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;padding:16px}.cm-settings-group h3[data-v-8f9db926]{font-size:14px}.cm-segmented[data-v-8f9db926]{display:inline-flex;gap:3px;padding:3px;border:1px solid var(--cm-border);border-radius:8px;background:var(--cm-control-bg)}.cm-segmented button[data-v-8f9db926]{min-width:58px;height:30px;border:0;border-radius:6px;background:transparent;color:var(--cm-muted);cursor:pointer;font-weight:700}.cm-segmented button.active[data-v-8f9db926]{background:var(--cm-accent);color:var(--cm-accent-contrast)}@media (max-width:1080px){.cm-workspace[data-v-8f9db926]{--cm-left-rail-width:230px;grid-template-columns:minmax(200px,230px) minmax(320px,1fr)}.cm-workspace:not(.right-collapsed) .cm-preview[data-v-8f9db926]{grid-column:1/-1}}@media (max-width:720px){.cm-shell[data-v-8f9db926]{padding:10px}.cm-workspace[data-v-8f9db926]{display:flex;flex-direction:column;grid-template-columns:1fr;align-items:start;overflow:auto}.cm-panel-toggle[data-v-8f9db926]{display:none}.cm-workspace.left-collapsed[data-v-8f9db926],.cm-workspace.right-collapsed[data-v-8f9db926],.cm-workspace.left-collapsed.right-collapsed[data-v-8f9db926]{grid-template-columns:1fr}.cm-controls[data-v-8f9db926],.cm-list-panel[data-v-8f9db926],.cm-preview[data-v-8f9db926]{width:100%;height:auto;max-height:none}.cm-list-panel[data-v-8f9db926]{display:block;overflow:hidden}.cm-list-panel.import-mode[data-v-8f9db926]{display:grid;grid-template-rows:minmax(0,1fr)}.cm-import-sourcebar[data-v-8f9db926]{grid-template-columns:1fr;padding:10px}.cm-import-summary[data-v-8f9db926]{flex-wrap:wrap}.cm-import-summary button[data-v-8f9db926]{margin-left:0}.cm-import-list[data-v-8f9db926]{grid-template-columns:repeat(2,minmax(0,1fr))}.cm-header[data-v-8f9db926]{align-items:flex-start}.cm-header-actions[data-v-8f9db926]{flex-wrap:wrap;justify-content:flex-end}.cm-card-grid[data-v-8f9db926]{grid-template-columns:repeat(2,minmax(0,1fr));max-height:min(78vh,680px);overflow:auto}.cm-card[data-v-8f9db926]{width:100%;max-width:none}.cm-list-head[data-v-8f9db926]{flex-wrap:wrap}.cm-list-status[data-v-8f9db926],.cm-search-field[data-v-8f9db926],.cm-sort-field[data-v-8f9db926],.cm-list-tools[data-v-8f9db926],.cm-gallery-tools[data-v-8f9db926]{flex:1 1 100%}.cm-meta-list[data-v-8f9db926]{grid-template-columns:1fr}.cm-meta-list div[data-v-8f9db926],.cm-meta-list div[data-v-8f9db926]:nth-child(odd){border-right:0}.cm-meta-list div[data-v-8f9db926]:nth-last-child(2){border-bottom:1px solid var(--cm-border)}.cm-settings-group[data-v-8f9db926]{grid-template-columns:1fr}}\n`, "" ]);
    const __WEBPACK_DEFAULT_EXPORT__ = ___CSS_LOADER_EXPORT___;
  },
  "./node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/runtime/api.js"(module) {
    module.exports = function(cssWithMappingToString) {
      var list = [];
      list.toString = function toString() {
        return this.map(function(item) {
          var content = "";
          var needLayer = typeof item[5] !== "undefined";
          if (item[4]) {
            content += "@supports (".concat(item[4], ") {");
          }
          if (item[2]) {
            content += "@media ".concat(item[2], " {");
          }
          if (needLayer) {
            content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
          }
          content += cssWithMappingToString(item);
          if (needLayer) {
            content += "}";
          }
          if (item[2]) {
            content += "}";
          }
          if (item[4]) {
            content += "}";
          }
          return content;
        }).join("");
      };
      list.i = function i(modules, media, dedupe, supports, layer) {
        if (typeof modules === "string") {
          modules = [ [ null, modules, undefined ] ];
        }
        var alreadyImportedModules = {};
        if (dedupe) {
          for (var k = 0; k < this.length; k++) {
            var id = this[k][0];
            if (id != null) {
              alreadyImportedModules[id] = true;
            }
          }
        }
        for (var _k = 0; _k < modules.length; _k++) {
          var item = [].concat(modules[_k]);
          if (dedupe && alreadyImportedModules[item[0]]) {
            continue;
          }
          if (typeof layer !== "undefined") {
            if (typeof item[5] === "undefined") {
              item[5] = layer;
            } else {
              item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
              item[5] = layer;
            }
          }
          if (media) {
            if (!item[2]) {
              item[2] = media;
            } else {
              item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
              item[2] = media;
            }
          }
          if (supports) {
            if (!item[4]) {
              item[4] = "".concat(supports);
            } else {
              item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
              item[4] = supports;
            }
          }
          list.push(item);
        }
      };
      return list;
    };
  },
  "./node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/runtime/noSourceMaps.js"(module) {
    module.exports = function(i) {
      return i[1];
    };
  },
  "./node_modules/.pnpm/fflate@0.8.3/node_modules/fflate/esm/browser.js"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      AsyncCompress: () => AsyncGzip,
      AsyncDecompress: () => AsyncDecompress,
      AsyncDeflate: () => AsyncDeflate,
      AsyncGunzip: () => AsyncGunzip,
      AsyncGzip: () => AsyncGzip,
      AsyncInflate: () => AsyncInflate,
      AsyncUnzipInflate: () => AsyncUnzipInflate,
      AsyncUnzlib: () => AsyncUnzlib,
      AsyncZipDeflate: () => AsyncZipDeflate,
      AsyncZlib: () => AsyncZlib,
      Compress: () => Gzip,
      DecodeUTF8: () => DecodeUTF8,
      Decompress: () => Decompress,
      Deflate: () => Deflate,
      EncodeUTF8: () => EncodeUTF8,
      FlateErrorCode: () => FlateErrorCode,
      Gunzip: () => Gunzip,
      Gzip: () => Gzip,
      Inflate: () => Inflate,
      Unzip: () => Unzip,
      UnzipInflate: () => UnzipInflate,
      UnzipPassThrough: () => UnzipPassThrough,
      Unzlib: () => Unzlib,
      Zip: () => Zip,
      ZipDeflate: () => ZipDeflate,
      ZipPassThrough: () => ZipPassThrough,
      Zlib: () => Zlib,
      compress: () => gzip,
      compressSync: () => gzipSync,
      decompress: () => decompress,
      decompressSync: () => decompressSync,
      deflate: () => deflate,
      deflateSync: () => deflateSync,
      gunzip: () => gunzip,
      gunzipSync: () => gunzipSync,
      gzip: () => gzip,
      gzipSync: () => gzipSync,
      inflate: () => inflate,
      inflateSync: () => inflateSync,
      strFromU8: () => strFromU8,
      strToU8: () => strToU8,
      unzip: () => unzip,
      unzipSync: () => unzipSync,
      unzlib: () => unzlib,
      unzlibSync: () => unzlibSync,
      zip: () => zip,
      zipSync: () => zipSync,
      zlib: () => zlib,
      zlibSync: () => zlibSync
    });
    var ch2 = {};
    var wk = function(c, id, msg, transfer, cb) {
      var w = new Worker(ch2[id] || (ch2[id] = URL.createObjectURL(new Blob([ c + ';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})' ], {
        type: "text/javascript"
      }))));
      w.onmessage = function(e) {
        var d = e.data, ed = d.$e$;
        if (ed) {
          var err = new Error(ed[0]);
          err["code"] = ed[1];
          err.stack = ed[2];
          cb(err, null);
        } else cb(null, d);
      };
      w.postMessage(msg, transfer);
      return w;
    };
    var u8 = Uint8Array, u16 = Uint16Array, i32 = Int32Array;
    var fleb = new u8([ 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0 ]);
    var fdeb = new u8([ 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0 ]);
    var clim = new u8([ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ]);
    var freb = function(eb, start) {
      var b = new u16(31);
      for (var i = 0; i < 31; ++i) {
        b[i] = start += 1 << eb[i - 1];
      }
      var r = new i32(b[30]);
      for (var i = 1; i < 30; ++i) {
        for (var j = b[i]; j < b[i + 1]; ++j) {
          r[j] = j - b[i] << 5 | i;
        }
      }
      return {
        b,
        r
      };
    };
    var _a = freb(fleb, 2), fl = _a.b, revfl = _a.r;
    fl[28] = 258, revfl[258] = 28;
    var _b = freb(fdeb, 0), fd = _b.b, revfd = _b.r;
    var rev = new u16(32768);
    for (var i = 0; i < 32768; ++i) {
      var x = (i & 43690) >> 1 | (i & 21845) << 1;
      x = (x & 52428) >> 2 | (x & 13107) << 2;
      x = (x & 61680) >> 4 | (x & 3855) << 4;
      rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
    }
    var hMap = function(cd, mb, r) {
      var s = cd.length;
      var i = 0;
      var l = new u16(mb);
      for (;i < s; ++i) {
        if (cd[i]) ++l[cd[i] - 1];
      }
      var le = new u16(mb);
      for (i = 1; i < mb; ++i) {
        le[i] = le[i - 1] + l[i - 1] << 1;
      }
      var co;
      if (r) {
        co = new u16(1 << mb);
        var rvb = 15 - mb;
        for (i = 0; i < s; ++i) {
          if (cd[i]) {
            var sv = i << 4 | cd[i];
            var r_1 = mb - cd[i];
            var v = le[cd[i] - 1]++ << r_1;
            for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
              co[rev[v] >> rvb] = sv;
            }
          }
        }
      } else {
        co = new u16(s);
        for (i = 0; i < s; ++i) {
          if (cd[i]) {
            co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
          }
        }
      }
      return co;
    };
    var flt = new u8(288);
    for (var i = 0; i < 144; ++i) flt[i] = 8;
    for (var i = 144; i < 256; ++i) flt[i] = 9;
    for (var i = 256; i < 280; ++i) flt[i] = 7;
    for (var i = 280; i < 288; ++i) flt[i] = 8;
    var fdt = new u8(32);
    for (var i = 0; i < 32; ++i) fdt[i] = 5;
    var flm = hMap(flt, 9, 0), flrm = hMap(flt, 9, 1);
    var fdm = hMap(fdt, 5, 0), fdrm = hMap(fdt, 5, 1);
    var max = function(a) {
      var m = a[0];
      for (var i = 1; i < a.length; ++i) {
        if (a[i] > m) m = a[i];
      }
      return m;
    };
    var bits = function(d, p, m) {
      var o = p / 8 | 0;
      return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
    };
    var bits16 = function(d, p) {
      var o = p / 8 | 0;
      return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
    };
    var shft = function(p) {
      return (p + 7) / 8 | 0;
    };
    var slc = function(v, s, e) {
      if (s == null || s < 0) s = 0;
      if (e == null || e > v.length) e = v.length;
      return new u8(v.subarray(s, e));
    };
    var FlateErrorCode = {
      UnexpectedEOF: 0,
      InvalidBlockType: 1,
      InvalidLengthLiteral: 2,
      InvalidDistance: 3,
      StreamFinished: 4,
      NoStreamHandler: 5,
      InvalidHeader: 6,
      NoCallback: 7,
      InvalidUTF8: 8,
      ExtraFieldTooLong: 9,
      InvalidDate: 10,
      FilenameTooLong: 11,
      StreamFinishing: 12,
      InvalidZipData: 13,
      UnknownCompressionMethod: 14
    };
    var ec = [ "unexpected EOF", "invalid block type", "invalid length/literal", "invalid distance", "stream finished", "no stream handler", , "no callback", "invalid UTF-8 data", "extra field too long", "date not in range 1980-2099", "filename too long", "stream finishing", "invalid zip data" ];
    var err = function(ind, msg, nt) {
      var e = new Error(msg || ec[ind]);
      e.code = ind;
      if (Error.captureStackTrace) Error.captureStackTrace(e, err);
      if (!nt) throw e;
      return e;
    };
    var inflt = function(dat, st, buf, dict) {
      var sl = dat.length, dl = dict ? dict.length : 0;
      if (!sl || st.f && !st.l) return buf || new u8(0);
      var noBuf = !buf;
      var resize = noBuf || st.i != 2;
      var noSt = st.i;
      if (noBuf) buf = new u8(sl * 3);
      var cbuf = function(l) {
        var bl = buf.length;
        if (l > bl) {
          var nbuf = new u8(Math.max(bl * 2, l));
          nbuf.set(buf);
          buf = nbuf;
        }
      };
      var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
      var tbts = sl * 8;
      do {
        if (!lm) {
          final = bits(dat, pos, 1);
          var type = bits(dat, pos + 1, 3);
          pos += 3;
          if (!type) {
            var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
            if (t > sl) {
              if (noSt) err(0);
              break;
            }
            if (resize) cbuf(bt + l);
            buf.set(dat.subarray(s, t), bt);
            st.b = bt += l, st.p = pos = t * 8, st.f = final;
            continue;
          } else if (type == 1) lm = flrm, dm = fdrm, lbt = 9, dbt = 5; else if (type == 2) {
            var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
            var tl = hLit + bits(dat, pos + 5, 31) + 1;
            pos += 14;
            var ldt = new u8(tl);
            var clt = new u8(19);
            for (var i = 0; i < hcLen; ++i) {
              clt[clim[i]] = bits(dat, pos + i * 3, 7);
            }
            pos += hcLen * 3;
            var clb = max(clt), clbmsk = (1 << clb) - 1;
            var clm = hMap(clt, clb, 1);
            for (var i = 0; i < tl; ) {
              var r = clm[bits(dat, pos, clbmsk)];
              pos += r & 15;
              var s = r >> 4;
              if (s < 16) {
                ldt[i++] = s;
              } else {
                var c = 0, n = 0;
                if (s == 16) n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1]; else if (s == 17) n = 3 + bits(dat, pos, 7), 
                pos += 3; else if (s == 18) n = 11 + bits(dat, pos, 127), pos += 7;
                while (n--) ldt[i++] = c;
              }
            }
            var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
            lbt = max(lt);
            dbt = max(dt);
            lm = hMap(lt, lbt, 1);
            dm = hMap(dt, dbt, 1);
          } else err(1);
          if (pos > tbts) {
            if (noSt) err(0);
            break;
          }
        }
        if (resize) cbuf(bt + 131072);
        var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
        var lpos = pos;
        for (;;lpos = pos) {
          var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
          pos += c & 15;
          if (pos > tbts) {
            if (noSt) err(0);
            break;
          }
          if (!c) err(2);
          if (sym < 256) buf[bt++] = sym; else if (sym == 256) {
            lpos = pos, lm = null;
            break;
          } else {
            var add = sym - 254;
            if (sym > 264) {
              var i = sym - 257, b = fleb[i];
              add = bits(dat, pos, (1 << b) - 1) + fl[i];
              pos += b;
            }
            var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
            if (!d) err(3);
            pos += d & 15;
            var dt = fd[dsym];
            if (dsym > 3) {
              var b = fdeb[dsym];
              dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
            }
            if (pos > tbts) {
              if (noSt) err(0);
              break;
            }
            if (resize) cbuf(bt + 131072);
            var end = bt + add;
            if (bt < dt) {
              var shift = dl - dt, dend = Math.min(dt, end);
              if (shift + bt < 0) err(3);
              for (;bt < dend; ++bt) buf[bt] = dict[shift + bt];
            }
            for (;bt < end; ++bt) buf[bt] = buf[bt - dt];
          }
        }
        st.l = lm, st.p = lpos, st.b = bt, st.f = final;
        if (lm) final = 1, st.m = lbt, st.d = dm, st.n = dbt;
      } while (!final);
      return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
    };
    var wbits = function(d, p, v) {
      v <<= p & 7;
      var o = p / 8 | 0;
      d[o] |= v;
      d[o + 1] |= v >> 8;
    };
    var wbits16 = function(d, p, v) {
      v <<= p & 7;
      var o = p / 8 | 0;
      d[o] |= v;
      d[o + 1] |= v >> 8;
      d[o + 2] |= v >> 16;
    };
    var hTree = function(d, mb) {
      var t = [];
      for (var i = 0; i < d.length; ++i) {
        if (d[i]) t.push({
          s: i,
          f: d[i]
        });
      }
      var s = t.length;
      var t2 = t.slice();
      if (!s) return {
        t: et,
        l: 0
      };
      if (s == 1) {
        var v = new u8(t[0].s + 1);
        v[t[0].s] = 1;
        return {
          t: v,
          l: 1
        };
      }
      t.sort(function(a, b) {
        return a.f - b.f;
      });
      t.push({
        s: -1,
        f: 25001
      });
      var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
      t[0] = {
        s: -1,
        f: l.f + r.f,
        l,
        r
      };
      while (i1 != s - 1) {
        l = t[t[i0].f < t[i2].f ? i0++ : i2++];
        r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
        t[i1++] = {
          s: -1,
          f: l.f + r.f,
          l,
          r
        };
      }
      var maxSym = t2[0].s;
      for (var i = 1; i < s; ++i) {
        if (t2[i].s > maxSym) maxSym = t2[i].s;
      }
      var tr = new u16(maxSym + 1);
      var mbt = ln(t[i1 - 1], tr, 0);
      if (mbt > mb) {
        var i = 0, dt = 0;
        var lft = mbt - mb, cst = 1 << lft;
        t2.sort(function(a, b) {
          return tr[b.s] - tr[a.s] || a.f - b.f;
        });
        for (;i < s; ++i) {
          var i2_1 = t2[i].s;
          if (tr[i2_1] > mb) {
            dt += cst - (1 << mbt - tr[i2_1]);
            tr[i2_1] = mb;
          } else break;
        }
        dt >>= lft;
        while (dt > 0) {
          var i2_2 = t2[i].s;
          if (tr[i2_2] < mb) dt -= 1 << mb - tr[i2_2]++ - 1; else ++i;
        }
        for (;i >= 0 && dt; --i) {
          var i2_3 = t2[i].s;
          if (tr[i2_3] == mb) {
            --tr[i2_3];
            ++dt;
          }
        }
        mbt = mb;
      }
      return {
        t: new u8(tr),
        l: mbt
      };
    };
    var ln = function(n, l, d) {
      return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
    };
    var lc = function(c) {
      var s = c.length;
      while (s && !c[--s]) ;
      var cl = new u16(++s);
      var cli = 0, cln = c[0], cls = 1;
      var w = function(v) {
        cl[cli++] = v;
      };
      for (var i = 1; i <= s; ++i) {
        if (c[i] == cln && i != s) ++cls; else {
          if (!cln && cls > 2) {
            for (;cls > 138; cls -= 138) w(32754);
            if (cls > 2) {
              w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
              cls = 0;
            }
          } else if (cls > 3) {
            w(cln), --cls;
            for (;cls > 6; cls -= 6) w(8304);
            if (cls > 2) w(cls - 3 << 5 | 8208), cls = 0;
          }
          while (cls--) w(cln);
          cls = 1;
          cln = c[i];
        }
      }
      return {
        c: cl.subarray(0, cli),
        n: s
      };
    };
    var clen = function(cf, cl) {
      var l = 0;
      for (var i = 0; i < cl.length; ++i) l += cf[i] * cl[i];
      return l;
    };
    var wfblk = function(out, pos, dat) {
      var s = dat.length;
      var o = shft(pos + 2);
      out[o] = s & 255;
      out[o + 1] = s >> 8;
      out[o + 2] = out[o] ^ 255;
      out[o + 3] = out[o + 1] ^ 255;
      for (var i = 0; i < s; ++i) out[o + i + 4] = dat[i];
      return (o + 4 + s) * 8;
    };
    var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
      wbits(out, p++, final);
      ++lf[256];
      var _a = hTree(lf, 15), dlt = _a.t, mlb = _a.l;
      var _b = hTree(df, 15), ddt = _b.t, mdb = _b.l;
      var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
      var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
      var lcfreq = new u16(19);
      for (var i = 0; i < lclt.length; ++i) ++lcfreq[lclt[i] & 31];
      for (var i = 0; i < lcdt.length; ++i) ++lcfreq[lcdt[i] & 31];
      var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
      var nlcc = 19;
      for (;nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc) ;
      var flen = bl + 5 << 3;
      var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
      var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
      if (bs >= 0 && flen <= ftlen && flen <= dtlen) return wfblk(out, p, dat.subarray(bs, bs + bl));
      var lm, ll, dm, dl;
      wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
      if (dtlen < ftlen) {
        lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
        var llm = hMap(lct, mlcb, 0);
        wbits(out, p, nlc - 257);
        wbits(out, p + 5, ndc - 1);
        wbits(out, p + 10, nlcc - 4);
        p += 14;
        for (var i = 0; i < nlcc; ++i) wbits(out, p + 3 * i, lct[clim[i]]);
        p += 3 * nlcc;
        var lcts = [ lclt, lcdt ];
        for (var it = 0; it < 2; ++it) {
          var clct = lcts[it];
          for (var i = 0; i < clct.length; ++i) {
            var len = clct[i] & 31;
            wbits(out, p, llm[len]), p += lct[len];
            if (len > 15) wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
          }
        }
      } else {
        lm = flm, ll = flt, dm = fdm, dl = fdt;
      }
      for (var i = 0; i < li; ++i) {
        var sym = syms[i];
        if (sym > 255) {
          var len = sym >> 18 & 31;
          wbits16(out, p, lm[len + 257]), p += ll[len + 257];
          if (len > 7) wbits(out, p, sym >> 23 & 31), p += fleb[len];
          var dst = sym & 31;
          wbits16(out, p, dm[dst]), p += dl[dst];
          if (dst > 3) wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
        } else {
          wbits16(out, p, lm[sym]), p += ll[sym];
        }
      }
      wbits16(out, p, lm[256]);
      return p + ll[256];
    };
    var deo = new i32([ 65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632 ]);
    var et = new u8(0);
    var dflt = function(dat, lvl, plvl, pre, post, st) {
      var s = st.z || dat.length;
      var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
      var w = o.subarray(pre, o.length - post);
      var lst = st.l;
      var pos = (st.r || 0) & 7;
      if (lvl) {
        if (pos) w[0] = st.r >> 3;
        var opt = deo[lvl - 1];
        var n = opt >> 13, c = opt & 8191;
        var msk_1 = (1 << plvl) - 1;
        var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
        var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
        var hsh = function(i) {
          return (dat[i] ^ dat[i + 1] << bs1_1 ^ dat[i + 2] << bs2_1) & msk_1;
        };
        var syms = new i32(25e3);
        var lf = new u16(288), df = new u16(32);
        var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
        for (;i + 2 < s; ++i) {
          var hv = hsh(i);
          var imod = i & 32767, pimod = head[hv];
          prev[imod] = pimod;
          head[hv] = imod;
          if (wi <= i) {
            var rem = s - i;
            if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
              pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
              li = lc_1 = eb = 0, bs = i;
              for (var j = 0; j < 286; ++j) lf[j] = 0;
              for (var j = 0; j < 30; ++j) df[j] = 0;
            }
            var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
            if (rem > 2 && hv == hsh(i - dif)) {
              var maxn = Math.min(n, rem) - 1;
              var maxd = Math.min(32767, i);
              var ml = Math.min(258, rem);
              while (dif <= maxd && --ch_1 && imod != pimod) {
                if (dat[i + l] == dat[i + l - dif]) {
                  var nl = 0;
                  for (;nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl) ;
                  if (nl > l) {
                    l = nl, d = dif;
                    if (nl > maxn) break;
                    var mmd = Math.min(dif, nl - 2);
                    var md = 0;
                    for (var j = 0; j < mmd; ++j) {
                      var ti = i - dif + j & 32767;
                      var pti = prev[ti];
                      var cd = ti - pti & 32767;
                      if (cd > md) md = cd, pimod = ti;
                    }
                  }
                }
                imod = pimod, pimod = prev[imod];
                dif += imod - pimod & 32767;
              }
            }
            if (d) {
              syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
              var lin = revfl[l] & 31, din = revfd[d] & 31;
              eb += fleb[lin] + fdeb[din];
              ++lf[257 + lin];
              ++df[din];
              wi = i + l;
              ++lc_1;
            } else {
              syms[li++] = dat[i];
              ++lf[dat[i]];
            }
          }
        }
        for (i = Math.max(i, wi); i < s; ++i) {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
        pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
        if (!lst) {
          st.r = pos & 7 | w[pos / 8 | 0] << 3;
          pos -= 7;
          st.h = head, st.p = prev, st.i = i, st.w = wi;
        }
      } else {
        for (var i = st.w || 0; i < s + lst; i += 65535) {
          var e = i + 65535;
          if (e >= s) {
            w[pos / 8 | 0] = lst;
            e = s;
          }
          pos = wfblk(w, pos + 1, dat.subarray(i, e));
        }
        st.i = s;
      }
      return slc(o, 0, pre + shft(pos) + post);
    };
    var crct = function() {
      var t = new Int32Array(256);
      for (var i = 0; i < 256; ++i) {
        var c = i, k = 9;
        while (--k) c = (c & 1 && -306674912) ^ c >>> 1;
        t[i] = c;
      }
      return t;
    }();
    var crc = function() {
      var c = -1;
      return {
        p: function(d) {
          var cr = c;
          for (var i = 0; i < d.length; ++i) cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
          c = cr;
        },
        d: function() {
          return ~c;
        }
      };
    };
    var adler = function() {
      var a = 1, b = 0;
      return {
        p: function(d) {
          var n = a, m = b;
          var l = d.length | 0;
          for (var i = 0; i != l; ) {
            var e = Math.min(i + 2655, l);
            for (;i < e; ++i) m += n += d[i];
            n = (n & 65535) + 15 * (n >> 16), m = (m & 65535) + 15 * (m >> 16);
          }
          a = n, b = m;
        },
        d: function() {
          a %= 65521, b %= 65521;
          return (a & 255) << 24 | (a & 65280) << 8 | (b & 255) << 8 | b >> 8;
        }
      };
    };
    var dopt = function(dat, opt, pre, post, st) {
      if (!st) {
        st = {
          l: 1
        };
        if (opt.dictionary) {
          var dict = opt.dictionary.subarray(-32768);
          var newDat = new u8(dict.length + dat.length);
          newDat.set(dict);
          newDat.set(dat, dict.length);
          dat = newDat;
          st.w = dict.length;
        }
      }
      return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
    };
    var mrg = function(a, b) {
      var o = {};
      for (var k in a) o[k] = a[k];
      for (var k in b) o[k] = b[k];
      return o;
    };
    var wcln = function(fn, fnStr, td) {
      var dt = fn();
      var st = fn.toString();
      var ks = st.slice(st.indexOf("[") + 1, st.lastIndexOf("]")).replace(/\s+/g, "").split(",");
      for (var i = 0; i < dt.length; ++i) {
        var v = dt[i], k = ks[i];
        if (typeof v == "function") {
          fnStr += ";" + k + "=";
          var st_1 = v.toString();
          if (v.prototype) {
            if (st_1.indexOf("[native code]") != -1) {
              var spInd = st_1.indexOf(" ", 8) + 1;
              fnStr += st_1.slice(spInd, st_1.indexOf("(", spInd));
            } else {
              fnStr += st_1;
              for (var t in v.prototype) fnStr += ";" + k + ".prototype." + t + "=" + v.prototype[t].toString();
            }
          } else fnStr += st_1;
        } else td[k] = v;
      }
      return fnStr;
    };
    var ch = [];
    var cbfs = function(v) {
      var tl = [];
      for (var k in v) {
        if (v[k].buffer) {
          tl.push((v[k] = new v[k].constructor(v[k])).buffer);
        }
      }
      return tl;
    };
    var wrkr = function(fns, init, id, cb) {
      if (!ch[id]) {
        var fnStr = "", td_1 = {}, m = fns.length - 1;
        for (var i = 0; i < m; ++i) fnStr = wcln(fns[i], fnStr, td_1);
        ch[id] = {
          c: wcln(fns[m], fnStr, td_1),
          e: td_1
        };
      }
      var td = mrg({}, ch[id].e);
      return wk(ch[id].c + ";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=" + init.toString() + "}", id, td, cbfs(td), cb);
    };
    var bInflt = function() {
      return [ u8, u16, i32, fleb, fdeb, clim, fl, fd, flrm, fdrm, rev, ec, hMap, max, bits, bits16, shft, slc, err, inflt, inflateSync, pbf, gopt ];
    };
    var bDflt = function() {
      return [ u8, u16, i32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf ];
    };
    var gze = function() {
      return [ gzh, gzhl, wbytes, crc, crct ];
    };
    var guze = function() {
      return [ gzs, gzl ];
    };
    var zle = function() {
      return [ zlh, wbytes, adler ];
    };
    var zule = function() {
      return [ zls ];
    };
    var pbf = function(msg) {
      return postMessage(msg, [ msg.buffer ]);
    };
    var gopt = function(o) {
      return o && {
        out: o.size && new u8(o.size),
        dictionary: o.dictionary
      };
    };
    var cbify = function(dat, opts, fns, init, id, cb) {
      var w = wrkr(fns, init, id, function(err, dat) {
        w.terminate();
        cb(err, dat);
      });
      w.postMessage([ dat, opts ], opts.consume ? [ dat.buffer ] : []);
      return function() {
        w.terminate();
      };
    };
    var astrm = function(strm) {
      strm.ondata = function(dat, final) {
        return postMessage([ dat, final ], [ dat.buffer ]);
      };
      return function(ev) {
        if (ev.data[0]) {
          strm.push(ev.data[0], ev.data[1]);
          postMessage([ ev.data[0].length ]);
        } else strm.flush(ev.data[1]);
      };
    };
    var astrmify = function(fns, strm, opts, init, id, flush, ext) {
      var t;
      var w = wrkr(fns, init, id, function(err, dat) {
        if (err) w.terminate(), strm.ondata.call(strm, err); else if (!Array.isArray(dat)) ext(dat); else if (dat.length == 1) {
          strm.queuedSize -= dat[0];
          if (strm.ondrain) strm.ondrain(dat[0]);
        } else {
          if (dat[1]) w.terminate();
          strm.ondata.call(strm, err, dat[0], dat[1]);
        }
      });
      w.postMessage(opts);
      strm.queuedSize = 0;
      strm.push = function(d, f) {
        if (!strm.ondata) err(5);
        if (t) strm.ondata(err(4, 0, 1), null, !!f);
        strm.queuedSize += d.length;
        w.postMessage([ d, t = f ], d.buffer instanceof ArrayBuffer ? [ d.buffer ] : []);
      };
      strm.terminate = function() {
        w.terminate();
      };
      if (flush) {
        strm.flush = function(sync) {
          w.postMessage([ 0, sync ]);
        };
      }
    };
    var b2 = function(d, b) {
      return d[b] | d[b + 1] << 8;
    };
    var b4 = function(d, b) {
      return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
    };
    var b8 = function(d, b) {
      return b4(d, b) + b4(d, b + 4) * 4294967296;
    };
    var wbytes = function(d, b, v) {
      for (;v; ++b) d[b] = v, v >>>= 8;
    };
    var gzh = function(c, o) {
      var fn = o.filename;
      c[0] = 31, c[1] = 139, c[2] = 8, c[8] = o.level < 2 ? 4 : o.level == 9 ? 2 : 0, 
      c[9] = 3;
      if (o.mtime != 0) wbytes(c, 4, Math.floor(new Date(o.mtime || Date.now()) / 1e3));
      if (fn) {
        c[3] = 8;
        for (var i = 0; i <= fn.length; ++i) c[i + 10] = fn.charCodeAt(i);
      }
    };
    var gzs = function(d) {
      if (d[0] != 31 || d[1] != 139 || d[2] != 8) err(6, "invalid gzip data");
      var flg = d[3];
      var st = 10;
      if (flg & 4) st += (d[10] | d[11] << 8) + 2;
      for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++]) ;
      return st + (flg & 2);
    };
    var gzl = function(d) {
      var l = d.length;
      return (d[l - 4] | d[l - 3] << 8 | d[l - 2] << 16 | d[l - 1] << 24) >>> 0;
    };
    var gzhl = function(o) {
      return 10 + (o.filename ? o.filename.length + 1 : 0);
    };
    var zlh = function(c, o) {
      var lv = o.level, fl = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
      c[0] = 120, c[1] = fl << 6 | (o.dictionary && 32);
      c[1] |= 31 - (c[0] << 8 | c[1]) % 31;
      if (o.dictionary) {
        var h = adler();
        h.p(o.dictionary);
        wbytes(c, 2, h.d());
      }
    };
    var zls = function(d, dict) {
      if ((d[0] & 15) != 8 || d[0] >> 4 > 7 || (d[0] << 8 | d[1]) % 31) err(6, "invalid zlib data");
      if ((d[1] >> 5 & 1) == +!dict) err(6, "invalid zlib data: " + (d[1] & 32 ? "need" : "unexpected") + " dictionary");
      return (d[1] >> 3 & 4) + 2;
    };
    function StrmOpt(opts, cb) {
      if (typeof opts == "function") cb = opts, opts = {};
      this.ondata = cb;
      return opts;
    }
    var Deflate = function() {
      function Deflate(opts, cb) {
        if (typeof opts == "function") cb = opts, opts = {};
        this.ondata = cb;
        this.o = opts || {};
        this.s = {
          l: 0,
          i: 32768,
          w: 32768,
          z: 32768
        };
        this.b = new u8(98304);
        if (this.o.dictionary) {
          var dict = this.o.dictionary.subarray(-32768);
          this.b.set(dict, 32768 - dict.length);
          this.s.i = 32768 - dict.length;
        }
      }
      Deflate.prototype.p = function(c, f) {
        this.ondata(dopt(c, this.o, 0, 0, this.s), f);
      };
      Deflate.prototype.push = function(chunk, final) {
        if (!this.ondata) err(5);
        if (this.s.l) err(4);
        var endLen = chunk.length + this.s.z;
        if (endLen > this.b.length) {
          if (endLen > 2 * this.b.length - 32768) {
            var newBuf = new u8(endLen & -32768);
            newBuf.set(this.b.subarray(0, this.s.z));
            this.b = newBuf;
          }
          var split = this.b.length - this.s.z;
          this.b.set(chunk.subarray(0, split), this.s.z);
          this.s.z = this.b.length;
          this.p(this.b, false);
          this.b.set(this.b.subarray(-32768));
          this.b.set(chunk.subarray(split), 32768);
          this.s.z = chunk.length - split + 32768;
          this.s.i = 32766, this.s.w = 32768;
        } else {
          this.b.set(chunk, this.s.z);
          this.s.z += chunk.length;
        }
        this.s.l = final & 1;
        if (this.s.z > this.s.w + 8191 || final) {
          this.p(this.b, final || false);
          this.s.w = this.s.i, this.s.i -= 2;
        }
        if (final) {
          this.s = this.o = {};
          this.b = et;
        }
      };
      Deflate.prototype.flush = function(sync) {
        if (!this.ondata) err(5);
        if (this.s.l) err(4);
        this.p(this.b, false);
        this.s.w = this.s.i, this.s.i -= 2;
        if (sync) {
          var c = new u8(6);
          c[0] = this.s.r >> 3;
          var ep = wfblk(c, this.s.r, et);
          this.s.r = 0;
          this.ondata(c.subarray(0, ep >> 3), false);
        }
      };
      return Deflate;
    }();
    var AsyncDeflate = function() {
      function AsyncDeflate(opts, cb) {
        astrmify([ bDflt, function() {
          return [ astrm, Deflate ];
        } ], this, StrmOpt.call(this, opts, cb), function(ev) {
          var strm = new Deflate(ev.data);
          onmessage = astrm(strm);
        }, 6, 1);
      }
      return AsyncDeflate;
    }();
    function deflate(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != "function") err(7);
      return cbify(data, opts, [ bDflt ], function(ev) {
        return pbf(deflateSync(ev.data[0], ev.data[1]));
      }, 0, cb);
    }
    function deflateSync(data, opts) {
      return dopt(data, opts || {}, 0, 0);
    }
    var Inflate = function() {
      function Inflate(opts, cb) {
        if (typeof opts == "function") cb = opts, opts = {};
        this.ondata = cb;
        var dict = opts && opts.dictionary && opts.dictionary.subarray(-32768);
        this.s = {
          i: 0,
          b: dict ? dict.length : 0
        };
        this.o = new u8(32768);
        this.p = new u8(0);
        if (dict) this.o.set(dict);
      }
      Inflate.prototype.e = function(c) {
        if (!this.ondata) err(5);
        if (this.d) err(4);
        if (!this.p.length) this.p = c; else if (c.length) {
          var n = new u8(this.p.length + c.length);
          n.set(this.p), n.set(c, this.p.length), this.p = n;
        }
      };
      Inflate.prototype.c = function(final) {
        this.s.i = +(this.d = final || false);
        var bts = this.s.b;
        var dt = inflt(this.p, this.s, this.o);
        this.ondata(slc(dt, bts, this.s.b), this.d);
        this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
        this.p = slc(this.p, this.s.p / 8 | 0), this.s.p &= 7;
      };
      Inflate.prototype.push = function(chunk, final) {
        this.e(chunk), this.c(final);
      };
      return Inflate;
    }();
    var AsyncInflate = function() {
      function AsyncInflate(opts, cb) {
        astrmify([ bInflt, function() {
          return [ astrm, Inflate ];
        } ], this, StrmOpt.call(this, opts, cb), function(ev) {
          var strm = new Inflate(ev.data);
          onmessage = astrm(strm);
        }, 7, 0);
      }
      return AsyncInflate;
    }();
    function inflate(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != "function") err(7);
      return cbify(data, opts, [ bInflt ], function(ev) {
        return pbf(inflateSync(ev.data[0], gopt(ev.data[1])));
      }, 1, cb);
    }
    function inflateSync(data, opts) {
      return inflt(data, {
        i: 2
      }, opts && opts.out, opts && opts.dictionary);
    }
    var Gzip = function() {
      function Gzip(opts, cb) {
        this.c = crc();
        this.l = 0;
        this.v = 1;
        Deflate.call(this, opts, cb);
      }
      Gzip.prototype.push = function(chunk, final) {
        this.c.p(chunk);
        this.l += chunk.length;
        Deflate.prototype.push.call(this, chunk, final);
      };
      Gzip.prototype.p = function(c, f) {
        var raw = dopt(c, this.o, this.v && gzhl(this.o), f && 8, this.s);
        if (this.v) gzh(raw, this.o), this.v = 0;
        if (f) wbytes(raw, raw.length - 8, this.c.d()), wbytes(raw, raw.length - 4, this.l);
        this.ondata(raw, f);
      };
      Gzip.prototype.flush = function(sync) {
        Deflate.prototype.flush.call(this, sync);
      };
      return Gzip;
    }();
    var AsyncGzip = function() {
      function AsyncGzip(opts, cb) {
        astrmify([ bDflt, gze, function() {
          return [ astrm, Deflate, Gzip ];
        } ], this, StrmOpt.call(this, opts, cb), function(ev) {
          var strm = new Gzip(ev.data);
          onmessage = astrm(strm);
        }, 8, 1);
      }
      return AsyncGzip;
    }();
    function gzip(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != "function") err(7);
      return cbify(data, opts, [ bDflt, gze, function() {
        return [ gzipSync ];
      } ], function(ev) {
        return pbf(gzipSync(ev.data[0], ev.data[1]));
      }, 2, cb);
    }
    function gzipSync(data, opts) {
      if (!opts) opts = {};
      var c = crc(), l = data.length;
      c.p(data);
      var d = dopt(data, opts, gzhl(opts), 8), s = d.length;
      return gzh(d, opts), wbytes(d, s - 8, c.d()), wbytes(d, s - 4, l), d;
    }
    var Gunzip = function() {
      function Gunzip(opts, cb) {
        this.v = 1;
        this.r = 0;
        Inflate.call(this, opts, cb);
      }
      Gunzip.prototype.push = function(chunk, final) {
        Inflate.prototype.e.call(this, chunk);
        this.r += chunk.length;
        if (this.v) {
          var p = this.p.subarray(this.v - 1);
          var s = p.length > 3 ? gzs(p) : 4;
          if (s > p.length) {
            if (!final) return;
          } else if (this.v > 1 && this.onmember) {
            this.onmember(this.r - p.length);
          }
          this.p = p.subarray(s), this.v = 0;
        }
        Inflate.prototype.c.call(this, 0);
        if (this.s.f && !this.s.l) {
          this.v = shft(this.s.p) + 9;
          this.s = {
            i: 0
          };
          this.o = new u8(0);
          this.push(new u8(0), final);
        } else if (final) {
          Inflate.prototype.c.call(this, final);
        }
      };
      return Gunzip;
    }();
    var AsyncGunzip = function() {
      function AsyncGunzip(opts, cb) {
        var _this = this;
        astrmify([ bInflt, guze, function() {
          return [ astrm, Inflate, Gunzip ];
        } ], this, StrmOpt.call(this, opts, cb), function(ev) {
          var strm = new Gunzip(ev.data);
          strm.onmember = function(offset) {
            return postMessage(offset);
          };
          onmessage = astrm(strm);
        }, 9, 0, function(offset) {
          return _this.onmember && _this.onmember(offset);
        });
      }
      return AsyncGunzip;
    }();
    function gunzip(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != "function") err(7);
      return cbify(data, opts, [ bInflt, guze, function() {
        return [ gunzipSync ];
      } ], function(ev) {
        return pbf(gunzipSync(ev.data[0], ev.data[1]));
      }, 3, cb);
    }
    function gunzipSync(data, opts) {
      var st = gzs(data);
      if (st + 8 > data.length) err(6, "invalid gzip data");
      return inflt(data.subarray(st, -8), {
        i: 2
      }, opts && opts.out || new u8(gzl(data)), opts && opts.dictionary);
    }
    var Zlib = function() {
      function Zlib(opts, cb) {
        this.c = adler();
        this.v = 1;
        Deflate.call(this, opts, cb);
      }
      Zlib.prototype.push = function(chunk, final) {
        this.c.p(chunk);
        Deflate.prototype.push.call(this, chunk, final);
      };
      Zlib.prototype.p = function(c, f) {
        var raw = dopt(c, this.o, this.v && (this.o.dictionary ? 6 : 2), f && 4, this.s);
        if (this.v) zlh(raw, this.o), this.v = 0;
        if (f) wbytes(raw, raw.length - 4, this.c.d());
        this.ondata(raw, f);
      };
      Zlib.prototype.flush = function(sync) {
        Deflate.prototype.flush.call(this, sync);
      };
      return Zlib;
    }();
    var AsyncZlib = function() {
      function AsyncZlib(opts, cb) {
        astrmify([ bDflt, zle, function() {
          return [ astrm, Deflate, Zlib ];
        } ], this, StrmOpt.call(this, opts, cb), function(ev) {
          var strm = new Zlib(ev.data);
          onmessage = astrm(strm);
        }, 10, 1);
      }
      return AsyncZlib;
    }();
    function zlib(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != "function") err(7);
      return cbify(data, opts, [ bDflt, zle, function() {
        return [ zlibSync ];
      } ], function(ev) {
        return pbf(zlibSync(ev.data[0], ev.data[1]));
      }, 4, cb);
    }
    function zlibSync(data, opts) {
      if (!opts) opts = {};
      var a = adler();
      a.p(data);
      var d = dopt(data, opts, opts.dictionary ? 6 : 2, 4);
      return zlh(d, opts), wbytes(d, d.length - 4, a.d()), d;
    }
    var Unzlib = function() {
      function Unzlib(opts, cb) {
        Inflate.call(this, opts, cb);
        this.v = opts && opts.dictionary ? 2 : 1;
      }
      Unzlib.prototype.push = function(chunk, final) {
        Inflate.prototype.e.call(this, chunk);
        if (this.v) {
          if (this.p.length < 6 && !final) return;
          this.p = this.p.subarray(zls(this.p, this.v - 1)), this.v = 0;
        }
        if (final) {
          if (this.p.length < 4) err(6, "invalid zlib data");
          this.p = this.p.subarray(0, -4);
        }
        Inflate.prototype.c.call(this, final);
      };
      return Unzlib;
    }();
    var AsyncUnzlib = function() {
      function AsyncUnzlib(opts, cb) {
        astrmify([ bInflt, zule, function() {
          return [ astrm, Inflate, Unzlib ];
        } ], this, StrmOpt.call(this, opts, cb), function(ev) {
          var strm = new Unzlib(ev.data);
          onmessage = astrm(strm);
        }, 11, 0);
      }
      return AsyncUnzlib;
    }();
    function unzlib(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != "function") err(7);
      return cbify(data, opts, [ bInflt, zule, function() {
        return [ unzlibSync ];
      } ], function(ev) {
        return pbf(unzlibSync(ev.data[0], gopt(ev.data[1])));
      }, 5, cb);
    }
    function unzlibSync(data, opts) {
      return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), {
        i: 2
      }, opts && opts.out, opts && opts.dictionary);
    }
    var Decompress = function() {
      function Decompress(opts, cb) {
        this.o = StrmOpt.call(this, opts, cb) || {};
        this.G = Gunzip;
        this.I = Inflate;
        this.Z = Unzlib;
      }
      Decompress.prototype.i = function() {
        var _this = this;
        this.s.ondata = function(dat, final) {
          _this.ondata(dat, final);
        };
      };
      Decompress.prototype.push = function(chunk, final) {
        if (!this.ondata) err(5);
        if (!this.s) {
          if (this.p && this.p.length) {
            var n = new u8(this.p.length + chunk.length);
            n.set(this.p), n.set(chunk, this.p.length);
          } else this.p = chunk;
          if (this.p.length > 2) {
            this.s = this.p[0] == 31 && this.p[1] == 139 && this.p[2] == 8 ? new this.G(this.o) : (this.p[0] & 15) != 8 || this.p[0] >> 4 > 7 || (this.p[0] << 8 | this.p[1]) % 31 ? new this.I(this.o) : new this.Z(this.o);
            this.i();
            this.s.push(this.p, final);
            this.p = null;
          }
        } else this.s.push(chunk, final);
      };
      return Decompress;
    }();
    var AsyncDecompress = function() {
      function AsyncDecompress(opts, cb) {
        Decompress.call(this, opts, cb);
        this.queuedSize = 0;
        this.G = AsyncGunzip;
        this.I = AsyncInflate;
        this.Z = AsyncUnzlib;
      }
      AsyncDecompress.prototype.i = function() {
        var _this = this;
        this.s.ondata = function(err, dat, final) {
          _this.ondata(err, dat, final);
        };
        this.s.ondrain = function(size) {
          _this.queuedSize -= size;
          if (_this.ondrain) _this.ondrain(size);
        };
      };
      AsyncDecompress.prototype.push = function(chunk, final) {
        this.queuedSize += chunk.length;
        Decompress.prototype.push.call(this, chunk, final);
      };
      return AsyncDecompress;
    }();
    function decompress(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != "function") err(7);
      return data[0] == 31 && data[1] == 139 && data[2] == 8 ? gunzip(data, opts, cb) : (data[0] & 15) != 8 || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? inflate(data, opts, cb) : unzlib(data, opts, cb);
    }
    function decompressSync(data, opts) {
      return data[0] == 31 && data[1] == 139 && data[2] == 8 ? gunzipSync(data, opts) : (data[0] & 15) != 8 || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? inflateSync(data, opts) : unzlibSync(data, opts);
    }
    var fltn = function(d, p, t, o) {
      for (var k in d) {
        var val = d[k], n = p + k, op = o;
        if (Array.isArray(val)) op = mrg(o, val[1]), val = val[0];
        if (ArrayBuffer.isView(val)) t[n] = [ val, op ]; else {
          t[n += "/"] = [ new u8(0), op ];
          fltn(val, n, t, o);
        }
      }
    };
    var te = typeof TextEncoder != "undefined" && new TextEncoder;
    var td = typeof TextDecoder != "undefined" && new TextDecoder;
    var tds = 0;
    try {
      td.decode(et, {
        stream: true
      });
      tds = 1;
    } catch (e) {}
    var dutf8 = function(d) {
      for (var r = "", i = 0; ;) {
        var c = d[i++];
        var eb = (c > 127) + (c > 223) + (c > 239);
        if (i + eb > d.length) return {
          s: r,
          r: slc(d, i - 1)
        };
        if (!eb) r += String.fromCharCode(c); else if (eb == 3) {
          c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, 
          r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
        } else if (eb & 1) r += String.fromCharCode((c & 31) << 6 | d[i++] & 63); else r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
      }
    };
    var DecodeUTF8 = function() {
      function DecodeUTF8(cb) {
        this.ondata = cb;
        if (tds) this.t = new TextDecoder; else this.p = et;
      }
      DecodeUTF8.prototype.push = function(chunk, final) {
        if (!this.ondata) err(5);
        final = !!final;
        if (this.t) {
          this.ondata(this.t.decode(chunk, {
            stream: true
          }), final);
          if (final) {
            if (this.t.decode().length) err(8);
            this.t = null;
          }
          return;
        }
        if (!this.p) err(4);
        var dat = new u8(this.p.length + chunk.length);
        dat.set(this.p);
        dat.set(chunk, this.p.length);
        var _a = dutf8(dat), s = _a.s, r = _a.r;
        if (final) {
          if (r.length) err(8);
          this.p = null;
        } else this.p = r;
        this.ondata(s, final);
      };
      return DecodeUTF8;
    }();
    var EncodeUTF8 = function() {
      function EncodeUTF8(cb) {
        this.ondata = cb;
      }
      EncodeUTF8.prototype.push = function(chunk, final) {
        if (!this.ondata) err(5);
        if (this.d) err(4);
        this.ondata(strToU8(chunk), this.d = final || false);
      };
      return EncodeUTF8;
    }();
    function strToU8(str, latin1) {
      if (latin1) {
        var ar_1 = new u8(str.length);
        for (var i = 0; i < str.length; ++i) ar_1[i] = str.charCodeAt(i);
        return ar_1;
      }
      if (te) return te.encode(str);
      var l = str.length;
      var ar = new u8(str.length + (str.length >> 1));
      var ai = 0;
      var w = function(v) {
        ar[ai++] = v;
      };
      for (var i = 0; i < l; ++i) {
        if (ai + 5 > ar.length) {
          var n = new u8(ai + 8 + (l - i << 1));
          n.set(ar);
          ar = n;
        }
        var c = str.charCodeAt(i);
        if (c < 128 || latin1) w(c); else if (c < 2048) w(192 | c >> 6), w(128 | c & 63); else if (c > 55295 && c < 57344) c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, 
        w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63); else w(224 | c >> 12), 
        w(128 | c >> 6 & 63), w(128 | c & 63);
      }
      return slc(ar, 0, ai);
    }
    function strFromU8(dat, latin1) {
      if (latin1) {
        var r = "";
        for (var i = 0; i < dat.length; i += 16384) r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
        return r;
      } else if (td) {
        return td.decode(dat);
      } else {
        var _a = dutf8(dat), s = _a.s, r = _a.r;
        if (r.length) err(8);
        return s;
      }
    }
    var dbf = function(l) {
      return l == 1 ? 3 : l < 6 ? 2 : l == 9 ? 1 : 0;
    };
    var slzh = function(d, b) {
      return b + 30 + b2(d, b + 26) + b2(d, b + 28);
    };
    var zh = function(d, b, z) {
      var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
      var _a = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a[0], su = _a[1], off = _a[2];
      return [ b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off ];
    };
    var z64hs = function(d, b, l, z, sc, su, off) {
      var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
      var nf = nsc + nsu + noff;
      if (z && nf) {
        for (;b + 4 < e; b += 4 + b2(d, b + 2)) {
          if (b2(d, b) == 1) {
            return [ nsc ? b8(d, b + 4 + 8 * nsu) : sc, nsu ? b8(d, b + 4) : su, noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off, 1 ];
          }
        }
        if (z < 2) err(13);
      }
      return [ sc, su, off, 0 ];
    };
    var exfl = function(ex) {
      var le = 0;
      if (ex) {
        for (var k in ex) {
          var l = ex[k].length;
          if (l > 65535) err(9);
          le += l + 4;
        }
      }
      return le;
    };
    var wzh = function(d, b, f, fn, u, c, ce, co) {
      var fl = fn.length, ex = f.extra, col = co && co.length;
      var exl = exfl(ex);
      wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
      if (ce != null) d[b++] = 20, d[b++] = f.os;
      d[b] = 20, b += 2;
      d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
      d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
      var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
      if (y < 0 || y > 119) err(10);
      wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), 
      b += 4;
      if (c != -1) {
        wbytes(d, b, f.crc);
        wbytes(d, b + 4, c < 0 ? -c - 2 : c);
        wbytes(d, b + 8, f.size);
      }
      wbytes(d, b + 12, fl);
      wbytes(d, b + 14, exl), b += 16;
      if (ce != null) {
        wbytes(d, b, col);
        wbytes(d, b + 6, f.attrs);
        wbytes(d, b + 10, ce), b += 14;
      }
      d.set(fn, b);
      b += fl;
      if (exl) {
        for (var k in ex) {
          var exf = ex[k], l = exf.length;
          wbytes(d, b, +k);
          wbytes(d, b + 2, l);
          d.set(exf, b + 4), b += 4 + l;
        }
      }
      if (col) d.set(co, b), b += col;
      return b;
    };
    var wzf = function(o, b, c, d, e) {
      wbytes(o, b, 101010256);
      wbytes(o, b + 8, c);
      wbytes(o, b + 10, c);
      wbytes(o, b + 12, d);
      wbytes(o, b + 16, e);
    };
    var ZipPassThrough = function() {
      function ZipPassThrough(filename) {
        this.filename = filename;
        this.c = crc();
        this.size = 0;
        this.compression = 0;
      }
      ZipPassThrough.prototype.process = function(chunk, final) {
        this.ondata(null, chunk, final);
      };
      ZipPassThrough.prototype.push = function(chunk, final) {
        if (!this.ondata) err(5);
        this.c.p(chunk);
        this.size += chunk.length;
        if (final) this.crc = this.c.d();
        this.process(chunk, final || false);
      };
      return ZipPassThrough;
    }();
    var ZipDeflate = function() {
      function ZipDeflate(filename, opts) {
        var _this = this;
        if (!opts) opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new Deflate(opts, function(dat, final) {
          _this.ondata(null, dat, final);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
      }
      ZipDeflate.prototype.process = function(chunk, final) {
        try {
          this.d.push(chunk, final);
        } catch (e) {
          this.ondata(e, null, final);
        }
      };
      ZipDeflate.prototype.push = function(chunk, final) {
        ZipPassThrough.prototype.push.call(this, chunk, final);
      };
      return ZipDeflate;
    }();
    var AsyncZipDeflate = function() {
      function AsyncZipDeflate(filename, opts) {
        var _this = this;
        if (!opts) opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new AsyncDeflate(opts, function(err, dat, final) {
          _this.ondata(err, dat, final);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
        this.terminate = this.d.terminate;
      }
      AsyncZipDeflate.prototype.process = function(chunk, final) {
        this.d.push(chunk, final);
      };
      AsyncZipDeflate.prototype.push = function(chunk, final) {
        ZipPassThrough.prototype.push.call(this, chunk, final);
      };
      return AsyncZipDeflate;
    }();
    var Zip = function() {
      function Zip(cb) {
        this.ondata = cb;
        this.u = [];
        this.d = 1;
      }
      Zip.prototype.add = function(file) {
        var _this = this;
        if (!this.ondata) err(5);
        if (this.d & 2) this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, false); else {
          var f = strToU8(file.filename), fl_1 = f.length;
          var com = file.comment, o = com && strToU8(com);
          var u = fl_1 != file.filename.length || o && com.length != o.length;
          var hl_1 = fl_1 + exfl(file.extra) + 30;
          if (fl_1 > 65535) this.ondata(err(11, 0, 1), null, false);
          var header = new u8(hl_1);
          wzh(header, 0, file, f, u, -1);
          var chks_1 = [ header ];
          var pAll_1 = function() {
            for (var _i = 0, chks_2 = chks_1; _i < chks_2.length; _i++) {
              var chk = chks_2[_i];
              _this.ondata(null, chk, false);
            }
            chks_1 = [];
          };
          var tr_1 = this.d;
          this.d = 0;
          var ind_1 = this.u.length;
          var uf_1 = mrg(file, {
            f,
            u,
            o,
            t: function() {
              if (file.terminate) file.terminate();
            },
            r: function() {
              pAll_1();
              if (tr_1) {
                var nxt = _this.u[ind_1 + 1];
                if (nxt) nxt.r(); else _this.d = 1;
              }
              tr_1 = 1;
            }
          });
          var cl_1 = 0;
          file.ondata = function(err, dat, final) {
            if (err) {
              _this.ondata(err, dat, final);
              _this.terminate();
            } else {
              cl_1 += dat.length;
              chks_1.push(dat);
              if (final) {
                var dd = new u8(16);
                wbytes(dd, 0, 134695760);
                wbytes(dd, 4, file.crc);
                wbytes(dd, 8, cl_1);
                wbytes(dd, 12, file.size);
                chks_1.push(dd);
                uf_1.c = cl_1, uf_1.b = hl_1 + cl_1 + 16, uf_1.crc = file.crc, uf_1.size = file.size;
                if (tr_1) uf_1.r();
                tr_1 = 1;
              } else if (tr_1) pAll_1();
            }
          };
          this.u.push(uf_1);
        }
      };
      Zip.prototype.end = function() {
        var _this = this;
        if (this.d & 2) {
          this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, true);
          return;
        }
        if (this.d) this.e(); else this.u.push({
          r: function() {
            if (!(_this.d & 1)) return;
            _this.u.splice(-1, 1);
            _this.e();
          },
          t: function() {}
        });
        this.d = 3;
      };
      Zip.prototype.e = function() {
        var bt = 0, l = 0, tl = 0;
        for (var _i = 0, _a = this.u; _i < _a.length; _i++) {
          var f = _a[_i];
          tl += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0);
        }
        var out = new u8(tl + 22);
        for (var _b = 0, _c = this.u; _b < _c.length; _b++) {
          var f = _c[_b];
          wzh(out, bt, f, f.f, f.u, -f.c - 2, l, f.o);
          bt += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0), l += f.b;
        }
        wzf(out, bt, this.u.length, tl, l);
        this.ondata(null, out, true);
        this.d = 2;
      };
      Zip.prototype.terminate = function() {
        for (var _i = 0, _a = this.u; _i < _a.length; _i++) {
          var f = _a[_i];
          f.t();
        }
        this.d = 2;
      };
      return Zip;
    }();
    function zip(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != "function") err(7);
      var r = {};
      fltn(data, "", r, opts);
      var k = Object.keys(r);
      var lft = k.length, o = 0, tot = 0;
      var slft = lft, files = new Array(lft);
      var term = [];
      var tAll = function() {
        for (var i = 0; i < term.length; ++i) term[i]();
      };
      var cbd = function(a, b) {
        mt(function() {
          cb(a, b);
        });
      };
      mt(function() {
        cbd = cb;
      });
      var cbf = function() {
        var out = new u8(tot + 22), oe = o, cdl = tot - o;
        tot = 0;
        for (var i = 0; i < slft; ++i) {
          var f = files[i];
          try {
            var l = f.c.length;
            wzh(out, tot, f, f.f, f.u, l);
            var badd = 30 + f.f.length + exfl(f.extra);
            var loc = tot + badd;
            out.set(f.c, loc);
            wzh(out, o, f, f.f, f.u, l, tot, f.m), o += 16 + badd + (f.m ? f.m.length : 0), 
            tot = loc + l;
          } catch (e) {
            return cbd(e, null);
          }
        }
        wzf(out, o, files.length, cdl, oe);
        cbd(null, out);
      };
      if (!lft) cbf();
      var _loop_1 = function(i) {
        var fn = k[i];
        var _a = r[fn], file = _a[0], p = _a[1];
        var c = crc(), size = file.length;
        c.p(file);
        var f = strToU8(fn), s = f.length;
        var com = p.comment, m = com && strToU8(com), ms = m && m.length;
        var exl = exfl(p.extra);
        var compression = p.level == 0 ? 0 : 8;
        var cbl = function(e, d) {
          if (e) {
            tAll();
            cbd(e, null);
          } else {
            var l = d.length;
            files[i] = mrg(p, {
              size,
              crc: c.d(),
              c: d,
              f,
              m,
              u: s != fn.length || m && com.length != ms,
              compression
            });
            o += 30 + s + exl + l;
            tot += 76 + 2 * (s + exl) + (ms || 0) + l;
            if (! --lft) cbf();
          }
        };
        if (s > 65535) cbl(err(11, 0, 1), null);
        if (!compression) cbl(null, file); else if (size < 16e4) {
          try {
            cbl(null, deflateSync(file, p));
          } catch (e) {
            cbl(e, null);
          }
        } else term.push(deflate(file, p, cbl));
      };
      for (var i = 0; i < slft; ++i) {
        _loop_1(i);
      }
      return tAll;
    }
    function zipSync(data, opts) {
      if (!opts) opts = {};
      var r = {};
      var files = [];
      fltn(data, "", r, opts);
      var o = 0;
      var tot = 0;
      for (var fn in r) {
        var _a = r[fn], file = _a[0], p = _a[1];
        var compression = p.level == 0 ? 0 : 8;
        var f = strToU8(fn), s = f.length;
        var com = p.comment, m = com && strToU8(com), ms = m && m.length;
        var exl = exfl(p.extra);
        if (s > 65535) err(11);
        var d = compression ? deflateSync(file, p) : file, l = d.length;
        var c = crc();
        c.p(file);
        files.push(mrg(p, {
          size: file.length,
          crc: c.d(),
          c: d,
          f,
          m,
          u: s != fn.length || m && com.length != ms,
          o,
          compression
        }));
        o += 30 + s + exl + l;
        tot += 76 + 2 * (s + exl) + (ms || 0) + l;
      }
      var out = new u8(tot + 22), oe = o, cdl = tot - o;
      for (var i = 0; i < files.length; ++i) {
        var f = files[i];
        wzh(out, f.o, f, f.f, f.u, f.c.length);
        var badd = 30 + f.f.length + exfl(f.extra);
        out.set(f.c, f.o + badd);
        wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
      }
      wzf(out, o, files.length, cdl, oe);
      return out;
    }
    var UnzipPassThrough = function() {
      function UnzipPassThrough() {}
      UnzipPassThrough.prototype.push = function(chunk, final) {
        this.ondata(null, chunk, final);
      };
      UnzipPassThrough.compression = 0;
      return UnzipPassThrough;
    }();
    var UnzipInflate = function() {
      function UnzipInflate() {
        var _this = this;
        this.i = new Inflate(function(dat, final) {
          _this.ondata(null, dat, final);
        });
      }
      UnzipInflate.prototype.push = function(chunk, final) {
        try {
          this.i.push(chunk, final);
        } catch (e) {
          this.ondata(e, null, final);
        }
      };
      UnzipInflate.compression = 8;
      return UnzipInflate;
    }();
    var AsyncUnzipInflate = function() {
      function AsyncUnzipInflate(_, sz) {
        var _this = this;
        if (sz < 32e4) {
          this.i = new Inflate(function(dat, final) {
            _this.ondata(null, dat, final);
          });
        } else {
          this.i = new AsyncInflate(function(err, dat, final) {
            _this.ondata(err, dat, final);
          });
          this.terminate = this.i.terminate;
        }
      }
      AsyncUnzipInflate.prototype.push = function(chunk, final) {
        if (this.i.terminate) chunk = slc(chunk, 0);
        this.i.push(chunk, final);
      };
      AsyncUnzipInflate.compression = 8;
      return AsyncUnzipInflate;
    }();
    var Unzip = function() {
      function Unzip(cb) {
        this.onfile = cb;
        this.k = [];
        this.o = {
          0: UnzipPassThrough
        };
        this.p = et;
      }
      Unzip.prototype.push = function(chunk, final) {
        var _this = this;
        if (!this.onfile) err(5);
        if (!this.p) err(4);
        if (this.c > 0) {
          var len = Math.min(this.c, chunk.length);
          var toAdd = chunk.subarray(0, len);
          this.c -= len;
          if (this.d) this.d.push(toAdd, !this.c); else this.k[0].push(toAdd);
          chunk = chunk.subarray(len);
          if (chunk.length) return this.push(chunk, final);
        } else {
          var f = 0, i = 0, is = void 0, buf = void 0;
          if (!this.p.length) buf = chunk; else if (!chunk.length) buf = this.p; else {
            buf = new u8(this.p.length + chunk.length);
            buf.set(this.p), buf.set(chunk, this.p.length);
          }
          var l = buf.length, oc = this.c, add = oc && this.d;
          var _loop_2 = function() {
            var sig = b4(buf, i);
            if (sig == 67324752) {
              f = 1, is = i;
              this_1.d = null;
              this_1.c = 0;
              var bf = b2(buf, i + 6), cmp_1 = b2(buf, i + 8), u = bf & 2048, dd = bf & 8, fnl = b2(buf, i + 26), es = b2(buf, i + 28);
              if (l > i + 30 + fnl + es) {
                var chks_3 = [];
                this_1.k.unshift(chks_3);
                f = 2;
                var lsc = b4(buf, i + 18), lsu = b4(buf, i + 22);
                var fn_1 = strFromU8(buf.subarray(i + 30, i += 30 + fnl), !u);
                var _a = z64hs(buf, i, es, 2, lsc, lsu, 0), sc_1 = _a[0], su_1 = _a[1], z64 = _a[3];
                if (dd) sc_1 = -1 - z64;
                i += es;
                this_1.c = sc_1;
                var d_1;
                var file_1 = {
                  name: fn_1,
                  compression: cmp_1,
                  start: function() {
                    if (!file_1.ondata) err(5);
                    if (!sc_1) file_1.ondata(null, et, true); else {
                      var ctr = _this.o[cmp_1];
                      if (!ctr) file_1.ondata(err(14, "unknown compression type " + cmp_1, 1), null, false);
                      d_1 = sc_1 < 0 ? new ctr(fn_1) : new ctr(fn_1, sc_1, su_1);
                      d_1.ondata = function(err, dat, final) {
                        file_1.ondata(err, dat, final);
                      };
                      for (var _i = 0, chks_4 = chks_3; _i < chks_4.length; _i++) {
                        var dat = chks_4[_i];
                        d_1.push(dat, false);
                      }
                      if (_this.k[0] == chks_3 && _this.c) _this.d = d_1; else d_1.push(et, true);
                    }
                  },
                  terminate: function() {
                    if (d_1 && d_1.terminate) d_1.terminate();
                  }
                };
                if (sc_1 >= 0) file_1.size = sc_1, file_1.originalSize = su_1;
                this_1.onfile(file_1);
              }
              return "break";
            } else if (oc) {
              if (sig == 134695760) {
                is = i += 12 + (oc == -2 && 8), f = 3, this_1.c = 0;
                return "break";
              } else if (sig == 33639248) {
                is = i -= 4, f = 3, this_1.c = 0;
                return "break";
              }
            }
          };
          var this_1 = this;
          for (;i < l - 4; ++i) {
            var state_1 = _loop_2();
            if (state_1 === "break") break;
          }
          this.p = et;
          if (oc < 0) {
            var dat = f ? buf.subarray(0, is - 12 - (oc == -2 && 8) - (b4(buf, is - 16) == 134695760 && 4)) : buf.subarray(0, i);
            if (add) add.push(dat, !!f); else this.k[+(f == 2)].push(dat);
          }
          if (f & 2) return this.push(buf.subarray(i), final);
          this.p = buf.subarray(i);
        }
        if (final) {
          if (this.c) err(13);
          this.p = null;
        }
      };
      Unzip.prototype.register = function(decoder) {
        this.o[decoder.compression] = decoder;
      };
      return Unzip;
    }();
    var mt = typeof queueMicrotask == "function" ? queueMicrotask : typeof setTimeout == "function" ? setTimeout : function(fn) {
      fn();
    };
    function unzip(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != "function") err(7);
      var term = [];
      var tAll = function() {
        for (var i = 0; i < term.length; ++i) term[i]();
      };
      var files = {};
      var cbd = function(a, b) {
        mt(function() {
          cb(a, b);
        });
      };
      mt(function() {
        cbd = cb;
      });
      var e = data.length - 22;
      for (;b4(data, e) != 101010256; --e) {
        if (!e || data.length - e > 65558) {
          cbd(err(13, 0, 1), null);
          return tAll;
        }
      }
      var lft = b2(data, e + 8);
      if (lft) {
        var c = lft;
        var o = b4(data, e + 16);
        var z = b4(data, e - 20) == 117853008;
        if (z) {
          var ze = b4(data, e - 12);
          z = b4(data, ze) == 101075792;
          if (z) {
            c = lft = b4(data, ze + 32);
            o = b4(data, ze + 48);
          }
        }
        var fltr = opts && opts.filter;
        var _loop_3 = function(i) {
          var _a = zh(data, o, z), c_1 = _a[0], sc = _a[1], su = _a[2], fn = _a[3], no = _a[4], off = _a[5], b = slzh(data, off);
          o = no;
          var cbl = function(e, d) {
            if (e) {
              tAll();
              cbd(e, null);
            } else {
              if (d) files[fn] = d;
              if (! --lft) cbd(null, files);
            }
          };
          if (!fltr || fltr({
            name: fn,
            size: sc,
            originalSize: su,
            compression: c_1
          })) {
            if (!c_1) cbl(null, slc(data, b, b + sc)); else if (c_1 == 8) {
              var infl = data.subarray(b, b + sc);
              if (su < 524288 || sc > .8 * su) {
                try {
                  cbl(null, inflateSync(infl, {
                    out: new u8(su)
                  }));
                } catch (e) {
                  cbl(e, null);
                }
              } else term.push(inflate(infl, {
                size: su
              }, cbl));
            } else cbl(err(14, "unknown compression type " + c_1, 1), null);
          } else cbl(null, null);
        };
        for (var i = 0; i < c; ++i) {
          _loop_3(i);
        }
      } else cbd(null, {});
      return tAll;
    }
    function unzipSync(data, opts) {
      var files = {};
      var e = data.length - 22;
      for (;b4(data, e) != 101010256; --e) {
        if (!e || data.length - e > 65558) err(13);
      }
      var c = b2(data, e + 8);
      if (!c) return {};
      var o = b4(data, e + 16);
      var z = b4(data, e - 20) == 117853008;
      if (z) {
        var ze = b4(data, e - 12);
        z = b4(data, ze) == 101075792;
        if (z) {
          c = b4(data, ze + 32);
          o = b4(data, ze + 48);
        }
      }
      var fltr = opts && opts.filter;
      for (var i = 0; i < c; ++i) {
        var _a = zh(data, o, z), c_2 = _a[0], sc = _a[1], su = _a[2], fn = _a[3], no = _a[4], off = _a[5], b = slzh(data, off);
        o = no;
        if (!fltr || fltr({
          name: fn,
          size: sc,
          originalSize: su,
          compression: c_2
        })) {
          if (!c_2) files[fn] = slc(data, b, b + sc); else if (c_2 == 8) files[fn] = inflateSync(data.subarray(b, b + sc), {
            out: new u8(su)
          }); else err(14, "unknown compression type " + c_2);
        }
      }
      return files;
    }
  },
  "./src/角色卡管理器/filters.ts"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      filterCharacters: () => filterCharacters,
      getFilterCount: () => getFilterCount,
      getFilterCounts: () => getFilterCounts,
      sortCharacters: () => sortCharacters
    });
    function filterCharacters(characters, query, filter, activeTagIds = [], tagFilterMode = "exclusive") {
      const keyword = query.trim().toLocaleLowerCase("zh-CN");
      return characters.filter(character => {
        if (!matchesFilter(character, filter)) return false;
        if (!matchesTags(character, activeTagIds, tagFilterMode)) return false;
        if (!keyword) return true;
        return getSearchText(character).toLocaleLowerCase("zh-CN").includes(keyword);
      });
    }
    function sortCharacters(characters, sortBy) {
      return [ ...characters ].sort((lhs, rhs) => {
        if (sortBy === "name") {
          return lhs.name.localeCompare(rhs.name, "zh-CN");
        }
        return (rhs[sortBy] || 0) - (lhs[sortBy] || 0);
      });
    }
    function getFilterCount(characters, filter) {
      return characters.filter(character => matchesFilter(character, filter)).length;
    }
    function getFilterCounts(characters) {
      const counts = {
        all: characters.length,
        favorite: 0,
        worldBook: 0,
        missingGreeting: 0,
        untagged: 0,
        error: 0
      };
      characters.forEach(character => {
        if (matchesFilter(character, "favorite")) counts.favorite += 1;
        if (matchesFilter(character, "worldBook")) counts.worldBook += 1;
        if (matchesFilter(character, "missingGreeting")) counts.missingGreeting += 1;
        if (matchesFilter(character, "untagged")) counts.untagged += 1;
        if (matchesFilter(character, "error")) counts.error += 1;
      });
      return counts;
    }
    function matchesFilter(character, filter) {
      if (filter === "favorite") return character.fav;
      if (filter === "worldBook") return Boolean(character.character_book);
      if (filter === "missingGreeting") return !character.firstMes;
      if (filter === "untagged") return character.tagIds.length === 0;
      if (filter === "error") return character.issues.some(issue => issue.level === "error");
      return true;
    }
    function matchesTags(character, activeTagIds, tagFilterMode) {
      if (activeTagIds.length === 0) return true;
      if (tagFilterMode === "exclusive") {
        return character.tagIds.includes(activeTagIds[0]);
      }
      if (tagFilterMode === "and") {
        return activeTagIds.every(id => character.tagIds.includes(id));
      }
      return activeTagIds.some(id => character.tagIds.includes(id));
    }
    function getSearchText(character) {
      return [ character.name, character.fileName, character.creator, character.character_version, character.character_book, ...character.tags.map(tag => tag.name), character.desc, character.firstMes ].join(" ");
    }
  },
  "./src/角色卡管理器/host.ts"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      applyCharacterDeletion: () => applyCharacterDeletion,
      applyCharacterImport: () => applyCharacterImport,
      applyCharacterRename: () => applyCharacterRename,
      applyFavoriteMutation: () => applyFavoriteMutation,
      applySourceUrlMutation: () => applySourceUrlMutation,
      applyTagMutation: () => applyTagMutation,
      buildIssues: () => buildIssues,
      deleteCharacterChat: () => deleteCharacterChat,
      downloadCharacterChats: () => downloadCharacterChats,
      downloadCharacterFile: () => downloadCharacterFile,
      exportCharactersZip: () => exportCharactersZip,
      getHostWindow: () => getHostWindow,
      loadCharacterOriginalImage: () => loadCharacterOriginalImage,
      normalizeDetail: () => normalizeDetail,
      normalizeSummary: () => normalizeSummary,
      openCharacterChat: () => openCharacterChat,
      previewCharacterDeletion: () => previewCharacterDeletion,
      previewCharacterRename: () => previewCharacterRename,
      readCharacterChatContent: () => readCharacterChatContent,
      readCharacterChats: () => readCharacterChats,
      readCharacterDetail: () => readCharacterDetail,
      readCharacterList: () => readCharacterList,
      readCharacterWorldBookLink: () => readCharacterWorldBookLink,
      readTavernTags: () => readTavernTags
    });
    var fflate__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fflate */ "./node_modules/.pnpm/fflate@0.8.3/node_modules/fflate/esm/browser.js");
    var _tags__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./tags */ "./src/角色卡管理器/tags.ts");
    const LEGACY_META_DB_NAME = "CharManagerDB";
    const LEGACY_META_DB_STORE = "cache";
    const LEGACY_META_DB_VERSION = 1;
    const LEGACY_META_KEY = "cm_char_meta";
    function getHostWindow() {
      try {
        if (window.parent && window.parent !== window) {
          return window.parent;
        }
      } catch {
        return window;
      }
      return window;
    }
    async function readCharacterList(host = getHostWindow()) {
      const issues = [];
      const context = getContext(host);
      const tagState = readTavernTags(host);
      try {
        const refresh = context?.getCharacters || host.getCharacters;
        if (typeof refresh === "function") {
          await refresh.call(context || host);
        }
      } catch (error) {
        issues.push({
          level: "warning",
          message: `刷新角色列表失败：${formatError(error)}`
        });
      }
      const source = context?.characters || host.characters;
      if (!Array.isArray(source)) {
        return {
          characters: [],
          tags: tagState.tags,
          tagMap: tagState.tagMap,
          issues: [ {
            level: "error",
            message: "无法读取 SillyTavern 角色列表，请确认酒馆已加载完成。"
          }, ...issues ]
        };
      }
      const legacyMeta = await readLegacyCharMetaMap(host);
      const characters = source.map(character => normalizeSummary(character, host, legacyMeta[getCharacterFileName(character)])).filter(Boolean);
      return {
        characters: (0, _tags__WEBPACK_IMPORTED_MODULE_1__.attachTagsToCharacters)(characters, tagState.tags, tagState.tagMap),
        tags: tagState.tags,
        tagMap: tagState.tagMap,
        issues: [ ...issues, ...tagState.issues ]
      };
    }
    function readTavernTags(host = getHostWindow()) {
      const issues = [];
      const context = getContext(host);
      if (!context) {
        return {
          tags: [],
          tagMap: {},
          issues: [ {
            level: "warning",
            message: "无法读取酒馆标签上下文，标签功能暂不可用。"
          } ]
        };
      }
      if (!Array.isArray(context.tags)) {
        issues.push({
          level: "warning",
          message: "无法读取酒馆标签列表，标签筛选和写入暂不可用。"
        });
      }
      if (!context.tagMap || typeof context.tagMap !== "object") {
        issues.push({
          level: "warning",
          message: "无法读取酒馆标签绑定，标签筛选和写入暂不可用。"
        });
      }
      const tags = (0, _tags__WEBPACK_IMPORTED_MODULE_1__.normalizeTavernTags)(context.tags);
      const tagMap = (0, _tags__WEBPACK_IMPORTED_MODULE_1__.normalizeTagMap)(context.tagMap);
      const unknownTagIds = (0, _tags__WEBPACK_IMPORTED_MODULE_1__.getUnknownTagIds)(tags, tagMap);
      if (unknownTagIds.length > 0) {
        issues.push({
          level: "warning",
          message: `发现 ${unknownTagIds.length} 个未知标签绑定，已在列表中忽略。`
        });
      }
      return {
        tags,
        tagMap,
        issues
      };
    }
    async function applyTagMutation(draft, host = getHostWindow()) {
      const context = getContext(host);
      const current = readTavernTags(host);
      const preview = (0, _tags__WEBPACK_IMPORTED_MODULE_1__.previewTagMutation)(current.tags, current.tagMap, draft);
      if (!isWritableTagContext(context)) {
        return {
          success: false,
          message: "酒馆标签上下文不可用，无法保存标签变更。",
          preview,
          tags: current.tags,
          tagMap: current.tagMap
        };
      }
      if (preview.errors.length > 0) {
        return {
          success: false,
          message: preview.errors.join(" "),
          preview,
          tags: current.tags,
          tagMap: current.tagMap
        };
      }
      const updated = (0, _tags__WEBPACK_IMPORTED_MODULE_1__.buildUpdatedTagState)(current.tags, current.tagMap, preview);
      context.tags.splice(0, context.tags.length, ...updated.tags);
      replaceTagMap(context.tagMap, updated.tagMap);
      try {
        await (context.saveSettingsDebounced?.());
      } catch (error) {
        return {
          success: false,
          message: `标签保存失败：${formatError(error)}`,
          preview,
          tags: updated.tags,
          tagMap: updated.tagMap
        };
      }
      return {
        success: true,
        message: `已更新 ${preview.changedFileNames.length} 个角色的标签。`,
        preview,
        tags: updated.tags,
        tagMap: updated.tagMap
      };
    }
    async function applyFavoriteMutation(fileName, nextFav, host = getHostWindow()) {
      const target = findHostCharacter(fileName, host);
      const previous = snapshotFavorite(target);
      writeFavoriteToMemory(target, nextFav);
      try {
        const response = await host.fetch("/api/characters/merge-attributes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            avatar: fileName,
            fav: nextFav,
            data: {
              extensions: {
                fav: nextFav
              }
            }
          })
        });
        if (!response.ok) {
          throw new Error(await getResponseError(response, "收藏写入失败"));
        }
        return {
          success: true,
          message: nextFav ? "已收藏。" : "已取消收藏。",
          fileName,
          fav: nextFav
        };
      } catch (error) {
        restoreFavorite(target, previous);
        return {
          success: false,
          message: `收藏写入失败：${formatError(error)}`,
          fileName,
          fav: previous.fav
        };
      }
    }
    async function applySourceUrlMutation(fileName, sourceUrl, host = getHostWindow()) {
      const nextSourceUrl = sourceUrl.trim();
      const target = findHostCharacter(fileName, host);
      const previous = snapshotCharacterData(target);
      writeSourceUrlToMemory(target, nextSourceUrl);
      try {
        const response = await host.fetch("/api/characters/merge-attributes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            avatar: fileName,
            data: {
              source_url: nextSourceUrl,
              extensions: {
                source_url: nextSourceUrl,
                source_link: nextSourceUrl
              }
            }
          })
        });
        if (!response.ok) {
          throw new Error(await getResponseError(response, "来源 URL 保存失败"));
        }
        await writeLegacySourceUrl(fileName, nextSourceUrl, host);
        return {
          success: true,
          message: nextSourceUrl ? "来源 URL 已保存。" : "来源 URL 已清除。",
          fileName,
          sourceUrl: nextSourceUrl
        };
      } catch (error) {
        restoreCharacterData(target, previous);
        return {
          success: false,
          message: `来源 URL 保存失败：${formatError(error)}`,
          fileName,
          sourceUrl: getSourceUrl(target?.data || {})
        };
      }
    }
    function previewCharacterRename(character, inputName, characters) {
      const sanitizedName = sanitizeCharacterName(inputName);
      const extension = getFileExtension(character.fileName) || ".png";
      const targetFileName = sanitizedName ? `${sanitizedName}${extension}` : "";
      const errors = [];
      const warnings = [];
      if (!inputName.trim()) {
        errors.push("请输入新名称。");
      }
      if (!sanitizedName) {
        errors.push("名称不能只包含非法字符。");
      }
      if (inputName.trim() && sanitizedName !== inputName.trim()) {
        warnings.push(`名称包含不安全字符，将修正为“${sanitizedName}”。`);
      }
      if (sanitizedName && sanitizedName === character.name) {
        errors.push("名称没有变化。");
      }
      if (targetFileName && characters.some(item => item.fileName !== character.fileName && item.fileName.toLocaleLowerCase("zh-CN") === targetFileName.toLocaleLowerCase("zh-CN"))) {
        errors.push(`已存在文件名为“${targetFileName}”的角色。`);
      }
      return {
        oldFileName: character.fileName,
        oldName: character.name,
        inputName,
        sanitizedName,
        targetFileName,
        tagIdsToMove: [ ...character.tagIds ],
        errors,
        warnings
      };
    }
    async function applyCharacterRename(preview, host = getHostWindow()) {
      if (preview.errors.length > 0) {
        return {
          success: false,
          message: preview.errors.join(" "),
          oldFileName: preview.oldFileName,
          preview
        };
      }
      try {
        const response = await host.fetch("/api/characters/rename", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            avatar_url: preview.oldFileName,
            new_name: preview.sanitizedName
          })
        });
        if (!response.ok) {
          throw new Error(await getResponseError(response, "重命名失败"));
        }
        const payload = await response.json().catch(() => ({}));
        const newFileName = payload.avatar || preview.targetFileName;
        await migrateRenamedCharacterTags(preview.oldFileName, newFileName, host);
        renameHostCharacter(preview.oldFileName, preview.sanitizedName, newFileName, host);
        return {
          success: true,
          message: `已重命名为“${preview.sanitizedName}”。`,
          oldFileName: preview.oldFileName,
          newFileName,
          preview: {
            ...preview,
            targetFileName: newFileName
          }
        };
      } catch (error) {
        return {
          success: false,
          message: `重命名失败：${formatError(error)}`,
          oldFileName: preview.oldFileName,
          preview
        };
      }
    }
    async function downloadCharacterFile(fileName, host = getHostWindow()) {
      try {
        const blob = await fetchCharacterBlob(fileName, host);
        triggerDownload(blob, fileName, host);
        return {
          success: true,
          message: `已准备下载 ${fileName}。`,
          fileName
        };
      } catch (error) {
        return {
          success: false,
          message: `下载失败：${formatError(error)}`,
          fileName
        };
      }
    }
    async function exportCharactersZip(fileNames, host = getHostWindow()) {
      const uniqueFileNames = Array.from(new Set(fileNames.filter(Boolean)));
      const files = {};
      const exportedFileNames = [];
      const failedFileNames = [];
      for (const fileName of uniqueFileNames) {
        try {
          const blob = await fetchCharacterBlob(fileName, host);
          files[fileName] = new Uint8Array(await blob.arrayBuffer());
          exportedFileNames.push(fileName);
        } catch {
          failedFileNames.push(fileName);
        }
      }
      if (exportedFileNames.length === 0) {
        return {
          success: false,
          message: "没有可导出的角色文件。",
          zipFileName: "",
          exportedFileNames,
          failedFileNames
        };
      }
      const zipFileName = `character-cards-${formatLocalDate(new Date)}.zip`;
      const zipBytes = (0, fflate__WEBPACK_IMPORTED_MODULE_0__.zipSync)(files);
      triggerDownload(new Blob([ zipBytes ], {
        type: "application/zip"
      }), zipFileName, host);
      return {
        success: failedFileNames.length === 0,
        message: failedFileNames.length === 0 ? `已导出 ${exportedFileNames.length} 个角色。` : `已导出 ${exportedFileNames.length} 个角色，${failedFileNames.length} 个失败：${failedFileNames.join("、")}`,
        zipFileName,
        exportedFileNames,
        failedFileNames
      };
    }
    async function readCharacterChats(fileName, host = getHostWindow()) {
      const historyGetter = host.getChatHistoryBrief || window.getChatHistoryBrief;
      if (typeof historyGetter === "function") {
        try {
          const chats = normalizeChatList(await historyGetter.call(host, fileName), fileName);
          if (chats.length > 0) return chats;
        } catch {}
      }
      const endpoints = [ {
        url: "/api/characters/chats",
        body: {
          avatar_url: fileName
        }
      }, {
        url: "/api/chats/get",
        body: {
          avatar_url: fileName
        }
      }, {
        url: "/api/chats/list",
        body: {
          avatar_url: fileName
        }
      } ];
      for (const endpoint of endpoints) {
        try {
          const response = await host.fetch(endpoint.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(endpoint.body)
          });
          if (!response.ok) continue;
          const chats = normalizeChatList(await response.json().catch(() => ({})), fileName);
          return chats;
        } catch {}
      }
      throw new Error("当前酒馆环境没有暴露可读取聊天记录列表的接口。");
    }
    async function downloadCharacterChats(fileName, chatIds = [], host = getHostWindow()) {
      try {
        const chats = await readCharacterChats(fileName, host);
        const filtered = chatIds.length > 0 ? chats.filter(chat => chatIds.includes(chat.id)) : chats;
        if (filtered.length === 0) {
          return {
            success: false,
            message: "没有可下载的聊天记录。",
            fileName
          };
        }
        const contents = await Promise.all(filtered.map(chat => readCharacterChatContent(fileName, chat, host)));
        if (contents.length === 1) {
          const chat = contents[0];
          triggerDownload(toChatBlob(chat.content), getChatDownloadFileName(chat), host);
        } else {
          const files = Object.fromEntries(contents.map(chat => [ getChatDownloadFileName(chat), new Uint8Array((new TextEncoder).encode(formatChatContent(chat.content))) ]));
          triggerDownload(new Blob([ (0, fflate__WEBPACK_IMPORTED_MODULE_0__.zipSync)(files) ], {
            type: "application/zip"
          }), `${stripExtension(fileName)}-chats.zip`, host);
        }
        return {
          success: true,
          message: "",
          fileName
        };
      } catch (error) {
        return {
          success: false,
          message: `聊天记录下载失败：${formatError(error)}`,
          fileName
        };
      }
    }
    async function readCharacterChatContent(fileName, chat, host = getHostWindow()) {
      const chatFileName = typeof chat === "string" ? chat : chat.fileName;
      const title = typeof chat === "string" ? getChatTitleFromFileName(chat, fileName) : chat.title;
      const response = await fetchFirstOk([ {
        url: "/api/chats/get",
        body: {
          avatar_url: fileName,
          chatfile: chatFileName
        }
      }, {
        url: "/api/chats/get",
        body: {
          avatar_url: fileName,
          file_name: chatFileName
        }
      } ], host);
      if (!response.ok) {
        throw new Error(await getResponseError(response, `聊天记录读取失败：${title || chatFileName}`));
      }
      return {
        fileName: chatFileName,
        title,
        content: await response.json().catch(() => ({}))
      };
    }
    async function deleteCharacterChat(fileName, chat, host = getHostWindow()) {
      const chatFileName = typeof chat === "string" ? chat : chat.fileName;
      const chatId = typeof chat === "string" ? chat : chat.id;
      try {
        const response = await fetchFirstOk([ {
          url: "/api/chats/delete",
          body: {
            avatar_url: fileName,
            chatfile: chatFileName
          }
        }, {
          url: "/api/chats/delete",
          body: {
            avatar_url: fileName,
            chat_id: chatId,
            file_name: chatFileName
          }
        } ], host);
        if (!response.ok) {
          throw new Error(await getResponseError(response, `聊天记录删除失败：${chatFileName}`));
        }
        return {
          success: true,
          message: "",
          fileName
        };
      } catch (error) {
        return {
          success: false,
          message: `聊天记录删除失败：${formatError(error)}`,
          fileName
        };
      }
    }
    async function openCharacterChat(fileName, chatFileName = "", host = getHostWindow()) {
      try {
        const context = getContext(host);
        const helper = host.TavernHelper || host;
        const opener = host.TavernHelper?.openCharacterChat || host.openCharacterChat;
        const contextOpener = context?.openCharacterChat;
        const launcher = host.TavernHelper?.launchChat || host.launchChat;
        if (typeof launcher === "function") {
          await launcher.call(helper, {
            fileName,
            avatar: fileName
          }, chatFileName);
          return {
            success: true,
            message: "",
            fileName
          };
        }
        await selectHostCharacter(fileName, host, context, chatFileName ? 250 : 0);
        if (!chatFileName) {
          return {
            success: true,
            message: "",
            fileName
          };
        }
        if (typeof contextOpener === "function") {
          await contextOpener.call(context, chatFileName);
          return {
            success: true,
            message: "",
            fileName
          };
        }
        if (typeof opener === "function") {
          await opener.call(helper, chatFileName);
          return {
            success: true,
            message: "",
            fileName
          };
        }
        if (openChatByDom(chatFileName, host)) {
          return {
            success: true,
            message: "",
            fileName
          };
        }
        {
          throw new Error("当前酒馆环境没有暴露打开聊天记录的接口。");
        }
      } catch (error) {
        return {
          success: false,
          message: `打开聊天失败：${formatError(error)}`,
          fileName
        };
      }
    }
    async function selectHostCharacter(fileName, host, context, settleMs = 250) {
      const source = context?.characters || host.characters || [];
      const characterIndex = source.findIndex(character => getCharacterFileName(character) === fileName);
      if (characterIndex < 0) {
        throw new Error(`角色卡不在当前酒馆列表中：${fileName}`);
      }
      if (String(host.this_chid ?? "") === String(characterIndex)) return;
      const domButton = host.document?.getElementById(`CharID${characterIndex}`);
      if (domButton instanceof HTMLElement) {
        domButton.click();
        if (settleMs > 0) await waitForHost(host, settleMs);
        return;
      }
      if (typeof context?.selectCharacterById === "function") {
        await context.selectCharacterById(characterIndex, {
          switchMenu: false
        });
        if (settleMs > 0) await waitForHost(host, settleMs);
        return;
      }
      if (typeof host.loadCharacter === "function") {
        await host.loadCharacter(characterIndex);
        if (settleMs > 0) await waitForHost(host, settleMs);
        return;
      }
    }
    function openChatByDom(chatFileName, host) {
      const doc = host.document;
      if (!doc) return false;
      const button = doc.createElement("div");
      button.className = "select_chat_block";
      button.setAttribute("file_name", chatFileName);
      button.style.display = "none";
      doc.body.appendChild(button);
      try {
        const trigger = host.jQuery?.(button).trigger;
        if (typeof trigger === "function") {
          trigger.call(host.jQuery?.(button), "click");
          return true;
        }
        button.dispatchEvent(new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: host
        }));
        return true;
      } finally {
        host.setTimeout(() => button.remove(), 1e3);
      }
    }
    function waitForHost(host, ms) {
      return new Promise(resolve => host.setTimeout(resolve, ms));
    }
    async function previewCharacterDeletion(fileNames, options = {}, characters, host = getHostWindow()) {
      const deleteOptions = {
        backupCharacters: options.backupCharacters ?? true,
        deleteChats: options.deleteChats ?? false,
        deleteWorldBooks: options.deleteWorldBooks ?? true
      };
      const list = characters || (await readCharacterList(host)).characters;
      const uniqueFileNames = Array.from(new Set(fileNames.filter(Boolean)));
      const targets = [];
      const warnings = [];
      const errors = [];
      for (const fileName of uniqueFileNames) {
        const summary = list.find(character => character.fileName === fileName) || normalizeSummary({
          avatar: fileName
        }, host);
        let chats = [];
        let chatStatus = "ready";
        let chatError = "";
        try {
          chats = await readCharacterChats(fileName, host);
        } catch (error) {
          chatStatus = "unavailable";
          chatError = formatError(error);
        }
        const worldBook = readCharacterWorldBookLink(summary, list);
        const willDeleteChats = deleteOptions.deleteChats && chatStatus === "ready" && chats.length > 0;
        const willDeleteWorldBook = deleteOptions.deleteWorldBooks && worldBook.canDelete;
        const issues = [];
        if (deleteOptions.deleteChats && chatStatus === "unavailable") {
          issues.push({
            level: "warning",
            message: `聊天记录不会删除：${chatError}`
          });
        }
        if (deleteOptions.deleteWorldBooks && summary.character_book && !worldBook.canDelete) {
          issues.push({
            level: "warning",
            message: `世界书不会删除：${worldBook.reason}`
          });
        }
        targets.push({
          fileName,
          name: summary.name,
          sourceUrl: summary.sourceUrl,
          tagNames: summary.tags.map(tag => tag.name),
          chatStatus,
          chatError,
          chats,
          worldBook,
          willDeleteChats,
          willDeleteWorldBook,
          issues
        });
      }
      if (uniqueFileNames.length === 0) {
        errors.push("请选择要删除的角色。");
      }
      if (deleteOptions.deleteChats && targets.some(target => target.chatStatus === "unavailable")) {
        warnings.push("部分角色无法读取聊天记录，已自动跳过聊天删除。");
      }
      if (deleteOptions.deleteWorldBooks && targets.some(target => target.worldBook.type !== "none" && !target.worldBook.canDelete)) {
        warnings.push("部分世界书无法确认归属或被其他角色使用，已自动跳过。");
      }
      return {
        options: deleteOptions,
        targets,
        warnings,
        errors,
        requiresDeleteText: targets.length > 1
      };
    }
    function readCharacterWorldBookLink(character, characters = []) {
      const name = character.character_book;
      if (!name) {
        return {
          name: "",
          type: "none",
          canDelete: false,
          reason: "无关联世界书。",
          sharedBy: []
        };
      }
      const sharedBy = characters.filter(item => item.fileName !== character.fileName && item.character_book === name).map(item => item.name);
      if (sharedBy.length > 0) {
        return {
          name,
          type: "external",
          canDelete: false,
          reason: `被其他角色使用：${sharedBy.join("、")}`,
          sharedBy
        };
      }
      const embedded = isEmbeddedWorldBook(character);
      return {
        name,
        type: embedded ? "embedded" : "unknown",
        canDelete: embedded,
        reason: embedded ? "可确认来自角色卡内嵌世界书。" : "只有世界书名称，无法确认是否为角色专属。",
        sharedBy
      };
    }
    async function applyCharacterDeletion(preview, host = getHostWindow()) {
      if (preview.errors.length > 0) {
        return preview.targets.map(target => ({
          fileName: target.fileName,
          success: false,
          message: preview.errors.join(" "),
          deletedChats: 0,
          deletedWorldBook: false
        }));
      }
      if (preview.options.backupCharacters) {
        const backup = await exportCharactersZip(preview.targets.map(target => target.fileName), host);
        if (!backup.exportedFileNames.length) {
          return preview.targets.map(target => ({
            fileName: target.fileName,
            success: false,
            message: `备份失败，已取消删除：${backup.message}`,
            deletedChats: 0,
            deletedWorldBook: false
          }));
        }
      }
      const results = [];
      for (const target of preview.targets) {
        let deletedChats = 0;
        let deletedWorldBook = false;
        try {
          if (target.willDeleteChats) {
            deletedChats = await deleteCharacterChats(target, host);
          }
          if (target.willDeleteWorldBook) {
            deletedWorldBook = await deleteCharacterWorldBook(target.worldBook.name, host);
          }
          await deleteCharacterFile(target.fileName, host);
          await cleanupDeletedCharacter(target.fileName, host);
          results.push({
            fileName: target.fileName,
            success: true,
            message: `已删除 ${target.name}。`,
            deletedChats,
            deletedWorldBook
          });
        } catch (error) {
          results.push({
            fileName: target.fileName,
            success: false,
            message: `删除失败：${formatError(error)}`,
            deletedChats,
            deletedWorldBook
          });
        }
      }
      await refreshHostCharacters(host);
      return results;
    }
    async function applyCharacterImport(candidates, host = getHostWindow()) {
      const results = [];
      for (const candidate of candidates) {
        if (candidate.status === "error") {
          results.push({
            id: candidate.id,
            fileName: candidate.fileName,
            success: false,
            message: candidate.issues.map(issue => issue.message).join(" ") || "候选项存在解析错误。"
          });
          continue;
        }
        try {
          await writeCharacterImport(candidate, host);
          results.push({
            id: candidate.id,
            fileName: candidate.fileName,
            success: true,
            message: candidate.action === "update" ? `已更新 ${candidate.summary.name}` : `已导入 ${candidate.summary.name}`
          });
        } catch (error) {
          results.push({
            id: candidate.id,
            fileName: candidate.fileName,
            success: false,
            message: `导入失败：${formatError(error)}`
          });
        }
      }
      return results;
    }
    async function writeCharacterImport(candidate, host) {
      const nativeInput = getNativeImportInput(host);
      if (candidate.action === "create" && nativeInput) {
        await importWithNativeFileInput(candidate, host, nativeInput);
        return;
      }
      const importRawCharacter = getImportRawCharacter(host);
      if (importRawCharacter) {
        const response = await importRawCharacter(candidate.fileName, candidate.importBlob);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return;
      }
      await importWithNativeFileInput(candidate, host, nativeInput);
    }
    function getImportRawCharacter(host) {
      const helperImport = host.TavernHelper?.importRawCharacter || window.TavernHelper?.importRawCharacter;
      if (typeof helperImport === "function") {
        return (filename, content) => helperImport.call(host.TavernHelper || window.TavernHelper, filename, content);
      }
      const legacyImport = host.importRawCharacter || window.importRawCharacter;
      if (typeof legacyImport === "function") {
        return (filename, content) => legacyImport.call(host, filename, content);
      }
      return undefined;
    }
    function getNativeImportInput(host) {
      return host.document?.getElementById("character_import_file") || null;
    }
    async function importWithNativeFileInput(candidate, host, input = getNativeImportInput(host)) {
      if (!input) {
        throw new Error("酒馆导入接口 importRawCharacter 不可用，且未找到原生导入控件 character_import_file。");
      }
      const DataTransferCtor = host.DataTransfer || window.DataTransfer;
      const FileCtor = host.File || window.File;
      const EventCtor = host.Event || window.Event;
      if (!DataTransferCtor || !FileCtor || !EventCtor) {
        throw new Error("当前环境不支持原生文件导入所需的 DataTransfer / File / Event。");
      }
      const before = getCharacterFileSet(host);
      const file = new FileCtor([ candidate.importBlob ], candidate.fileName, {
        type: getImportMimeType(candidate)
      });
      const transfer = new DataTransferCtor;
      transfer.items.add(file);
      input.files = transfer.files;
      if (!input.files || input.files.length === 0) {
        throw new Error("导入文件列表为空，可能被浏览器环境限制。");
      }
      input.dispatchEvent(new EventCtor("change", {
        bubbles: true
      }));
      await waitForNativeImport(candidate, host, before);
    }
    async function waitForNativeImport(candidate, host, before) {
      const timeoutAt = Date.now() + 12e3;
      let lastSeen = getCharacterFileSet(host);
      while (Date.now() < timeoutAt) {
        await delay(300);
        await refreshHostCharacters(host);
        lastSeen = getCharacterFileSet(host);
        if (lastSeen.has(candidate.fileName) || lastSeen.size > before.size) {
          return;
        }
      }
      throw new Error("已提交给酒馆原生导入控件，但未在限定时间内确认角色列表变化。");
    }
    async function refreshHostCharacters(host) {
      const context = getContext(host);
      const refresh = context?.getCharacters || host.getCharacters;
      if (typeof refresh === "function") {
        await refresh.call(context || host);
      }
    }
    function getCharacterFileSet(host) {
      const context = getContext(host);
      const source = context?.characters || host.characters || [];
      return new Set(source.map(character => character.avatar || character.file_name || character.fileName || "").filter(Boolean));
    }
    function getImportMimeType(candidate) {
      return candidate.format === "png" ? "image/png" : "application/json";
    }
    function normalizeChatSummary(chat, fileName, index) {
      const record = chat && typeof chat === "object" ? chat : {};
      const chatFileName = stringValue(record.file_name || record.fileName || record.filename);
      const id = stringValue(record.id || chatFileName || record.name || record.title || `chat-${index + 1}`);
      const title = stringValue(record.title || record.name) || getChatTitleFromFileName(chatFileName, fileName) || `聊天 ${index + 1}`;
      const messages = Array.isArray(record.messages) ? record.messages.length : numberValue(record.messageCount || record.messages_count || record.chat_items || record.mes_count || record.count);
      return {
        id,
        fileName: chatFileName || id,
        title,
        messageCount: messages,
        updatedAt: numberValue(record.updatedAt || record.updated_at || record.last_mes || record.date_last_chat || record.mtime),
        sizeBytes: numberValue(record.size || record.sizeBytes || record.size_bytes),
        canOpen: true,
        canDownload: true
      };
    }
    function getChatTitleFromFileName(chatFileName, characterFileName) {
      if (!chatFileName) return "";
      const characterName = stripExtension(characterFileName);
      let title = stripExtension(chatFileName);
      if (characterName && title.startsWith(`${characterName} - `)) {
        title = title.slice(characterName.length + 3);
      }
      return title || chatFileName;
    }
    function getChatDownloadFileName(chat) {
      const fileName = chat.fileName || `${chat.title || "chat"}.jsonl`;
      return /\.[^.]+$/.test(fileName) ? fileName : `${fileName}.json`;
    }
    function toChatBlob(content) {
      return new Blob([ formatChatContent(content) ], {
        type: "application/json"
      });
    }
    function formatChatContent(content) {
      return typeof content === "string" ? content : JSON.stringify(content, null, 2);
    }
    function normalizeChatList(payload, fileName) {
      const rawChats = getRawChatItems(payload);
      const seen = new Set;
      return rawChats.map((chat, index) => normalizeChatSummary(chat, fileName, index)).filter(chat => {
        const key = stripExtension(chat.fileName || chat.id);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => b.updatedAt - a.updatedAt);
    }
    function getRawChatItems(payload) {
      if (Array.isArray(payload)) return payload;
      if (!payload || typeof payload !== "object") return [];
      const response = payload;
      if (Array.isArray(response.chats)) return response.chats;
      if (Array.isArray(response.data)) return response.data;
      return Object.entries(response).map(([fileName, value]) => value && typeof value === "object" ? {
        file_name: fileName,
        ...value
      } : {
        file_name: fileName
      });
    }
    async function deleteCharacterChats(target, host) {
      let deleted = 0;
      for (const chat of target.chats) {
        const response = await fetchFirstOk([ {
          url: "/api/chats/delete",
          body: {
            avatar_url: target.fileName,
            chatfile: chat.fileName || chat.id
          }
        }, {
          url: "/api/chats/delete",
          body: {
            avatar_url: target.fileName,
            chat_id: chat.id,
            file_name: chat.fileName
          }
        }, {
          url: "/api/chats/remove",
          body: {
            avatar_url: target.fileName,
            chat_id: chat.id,
            file_name: chat.fileName
          }
        } ], host);
        if (!response.ok) {
          throw new Error(await getResponseError(response, `聊天记录删除失败：${chat.title}`));
        }
        deleted += 1;
      }
      return deleted;
    }
    async function deleteCharacterWorldBook(name, host) {
      if (!name) return false;
      const response = await fetchFirstOk([ {
        url: "/api/worldinfo/delete",
        body: {
          name
        }
      }, {
        url: "/api/worldinfo/delete-world-info",
        body: {
          name
        }
      }, {
        url: "/api/worldinfo/edit",
        body: {
          name,
          delete: true
        }
      } ], host);
      if (!response.ok) {
        throw new Error(await getResponseError(response, `世界书删除失败：${name}`));
      }
      return true;
    }
    async function deleteCharacterFile(fileName, host) {
      const response = await fetchFirstOk([ {
        url: "/api/characters/delete",
        body: {
          avatar_url: fileName,
          delete_chats: false
        }
      }, {
        url: "/api/characters/delete",
        body: {
          avatar: fileName
        }
      } ], host);
      if (!response.ok) {
        throw new Error(await getResponseError(response, `角色删除失败：${fileName}`));
      }
      removeHostCharacter(fileName, host);
    }
    async function fetchFirstOk(endpoints, host) {
      let lastResponse;
      let lastError;
      for (const endpoint of endpoints) {
        try {
          const response = await host.fetch(endpoint.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(endpoint.body)
          });
          lastResponse = response;
          if (response.ok) return response;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastResponse) return lastResponse;
      throw lastError instanceof Error ? lastError : new Error("宿主接口不可用。");
    }
    async function cleanupDeletedCharacter(fileName, host) {
      const context = getContext(host);
      if (context?.tagMap && Object.prototype.hasOwnProperty.call(context.tagMap, fileName)) {
        delete context.tagMap[fileName];
        await (context.saveSettingsDebounced?.());
      }
      await writeLegacySourceUrl(fileName, "", host);
    }
    function removeHostCharacter(fileName, host) {
      const context = getContext(host);
      removeCharacterFromArray(context?.characters, fileName);
      removeCharacterFromArray(host.characters, fileName);
    }
    function removeCharacterFromArray(characters, fileName) {
      if (!Array.isArray(characters)) return;
      const index = characters.findIndex(character => getCharacterFileName(character) === fileName);
      if (index >= 0) characters.splice(index, 1);
    }
    function delay(ms) {
      return new Promise(resolve => {
        window.setTimeout(resolve, ms);
      });
    }
    async function readCharacterDetail(fileName, base, host = getHostWindow()) {
      try {
        const response = await host.fetch("/api/characters/get", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            avatar_url: fileName
          })
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = await response.json();
        const data = payload.data || payload;
        return normalizeDetail(fileName, data, payload, base, host);
      } catch (error) {
        return {
          ...base || normalizeSummary({
            avatar: fileName
          }, host),
          description: "",
          personality: "",
          scenario: "",
          first_mes: "",
          alternate_greetings: [],
          mes_example: "",
          system_prompt: "",
          creator_notes: "",
          post_history_instructions: "",
          detailLoaded: false,
          readError: formatError(error),
          issues: [ ...base?.issues || [], {
            level: "error",
            message: `详情读取失败：${formatError(error)}`
          } ]
        };
      }
    }
    async function loadCharacterOriginalImage(fileName, host = getHostWindow()) {
      if (!fileName || /^(?:https?:|data:|blob:|\/)/i.test(fileName)) return fileName;
      const response = await host.fetch(`/characters/${encodeURIComponent(fileName)}`);
      if (!response.ok) {
        throw new Error(`头像原图读取失败：HTTP ${response.status}`);
      }
      return URL.createObjectURL(await response.blob());
    }
    function normalizeSummary(raw, host = getHostWindow(), legacyMeta = {}) {
      return normalizeSummaryWithMeta(raw, host, legacyMeta);
    }
    function normalizeSummaryWithMeta(raw, host = getHostWindow(), legacyMeta = {}) {
      const fileName = raw.avatar || raw.file_name || raw.fileName || "";
      const data = raw.data || {};
      const firstMes = stringValue(raw.firstMes || data.first_mes);
      const altGreetings = arrayValue(raw.altGreetings || data.alternate_greetings);
      const rawBook = data.character_book || raw.character_book;
      const characterBook = getBookName(rawBook);
      const avatarFallbackUrls = buildAvatarUrls(fileName, host);
      const summary = {
        fileName,
        name: stringValue(raw.name || data.name || stripExtension(fileName) || "未命名角色"),
        avatarUrl: avatarFallbackUrls[0] || "",
        avatarFallbackUrls,
        fav: Boolean(raw.fav || data.fav || data.extensions?.fav),
        tagIds: [],
        tags: [],
        date_added: numberValue(raw.date_added || raw.create_date || data.create_date),
        date_last_chat: numberValue(raw.date_last_chat || raw.last_chat),
        creator: stringValue(raw.creator || data.creator),
        character_version: stringValue(raw.character_version || data.character_version),
        character_book: characterBook,
        worldBookEmbedded: isEmbeddedBookValue(rawBook),
        sourceUrl: getSourceUrl(data, raw, legacyMeta),
        firstMes,
        altGreetingCount: altGreetings.length,
        tokens: numberValue(raw.tokens),
        desc: stringValue(raw.desc || data.description),
        issues: [],
        detailLoaded: false
      };
      summary.issues = buildIssues(summary);
      return summary;
    }
    function normalizeDetail(fileName, data, payload = {}, base, host = getHostWindow()) {
      const summary = normalizeSummary({
        avatar: fileName,
        name: data.name || base?.name,
        fav: base?.fav || data.fav,
        date_added: base?.date_added || data.create_date,
        date_last_chat: base?.date_last_chat,
        creator: data.creator || base?.creator,
        tokens: payload.tokens || data.tokens || base?.tokens,
        data,
        character_book: data.character_book || payload.character_book || base?.character_book,
        character_version: data.character_version || base?.character_version
      }, host);
      const detail = {
        ...summary,
        tagIds: base?.tagIds || summary.tagIds,
        tags: base?.tags || summary.tags,
        sourceUrl: base?.sourceUrl || summary.sourceUrl,
        description: stringValue(data.description),
        personality: stringValue(data.personality),
        scenario: stringValue(data.scenario),
        first_mes: stringValue(data.first_mes),
        alternate_greetings: arrayValue(data.alternate_greetings),
        mes_example: stringValue(data.mes_example),
        system_prompt: stringValue(data.system_prompt || data.extensions?.system_prompt),
        creator_notes: stringValue(data.creator_notes || data.creatorcomment),
        post_history_instructions: stringValue(data.post_history_instructions || data.extensions?.post_history_instructions),
        detailLoaded: true
      };
      detail.issues = buildIssues(detail);
      return detail;
    }
    function buildIssues(character) {
      const issues = [];
      if (!character.fileName) {
        issues.push({
          level: "error",
          message: "缺少角色卡文件名，无法定位头像和详情。"
        });
      }
      if (!character.firstMes) {
        issues.push({
          level: "warning",
          message: "缺少主开场白，导入或游玩前建议检查。"
        });
      }
      if (character.character_book) {
        issues.push({
          level: "info",
          message: `关联世界书：${character.character_book}`
        });
      }
      return issues;
    }
    function getContext(host) {
      try {
        return host.SillyTavern?.getContext?.();
      } catch {
        return undefined;
      }
    }
    function isWritableTagContext(context) {
      return Boolean(context && Array.isArray(context.tags) && context.tagMap && typeof context.tagMap === "object");
    }
    function replaceTagMap(target, source) {
      Object.keys(target).forEach(fileName => {
        delete target[fileName];
      });
      Object.entries(source).forEach(([fileName, ids]) => {
        target[fileName] = ids;
      });
    }
    function findHostCharacter(fileName, host) {
      const context = getContext(host);
      const source = context?.characters || host.characters || [];
      return source.find(character => (character.avatar || character.file_name || character.fileName) === fileName);
    }
    function getCharacterFileName(character) {
      return character.avatar || character.file_name || character.fileName || "";
    }
    function snapshotFavorite(character) {
      const data = character?.data;
      const extensions = data?.extensions;
      return {
        fav: Boolean(character?.fav || data?.fav || extensions?.fav),
        dataFav: data?.fav,
        extensionFav: extensions?.fav,
        hadDataFav: Boolean(data && Object.prototype.hasOwnProperty.call(data, "fav")),
        hadExtensionFav: Boolean(extensions && Object.prototype.hasOwnProperty.call(extensions, "fav"))
      };
    }
    function writeFavoriteToMemory(character, fav) {
      if (!character) return;
      character.fav = fav;
      character.data = character.data || {};
      character.data.fav = fav;
      character.data.extensions = character.data.extensions || {};
      character.data.extensions.fav = fav;
    }
    function restoreFavorite(character, snapshot) {
      if (!character) return;
      character.fav = snapshot.fav;
      if (!character.data) return;
      if (snapshot.hadDataFav) {
        character.data.fav = snapshot.dataFav;
      } else {
        delete character.data.fav;
      }
      const extensions = character.data.extensions;
      if (!extensions) return;
      if (snapshot.hadExtensionFav) {
        extensions.fav = snapshot.extensionFav;
      } else {
        delete extensions.fav;
      }
    }
    function snapshotCharacterData(character) {
      if (!character?.data) return undefined;
      return JSON.parse(JSON.stringify(character.data));
    }
    function restoreCharacterData(character, snapshot) {
      if (!character) return;
      if (snapshot) {
        character.data = snapshot;
      } else {
        delete character.data;
      }
    }
    async function readLegacyCharMetaMap(host) {
      try {
        const data = await readLegacyMetaDB(host, LEGACY_META_KEY);
        return data && typeof data === "object" ? data : {};
      } catch {
        return {};
      }
    }
    async function writeLegacySourceUrl(fileName, sourceUrl, host) {
      try {
        const data = await readLegacyCharMetaMap(host);
        const current = data[fileName] && typeof data[fileName] === "object" ? data[fileName] : {};
        if (sourceUrl) {
          data[fileName] = {
            ...current,
            source_url: sourceUrl
          };
        } else {
          const {source_url: _removed, ...rest} = current;
          if (Object.keys(rest).length > 0) {
            data[fileName] = rest;
          } else {
            delete data[fileName];
          }
        }
        await writeLegacyMetaDB(host, LEGACY_META_KEY, data);
      } catch (error) {
        console.warn("[CharacterCardManager] 旧角色卡管理器来源 URL 缓存同步失败", error);
      }
    }
    function readLegacyMetaDB(host, key) {
      const indexedDBApi = host.indexedDB || window.indexedDB;
      if (!indexedDBApi) return Promise.resolve(undefined);
      return new Promise(resolve => {
        const request = indexedDBApi.open(LEGACY_META_DB_NAME, LEGACY_META_DB_VERSION);
        request.onerror = () => resolve(undefined);
        request.onupgradeneeded = event => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(LEGACY_META_DB_STORE)) {
            db.createObjectStore(LEGACY_META_DB_STORE);
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction([ LEGACY_META_DB_STORE ], "readonly");
          const store = transaction.objectStore(LEGACY_META_DB_STORE);
          const getRequest = store.get(key);
          getRequest.onerror = () => {
            db.close();
            resolve(undefined);
          };
          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result);
          };
        };
      });
    }
    function writeLegacyMetaDB(host, key, value) {
      const indexedDBApi = host.indexedDB || window.indexedDB;
      if (!indexedDBApi) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const request = indexedDBApi.open(LEGACY_META_DB_NAME, LEGACY_META_DB_VERSION);
        request.onerror = () => reject(new Error("IndexedDB 打开失败"));
        request.onupgradeneeded = event => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(LEGACY_META_DB_STORE)) {
            db.createObjectStore(LEGACY_META_DB_STORE);
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction([ LEGACY_META_DB_STORE ], "readwrite");
          const store = transaction.objectStore(LEGACY_META_DB_STORE);
          const putRequest = store.put(value, key);
          putRequest.onerror = () => {
            db.close();
            reject(new Error("IndexedDB 保存失败"));
          };
          putRequest.onsuccess = () => {
            db.close();
            resolve();
          };
        };
      });
    }
    function writeSourceUrlToMemory(character, sourceUrl) {
      if (!character) return;
      character.data = character.data || {};
      if (!character.data.extensions || typeof character.data.extensions !== "object") {
        character.data.extensions = {};
      }
      if (sourceUrl) {
        character.data.source_url = sourceUrl;
        character.data.extensions.source_url = sourceUrl;
        character.data.extensions.source_link = sourceUrl;
      } else {
        delete character.data.source_url;
        delete character.data.source;
        delete character.data.url;
        delete character.data.extensions.source_url;
        delete character.data.extensions.source_link;
        delete character.data.extensions.source;
        delete character.data.extensions.url;
      }
    }
    async function migrateRenamedCharacterTags(oldFileName, newFileName, host) {
      const context = getContext(host);
      if (!context?.tagMap || typeof context.tagMap !== "object") return;
      const ids = context.tagMap[oldFileName];
      if (!ids) return;
      context.tagMap[newFileName] = [ ...ids ];
      delete context.tagMap[oldFileName];
      await (context.saveSettingsDebounced?.());
    }
    function renameHostCharacter(oldFileName, newName, newFileName, host) {
      const character = findHostCharacter(oldFileName, host);
      if (!character) return;
      character.name = newName;
      character.avatar = newFileName;
      if (character.file_name) character.file_name = newFileName;
      if (character.fileName) character.fileName = newFileName;
      if (character.data) character.data.name = newName;
    }
    async function fetchCharacterBlob(fileName, host) {
      const response = await host.fetch(`/characters/${encodeURIComponent(fileName)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.blob();
    }
    function triggerDownload(blob, fileName, host) {
      const url = URL.createObjectURL(blob);
      const link = host.document.createElement("a");
      link.href = url;
      link.download = fileName;
      host.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 6e4);
    }
    function sanitizeCharacterName(name) {
      const forbidden = new Set([ "<", ">", ":", '"', "/", "\\", "|", "?", "*" ]);
      return name.trim().split("").filter(char => !forbidden.has(char) && char.charCodeAt(0) >= 32).join("").replace(/[. ]+$/g, "");
    }
    function getFileExtension(fileName) {
      const match = /\.[^.]+$/.exec(fileName);
      return match?.[0] || "";
    }
    async function getResponseError(response, fallback) {
      try {
        return await response.text() || fallback;
      } catch {
        return fallback;
      }
    }
    function formatLocalDate(date) {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    function getBookName(book) {
      if (!book) return "";
      if (typeof book === "string") return book;
      if (typeof book === "object" && "name" in book) {
        return stringValue(book.name);
      }
      return "";
    }
    function isEmbeddedBookValue(book) {
      if (!book || typeof book !== "object") return false;
      const record = book;
      return Array.isArray(record.entries) || Array.isArray(record.entries_list);
    }
    function isEmbeddedWorldBook(character) {
      return Boolean(character.worldBookEmbedded);
    }
    function getSourceUrl(data, raw = {}, legacyMeta = {}) {
      const extensions = data.extensions && typeof data.extensions === "object" ? data.extensions : {};
      return stringValue(legacyMeta.source_url || extensions.source_url || extensions.source_link || extensions.sourceUrl || extensions.source || extensions.url || data.source_url || data.sourceUrl || data.source || data.url || raw.source_url || raw.sourceUrl);
    }
    function stripExtension(fileName) {
      return fileName.replace(/\.[^.]+$/, "");
    }
    function buildAvatarUrls(fileName, host) {
      if (!fileName) return [];
      if (/^(?:https?:|data:|blob:|\/)/i.test(fileName)) return [ fileName ];
      const urls = [ `/characters/${encodeURIComponent(fileName)}`, getThumbnailUrl(host, "avatar", fileName), getThumbnailUrl(host, "character", fileName), `/thumbnail?type=avatar&file=${encodeURIComponent(fileName)}`, `/thumbnail?type=character&file=${encodeURIComponent(fileName)}` ].filter(url => Boolean(url));
      return Array.from(new Set(urls));
    }
    function getThumbnailUrl(host, type, fileName) {
      try {
        return stringValue(host.getThumbnailUrl?.(type, fileName));
      } catch {
        return "";
      }
    }
    function stringValue(value) {
      return typeof value === "string" ? value : "";
    }
    function numberValue(value) {
      if (typeof value === "number") return Number.isFinite(value) ? value : 0;
      if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    }
    function arrayValue(value) {
      return Array.isArray(value) ? value.filter(item => typeof item === "string") : [];
    }
    function formatError(error) {
      return error instanceof Error ? error.message : String(error || "未知错误");
    }
  },
  "./src/角色卡管理器/imports.ts"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      buildImportCandidate: () => buildImportCandidate,
      buildImportDiff: () => buildImportDiff,
      canApplyImport: () => canApplyImport,
      encodePngTextChunkForTest: () => encodePngTextChunkForTest,
      expandImportSources: () => expandImportSources,
      fetchImportSource: () => fetchImportSource,
      parseImportSource: () => parseImportSource
    });
    var fflate__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fflate */ "./node_modules/.pnpm/fflate@0.8.3/node_modules/fflate/esm/browser.js");
    var _host__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./host */ "./src/角色卡管理器/host.ts");
    const PNG_SIGNATURE = [ 137, 80, 78, 71, 13, 10, 26, 10 ];
    const TEXT_DECODER = new TextDecoder("utf-8");
    const TEXT_ENCODER = new TextEncoder;
    const CARD_TEXT_KEYS = new Set([ "chara", "ccv2", "ccv3" ]);
    const GAMEPLAY_FIELDS = [ [ "description", "描述" ], [ "personality", "性格" ], [ "scenario", "场景" ], [ "first_mes", "开场白" ], [ "alternate_greetings", "备选开场" ], [ "mes_example", "示例对话" ], [ "system_prompt", "系统提示" ], [ "post_history_instructions", "历史后指令" ], [ "character_book", "世界书" ] ];
    const META_FIELDS = [ [ "creator", "作者" ], [ "character_version", "版本" ], [ "creator_notes", "作者备注" ] ];
    const PRESERVED_EXTENSION_KEYS = [ "source", "source_url", "url", "fav", "talkativeness", "depth_prompt" ];
    const EXTENSION_FIELD_LABELS = {
      source: "来源",
      source_url: "来源 URL",
      url: "来源 URL",
      fav: "收藏状态",
      talkativeness: "发言倾向",
      depth_prompt: "深度提示"
    };
    async function fetchImportSource(url) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`URL 读取失败：HTTP ${response.status}`);
      }
      const blob = await response.blob();
      return {
        sourceKind: "url",
        sourceName: getFileNameFromResponse(response, url),
        blob,
        contentType: response.headers.get("content-type") || blob.type
      };
    }
    async function expandImportSources(input) {
      const format = inferSourceFormatSafe(input.sourceName, input.contentType || input.blob.type);
      if (format !== "zip") return [ input ];
      const files = (0, fflate__WEBPACK_IMPORTED_MODULE_0__.unzipSync)(new Uint8Array(await input.blob.arrayBuffer()));
      const sources = Object.entries(files).filter(([name]) => /\.(?:json|png)$/i.test(name)).map(([name, bytes]) => ({
        sourceKind: input.sourceKind,
        sourceName: `${input.sourceName} / ${name}`,
        blob: new Blob([ bytes ], {
          type: inferContentType(name)
        }),
        contentType: inferContentType(name)
      }));
      if (sources.length === 0) {
        throw new Error("ZIP 中没有找到 JSON 或 PNG 角色卡。");
      }
      return sources;
    }
    async function parseImportSource(input) {
      const format = inferFormat(input.sourceName, input.contentType || input.blob.type);
      if (format === "json") {
        return parseJsonCard(input.blob);
      }
      return parsePngCard(input.blob);
    }
    async function buildImportCandidate(input, characters, tags, tagMap, readExistingDetail) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        const parsed = await parseImportSource(input);
        const sourceFileName = ensureCharacterFileName(input.sourceName, parsed.format);
        const summary = (0, _host__WEBPACK_IMPORTED_MODULE_1__.normalizeSummary)({
          avatar: sourceFileName,
          name: stringValue(parsed.card.name),
          data: parsed.card
        });
        const match = characters.find(character => character.fileName === sourceFileName);
        const nameConflict = match ? undefined : characters.find(character => normalizeName(character.name) === normalizeName(summary.name));
        const existingDetail = match ? await readExistingDetail(match.fileName, match) : undefined;
        const mergedRaw = mergeImportRaw(parsed.raw, existingDetail, match, tagMap);
        const importBlob = buildImportBlob(mergedRaw, input.blob, parsed.format);
        const issues = [];
        if (nameConflict) {
          issues.push({
            level: "warning",
            message: `已有同名角色“${nameConflict.name}”，但文件名不同，将按新增处理。`
          });
        }
        const candidate = {
          id,
          sourceKind: input.sourceKind,
          sourceName: input.sourceName,
          fileName: sourceFileName,
          format: parsed.format,
          blob: input.blob,
          raw: parsed.raw,
          card: parsed.card,
          summary: {
            ...summary,
            tagIds: match?.tagIds || [],
            tags: match?.tags || []
          },
          action: match ? "update" : "create",
          status: "ready",
          issues,
          nameConflict,
          match,
          existingDetail,
          mergedRaw,
          importBlob,
          diff: buildImportDiff(parsed.card, mergedRaw, existingDetail, match, tags, tagMap)
        };
        return candidate;
      } catch (error) {
        return buildErrorCandidate(id, input, formatError(error));
      }
    }
    function canApplyImport(candidates) {
      return candidates.length > 0 && candidates.every(candidate => candidate.status !== "error");
    }
    function buildImportDiff(newCard, mergedRaw, existingDetail, match, tags, tagMap) {
      const mergedCard = getCardData(mergedRaw);
      const identityRows = [ diffRow("名称", existingDetail?.name || match?.name, newCard.name, mergedCard.name), diffRow("文件名", match?.fileName, match?.fileName || "", match?.fileName || ""), diffRow("作者", existingDetail?.creator || match?.creator, newCard.creator, mergedCard.creator), diffRow("版本", existingDetail?.character_version || match?.character_version, newCard.character_version, mergedCard.character_version) ];
      const gameplayRows = GAMEPLAY_FIELDS.map(([key, label]) => diffRow(label, getCardField(existingDetail, key), newCard[key], mergedCard[key]));
      const metaRows = META_FIELDS.map(([key, label]) => diffRow(label, getCardField(existingDetail, key), newCard[key], mergedCard[key]));
      const extensionRows = PRESERVED_EXTENSION_KEYS.map(key => diffRow(EXTENSION_FIELD_LABELS[key] || `扩展：${key}`, existingDetail ? getExtensionValue(existingDetail, key) : "", getExtensionValue(newCard, key), getExtensionValue(mergedCard, key), true)).filter(row => row.oldValue || row.newValue || row.finalValue);
      const preservedTags = match ? getPreservedTagNames(match.fileName, tags, tagMap) : "";
      return [ {
        id: "identity",
        title: "身份",
        rows: identityRows
      }, {
        id: "gameplay",
        title: "游玩内容",
        rows: gameplayRows
      }, {
        id: "metadata",
        title: "元数据与保留项",
        rows: [ ...metaRows, ...extensionRows, diffRow("标签", preservedTags, match ? preservedTags : "", match ? preservedTags || "无" : "新增卡不继承标签", Boolean(match)) ]
      } ];
    }
    function parseJsonCard(blob) {
      return blob.text().then(text => {
        const raw = JSON.parse(text);
        return {
          format: "json",
          raw,
          card: getCardData(raw)
        };
      });
    }
    async function parsePngCard(blob) {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (!PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) {
        throw new Error("PNG 文件头无效。");
      }
      let offset = PNG_SIGNATURE.length;
      while (offset + 12 <= bytes.length) {
        const length = readUint32(bytes, offset);
        const type = TEXT_DECODER.decode(bytes.slice(offset + 4, offset + 8));
        const dataStart = offset + 8;
        const dataEnd = dataStart + length;
        if (dataEnd > bytes.length) break;
        const text = readPngText(type, bytes.slice(dataStart, dataEnd));
        if (text) {
          const separator = text.indexOf("\0");
          const key = (separator >= 0 ? text.slice(0, separator) : "").toLowerCase();
          const value = separator >= 0 ? text.slice(separator + 1) : text;
          if (CARD_TEXT_KEYS.has(key)) {
            const raw = JSON.parse(decodeBase64Utf8(value));
            return {
              format: "png",
              raw,
              card: getCardData(raw)
            };
          }
        }
        offset = dataEnd + 4;
      }
      throw new Error("没有在 PNG 中找到角色卡数据。");
    }
    function readPngText(type, data) {
      if (type === "tEXt") return TEXT_DECODER.decode(data);
      if (type !== "iTXt") return "";
      const keywordEnd = data.indexOf(0);
      if (keywordEnd < 0 || keywordEnd + 5 >= data.length) return "";
      const compressionFlag = data[keywordEnd + 1];
      if (compressionFlag !== 0) return "";
      let cursor = keywordEnd + 3;
      for (let index = 0; index < 2; index += 1) {
        const end = data.indexOf(0, cursor);
        if (end < 0) return "";
        cursor = end + 1;
      }
      return `${TEXT_DECODER.decode(data.slice(0, keywordEnd))}\0${TEXT_DECODER.decode(data.slice(cursor))}`;
    }
    function getCardData(raw) {
      const data = isRecord(raw.data) ? raw.data : raw;
      return {
        ...data,
        name: stringValue(data.name || raw.name),
        description: stringValue(data.description || raw.description || raw.desc),
        personality: stringValue(data.personality || raw.personality),
        scenario: stringValue(data.scenario || raw.scenario),
        first_mes: stringValue(data.first_mes || raw.first_mes || raw.firstMes),
        alternate_greetings: arrayValue(data.alternate_greetings || raw.alternate_greetings || raw.altGreetings),
        mes_example: stringValue(data.mes_example || raw.mes_example),
        creator: stringValue(data.creator || raw.creator),
        character_version: stringValue(data.character_version || raw.character_version),
        character_book: data.character_book || raw.character_book || "",
        creator_notes: stringValue(data.creator_notes || data.creatorcomment || raw.creator_notes),
        system_prompt: stringValue(data.system_prompt || data.extensions?.system_prompt || raw.system_prompt),
        post_history_instructions: stringValue(data.post_history_instructions || data.extensions?.post_history_instructions || raw.post_history_instructions),
        extensions: isRecord(data.extensions) ? data.extensions : {}
      };
    }
    function mergeImportRaw(newRaw, existingDetail, match, tagMap) {
      if (!existingDetail && !match) return newRaw;
      const nextRaw = cloneRecord(newRaw);
      const nextData = getWritableCardData(nextRaw);
      const nextExtensions = isRecord(nextData.extensions) ? {
        ...nextData.extensions
      } : {};
      const oldExtensions = getExistingExtensions(existingDetail);
      Object.entries(oldExtensions).forEach(([key, value]) => {
        if (nextExtensions[key] === undefined || nextExtensions[key] === "" || nextExtensions[key] === null) {
          nextExtensions[key] = value;
        }
      });
      mergeSourceUrlExtension(nextExtensions, existingDetail?.sourceUrl);
      if (existingDetail?.fav && nextData.fav === undefined) nextData.fav = existingDetail.fav;
      if (existingDetail?.fav && nextExtensions.fav === undefined) nextExtensions.fav = existingDetail.fav;
      if (match?.date_added && nextData.create_date === undefined) nextData.create_date = match.date_added;
      if (match?.fileName && tagMap[match.fileName]?.length) nextExtensions.tags_preserved_by_manager = true;
      nextData.extensions = nextExtensions;
      return nextRaw;
    }
    function getWritableCardData(raw) {
      if (isRecord(raw.data)) return raw.data;
      return raw;
    }
    function buildImportBlob(raw, originalBlob, format) {
      if (format === "png") return originalBlob;
      return new Blob([ JSON.stringify(raw, null, 2) ], {
        type: "application/json;charset=utf-8"
      });
    }
    function buildErrorCandidate(id, input, message) {
      const fallbackName = ensureCharacterFileName(input.sourceName || "无法解析.json", inferFormatSafe(input.sourceName, input.contentType));
      const summary = (0, _host__WEBPACK_IMPORTED_MODULE_1__.normalizeSummary)({
        avatar: fallbackName,
        name: input.sourceName || "无法解析"
      });
      return {
        id,
        sourceKind: input.sourceKind,
        sourceName: input.sourceName,
        fileName: fallbackName,
        format: inferFormatSafe(input.sourceName, input.contentType),
        blob: input.blob,
        raw: {},
        card: {},
        summary,
        action: "create",
        status: "error",
        issues: [ {
          level: "error",
          message
        } ],
        mergedRaw: {},
        importBlob: input.blob,
        diff: [],
        resultMessage: message
      };
    }
    function inferFormat(fileName, contentType = "") {
      const lowerName = fileName.toLowerCase();
      const lowerType = contentType.toLowerCase();
      if (lowerName.endsWith(".json") || lowerType.includes("json")) return "json";
      if (lowerName.endsWith(".png") || lowerType.includes("png")) return "png";
      throw new Error("只支持 JSON 或 PNG 角色卡。");
    }
    function inferSourceFormat(fileName, contentType = "") {
      const lowerName = fileName.toLowerCase();
      const lowerType = contentType.toLowerCase();
      if (lowerName.endsWith(".zip") || lowerType.includes("zip")) return "zip";
      return inferFormat(fileName, contentType);
    }
    function inferSourceFormatSafe(fileName, contentType = "") {
      try {
        return inferSourceFormat(fileName, contentType);
      } catch {
        return "json";
      }
    }
    function inferContentType(fileName) {
      const lowerName = fileName.toLowerCase();
      if (lowerName.endsWith(".png")) return "image/png";
      if (lowerName.endsWith(".zip")) return "application/zip";
      return "application/json";
    }
    function inferFormatSafe(fileName, contentType = "") {
      try {
        return inferFormat(fileName, contentType);
      } catch {
        return "json";
      }
    }
    function ensureCharacterFileName(sourceName, format) {
      const fallback = format === "png" ? "未命名角色.png" : "未命名角色.json";
      const safeName = sourceName.split(/[\\/]/).pop() || fallback;
      if (/\.(?:json|png)$/i.test(safeName)) return safeName;
      return `${safeName}.${format}`;
    }
    function getFileNameFromResponse(response, url) {
      const disposition = response.headers.get("content-disposition") || "";
      const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
      if (match?.[1]) return decodeURIComponent(match[1].replace(/"$/u, ""));
      try {
        const path = new URL(url).pathname;
        return decodeURIComponent(path.split("/").pop() || "url-角色卡.json");
      } catch {
        return "url-角色卡.json";
      }
    }
    function diffRow(label, oldValue, newValue, finalValue, preserved = false) {
      const oldText = displayValue(oldValue, label);
      const newText = displayValue(newValue, label);
      const finalText = displayValue(finalValue, label);
      return {
        label,
        oldValue: oldText,
        newValue: newText,
        finalValue: finalText,
        changed: oldText !== finalText,
        preserved: preserved && Boolean(oldText) && oldText === finalText && oldText !== newText
      };
    }
    function getCardField(detail, key) {
      if (!detail) return "";
      if (key === "character_book") return detail.character_book;
      return detail[key] || "";
    }
    function getExtensionValue(card, key) {
      if (!isRecord(card.extensions)) return "";
      if (key === "source_url") {
        return getSourceUrlFromExtensions(card.extensions);
      }
      return card.extensions[key];
    }
    function getExistingExtensions(detail) {
      if (!detail) return {};
      return {
        source_url: detail.sourceUrl || undefined,
        source_link: detail.sourceUrl || undefined,
        fav: detail.fav || undefined
      };
    }
    function mergeSourceUrlExtension(extensions, existingSourceUrl = "") {
      const sourceUrl = getSourceUrlFromExtensions(extensions) || existingSourceUrl;
      if (!sourceUrl) return;
      if (extensions.source_url === undefined || extensions.source_url === "" || extensions.source_url === null) {
        extensions.source_url = sourceUrl;
      }
      if (extensions.source_link === undefined || extensions.source_link === "" || extensions.source_link === null) {
        extensions.source_link = sourceUrl;
      }
    }
    function getSourceUrlFromExtensions(extensions) {
      return stringValue(extensions.source_url || extensions.source_link || extensions.url || extensions.source);
    }
    function getPreservedTagNames(fileName, tags, tagMap) {
      const ids = tagMap[fileName] || [];
      return ids.map(id => tags.find(tag => tag.id === id)?.name).filter(name => Boolean(name)).join("、");
    }
    function readUint32(bytes, offset) {
      return (bytes[offset] << 24 | bytes[offset + 1] << 16 | bytes[offset + 2] << 8 | bytes[offset + 3]) >>> 0;
    }
    function decodeBase64Utf8(value) {
      const binary = atob(value.trim());
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      return TEXT_DECODER.decode(bytes);
    }
    function displayValue(value, label = "") {
      if (label === "世界书") return displayWorldBookValue(value);
      if (label === "深度提示") return displayDepthPromptValue(value);
      if (Array.isArray(value)) return value.length ? `${value.length} 条` : "";
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      if (isRecord(value)) return Object.keys(value).length ? JSON.stringify(value) : "";
      return "";
    }
    function displayWorldBookValue(value) {
      if (typeof value === "string") return value;
      if (!isRecord(value)) return "";
      const entries = Array.isArray(value.entries) ? value.entries : [];
      const name = stringValue(value.name) || stringValue(value.comment) || stringValue(entries.find(isRecord)?.comment);
      if (name && entries.length > 0) return `${name}（${entries.length} 条）`;
      if (name) return name;
      return entries.length > 0 ? `内嵌世界书（${entries.length} 条）` : "";
    }
    function displayDepthPromptValue(value) {
      if (typeof value === "string") return value;
      if (!isRecord(value)) return "";
      const prompt = stringValue(value.prompt).trim();
      if (!prompt) return "";
      const details = [ typeof value.depth === "number" ? `深度 ${value.depth}` : "", stringValue(value.role) ].filter(Boolean);
      return details.length > 0 ? `${prompt}（${details.join("，")}）` : prompt;
    }
    function normalizeName(name) {
      return name.trim().toLocaleLowerCase();
    }
    function stringValue(value) {
      return typeof value === "string" ? value : "";
    }
    function arrayValue(value) {
      return Array.isArray(value) ? value.filter(item => typeof item === "string") : [];
    }
    function isRecord(value) {
      return Boolean(value && typeof value === "object" && !Array.isArray(value));
    }
    function cloneRecord(value) {
      return JSON.parse(JSON.stringify(value));
    }
    function formatError(error) {
      return error instanceof Error ? error.message : String(error || "未知错误");
    }
    function encodePngTextChunkForTest(key, value) {
      const payload = TEXT_ENCODER.encode(`${key}\0${value}`);
      const bytes = new Uint8Array(PNG_SIGNATURE.length + 12 + payload.length + 12);
      bytes.set(PNG_SIGNATURE, 0);
      writeUint32(bytes, PNG_SIGNATURE.length, payload.length);
      bytes.set(TEXT_ENCODER.encode("tEXt"), PNG_SIGNATURE.length + 4);
      bytes.set(payload, PNG_SIGNATURE.length + 8);
      const nextOffset = PNG_SIGNATURE.length + 12 + payload.length;
      writeUint32(bytes, nextOffset, 0);
      bytes.set(TEXT_ENCODER.encode("IEND"), nextOffset + 4);
      return bytes;
    }
    function writeUint32(bytes, offset, value) {
      bytes[offset] = value >>> 24 & 255;
      bytes[offset + 1] = value >>> 16 & 255;
      bytes[offset + 2] = value >>> 8 & 255;
      bytes[offset + 3] = value & 255;
    }
  },
  "./src/角色卡管理器/tags.ts"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      attachTagsToCharacters: () => attachTagsToCharacters,
      buildUpdatedTagState: () => buildUpdatedTagState,
      createTagId: () => createTagId,
      getTagCounts: () => getTagCounts,
      getUnknownTagIds: () => getUnknownTagIds,
      normalizeTagMap: () => normalizeTagMap,
      normalizeTavernTags: () => normalizeTavernTags,
      previewTagMutation: () => previewTagMutation
    });
    function normalizeTavernTags(rawTags) {
      if (!Array.isArray(rawTags)) return [];
      return rawTags.map((raw, index) => {
        if (!raw || typeof raw !== "object") return null;
        const record = raw;
        const id = stringValue(record.id || record.key || record.uid || index.toString());
        const name = stringValue(record.name || record.label || record.tag || record.title);
        if (!id || !name) return null;
        return {
          id,
          name,
          color: stringValue(record.color) || undefined
        };
      }).filter(tag => Boolean(tag));
    }
    function normalizeTagMap(rawTagMap) {
      if (!rawTagMap || typeof rawTagMap !== "object") return {};
      return Object.entries(rawTagMap).reduce((result, [fileName, ids]) => {
        result[fileName] = Array.isArray(ids) ? ids.filter(id => typeof id === "string") : [];
        return result;
      }, {});
    }
    function attachTagsToCharacters(characters, tags, tagMap) {
      const tagsById = new Map(tags.map(tag => [ tag.id, tag ]));
      return characters.map(character => {
        const tagIds = tagMap[character.fileName] || [];
        return {
          ...character,
          tagIds,
          tags: tagIds.map(id => tagsById.get(id)).filter(tag => Boolean(tag))
        };
      });
    }
    function getUnknownTagIds(tags, tagMap) {
      const knownIds = new Set(tags.map(tag => tag.id));
      const unknownIds = new Set;
      Object.values(tagMap).forEach(ids => {
        ids.forEach(id => {
          if (!knownIds.has(id)) unknownIds.add(id);
        });
      });
      return [ ...unknownIds ].sort((lhs, rhs) => lhs.localeCompare(rhs, "zh-CN"));
    }
    function getTagCounts(characters) {
      return characters.reduce((counts, character) => {
        character.tagIds.forEach(id => {
          counts[id] = (counts[id] || 0) + 1;
        });
        return counts;
      }, {});
    }
    function previewTagMutation(tags, tagMap, draft) {
      const targetFileNames = Array.from(new Set(draft.fileNames.filter(Boolean)));
      const resolvedTag = resolveMutationTag(tags, draft);
      const errors = [];
      if (targetFileNames.length === 0) {
        errors.push("没有选择角色。");
      }
      if (!resolvedTag.id || !resolvedTag.name) {
        errors.push(draft.action === "create" ? "请输入新标签名称。" : "请选择标签。");
      }
      const changedFileNames = [];
      const unchangedFileNames = [];
      targetFileNames.forEach(fileName => {
        const ids = tagMap[fileName] || [];
        const hasTag = ids.includes(resolvedTag.id);
        const willChange = draft.action === "remove" ? hasTag : !hasTag;
        if (willChange) {
          changedFileNames.push(fileName);
        } else {
          unchangedFileNames.push(fileName);
        }
      });
      return {
        action: draft.action,
        tagId: resolvedTag.id,
        tagName: resolvedTag.name,
        tagColor: resolvedTag.color,
        createsTag: draft.action === "create" && !tags.some(tag => tag.id === resolvedTag.id),
        targetFileNames,
        changedFileNames,
        unchangedFileNames,
        errors
      };
    }
    function buildUpdatedTagState(tags, tagMap, preview) {
      const nextTags = preview.createsTag ? [ ...tags, {
        id: preview.tagId,
        name: preview.tagName,
        color: preview.tagColor
      } ] : [ ...tags ];
      const nextTagMap = Object.fromEntries(Object.entries(tagMap).map(([fileName, ids]) => [ fileName, [ ...ids ] ]));
      preview.changedFileNames.forEach(fileName => {
        const ids = nextTagMap[fileName] ? [ ...nextTagMap[fileName] ] : [];
        if (preview.action === "remove") {
          nextTagMap[fileName] = ids.filter(id => id !== preview.tagId);
        } else if (!ids.includes(preview.tagId)) {
          nextTagMap[fileName] = [ ...ids, preview.tagId ];
        }
      });
      return {
        tags: nextTags,
        tagMap: nextTagMap
      };
    }
    function createTagId(name) {
      const normalized = name.trim().toLocaleLowerCase("zh-CN").replace(/\s+/g, "-");
      const safeName = normalized.replace(/[^\p{L}\p{N}-]+/gu, "").slice(0, 24) || "tag";
      return `cm-${Date.now().toString(36)}-${safeName}`;
    }
    function resolveMutationTag(tags, draft) {
      if (draft.action === "create") {
        const name = (draft.tagName || "").trim();
        const existing = tags.find(tag => tag.name.toLocaleLowerCase("zh-CN") === name.toLocaleLowerCase("zh-CN"));
        return existing || {
          id: draft.tagId || (name ? createTagId(name) : ""),
          name,
          color: draft.tagColor
        };
      }
      return tags.find(tag => tag.id === draft.tagId) || {
        id: draft.tagId || "",
        name: ""
      };
    }
    function stringValue(value) {
      return typeof value === "string" ? value : "";
    }
  },
  "./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-vue-components!./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-auto-import!./node_modules/.pnpm/ts-loader@9.6.0_loader-util_0ef68b16dcc23cdc6804530e4000b72d/node_modules/ts-loader/index.js??clonedRuleSet-42!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./src/角色卡管理器/App.vue?vue&type=script&setup=true&lang=ts"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      default: () => __WEBPACK_DEFAULT_EXPORT__
    });
    var vue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! vue */ "./node_modules/.pnpm/vue@3.5.35_typescript@6.0.0-dev.20250807/node_modules/vue/dist/vue.runtime.esm-bundler.js");
    var _filters__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./filters */ "./src/角色卡管理器/filters.ts");
    var _host__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./host */ "./src/角色卡管理器/host.ts");
    var _imports__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./imports */ "./src/角色卡管理器/imports.ts");
    var _tags__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./tags */ "./src/角色卡管理器/tags.ts");
    const DETAIL_LOADING_DELAY_MS = 180;
    const TAG_FILTER_MODE_KEY = "character-card-manager:tag-filter-mode";
    const CHAT_ALIAS_KEY = "character-card-manager:chat-aliases";
    const CARD_GRID_GAP_PX = 8;
    const CARD_GRID_HORIZONTAL_PADDING_PX = 20;
    const CARD_HEIGHT_RATIO = 4 / 3;
    const __WEBPACK_DEFAULT_EXPORT__ = (0, vue__WEBPACK_IMPORTED_MODULE_0__.defineComponent)({
      __name: "App",
      setup(__props, {expose: __expose}) {
        __expose();
        const sideFilters = [ {
          id: "all",
          label: "全部"
        }, {
          id: "favorite",
          label: "收藏"
        }, {
          id: "untagged",
          label: "无标签"
        } ];
        const characters = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)([]);
        const tavernTags = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)([]);
        const tagMap = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)({});
        const selectedFile = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const selectedDetail = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(null);
        const loadingList = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const loadingDetail = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const query = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const activeFilter = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("all");
        const activeTagIds = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)([]);
        const tagFilterMode = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(readStoredTagFilterMode());
        const settingsOpen = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const sortBy = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("date_added");
        const globalIssues = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)([]);
        const leftCollapsed = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const rightCollapsed = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const leftCollapsedBeforeImport = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const cardSizeIndex = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(1);
        const selectedGreetingIndex = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(0);
        const selectionMode = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const selectedFiles = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(new Set);
        const tagAction = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("add");
        const selectedTagId = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const newTagName = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const tagPreview = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(null);
        const tagStatus = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const applyingTags = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const applyingFavoriteFiles = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(new Set);
        const applyingBatchFavorite = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const exportingFiles = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const managementStatus = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const launchingFileName = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const deletePreview = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(null);
        const deleteBackupCharacters = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(true);
        const deleteChats = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const deleteWorldBooks = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(true);
        const deleteConfirmText = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const applyingDeletion = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const tagDialogOpen = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const detailTagName = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const applyingDetailTag = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const chatStates = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)({});
        const chatsExpanded = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const chatAliases = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(readStoredChatAliases());
        const expandedChatKey = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const chatContentStates = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)({});
        const deletingChatKeys = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(new Set);
        const sourceUrlDraft = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const sourceUrlError = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const savingSourceUrl = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const renameInput = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const applyingRename = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const avatarUrlIndex = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)({});
        const originalAvatarUrls = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)({});
        const importAvatarUrls = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)({});
        const importMode = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const importUrl = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const importCandidates = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)([]);
        const selectedImportId = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const parsingImports = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const applyingImports = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(false);
        const importStatus = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)("");
        const galleryElement = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(null);
        const galleryContentWidth = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(0);
        const galleryColumnGap = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(CARD_GRID_GAP_PX);
        const galleryRenderedColumns = (0, vue__WEBPACK_IMPORTED_MODULE_0__.ref)(0);
        const loadingOriginalAvatars = new Set;
        const cardSizes = [ {
          label: "小",
          columns: 8
        }, {
          label: "中",
          columns: 6
        }, {
          label: "大",
          columns: 4
        }, {
          label: "特大",
          columns: 3
        } ];
        let detailRequestId = 0;
        let detailLoadingTimer;
        let galleryResizeObserver;
        let galleryResizeFallback;
        const visibleCharacters = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => (0, 
        _filters__WEBPACK_IMPORTED_MODULE_1__.sortCharacters)((0, _filters__WEBPACK_IMPORTED_MODULE_1__.filterCharacters)(characters.value, query.value, activeFilter.value, activeTagIds.value, tagFilterMode.value), sortBy.value));
        const selectedSummary = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => characters.value.find(character => character.fileName === selectedFile.value));
        const selectedCharacters = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => characters.value.filter(character => selectedFiles.value.has(character.fileName)));
        const selectedFileList = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => selectedCharacters.value.map(character => character.fileName));
        const filterCounts = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => (0, _filters__WEBPACK_IMPORTED_MODULE_1__.getFilterCounts)(characters.value));
        const tagCounts = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => (0, _tags__WEBPACK_IMPORTED_MODULE_4__.getTagCounts)(characters.value));
        const selectedTagDistribution = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => selectedCharacters.value.flatMap(character => character.tags).reduce((result, tag) => {
          result[tag.id] = result[tag.id] || {
            tag,
            count: 0
          };
          result[tag.id].count += 1;
          return result;
        }, {}));
        const selectedFavoriteCount = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => selectedCharacters.value.filter(character => character.fav).length);
        const selectedMissingGreetingCount = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => selectedCharacters.value.filter(character => !character.firstMes).length);
        const selectedErrorCount = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => selectedCharacters.value.filter(character => character.issues.some(issue => issue.level === "error")).length);
        const showSelectionSummary = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => selectionMode.value && selectedCharacters.value.length > 0);
        const detailActiveTagIds = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => new Set(activePreview.value?.tagIds || []));
        const activePreview = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => selectedSummary.value || selectedDetail.value || null);
        const detailPreview = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => {
          if (selectedDetail.value?.fileName === selectedFile.value) return selectedDetail.value;
          return selectedDetail.value || activePreview.value;
        });
        const previewRiskIssues = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => detailPreview.value?.issues.filter(issue => issue.level !== "info") || []);
        const previewDescription = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => {
          if (!detailPreview.value) return "";
          return "description" in detailPreview.value ? detailPreview.value.description : detailPreview.value.desc;
        });
        const previewFirstMessage = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => {
          if (!detailPreview.value) return "";
          return "first_mes" in detailPreview.value ? detailPreview.value.first_mes : detailPreview.value.firstMes;
        });
        const previewAltGreetings = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => detailPreview.value && "alternate_greetings" in detailPreview.value ? detailPreview.value.alternate_greetings : []);
        const greetingOptions = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => [ previewFirstMessage.value, ...previewAltGreetings.value ]);
        const selectedGreeting = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => greetingOptions.value[selectedGreetingIndex.value] || greetingOptions.value[0]);
        const greetingPageLabel = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => `${Math.min(selectedGreetingIndex.value + 1, greetingOptions.value.length)} / ${greetingOptions.value.length}`);
        const cardSize = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => cardSizes[cardSizeIndex.value]);
        const cardGridStyle = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => ({
          "--cm-card-cols": String(cardSize.value.columns),
          "--cm-card-height": `${getMeasuredCardHeight(galleryRenderedColumns.value || cardSize.value.columns)}px`
        }));
        const selectedImportCandidate = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => importCandidates.value.find(candidate => candidate.id === selectedImportId.value) || importCandidates.value[0] || null);
        const selectedImportDiff = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => filterImportDiff(selectedImportCandidate.value?.diff || []));
        const importReadyCount = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => importCandidates.value.filter(candidate => candidate.status !== "error").length);
        const importErrorCount = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => importCandidates.value.filter(candidate => candidate.status === "error").length);
        const canConfirmImports = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => (0, 
        _imports__WEBPACK_IMPORTED_MODULE_3__.canApplyImport)(importCandidates.value) && !parsingImports.value && !applyingImports.value);
        const renamePreview = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => {
          if (!activePreview.value) return null;
          return (0, _host__WEBPACK_IMPORTED_MODULE_2__.previewCharacterRename)(activePreview.value, renameInput.value, characters.value);
        });
        const canSaveRename = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => Boolean(activePreview.value && renameInput.value.trim() && renameInput.value.trim() !== activePreview.value.name && !applyingRename.value));
        const canOpenSourceUrl = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => /^https?:\/\//i.test(sourceUrlDraft.value.trim()));
        const activeChatState = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => activePreview.value ? chatStates.value[activePreview.value.fileName] || {
          loading: false,
          error: "",
          chats: []
        } : {
          loading: false,
          error: "",
          chats: []
        });
        const canConfirmDeletion = (0, vue__WEBPACK_IMPORTED_MODULE_0__.computed)(() => Boolean(deletePreview.value) && !applyingDeletion.value && deletePreview.value.errors.length === 0 && (!deletePreview.value.requiresDeleteText || deleteConfirmText.value === "DELETE"));
        (0, vue__WEBPACK_IMPORTED_MODULE_0__.watch)(() => activePreview.value?.fileName, () => {
          sourceUrlDraft.value = activePreview.value?.sourceUrl || "";
          sourceUrlError.value = "";
          chatsExpanded.value = false;
          expandedChatKey.value = "";
        }, {
          immediate: true
        });
        (0, vue__WEBPACK_IMPORTED_MODULE_0__.watch)(() => `${activePreview.value?.fileName || ""}\n${activePreview.value?.name || ""}`, () => {
          if (!applyingRename.value) {
            renameInput.value = activePreview.value?.name || "";
          }
        }, {
          immediate: true
        });
        (0, vue__WEBPACK_IMPORTED_MODULE_0__.watch)(() => activePreview.value?.sourceUrl, value => {
          if (!savingSourceUrl.value) {
            sourceUrlDraft.value = value || "";
          }
        });
        (0, vue__WEBPACK_IMPORTED_MODULE_0__.watch)(galleryElement, element => {
          observeGalleryElement(element);
        }, {
          flush: "post"
        });
        (0, vue__WEBPACK_IMPORTED_MODULE_0__.watch)(() => cardSize.value.columns, () => {
          window.requestAnimationFrame(() => refreshGalleryMetrics());
        });
        (0, vue__WEBPACK_IMPORTED_MODULE_0__.onMounted)(() => {
          observeGalleryElement(galleryElement.value);
          void refreshList();
        });
        (0, vue__WEBPACK_IMPORTED_MODULE_0__.onUnmounted)(() => {
          clearDetailLoadingTimer();
          disconnectGalleryObserver();
          revokeImportAvatarUrls();
        });
        function getMeasuredCardHeight(columns) {
          const safeColumns = Math.max(1, columns);
          const width = galleryContentWidth.value || estimateGalleryWidth();
          const gap = galleryColumnGap.value || CARD_GRID_GAP_PX;
          const columnWidth = (width - gap * (safeColumns - 1)) / safeColumns;
          return Math.max(120, Math.round(columnWidth * CARD_HEIGHT_RATIO));
        }
        function estimateGalleryWidth() {
          if (typeof window === "undefined") return 360;
          return Math.max(320, window.innerWidth - 700 - CARD_GRID_HORIZONTAL_PADDING_PX);
        }
        function observeGalleryElement(element) {
          disconnectGalleryObserver();
          if (!element) {
            galleryContentWidth.value = 0;
            galleryRenderedColumns.value = 0;
            return;
          }
          refreshGalleryMetrics(element);
          if (typeof ResizeObserver === "function") {
            galleryResizeObserver = new ResizeObserver(() => refreshGalleryMetrics(element));
            galleryResizeObserver.observe(element);
            return;
          }
          galleryResizeFallback = () => refreshGalleryMetrics(element);
          window.addEventListener("resize", galleryResizeFallback);
        }
        function refreshGalleryMetrics(element = galleryElement.value) {
          if (!element) return;
          const style = window.getComputedStyle(element);
          const paddingLeft = parsePx(style.paddingLeft);
          const paddingRight = parsePx(style.paddingRight);
          const columnGap = parsePx(style.columnGap || style.gap);
          galleryColumnGap.value = columnGap || CARD_GRID_GAP_PX;
          galleryContentWidth.value = Math.max(0, element.clientWidth - paddingLeft - paddingRight);
          galleryRenderedColumns.value = getRenderedColumnCount(style) || cardSize.value.columns;
        }
        function disconnectGalleryObserver() {
          galleryResizeObserver?.disconnect();
          galleryResizeObserver = undefined;
          if (galleryResizeFallback) {
            window.removeEventListener("resize", galleryResizeFallback);
            galleryResizeFallback = undefined;
          }
        }
        function parsePx(value) {
          const parsed = Number.parseFloat(value);
          return Number.isFinite(parsed) ? parsed : 0;
        }
        function getRenderedColumnCount(style) {
          const template = style.gridTemplateColumns;
          if (!template || template === "none") return 0;
          return template.split(/\s+/).filter(Boolean).length;
        }
        async function refreshList() {
          loadingList.value = true;
          selectedDetail.value = null;
          selectedGreetingIndex.value = 0;
          globalIssues.value = [];
          try {
            const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.readCharacterList)();
            characters.value = result.characters;
            tavernTags.value = result.tags;
            tagMap.value = result.tagMap;
            globalIssues.value = result.issues.map(issue => issue.message);
            selectedTagId.value = selectedTagId.value || result.tags[0]?.id || "";
            selectedFiles.value = new Set([ ...selectedFiles.value ].filter(fileName => result.characters.some(character => character.fileName === fileName)));
            activeTagIds.value = activeTagIds.value.filter(id => result.tags.some(tag => tag.id === id));
            result.characters.forEach(character => {
              void loadOriginalAvatar(character);
            });
            if (!selectedFile.value || !characters.value.some(character => character.fileName === selectedFile.value)) {
              selectedFile.value = characters.value[0]?.fileName || "";
            }
          } finally {
            loadingList.value = false;
          }
        }
        function activateFilter(filter) {
          activeFilter.value = filter;
          activeTagIds.value = [];
        }
        function activateTagFilter(tagId) {
          if (tagFilterMode.value === "exclusive") {
            activeTagIds.value = activeTagIds.value.includes(tagId) ? [] : [ tagId ];
          } else {
            activeTagIds.value = activeTagIds.value.includes(tagId) ? activeTagIds.value.filter(id => id !== tagId) : [ ...activeTagIds.value, tagId ];
          }
          if (activeTagIds.value.length > 0) activeFilter.value = "all";
        }
        function clearTagFilters() {
          activeTagIds.value = [];
          activeFilter.value = "all";
        }
        function toggleImportMode() {
          const nextImportMode = !importMode.value;
          importMode.value = nextImportMode;
          if (nextImportMode) {
            leftCollapsedBeforeImport.value = leftCollapsed.value;
            leftCollapsed.value = true;
            selectionMode.value = false;
            selectedFiles.value = new Set;
            clearTagPreview();
            resetRenameEditor();
            closeTagDialog();
          } else {
            leftCollapsed.value = leftCollapsedBeforeImport.value;
          }
        }
        async function selectCharacter(character) {
          const requestId = detailRequestId + 1;
          detailRequestId = requestId;
          selectedFile.value = character.fileName;
          selectedGreetingIndex.value = 0;
          resetRenameEditor();
          closeTagDialog();
          loadingDetail.value = false;
          clearDetailLoadingTimer();
          detailLoadingTimer = setTimeout(() => {
            if (detailRequestId === requestId) {
              loadingDetail.value = true;
            }
          }, DETAIL_LOADING_DELAY_MS);
          try {
            const detail = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.readCharacterDetail)(character.fileName, character);
            if (detailRequestId === requestId) {
              selectedDetail.value = detail;
            }
          } finally {
            if (detailRequestId === requestId) {
              clearDetailLoadingTimer();
              loadingDetail.value = false;
            }
          }
        }
        function setTagFilterMode(mode) {
          tagFilterMode.value = mode;
          if (mode === "exclusive" && activeTagIds.value.length > 1) {
            activeTagIds.value = activeTagIds.value.slice(0, 1);
          }
          try {
            localStorage.setItem(TAG_FILTER_MODE_KEY, mode);
          } catch {}
        }
        function clearDetailLoadingTimer() {
          if (detailLoadingTimer) {
            clearTimeout(detailLoadingTimer);
            detailLoadingTimer = undefined;
          }
        }
        function readStoredTagFilterMode() {
          try {
            const stored = localStorage.getItem(TAG_FILTER_MODE_KEY);
            return stored === "or" || stored === "and" ? stored : "exclusive";
          } catch {
            return "exclusive";
          }
        }
        function readStoredChatAliases() {
          try {
            const stored = localStorage.getItem(CHAT_ALIAS_KEY);
            const parsed = stored ? JSON.parse(stored) : {};
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
          } catch {
            return {};
          }
        }
        function saveChatAliases() {
          try {
            localStorage.setItem(CHAT_ALIAS_KEY, JSON.stringify(chatAliases.value));
          } catch {}
        }
        function formatDate(timestamp) {
          if (!timestamp) return "未知";
          const date = new Date(timestamp);
          if (Number.isNaN(date.getTime())) return "未知";
          return date.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          });
        }
        function truncate(text, fallback = "无内容", maxLength = 140) {
          if (!text) return fallback;
          return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
        }
        function getAvatarSrc(character) {
          const originalUrl = originalAvatarUrls.value[character.fileName];
          if (originalUrl) return originalUrl;
          const urls = character.avatarFallbackUrls.length ? character.avatarFallbackUrls : [ character.avatarUrl ];
          const index = avatarUrlIndex.value[character.fileName] || 0;
          return urls[Math.min(index, urls.length - 1)] || "";
        }
        function getImportAvatarSrc(candidate) {
          return importAvatarUrls.value[candidate.id] || "";
        }
        function handleAvatarError(character) {
          const urls = character.avatarFallbackUrls.length ? character.avatarFallbackUrls : [ character.avatarUrl ];
          const index = avatarUrlIndex.value[character.fileName] || 0;
          if (index < urls.length - 1) {
            avatarUrlIndex.value = {
              ...avatarUrlIndex.value,
              [character.fileName]: index + 1
            };
          }
        }
        function changeCardSize(delta) {
          cardSizeIndex.value = Math.min(Math.max(cardSizeIndex.value + delta, 0), cardSizes.length - 1);
        }
        function handleGalleryWheel(event) {
          if (!event.ctrlKey || event.deltaY === 0) return;
          event.preventDefault();
          changeCardSize(event.deltaY < 0 ? 1 : -1);
        }
        function changeGreeting(delta) {
          const lastIndex = Math.max(greetingOptions.value.length - 1, 0);
          selectedGreetingIndex.value = Math.min(Math.max(selectedGreetingIndex.value + delta, 0), lastIndex);
        }
        function toggleSelectionMode() {
          selectionMode.value = !selectionMode.value;
          clearTagPreview();
          clearDeletePreview();
          resetRenameEditor();
          if (!selectionMode.value) {
            selectedFiles.value = new Set;
          }
        }
        function toggleCharacterSelection(fileName) {
          const next = new Set(selectedFiles.value);
          if (next.has(fileName)) {
            next.delete(fileName);
          } else {
            next.add(fileName);
          }
          selectedFiles.value = next;
          clearTagPreview();
          clearDeletePreview();
        }
        function selectVisibleCharacters() {
          selectedFiles.value = new Set([ ...selectedFiles.value, ...visibleCharacters.value.map(character => character.fileName) ]);
          clearTagPreview();
          clearDeletePreview();
        }
        function clearSelection() {
          selectedFiles.value = new Set;
          clearTagPreview();
          clearDeletePreview();
        }
        function buildTagDraft() {
          return {
            action: tagAction.value,
            fileNames: selectedFileList.value,
            tagId: tagAction.value === "create" ? undefined : selectedTagId.value,
            tagName: tagAction.value === "create" ? newTagName.value : undefined
          };
        }
        function previewTagChanges() {
          tagPreview.value = (0, _tags__WEBPACK_IMPORTED_MODULE_4__.previewTagMutation)(tavernTags.value, tagMap.value, buildTagDraft());
          tagStatus.value = "";
        }
        function clearTagPreview() {
          tagPreview.value = null;
          tagStatus.value = "";
        }
        function clearDeletePreview() {
          deletePreview.value = null;
          deleteConfirmText.value = "";
        }
        function openTagDialog() {
          if (!activePreview.value) return;
          detailTagName.value = "";
          managementStatus.value = "";
          tagDialogOpen.value = true;
        }
        function closeTagDialog() {
          tagDialogOpen.value = false;
          detailTagName.value = "";
          applyingDetailTag.value = false;
        }
        async function removeDetailTag(tag) {
          if (!activePreview.value || applyingDetailTag.value) return;
          applyingDetailTag.value = true;
          managementStatus.value = "";
          try {
            const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.applyTagMutation)({
              action: "remove",
              fileNames: [ activePreview.value.fileName ],
              tagId: tag.id
            });
            managementStatus.value = result.message;
            if (result.success) await refreshList();
          } finally {
            applyingDetailTag.value = false;
          }
        }
        async function toggleDetailTag(tag) {
          if (!activePreview.value || applyingDetailTag.value) return;
          applyingDetailTag.value = true;
          managementStatus.value = "";
          try {
            const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.applyTagMutation)({
              action: detailActiveTagIds.value.has(tag.id) ? "remove" : "add",
              fileNames: [ activePreview.value.fileName ],
              tagId: tag.id
            });
            managementStatus.value = result.message;
            if (result.success) await refreshList();
          } finally {
            applyingDetailTag.value = false;
          }
        }
        async function confirmCustomDetailTag() {
          if (!activePreview.value || applyingDetailTag.value) return;
          const customName = detailTagName.value.trim();
          if (!customName) return;
          applyingDetailTag.value = true;
          managementStatus.value = "";
          try {
            const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.applyTagMutation)({
              action: "create",
              fileNames: [ activePreview.value.fileName ],
              tagName: customName
            });
            managementStatus.value = result.message;
            if (result.success) {
              detailTagName.value = "";
              await refreshList();
            }
          } finally {
            applyingDetailTag.value = false;
          }
        }
        async function confirmTagChanges() {
          if (!tagPreview.value || tagPreview.value.errors.length > 0) return;
          applyingTags.value = true;
          tagStatus.value = "";
          try {
            const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.applyTagMutation)(buildTagDraft());
            tagStatus.value = result.message;
            tagPreview.value = result.preview;
            if (result.success) {
              tagPreview.value = null;
              await refreshList();
            }
          } finally {
            applyingTags.value = false;
          }
        }
        function setFavoriteBusy(fileName, busy) {
          const next = new Set(applyingFavoriteFiles.value);
          if (busy) {
            next.add(fileName);
          } else {
            next.delete(fileName);
          }
          applyingFavoriteFiles.value = next;
        }
        function setCharacterFavorite(fileName, fav) {
          characters.value = characters.value.map(character => character.fileName === fileName ? {
            ...character,
            fav
          } : character);
          if (selectedDetail.value?.fileName === fileName) {
            selectedDetail.value = {
              ...selectedDetail.value,
              fav
            };
          }
        }
        function setCharacterSourceUrl(fileName, sourceUrl) {
          characters.value = characters.value.map(character => character.fileName === fileName ? {
            ...character,
            sourceUrl
          } : character);
          if (selectedDetail.value?.fileName === fileName) {
            selectedDetail.value = {
              ...selectedDetail.value,
              sourceUrl
            };
          }
        }
        async function saveSourceUrl() {
          if (!activePreview.value || savingSourceUrl.value) return;
          const fileName = activePreview.value.fileName;
          const nextUrl = sourceUrlDraft.value.trim();
          if (nextUrl === (activePreview.value.sourceUrl || "")) return;
          savingSourceUrl.value = true;
          sourceUrlError.value = "";
          try {
            const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.applySourceUrlMutation)(fileName, nextUrl);
            if (result.success) {
              setCharacterSourceUrl(fileName, result.sourceUrl);
            } else {
              sourceUrlDraft.value = activePreview.value?.sourceUrl || result.sourceUrl;
              sourceUrlError.value = result.message;
            }
          } finally {
            savingSourceUrl.value = false;
          }
        }
        async function clearSourceUrl() {
          if (savingSourceUrl.value || !sourceUrlDraft.value.trim()) return;
          sourceUrlDraft.value = "";
          await saveSourceUrl();
        }
        function openSourceUrl() {
          if (!canOpenSourceUrl.value) return;
          window.open(sourceUrlDraft.value.trim(), "_blank", "noopener,noreferrer");
        }
        async function applyFavoriteChange(character, nextFav, refreshAfterSuccess = true) {
          if (applyingFavoriteFiles.value.has(character.fileName)) return;
          managementStatus.value = "";
          setFavoriteBusy(character.fileName, true);
          setCharacterFavorite(character.fileName, nextFav);
          try {
            const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.applyFavoriteMutation)(character.fileName, nextFav);
            managementStatus.value = result.message;
            if (result.success) {
              if (refreshAfterSuccess) await refreshList();
            } else {
              setCharacterFavorite(character.fileName, result.fav);
            }
            return result.success;
          } finally {
            setFavoriteBusy(character.fileName, false);
          }
        }
        async function toggleFavorite(character) {
          await applyFavoriteChange(character, !character.fav);
        }
        async function applyFavoriteToSelection(nextFav) {
          const targets = selectedCharacters.value.filter(character => character.fav !== nextFav);
          if (targets.length === 0 || applyingBatchFavorite.value) {
            managementStatus.value = nextFav ? "选中角色已经全部收藏。" : "选中角色已经全部取消收藏。";
            return;
          }
          applyingBatchFavorite.value = true;
          let successCount = 0;
          const failedNames = [];
          try {
            for (const character of targets) {
              const success = await applyFavoriteChange(character, nextFav, false);
              if (success) {
                successCount += 1;
              } else {
                failedNames.push(character.name);
              }
            }
            await refreshList();
            managementStatus.value = failedNames.length ? `收藏写入完成：成功 ${successCount} 项，失败 ${failedNames.length} 项：${failedNames.slice(0, 3).join("、")}` : `收藏写入完成：成功 ${successCount} 项。`;
          } finally {
            applyingBatchFavorite.value = false;
          }
        }
        async function downloadCharacter(character) {
          managementStatus.value = "";
          const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.downloadCharacterFile)(character.fileName);
          managementStatus.value = result.message;
        }
        async function exportSelectedZip() {
          if (selectedFileList.value.length === 0 || exportingFiles.value) return;
          exportingFiles.value = true;
          managementStatus.value = "";
          try {
            const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.exportCharactersZip)(selectedFileList.value);
            managementStatus.value = result.message;
          } finally {
            exportingFiles.value = false;
          }
        }
        async function previewSelectedDeletion() {
          if (selectedFileList.value.length === 0 || applyingDeletion.value) return;
          managementStatus.value = "";
          deleteConfirmText.value = "";
          deletePreview.value = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.previewCharacterDeletion)(selectedFileList.value, {
            backupCharacters: deleteBackupCharacters.value,
            deleteChats: deleteChats.value,
            deleteWorldBooks: deleteWorldBooks.value
          }, characters.value);
        }
        async function previewActiveDeletion() {
          if (!activePreview.value || applyingDeletion.value) return;
          selectionMode.value = true;
          selectedFiles.value = new Set([ activePreview.value.fileName ]);
          clearTagPreview();
          await previewSelectedDeletion();
        }
        async function confirmDeletion() {
          if (!deletePreview.value || !canConfirmDeletion.value) return;
          applyingDeletion.value = true;
          managementStatus.value = "";
          try {
            const results = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.applyCharacterDeletion)(deletePreview.value);
            const successCount = results.filter(result => result.success).length;
            const failedCount = results.length - successCount;
            managementStatus.value = failedCount ? `删除完成：成功 ${successCount} 项，失败 ${failedCount} 项。` : `删除完成：成功 ${successCount} 项。`;
            selectedFiles.value = new Set([ ...selectedFiles.value ].filter(fileName => !results.some(result => result.fileName === fileName && result.success)));
            deletePreview.value = null;
            deleteConfirmText.value = "";
            await refreshList();
          } finally {
            applyingDeletion.value = false;
          }
        }
        async function toggleChats() {
          if (!activePreview.value) return;
          chatsExpanded.value = !chatsExpanded.value;
          if (chatsExpanded.value) {
            await loadChats(activePreview.value.fileName);
          }
        }
        async function loadChats(fileName) {
          const current = chatStates.value[fileName];
          if (current?.loading || current?.chats.length) return;
          chatStates.value = {
            ...chatStates.value,
            [fileName]: {
              loading: true,
              error: "",
              chats: current?.chats || []
            }
          };
          try {
            const chats = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.readCharacterChats)(fileName);
            chatStates.value = {
              ...chatStates.value,
              [fileName]: {
                loading: false,
                error: "",
                chats
              }
            };
          } catch (error) {
            chatStates.value = {
              ...chatStates.value,
              [fileName]: {
                loading: false,
                error: formatError(error),
                chats: []
              }
            };
          }
        }
        async function downloadActiveChats() {
          if (!activePreview.value) return;
          const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.downloadCharacterChats)(activePreview.value.fileName);
          if (!result.success) managementStatus.value = result.message;
        }
        function getChatAliasKey(chat) {
          return `${activePreview.value?.fileName || ""}__${chat.fileName}`;
        }
        function getChatDisplayTitle(chat) {
          return chatAliases.value[getChatAliasKey(chat)] || chat.title;
        }
        function saveChatAlias(chat, value) {
          const key = getChatAliasKey(chat);
          const nextTitle = value.trim();
          if (nextTitle && nextTitle !== chat.title) {
            chatAliases.value = {
              ...chatAliases.value,
              [key]: nextTitle
            };
          } else {
            const {[key]: _removed, ...rest} = chatAliases.value;
            chatAliases.value = rest;
          }
          saveChatAliases();
        }
        function commitChatAlias(chat, event) {
          saveChatAlias(chat, event.target.value);
        }
        async function downloadChat(chat) {
          if (!activePreview.value) return;
          const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.downloadCharacterChats)(activePreview.value.fileName, [ chat.id ]);
          if (!result.success) managementStatus.value = result.message;
        }
        async function deleteChat(chat) {
          if (!activePreview.value) return;
          const title = getChatDisplayTitle(chat);
          if (!window.confirm(`确认删除聊天记录“${title}”？此操作不会删除角色卡。`)) return;
          const fileName = activePreview.value.fileName;
          const key = getChatAliasKey(chat);
          deletingChatKeys.value = new Set([ ...deletingChatKeys.value, key ]);
          managementStatus.value = "";
          try {
            const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.deleteCharacterChat)(fileName, chat);
            if (!result.success) {
              managementStatus.value = result.message;
              return;
            }
            const current = chatStates.value[fileName];
            if (current) {
              chatStates.value = {
                ...chatStates.value,
                [fileName]: {
                  ...current,
                  chats: current.chats.filter(item => item.id !== chat.id)
                }
              };
            }
            if (expandedChatKey.value === key) expandedChatKey.value = "";
            const {[key]: _content, ...restContentStates} = chatContentStates.value;
            chatContentStates.value = restContentStates;
            const {[key]: _alias, ...restAliases} = chatAliases.value;
            chatAliases.value = restAliases;
            saveChatAliases();
          } finally {
            const next = new Set(deletingChatKeys.value);
            next.delete(key);
            deletingChatKeys.value = next;
          }
        }
        async function toggleChatContent(chat) {
          if (!activePreview.value) return;
          const key = getChatAliasKey(chat);
          if (expandedChatKey.value === key) {
            expandedChatKey.value = "";
            return;
          }
          expandedChatKey.value = key;
          const current = chatContentStates.value[key];
          if (current?.loading || current?.content) return;
          chatContentStates.value = {
            ...chatContentStates.value,
            [key]: {
              loading: true,
              error: "",
              content: null
            }
          };
          try {
            const content = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.readCharacterChatContent)(activePreview.value.fileName, chat);
            chatContentStates.value = {
              ...chatContentStates.value,
              [key]: {
                loading: false,
                error: "",
                content
              }
            };
          } catch (error) {
            chatContentStates.value = {
              ...chatContentStates.value,
              [key]: {
                loading: false,
                error: formatError(error),
                content: null
              }
            };
          }
        }
        async function openChat(chat) {
          if (!activePreview.value) return;
          const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.openCharacterChat)(activePreview.value.fileName, chat.fileName);
          if (result.success) {
            requestClose();
            return;
          }
          managementStatus.value = result.message;
        }
        async function launchCharacter(character = activePreview.value) {
          if (!character || selectionMode.value || launchingFileName.value) return;
          launchingFileName.value = character.fileName;
          managementStatus.value = "";
          try {
            const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.openCharacterChat)(character.fileName);
            if (result.success) {
              requestClose();
              return;
            }
            managementStatus.value = result.message;
          } finally {
            launchingFileName.value = "";
          }
        }
        function getChatContentPreview(chat) {
          const state = chatContentStates.value[getChatAliasKey(chat)];
          if (state?.loading) return "正在读取聊天内容...";
          if (state?.error) return state.error;
          if (!state?.content) return "";
          return formatReadableChatContent(state.content.content);
        }
        function formatReadableChatContent(content) {
          const parsed = parseMaybeJson(content);
          const messages = extractChatMessages(parsed);
          if (messages.length === 0) return "没有可显示的聊天正文。";
          return truncate(messages.join("\n\n"), "", 1400);
        }
        function parseMaybeJson(content) {
          if (typeof content !== "string") return content;
          try {
            return JSON.parse(content);
          } catch {
            return content;
          }
        }
        function extractChatMessages(content) {
          if (Array.isArray(content)) {
            return content.flatMap(extractChatMessages);
          }
          if (!content || typeof content !== "object") {
            return typeof content === "string" ? [ stripChatMarkup(content) ] : [];
          }
          const record = content;
          if (Array.isArray(record.messages)) return extractChatMessages(record.messages);
          if (Array.isArray(record.chat)) return extractChatMessages(record.chat);
          if (Array.isArray(record.data)) return extractChatMessages(record.data);
          const message = typeof record.mes === "string" ? record.mes : typeof record.message === "string" ? record.message : "";
          if (!message.trim()) return [];
          const speaker = typeof record.name === "string" && record.name.trim() ? record.name.trim() : record.is_user === true ? "用户" : record.is_user === false ? "角色" : "";
          const text = stripChatMarkup(message);
          return [ speaker ? `${speaker}：${text}` : text ];
        }
        function stripChatMarkup(text) {
          return text.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
        }
        function resetRenameEditor() {
          renameInput.value = activePreview.value?.name || "";
          applyingRename.value = false;
        }
        async function saveInlineRename() {
          if (!renamePreview.value || !canSaveRename.value) return;
          if (renamePreview.value.errors.length > 0) {
            managementStatus.value = renamePreview.value.errors.join(" ");
            return;
          }
          applyingRename.value = true;
          managementStatus.value = "";
          try {
            const result = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.applyCharacterRename)(renamePreview.value);
            if (result.success && result.newFileName) {
              selectedFile.value = result.newFileName;
              selectedFiles.value = new Set([ ...selectedFiles.value ].map(fileName => fileName === result.oldFileName ? result.newFileName : fileName));
              await refreshList();
            } else {
              managementStatus.value = result.message;
              resetRenameEditor();
            }
          } finally {
            applyingRename.value = false;
          }
        }
        async function handleImportFiles(event) {
          const input = event.target;
          if (!input.files?.length) return;
          await addImportFiles(Array.from(input.files));
          input.value = "";
        }
        async function handleImportDrop(event) {
          const files = Array.from(event.dataTransfer?.files || []);
          if (files.length > 0) {
            await addImportFiles(files);
          }
        }
        async function addImportFiles(files) {
          parsingImports.value = true;
          importStatus.value = "";
          try {
            for (const file of files) {
              await addImportSource({
                sourceKind: "file",
                sourceName: file.name,
                blob: file,
                contentType: file.type
              });
            }
          } finally {
            parsingImports.value = false;
          }
        }
        async function addImportUrl() {
          const url = importUrl.value.trim();
          if (!url) return;
          parsingImports.value = true;
          importStatus.value = "";
          try {
            const source = await (0, _imports__WEBPACK_IMPORTED_MODULE_3__.fetchImportSource)(url);
            await addImportSource(source);
            importUrl.value = "";
          } catch (error) {
            await addFailedImportCandidate(createEmptyImportSource("url", url), error);
          } finally {
            parsingImports.value = false;
          }
        }
        async function addImportSource(source) {
          try {
            const sources = await (0, _imports__WEBPACK_IMPORTED_MODULE_3__.expandImportSources)(source);
            for (const item of sources) {
              const candidate = await (0, _imports__WEBPACK_IMPORTED_MODULE_3__.buildImportCandidate)(item, characters.value, tavernTags.value, tagMap.value, _host__WEBPACK_IMPORTED_MODULE_2__.readCharacterDetail);
              pushImportCandidate(candidate);
            }
          } catch (error) {
            await addFailedImportCandidate(createEmptyImportSource(source.sourceKind, source.sourceName), error);
          }
        }
        function createEmptyImportSource(sourceKind, sourceName) {
          return {
            sourceKind,
            sourceName,
            blob: new Blob([], {
              type: "application/json"
            }),
            contentType: "application/json"
          };
        }
        async function addFailedImportCandidate(source, error) {
          const message = formatError(error);
          const candidate = await (0, _imports__WEBPACK_IMPORTED_MODULE_3__.buildImportCandidate)(source, characters.value, tavernTags.value, tagMap.value, _host__WEBPACK_IMPORTED_MODULE_2__.readCharacterDetail);
          candidate.status = "error";
          candidate.issues = [ {
            level: "error",
            message
          } ];
          candidate.resultMessage = message;
          pushImportCandidate(candidate);
        }
        function pushImportCandidate(candidate) {
          if (candidate.format === "png" && candidate.blob.size > 0 && typeof URL.createObjectURL === "function") {
            importAvatarUrls.value = {
              ...importAvatarUrls.value,
              [candidate.id]: URL.createObjectURL(candidate.blob)
            };
          }
          importCandidates.value = [ ...importCandidates.value, candidate ];
          selectedImportId.value = candidate.id;
        }
        function removeImportCandidate(id) {
          revokeImportAvatarUrl(id);
          importCandidates.value = importCandidates.value.filter(candidate => candidate.id !== id);
          if (selectedImportId.value === id) {
            selectedImportId.value = importCandidates.value[0]?.id || "";
          }
        }
        function clearImportCandidates() {
          revokeImportAvatarUrls();
          importCandidates.value = [];
          selectedImportId.value = "";
          importStatus.value = "";
        }
        function revokeImportAvatarUrl(id) {
          const url = importAvatarUrls.value[id];
          if (!url) return;
          URL.revokeObjectURL(url);
          const {[id]: _removed, ...rest} = importAvatarUrls.value;
          importAvatarUrls.value = rest;
        }
        function revokeImportAvatarUrls() {
          Object.keys(importAvatarUrls.value).forEach(revokeImportAvatarUrl);
        }
        async function confirmImports() {
          if (!canConfirmImports.value) return;
          applyingImports.value = true;
          importStatus.value = "";
          try {
            const results = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.applyCharacterImport)(importCandidates.value);
            importCandidates.value = importCandidates.value.map(candidate => {
              const result = results.find(item => item.id === candidate.id);
              if (!result) return candidate;
              return {
                ...candidate,
                status: result.success ? "success" : "failed",
                resultMessage: result.message
              };
            });
            const successCount = results.filter(result => result.success).length;
            const failedCount = results.length - successCount;
            importStatus.value = `导入完成：成功 ${successCount} 项，失败 ${failedCount} 项。`;
            if (successCount > 0) {
              await refreshList();
            }
          } finally {
            applyingImports.value = false;
          }
        }
        function formatSelectedTags() {
          const items = Object.values(selectedTagDistribution.value).sort((lhs, rhs) => rhs.count === lhs.count ? lhs.tag.name.localeCompare(rhs.tag.name, "zh-CN") : rhs.count - lhs.count);
          if (items.length === 0) return "无标签";
          return items.slice(0, 6).map(item => `${item.tag.name} ${item.count}`).join("、");
        }
        async function loadOriginalAvatar(character) {
          if (!character.fileName || originalAvatarUrls.value[character.fileName] || loadingOriginalAvatars.has(character.fileName)) {
            return;
          }
          loadingOriginalAvatars.add(character.fileName);
          try {
            const url = await (0, _host__WEBPACK_IMPORTED_MODULE_2__.loadCharacterOriginalImage)(character.fileName);
            originalAvatarUrls.value = {
              ...originalAvatarUrls.value,
              [character.fileName]: url
            };
          } catch {} finally {
            loadingOriginalAvatars.delete(character.fileName);
          }
        }
        function requestClose() {
          const closeManager = window.parent?.closeCharacterCardManager;
          if (typeof closeManager === "function") {
            closeManager();
            return;
          }
          window.parent?.postMessage({
            source: "character-card-manager",
            type: "close"
          }, "*");
        }
        function formatImportAction(candidate) {
          if (candidate.status === "error") return "解析失败";
          if (candidate.status === "success") return "已完成";
          if (candidate.status === "failed") return "写入失败";
          return candidate.action === "update" ? "更新" : "新增";
        }
        function formatImportIssue(candidate) {
          return candidate.resultMessage || candidate.issues.map(issue => issue.message).join(" ");
        }
        function filterImportDiff(groups) {
          return groups.map(group => ({
            ...group,
            rows: group.rows.filter(shouldShowImportDiffRow)
          })).filter(group => group.rows.length > 0);
        }
        function shouldShowImportDiffRow(row) {
          return row.changed || row.preserved || hasImportDiffValue(row.oldValue) || hasImportDiffValue(row.newValue) || hasImportDiffValue(row.finalValue);
        }
        function getImportDiffLines(row) {
          const oldValue = hasImportDiffValue(row.oldValue) ? row.oldValue : "";
          const newValue = hasImportDiffValue(row.newValue) ? row.newValue : "";
          const finalValue = hasImportDiffValue(row.finalValue) ? row.finalValue : "";
          if (!oldValue && newValue && (!finalValue || finalValue === newValue)) {
            return [ {
              label: "新增",
              value: newValue,
              primary: true
            } ];
          }
          if (!oldValue && !newValue && finalValue) {
            return [ {
              label: "说明",
              value: finalValue,
              primary: true
            } ];
          }
          if (row.preserved && finalValue) {
            return [ {
              label: "保留",
              value: finalValue,
              primary: true
            } ];
          }
          if (oldValue && !newValue && !finalValue) {
            return [ {
              label: "移除",
              value: oldValue,
              primary: true
            } ];
          }
          if (oldValue && (!newValue || newValue === oldValue) && (!finalValue || finalValue === oldValue)) {
            return [ {
              label: "不变",
              value: oldValue,
              primary: false
            } ];
          }
          const lines = [];
          if (oldValue) lines.push({
            label: "旧",
            value: oldValue,
            primary: false
          });
          if (newValue && newValue !== oldValue) lines.push({
            label: oldValue ? "新" : "新增",
            value: newValue,
            primary: !oldValue
          });
          if (finalValue && finalValue !== newValue && finalValue !== oldValue) lines.push({
            label: "结果",
            value: finalValue,
            primary: true
          });
          return lines;
        }
        function hasImportDiffValue(value) {
          const normalized = value.trim();
          return normalized !== "" && normalized !== "无";
        }
        function formatError(error) {
          return error instanceof Error ? error.message : String(error || "未知错误");
        }
        const __returned__ = {
          DETAIL_LOADING_DELAY_MS,
          TAG_FILTER_MODE_KEY,
          CHAT_ALIAS_KEY,
          CARD_GRID_GAP_PX,
          CARD_GRID_HORIZONTAL_PADDING_PX,
          CARD_HEIGHT_RATIO,
          sideFilters,
          characters,
          tavernTags,
          tagMap,
          selectedFile,
          selectedDetail,
          loadingList,
          loadingDetail,
          query,
          activeFilter,
          activeTagIds,
          tagFilterMode,
          settingsOpen,
          sortBy,
          globalIssues,
          leftCollapsed,
          rightCollapsed,
          leftCollapsedBeforeImport,
          cardSizeIndex,
          selectedGreetingIndex,
          selectionMode,
          selectedFiles,
          tagAction,
          selectedTagId,
          newTagName,
          tagPreview,
          tagStatus,
          applyingTags,
          applyingFavoriteFiles,
          applyingBatchFavorite,
          exportingFiles,
          managementStatus,
          launchingFileName,
          deletePreview,
          deleteBackupCharacters,
          deleteChats,
          deleteWorldBooks,
          deleteConfirmText,
          applyingDeletion,
          tagDialogOpen,
          detailTagName,
          applyingDetailTag,
          chatStates,
          chatsExpanded,
          chatAliases,
          expandedChatKey,
          chatContentStates,
          deletingChatKeys,
          sourceUrlDraft,
          sourceUrlError,
          savingSourceUrl,
          renameInput,
          applyingRename,
          avatarUrlIndex,
          originalAvatarUrls,
          importAvatarUrls,
          importMode,
          importUrl,
          importCandidates,
          selectedImportId,
          parsingImports,
          applyingImports,
          importStatus,
          galleryElement,
          galleryContentWidth,
          galleryColumnGap,
          galleryRenderedColumns,
          loadingOriginalAvatars,
          cardSizes,
          get detailRequestId() {
            return detailRequestId;
          },
          set detailRequestId(v) {
            detailRequestId = v;
          },
          get detailLoadingTimer() {
            return detailLoadingTimer;
          },
          set detailLoadingTimer(v) {
            detailLoadingTimer = v;
          },
          get galleryResizeObserver() {
            return galleryResizeObserver;
          },
          set galleryResizeObserver(v) {
            galleryResizeObserver = v;
          },
          get galleryResizeFallback() {
            return galleryResizeFallback;
          },
          set galleryResizeFallback(v) {
            galleryResizeFallback = v;
          },
          visibleCharacters,
          selectedSummary,
          selectedCharacters,
          selectedFileList,
          filterCounts,
          tagCounts,
          selectedTagDistribution,
          selectedFavoriteCount,
          selectedMissingGreetingCount,
          selectedErrorCount,
          showSelectionSummary,
          detailActiveTagIds,
          activePreview,
          detailPreview,
          previewRiskIssues,
          previewDescription,
          previewFirstMessage,
          previewAltGreetings,
          greetingOptions,
          selectedGreeting,
          greetingPageLabel,
          cardSize,
          cardGridStyle,
          selectedImportCandidate,
          selectedImportDiff,
          importReadyCount,
          importErrorCount,
          canConfirmImports,
          renamePreview,
          canSaveRename,
          canOpenSourceUrl,
          activeChatState,
          canConfirmDeletion,
          getMeasuredCardHeight,
          estimateGalleryWidth,
          observeGalleryElement,
          refreshGalleryMetrics,
          disconnectGalleryObserver,
          parsePx,
          getRenderedColumnCount,
          refreshList,
          activateFilter,
          activateTagFilter,
          clearTagFilters,
          toggleImportMode,
          selectCharacter,
          setTagFilterMode,
          clearDetailLoadingTimer,
          readStoredTagFilterMode,
          readStoredChatAliases,
          saveChatAliases,
          formatDate,
          truncate,
          getAvatarSrc,
          getImportAvatarSrc,
          handleAvatarError,
          changeCardSize,
          handleGalleryWheel,
          changeGreeting,
          toggleSelectionMode,
          toggleCharacterSelection,
          selectVisibleCharacters,
          clearSelection,
          buildTagDraft,
          previewTagChanges,
          clearTagPreview,
          clearDeletePreview,
          openTagDialog,
          closeTagDialog,
          removeDetailTag,
          toggleDetailTag,
          confirmCustomDetailTag,
          confirmTagChanges,
          setFavoriteBusy,
          setCharacterFavorite,
          setCharacterSourceUrl,
          saveSourceUrl,
          clearSourceUrl,
          openSourceUrl,
          applyFavoriteChange,
          toggleFavorite,
          applyFavoriteToSelection,
          downloadCharacter,
          exportSelectedZip,
          previewSelectedDeletion,
          previewActiveDeletion,
          confirmDeletion,
          toggleChats,
          loadChats,
          downloadActiveChats,
          getChatAliasKey,
          getChatDisplayTitle,
          saveChatAlias,
          commitChatAlias,
          downloadChat,
          deleteChat,
          toggleChatContent,
          openChat,
          launchCharacter,
          getChatContentPreview,
          formatReadableChatContent,
          parseMaybeJson,
          extractChatMessages,
          stripChatMarkup,
          resetRenameEditor,
          saveInlineRename,
          handleImportFiles,
          handleImportDrop,
          addImportFiles,
          addImportUrl,
          addImportSource,
          createEmptyImportSource,
          addFailedImportCandidate,
          pushImportCandidate,
          removeImportCandidate,
          clearImportCandidates,
          revokeImportAvatarUrl,
          revokeImportAvatarUrls,
          confirmImports,
          formatSelectedTags,
          loadOriginalAvatar,
          requestClose,
          formatImportAction,
          formatImportIssue,
          filterImportDiff,
          shouldShowImportDiffRow,
          getImportDiffLines,
          hasImportDiffValue,
          formatError
        };
        Object.defineProperty(__returned__, "__isScriptSetup", {
          enumerable: false,
          value: true
        });
        return __returned__;
      }
    });
  },
  "./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-vue-components!./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-auto-import!./node_modules/.pnpm/ts-loader@9.6.0_loader-util_0ef68b16dcc23cdc6804530e4000b72d/node_modules/ts-loader/index.js??clonedRuleSet-42!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/templateLoader.js??ruleSet[1].rules[4]!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./src/角色卡管理器/App.vue?vue&type=template&id=8f9db926&scoped=true&ts=true"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      render: () => render
    });
    var vue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! vue */ "./node_modules/.pnpm/vue@3.5.35_typescript@6.0.0-dev.20250807/node_modules/vue/dist/vue.runtime.esm-bundler.js");
    const _hoisted_1 = {
      class: "cm-shell",
      "aria-label": "角色卡管理器"
    };
    const _hoisted_2 = {
      class: "cm-header"
    };
    const _hoisted_3 = {
      class: "cm-header-actions",
      "aria-label": "面板操作"
    };
    const _hoisted_4 = [ "aria-pressed" ];
    const _hoisted_5 = [ "aria-pressed" ];
    const _hoisted_6 = [ "disabled" ];
    const _hoisted_7 = [ "aria-hidden" ];
    const _hoisted_8 = {
      class: "cm-tag-filter",
      "aria-label": "标签筛选"
    };
    const _hoisted_9 = {
      class: "cm-side-heading"
    };
    const _hoisted_10 = [ "disabled" ];
    const _hoisted_11 = [ "aria-pressed", "onClick" ];
    const _hoisted_12 = {
      key: 0,
      class: "cm-side-empty"
    };
    const _hoisted_13 = [ "aria-pressed", "onClick" ];
    const _hoisted_14 = {
      key: 0,
      class: "cm-issue-box",
      role: "status"
    };
    const _hoisted_15 = [ "title", "aria-label", "aria-pressed" ];
    const _hoisted_16 = {
      key: 0,
      class: "cm-list-head"
    };
    const _hoisted_17 = {
      class: "cm-list-status"
    };
    const _hoisted_18 = {
      class: "cm-field cm-search-field"
    };
    const _hoisted_19 = {
      class: "cm-field cm-sort-field"
    };
    const _hoisted_20 = {
      class: "cm-list-tools"
    };
    const _hoisted_21 = [ "aria-pressed" ];
    const _hoisted_22 = {
      class: "cm-gallery-tools",
      "aria-label": "卡片大小"
    };
    const _hoisted_23 = [ "disabled" ];
    const _hoisted_24 = [ "disabled" ];
    const _hoisted_25 = {
      key: 1,
      class: "cm-import-workspace",
      "aria-label": "导入和更新预览"
    };
    const _hoisted_26 = {
      class: "cm-import-sourcebar"
    };
    const _hoisted_27 = {
      class: "cm-file-button"
    };
    const _hoisted_28 = {
      class: "cm-field"
    };
    const _hoisted_29 = [ "disabled" ];
    const _hoisted_30 = {
      class: "cm-import-summary"
    };
    const _hoisted_31 = {
      key: 0
    };
    const _hoisted_32 = {
      key: 1
    };
    const _hoisted_33 = {
      key: 2
    };
    const _hoisted_34 = [ "disabled" ];
    const _hoisted_35 = [ "disabled" ];
    const _hoisted_36 = {
      key: 0,
      class: "cm-empty"
    };
    const _hoisted_37 = {
      key: 1,
      class: "cm-import-list"
    };
    const _hoisted_38 = [ "onClick", "onKeydown" ];
    const _hoisted_39 = {
      class: "cm-import-thumb"
    };
    const _hoisted_40 = [ "src", "alt" ];
    const _hoisted_41 = {
      key: 1
    };
    const _hoisted_42 = {
      class: "cm-import-card-tags"
    };
    const _hoisted_43 = [ "onClick" ];
    const _hoisted_44 = {
      class: "cm-import-card-text"
    };
    const _hoisted_45 = {
      key: 0
    };
    const _hoisted_46 = {
      key: 2,
      class: "cm-empty"
    };
    const _hoisted_47 = [ "aria-label", "onClick", "onDblclick", "onKeydown" ];
    const _hoisted_48 = [ "checked", "aria-label", "onChange" ];
    const _hoisted_49 = {
      class: "cm-thumb"
    };
    const _hoisted_50 = [ "src", "alt", "onError" ];
    const _hoisted_51 = {
      key: 0,
      class: "cm-card-tags",
      "aria-hidden": "true"
    };
    const _hoisted_52 = {
      key: 0
    };
    const _hoisted_53 = {
      class: "cm-card-text"
    };
    const _hoisted_54 = {
      class: "cm-card-actions",
      "aria-label": "角色快捷操作"
    };
    const _hoisted_55 = [ "title", "aria-label", "aria-pressed", "disabled", "onClick" ];
    const _hoisted_56 = [ "aria-label", "onClick" ];
    const _hoisted_57 = [ "title", "aria-label", "aria-pressed" ];
    const _hoisted_58 = [ "aria-hidden" ];
    const _hoisted_59 = {
      key: 0,
      class: "cm-empty"
    };
    const _hoisted_60 = {
      class: "cm-preview-head"
    };
    const _hoisted_61 = {
      class: "cm-import-avatar",
      "aria-hidden": "true"
    };
    const _hoisted_62 = {
      key: 0,
      class: "cm-risk-list"
    };
    const _hoisted_63 = {
      key: 0,
      class: "cm-inline-status global"
    };
    const _hoisted_64 = {
      class: "cm-selection-summary"
    };
    const _hoisted_65 = {
      class: "cm-meta-list compact"
    };
    const _hoisted_66 = {
      class: "cm-management-actions"
    };
    const _hoisted_67 = [ "disabled" ];
    const _hoisted_68 = [ "disabled" ];
    const _hoisted_69 = [ "disabled" ];
    const _hoisted_70 = {
      class: "cm-danger-zone",
      "aria-label": "批量删除"
    };
    const _hoisted_71 = [ "disabled" ];
    const _hoisted_72 = {
      key: 0,
      class: "cm-delete-preview"
    };
    const _hoisted_73 = {
      key: 0,
      class: "cm-field"
    };
    const _hoisted_74 = [ "disabled" ];
    const _hoisted_75 = {
      class: "cm-tag-editor",
      "aria-label": "批量标签操作"
    };
    const _hoisted_76 = {
      class: "cm-field"
    };
    const _hoisted_77 = {
      key: 0,
      class: "cm-field"
    };
    const _hoisted_78 = [ "value" ];
    const _hoisted_79 = {
      key: 1,
      class: "cm-field"
    };
    const _hoisted_80 = [ "disabled" ];
    const _hoisted_81 = {
      key: 2,
      class: "cm-mutation-preview"
    };
    const _hoisted_82 = {
      key: 0,
      class: "error"
    };
    const _hoisted_83 = {
      key: 0
    };
    const _hoisted_84 = [ "disabled" ];
    const _hoisted_85 = {
      key: 3,
      class: "cm-inline-status"
    };
    const _hoisted_86 = {
      key: 3,
      class: "cm-empty"
    };
    const _hoisted_87 = {
      class: "cm-preview-head"
    };
    const _hoisted_88 = [ "src", "alt" ];
    const _hoisted_89 = [ "disabled", "onKeydown" ];
    const _hoisted_90 = {
      class: "cm-preview-actions"
    };
    const _hoisted_91 = [ "disabled" ];
    const _hoisted_92 = [ "disabled" ];
    const _hoisted_93 = {
      class: "cm-meta-list"
    };
    const _hoisted_94 = {
      class: "cm-detail-tags"
    };
    const _hoisted_95 = {
      key: 0
    };
    const _hoisted_96 = [ "aria-pressed", "title", "onClick" ];
    const _hoisted_97 = [ "aria-label", "onClick" ];
    const _hoisted_98 = {
      class: "cm-source-url"
    };
    const _hoisted_99 = {
      class: "cm-source-field"
    };
    const _hoisted_100 = [ "disabled", "onKeydown" ];
    const _hoisted_101 = {
      class: "cm-source-actions"
    };
    const _hoisted_102 = [ "disabled" ];
    const _hoisted_103 = [ "disabled" ];
    const _hoisted_104 = {
      key: 0
    };
    const _hoisted_105 = {
      class: "cm-chat-panel",
      "aria-label": "聊天记录"
    };
    const _hoisted_106 = {
      class: "cm-section-head"
    };
    const _hoisted_107 = {
      class: "cm-management-actions"
    };
    const _hoisted_108 = [ "disabled" ];
    const _hoisted_109 = {
      key: 0,
      class: "cm-inline-status"
    };
    const _hoisted_110 = {
      key: 1,
      class: "cm-inline-status error"
    };
    const _hoisted_111 = {
      key: 0,
      class: "cm-inline-status"
    };
    const _hoisted_112 = {
      key: 1,
      class: "cm-chat-list"
    };
    const _hoisted_113 = {
      class: "cm-chat-row"
    };
    const _hoisted_114 = {
      class: "cm-chat-main"
    };
    const _hoisted_115 = [ "value", "aria-label", "onChange", "onKeydown" ];
    const _hoisted_116 = {
      class: "cm-chat-actions"
    };
    const _hoisted_117 = [ "aria-label", "onClick" ];
    const _hoisted_118 = [ "aria-label", "onClick" ];
    const _hoisted_119 = [ "aria-label", "onClick" ];
    const _hoisted_120 = [ "aria-label", "disabled", "onClick" ];
    const _hoisted_121 = {
      key: 0,
      class: "cm-chat-content"
    };
    const _hoisted_122 = {
      class: "cm-tag-dialog",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "添加标签"
    };
    const _hoisted_123 = {
      class: "cm-tag-choice-grid",
      "aria-label": "已有标签"
    };
    const _hoisted_124 = [ "aria-pressed", "disabled", "onClick" ];
    const _hoisted_125 = {
      key: 0,
      class: "cm-dialog-note"
    };
    const _hoisted_126 = {
      class: "cm-field"
    };
    const _hoisted_127 = [ "onKeydown" ];
    const _hoisted_128 = {
      class: "cm-management-actions"
    };
    const _hoisted_129 = [ "disabled" ];
    const _hoisted_130 = [ "disabled" ];
    const _hoisted_131 = {
      key: 1,
      class: "cm-inline-status"
    };
    const _hoisted_132 = {
      key: 2,
      class: "cm-risk-list"
    };
    const _hoisted_133 = {
      class: "cm-section"
    };
    const _hoisted_134 = {
      class: "cm-section cm-greeting-section"
    };
    const _hoisted_135 = {
      class: "cm-section-head"
    };
    const _hoisted_136 = {
      key: 0,
      class: "cm-greeting-pager",
      "aria-label": "切换开场白"
    };
    const _hoisted_137 = [ "disabled" ];
    const _hoisted_138 = {
      "aria-live": "polite"
    };
    const _hoisted_139 = [ "disabled" ];
    const _hoisted_140 = [ "value" ];
    const _hoisted_141 = {
      class: "cm-greeting-body",
      "aria-label": "开场白内容"
    };
    const _hoisted_142 = {
      class: "cm-settings-group"
    };
    const _hoisted_143 = {
      class: "cm-segmented",
      role: "radiogroup",
      "aria-label": "标签过滤逻辑"
    };
    const _hoisted_144 = [ "aria-checked" ];
    const _hoisted_145 = [ "aria-checked" ];
    const _hoisted_146 = [ "aria-checked" ];
    function render(_ctx, _cache, $props, $setup, $data, $options) {
      return (0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("main", _hoisted_1, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("header", _hoisted_2, [ _cache[33] || (_cache[33] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h1", null, "角色卡管理器") ], -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_3, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-header-primary",
        type: "button",
        "aria-pressed": $setup.importMode,
        onClick: $setup.toggleImportMode
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.importMode ? "返回角色库" : "导入/更新"), 9, _hoisted_4), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-icon-button",
        type: "button",
        title: "设置",
        "aria-pressed": $setup.settingsOpen,
        onClick: _cache[0] || (_cache[0] = $event => $setup.settingsOpen = true)
      }, " ⚙ ", 8, _hoisted_5), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-icon-button",
        type: "button",
        title: "刷新列表",
        disabled: $setup.loadingList,
        onClick: $setup.refreshList
      }, " ↻ ", 8, _hoisted_6), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-icon-button danger",
        type: "button",
        title: "关闭面板",
        onClick: $setup.requestClose
      }, " × ") ]) ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("section", {
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)([ "cm-workspace", {
          "left-collapsed": $setup.leftCollapsed,
          "right-collapsed": $setup.rightCollapsed
        } ])
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("aside", {
        class: "cm-controls",
        "aria-label": "标签筛选和读取提示",
        "aria-hidden": $setup.leftCollapsed
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("section", _hoisted_8, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_9, [ _cache[34] || (_cache[34] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("strong", null, "标签", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-clear-tags",
        type: "button",
        title: "清空已选标签",
        "aria-label": "清空已选标签",
        disabled: $setup.activeTagIds.length === 0 && $setup.activeFilter === "all",
        onClick: $setup.clearTagFilters
      }, " ⌫ ", 8, _hoisted_10) ]), ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.sideFilters, item => (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        key: item.id,
        type: "button",
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)({
          active: $setup.activeFilter === item.id && $setup.activeTagIds.length === 0
        }),
        "aria-pressed": $setup.activeFilter === item.id && $setup.activeTagIds.length === 0,
        onClick: $event => $setup.activateFilter(item.id)
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(item.label), 1), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("strong", null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.filterCounts[item.id]), 1) ], 10, _hoisted_11)), 64)), $setup.tavernTags.length === 0 ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_12, "暂无酒馆标签")) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.tavernTags, tag => ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("button", {
        key: tag.id,
        type: "button",
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)({
          active: $setup.activeTagIds.includes(tag.id)
        }),
        "aria-pressed": $setup.activeTagIds.includes(tag.id),
        onClick: $event => $setup.activateTagFilter(tag.id)
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(tag.name), 1), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("strong", null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.tagCounts[tag.id] || 0), 1) ], 10, _hoisted_13))), 128)) ]), $setup.globalIssues.length ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_14, [ _cache[35] || (_cache[35] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("strong", null, "读取提示", -1)), ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.globalIssues, issue => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", {
        key: issue
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(issue), 1))), 128)) ])) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ], 8, _hoisted_7), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-panel-toggle left",
        type: "button",
        title: $setup.leftCollapsed ? "展开左栏" : "收起左栏",
        "aria-label": $setup.leftCollapsed ? "展开左栏" : "收起左栏",
        "aria-pressed": $setup.leftCollapsed,
        onClick: _cache[1] || (_cache[1] = $event => $setup.leftCollapsed = !$setup.leftCollapsed)
      }, null, 8, _hoisted_15), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("section", {
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)([ "cm-list-panel", {
          "import-mode": $setup.importMode
        } ]),
        "aria-label": "角色缩略图列表"
      }, [ !$setup.importMode ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_16, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_17, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("strong", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.visibleCharacters.length) + " 个匹配项", 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("label", _hoisted_18, [ _cache[36] || (_cache[36] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "搜索", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => $setup.query = $event),
        type: "search",
        placeholder: "名称、作者、文件名、描述"
      }, null, 512), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelText, $setup.query ] ]) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("label", _hoisted_19, [ _cache[38] || (_cache[38] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "排序", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("select", {
        "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => $setup.sortBy = $event)
      }, [ ..._cache[37] || (_cache[37] = [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("option", {
        value: "date_added"
      }, "导入时间", -1), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("option", {
        value: "date_last_chat"
      }, "最后聊天", -1), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("option", {
        value: "name"
      }, "名称", -1) ]) ], 512), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelSelect, $setup.sortBy ] ]) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_20, [ !$setup.importMode ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("button", {
        key: 0,
        class: "cm-selection-toggle",
        type: "button",
        "aria-pressed": $setup.selectionMode,
        onClick: $setup.toggleSelectionMode
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectionMode ? "退出选择" : "选择"), 9, _hoisted_21)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), $setup.selectionMode ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        key: 1
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        onClick: $setup.selectVisibleCharacters
      }, "全选当前"), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        onClick: $setup.clearSelection
      }, "清空"), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("output", null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectedCharacters.length) + " 已选", 1) ], 64)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_22, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        title: "缩小卡片",
        disabled: $setup.cardSizeIndex === 0,
        onClick: _cache[4] || (_cache[4] = $event => $setup.changeCardSize(-1))
      }, " − ", 8, _hoisted_23), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("output", null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.cardSize.label), 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        title: "放大卡片",
        disabled: $setup.cardSizeIndex === $setup.cardSizes.length - 1,
        onClick: _cache[5] || (_cache[5] = $event => $setup.changeCardSize(1))
      }, " + ", 8, _hoisted_24) ]) ])) : (0, vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), $setup.importMode ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("section", _hoisted_25, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_26, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", {
        class: "cm-import-drop",
        onDragover: _cache[6] || (_cache[6] = (0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)(() => {}, [ "prevent" ])),
        onDrop: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($setup.handleImportDrop, [ "prevent" ])
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("label", _hoisted_27, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        type: "file",
        accept: ".json,.png,.zip,application/json,image/png,application/zip",
        multiple: "",
        onChange: $setup.handleImportFiles
      }, null, 32), _cache[39] || (_cache[39] = (0, vue__WEBPACK_IMPORTED_MODULE_0__.createTextVNode)(" 选择文件 ", -1)) ]), _cache[40] || (_cache[40] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "拖入文件到此处", -1)) ], 32), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("form", {
        class: "cm-import-url",
        onSubmit: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($setup.addImportUrl, [ "prevent" ])
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("label", _hoisted_28, [ _cache[41] || (_cache[41] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "URL", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => $setup.importUrl = $event),
        type: "url",
        placeholder: "https://example.com/characters.zip"
      }, null, 512), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelText, $setup.importUrl ] ]) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-primary-action",
        type: "submit",
        disabled: $setup.parsingImports || !$setup.importUrl.trim()
      }, "解析", 8, _hoisted_29) ], 32) ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_30, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("strong", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.importCandidates.length) + " 个候选项", 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.importReadyCount) + " 可写入 · " + (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.importErrorCount) + " 有错误", 1), $setup.parsingImports ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("span", _hoisted_31, "正在解析...")) : $setup.applyingImports ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("span", _hoisted_32, "正在写入...")) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), $setup.importStatus ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("span", _hoisted_33, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.importStatus), 1)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        disabled: $setup.importCandidates.length === 0 || $setup.applyingImports,
        onClick: $setup.clearImportCandidates
      }, " 清空 ", 8, _hoisted_34), $setup.importCandidates.length > 0 ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("button", {
        key: 3,
        class: "cm-primary-action cm-import-confirm",
        type: "button",
        disabled: !$setup.canConfirmImports,
        onClick: $setup.confirmImports
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.applyingImports ? "正在写入..." : `确认 ${$setup.importReadyCount} 项`), 9, _hoisted_35)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]), $setup.importCandidates.length === 0 ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_36, " 暂无候选项 ")) : ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_37, [ ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.importCandidates, candidate => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("article", {
        key: candidate.id,
        role: "button",
        tabindex: "0",
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)([ "cm-import-card", {
          active: $setup.selectedImportCandidate?.id === candidate.id,
          error: candidate.status === "error" || candidate.status === "failed"
        } ]),
        onClick: $event => $setup.selectedImportId = candidate.id,
        onKeydown: [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.withKeys)($event => $setup.selectedImportId = candidate.id, [ "enter" ]), (0, 
        vue__WEBPACK_IMPORTED_MODULE_0__.withKeys)((0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($event => $setup.selectedImportId = candidate.id, [ "prevent" ]), [ "space" ]) ]
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", _hoisted_39, [ $setup.getImportAvatarSrc(candidate) ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("img", {
        key: 0,
        src: $setup.getImportAvatarSrc(candidate),
        alt: candidate.summary.name
      }, null, 8, _hoisted_40)) : ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("b", _hoisted_41, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(candidate.format.toUpperCase()), 1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", _hoisted_42, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("b", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(candidate.format.toUpperCase()), 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("b", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.formatImportAction(candidate)), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        title: "移除此项",
        onClick: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($event => $setup.removeImportCandidate(candidate.id), [ "stop" ])
      }, "×", 8, _hoisted_43), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", _hoisted_44, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("strong", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(candidate.summary.name), 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("small", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(candidate.sourceName), 1), $setup.formatImportIssue(candidate) ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("em", _hoisted_45, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.formatImportIssue(candidate)), 1)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]) ]) ], 42, _hoisted_38))), 128)) ])) ])) : !$setup.loadingList && $setup.visibleCharacters.length === 0 ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_46, " 没有匹配的角色卡，调整搜索或刷新列表。 ")) : ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", {
        key: 3,
        ref: "galleryElement",
        class: "cm-card-grid",
        style: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeStyle)($setup.cardGridStyle),
        onWheel: $setup.handleGalleryWheel
      }, [ ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.visibleCharacters, character => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("article", {
        key: character.fileName,
        role: "button",
        "aria-label": character.name,
        tabindex: "0",
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)([ "cm-card", {
          active: $setup.selectedFile === character.fileName,
          selected: $setup.selectedFiles.has(character.fileName)
        } ]),
        onClick: $event => $setup.selectCharacter(character),
        onDblclick: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($event => $setup.launchCharacter(character), [ "stop" ]),
        onKeydown: [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.withKeys)($event => $setup.selectCharacter(character), [ "enter" ]), (0, 
        vue__WEBPACK_IMPORTED_MODULE_0__.withKeys)((0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($event => $setup.selectCharacter(character), [ "prevent" ]), [ "space" ]) ]
      }, [ $setup.selectionMode ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("label", {
        key: 0,
        class: "cm-card-check",
        onClick: _cache[8] || (_cache[8] = (0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)(() => {}, [ "stop" ]))
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        type: "checkbox",
        checked: $setup.selectedFiles.has(character.fileName),
        "aria-label": `选择 ${character.name}`,
        onChange: $event => $setup.toggleCharacterSelection(character.fileName)
      }, null, 40, _hoisted_48) ])) : (0, vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", _hoisted_49, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("img", {
        src: $setup.getAvatarSrc(character),
        alt: character.name,
        loading: "lazy",
        onError: $event => $setup.handleAvatarError(character)
      }, null, 40, _hoisted_50), character.tags.length ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("span", _hoisted_51, [ ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)(character.tags.slice(0, 8), tag => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("b", {
        key: tag.id
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(tag.name), 1))), 128)), character.tags.length > 8 ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("b", _hoisted_52, "+" + (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(character.tags.length - 8), 1)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ])) : (0, vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", _hoisted_53, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("strong", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(character.name), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", _hoisted_54, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        title: character.fav ? "取消收藏" : "收藏",
        "aria-label": `${character.fav ? "取消收藏" : "收藏"} ${character.name}`,
        "aria-pressed": character.fav,
        disabled: $setup.applyingFavoriteFiles.has(character.fileName),
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)([ "cm-card-action", {
          active: character.fav
        } ]),
        onClick: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($event => $setup.toggleFavorite(character), [ "stop" ])
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(character.fav ? "★" : "☆"), 11, _hoisted_55), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        title: "下载角色卡",
        "aria-label": `下载 ${character.name}`,
        class: "cm-card-action",
        onClick: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($event => $setup.downloadCharacter(character), [ "stop" ])
      }, [ ..._cache[42] || (_cache[42] = [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("svg", {
        viewBox: "0 0 24 24",
        "aria-hidden": "true",
        focusable: "false"
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "M12 3v11m0 0 4-4m-4 4-4-4M5 17v3h14v-3"
      }) ], -1) ]) ], 8, _hoisted_56) ]) ]) ], 42, _hoisted_47))), 128)) ], 36)) ], 2), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-panel-toggle right",
        type: "button",
        title: $setup.rightCollapsed ? "展开右栏" : "收起右栏",
        "aria-label": $setup.rightCollapsed ? "展开右栏" : "收起右栏",
        "aria-pressed": $setup.rightCollapsed,
        onClick: _cache[9] || (_cache[9] = $event => $setup.rightCollapsed = !$setup.rightCollapsed)
      }, null, 8, _hoisted_57), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("section", {
        class: "cm-preview",
        "aria-label": "角色详情预览",
        "aria-hidden": $setup.rightCollapsed
      }, [ $setup.importMode ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        key: 0
      }, [ !$setup.selectedImportCandidate ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_59, "请选择或解析一个导入候选项。")) : ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        key: 1
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_60, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_61, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectedImportCandidate.format.toUpperCase()), 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h2", null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectedImportCandidate.summary.name), 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("p", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.formatImportAction($setup.selectedImportCandidate)) + " · " + (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectedImportCandidate.format.toUpperCase()) + " · " + (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectedImportCandidate.fileName), 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("p", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectedImportCandidate.sourceName), 1) ]) ]), $setup.selectedImportCandidate.issues.length ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_62, [ ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.selectedImportCandidate.issues, issue => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", {
        key: issue.message,
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)(issue.level)
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(issue.message), 3))), 128)) ])) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.selectedImportDiff, group => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("article", {
        key: group.id,
        class: "cm-section cm-diff-section"
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h3", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(group.title), 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dl", null, [ ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)(group.rows, row => ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", {
        key: `${group.id}-${row.label}`,
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)({
          changed: row.changed,
          preserved: row.preserved
        })
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dt", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(row.label), 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dd", null, [ ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.getImportDiffLines(row), line => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createBlock)((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.resolveDynamicComponent)(line.primary ? "strong" : "span"), {
        key: `${row.label}-${line.label}`
      }, {
        default: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withCtx)(() => [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createTextVNode)((0, 
        vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(line.label) + "：" + (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.truncate(line.value, "", line.primary ? 90 : 70)), 1) ]),
        _: 2
      }, 1024))), 128)) ]) ], 2))), 128)) ]) ]))), 128)) ], 64)) ], 64)) : ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        key: 1
      }, [ $setup.managementStatus ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", _hoisted_63, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.managementStatus), 1)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ], 64)), !$setup.importMode && $setup.showSelectionSummary ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        key: 2
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_64, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h2", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectedCharacters.length) + " 个已选角色", 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dl", _hoisted_65, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ _cache[43] || (_cache[43] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dt", null, "收藏", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dd", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectedFavoriteCount), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ _cache[44] || (_cache[44] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dt", null, "缺开场", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dd", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectedMissingGreetingCount), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ _cache[45] || (_cache[45] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dt", null, "异常", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dd", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectedErrorCount), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ _cache[46] || (_cache[46] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dt", null, "标签", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dd", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.formatSelectedTags()), 1) ]) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_66, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-secondary-action",
        type: "button",
        disabled: $setup.selectedCharacters.length === 0 || $setup.applyingBatchFavorite,
        onClick: _cache[10] || (_cache[10] = $event => $setup.applyFavoriteToSelection(true))
      }, " 全部收藏 ", 8, _hoisted_67), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-secondary-action",
        type: "button",
        disabled: $setup.selectedCharacters.length === 0 || $setup.applyingBatchFavorite,
        onClick: _cache[11] || (_cache[11] = $event => $setup.applyFavoriteToSelection(false))
      }, " 取消收藏 ", 8, _hoisted_68), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-primary-action",
        type: "button",
        disabled: $setup.selectedCharacters.length === 0 || $setup.exportingFiles,
        onClick: $setup.exportSelectedZip
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.exportingFiles ? "正在导出..." : "导出 ZIP"), 9, _hoisted_69) ]) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("section", _hoisted_70, [ _cache[51] || (_cache[51] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h3", null, "删除", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("label", null, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        "onUpdate:modelValue": _cache[12] || (_cache[12] = $event => $setup.deleteBackupCharacters = $event),
        type: "checkbox",
        onChange: $setup.clearDeletePreview
      }, null, 544), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelCheckbox, $setup.deleteBackupCharacters ] ]), _cache[47] || (_cache[47] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createTextVNode)(" 删除前导出 ZIP 备份 ", -1)) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("label", null, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        "onUpdate:modelValue": _cache[13] || (_cache[13] = $event => $setup.deleteChats = $event),
        type: "checkbox",
        onChange: $setup.clearDeletePreview
      }, null, 544), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelCheckbox, $setup.deleteChats ] ]), _cache[48] || (_cache[48] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createTextVNode)(" 同时删除聊天记录 ", -1)) ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("label", null, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        "onUpdate:modelValue": _cache[14] || (_cache[14] = $event => $setup.deleteWorldBooks = $event),
        type: "checkbox",
        onChange: $setup.clearDeletePreview
      }, null, 544), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelCheckbox, $setup.deleteWorldBooks ] ]), _cache[49] || (_cache[49] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createTextVNode)(" 删除导入的内嵌世界书 ", -1)) ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-danger-action",
        type: "button",
        disabled: $setup.selectedCharacters.length === 0 || $setup.applyingDeletion,
        onClick: $setup.previewSelectedDeletion
      }, " 预览删除 ", 8, _hoisted_71), $setup.deletePreview ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_72, [ ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.deletePreview.errors, error => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", {
        key: error,
        class: "error"
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(error), 1))), 128)), ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.deletePreview.warnings, warning => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", {
        key: warning,
        class: "warning"
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(warning), 1))), 128)), ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.deletePreview.targets, target => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("article", {
        key: target.fileName
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("strong", null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(target.name), 1), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(target.fileName), 1), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "聊天：" + (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(target.chats.length) + " 条" + (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(target.willDeleteChats ? "，将删除" : ""), 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createTextVNode)(" 世界书：" + (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(target.worldBook.name || "无") + " ", 1), target.willDeleteWorldBook ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        key: 0
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createTextVNode)("，将删除") ], 64)) : target.worldBook.type !== "none" ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        key: 1
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createTextVNode)("，跳过：" + (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(target.worldBook.reason), 1) ], 64)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "标签：" + (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(target.tagNames.length ? target.tagNames.join("、") : "无"), 1), ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)(target.issues, issue => ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", {
        key: issue.message,
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)(issue.level)
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(issue.message), 3))), 128)) ]))), 128)), $setup.deletePreview.requiresDeleteText ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("label", _hoisted_73, [ _cache[50] || (_cache[50] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "输入 DELETE 确认批量删除", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        "onUpdate:modelValue": _cache[15] || (_cache[15] = $event => $setup.deleteConfirmText = $event),
        type: "text",
        autocomplete: "off"
      }, null, 512), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelText, $setup.deleteConfirmText ] ]) ])) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-danger-action strong",
        type: "button",
        disabled: !$setup.canConfirmDeletion,
        onClick: $setup.confirmDeletion
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.applyingDeletion ? "正在删除..." : `确认删除 ${$setup.deletePreview.targets.length} 项`), 9, _hoisted_74) ])) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("section", _hoisted_75, [ _cache[57] || (_cache[57] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h3", null, "标签操作", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("label", _hoisted_76, [ _cache[53] || (_cache[53] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "操作", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("select", {
        "onUpdate:modelValue": _cache[16] || (_cache[16] = $event => $setup.tagAction = $event),
        onChange: $setup.clearTagPreview
      }, [ ..._cache[52] || (_cache[52] = [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("option", {
        value: "add"
      }, "添加已有标签", -1), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("option", {
        value: "remove"
      }, "移除已有标签", -1), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("option", {
        value: "create"
      }, "新建并绑定", -1) ]) ], 544), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelSelect, $setup.tagAction ] ]) ]), $setup.tagAction !== "create" ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("label", _hoisted_77, [ _cache[54] || (_cache[54] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "标签", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("select", {
        "onUpdate:modelValue": _cache[17] || (_cache[17] = $event => $setup.selectedTagId = $event),
        onChange: $setup.clearTagPreview
      }, [ ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.tavernTags, tag => ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("option", {
        key: tag.id,
        value: tag.id
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(tag.name), 9, _hoisted_78))), 128)) ], 544), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelSelect, $setup.selectedTagId ] ]) ])) : ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("label", _hoisted_79, [ _cache[55] || (_cache[55] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "新标签名称", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        "onUpdate:modelValue": _cache[18] || (_cache[18] = $event => $setup.newTagName = $event),
        type: "text",
        placeholder: "例如：待整理",
        onInput: $setup.clearTagPreview
      }, null, 544), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelText, $setup.newTagName ] ]) ])), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-primary-action",
        type: "button",
        disabled: $setup.selectedCharacters.length === 0,
        onClick: $setup.previewTagChanges
      }, " 预览变更 ", 8, _hoisted_80), $setup.tagPreview ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_81, [ _cache[56] || (_cache[56] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("strong", null, "变更预览", -1)), $setup.tagPreview.errors.length ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", _hoisted_82, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.tagPreview.errors.join(" ")), 1)) : ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        key: 1
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("p", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.tagPreview.createsTag ? "新建并绑定" : $setup.tagAction === "remove" ? "移除" : "添加") + " “" + (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.tagPreview.tagName) + "”，会更新 " + (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.tagPreview.changedFileNames.length) + " 个角色。 ", 1), $setup.tagPreview.unchangedFileNames.length ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", _hoisted_83, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.tagPreview.unchangedFileNames.length) + " 个角色无变化。 ", 1)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-primary-action",
        type: "button",
        disabled: $setup.applyingTags || $setup.tagPreview.changedFileNames.length === 0,
        onClick: $setup.confirmTagChanges
      }, " 确认写入酒馆标签 ", 8, _hoisted_84) ], 64)) ])) : (0, vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), $setup.tagStatus ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", _hoisted_85, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.tagStatus), 1)) : (0, vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]) ], 64)) : !$setup.importMode && !$setup.activePreview ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_86, "请选择一个角色查看详情。")) : !$setup.importMode && $setup.activePreview ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        key: 4
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_87, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("img", {
        src: $setup.getAvatarSrc($setup.activePreview),
        alt: $setup.activePreview.name,
        onError: _cache[19] || (_cache[19] = $event => $setup.handleAvatarError($setup.activePreview))
      }, null, 40, _hoisted_88), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        "onUpdate:modelValue": _cache[20] || (_cache[20] = $event => $setup.renameInput = $event),
        class: "cm-title-input",
        "aria-label": "角色名称",
        type: "text",
        disabled: $setup.applyingRename,
        onBlur: $setup.saveInlineRename,
        onKeydown: [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.withKeys)((0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($setup.saveInlineRename, [ "prevent" ]), [ "enter" ]), (0, 
        vue__WEBPACK_IMPORTED_MODULE_0__.withKeys)((0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($setup.resetRenameEditor, [ "prevent" ]), [ "esc" ]) ]
      }, null, 40, _hoisted_89), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelText, $setup.renameInput ] ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("p", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.activePreview.fav ? "已收藏" : "未收藏"), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_90, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-launch-action",
        type: "button",
        title: "启动角色，打开最近聊天",
        "aria-label": "启动角色，打开最近聊天",
        disabled: $setup.launchingFileName === $setup.activePreview.fileName,
        onClick: _cache[21] || (_cache[21] = $event => $setup.launchCharacter($setup.activePreview))
      }, [ ..._cache[58] || (_cache[58] = [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("svg", {
        viewBox: "0 0 24 24",
        "aria-hidden": "true",
        focusable: "false"
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "M8 5v14l11-7-11-7Z"
      }) ], -1), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "启动", -1) ]) ], 8, _hoisted_91), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-danger-action compact",
        type: "button",
        disabled: $setup.applyingDeletion,
        onClick: $setup.previewActiveDeletion
      }, " 删除 ", 8, _hoisted_92) ]) ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dl", _hoisted_93, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ _cache[59] || (_cache[59] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dt", null, "作者", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dd", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.activePreview.creator || "未知"), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ _cache[60] || (_cache[60] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dt", null, "版本", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dd", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.activePreview.character_version || "未知"), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ _cache[61] || (_cache[61] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dt", null, "Token", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dd", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.activePreview.tokens || "未知"), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ _cache[62] || (_cache[62] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dt", null, "世界书", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dd", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.activePreview.character_book || "无"), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ _cache[63] || (_cache[63] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dt", null, "导入", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dd", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.formatDate($setup.activePreview.date_added)), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ _cache[64] || (_cache[64] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dt", null, "聊天", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("dd", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.formatDate($setup.activePreview.date_last_chat)), 1) ]) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_94, [ _cache[65] || (_cache[65] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("strong", null, "标签", -1)), $setup.activePreview.tags.length === 0 ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("span", _hoisted_95, "无")) : ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        key: 1
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.activePreview.tags, tag => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("span", {
        key: tag.id,
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)([ "cm-detail-tag-chip", {
          active: $setup.activeTagIds.includes(tag.id)
        } ])
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        "aria-pressed": $setup.activeTagIds.includes(tag.id),
        title: `筛选标签：${tag.name}`,
        onClick: $event => $setup.activateTagFilter(tag.id)
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(tag.name), 9, _hoisted_96), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        "aria-label": `从 ${$setup.activePreview.name} 移除标签 ${tag.name}`,
        title: "移除标签",
        onClick: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($event => $setup.removeDetailTag(tag), [ "stop" ])
      }, " × ", 8, _hoisted_97) ], 2))), 128)), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-detail-tag-add",
        type: "button",
        title: "添加标签",
        "aria-label": "添加标签",
        onClick: $setup.openTagDialog
      }, " + ") ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_98, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("label", _hoisted_99, [ _cache[66] || (_cache[66] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "来源", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        "onUpdate:modelValue": _cache[22] || (_cache[22] = $event => $setup.sourceUrlDraft = $event),
        type: "url",
        inputmode: "url",
        placeholder: "Discord / 发布页 URL",
        disabled: $setup.savingSourceUrl,
        onBlur: $setup.saveSourceUrl,
        onKeydown: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withKeys)((0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($setup.saveSourceUrl, [ "prevent" ]), [ "enter" ])
      }, null, 40, _hoisted_100), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelText, $setup.sourceUrlDraft ] ]) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_101, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        title: "打开来源 URL",
        "aria-label": "打开来源 URL",
        disabled: !$setup.canOpenSourceUrl,
        onClick: $setup.openSourceUrl
      }, "↗", 8, _hoisted_102), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        title: "清除来源 URL",
        "aria-label": "清除来源 URL",
        disabled: $setup.savingSourceUrl || !$setup.sourceUrlDraft.trim(),
        onClick: $setup.clearSourceUrl
      }, " × ", 8, _hoisted_103) ]), $setup.sourceUrlError ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", _hoisted_104, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.sourceUrlError), 1)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("section", _hoisted_105, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_106, [ _cache[67] || (_cache[67] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h3", null, "聊天记录", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_107, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-secondary-action",
        type: "button",
        onClick: $setup.toggleChats
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.chatsExpanded ? "收起" : "查看"), 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-secondary-action",
        type: "button",
        title: "下载当前角色的全部聊天记录",
        disabled: $setup.activeChatState.loading || $setup.activeChatState.chats.length === 0,
        onClick: $setup.downloadActiveChats
      }, " 全部下载 ", 8, _hoisted_108) ]) ]), $setup.activeChatState.loading ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", _hoisted_109, "正在读取聊天记录...")) : $setup.activeChatState.error ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", _hoisted_110, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.activeChatState.error), 1)) : $setup.chatsExpanded ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        key: 2
      }, [ $setup.activeChatState.chats.length === 0 ? ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", _hoisted_111, "没有读取到聊天记录。")) : ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_112, [ ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.activeChatState.chats, chat => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("article", {
        key: chat.id
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_113, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_114, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        value: $setup.getChatDisplayTitle(chat),
        type: "text",
        "aria-label": `聊天名称 ${$setup.getChatDisplayTitle(chat)}`,
        title: "修改这条聊天在管理器里的显示名",
        onChange: $event => $setup.commitChatAlias(chat, $event),
        onKeydown: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withKeys)((0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($event => $setup.commitChatAlias(chat, $event), [ "prevent" ]), [ "enter" ])
      }, null, 40, _hoisted_115), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(chat.messageCount || 0) + " 条 · " + (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.formatDate(chat.updatedAt)), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_116, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        "aria-label": `查看正文 ${$setup.getChatDisplayTitle(chat)}`,
        title: "查看正文",
        onClick: $event => $setup.toggleChatContent(chat)
      }, [ ..._cache[68] || (_cache[68] = [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("svg", {
        viewBox: "0 0 24 24",
        "aria-hidden": "true",
        focusable: "false"
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      }), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("circle", {
        cx: "12",
        cy: "12",
        r: "2.5"
      }) ], -1) ]) ], 8, _hoisted_117), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        "aria-label": `下载聊天 ${$setup.getChatDisplayTitle(chat)}`,
        title: "下载这条聊天记录",
        onClick: $event => $setup.downloadChat(chat)
      }, [ ..._cache[69] || (_cache[69] = [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("svg", {
        viewBox: "0 0 24 24",
        "aria-hidden": "true",
        focusable: "false"
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "M12 3v12"
      }), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "m7 10 5 5 5-5"
      }), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "M5 20h14"
      }) ], -1) ]) ], 8, _hoisted_118), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        "aria-label": `启动聊天 ${$setup.getChatDisplayTitle(chat)}`,
        title: "启动这条聊天",
        onClick: $event => $setup.openChat(chat)
      }, [ ..._cache[70] || (_cache[70] = [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("svg", {
        viewBox: "0 0 24 24",
        "aria-hidden": "true",
        focusable: "false"
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "M8 5v14l11-7-11-7Z"
      }) ], -1) ]) ], 8, _hoisted_119), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "danger",
        type: "button",
        "aria-label": `删除聊天 ${$setup.getChatDisplayTitle(chat)}`,
        title: "删除这条聊天记录",
        disabled: $setup.deletingChatKeys.has($setup.getChatAliasKey(chat)),
        onClick: $event => $setup.deleteChat(chat)
      }, [ ..._cache[71] || (_cache[71] = [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("svg", {
        viewBox: "0 0 24 24",
        "aria-hidden": "true",
        focusable: "false"
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "M4 7h16"
      }), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "M10 11v6"
      }), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "M14 11v6"
      }), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "M6 7l1 14h10l1-14"
      }), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("path", {
        d: "M9 7V4h6v3"
      }) ], -1) ]) ], 8, _hoisted_120) ]) ]), $setup.expandedChatKey === $setup.getChatAliasKey(chat) ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("pre", _hoisted_121, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.getChatContentPreview(chat)), 1)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]))), 128)) ])) ], 64)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]), $setup.tagDialogOpen ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", {
        key: 0,
        class: "cm-tag-dialog-backdrop",
        role: "presentation",
        onClick: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($setup.closeTagDialog, [ "self" ])
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("section", _hoisted_122, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("header", null, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ _cache[72] || (_cache[72] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h3", null, "添加标签", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("p", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.activePreview.name), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        title: "关闭",
        "aria-label": "关闭添加标签",
        onClick: $setup.closeTagDialog
      }, "×") ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_123, [ ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.tavernTags, tag => ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), 
      (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("button", {
        key: tag.id,
        type: "button",
        "aria-pressed": $setup.detailActiveTagIds.has(tag.id),
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)({
          active: $setup.detailActiveTagIds.has(tag.id)
        }),
        disabled: $setup.applyingDetailTag,
        onClick: $event => $setup.toggleDetailTag(tag)
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(tag.name), 11, _hoisted_124))), 128)), $setup.tavernTags.length === 0 ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", _hoisted_125, "当前没有已有标签。")) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("label", _hoisted_126, [ _cache[73] || (_cache[73] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("span", null, "自定义标签", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)((0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("input", {
        "onUpdate:modelValue": _cache[23] || (_cache[23] = $event => $setup.detailTagName = $event),
        type: "text",
        placeholder: "输入新标签，Enter 添加",
        onKeydown: (0, vue__WEBPACK_IMPORTED_MODULE_0__.withKeys)((0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)($setup.confirmCustomDetailTag, [ "prevent" ]), [ "enter" ])
      }, null, 40, _hoisted_127), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelText, $setup.detailTagName ] ]) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_128, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-primary-action",
        type: "button",
        disabled: $setup.applyingDetailTag || !$setup.detailTagName.trim(),
        onClick: $setup.confirmCustomDetailTag
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.applyingDetailTag ? "正在写入..." : "添加"), 9, _hoisted_129), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-secondary-action",
        type: "button",
        disabled: $setup.applyingDetailTag,
        onClick: $setup.closeTagDialog
      }, " 取消 ", 8, _hoisted_130) ]) ]) ])) : (0, vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), $setup.loadingDetail ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_131, "正在读取详情...")) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), $setup.previewRiskIssues.length ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_132, [ ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.previewRiskIssues, issue => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("p", {
        key: issue.message,
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)(issue.level)
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(issue.message), 3))), 128)) ])) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("article", _hoisted_133, [ _cache[74] || (_cache[74] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h3", null, "描述", -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("p", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.truncate($setup.previewDescription, "无内容", 160)), 1) ]), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("article", _hoisted_134, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_135, [ _cache[75] || (_cache[75] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h3", null, "开场白", -1)), $setup.greetingOptions.length > 1 ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_136, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        title: "上一条开场白",
        "aria-label": "上一条开场白",
        disabled: $setup.selectedGreetingIndex === 0,
        onClick: _cache[24] || (_cache[24] = $event => $setup.changeGreeting(-1))
      }, " ‹ ", 8, _hoisted_137), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("output", _hoisted_138, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.greetingPageLabel), 1), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        title: "下一条开场白",
        "aria-label": "下一条开场白",
        disabled: $setup.selectedGreetingIndex >= $setup.greetingOptions.length - 1,
        onClick: _cache[25] || (_cache[25] = $event => $setup.changeGreeting(1))
      }, " › ", 8, _hoisted_139), $setup.greetingOptions.length > 5 ? (0, vue__WEBPACK_IMPORTED_MODULE_0__.withDirectives)(((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("select", {
        key: 0,
        "onUpdate:modelValue": _cache[26] || (_cache[26] = $event => $setup.selectedGreetingIndex = $event),
        "aria-label": "跳转开场白"
      }, [ ((0, vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(true), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)(vue__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.renderList)($setup.greetingOptions, (_option, index) => ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("option", {
        key: index,
        value: index
      }, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)(index + 1), 9, _hoisted_140))), 128)) ], 512)), [ [ vue__WEBPACK_IMPORTED_MODULE_0__.vModelSelect, $setup.selectedGreetingIndex, void 0, {
        number: true
      } ] ]) : (0, vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ])) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_141, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("p", null, (0, vue__WEBPACK_IMPORTED_MODULE_0__.toDisplayString)($setup.selectedGreeting || ($setup.loadingDetail ? "正在读取详情..." : "无内容")), 1) ]) ]) ], 64)) : (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ], 8, _hoisted_58) ], 2), $setup.settingsOpen ? ((0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", {
        key: 0,
        class: "cm-settings-backdrop",
        role: "presentation",
        onClick: _cache[32] || (_cache[32] = $event => $setup.settingsOpen = false)
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("section", {
        class: "cm-settings",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "cm-settings-title",
        onClick: _cache[31] || (_cache[31] = (0, vue__WEBPACK_IMPORTED_MODULE_0__.withModifiers)(() => {}, [ "stop" ]))
      }, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("header", null, [ _cache[76] || (_cache[76] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h2", {
        id: "cm-settings-title"
      }, "设置"), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("p", null, "筛选和面板行为") ], -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        class: "cm-icon-button danger",
        type: "button",
        title: "关闭设置",
        onClick: _cache[27] || (_cache[27] = $event => $setup.settingsOpen = false)
      }, "×") ]), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("article", _hoisted_142, [ _cache[77] || (_cache[77] = (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", null, [ (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("h3", null, "标签过滤逻辑"), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("p", null, "默认只保留一个标签选择，需要组合筛选时可切换为或/且。") ], -1)), (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("div", _hoisted_143, [ (0, 
      vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        role: "radio",
        "aria-checked": $setup.tagFilterMode === "exclusive",
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)({
          active: $setup.tagFilterMode === "exclusive"
        }),
        onClick: _cache[28] || (_cache[28] = $event => $setup.setTagFilterMode("exclusive"))
      }, " 单选 ", 10, _hoisted_144), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        role: "radio",
        "aria-checked": $setup.tagFilterMode === "or",
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)({
          active: $setup.tagFilterMode === "or"
        }),
        onClick: _cache[29] || (_cache[29] = $event => $setup.setTagFilterMode("or"))
      }, " 或 ", 10, _hoisted_145), (0, vue__WEBPACK_IMPORTED_MODULE_0__.createElementVNode)("button", {
        type: "button",
        role: "radio",
        "aria-checked": $setup.tagFilterMode === "and",
        class: (0, vue__WEBPACK_IMPORTED_MODULE_0__.normalizeClass)({
          active: $setup.tagFilterMode === "and"
        }),
        onClick: _cache[30] || (_cache[30] = $event => $setup.setTagFilterMode("and"))
      }, " 且 ", 10, _hoisted_146) ]) ]) ]) ])) : (0, vue__WEBPACK_IMPORTED_MODULE_0__.createCommentVNode)("v-if", true) ]);
    }
  },
  "./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-vue-components!./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-auto-import!./node_modules/.pnpm/vue-style-loader@4.1.3/node_modules/vue-style-loader/index.js??clonedRuleSet-48.use[0]!./node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/cjs.js??clonedRuleSet-48.use[1]!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/stylePostLoader.js!./node_modules/.pnpm/postcss-loader@8.2.1_postcs_6cf2f04cb0b05bf1e03b98407ffe6d5b/node_modules/postcss-loader/dist/cjs.js!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./src/角色卡管理器/App.vue?vue&type=style&index=0&id=8f9db926&scoped=true&lang=css"(module, __unused_webpack_exports, __webpack_require__) {
    var content = __webpack_require__(/*! !!../../node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/cjs.js??clonedRuleSet-48.use[1]!../../node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/stylePostLoader.js!../../node_modules/.pnpm/postcss-loader@8.2.1_postcs_6cf2f04cb0b05bf1e03b98407ffe6d5b/node_modules/postcss-loader/dist/cjs.js!../../node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./App.vue?vue&type=style&index=0&id=8f9db926&scoped=true&lang=css */ "./node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/cjs.js??clonedRuleSet-48.use[1]!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/stylePostLoader.js!./node_modules/.pnpm/postcss-loader@8.2.1_postcs_6cf2f04cb0b05bf1e03b98407ffe6d5b/node_modules/postcss-loader/dist/cjs.js!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./src/角色卡管理器/App.vue?vue&type=style&index=0&id=8f9db926&scoped=true&lang=css");
    if (content.__esModule) content = content.default;
    if (typeof content === "string") content = [ [ module.id, content, "" ] ];
    if (content.locals) module.exports = content.locals;
    var add = __webpack_require__(/*! !../../node_modules/.pnpm/vue-style-loader@4.1.3/node_modules/vue-style-loader/lib/addStylesClient.js */ "./node_modules/.pnpm/vue-style-loader@4.1.3/node_modules/vue-style-loader/lib/addStylesClient.js")["default"];
    var update = add("07a3d498", content, false, {
      ssrId: true
    });
    if (false) {}
  },
  "./src/角色卡管理器/App.vue"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      default: () => __WEBPACK_DEFAULT_EXPORT__
    });
    var _App_vue_vue_type_template_id_8f9db926_scoped_true_ts_true__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./App.vue?vue&type=template&id=8f9db926&scoped=true&ts=true */ "./src/角色卡管理器/App.vue?vue&type=template&id=8f9db926&scoped=true&ts=true");
    var _App_vue_vue_type_script_setup_true_lang_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./App.vue?vue&type=script&setup=true&lang=ts */ "./src/角色卡管理器/App.vue?vue&type=script&setup=true&lang=ts");
    var _App_vue_vue_type_style_index_0_id_8f9db926_scoped_true_lang_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./App.vue?vue&type=style&index=0&id=8f9db926&scoped=true&lang=css */ "./src/角色卡管理器/App.vue?vue&type=style&index=0&id=8f9db926&scoped=true&lang=css");
    var _node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_exportHelper_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/exportHelper.js */ "./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/exportHelper.js");
    const __exports__ = (0, _node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_exportHelper_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_App_vue_vue_type_script_setup_true_lang_ts__WEBPACK_IMPORTED_MODULE_1__["default"], [ [ "render", _App_vue_vue_type_template_id_8f9db926_scoped_true_ts_true__WEBPACK_IMPORTED_MODULE_0__.render ], [ "__scopeId", "data-v-8f9db926" ], [ "__file", "src/角色卡管理器/App.vue" ] ]);
    if (false) {}
    const __WEBPACK_DEFAULT_EXPORT__ = __exports__;
  },
  "./src/角色卡管理器/App.vue?vue&type=script&setup=true&lang=ts"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      default: () => _node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_vue_components_node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_auto_import_node_modules_pnpm_ts_loader_9_6_0_loader_util_0ef68b16dcc23cdc6804530e4000b72d_node_modules_ts_loader_index_js_clonedRuleSet_42_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_index_js_ruleSet_1_rules_6_use_0_App_vue_vue_type_script_setup_true_lang_ts__WEBPACK_IMPORTED_MODULE_0__["default"]
    });
    var _node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_vue_components_node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_auto_import_node_modules_pnpm_ts_loader_9_6_0_loader_util_0ef68b16dcc23cdc6804530e4000b72d_node_modules_ts_loader_index_js_clonedRuleSet_42_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_index_js_ruleSet_1_rules_6_use_0_App_vue_vue_type_script_setup_true_lang_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-vue-components!../../node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-auto-import!../../node_modules/.pnpm/ts-loader@9.6.0_loader-util_0ef68b16dcc23cdc6804530e4000b72d/node_modules/ts-loader/index.js??clonedRuleSet-42!../../node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./App.vue?vue&type=script&setup=true&lang=ts */ "./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-vue-components!./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-auto-import!./node_modules/.pnpm/ts-loader@9.6.0_loader-util_0ef68b16dcc23cdc6804530e4000b72d/node_modules/ts-loader/index.js??clonedRuleSet-42!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./src/角色卡管理器/App.vue?vue&type=script&setup=true&lang=ts");
  },
  "./src/角色卡管理器/App.vue?vue&type=template&id=8f9db926&scoped=true&ts=true"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      render: () => _node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_vue_components_node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_auto_import_node_modules_pnpm_ts_loader_9_6_0_loader_util_0ef68b16dcc23cdc6804530e4000b72d_node_modules_ts_loader_index_js_clonedRuleSet_42_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_templateLoader_js_ruleSet_1_rules_4_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_index_js_ruleSet_1_rules_6_use_0_App_vue_vue_type_template_id_8f9db926_scoped_true_ts_true__WEBPACK_IMPORTED_MODULE_0__.render
    });
    var _node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_vue_components_node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_auto_import_node_modules_pnpm_ts_loader_9_6_0_loader_util_0ef68b16dcc23cdc6804530e4000b72d_node_modules_ts_loader_index_js_clonedRuleSet_42_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_templateLoader_js_ruleSet_1_rules_4_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_index_js_ruleSet_1_rules_6_use_0_App_vue_vue_type_template_id_8f9db926_scoped_true_ts_true__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-vue-components!../../node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-auto-import!../../node_modules/.pnpm/ts-loader@9.6.0_loader-util_0ef68b16dcc23cdc6804530e4000b72d/node_modules/ts-loader/index.js??clonedRuleSet-42!../../node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/templateLoader.js??ruleSet[1].rules[4]!../../node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./App.vue?vue&type=template&id=8f9db926&scoped=true&ts=true */ "./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-vue-components!./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-auto-import!./node_modules/.pnpm/ts-loader@9.6.0_loader-util_0ef68b16dcc23cdc6804530e4000b72d/node_modules/ts-loader/index.js??clonedRuleSet-42!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/templateLoader.js??ruleSet[1].rules[4]!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./src/角色卡管理器/App.vue?vue&type=template&id=8f9db926&scoped=true&ts=true");
  },
  "./src/角色卡管理器/App.vue?vue&type=style&index=0&id=8f9db926&scoped=true&lang=css"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    var _node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_vue_components_node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_auto_import_node_modules_pnpm_vue_style_loader_4_1_3_node_modules_vue_style_loader_index_js_clonedRuleSet_48_use_0_node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_cjs_js_clonedRuleSet_48_use_1_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_stylePostLoader_js_node_modules_pnpm_postcss_loader_8_2_1_postcs_6cf2f04cb0b05bf1e03b98407ffe6d5b_node_modules_postcss_loader_dist_cjs_js_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_index_js_ruleSet_1_rules_6_use_0_App_vue_vue_type_style_index_0_id_8f9db926_scoped_true_lang_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-vue-components!../../node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-auto-import!../../node_modules/.pnpm/vue-style-loader@4.1.3/node_modules/vue-style-loader/index.js??clonedRuleSet-48.use[0]!../../node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/cjs.js??clonedRuleSet-48.use[1]!../../node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/stylePostLoader.js!../../node_modules/.pnpm/postcss-loader@8.2.1_postcs_6cf2f04cb0b05bf1e03b98407ffe6d5b/node_modules/postcss-loader/dist/cjs.js!../../node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./App.vue?vue&type=style&index=0&id=8f9db926&scoped=true&lang=css */ "./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-vue-components!./node_modules/.pnpm/unplugin@2.3.11/node_modules/unplugin/dist/webpack/loaders/transform.js??unplugin-auto-import!./node_modules/.pnpm/vue-style-loader@4.1.3/node_modules/vue-style-loader/index.js??clonedRuleSet-48.use[0]!./node_modules/.pnpm/css-loader@7.1.4_webpack@5.107.2/node_modules/css-loader/dist/cjs.js??clonedRuleSet-48.use[1]!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/stylePostLoader.js!./node_modules/.pnpm/postcss-loader@8.2.1_postcs_6cf2f04cb0b05bf1e03b98407ffe6d5b/node_modules/postcss-loader/dist/cjs.js!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[6].use[0]!./src/角色卡管理器/App.vue?vue&type=style&index=0&id=8f9db926&scoped=true&lang=css");
    var _node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_vue_components_node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_auto_import_node_modules_pnpm_vue_style_loader_4_1_3_node_modules_vue_style_loader_index_js_clonedRuleSet_48_use_0_node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_cjs_js_clonedRuleSet_48_use_1_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_stylePostLoader_js_node_modules_pnpm_postcss_loader_8_2_1_postcs_6cf2f04cb0b05bf1e03b98407ffe6d5b_node_modules_postcss_loader_dist_cjs_js_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_index_js_ruleSet_1_rules_6_use_0_App_vue_vue_type_style_index_0_id_8f9db926_scoped_true_lang_css__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_vue_components_node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_auto_import_node_modules_pnpm_vue_style_loader_4_1_3_node_modules_vue_style_loader_index_js_clonedRuleSet_48_use_0_node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_cjs_js_clonedRuleSet_48_use_1_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_stylePostLoader_js_node_modules_pnpm_postcss_loader_8_2_1_postcs_6cf2f04cb0b05bf1e03b98407ffe6d5b_node_modules_postcss_loader_dist_cjs_js_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_index_js_ruleSet_1_rules_6_use_0_App_vue_vue_type_style_index_0_id_8f9db926_scoped_true_lang_css__WEBPACK_IMPORTED_MODULE_0__);
    var __WEBPACK_REEXPORT_OBJECT__ = {};
    for (const __WEBPACK_IMPORT_KEY__ in _node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_vue_components_node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_auto_import_node_modules_pnpm_vue_style_loader_4_1_3_node_modules_vue_style_loader_index_js_clonedRuleSet_48_use_0_node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_cjs_js_clonedRuleSet_48_use_1_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_stylePostLoader_js_node_modules_pnpm_postcss_loader_8_2_1_postcs_6cf2f04cb0b05bf1e03b98407ffe6d5b_node_modules_postcss_loader_dist_cjs_js_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_index_js_ruleSet_1_rules_6_use_0_App_vue_vue_type_style_index_0_id_8f9db926_scoped_true_lang_css__WEBPACK_IMPORTED_MODULE_0__) if (__WEBPACK_IMPORT_KEY__ !== "default") __WEBPACK_REEXPORT_OBJECT__[__WEBPACK_IMPORT_KEY__] = () => _node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_vue_components_node_modules_pnpm_unplugin_2_3_11_node_modules_unplugin_dist_webpack_loaders_transform_js_unplugin_auto_import_node_modules_pnpm_vue_style_loader_4_1_3_node_modules_vue_style_loader_index_js_clonedRuleSet_48_use_0_node_modules_pnpm_css_loader_7_1_4_webpack_5_107_2_node_modules_css_loader_dist_cjs_js_clonedRuleSet_48_use_1_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_stylePostLoader_js_node_modules_pnpm_postcss_loader_8_2_1_postcs_6cf2f04cb0b05bf1e03b98407ffe6d5b_node_modules_postcss_loader_dist_cjs_js_node_modules_pnpm_vue_loader_17_4_2_vue_3_5_3_5ab3dfc630e1a608da452efb0dfd93b8_node_modules_vue_loader_dist_index_js_ruleSet_1_rules_6_use_0_App_vue_vue_type_style_index_0_id_8f9db926_scoped_true_lang_css__WEBPACK_IMPORTED_MODULE_0__[__WEBPACK_IMPORT_KEY__];
    __webpack_require__.d(__webpack_exports__, __WEBPACK_REEXPORT_OBJECT__);
  },
  "./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.3_5ab3dfc630e1a608da452efb0dfd93b8/node_modules/vue-loader/dist/exportHelper.js"(__unused_webpack_module, exports) {
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = (sfc, props) => {
      const target = sfc.__vccOpts || sfc;
      for (const [key, val] of props) {
        target[key] = val;
      }
      return target;
    };
  },
  "./node_modules/.pnpm/vue-style-loader@4.1.3/node_modules/vue-style-loader/lib/addStylesClient.js"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      default: () => addStylesClient
    });
    var _listToStyles__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./listToStyles */ "./node_modules/.pnpm/vue-style-loader@4.1.3/node_modules/vue-style-loader/lib/listToStyles.js");
    var hasDocument = typeof document !== "undefined";
    if (typeof DEBUG !== "undefined" && DEBUG) {
      if (!hasDocument) {
        throw new Error("vue-style-loader cannot be used in a non-browser environment. " + "Use { target: 'node' } in your Webpack config to indicate a server-rendering environment.");
      }
    }
    var stylesInDom = {};
    var head = hasDocument && (document.head || document.getElementsByTagName("head")[0]);
    var singletonElement = null;
    var singletonCounter = 0;
    var isProduction = false;
    var noop = function() {};
    var options = null;
    var ssrIdKey = "data-vue-ssr-id";
    var isOldIE = typeof navigator !== "undefined" && /msie [6-9]\b/.test(navigator.userAgent.toLowerCase());
    function addStylesClient(parentId, list, _isProduction, _options) {
      isProduction = _isProduction;
      options = _options || {};
      var styles = (0, _listToStyles__WEBPACK_IMPORTED_MODULE_0__["default"])(parentId, list);
      addStylesToDom(styles);
      return function update(newList) {
        var mayRemove = [];
        for (var i = 0; i < styles.length; i++) {
          var item = styles[i];
          var domStyle = stylesInDom[item.id];
          domStyle.refs--;
          mayRemove.push(domStyle);
        }
        if (newList) {
          styles = (0, _listToStyles__WEBPACK_IMPORTED_MODULE_0__["default"])(parentId, newList);
          addStylesToDom(styles);
        } else {
          styles = [];
        }
        for (var i = 0; i < mayRemove.length; i++) {
          var domStyle = mayRemove[i];
          if (domStyle.refs === 0) {
            for (var j = 0; j < domStyle.parts.length; j++) {
              domStyle.parts[j]();
            }
            delete stylesInDom[domStyle.id];
          }
        }
      };
    }
    function addStylesToDom(styles) {
      for (var i = 0; i < styles.length; i++) {
        var item = styles[i];
        var domStyle = stylesInDom[item.id];
        if (domStyle) {
          domStyle.refs++;
          for (var j = 0; j < domStyle.parts.length; j++) {
            domStyle.parts[j](item.parts[j]);
          }
          for (;j < item.parts.length; j++) {
            domStyle.parts.push(addStyle(item.parts[j]));
          }
          if (domStyle.parts.length > item.parts.length) {
            domStyle.parts.length = item.parts.length;
          }
        } else {
          var parts = [];
          for (var j = 0; j < item.parts.length; j++) {
            parts.push(addStyle(item.parts[j]));
          }
          stylesInDom[item.id] = {
            id: item.id,
            refs: 1,
            parts
          };
        }
      }
    }
    function createStyleElement() {
      var styleElement = document.createElement("style");
      styleElement.type = "text/css";
      head.appendChild(styleElement);
      return styleElement;
    }
    function addStyle(obj) {
      var update, remove;
      var styleElement = document.querySelector("style[" + ssrIdKey + '~="' + obj.id + '"]');
      if (styleElement) {
        if (isProduction) {
          return noop;
        } else {
          styleElement.parentNode.removeChild(styleElement);
        }
      }
      if (isOldIE) {
        var styleIndex = singletonCounter++;
        styleElement = singletonElement || (singletonElement = createStyleElement());
        update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
        remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
      } else {
        styleElement = createStyleElement();
        update = applyToTag.bind(null, styleElement);
        remove = function() {
          styleElement.parentNode.removeChild(styleElement);
        };
      }
      update(obj);
      return function updateStyle(newObj) {
        if (newObj) {
          if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) {
            return;
          }
          update(obj = newObj);
        } else {
          remove();
        }
      };
    }
    var replaceText = function() {
      var textStore = [];
      return function(index, replacement) {
        textStore[index] = replacement;
        return textStore.filter(Boolean).join("\n");
      };
    }();
    function applyToSingletonTag(styleElement, index, remove, obj) {
      var css = remove ? "" : obj.css;
      if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = replaceText(index, css);
      } else {
        var cssNode = document.createTextNode(css);
        var childNodes = styleElement.childNodes;
        if (childNodes[index]) styleElement.removeChild(childNodes[index]);
        if (childNodes.length) {
          styleElement.insertBefore(cssNode, childNodes[index]);
        } else {
          styleElement.appendChild(cssNode);
        }
      }
    }
    function applyToTag(styleElement, obj) {
      var css = obj.css;
      var media = obj.media;
      var sourceMap = obj.sourceMap;
      if (media) {
        styleElement.setAttribute("media", media);
      }
      if (options.ssrId) {
        styleElement.setAttribute(ssrIdKey, obj.id);
      }
      if (sourceMap) {
        css += "\n/*# sourceURL=" + sourceMap.sources[0] + " */";
        css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
      }
      if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = css;
      } else {
        while (styleElement.firstChild) {
          styleElement.removeChild(styleElement.firstChild);
        }
        styleElement.appendChild(document.createTextNode(css));
      }
    }
  },
  "./node_modules/.pnpm/vue-style-loader@4.1.3/node_modules/vue-style-loader/lib/listToStyles.js"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      default: () => listToStyles
    });
    function listToStyles(parentId, list) {
      var styles = [];
      var newStyles = {};
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var id = item[0];
        var css = item[1];
        var media = item[2];
        var sourceMap = item[3];
        var part = {
          id: parentId + ":" + i,
          css,
          media,
          sourceMap
        };
        if (!newStyles[id]) {
          styles.push(newStyles[id] = {
            id,
            parts: [ part ]
          });
        } else {
          newStyles[id].parts.push(part);
        }
      }
      return styles;
    }
  },
  "./node_modules/.pnpm/vue@3.5.35_typescript@6.0.0-dev.20250807/node_modules/vue/dist/vue.runtime.esm-bundler.js"(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      BaseTransition: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.BaseTransition,
      BaseTransitionPropsValidators: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.BaseTransitionPropsValidators,
      Comment: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.Comment,
      DeprecationTypes: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.DeprecationTypes,
      EffectScope: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.EffectScope,
      ErrorCodes: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.ErrorCodes,
      ErrorTypeStrings: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.ErrorTypeStrings,
      Fragment: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.Fragment,
      KeepAlive: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.KeepAlive,
      ReactiveEffect: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.ReactiveEffect,
      Static: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.Static,
      Suspense: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.Suspense,
      Teleport: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.Teleport,
      Text: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.Text,
      TrackOpTypes: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.TrackOpTypes,
      Transition: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.Transition,
      TransitionGroup: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.TransitionGroup,
      TriggerOpTypes: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.TriggerOpTypes,
      VueElement: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.VueElement,
      assertNumber: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.assertNumber,
      callWithAsyncErrorHandling: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.callWithAsyncErrorHandling,
      callWithErrorHandling: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.callWithErrorHandling,
      camelize: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.camelize,
      capitalize: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.capitalize,
      cloneVNode: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.cloneVNode,
      compatUtils: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.compatUtils,
      compile: () => compile,
      computed: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.computed,
      createApp: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createApp,
      createBlock: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createBlock,
      createCommentVNode: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createCommentVNode,
      createElementBlock: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createElementBlock,
      createElementVNode: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createElementVNode,
      createHydrationRenderer: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createHydrationRenderer,
      createPropsRestProxy: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createPropsRestProxy,
      createRenderer: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createRenderer,
      createSSRApp: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createSSRApp,
      createSlots: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createSlots,
      createStaticVNode: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createStaticVNode,
      createTextVNode: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createTextVNode,
      createVNode: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.createVNode,
      customRef: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.customRef,
      defineAsyncComponent: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.defineAsyncComponent,
      defineComponent: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.defineComponent,
      defineCustomElement: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.defineCustomElement,
      defineEmits: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.defineEmits,
      defineExpose: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.defineExpose,
      defineModel: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.defineModel,
      defineOptions: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.defineOptions,
      defineProps: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.defineProps,
      defineSSRCustomElement: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.defineSSRCustomElement,
      defineSlots: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.defineSlots,
      devtools: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.devtools,
      effect: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.effect,
      effectScope: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.effectScope,
      getCurrentInstance: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.getCurrentInstance,
      getCurrentScope: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.getCurrentScope,
      getCurrentWatcher: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.getCurrentWatcher,
      getTransitionRawChildren: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.getTransitionRawChildren,
      guardReactiveProps: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.guardReactiveProps,
      h: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.h,
      handleError: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.handleError,
      hasInjectionContext: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.hasInjectionContext,
      hydrate: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.hydrate,
      hydrateOnIdle: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.hydrateOnIdle,
      hydrateOnInteraction: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.hydrateOnInteraction,
      hydrateOnMediaQuery: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.hydrateOnMediaQuery,
      hydrateOnVisible: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.hydrateOnVisible,
      initCustomFormatter: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.initCustomFormatter,
      initDirectivesForSSR: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.initDirectivesForSSR,
      inject: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.inject,
      isMemoSame: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.isMemoSame,
      isProxy: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.isProxy,
      isReactive: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.isReactive,
      isReadonly: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.isReadonly,
      isRef: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.isRef,
      isRuntimeOnly: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.isRuntimeOnly,
      isShallow: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.isShallow,
      isVNode: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.isVNode,
      markRaw: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.markRaw,
      mergeDefaults: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.mergeDefaults,
      mergeModels: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.mergeModels,
      mergeProps: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.mergeProps,
      nextTick: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.nextTick,
      nodeOps: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.nodeOps,
      normalizeClass: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.normalizeClass,
      normalizeProps: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.normalizeProps,
      normalizeStyle: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.normalizeStyle,
      onActivated: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onActivated,
      onBeforeMount: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onBeforeMount,
      onBeforeUnmount: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onBeforeUnmount,
      onBeforeUpdate: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onBeforeUpdate,
      onDeactivated: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onDeactivated,
      onErrorCaptured: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onErrorCaptured,
      onMounted: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onMounted,
      onRenderTracked: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onRenderTracked,
      onRenderTriggered: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onRenderTriggered,
      onScopeDispose: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onScopeDispose,
      onServerPrefetch: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onServerPrefetch,
      onUnmounted: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onUnmounted,
      onUpdated: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onUpdated,
      onWatcherCleanup: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.onWatcherCleanup,
      openBlock: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.openBlock,
      patchProp: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.patchProp,
      popScopeId: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.popScopeId,
      provide: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.provide,
      proxyRefs: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.proxyRefs,
      pushScopeId: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.pushScopeId,
      queuePostFlushCb: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.queuePostFlushCb,
      reactive: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.reactive,
      readonly: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.readonly,
      ref: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.ref,
      registerRuntimeCompiler: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.registerRuntimeCompiler,
      render: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.render,
      renderList: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.renderList,
      renderSlot: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.renderSlot,
      resolveComponent: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.resolveComponent,
      resolveDirective: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.resolveDirective,
      resolveDynamicComponent: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.resolveDynamicComponent,
      resolveFilter: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.resolveFilter,
      resolveTransitionHooks: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.resolveTransitionHooks,
      setBlockTracking: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.setBlockTracking,
      setDevtoolsHook: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.setDevtoolsHook,
      setTransitionHooks: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.setTransitionHooks,
      shallowReactive: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.shallowReactive,
      shallowReadonly: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.shallowReadonly,
      shallowRef: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.shallowRef,
      ssrContextKey: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.ssrContextKey,
      ssrUtils: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.ssrUtils,
      stop: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.stop,
      toDisplayString: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.toDisplayString,
      toHandlerKey: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.toHandlerKey,
      toHandlers: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.toHandlers,
      toRaw: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.toRaw,
      toRef: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.toRef,
      toRefs: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.toRefs,
      toValue: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.toValue,
      transformVNodeArgs: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.transformVNodeArgs,
      triggerRef: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.triggerRef,
      unref: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.unref,
      useAttrs: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.useAttrs,
      useCssModule: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.useCssModule,
      useCssVars: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.useCssVars,
      useHost: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.useHost,
      useId: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.useId,
      useModel: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.useModel,
      useSSRContext: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.useSSRContext,
      useShadowRoot: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.useShadowRoot,
      useSlots: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.useSlots,
      useTemplateRef: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.useTemplateRef,
      useTransitionState: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.useTransitionState,
      vModelCheckbox: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.vModelCheckbox,
      vModelDynamic: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.vModelDynamic,
      vModelRadio: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.vModelRadio,
      vModelSelect: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.vModelSelect,
      vModelText: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.vModelText,
      vShow: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.vShow,
      version: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.version,
      warn: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.warn,
      watch: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.watch,
      watchEffect: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.watchEffect,
      watchPostEffect: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.watchPostEffect,
      watchSyncEffect: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.watchSyncEffect,
      withAsyncContext: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.withAsyncContext,
      withCtx: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.withCtx,
      withDefaults: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.withDefaults,
      withDirectives: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.withDirectives,
      withKeys: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.withKeys,
      withMemo: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.withMemo,
      withModifiers: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.withModifiers,
      withScopeId: () => _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__.withScopeId
    });
    var _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @vue/runtime-dom */ "./node_modules/.pnpm/@vue+runtime-core@3.5.35/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js");
    var _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @vue/runtime-dom */ "./node_modules/.pnpm/@vue+runtime-dom@3.5.35/node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js");
    /**
* vue v3.5.35
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/    function initDev() {
      {
        (0, _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_0__.initCustomFormatter)();
      }
    }
    if (true) {
      initDev();
    }
    const compile = () => {
      if (true) {
        (0, _vue_runtime_dom__WEBPACK_IMPORTED_MODULE_0__.warn)(`Runtime compilation is not supported in this build of Vue.` + ` Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".`);
      }
    };
  }
};

var __webpack_module_cache__ = {};

function __webpack_require__(moduleId) {
  var cachedModule = __webpack_module_cache__[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  var module = __webpack_module_cache__[moduleId] = {
    id: moduleId,
    exports: {}
  };
  if (!(moduleId in __webpack_modules__)) {
    delete __webpack_module_cache__[moduleId];
    var e = new Error("Cannot find module '" + moduleId + "'");
    e.code = "MODULE_NOT_FOUND";
    throw e;
  }
  __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
  return module.exports;
}

(() => {
  __webpack_require__.n = module => {
    var getter = module && module.__esModule ? () => module["default"] : () => module;
    __webpack_require__.d(getter, {
      a: getter
    });
    return getter;
  };
})();

(() => {
  __webpack_require__.d = (exports, definition) => {
    for (var key in definition) {
      if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
        Object.defineProperty(exports, key, {
          enumerable: true,
          get: definition[key]
        });
      }
    }
  };
})();

(() => {
  __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
})();

(() => {
  __webpack_require__.r = exports => {
    if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
      Object.defineProperty(exports, Symbol.toStringTag, {
        value: "Module"
      });
    }
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
  };
})();

var __webpack_exports__ = {};

(() => {
  /*!*****************************!*\
  !*** ./src/角色卡管理器/index.ts ***!
  \*****************************/
  __webpack_require__.r(__webpack_exports__);
  var vue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! vue */ "./node_modules/.pnpm/vue@3.5.35_typescript@6.0.0-dev.20250807/node_modules/vue/dist/vue.runtime.esm-bundler.js");
  var _App_vue__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./App.vue */ "./src/角色卡管理器/App.vue");
  const APP_NAME = "角色卡管理器";
  const HOST_ROOT_ID = "character-card-manager-host-root";
  const HOST_STYLE_ATTR = "data-character-card-manager-style";
  let managerApp;
  onScriptReady(() => {
    registerScriptButton();
    exposeOpenApi();
    listenForPanelMessages();
  });
  function onScriptReady(callback) {
    if (typeof $ === "function") {
      $(callback);
      return;
    }
    onReady(callback);
  }
  function onReady(callback) {
    const runOnce = once(callback);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runOnce, {
        once: true
      });
      window.setTimeout(runOnce, 0);
      return;
    }
    runOnce();
  }
  function once(callback) {
    let called = false;
    return () => {
      if (called) return;
      called = true;
      callback();
    };
  }
  function openManager() {
    const hostDocument = getHostDocument();
    closeManager();
    syncManagerStyles(hostDocument);
    const root = hostDocument.createElement("div");
    root.id = HOST_ROOT_ID;
    applyStyles(root, {
      position: "fixed",
      inset: "0",
      zIndex: "100000",
      boxSizing: "border-box",
      display: "block",
      padding: "0",
      background: "oklch(8% 0.01 248)"
    });
    hostDocument.body.appendChild(root);
    mountManager(root);
  }
  function closeManager() {
    managerApp?.unmount();
    managerApp = undefined;
    const hostDocument = getHostDocument();
    const root = hostDocument.getElementById(HOST_ROOT_ID);
    if (root) {
      root.remove();
    }
    removeSyncedManagerStyles(hostDocument);
  }
  function mountManager(root) {
    const mountPoint = getHostDocument().createElement("div");
    applyStyles(mountPoint, {
      width: "100vw",
      height: "100vh"
    });
    root.appendChild(mountPoint);
    managerApp = (0, vue__WEBPACK_IMPORTED_MODULE_0__.createApp)(_App_vue__WEBPACK_IMPORTED_MODULE_1__["default"]);
    managerApp.mount(mountPoint);
  }
  function syncManagerStyles(hostDocument) {
    if (document === hostDocument) return;
    for (const style of findManagerStyles(document)) {
      const id = getStyleSyncId(style);
      if (hostDocument.head.querySelector(`style[${HOST_STYLE_ATTR}="${cssEscape(id)}"]`)) continue;
      const syncedStyle = hostDocument.createElement("style");
      syncedStyle.type = style.type || "text/css";
      syncedStyle.textContent = style.textContent || "";
      syncedStyle.setAttribute(HOST_STYLE_ATTR, id);
      copyOptionalAttribute(style, syncedStyle, "media");
      copyOptionalAttribute(style, syncedStyle, "data-vue-ssr-id");
      hostDocument.head.appendChild(syncedStyle);
    }
  }
  function removeSyncedManagerStyles(hostDocument) {
    hostDocument.querySelectorAll(`style[${HOST_STYLE_ATTR}]`).forEach(style => style.remove());
  }
  function findManagerStyles(sourceDocument) {
    return Array.from(sourceDocument.querySelectorAll("style")).filter(style => isManagerStyle(style.textContent || ""));
  }
  function isManagerStyle(cssText) {
    return cssText.includes(".cm-shell") && cssText.includes("--cm-bg");
  }
  function getStyleSyncId(style) {
    return style.getAttribute("data-vue-ssr-id") || String(findManagerStyles(document).indexOf(style));
  }
  function copyOptionalAttribute(source, target, attribute) {
    const value = source.getAttribute(attribute);
    if (value) {
      target.setAttribute(attribute, value);
    }
  }
  function cssEscape(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return value.replace(/["\\]/g, "\\$&");
  }
  function registerScriptButton() {
    try {
      replaceScriptButtons([ {
        name: APP_NAME,
        visible: true
      } ]);
      eventOn(getButtonEvent(APP_NAME), openManager);
    } catch (error) {
      console.warn(`[${APP_NAME}] 注册脚本按钮失败`, error);
      getHelperWindow().toastr?.error?.("角色卡管理器按钮注册失败，请查看浏览器控制台。");
    }
  }
  function exposeOpenApi() {
    const hostWindow = getHostWindow();
    hostWindow.openCharacterCardManager = openManager;
    hostWindow.closeCharacterCardManager = closeManager;
    window.openCharacterCardManager = openManager;
    window.closeCharacterCardManager = closeManager;
  }
  function listenForPanelMessages() {
    const hostWindow = getHostWindow();
    hostWindow.addEventListener("message", event => {
      if (event.data?.source === "character-card-manager" && event.data?.type === "close") {
        closeManager();
      }
    });
  }
  function getHelperWindow() {
    const hostWindow = getHostWindow();
    const currentWindow = window;
    return currentWindow || hostWindow;
  }
  function getHostWindow() {
    try {
      if (window.parent && window.parent !== window) {
        return window.parent;
      }
    } catch {
      return window;
    }
    return window;
  }
  function getHostDocument() {
    return getHostWindow().document || document;
  }
  function applyStyles(element, styles) {
    Object.assign(element.style, styles);
  }
})();