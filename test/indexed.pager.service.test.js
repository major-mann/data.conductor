describe('Indexed pager service', function () {

    var IndexedPagerService, ips, adapter, $rootScope, $q;

    beforeEach(module('dataConductor'));
    beforeEach(function () {
        inject(['$rootScope', '$q', 'jsdcIndexedPagerService', function (rs, q, IPS) {
            $q = q;
            $rootScope = rs;
            IndexedPagerService = IPS;
            ips = new IPS();
            ips.setBatching(true);
            adapter = {
                cnt: 123,
                count: function () {
                    var deferred = $q.defer();
                    deferred.resolve(this.cnt);
                    return deferred.promise;
                },
                find: function (filter, args) {
                    var deferred = $q.defer(),
                        res = [],
                        i;
                    for (i = args.skip; i < args.skip + args.limit; i++) {
                        res.push(i);
                    }
                    deferred.resolve(res);
                    return deferred.promise;
                }
            };
            ips.setAdapter(adapter, true);
        }]);
    });

    describe('lookups', function () {
        it('should contain a lookup property named "COUNT_MODE"', function () {
            expect(IndexedPagerService.COUNT_MODE).toEqual(jasmine.any(Object));
        });
    });

    describe('defaults', function () {
        it('should contain a string property named "DEFAULT_COUNT_MODE"', function () {
            expect(IndexedPagerService.DEFAULT_COUNT_MODE).toEqual(jasmine.any(String));
        });
        it('should contain a number property named "DEFAULT_PAD_LOW"', function () {
            expect(IndexedPagerService.DEFAULT_PAD_LOW).toEqual(jasmine.any(Number));
        });
        it('should contain a number property named "DEFAULT_PAD_HIGH"', function () {
            expect(IndexedPagerService.DEFAULT_PAD_HIGH).toEqual(jasmine.any(Number));
        });
        it('should contain a number property named "DEFAULT_MIN_PAGES"', function () {
            expect(IndexedPagerService.DEFAULT_MIN_PAGES).toEqual(jasmine.any(Number));
        });
        it('should contain a number property named "DEFAULT_MAX_PAGES"', function () {
            expect(IndexedPagerService.DEFAULT_MAX_PAGES).toEqual(jasmine.any(Number));
        });
    });

    describe('accessors', function () {
        describe('countMode', function () {
            it('should exist', function () {
                expect(ips.countMode).toEqual(jasmine.any(Function));
                expect(ips.setCountMode).toEqual(jasmine.any(Function));
            });
            it('should return the current countMode', function () {
                ips.setCountMode('none');
                expect(ips.countMode()).toBe('none');
                ips.setCountMode('adapter');
                expect(ips.countMode()).toBe('adapter');
                ips.setCountMode('fixed');
                expect(ips.countMode()).toBe('fixed');
                ips.setCountMode('detect');
                expect(ips.countMode()).toBe('detect');
            });
            it('should ensure only values in IndexedPagerService.COUNT_MODE may be used.', function () {
                expect(ips.setCountMode.bind(ips, 'foo')).toThrowError(/invalid/i);
                expect(ips.setCountMode.bind(ips, 'bar')).toThrowError(/invalid/i);
            });
        });
        describe('index', function () {
            it('should exist', function () {
                expect(ips.index).toEqual(jasmine.any(Function));
                expect(ips.setIndex).toEqual(jasmine.any(Function));
            });
            it('should return null when no index has been set', function () {
                expect(ips.index()).toBe(null);
            });
            it('should return the current index', function () {
                expect(ips.index()).toBe(null);
                ips.setIndex(0);
                expect(ips.index()).toBe(0);
                ips.setIndex(1);
                expect(ips.index()).toBe(1);
            });
            it('should return null after the clear function has been called', function () {
                expect(ips.index()).toBe(null);
                ips.setIndex(0);
                expect(ips.index()).toBe(0);
                ips.setIndex(1);
                expect(ips.index()).toBe(1);
                ips.clear();
                expect(ips.index()).toBe(null);
            });
            it('should load the index', function () {
                var loaded = false;
                ips.setIndex(0).then(done);
                $rootScope.$apply();
                expect(loaded).toBe(true);

                function done() {
                    var all;
                    loaded = true;
                    all = ips.pages();
                    expect(all.length).toBe(1);
                }
            });
            it('should load padLow() pages before the index', function () {
                ips.setPageSize(5);
                ips.setPadLow(3);
                ips.setIndex(3).then(done);
                $rootScope.$apply();
                function done(data) {
                    var pages;
                    expect(data.length).toBe(1);
                    expect(data[0].indexes.length).toBe(4);
                    expect(data[0].data.length).toBe(20);
                    expect(data[0].data[0]).toBe(0);
                    expect(data[0].data[19]).toBe(19);
                }
            });
            it('should load padHigh() pages after the index', function () {
                ips.setPageSize(5);
                ips.setPadHigh(3);
                ips.setIndex(0).then(done);
                $rootScope.$apply();
                function done(data) {
                    var pages;
                    expect(data.length).toBe(1);
                    expect(data[0].indexes.length).toBe(4);
                    expect(data[0].data.length).toBe(20);
                    expect(data[0].data[0]).toBe(0);
                    expect(data[0].data[19]).toBe(19);
                }
            });
            it('should return a promise that will be resolved with the index data', function () {
                ips.setPageSize(5);
                ips.setPadHigh(1);
                ips.setIndex(0).then(done);
                $rootScope.$apply();
                function done(data) {
                    var pages;
                    expect(data.length).toBe(1);
                    expect(data[0].indexes.length).toBe(2);
                    expect(data[0].data.length).toBe(10);
                    expect(data[0].data[0]).toBe(0);
                    expect(data[0].data[9]).toBe(9);
                }
            });

        });
        describe('pad', function () {
            it('should exist', function () {
                expect(ips.pad).toEqual(jasmine.any(Function));
                expect(ips.setPad).toEqual(jasmine.any(Function));
            });
            it('should return the lowest value of padLow and padHigh', function () {
                ips.setPadLow(5);
                ips.setPadHigh(3);
                expect(ips.pad()).toBe(3);
                ips.setPadLow(2);
                expect(ips.pad()).toBe(2);
            });
            it('should set padLow and padHigh to the supplied value', function () {
                ips.setPadLow(5);
                ips.setPadHigh(3);
                expect(ips.padLow()).toBe(5);
                expect(ips.padHigh()).toBe(3);
                ips.setPad(1);
                expect(ips.padLow()).toBe(1);
                expect(ips.padHigh()).toBe(1);
            });
        });
        describe('padLow', function () {
            it('should exist', function () {
                expect(ips.padLow).toEqual(jasmine.any(Function));
                expect(ips.setPadLow).toEqual(jasmine.any(Function));
            });
            it('should return the number of pages to load before the current index', function () {
                ips.setPadLow(1);
                expect(ips.padLow()).toBe(1);
                ips.setPadLow(12);
                expect(ips.padLow()).toBe(12);
            });
            it('should load the pages automatically when index when index is available', function () {
                var all;
                ips.setIndex(3);
                $rootScope.$apply();
                all = ips.pages();
                expect(all.length).toBe(1);
                ips.setPadLow(3);
                $rootScope.$apply();
                all = ips.pages();
                expect(all.length).toBe(4);
            });
        });
        describe('padHigh', function () {
            it('should exist', function () {
                expect(ips.padHigh).toEqual(jasmine.any(Function));
                expect(ips.setPadHigh).toEqual(jasmine.any(Function));
            });
            it('should return the number of pages to load after the current index', function () {
                ips.setPadHigh(1);
                expect(ips.padHigh()).toBe(1);
                ips.setPadHigh(12);
                expect(ips.padHigh()).toBe(12);
            });
            it('should load the pages automatically when index is available', function () {
                var all;
                ips.setIndex(0);
                $rootScope.$apply();
                all = ips.pages();
                expect(all.length).toBe(1);
                ips.setPadHigh(3);
                $rootScope.$apply();
                all = ips.pages();
                expect(all.length).toBe(4);
            });
        });
        describe('count', function () {
            it('should exist', function () {
                expect(ips.count).toEqual(jasmine.any(Function));
            });
            it('should return a promise that gets resolved with the count value', function () {
                var count, res = ips.count();
                expect(res).toEqual(jasmine.any(Object));
                expect(res.then).toEqual(jasmine.any(Function));
                res.then(gotCount);
                $rootScope.$apply();
                expect(count).toBe(adapter.cnt);

                function gotCount(cnt) {
                    count = cnt;
                }
            });
            it('should allow count to be set manually, and that value to be retrieved when countMode is "fixed" or "detect"', function() {
                var count;
                ips.setCountMode('fixed');
                ips.updateCount(1024);
                ips.count().then(gotCount);
                $rootScope.$apply();
                expect(count).toBe(1024);

                function gotCount(cnt) {
                    count = cnt;
                }
            });
            it('should call adapter.count(loader.filter()) when countMode is set to "adapter"', function () {
                var filt = { }, called;
                ips.setFilter(filt);
                ips.setCountMode('adapter');
                ips.count().then(count);
                $rootScope.$apply();
                expect(called).toBe(true);
                function count(cnt) {
                    called = true;
                }
            });
        });

        describe('convenience accessors', function () {
            it('should contain a function named "pageSize"', function () {
                expect(ips.pageSize).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "setPageSize"', function () {
                expect(ips.setPageSize).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "filter"', function () {
                expect(ips.filter).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "setFilter"', function () {
                expect(ips.setFilter).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "resizeMode"', function () {
                expect(ips.resizeMode).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "setResizeMode"', function () {
                expect(ips.setResizeMode).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "indexMode"', function () {
                expect(ips.indexMode).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "setIndexMode"', function () {
                expect(ips.setIndexMode).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "maxPages"', function () {
                expect(ips.maxPages).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "setMaxPages"', function () {
                expect(ips.setMaxPages).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "adapter"', function () {
                expect(ips.adapter).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "setAdapter"', function () {
                expect(ips.setAdapter).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "parallel"', function () {
                expect(ips.parallel).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "setParallel"', function () {
                expect(ips.setParallel).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "batching"', function () {
                expect(ips.batching).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "setBatching"', function () {
                expect(ips.setBatching).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "retryCount"', function () {
                expect(ips.retryCount).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "setRetryCount"', function () {
                expect(ips.setRetryCount).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "retryDelay"', function () {
                expect(ips.retryDelay).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "setRetryDelay"', function () {
                expect(ips.setRetryDelay).toEqual(jasmine.any(Function));
            });
        });
    });

    describe('functions', function () {
        describe('clear', function () {
            it('should exist', function () {
                expect(ips.clear).toEqual(jasmine.any(Function));
            });
            it('should remove all items cached items', function () {
                ips.setIndex(0);
                ips.setIndex(1);
                ips.setIndex(2);
                $rootScope.$apply();

                var all = ips.pages();
                expect(all.length).toBe(3);
                ips.clear();
                all = ips.pages();
                expect(all.length).toBe(0);
            });
        });

        describe('pages()', function () {
            it('should exist', function () {
                expect(ips.pages).toEqual(jasmine.any(Function));
            });
            it('should return an array containing all cached or loading pages', function () {
                var pages;

                ips.setPadHigh(1);
                ips.setIndex(0);
                pages = ips.pages();
                expect(pages.length).toBe(2);
                expect(pages[0].loading).toBe(true);
                expect(pages[0].data).toBe(null);
                expect(pages[1].loading).toBe(true);
                expect(pages[1].data).toBe(null);
                $rootScope.$apply();

                pages = ips.pages();
                expect(pages.length).toBe(2);
                expect(pages[0].loading).toBe(false);
                expect(pages[0].data).toEqual(jasmine.any(Array));
                expect(pages[1].loading).toBe(false);
                expect(pages[1].data).toEqual(jasmine.any(Array));
            });
            it('should return a cancel function which can be used to cancel the load', function () {
                //This will only wait until cancelled, it will never return any data.
                adapter.find = function (filter, args) {
                    var deferred = $q.defer();
                    args.cancel.then(deferred.reject.bind(deferred, 'cancel'));
                    return deferred.promise;
                };

                var pages;
                ips.setIndex(0);
                pages = ips.pages();
                expect(pages.length).toBe(1);
                expect(pages[0].loading).toBe(true);
                expect(pages[0].cancel).toEqual(jasmine.any(Function));
                pages[0].cancel();
                $rootScope.$apply();
                pages = ips.pages();
                expect(pages.length).toBe(0);
            });
            it('should return the page data', function () {
                var pages;
                ips.setPageSize(10);
                ips.setIndex(1);
                $rootScope.$apply();
                pages = ips.pages();
                expect(pages[0].data).toEqual(jasmine.any(Array));
                expect(pages[0].data.length).toBe(10);
                expect(pages[0].data[0]).toBe(10);
                expect(pages[0].data[9]).toBe(19);
            });
        });

        describe('convenience functions', function () {
            it('should contain a function named "remove"', function () {
                expect(ips.remove).toEqual(jasmine.any(Function));
            });
            it('should contain a function named "clear"', function () {
                expect(ips.clear).toEqual(jasmine.any(Function));
            });
        });
    });

});
