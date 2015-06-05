describe('loader service', function () {
    var $rootScope, $q, AdapterService, IndexedPageCache, LoaderService;
    beforeEach(module('dataConductor'));
    beforeEach(function () {
        inject(['$rootScope', '$q', 'jsdcAdapterService', 'jsdcIndexedPageCache', 'jsdcLoaderService', function (rs, q, AS, IPC, LS) {
            $rootScope = rs;
            $q = q;
            AdapterService = AS;
            IndexedPageCache = IPC;
            LoaderService = LS;
        }]);
    });
    describe('LoaderService', function () {
        describe('Lookups', function () {
            it('should contain an object property named "EXISTING_MODE"', function () {
                expect(LoaderService.EXISTING_MODE).toEqual(jasmine.any(Object));
                expect(LoaderService.EXISTING_MODE.replace).toBeDefined();
                expect(LoaderService.EXISTING_MODE.ignore).toBeDefined();
                expect(LoaderService.EXISTING_MODE.drop).toBeDefined();
            });
            it('should contain an object property named "EXECUTION_MODE"', function () {
                expect(LoaderService.EXECUTION_MODE).toEqual(jasmine.any(Object));
                expect(LoaderService.EXECUTION_MODE.instant).toBeDefined();
                expect(LoaderService.EXECUTION_MODE.delayed).toBeDefined();
            });
            it('should contain an object property named "BATCH_CANCEL_MODE"', function () {
                expect(LoaderService.BATCH_CANCEL_MODE).toEqual(jasmine.any(Object));
                expect(LoaderService.BATCH_CANCEL_MODE.all).toBeDefined();
                expect(LoaderService.BATCH_CANCEL_MODE.ignore).toBeDefined();
            });
        });
        describe('Defaults', function () {
            it('should contain a number property named "DEFAULT_PARALLEL"', function () {
                expect(LoaderService.DEFAULT_PARALLEL).toEqual(jasmine.any(Number));
            });
            it('should contain a boolean property named "DEFAULT_BATCHING"', function () {
                expect(LoaderService.DEFAULT_BATCHING).toEqual(jasmine.any(Boolean));
            });
            it('should contain a number property named "DEFAULT_RETRY_DELAY"', function () {
                expect(LoaderService.DEFAULT_RETRY_DELAY).toEqual(jasmine.any(Number));
            });
            it('should contain a number property named "DEFAULT_RETRY_COUNT"', function () {
                expect(LoaderService.DEFAULT_RETRY_COUNT).toEqual(jasmine.any(Number));
            });
            it('should contain a string property named "DEFAULT_EXISTING_MODE"', function () {
                expect(LoaderService.DEFAULT_EXISTING_MODE).toEqual(jasmine.any(String));
            });
            it('should contain a string property named "DEFAULT_EXECUTION_MODE"', function () {
                expect(LoaderService.DEFAULT_EXECUTION_MODE).toEqual(jasmine.any(String));
            });
            it('should contain a string property named "DEFAULT_BATCH_CANCEL_MODE"', function () {
                expect(LoaderService.DEFAULT_BATCH_CANCEL_MODE).toEqual(jasmine.any(String));
            });
        });
    });

    describe('accessors', function () {
        var ls;
        beforeEach(function () {
            AdapterService.global.clear();
            ls = new LoaderService();
        });

        describe('cache', function () {
            it('should exist', function () {
                expect(ls.cache).toEqual(jasmine.any(Function));
            });
            it('should return the cache for the loader', function () {
                expect(ls.cache() instanceof IndexedPageCache).toBe(true);
            });
        });
        describe('adapter', function () {
            it('should exist', function () {
                expect(ls.adapter).toEqual(jasmine.any(Function));
                expect(ls.setAdapter).toEqual(jasmine.any(Function));
            });
            it('should return the adapter name or adapter object as originally set', function () {
                var adapter = {
                    find: function () {}
                };
                AdapterService.global.add('test', adapter);
                ls.setAdapter('test');
                expect(ls.adapter()).toBe('test');
                ls.setAdapter(adapter);
                expect(ls.adapter()).toBe(adapter);
            });
            it('should use a supplied name to look the adapter up in the global AdapterService.global storage service', function () {
                var a1called = false, a2called = false,
                    adapter1 = {
                        find: function () {
                            a1called = true;
                            var deferred = $q.defer();
                            deferred.resolve([]);
                            return deferred.promise;
                        }
                    },
                    adapter2 = {
                        find: function () {
                            a2called = true;
                            var deferred = $q.defer();
                            deferred.resolve([]);
                            return deferred.promise;
                        }
                    };
                AdapterService.global.add('t1', adapter1);
                AdapterService.global.add('t2', adapter2);

                ls.setAdapter('t1');
                ls.load(0);
                $rootScope.$apply();
                expect(a1called).toBe(true);
                expect(a2called).toBe(false);

                a1called = false;
                ls.cache().clear();
                ls.setAdapter('t2');
                ls.load(0);
                $rootScope.$apply();
                expect(a1called).toBe(false);
                expect(a2called).toBe(true);
            });
            it('should only allow valid adapters, or valid global adapter names to be set', function () {
                expect(ls.setAdapter.bind(ls, { })).toThrowError(/invalid/i);
                expect(ls.setAdapter.bind(ls, 'foo bar')).toThrowError(/not found/i);
            });
        });
        describe('parallel', function () {
            it('should exist', function () {
                expect(ls.parallel).toEqual(jasmine.any(Function));
                expect(ls.setParallel).toEqual(jasmine.any(Function));
            });
            it('should return the number of parallel loads that can take place at any one time', function () {
                ls.setParallel(10);
                expect(ls.parallel()).toBe(10);
                ls.setParallel(1);
                expect(ls.parallel()).toBe(1);
                ls.setParallel(123);
                expect(ls.parallel()).toBe(123);
            });
            it('should ensure the supplied value is greater than or equal to 1', function () {
                expect(ls.setParallel.bind(ls, -1)).toThrowError(/greater.*equal.*1/i);
                expect(ls.setParallel.bind(ls, 0)).toThrowError(/greater.*equal.*1/i);
                expect(ls.setParallel.bind(ls, -123)).toThrowError(/greater.*equal.*1/i);
            });
        });
        describe('batching', function () {
            it('should exist', function () {
                expect(ls.batching).toEqual(jasmine.any(Function));
                expect(ls.setBatching).toEqual(jasmine.any(Function));
            });
            it('should return the current batching mode', function () {
                ls.setBatching(123);
                expect(ls.batching(123));
                ls.setBatching(true);
                expect(ls.batching(true));
                ls.setBatching(false);
                expect(ls.batching(false));
            });
        });
        describe('batchCancelMode', function () {
            it('should exist', function () {
                expect(ls.batchCancelMode).toEqual(jasmine.any(Function));
                expect(ls.setBatchCancelMode).toEqual(jasmine.any(Function));
            });
            it('should return the current batchCancelMode', function () {
                ls.setBatchCancelMode('all');
                expect(ls.batchCancelMode()).toBe('all');
                ls.setBatchCancelMode('ignore');
                expect(ls.batchCancelMode()).toBe('ignore');
            });
            it('should only allow values from LoaderService.BATCH_CANCEL_MODE to be used', function () {
                expect(ls.setBatchCancelMode.bind(ls, 'foo')).toThrowError(/valid/i);
                expect(ls.setBatchCancelMode.bind(ls, 'bar')).toThrowError(/valid/i);
            });
        });
        describe('executionMode', function () {
            it('should exist', function () {
                expect(ls.executionMode).toEqual(jasmine.any(Function));
                expect(ls.setExecutionMode).toEqual(jasmine.any(Function));
            });
            it('should return the current execution mode', function () {
                ls.setExecutionMode('instant');
                expect(ls.executionMode()).toBe('instant');
                ls.setExecutionMode('delayed');
                expect(ls.executionMode()).toBe('delayed');
            });
            it('should only allow values from LoaderService.EXECUTION_MODE to be used', function () {
                expect(ls.setExecutionMode.bind(ls, 'foo')).toThrowError(/valid/i);
                expect(ls.setExecutionMode.bind(ls, 'bar')).toThrowError(/valid/i);
            });
        });
        describe('existingMode', function () {
            it('should exist', function () {
                expect(ls.existingMode).toEqual(jasmine.any(Function));
                expect(ls.setExistingMode).toEqual(jasmine.any(Function));
            });
            it('should return the current existingMode', function () {
                ls.setExistingMode('replace');
                expect(ls.existingMode()).toBe('replace');
                ls.setExistingMode('ignore');
                expect(ls.existingMode()).toBe('ignore');
                ls.setExistingMode('drop');
                expect(ls.existingMode()).toBe('drop');
            });
            it('should only allow values from LoaderService.EXISTING_MODE to be used', function () {
                expect(ls.setExistingMode.bind(ls, 'foo')).toThrowError(/valid/i);
                expect(ls.setExistingMode.bind(ls, 'bar')).toThrowError(/valid/i);
            });
        });
        describe('retryDelay', function () {
            it('should exist', function () {
                expect(ls.retryDelay).toEqual(jasmine.any(Function));
                expect(ls.setRetryDelay).toEqual(jasmine.any(Function));
            });
            it('should return the current retry delay', function () {
                ls.setRetryDelay(1000);
                expect(ls.retryDelay()).toBe(1000);
                ls.setRetryDelay(1);
                expect(ls.retryDelay()).toBe(1);
                ls.setRetryDelay(0);
                expect(ls.retryDelay()).toBe(0);
            });
            it('should only allow values greater than or equal to 0', function () {
                expect(ls.setRetryDelay.bind(ls, -1)).toThrowError(/greater.*0/i);
                expect(ls.setRetryDelay.bind(ls, -123)).toThrowError(/greater.*0/i);
            });
        });
        describe('retryCount', function () {
            it('should exist', function () {
                expect(ls.retryCount).toEqual(jasmine.any(Function));
                expect(ls.setRetryCount).toEqual(jasmine.any(Function));
            });
            it('should return the number of times to retry before failing', function () {
                ls.setRetryCount(123);
                expect(ls.retryCount()).toBe(123);
                ls.setRetryCount(1);
                expect(ls.retryCount()).toBe(1);
                ls.setRetryCount(456);
                expect(ls.retryCount()).toBe(456);
                ls.setRetryCount(0);
                expect(ls.retryCount()).toBe(0);
            });
            it('should only allow values greater than or equal to 0', function () {
                expect(ls.setRetryCount.bind(ls, -1)).toThrowError(/greater.*0/i);
                expect(ls.setRetryCount.bind(ls, -123)).toThrowError(/greater.*0/i);
            });
        });
    });

    describe('functions', function () {
        var ls, adapter;
        beforeEach(function () {
            AdapterService.global.clear();
            ls = new LoaderService();

            adapter = {
                findHandler: function (skip, limit, cancel, deferred) {
                    deferred.resolve([]);
                },
                find: function (filter, args) {
                    var deferred = $q.defer();
                    adapter.findHandler(args.skip, args.limit, args.cancel, deferred);
                    return deferred.promise;
                }
            };

            ls.setAdapter(adapter);
            ls.setBatching(true);
        });

        describe('load(index, [cancel])', function () {
            it('should exist', function () {
                expect(ls.load).toEqual(jasmine.any(Function));
            });
            it('should ensure index is a number', function () {
                expect(ls.load.bind(ls, 'foo')).toThrowError(/number/i);
                expect(ls.load.bind(ls, { })).toThrowError(/number/i);
            });
            it('should ensure cancel is a promise when supplied', function () {
                expect(ls.load.bind(ls, 0, {})).toThrowError(/promise/i);
                expect(ls.load.bind(ls, 0, 'foo bar')).toThrowError(/promise/i);
                expect(ls.load.bind(ls, 0, $q.defer().promise)).not.toThrow();
            });
            it('should queue an index to be loaded', function () {
                ls.setExecutionMode('delayed');
                ls.load(0);
                ls.load(1);

                var info = ls.info();

                expect(info.length).toBe(2);
                expect(info[0].index).toBe(0);
                expect(!!info[0].queued).toBe(true);
                expect(info[1].index).toBe(1);
                expect(!!info[1].queued).toBe(true);
            });
            it('should cancel the load command if a promise is passed to cancel, and it is resolved before the load is complete', function () {
                var info, c1 = $q.defer(), c2 = $q.defer();
                ls.setExecutionMode('delayed');
                ls.load(0, c1.promise);
                ls.load(1, c2.promise);

                info = ls.info();
                expect(info.length).toBe(2);
                expect(info[0].index).toBe(0);
                expect(!!info[0].queued).toBe(true);
                expect(info[1].index).toBe(1);
                expect(!!info[1].queued).toBe(true);

                c1.resolve();
                $rootScope.$apply();
                info = ls.info();
                expect(info.length).toBe(1);
                expect(info[0].index).toBe(1);
                expect(!!info[0].queued).toBe(true);

                c2.resolve();
                $rootScope.$apply();
                info = ls.info();
                expect(info.length).toBe(0);
            });
            it('should do nothing if a promise is passed to cancel, and it is resolved after the load is complete', function () {
                var c1 = $q.defer();
                ls.load(0);
                $rootScope.$apply();
                //This should load instantly.
                expect(ls.info().length).toBe(1);
                c1.resolve();
                $rootScope.$apply();
                expect(ls.info().length).toBe(1);
                //We just expect no error
            });
            it('should return a promise which will be resolved on succesful load', function () {
                var promise, completeCalled;
                ls.setExecutionMode('delayed');
                promise = ls.load(0);
                completeCalled = false;
                promise.then(complete);
                ls.execute();
                function complete() {
                    completeCalled = true;
                }
            });
            it('should return a promise which will be rejected on error', function () {
                var promise, errcalled;
                adapter.findHandler = function (skip, limit, cancel, deferred) {
                    deferred.reject('test error');
                };
                ls.setExecutionMode('delayed');
                promise = ls.load(0);
                errcalled = false;
                promise.catch(err);

                ls.execute();
                $rootScope.$apply();
                expect(errcalled).toBe(true);

                function err(e) {
                    expect(e).toBe('test error');
                    errcalled = true;
                }

            });
            it('should cache the loaded data on succesful load', function () {
                var data = [1, 2, 3], data2, cache;
                adapter.findHandler = function (skip, limit, cancel, deferred) {
                    deferred.resolve(data);
                };
                ls.load(0);
                $rootScope.$apply();
                cache = ls.cache();
                expect(cache.count()).toBe(1);
                data2 = cache.data(0);
                expect(data2.length).toBe(3);
                expect(data2[0]).toBe(1);
                expect(data2[1]).toBe(2);
                expect(data2[2]).toBe(3);
            });
            it('should return the existing cached data when existingMode is set to "drop" and the index is already cached', function () {
                var data1 = [1], data2 = [2],
                    data = [data1, data2],
                    cnt = 0,
                    cache;
                adapter.findHandler = function (skip, limit, cancel, deferred) {
                    deferred.resolve(data[cnt]);
                    cnt = (cnt + 1) % 2;
                };
                ls.setExistingMode('drop');
                ls.load(0);
                $rootScope.$apply();
                cache = ls.cache();
                expect(cache.count()).toBe(1);
                expect(cache.data(0)[0]).toBe(1);
                ls.load(0);
                expect(cache.count()).toBe(1);
                expect(cache.data(0)[0]).toBe(1);
            });
        });
        describe('info([index])', function () {
            it('should exist', function () {
                expect(ls.info).toEqual(jasmine.any(Function));
            });
            describe('info(index)', function () {
                it('should return whether the specified index is cached', function () {
                    ls.load(0);
                    ls.load(2);
                    $rootScope.$apply();

                    var info = ls.info(0);
                    expect(!!info.cached).toBe(true);

                    info = ls.info(1);
                    expect(info).toEqual(jasmine.any(Object));
                    expect(info.index).toBe(1);
                    expect(!!info.cached).toBe(false);
                    expect(!!info.loading).toBe(false);
                    expect(!!info.queued).toBe(false);
                    expect(!!info.waiting).toBe(false);

                    info = ls.info(2);
                    expect(!!info.cached).toBe(true);
                });
                it('should return whether the specified is loading', function () {
                    var def, info;
                    adapter.findHandler = function (skip, limit, cancel, deferred) {
                        def = deferred;
                    };
                    ls.load(0);
                    info = ls.info(0);
                    expect(!!info.cached).toBe(false);
                    expect(!!info.loading).toBe(true);
                    def.resolve([]);
                    $rootScope.$apply();
                    info = ls.info(0);
                    expect(!!info.cached).toBe(true);
                    expect(!!info.loading).toBe(false);
                });
                it('should return whether the specified is queued', function () {
                    ls.setExecutionMode('delayed');
                    ls.load(0);
                    var info = ls.info(0);
                    expect(!!info.cached).toBe(false);
                    expect(!!info.queued).toBe(true);
                });
            });
            describe('info()', function () {
                it('should return information for every index contained within the loader (cached, loading, queued and waiting)', function () {
                    ls.load(0);
                    ls.load(2);
                    ls.load(4);

                    var info = ls.info();
                    expect(info.length).toBe(3);
                    expect(info[0].index).toBe(0);
                    expect(info[1].index).toBe(2);
                    expect(info[2].index).toBe(4);
                });
            });
        });
        describe('batchBreak()', function () {
            it('should exist', function () {
                expect(ls.batchBreak).toEqual(jasmine.any(Function));
            });
            it('should insert a break which prevents batching into the queue', function () {
                var cnt = 0;
                ls.setExecutionMode('delayed');
                adapter.findHandler = function (skip, limit, cancel, deferred) {
                    deferred.resolve([]);
                    cnt++;
                };

                ls.load(0);
                ls.load(1);
                ls.execute();
                $rootScope.$apply();
                expect(cnt).toBe(1);

                ls.load(2);
                ls.batchBreak();
                ls.load(3);
                ls.execute();
                $rootScope.$apply();
                expect(cnt).toBe(3);
            });
        });
        describe('execute([single])', function () {
            it('should exist', function () {
                expect(ls.execute).toEqual(jasmine.any(Function));
            });
            it('should execute the load commands on the queue', function () {
                var l1, l2, cnt = 0;
                ls.setExecutionMode('delayed');

                l1 = ls.load(0);
                l2 = ls.load(1);

                l1.then(loaded);
                l2.then(loaded);
                expect(cnt).toBe(0);
                ls.execute();
                $rootScope.$apply();
                expect(cnt).toBe(2);

                function loaded() {
                    cnt++;
                }
            });
            it('should execute the first command on the queue when single is truthy', function () {
                var cnt = 0;
                ls.setExecutionMode('delayed');

                ls.load(0);
                ls.load(1);

                ls.load(3);
                ls.load(4);

                expect(cnt).toBe(0);
                ls.execute(true)
                    .then(loaded);
                $rootScope.$apply();
                expect(cnt).toBe(1);

                ls.execute(true)
                    .then(loaded);
                $rootScope.$apply();
                expect(cnt).toBe(2);

                function loaded() {
                    cnt++;
                }
            });
            it('should execute the load all the commands on the queue when single is falsy', function () {
                var l1, l2, l3, l4, cnt = 0;
                ls.setExecutionMode('delayed');

                l1 = ls.load(0);
                l2 = ls.load(1);

                l3 = ls.load(3);
                l4 = ls.load(4);

                l1.then(loaded);
                l2.then(loaded);
                $rootScope.$apply();
                expect(cnt).toBe(0);
                ls.execute(false);
                $rootScope.$apply();
                expect(cnt).toBe(2);

                function loaded() {
                    cnt++;
                }
            });
            it('should execute the load commands in parallel according to the parallel setting', function () {
                var def1, def2;
                ls.setParallel(1);
                ls.setExecutionMode('delayed');
                adapter.findHandler = function (skip, limit, cancel, deferred) {
                    if (!def1) {
                        def1 = deferred;
                    } else {
                        def2 = deferred;
                    }
                };
                ls.load(0);
                ls.load(1);

                ls.load(3);
                ls.load(4);

                ls.execute();
                $rootScope.$apply();
                expect(def1).toBeDefined();
                expect(def2).not.toBeDefined();

                def1.resolve([]);
                $rootScope.$apply();
                expect(def2).toBeDefined();
                def2.resolve([]);
                $rootScope.$apply();

                ls.setParallel(2);
                def1 = undefined;
                def2 = undefined;

                ls.load(6);
                ls.load(7);

                ls.load(9);
                ls.load(10);

                ls.execute();
                $rootScope.$apply();
                expect(def1).toBeDefined();
                expect(def2).toBeDefined();
            });
            it('should return a promise that includes all data that was requested and returned during the execution process', function () {
                var thenCalled = false,
                    cnt = 0,
                    promise,
                    l1, l2, l3, l4;
                ls.setExecutionMode('delayed');

                adapter.findHandler = function (skip, limit, cancel, deferred) {
                    deferred.resolve([cnt]);
                    cnt++;
                };

                l1 = ls.load(0);
                l2 = ls.load(1);

                l3 = ls.load(3);
                l4 = ls.load(4);

                promise = ls.execute(false);
                promise.then(complete);
                $rootScope.$apply();

                expect(thenCalled).toBe(true);

                function complete(data) {
                    thenCalled = true;
                    expect(data.length).toBe(2);
                    expect(data[0].data.length).toBe(1);
                    expect(data[1].data.length).toBe(1);

                    expect(data[0].data[0]).toBe(0);
                    expect(data[1].data[0]).toBe(1);
                }
            });
        });
    });
});
