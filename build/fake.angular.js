window.angular = (function () {
    'use strict';
    //Holds the registered modules.
    var modules = { },
        standard = createStandard();

    return {
        module: module,
        equals: equals,
        extend: extend
    };

    /**
    * Registers the module when 2 arguments are supplied, otherwise
    * returns the existing module.
    */
    function module(name) {
        var mod;
        if (arguments.length === 1) {
            return modules[name] || null;
        } else {
            if (modules[name]) {
                throw new Error('module named ' + name + ' already exists!');
            }
            mod = { };
            mod.factory = factory.bind(null, { });
            modules[name] = mod;
        }
    }

    /** Registers a factory. */
    function factory(values, name, def) {
        var inject, func, res;
        if (values[name]) {
            throw new Error('factory named "' + name + '" already exists!');
        } else {
            if (!Array.isArray(def)) {
                throw new Error('def MUST be an array. (Injection may only be done in the array styles)');
            }
            inject = def.slice(0, def.length - 1);
            func = def[def.length - 1];
            if (typeof func !== 'function') {
                throw new Error('last item in the definition array MUST be a function');
            }
            inject = inject.map(injectVal);
            res = func.apply(values, inject);

            //Store the result
            values[name] = res;
        }

        function injectVal(name) {
            if (values[name]) {
                return values[name];
            } else if (standard[name]) {
                return standard[name];
            } else {
                throw new Error('No factory named "' + name + '" found');
            }
        }

        throw new Error('not implemented');
    }

    /** Extends dest with the arguments following. */
    function extend(dest) {
        var dt, at, src, args, keys;
        if (arguments.length < 2) {
            return dest;
        }
        dt = getType(dest);
        if (dt) {
            src = arguments[1];
            at = getType(src);
            if (at) {
                keys = Object.keys(src);
                keys.forEach(copyVal);
            }
            args = Array.prototype.slice.call(arguments, 2);
            args.unshift(dest);
            return extend.apply({ }, args);
        }
        return dest;

        /** Copies the values from src to dest  */
        function copyVal(name) {
            var st = getType(src[name]),
                dt = getType(dest[name]);
            if (st && dt) {
                extend(dest[name], src[name]);
            } else {
                dest[name] = src[name];
            }
        }

        /** Gets the value type if it is a non null object or function */
        function getType(val) {
            var vt = typeof val;
            if (val && (vt === 'function' || vt === 'object')) {
                return vt;
            } else {
                return null;
            }
        }
    }

    /** Checks whether 2 values are equivalent */
    function equals(a, b) {
        var ak, bk, v1, v2, i;
        if (a === b) {
            //Numbers, boolean, undefined, null, strings, functions
            return true;
        }
        if (a && b && typeof a !== 'function' && typeof b !== 'function') {
            ak = Object.keys(a);
            bk = Object.keys(b);
            if (ak.length === bk.length) {
                ak.sort();
                bk.sort();
                for (i = 0; i < ak.length; i++) {
                    if (ak[i] !== bk[i]) {
                        return false;
                    }
                    v1 = a[ak[i]];
                    v2 = b[bk[i]];

                    return equals(v1, v2);
                }
                return true;
            }
        }
        return false;
    }

    function createStandard() {
        var stand = { };
        stand.$q = createQ();
        stand.$timeout = createTimeout();

        return stand;

        function createQ() {

            function $q(resolutionHandler) {
                var deferred = defer();
                return resolutionHandler(deferred.resolve, deferred.reject);
            }

            $q.defer = defer;
            $q.all = all;

            return $q;

            function defer() {
                var done = false,
                    thenHandler = [],
                    notifyHandler = [],
                    errorHandler = [],
                    finallyHandler = [],
                    res;
                res = {
                    resolve: function () {
                        if (!done) {
                            done = true;
                            thenHandler.forEach(executeHandler.bind(null, Array.prototype.slice.call(arguments)));
                            finallyHandler.forEach(executeHandler);
                        }
                    },
                    reject: function () {
                        if (!done) {
                            done = true;
                            errorHandler.forEach(executeHandler.bind(null, Array.prototype.slice.call(arguments)));
                            finallyHandler.forEach(executeHandler);
                        }
                    },
                    notify: function () {
                        notifyHandler.forEach(executeHandler.bind(null, Array.prototype.slice.call(arguments)));
                    },
                    promise: promise()
                };
                return res;

                function promise() {
                    return {
                        then: then,
                        catch: handleError,
                        finally: handleFinally
                    };

                    function then(handler, nhandler, ehandler) {
                        if (typeof handler !== 'function') {
                            throw new Error('handler MUST be a function');
                        }
                        thenHandler.push(handler);

                        if (typeof nhandler === 'function') {
                            notifyHandler.push(nhandler);
                        }
                        if (typeof ehandler === 'function') {
                            errorHandler.push(ehandler);
                        }
                    }

                    function handleError(handler) {
                        if (typeof handler !== 'function') {
                            throw new Error('handler MUST be a function');
                        }
                        errorHandler.push(handler);
                    }

                    function handleFinally(handler) {
                        if (typeof handler !== 'function') {
                            throw new Error('handler MUST be a function');
                        }
                        finallyHandler.push(handler);
                    }
                }

                function executeHandler(args, handler) {
                    handler.apply(res, args);
                }
            }

            function all(promises) {
                var res, deferred, cnt;
                if (!promises || typeof promises !== 'object') {
                    throw new Error('promises MUST be an object or an Array');
                }

                //Get the correct return type
                if (Array.isArray(promises)) {
                    res = [];
                } else {
                    res = { };
                }

                //Create the deferred to return
                deferred = $q.defer();

                //Get the number of promises to execute
                cnt = Object.keys(res).length;

                //Execute the promises
                Object.keys(promises).forEach(executePromise);

                //Return the promise;
                return deferred.promise;

                /** Ties up the promise then function to success and failuere functions */
                function executePromise(name) {
                    promises.then(success.bind(null, name), undefined, failure);
                }

                function success(name, result) {
                    cnt--;
                    res[name] = result;
                    if (!cnt) {
                        deferred.resolve(res);
                    }
                }

                function failure() {
                    //Reject the main promise
                    deferred.reject.apply(deferred, Array.prototype.slice.call(arguments));
                }
            }
        }

        function createTimeout() {

            var promises = [],
                deferreds = [];

            $timeout.cancel = cancel;

            return $timeout;

            function $timeout(fn, delay) {
                 //Note: This differs from slightly the angular API
                //  but for this project that is adequate.
                var idx, deferred = stand.$q.defer();
                deferred.then(fn);
                idx = deferreds.length;
                deferreds[idx] = deferred;
                promises[idx] = deferred.promise;
                setTimeout(function () {
                    deferreds.splice(idx, 1);
                    promises.splice(idx, 1);
                    deferred.resolve();
                }, delay);
                return deferred.promise;
            }

            function cancel(prom) {
                var idx = promises.indexOf(prom);
                if (idx > -1) {
                    deferreds[idx].reject('cancelled');
                    return true;
                } else {
                    return false;
                }
            }
        }
    }

}());