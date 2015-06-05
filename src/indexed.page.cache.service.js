(function indexed_page_cache_service(app) {
    'use strict';

    //Register the factory.
    app.factory('jsdcIndexedPageCache', ['jsdcEventEmitter', 'jsdcIndexedCollection', indexedPageCacheFactory]);

    /** Allows page data to be cached according to its index */
    function indexedPageCacheFactory(EventEmitter, IndexedCollection) {

        //A special placeholder object used to indicate invalid page items
        var INVALID = {},
            //Whether to allow negative indexes or not
            INDEX_MODE = {
                positive: 'positive',
                full: 'full'
            },
            //How to manage cache overflow
            PURGE_MODE = {
                stored: 'stored',
                modified: 'modified',
                touched: 'touched',
                order: 'order'
            },
            //Whether to attempt to maintain page entries by adjusting page arrays to the new size
            RESIZE_MODE = {
                clear: 'clear',
                maintain: 'maintain'
            };

        //Assign the constructor default constants
        IndexedPageCache.DEFAULT_MAX_ITEMS = Number.MAX_VALUE;
        IndexedPageCache.DEFAULT_PAGE_SIZE = 10;
        IndexedPageCache.DEFAULT_PURGE_MODE = PURGE_MODE.touched;
        IndexedPageCache.DEFAULT_INDEX_MODE = INDEX_MODE.positive;
        IndexedPageCache.DEFAULT_RESIZE_MODE = RESIZE_MODE.clear;

        //Assign the lookup constants
        IndexedPageCache.PURGE_MODE = PURGE_MODE;
        IndexedPageCache.INDEX_MODE = INDEX_MODE;
        IndexedPageCache.RESIZE_MODE = RESIZE_MODE;

        //Return the IndexedPageCache type
        return IndexedPageCache;

        /** Allows indexed pages to be cached and resized (while maintaining the cached data) */
        function IndexedPageCache() {

            //Setup the initial storage
            var order = 0,
                self = this,
                internal = {
                    items: new IndexedCollection('index', ['touched', 'stored', 'modified', 'order']),
                    maxItems: IndexedPageCache.DEFAULT_MAX_ITEMS,
                    purgeMode: IndexedPageCache.DEFAULT_PURGE_MODE,
                    indexMode: IndexedPageCache.DEFAULT_INDEX_MODE,
                    resizeMode: IndexedPageCache.DEFAULT_RESIZE_MODE,
                    pageSize: IndexedPageCache.DEFAULT_PAGE_SIZE
                };

            //Inherit from EventEmitter
            EventEmitter.call(this);

            //Assign the constant lookups to the instance for ease of access
            this.PURGE_MODE = PURGE_MODE;
            this.INDEX_MODE = INDEX_MODE;
            this.RESIZE_MODE = RESIZE_MODE;

            //Expose the public API
            this.pageSize = getPageSize;
            this.setPageSize = setPageSize;

            //Clear or maintain (default)
            this.resizeMode = getResizeMode;
            this.setResizeMode = setResizeMode;

            //Allow or disallow negative indexes
            this.indexMode = getIndexMode;
            this.setIndexMode = setIndexMode;

            //The maximum number of items allowed in the cache.
            this.maxItems = getMaxItems;
            this.setMaxItems = setMaxItems;

            //What to do once max items has been reached
            this.purgeMode = getPurgeMode;
            this.setPurgeMode = setPurgeMode;

            //Bulk info and update
            this.state = getState;
            this.setState = setState;

            //Functions
            this.cache = cache;
            this.uncache = uncache;
            this.touch = touch;
            this.count = count;
            this.cached = cached;
            this.data = data;
            this.info = info;
            this.meta = meta;
            this.updateMeta = updateMeta;
            this.clear = internal.items.clear;
            this.insertRecord = insertRecord;
            this.deleteRecord = deleteRecord;

            /** Returns the number of entries in a page */
            function getPageSize() {
                return internal.pageSize;
            }

            /**
            * Sets the number of items in a page. Changing this will re-order the data in the pages unless resize mode is "clear"
            * @param {number} value The number of entries in a page.
            */
            function setPageSize(value) {
                var old;
                value = Math.floor(value); //Force integer, and convert boolean to number
                if (value !== internal.pageSize) {
                    if (value > 0) {
                        if (self.resizeMode() === RESIZE_MODE.clear) {
                            internal.items.clear();
                        } else {
                            resizePageEntries(internal.pageSize, value);
                            purge(self.maxItems());
                        }
                    } else {
                        throw new Error('pageSize MUST be a positive integer');
                    }
                    old = internal.pageSize;
                    internal.pageSize = value;
                    self.emit('pageSizeChanged', value, old);
                }
                return value;
            }

            /**
            * Returns the mode to use when resizing the pages
            */
            function getResizeMode() {
                return internal.resizeMode;
            }

            /**
            * Sets the resize mode
            * @param {string} value The new resize mode
            */
            function setResizeMode(value) {
                var old;
                if (RESIZE_MODE[value]) {
                    old = internal.resizeMode;
                    internal.resizeMode = value;
                    if (old !== value) {
                        self.emit('resizeChanged', value, old);
                    }
                } else {
                    throw new Error('resizeMode invalid. MUST be one of the following value: ' + keyNames(RESIZE_MODE) + '. Got "' + value + '"');
                }
            }

            /**
            * Gets the index mode to use (Whether negative indexes can be used)
            */
            function getIndexMode() {
                return internal.indexMode;
            }

            /**
            * Sets the index mode to use
            * @param {string} value The index mode to use
            */
            function setIndexMode(value) {
                var neg, old;
                if (INDEX_MODE[value]) {
                    //Only do something if the value has changed
                    if (value !== internal.indexMode) {
                        if (value === INDEX_MODE.positive) {
                            neg = internal.items.lessThan(0);
                            neg.forEach(uncache);
                        }
                        old = internal.indexMode;
                        internal.indexMode = value;
                        self.emit('indexModeChanged', value, old);
                    }
                } else {
                    throw new Error('invalid indexMode value. MUST be one of the following value: ' + keyNames(INDEX_MODE) + '. Got "' + value + '"');
                }

                /** Removes the item from the store */
                function uncache(item) {
                    internal.items.remove(item);
                }
            }

            /** Returns the current purge mode. */
            function getPurgeMode() {
                return internal.purgeMode;
            }

            /** Sets the purge mode to the specified value. The value MUST exist in PURGE_MODE */
            function setPurgeMode(value) {
                var old = self.purgeMode();
                if (PURGE_MODE[value]) {
                    internal.purgeMode = value;
                } else if (typeof value === 'function') {
                    internal.purgeMode = value;
                } else {
                    throw new Error('invalid purgeMode value "' + value + '". MUST be one of the following: "' + Object.keys(PURGE_MODE) + '"');
                }
                if (old !== value) {
                    self.emit('purgeModeChanged', value, old);
                }
            }

            /** Gets the maximum number of items allowed in the cache. */
            function getMaxItems() {
                return internal.maxItems;
            }

            /**
            * Sets the maximum number of items that may appear in the cache.
            * @param {number} value The maximum number of items in the cache.
            *    MUST be an integer greater than 0.
            *    When set to less than the current number of items in the cache, a cache prune will be performed.
            */
            function setMaxItems(value) {
                var old = self.maxItems();
                value = value + 1 - 1;
                if (value > 0) {
                    value = Math.floor(value); //Ignore decimals
                    //Ensure we don't now have too many records.
                    purge(value);
                    internal.maxItems = value;
                } else {
                    throw new Error('maxItems MUST be a number greater than 0');
                }
                if (old !== value) {
                    self.emit('maxItemsChanged', value, old);
                }
                return internal.maxItems;
            }

            /** Returns an object representing the configuration state of the cache */
            function getState() {
                return {
                    maxItems: self.maxItems(),
                    purgeMode: self.purgeMode(),
                    indexMode: self.indexMode(),
                    resizeMode: self.resizeMode(),
                    pageSize: self.pageSize()
                };
            }

            /** Allows configuration to be updated in bulk */
            function setState(value) {
                if (!value || typeof value  !== 'object') {
                    throw new Error('supplied state MUST be an object');
                }
                if (value.hasOwnProperty('maxItems')) {
                    self.setMaxItems(value.maxItems);
                }
                if (value.hasOwnProperty('purgeMode')) {
                    self.setPurgeMode(value.purgeMode);
                }
                if (value.hasOwnProperty('indexMode')) {
                    self.setIndexMode(value.indexMode);
                }
                if (value.hasOwnProperty('resizeMode')) {
                    self.setResizeMode(value.resizeMode);
                }
                if (value.hasOwnProperty('pageSize')) {
                    self.setPageSize(value.pageSize);
                }
            }

            /**
            * Adds an entry to the cache
            * @param {number} index The cache entry to retrieve the data for.
            * @param {array} item The page to cache
            */
            function cache(index, item) {
                var items;
                index = index + 1 - 1; //Allow boolean to be used.
                if (isNaN(index)) {
                    throw new Error('index MUST be a number');
                }
                if (!Array.isArray(item)) {
                    throw new Error('cached items MUST be arrays');
                }
                if (internal.indexMode === INDEX_MODE.positive && index < 0) {
                    throw new Error('index MUST be greater than or equal to 0 when indexMode is "positive"');
                }

                items = internal.items.find(index);
                if (items.length) {
                    items[0].touched++;
                    items[0].modified = (new Date()).getTime();
                    items[0].data = item;
                    internal.items.update(items[0]);
                } else {
                    rawCache(
                        index,
                        1, //touched
                        (new Date()).getTime(), //stored
                        (new Date()).getTime(), //modified
                        item //page data
                    );
                    purge(self.maxItems());
                    self.emit('cached', item);
                }
                return item;
            }

            /** Adds an item into the cache. */
            function rawCache(index, touched, stored, modified, data) {
                order = (order + 1) % (Number.MAX_SAFE_INTEGER || Number.MAX_VALUE);
                var entry = {
                    index: index,
                    touched: touched,
                    stored: stored,
                    modified: modified,
                    data: data,
                    meta: null,
                    order: order
                };
                internal.items.add(entry);
                return entry;
            }

            /**
            * Removes an entry from the cache
            * @param {number} index The cache entry to remove
            */
            function uncache(index) {
                var res = internal.items.remove(index);
                res = res && res.data;
                self.emit('uncached', res);
                return res;
            }

            /**
            * Touches the specified cache entry
            * @param {number} index The cache entry to touch
            */
            function touch(index) {
                var items = internal.items.find(index),
                    val = items[0],
                    res;

                //Increment touched if the item is found.
                if (val) {
                    val.touched++;
                    res = val.touched;
                    internal.items.update(val);
                } else {
                    res = NaN;
                }
                return res;
            }

            /**
            * Returns the number of cached entries.
            */
            function count() {
                return internal.items.count();
            }

            /**
            * Returns all the cached entries.
            * @param {string} orderby What to determine the return order by (store, update, touch. Default store)
            */
            function cached(orderby) {
                var res;
                orderby = orderby || 'index';
                res = internal.items
                    .all(orderby)
                    .map(copy);
                return res;

                /** returns a copy of the entry */
                function copy(entry) {
                    return {
                        stored: entry.stored,
                        modified: entry.modified,
                        touched: entry.touched,
                        data: entry.data,
                        index: entry.index
                    };
                }
            }

            /**
            * Returns the data for a cache entry.
            * @param {number} index The cache entry to retrieve the data for.
            */
            function data(index) {
                var items = internal.items.find(index),
                    val = items[0] && items[0].data;
                if (items[0]) {
                    items[0].touched++;
                    internal.items.update(items[0]);
                }
                return val || null;
            }

            /**
            * Returns the cache information for a cache entry.
            * @param {number} index The cache entry to retrieve the data for.
            */
            function info(index) {
                var items = internal.items.find(index),
                    res = null;

                if (items[0]) {
                    res = {
                        touched: items[0].touched,
                        stored: items[0].stored,
                        modified: items[0].modified,
                        order: items[0].order
                    };
                }
                return res;
            }

            /**
            * Returns the meta information for a cache entry.
            * @param {number} index The cache entry to retrieve the data for.
            */
            function meta(index) {
                var items = internal.items.find(index),
                    res;
                if (items[0]) {
                    res = items[0].meta;
                } else {
                    res = null;
                }
                return res;
            }

            /**
            * Updates the meta information for the specified cache entry
            * @param {number} index The cache entry to retrieve the data for.
            */
            function updateMeta(index, meta) {
                var items = internal.items.find(index),
                    res,
                    old;
                if (items[0]) {
                    old = items[0].meta;
                    items[0].meta = meta;
                }
                if (items[0]) {
                    res = items[0].meta;
                    self.emit('metaChanged', index, meta, old);
                } else {
                    res = null;
                }
                return res;
            }

            function insertRecord(pidx, offset) {
                var count, page, greater, all, idx, ps, pos, i, j;
                if (isNaN(pidx)) {
                    throw new Error('pidx MUST be a number');
                }
                if (isNaN(offset) || offset < 0) {
                    throw new Error('offset MUST be a number greater than or equal to 0');
                }
                count = arguments.length - 2;
                if (!count) {
                    return;
                }
                ps = self.pageSize();
                page = internal.items.byPrimary(pidx);
                greater = internal.items.greaterThan(pidx);
                pos = 0;
                idx = page.index * ps;
                for (i = page.data.length - 1; i >= offset; i--) {
                    moveRecord(idx + i, idx + i + count, ps, ps);
                }
                for (i = greater.length - 1; i >= 0; i--) {
                    idx = greater[i].index * ps;
                    for (j = greater[i].data.length - 1; j >= 0; j--) {
                        moveRecord(idx + j, idx + j + count, ps, ps);
                    }
                }
                for (i = pidx; i <= pidx + Math.floor(count / ps); i++) {
                    page = ensureDestination(i);
                    for (j = 0; j < page.data.length && pos < count; j++) {
                        if (i === pidx && j < offset) {
                            continue;
                        }
                        page.data[j] = arguments[2 + pos];
                        pos++;
                    }
                }

                all = internal.items.all();
                all.forEach(validateData);
            }

            /** Deletes a record from the cache */
            function deleteRecord(pidx, offset, count) {
                var idx, i, j, ps, greater;
                if (isNaN(pidx)) {
                    throw new Error('pidx MUST be a number');
                }
                if (isNaN(offset) || offset < 0) {
                    throw new Error('offset MUST be a number greater than or equal to 0');
                }
                if (isNaN(count) || count <= 0) {
                    throw new Error('count MUST be a number greater than 0');
                }

                ps = self.pageSize();

                //Get all including the page
                greater = internal.items
                    .greaterThan(pidx - 1)
                    .map(internal.items.byPrimary);

                //Adjust the record positions
                for (i = 0; i < greater.length; i++) {
                    idx = greater[i].index * ps;
                    for (j = 0; j < greater[i].data.length; j++) {
                        if (i === 0 && j < offset) {
                            //If we are before offset, do nothing.
                            continue;
                        }
                        //Move the record count positions furthur on into this one.
                        moveRecord(idx + j + count, idx + j, ps, ps);
                    }
                }

                //Make sure all the pages are valid.
                greater = internal.items
                    .greaterThan(pidx - 1)
                    .map(internal.items.byPrimary);
                greater.forEach(validateData);
            }

            /**
            * Resizes the pages, attempting to adjust the entries into their new locations.
            * @param {number} from The old page size
            * @param {number} to The new page size
            */
            function resizePageEntries(from, to) {
                var pos, neg, all;

                if (from === to) {
                    return;
                }

                //Get all the pages so we only process appropriate indexes
                pos = internal.items.greaterThan(-1);
                neg = internal.items.lessThan(0);

                if (from > to) {
                    //decrease
                    negaLoop(pos);
                    posiLoop(neg);
                } else {
                    //increase
                    //Ensure pages are the correct size.
                    all = internal.items.all();
                    increasePageSize(to);

                    //Adjust items
                    posiLoop(pos);
                    negaLoop(neg);
                }

                //Go through all and make sure we don't have invalid data
                all = internal.items.all();
                loop(all.length, function validate(i) {
                    //Make sure the page is not too long.
                    while (all[i].data.length > to) {
                        all[i].data.pop();
                    }

                    //If the page has invalid items, remove it.
                    if (all[i].data.indexOf(INVALID) > -1) {
                        internal.items.remove(all[i].index);
                    }
                });

                /** Processes an ascenfding loop pair */
                function posiLoop(arr) {
                    loop(arr.length, function processPosi(i) {
                        var idx = arr[i] * from;
                        loop(from, processRecord.bind(null, idx));
                    });
                }

                /** Processes a decending loop pair */
                function negaLoop(arr) {
                    dloop(arr.length, function processPosi(i) {
                        var idx = arr[i] * from;
                        dloop(from, processRecord.bind(null, idx));
                    });
                }

                /** A loop from 0 to max */
                function loop(max, handler) {
                    for (var i = 0; i < max; i++) {
                        handler(i);
                    }
                }

                /** A loop from max - 1 to zero */
                function dloop(max, handler) {
                    for (var i = max - 1; i >= 0; i--) {
                        handler(i);
                    }
                }

                /** Processes the given record */
                function processRecord(idx, i) {
                    moveRecord(idx + i, idx + i, from, to);
                }

                /** Adds items to the pages to ensure they are the correct length. */
                function increasePageSize(to) {
                    for (var i = 0; i < all.length; i++) {
                        while (all[i].data.length < to) {
                            all[i].data.push(INVALID);
                        }
                    }
                }
            }

            /**
            * Moves a record from the source index (record index) to the destination index.
            * @param {number} sidx The source index to move from.
            * @param {number} didx The destination index to move to.
            * @param {number} sps optional. The source page size. Defaults to self.pageSize()
            * @param {number} dps optional. The destination page size. Defaults to sps
            */
            function moveRecord(sidx, didx, sps, dps) {
                var src, spag, soff, dest, dpag, doff;

                //Setup the page size defaults
                if (!sps) {
                    sps = self.pageSize();
                }
                if (!dps) {
                    dps = self.pageSize();
                }

                spag = Math.floor(sidx / sps);
                soff = sidx % sps;
                dpag = Math.floor(didx / dps);
                doff = didx % dps;

                //Don't copy to itself.
                if (spag === dpag && soff === doff) {
                    return;
                }

                src = internal.items.byPrimary(spag);
                if (src) {
                    //Ensue source is a full length page so we don't end with an invalid state
                    while (src.data.length < sps) {
                        src.data.push(INVALID);
                    }
                    dest = ensureDestination(dpag, src, 1);
                    dest.data[doff] = src.data[soff];
                    src.data[soff] = INVALID;
                } else {
                    dest = internal.items.byPrimary(dpag);
                    if (dest) {
                        dest.data[doff] = INVALID;
                    }
                }
            }

            /**
            * Gets the destination page. If it does not exist, creates it.
            * @param {number} idx The page index to ensure exists
            * @param {object} spage The source page. If this is supplied, the touched, stored
            *   and modified values will be used or merged according to the number
            *   of items written (cnt) vs the number of items in the source page
            * @param {number} cnt Optional, the number of records being
            *   copied into the page. If this is supplied and the destination page exists,
            *   the touched, stored and modified values will be merged according to the number
            *   of items written vs ps (pageSize)
            */
            function ensureDestination(idx, spage, cnt) {
                var page = internal.items.byPrimary(idx),
                    now = Date.now(),
                    factor,
                    invfactor,
                    t, s, m,
                    ps;
                if (spage) {
                    ps = spage.data.length;
                } else {
                    ps = self.pageSize();
                }
                if (page) {
                    if (spage) {
                        factor = cnt / ps;
                        invfactor = 1 - factor;
                        t = spage.touched * factor + page.touched * invfactor;
                        m = spage.modified * factor + page.modified * invfactor;
                        s = spage.stored * factor + page.stored * invfactor;
                        page.touched = t;
                        page.stored = s;
                        page.modified = m;
                    }
                } else {
                    t = spage ? spage.touched : 1;
                    s = spage ? spage.stored : now;
                    m = spage ? spage.modified : now;
                    page = rawCache(idx, t, s, m, invalidPage(ps));
                }
                return page;
            }

            /**
            * Purges items in the cache according to the purge mode.
            * @param {number} cnt The maximum number of items which should remain after purge.
            */
            function purge(cnt) {
                var icnt = self.count(),
                    pitems;
                if (cnt < icnt) {
                    switch (self.purgeMode()) {
                        case PURGE_MODE.stored:
                            pitems = internal.items.min('stored', icnt - cnt);
                            break;
                        case PURGE_MODE.modified:
                            pitems = internal.items.min('modified', icnt - cnt);
                            break;
                        case PURGE_MODE.touched:
                            pitems = internal.items.min('touched', icnt - cnt);
                            break;
                        case PURGE_MODE.order:
                            pitems = internal.items.min('order', icnt - cnt);
                            break;
                        default:
                            if (typeof self.purgeMode() === 'function') {
                                //Pass the items collection
                                pitems = self.purgeMode()(internal.items, cnt);
                            } else {
                                throw new Error('Unrecognized purge mode "' + self.purgeMode() +
                                    '". Must be one of the following ' +
                                    Object.keys(PURGE_MODE).join(', ') +
                                    ' or a function to be called with the items and count, ' +
                                    ' expecting an array of indexes to be removed to be returned.');
                            }
                    }
                    pitems.forEach(remove);
                }

                /** Removes the item from storage */
                function remove(item) {
                    var idx = typeof item === 'number' ?
                        item :
                        item.index;
                    internal.items.remove(idx);
                }
            }

            /** Returns a string containing all properties defined on the specified object */
            function keyNames(obj) {
                return Object.keys(obj).join(', ');
            }

            /** Creates a page filled with invalid entries */
            function invalidPage(cnt) {
                var i, res = [];
                for (i = 0; i < cnt; i++) {
                    res.push(INVALID);
                }
                return res;
            }

            /** Removes an cache entry if it contains invalid records */
            function validateData(item) {
                //If the page has invalid items, remove it.
                if (item.data.indexOf(INVALID) > -1) {
                    internal.items.remove(item.index);
                }
            }
        }

    }

}(window.angular.module('dataConductor')));
