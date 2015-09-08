(function indexed_pager_service(sys, app) {
    'use strict';

    //Register the factory.
    app.factory('jsdcIndexedPagerService', ['$q', 'jsdcEventEmitter', 'jsdcIndexedPageCache', 'jsdcLoaderService', indexedPagerServiceFactory]);

    /** Provides paged data management */
    function indexedPagerServiceFactory($q, EventEmitter, IndexedPageCache, LoaderService) {

        //Define the lookups
        var COUNT_MODE = IndexedPagerService.COUNT_MODE = {
            none: 'none',
            adapter: 'adapter',
            fixed: 'fixed',
            detect: 'detect'
        };

        //Defaults
        IndexedPagerService.DEFAULT_COUNT_MODE = COUNT_MODE.adapter;
        IndexedPagerService.DEFAULT_PAD_LOW = 0;
        IndexedPagerService.DEFAULT_PAD_HIGH = 0;
        IndexedPagerService.DEFAULT_MIN_PAGES = 1;
        IndexedPagerService.DEFAULT_MAX_PAGES = Number.MAX_SAFE_INTEGER || Number.MAX_VALUE;

        //Lookups from loader
        IndexedPagerService.EXISTING_MODE = LoaderService.EXISTING_MODE;
        IndexedPagerService.EXECUTION_MODE = LoaderService.EXECUTION_MODE;
        IndexedPagerService.BATCH_CANCEL_MODE = LoaderService.BATCH_CANCEL_MODE;
        IndexedPagerService.LOAD_OVERFLOW_MODE = LoaderService.LOAD_OVERFLOW_MODE;

        //Lookups from cache
        IndexedPagerService.PURGE_MODE = IndexedPageCache.PURGE_MODE;
        IndexedPagerService.INDEX_MODE = IndexedPageCache.INDEX_MODE;
        IndexedPagerService.RESIZE_MODE = IndexedPageCache.RESIZE_MODE;

        //Return the constructor
        return IndexedPagerService;

        /**
        * Allows management of data in a paged fashion
        */
        function IndexedPagerService() {
            var self = this,
                internal = {
                    index: null,
                    disableEnsurePadding: false,
                    minPages: IndexedPagerService.DEFAULT_MIN_PAGES,
                    maxPages: IndexedPagerService.DEFAULT_MAX_PAGES,
                    //The number of items to load each side of the current index
                    padLow: IndexedPagerService.DEFAULT_PAD_LOW,
                    padHigh: IndexedPagerService.DEFAULT_PAD_HIGH,
                    countMode: IndexedPagerService.DEFAULT_COUNT_MODE,
                    loader: new LoaderService(),
                    count: 0
                };

            //Inherit from EventEmitter
            EventEmitter.call(this);

            //Copy lookups
            this.COUNT_MODE = COUNT_MODE;
            this.EXISTING_MODE = IndexedPagerService.EXISTING_MODE;
            this.EXECUTION_MODE = IndexedPagerService.EXECUTION_MODE;
            this.BATCH_CANCEL_MODE = IndexedPagerService.BATCH_CANCEL_MODE;
            this.PURGE_MODE = IndexedPagerService.PURGE_MODE;
            this.INDEX_MODE = IndexedPagerService.INDEX_MODE;
            this.RESIZE_MODE = IndexedPagerService.RESIZE_MODE;
            this.LOAD_OVERFLOW_MODE = IndexedPagerService.LOAD_OVERFLOW_MODE;

            //Set the purgeMode to our custom function
            internal.loader.cache().setPurgeMode(purgeHander);

            //We want to control when execution happens so we can add multiple commands to be batched
            internal.loader.setExecutionMode(LoaderService.EXECUTION_MODE.delayed);

            //Bind events from cache
            internal.loader.cache().on('pageSizeChanged', this.emit.bind(this, 'pageSizeChanged'));
            internal.loader.cache().on('indexModeChanged', this.emit.bind(this, 'indexModeChanged'));
            internal.loader.cache().on('maxItemsChanged', this.emit.bind(this, 'maxPagesChanged'));
            internal.loader.cache().on('cached', this.emit.bind(this, 'cached'));
            internal.loader.cache().on('uncached', this.emit.bind(this, 'removed'));

            //Bind events from loader
            internal.loader.on('adapterChanged', this.emit.bind(this, 'adapterChanged'));
            internal.loader.on('filterChanged', this.emit.bind(this, 'filterChanged'));
            internal.loader.on('parallelChanged', this.emit.bind(this, 'parallelChanged'));
            internal.loader.on('batchingChanged', this.emit.bind(this, 'batchingChanged'));
            internal.loader.on('batchCancelMode', this.emit.bind(this, 'batchCancelMode'));
            internal.loader.on('existingModeChanged', this.emit.bind(this, 'existingModeChanged'));
            internal.loader.on('retryDelayChanged', this.emit.bind(this, 'retryDelayChanged'));
            internal.loader.on('retryCountChanged', this.emit.bind(this, 'retryCountChanged'));
            internal.loader.on('dropped', this.emit.bind(this, 'dropped'));
            internal.loader.on('ignored', this.emit.bind(this, 'ignored'));
            internal.loader.on('loaded', this.emit.bind(this, 'loaded'));

            //Accessors
            //Local
            this.index = getIndex;
            this.setIndex = setIndex;

            this.adapter = getAdapter;
            this.setAdapter = setAdapter;

            this.pad = getPad;
            this.setPad = setPad;
            this.padLow = getPadLow;
            this.setPadLow = setPadLow;
            this.padHigh = getPadHigh;
            this.setPadHigh = setPadHigh;

            this.countMode = getCountMode;
            this.setCountMode = setCountMode;

            this.filter = getFilter;
            this.setFilter = setFilter;

            this.pageSize = getPageSize;
            this.setPageSize = setPageSize;

            this.state = getState;
            this.setState = setState;

            //Cache
            this.resizeMode = internal.loader.cache().resizeMode;
            this.setResizeMode = internal.loader.cache().setResizeMode;

            this.indexMode = internal.loader.cache().indexMode;
            this.setIndexMode = internal.loader.cache().setIndexMode;

            this.maxPages = internal.loader.cache().maxItems;
            this.setMaxPages = internal.loader.cache().setMaxItems;

            //Loader
            this.adapterObject = internal.loader.adapterObject;

            this.parallel = internal.loader.parallel;
            this.setParallel = internal.loader.setParallel;

            this.batching = internal.loader.batching;
            this.setBatching = internal.loader.setBatching;

            this.batchMax = internal.loader.batchMax;
            this.setBatchMax = internal.loader.setBatchMax;

            this.loadMax = internal.loader.loadMax;
            this.setLoadMax = internal.loader.setLoadMax;

            this.loadOverflowMode = internal.loader.loadOverflowMode;
            this.setLoadOverflowMode = internal.loader.setLoadOverflowMode;

            this.retryCount = internal.loader.retryCount;
            this.setRetryCount = internal.loader.setRetryCount;

            this.retryDelay = internal.loader.retryDelay;
            this.setRetryDelay = internal.loader.setRetryDelay;

            this.existingMode = internal.loader.existingMode;
            this.setExistingMode = internal.loader.setExistingMode;

            //Functions
            this.clear = clear;
            this.page = page;
            this.pages = pages;
            this.remove = internal.loader.cache().uncache;
            this.count = getCount;
            this.updateCount = updateCount;
            this.seed = seed;

            /**
            * Returns the current index.
            *   When initialised, or after clear, index will be null.
            */
            function getIndex() {
                return internal.index;
            }

            /**
            * Sets the index. This will load and drop pages according to balance, minPages and maxPages
            * @param {number} value The index to set.
            */
            function setIndex(value) {
                var res, data, old;
                value = Math.floor(value); //Enforce int
                if (isNaN(value)) {
                    throw new Error('index MUST be a number');
                } else {
                    old = internal.index;
                    res = $q.defer();
                    internal.index = value;
                    if (old !== value) {
                        self.emit('indexChanged', value, old);
                    }
                    data = ensurePadding();
                    Object.keys(data).forEach(loadNotify.bind(null, res, data));
                    data.exec
                        .then(res.resolve)
                        .catch(res.reject);
                }
                return res.promise;
            }

            /** Returns the adapter (as it was set) */
            function getAdapter() {
                return internal.loader.adapter();
            }

            /** Updates the adapter */
            function setAdapter(value, noconfig) {
                var res = internal.loader.setAdapter(value);
                if (!noconfig) {
                    updateAdapter(self.adapterObject());
                }
                return res;
            }

            /** Returns the current filter */
            function getFilter() {
                return internal.loader.filter();
            }

            /** Sets the filter to pass to the adapter on load */
            function setFilter(value) {
                if (!sys.equals(self.filter(), value)) {
                    internal.loader.setFilter(value);
                    clear();
                }
            }

            /** Returns the minimum from padLow and padHigh */
            function getPad() {
                return Math.min(internal.padLow, internal.padHigh);
            }

            /** Sets both padLow and padHigh to the specified value */
            function setPad(value) {
                return $q.all([
                    self.setPadLow(value),
                    self.setPadHigh(value)
                ]);
            }

            /** Returns the number of items before the current index to automatically load */
            function getPadLow() {
                return internal.padLow;
            }

            /** Sets the number of items before the current index to automatically load */
            function setPadLow(value) {
                var res, data, old;
                value = Math.floor(value);
                if (value >= 0) {
                    old = internal.padLow;
                    internal.padLow = value;
                    if (old !== value) {
                        self.emit('padLowChanged', value, old);
                    }
                    data = ensurePadding();
                    res = $q.defer();
                    Object.keys(data).forEach(loadNotify.bind(null, res, data));
                    data.exec
                        .then(res.resolve)
                        .catch(res.reject);
                } else {
                    throw new Error('padLow MUST be set to a number greater than or equal to 0');
                }
                return res.promise;
            }

            /** Returns the number of items after the current index to automatically load */
            function getPadHigh() {
                return internal.padHigh;
            }

            /** Sets the number of items after the current index to automatically load */
            function setPadHigh(value) {
                var res, data, old;
                value = Math.floor(value);
                if (value >= 0) {
                    old = internal.padHigh;
                    internal.padHigh = value;
                    if (old !== value) {
                        self.emit('padHighChanged', value, old);
                    }
                    data = ensurePadding();
                    res = $q.defer();
                    Object.keys(data).forEach(loadNotify.bind(null, res, data));
                    data.exec
                        .then(res.resolve)
                        .catch(res.reject);
                } else {
                    throw new Error('padHigh MUST be set to a number greater than or equal to 0');
                }
                return res.promise;
            }

            /** Returns the pager state as an object */
            function getState() {
                var state;

                state = internal.loader.cache().state();
                state = sys.extend(state, internal.loader.state());

                //We rename maxItems to maxPages
                state.maxPages = state.maxItems;
                delete state.maxItems;

                state = sys.extend(state, {
                    index: self.index(),
                    padLow: self.padLow(),
                    padHigh: self.padHigh(),
                    countMode: self.countMode(),
                    filter: self.filter()
                });

                return state;
            }

            /** Updates the pager properties that are supplied on the value object */
            function setState(value) {
                var prom;
                if (!value || typeof value  !== 'object') {
                    throw new Error('supplied state MUST be an object');
                }
                internal.loader.cache().setState(value);
                internal.loader.setState(value);
                prom = []; //To store promises
                internal.disableEnsurePadding = true;
                //Note: Filter must be done first as it clears data and
                //  sets index to null when changed
                if (value.hasOwnProperty('filter')) {
                    self.setFilter(value.filter);
                }
                if (value.hasOwnProperty('index')) {
                    self.setIndex(value.index);
                }
                if (value.hasOwnProperty('maxPages')) {
                    self.setMaxPages(value.maxPages);
                }
                if (value.hasOwnProperty('padLow')) {
                    self.setPadLow(value.padLow);
                }
                //Re-enable before the pad high call so ensurePadding is called internally.
                if (value.hasOwnProperty('padHigh')) {
                    self.setPadHigh(value.padHigh);
                }
                internal.disableEnsurePadding = false;
                if (value.hasOwnProperty('countMode')) {
                    self.setCountMode(value.countMode);
                }

                prom = ensurePadding();
                prom = prom.exec;
                return prom;
            }

            /** Ties up the notify call for the specified load index */
            function loadNotify(res, data, idx) {
                idx = parseInt(idx, 10);
                if (!isNaN(idx)) {
                    data[idx].then(res.notify.bind(res, idx));
                }
            }

            /** Returns the current count mode */
            function getCountMode() {
                return internal.countMode;
            }

            /** Sets the current countMode to one of the values found in COUNT_MODE */
            function setCountMode(value) {
                var old;
                if (COUNT_MODE[value]) {
                    old = internal.countMode;
                    internal.countMode = value;
                    if (value === COUNT_MODE.detect) {
                        //When changing to detect, set to the current number of pages in the cache.
                        internal.count = internal.loader.cache().cached().length;
                    } else {
                        //Reset to 0
                        internal.count = 0;
                    }
                    if (old !== value) {
                        self.emit('countModeChanged', value, old);
                    }
                } else {
                    throw new Error('invalid countMode "' + value + '". MUST be one of the following values: ' + Object.keys(COUNT_MODE).join(', '));
                }
            }

            /** Gets the current page size */
            function getPageSize() {
                return internal.loader.cache().pageSize();
            }

            /** Updates the page size */
            function setPageSize(value) {
                var cache = internal.loader.cache(),
                    cached;
                if (value !== getPageSize()) {
                    cache.setPageSize(value);
                    if (cache.resizeMode() === cache.RESIZE_MODE.clear || cache.count() === 0) {
                        //The call to setPage size will have cleared the data. Set index to null
                        internal.index = null;
                    } else if (cache.info(internal.index) === null) {
                        //Set to the closest cached index.
                        cached = cache.cached().sort(byDistance);
                        internal.index = cached[0];
                    }
                    internal.count = cache.count();
                }
                return value;

                /** Allows sorting by distance from the current index */
                function byDistance(a, b) {
                    a = distance(a.index, internal.index);
                    b = distance(b.index, internal.index);

                    if (a === b) {
                        return 0;
                    } else if (a > b) {
                        return 1;
                    } else {
                        return -1;
                    }
                }
            }

            /** Removes all data from the cache,  */
            function clear() {
                internal.loader.clear();
                internal.index = null;
                internal.count = 0;
            }

            /** Returns information for the given page */
            function page(index) {
                var item = internal.loader.info(index),
                    res;
                if (item) {
                    res = {
                        index: item.index,
                        data: item.cached,
                        loading: item.queued || item.loading || item.waiting,
                        cancel: item.cancel
                    };
                } else {
                    res = null;
                }
                return res;
            }

            /** Returns a list of all pages in the pager */
            function pages() {
                //Return all pages
                //  Group into cached and loading (which will include queued and waiting)
                var all = internal.loader.info();
                return all.map(mapInfo);

                /** Returns the page info structure */
                function mapInfo(item) {
                    return {
                        index: item.index,
                        data: item.cached && item.cached.data,
                        loading: item.queued || item.loading || item.waiting,
                        cancel: item.cancel
                    };
                }
            }

            /** Returns the a promise that will be resolved with the current page count. */
            function getCount() {
                var res = $q.defer();
                switch (self.countMode()) {
                    case COUNT_MODE.none:
                        res.resolve(null);
                        break;
                    case COUNT_MODE.adapter:
                        if (internal.loader.adapterObject().count) {
                            internal.loader.adapterObject().count(self.filter())
                                .then(res.resolve)
                                .catch(res.reject);
                        } else {
                            throw new Error('The currently set adapter does not support count');
                        }
                        break;
                    case COUNT_MODE.fixed:
                    case COUNT_MODE.detect:
                        res.resolve(internal.count);
                        break;
                    default:
                        throw new Error('Unrecognised count mode "' + self.countMode() + '"');
                }
                return res.promise;
            }

            /** Sets the internal count value. Note: This will only have an effect on count when countMode is fixed or detect */
            function updateCount(value) {
                var old;
                if (value >= 0) {
                    old = internal.count;
                    internal.count = value;
                    if (old !== value) {
                        self.emit('countChanged', value, old);
                    }
                } else {
                    throw new Error('count MUST be greater than or equal to zero');
                }
            }

            /** Clears the existing data, adds supplied data to the cache. And sets the index to 0 */
            function seed(data) {
                var cache;
                if (Array.isArray(data)) {
                    clear();
                    cache = internal.loader.cache();
                    cache.insertRecord.apply(cache, 0, 0, data);
                    self.setIndex(0);
                } else {
                    throw new Error('seed data MUST be an array');
                }
            }

            /**
            * A handler to be used by the loader cache to purge items when
            * it has too many.
            * @param {IndexedCollection} items The IndexedCollection containing the cached items,
            *   so they can be used to determine which items to purge.
            * @param {number} count The target number of items we are aiming for.
            */
            function purgeHander(items, count) {
                var less,
                    greater,
                    l, g,
                    res,
                    idx = self.index();

                //Get less than and greater than
                less = items.lessThan(idx);
                greater = items.greaterThan(idx);

                //Count is what we are aiming for, so remove enough
                //  items that we have the correct count
                //Remove the index from the count, since we will be keeping it in :)
                count--;
                while (count) {
                    l = val(less[less.length - 1]);
                    g = val(greater[0]);

                    if (l !== null && g !== null) {
                        //Find which is closer and drop that so it will not be removed
                        l = distance(l, idx);
                        g = distance(g, idx);
                        if (l > g) {
                            greater.shift();
                        } else {
                            //We prefer the greater if they are equal
                            less.pop();
                        }
                    } else if (l !== null) {
                        //Remove the last less than
                        less.pop();
                    } else {
                        //Remove the first greater than
                        greater.shift();
                    }
                    count--;
                }

                //Create a list of indexes from the left over which should be purged.
                res = less.concat(greater);
                return res;

                /** Returns the value if it is a number, otherwise null */
                function val(v) {
                    if (isNaN(v)) {
                        return null;
                    } else {
                        return v;
                    }
                }
            }

            /**
            * Ensures the currently set index, and its balance values are correctly cached,
            *   and if they are not, caches them.
            */
            function ensurePadding() {
                var min = self.index() - self.padLow(),
                    max = self.index() + self.padHigh(),
                    flip = false,
                    deferred = $q.defer(),
                    execData,
                    loads,
                    cnt,
                    i;

                //If we only allow positive indexes, ensure min is not below 0.
                if (internal.loader.cache().indexMode() === internal.loader.cache().INDEX_MODE.positive) {
                    min = Math.max(0, min);
                }

                //If we do not yet have an index, or this has been disabled to set multiple values don't load anything.
                if (self.index() === null || internal.disableEnsurePadding) {
                    deferred.resolve([]);
                    return { exec: deferred.promise };
                }

                //TODO: We should determine which items are currently set to load which will be purged
                //  following their completion, and cancel them immediately.
                //  This will probably require significant restructuring of this function
                //  I think this will probably mean we manually perform maxItems dropping....


                //TODO: This should be in loader....
                //1. Count the number of loads we are doing.
                //2. Get info from loader
                //3. With info from loader, are we under max items? Yes -> done
                //4. 
                //5. Once done, In load order (so starting from cached) remove items, and cancel loads until under max items

                //We should not attempt to load more items than maxItems
                while (internal.loader.cache().maxItems() < max - min) {
                    if (flip) {
                        max--;
                    } else {
                        min++;
                    }
                    flip = !flip;
                }

                //Load the items we need
                loads = { };
                cnt = 0;
                for (i = min; i <= max; i++) {
                    cnt++;
                    loads[i] = internal.loader.load(i);
                    loads[i]
                        .then(loadSuccess.bind(null, i))
                        .finally(loadComplete);
                }

                //Note: Below, we wait for the execute promise to be resolved,
                //  and for all the loads to be resolved. This is because when
                //  existingMode is set to drop, and a load is dropped, its
                //  loaded promise will be resolved when the existing item is
                //  resolved, but its execute promise will be resolved immediately
                //  (since there is no data to be loaded)

                //Do the execution
                internal.loader.execute()
                    .then(execComplete)
                    .catch(deferred.reject);
                loads.exec = deferred.promise;

                //Execute the load, and return its promise.
                return loads;

                /**
                * Increments the internal count if the index is higher than count
                * and the countMode is set to detect.
                */
                function loadSuccess(index, data) {
                    if (data && internal.countMode === COUNT_MODE.detect) {
                        //Update if the page exists, countMode is detect and index is higher than count
                        internal.count = Math.max(internal.count, index);
                    }
                }

                /** Called once a load has completed */
                function loadComplete() {
                    cnt--;
                    if (!cnt) {
                        execComplete();
                    }
                }

                /** Called once exec has completed */
                function execComplete(data) {
                    if (data) {
                        execData = data;
                    }
                    if (!cnt && execData) {
                        deferred.resolve(execData);
                    }
                }
            }

            /** Performs configuration for the supplied adapter */
            function updateAdapter(adapter) {
                //TODO: indexMode
                var info, state = {
                    parallel: LoaderService.DEFAULT_PARALLEL,
                    max: LoaderService.DEFAULT_BATCH_MAX,
                    dynamic: false
                };
                if (typeof adapter.info  === 'function') {
                    info = adapter.info();
                    if (info.hasOwnProperty('parallel')) {
                        state.parallel = info.parallel;
                    }
                    if (info.hasOwnProperty('max')) {
                        state.batchMax = info.max;
                    }
                    if (info.hasOwnProperty('dynamic')) {
                        if (info.dynamic) {
                            state.resizeMode = internal.loader.cache().RESIZE_MODE.maintain;
                        } else {
                            state.resizeMode = internal.loader.cache().RESIZE_MODE.clear;
                        }
                    }
                }
                self.setState(state);
            }

            /** gets the distance between 2 indexes */
            function distance(i1, i2) {
                return Math.abs(i1 - i2);
            }

        }

    }

}(window.angular, window.angular.module('dataConductor')));
