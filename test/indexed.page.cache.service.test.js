//todo: insert record test
//todo: delete record test

describe('IndexedPageCache', function () {

    var IndexedPageCache, ipc;

    beforeEach(module('dataConductor'));
    beforeEach(function () {
        inject(['jsdcIndexedPageCache', function (IPC) {
            IndexedPageCache = IPC;
            ipc = new IPC();
            ipc.setResizeMode('maintain');
        }]);
    });

    describe('type', function () {
        describe('constants', function () {
            describe('PURGE_MODE', function () {
                it('should be an object', function () {
                    expect(IndexedPageCache.PURGE_MODE).toEqual(jasmine.any(Object));
                });
                it('should contain a string property named "stored"', function () {
                    expect(IndexedPageCache.PURGE_MODE.stored).toEqual(jasmine.any(String));
                });
                it('should contain a string property named "modified"', function () {
                    expect(IndexedPageCache.PURGE_MODE.modified).toEqual(jasmine.any(String));
                });
                it('should contain a string property named "touched"', function () {
                    expect(IndexedPageCache.PURGE_MODE.touched).toEqual(jasmine.any(String));
                });
            });
            describe('RESIZE_MODE', function () {
                it('should be an object', function () {
                    expect(IndexedPageCache.RESIZE_MODE).toEqual(jasmine.any(Object));
                });
                it('should contain a string property named "clear"', function () {
                    expect(IndexedPageCache.RESIZE_MODE.clear).toEqual(jasmine.any(String));
                });
                it('should contain a string property named "maintain"', function () {
                    expect(IndexedPageCache.RESIZE_MODE.maintain).toEqual(jasmine.any(String));
                });
            });
            describe('INDEX_MODE', function () {
                it('should be an object', function () {
                    expect(IndexedPageCache.INDEX_MODE).toEqual(jasmine.any(Object));
                });
                it('should contain a string property named "positive"', function () {
                    expect(IndexedPageCache.INDEX_MODE.positive).toEqual(jasmine.any(String));
                });
                it('should contain a string property named "full"', function () {
                    expect(IndexedPageCache.INDEX_MODE.full).toEqual(jasmine.any(String));
                });
            });
            describe('Defaults', function () {
                it('should contain a number named "DEFAULT_MAX_ITEMS"', function () {
                    expect(IndexedPageCache.DEFAULT_MAX_ITEMS).toEqual(jasmine.any(Number));
                });
                it('should contain a number named "DEFAULT_PAGE_SIZE"', function () {
                    expect(IndexedPageCache.DEFAULT_PAGE_SIZE).toEqual(jasmine.any(Number));
                });
                it('should contain a string named "DEFAULT_PURGE_MODE" which has a value contained in "PURGE_MODE"', function () {
                    expect(Object.keys(IndexedPageCache.PURGE_MODE).indexOf(IndexedPageCache.DEFAULT_PURGE_MODE) > -1).toBe(true);
                });
                it('should contain a string named "DEFAULT_INDEX_MODE" which has a value contained in "INDEX_MODE"', function () {
                    expect(Object.keys(IndexedPageCache.INDEX_MODE).indexOf(IndexedPageCache.DEFAULT_INDEX_MODE) > -1).toBe(true);
                });
                it('should contain a string named "DEFAULT_RESIZE_MODE" which has a value contained in "RESIZE_MODE"', function () {
                    expect(Object.keys(IndexedPageCache.RESIZE_MODE).indexOf(IndexedPageCache.DEFAULT_RESIZE_MODE) > -1).toBe(true);
                });
            });
        });
    });

    describe('accessors', function () {
        describe('resizeMode', function () {
            it('should contain a getter function named "resizeMode"', function () {
                expect(ipc.resizeMode).toEqual(jasmine.any(Function));
            });
            it('should contain a setter function named "setResizeMode"', function () {
                expect(ipc.setResizeMode).toEqual(jasmine.any(Function));
            });
            it('should return the current resizeMode', function () {
                ipc.setResizeMode('clear');
                expect(ipc.resizeMode()).toBe('clear');
                ipc.setResizeMode('maintain');
                expect(ipc.resizeMode()).toBe('maintain');
            });
            it('should only allow values defined in "RESIZE_MODE" to be supplied', function () {
                expect(ipc.setResizeMode.bind(ipc, 'foo')).toThrowError(/invalid/i);
                expect(ipc.setResizeMode.bind(ipc, 'bar')).toThrowError(/invalid/i);
                expect(ipc.setResizeMode.bind(ipc, 'clear')).not.toThrow();
                expect(ipc.setResizeMode.bind(ipc, 'maintain')).not.toThrow();
            });
        });
        describe('purgeMode', function () {
            it('should contain a getter function named "purgeMode"', function () {
                expect(ipc.purgeMode).toEqual(jasmine.any(Function));
            });
            it('should contain a setter function named "setPurgeMode"', function () {
                expect(ipc.setPurgeMode).toEqual(jasmine.any(Function));
            });
            it('should return the current purgeMode', function () {
                ipc.setPurgeMode('touched');
                expect(ipc.purgeMode()).toBe('touched');
                ipc.setPurgeMode('stored');
                expect(ipc.purgeMode()).toBe('stored');
                ipc.setPurgeMode('modified');
                expect(ipc.purgeMode()).toBe('modified');
            });
            it('should only allow values defined in "PURGE_MODE" to be supplied', function () {
                expect(ipc.setPurgeMode.bind(ipc, 'foo')).toThrowError(/invalid/i);
                expect(ipc.setPurgeMode.bind(ipc, 'bar')).toThrowError(/invalid/i);
                expect(ipc.setPurgeMode.bind(ipc, 'touched')).not.toThrow();
                expect(ipc.setPurgeMode.bind(ipc, 'stored')).not.toThrow();
                expect(ipc.setPurgeMode.bind(ipc, 'modified')).not.toThrow();
            });
        });
        describe('indexMode', function () {
            it('should contain a getter function named "indexMode"', function () {
                expect(ipc.indexMode).toEqual(jasmine.any(Function));
            });
            it('should contain a setter function named "setIndexMode"', function () {
                expect(ipc.setIndexMode).toEqual(jasmine.any(Function));
            });
            it('should return the current indexMode', function () {
                ipc.setIndexMode('full');
                expect(ipc.indexMode()).toBe('full');
                ipc.setIndexMode('positive');
                expect(ipc.indexMode()).toBe('positive');
            });
            it('should only allow values defined in "INDEX_MODE" to be supplied', function () {
                expect(ipc.setIndexMode.bind(ipc, 'foo')).toThrowError(/invalid/i);
                expect(ipc.setIndexMode.bind(ipc, 'bar')).toThrowError(/invalid/i);
                expect(ipc.setIndexMode.bind(ipc, 'full')).not.toThrow();
                expect(ipc.setIndexMode.bind(ipc, 'positive')).not.toThrow();
            });
            it('should remove any negative entries that exist when the indexMode is changed from "full" to "positive"', function () {
                var all;
                ipc.setIndexMode('full');
                ipc.cache(-1, []);
                ipc.cache(0, []);
                ipc.cache(1, []);
                all = ipc.cached();

                expect(all.length).toBe(3);
                expect(all[0].index).toBe(-1);
                expect(all[1].index).toBe(0);
                expect(all[2].index).toBe(1);

                ipc.setIndexMode('positive');
                all = ipc.cached();
                expect(all.length).toBe(2);
                expect(all[0].index).toBe(0);
                expect(all[1].index).toBe(1);

                ipc.setIndexMode('full');
                all = ipc.cached();
                expect(all.length).toBe(2);
                expect(all[0].index).toBe(0);
                expect(all[1].index).toBe(1);
            });
        });
        describe('maxItems', function () {
            it('should contain a getter function named "indexMode"', function () {
                expect(ipc.indexMode).toEqual(jasmine.any(Function));
            });
            it('should contain a setter function named "setIndexMode"', function () {
                expect(ipc.setIndexMode).toEqual(jasmine.any(Function));
            });
            it('should return the current maximum number of cached items', function () {
                ipc.setMaxItems(100);
                expect(ipc.maxItems()).toBe(100);
                ipc.setMaxItems(1024);
                expect(ipc.maxItems()).toBe(1024);
                ipc.setMaxItems(124.3);
                expect(ipc.maxItems()).toBe(124);
            });
            it('should ensure max items is a number larger than 0', function () {
                expect(ipc.setMaxItems.bind(ipc, 0)).toThrowError(/greater/i);
                expect(ipc.setMaxItems.bind(ipc, -1)).toThrowError(/greater/i);
                expect(ipc.setMaxItems.bind(ipc, 1)).not.toThrow();
            });
            it('should purge items items according to the PURGE_MODE when maxItems is changed to less than the current count', function (done) {

                //Tests stored purge
                //Then modified purge
                //The touch purged.
                // Stored and modified are done with timeouts to enable date time differences to be observed

                ipc.setMaxItems(100);

                setTimeout(cachePage.bind(null, 0), 50);
                setTimeout(cachePage.bind(null, 1), 100);
                setTimeout(cachePage.bind(null, 2), 150);
                setTimeout(cachePage.bind(null, 3), 200);
                setTimeout(cachePage.bind(null, 4), 250);
                setTimeout(storedCheck, 300);

                function storedCheck() {
                    var all = ipc.cached();
                    expect(all.length).toBe(5);
                    expect(all[0].index).toBe(0);
                    expect(all[1].index).toBe(1);
                    expect(all[2].index).toBe(2);
                    expect(all[3].index).toBe(3);
                    expect(all[4].index).toBe(4);

                    ipc.setPurgeMode('stored');
                    ipc.setMaxItems(3);
                    all = ipc.cached();
                    expect(all.length).toBe(3);
                    expect(all[0].index).toBe(2);
                    expect(all[1].index).toBe(3);
                    expect(all[2].index).toBe(4);

                    modifiedTest();
                }

                function modifiedTest() {
                    ipc.setMaxItems(100);
                    ipc.clear();
                    ipc.cache(0, []);
                    ipc.cache(1, []);
                    ipc.cache(2, []);
                    ipc.cache(3, []);
                    ipc.cache(4, []);

                    setTimeout(cachePage.bind(null, 0), 50);
                    setTimeout(cachePage.bind(null, 2), 100);
                    setTimeout(cachePage.bind(null, 4), 150);
                    setTimeout(cachePage.bind(null, 1), 200);
                    setTimeout(cachePage.bind(null, 3), 250);
                    setTimeout(modifiedCheck, 300);
                }

                function modifiedCheck() {
                    var all = ipc.cached();
                    expect(all.length).toBe(5);
                    expect(all[0].index).toBe(0);
                    expect(all[1].index).toBe(1);
                    expect(all[2].index).toBe(2);
                    expect(all[3].index).toBe(3);
                    expect(all[4].index).toBe(4);

                    ipc.setPurgeMode('modified');
                    ipc.setMaxItems(3);
                    all = ipc.cached();
                    expect(all.length).toBe(3);
                    expect(all[0].index).toBe(1);
                    expect(all[1].index).toBe(3);
                    expect(all[2].index).toBe(4);

                    touchedTest();
                }

                function touchedTest() {
                    var all;
                    ipc.setMaxItems(100);
                    ipc.clear();
                    ipc.cache(0, []);
                    ipc.cache(1, []);
                    ipc.cache(2, []);
                    ipc.cache(3, []);
                    ipc.cache(4, []);

                    ipc.touch(1);
                    ipc.touch(2);
                    ipc.touch(3);
                    ipc.touch(3);

                    ipc.setPurgeMode('touched');
                    ipc.setMaxItems(3);
                    all = ipc.cached();
                    expect(all.length).toBe(3);
                    expect(all[0].index).toBe(1);
                    expect(all[1].index).toBe(2);
                    expect(all[2].index).toBe(3);

                    done();
                }

                
                function cachePage(index) {
                    ipc.cache(index, []);
                }
            });
        });
        describe('pageSize', function () {
            it('should contain a getter function named "pageSize"', function () {
                expect(ipc.pageSize).toEqual(jasmine.any(Function));
            });
            it('should contain a setter function named "setPageSize"', function () {
                expect(ipc.setPageSize).toEqual(jasmine.any(Function));
            });
            it('should return the current page size', function () {
                ipc.setPageSize(100);
                expect(ipc.pageSize()).toBe(100);
                ipc.setPageSize(200);
                expect(ipc.pageSize()).toBe(200);
                ipc.setPageSize(123.321);
                expect(ipc.pageSize()).toBe(123);
            });
            it('should ensure page size is a positive number', function () {
                expect(ipc.setPageSize.bind(ipc, -100)).toThrowError(/positive/i);
                expect(ipc.setPageSize.bind(ipc, -1)).toThrowError(/positive/i);
                expect(ipc.setPageSize.bind(ipc, 0)).toThrowError(/positive/i);
            });
            it('should maintain currently cached items when the pages are resized', function () {
                var all;
                ipc.setPageSize(4);

                ipc.cache(0, [0, 1, 2, 3]);
                ipc.cache(1, [4, 5, 6, 7]);
                ipc.cache(2, [8, 9, 10, 11]);

                ipc.setPageSize(3);
                all = ipc.cached();

                expect(all.length).toBe(4);

                expect(all[0].data.length).toBe(3);
                expect(all[0].data[0]).toBe(0);
                expect(all[0].data[1]).toBe(1);
                expect(all[0].data[2]).toBe(2);

                expect(all[1].data.length).toBe(3);
                expect(all[1].data[0]).toBe(3);
                expect(all[1].data[1]).toBe(4);
                expect(all[1].data[2]).toBe(5);

                expect(all[2].data.length).toBe(3);
                expect(all[2].data[0]).toBe(6);
                expect(all[2].data[1]).toBe(7);
                expect(all[2].data[2]).toBe(8);

                expect(all[3].data.length).toBe(3);
                expect(all[3].data[0]).toBe(9);
                expect(all[3].data[1]).toBe(10);
                expect(all[3].data[2]).toBe(11);

                ipc.clear();
                ipc.setPageSize(3);

                ipc.cache(1, [1, 2, 3]);
                ipc.cache(2, [4, 5, 6]);
                ipc.cache(3, [7, 8, 9]);
                ipc.cache(4, [10, 11, 12]);
                ipc.cache(5, [13, 14, 15]);

                ipc.setPageSize(5);
                all = ipc.cached();
                expect(all.length).toBe(2);

                expect(all[0].index).toBe(1);
                expect(all[1].index).toBe(2);

                expect(all[0].data.length).toBe(5);
                expect(all[1].data.length).toBe(5);

                expect(all[0].data[0]).toBe(3);
                expect(all[0].data[1]).toBe(4);
                expect(all[0].data[2]).toBe(5);
                expect(all[0].data[3]).toBe(6);
                expect(all[0].data[4]).toBe(7);

                expect(all[1].data[0]).toBe(8);
                expect(all[1].data[1]).toBe(9);
                expect(all[1].data[2]).toBe(10);
                expect(all[1].data[3]).toBe(11);
                expect(all[1].data[4]).toBe(12);

                //TODO: Test manipulation of negative indexes

            });
            it('should purge additional items when the page size is decreased and there are too many pages after resize', function () {
                var all;
                ipc.setPageSize(5);
                ipc.setMaxItems(4);
                ipc.setPurgeMode('touched');

                ipc.cache(0, [0, 1, 2, 3, 4]);
                ipc.cache(1, [5, 6, 7, 8, 9]);
                ipc.cache(2, [10, 11, 12, 13, 14]);

                ipc.touch(1);
                ipc.touch(2);

                ipc.setPageSize(3);
                all = ipc.cached();
                expect(all.length).toBe(4);
                expect(all[0].index).toBe(1);
                expect(all[1].index).toBe(2);
                expect(all[2].index).toBe(3);
                expect(all[3].index).toBe(4);
            });
        });
    });

    describe('functions', function () {
        describe('cache(index, item)', function () {
            it('should exist', function () {
                expect(ipc.cache).toEqual(jasmine.any(Function));
            });
            it('should ensure index is a number', function () {
                expect(ipc.cache.bind(ipc, 'foo bar', [])).toThrowError(/number/i);
                expect(ipc.cache.bind(ipc, 123, [])).not.toThrow();
            });
            it('should ensure item is an array', function () {
                expect(ipc.cache.bind(ipc, 0, 'foo bar')).toThrowError(/array/i);
                expect(ipc.cache.bind(ipc, 0, [])).not.toThrow();
            });
            it('should add an entry to the cache when none exists for the specified index', function () {
                var all;
                ipc.cache(0, []);
                all = ipc.cached();
                expect(all.length).toBe(1);
                expect(all[0].index).toBe(0);
            });
            it('should increment touched and update modified and data when an entry already exists for the index', function (done) {
                var all, modi;
                ipc.cache(0, []);
                all = ipc.cached();
                expect(all.length).toBe(1);
                expect(all[0].touched).toBe(1);
                modi = all[0].modified;

                setTimeout(function () {

                    ipc.cache(0, []);
                    all = ipc.cached();
                    expect(all.length).toBe(1);
                    expect(all[0].touched).toBe(2);
                    expect(all[0].modified).toBeGreaterThan(modi);
                    done();

                }, 50);
            });
            it('should purge items items according to the PURGE_MODE when they are added and the count exceeds maxItems', function () {
                var all;
                ipc.setPageSize(5);
                ipc.setMaxItems(2);
                ipc.setPurgeMode('touched');

                ipc.cache(0, [0, 1, 2, 3, 4]);
                ipc.cache(1, [5, 6, 7, 8, 9]);
                ipc.touch(1);
                ipc.cache(2, [10, 11, 12, 13, 14]);

                all = ipc.cached();

                expect(all.length).toBe(2);
                expect(all[0].index).toBe(1);
                expect(all[1].index).toBe(2);
            });
        });
        describe('uncache(index)', function () {
            it('should exist', function () {
                expect(ipc.uncache).toEqual(jasmine.any(Function));
            });
            it('should remove an entry from the cache', function () {
                var all;
                ipc.cache(0, []);
                ipc.cache(1, []);
                ipc.cache(2, []);

                all = ipc.cached();
                expect(all.length).toBe(3);
                expect(all[0].index).toBe(0);
                expect(all[1].index).toBe(1);
                expect(all[2].index).toBe(2);

                ipc.uncache(1);
                all = ipc.cached();
                expect(all.length).toBe(2);
                expect(all[0].index).toBe(0);
                expect(all[1].index).toBe(2);
            });
            it('should return the removed data', function () {
                var data = [1, 2, 3];
                ipc.cache(0, data);
                expect(ipc.uncache(0)).toBe(data);
            });
        });
        describe('touch(index)', function () {
            it('should exist', function () {
                expect(ipc.touch).toEqual(jasmine.any(Function));
            });
            it('should increment touched for the entry representing the specified index (if one exists)', function () {
                ipc.cache(0, []);
                ipc.cache(1, []);

                ipc.touch(1);
                expect(ipc.info(0).touched).toBe(1);
                expect(ipc.info(1).touched).toBe(2);

                ipc.touch(1);
                expect(ipc.info(0).touched).toBe(1);
                expect(ipc.info(1).touched).toBe(3);

                ipc.touch(0);
                expect(ipc.info(0).touched).toBe(2);
                expect(ipc.info(1).touched).toBe(3);
            });
        });
        describe('count()', function () {
            it('should exist', function () {
                expect(ipc.count).toEqual(jasmine.any(Function));
            });
            it('should return the current number of cached items', function () {
                expect(ipc.count()).toBe(0);
                ipc.cache(0, []);
                ipc.cache(1, []);
                expect(ipc.count()).toBe(2);
                ipc.cache(0, []);
                expect(ipc.count()).toBe(2);
                ipc.cache(2, []);
                expect(ipc.count()).toBe(3);
            });
        });
        describe('cached([orderby])', function () {
            beforeEach(function (done) {
                //We use timeouts to get unique storage times
                setTimeout(ipc.cache.bind(ipc, 0, []), 50);
                setTimeout(ipc.cache.bind(ipc, 4, []), 100);
                setTimeout(ipc.cache.bind(ipc, 2, []), 150);
                setTimeout(ipc.cache.bind(ipc, 1, []), 200);
                setTimeout(ipc.cache.bind(ipc, 3, []), 250);
                setTimeout(done, 300);
            });
            it('should exist', function () {
                expect(ipc.cached).toEqual(jasmine.any(Function));
            });
            it('should return all items in index order when no orderby field is supplied', function () {
                var all = ipc.cached();
                expect(all.length).toBe(5);
                expect(all[0].index).toBe(0);
                expect(all[1].index).toBe(1);
                expect(all[2].index).toBe(2);
                expect(all[3].index).toBe(3);
                expect(all[4].index).toBe(4);
            });
            it('should return all items in order of touched when "touched" is supplied for orderby', function () {
                ipc.touch(1);
                ipc.touch(4);ipc.touch(4);
                ipc.touch(3);ipc.touch(3);ipc.touch(3);
                ipc.touch(0);ipc.touch(0);ipc.touch(0);ipc.touch(0);
                ipc.touch(2);ipc.touch(2);ipc.touch(2);ipc.touch(2);ipc.touch(2);
                var all = ipc.cached('touched');
                expect(all.length).toBe(5);
                expect(all[0].index).toBe(1);
                expect(all[1].index).toBe(4);
                expect(all[2].index).toBe(3);
                expect(all[3].index).toBe(0);
                expect(all[4].index).toBe(2);

            });
            it('should return all items in order of storage when "stored" is supplied for orderby', function () {
                var all = ipc.cached('stored');
                expect(all.length).toBe(5);
                expect(all[0].index).toBe(0);
                expect(all[1].index).toBe(4);
                expect(all[2].index).toBe(2);
                expect(all[3].index).toBe(1);
                expect(all[4].index).toBe(3);
            });
            it('should return all items in order of last modified when "modified" is supplied for orderby', function (done) {
                setTimeout(ipc.cache.bind(ipc, 1, []), 50);
                setTimeout(ipc.cache.bind(ipc, 4, []), 100);
                setTimeout(ipc.cache.bind(ipc, 3, []), 150);
                setTimeout(ipc.cache.bind(ipc, 0, []), 200);
                setTimeout(ipc.cache.bind(ipc, 2, []), 250);

                setTimeout(function () {

                    var all = ipc.cached('modified');
                    expect(all.length).toBe(5);
                    expect(all[0].index).toBe(1);
                    expect(all[1].index).toBe(4);
                    expect(all[2].index).toBe(3);
                    expect(all[3].index).toBe(0);
                    expect(all[4].index).toBe(2);

                    done();

                }, 300);
            });
        });
        describe('data(index)', function () {
            it('should exist', function () {
                expect(ipc.data).toEqual(jasmine.any(Function));
            });
            it('should return the page data for the specified index', function () {
                var d1 = [],
                    d2 = [];

                ipc.cache(1, d1);
                ipc.cache(2, d2);

                expect(ipc.data(1)).toBe(d1);
                expect(ipc.data(2)).toBe(d2);
            });
            it('should return null when the index is not cached', function () {
                ipc.cache(1, []);
                ipc.cache(2, []);

                expect(ipc.data(1)).toEqual(jasmine.any(Array));
                expect(ipc.data(2)).toEqual(jasmine.any(Array));
                expect(ipc.data(3)).toBe(null);
            });
            it('should increment touched for a page when the data is returned', function () {
                var all;
                ipc.cache(1, []);
                ipc.cache(2, []);

                ipc.data(1);
                all = ipc.cached('touched');
                expect(all.length).toBe(2);
                expect(all[0].index).toBe(2);
                expect(all[1].index).toBe(1);
            });
        });
        describe('info(index)', function () {
            it('should exist', function () {
                expect(ipc.info).toEqual(jasmine.any(Function));
            });
            it('should return touched, stored and modified for the specified index', function () {
                ipc.cache(1, []);
                ipc.cache(2, []);
                ipc.data(2);

                var i1 = ipc.info(1),
                    i2 = ipc.info(2);

                expect(i1).toEqual(jasmine.any(Object));
                expect(i2).toEqual(jasmine.any(Object));

                expect(i1.touched).toEqual(1);
                expect(i2.touched).toEqual(2);
                expect(i1.stored).toEqual(jasmine.any(Number));
                expect(i2.stored).toEqual(jasmine.any(Number));
                expect(i1.modified).toEqual(jasmine.any(Number));
                expect(i2.modified).toEqual(jasmine.any(Number));
            });
            it('should return null when the specified index is not cached', function () {
                ipc.cache(1, []);
                ipc.cache(2, []);

                expect(ipc.info(0)).toBe(null);
                expect(ipc.info(1)).not.toBe(null);
                expect(ipc.info(2)).not.toBe(null);
            });
        });
        describe('updateMeta(index, data)', function () {
            it('should exist', function () {
                expect(ipc.updateMeta).toEqual(jasmine.any(Function));
            });
            it('should set the metadata for the specified index to the supplied data', function () {
                ipc.cache(0, []);
                ipc.cache(1, []);
                ipc.updateMeta(0, { foo: 'bar' });
                expect(ipc.meta(0).foo).toBe('bar');
                expect(ipc.meta(1)).toBe(null);
            });
            it('should do nothing if there is no cache entry for the specified index', function () {
                ipc.updateMeta(0, {});
                expect(ipc.meta(0)).toBe(null);
            });
            it('should return data when the meta was succesfully set', function () {
                var md = {};
                ipc.cache(0, []);
                expect(ipc.updateMeta(0, md)).toBe(md);
                expect(ipc.updateMeta(1, md)).toBe(null);
            });
        });
        describe('meta(index)', function () {
            it('should exist', function () {
                expect(ipc.meta).toEqual(jasmine.any(Function));
            });
            it('should return the user defined meta for the specified index', function () {
                ipc.cache(0, []);
                ipc.cache(1, []);

                ipc.updateMeta(0, 0);
                ipc.updateMeta(1, 1);

                expect(ipc.meta(0)).toBe(0);
                expect(ipc.meta(1)).toBe(1);
            });
            it('should return null if there is no item cached for the specified index', function () {
                ipc.cache(0, []);
                ipc.cache(1, []);

                ipc.updateMeta(0, 0);
                ipc.updateMeta(1, 1);
                ipc.updateMeta(2, 2);

                expect(ipc.meta(2)).toBe(null);
                expect(ipc.meta(3)).toBe(null);
            });
            it('should return null if the user has never stored any meta data', function () {
                ipc.cache(0, []);
                ipc.cache(1, []);

                expect(ipc.meta(0)).toBe(null);
                expect(ipc.meta(1)).toBe(null);

                ipc.updateMeta(0, 0);
                expect(ipc.meta(0)).not.toBe(null);
                expect(ipc.meta(1)).toBe(null);
            });
        });
        describe('insertRecord(pidx, offset, [item1], [item2], [itemN])', function () {
            it('should exist', function () {
                expect(ipc.insertRecord).toEqual(jasmine.any(Function));
            });
            it('should insert the records starting at the specified page and offset', function () {
                var all;
                ipc.setPageSize(5);
                ipc.cache(0, [0, 1, 2, 8, 9]);
                ipc.insertRecord(0, 3, 3, 4, 5, 6, 7);
                all = ipc.cached();
                expect(all.length).toBe(2);
                expect(all[0].data[0]).toBe(0);
                expect(all[0].data[1]).toBe(1);
                expect(all[0].data[2]).toBe(2);
                expect(all[0].data[3]).toBe(3);
                expect(all[0].data[4]).toBe(4);

                expect(all[1].data[0]).toBe(5);
                expect(all[1].data[1]).toBe(6);
                expect(all[1].data[2]).toBe(7);
                expect(all[1].data[3]).toBe(8);
                expect(all[1].data[4]).toBe(9);
            });
            it('should remove pages that are not filled after the insert', function () {
                var all;
                ipc.setPageSize(5);
                ipc.cache(0, [0, 1, 2, 10, 11]);
                ipc.insertRecord(0, 3, 3, 4, 5, 6, 7, 8, 9);
                all = ipc.cached();
                expect(all.length).toBe(2);
                expect(all[0].data[0]).toBe(0);
                expect(all[0].data[1]).toBe(1);
                expect(all[0].data[2]).toBe(2);
                expect(all[0].data[3]).toBe(3);
                expect(all[0].data[4]).toBe(4);

                expect(all[1].data[0]).toBe(5);
                expect(all[1].data[1]).toBe(6);
                expect(all[1].data[2]).toBe(7);
                expect(all[1].data[3]).toBe(8);
                expect(all[1].data[4]).toBe(9);
            });
        });
        describe('deleteRecord(pidx, offset, count)', function () {
            it('should exist', function () {
                expect(ipc.deleteRecord).toEqual(jasmine.any(Function));
            });
            it('should remove count records from the supplied index and offset', function () {
                var all;
                ipc.setPageSize(5);
                ipc.cache(0, [0, 1, 2, 10, 11]);
                ipc.cache(1, [12, 13, 14, 3, 4]);
                ipc.deleteRecord(0, 3, 5);
                all = ipc.cached();

                expect(all.length).toBe(1);
                expect(all[0].data.length).toBe(5);
                expect(all[0].data[0]).toBe(0);
                expect(all[0].data[1]).toBe(1);
                expect(all[0].data[2]).toBe(2);
                expect(all[0].data[3]).toBe(3);
                expect(all[0].data[4]).toBe(4);
            });
        });
    });
});
