(function (define) {
	'use strict';
    //We add a fake window variable to be used in the scripts.
    var window = {};
    define('jsdc', ['angular'], function(angular) {
        window.angular = angular;
        (function module_js(angular) {
    'use strict';
    angular.module('dataConductor', []);

}(window.angular));
(function object_storage_service(app) {
    'use strict';

    app.factory('jsdcObjectStorageService', objectStorageServiceFactory);

    /** Exposes the ObjectStorageService type
    */
    function objectStorageServiceFactory() {

        //Return the type
        return ObjectStorageService;

        /**
        * Provides a storage service that stores objects which can have their functions and objects inspected for validity
        */
        function ObjectStorageService() {

            var self = this,
                adapters = {  };

            //Expose the global "constants" (we consider them as constants in
            //  that we do no value checking, and assume they exist as arrays on the service)
            this.REQUIRED_FUNCTIONS = [];
            this.OPTIONAL_FUNCTIONS = [];
            this.REQUIRED_OBJECTS = [];

            //Expose the pubic API
            this.add = add;
            this.remove = remove;
            this.all = all;
            this.find = find;
            this.validate = validateObject;
            this.clear = clear;

            /** Returns an array containing objects with every name and adapter stored */
            function all() {
                //Return the adapters as an array of name values.
                return Object.keys(adapters).map(retAdapter);

                /** Creates a name adapter pair for the adapter */
                function retAdapter(name) {
                    return {
                        name: name,
                        adapter: adapters[name]
                    };
                }
            }

            /** Searches the storage for an adapter */
            function find(name) {
                return adapters[name] || null;
            }

            /** Clears all the items stored */
            function clear() {
                self.all().map(itemName).forEach(remove);

                /** Returns the name property from the provided item */
                function itemName(item) {
                    return item.name;
                }
            }

            /** Removes an adpater from storage and returns it */
            function remove(name) {
                var ad = find(name);
                delete adapters[name];
                return ad || null;
            }

            /** Validates an object and adds it to the store */
            function add(name, obj) {
                if (!valueType(name)) {
                    throw new Error('name MUST be a value type');
                }
                if (adapters[name]) {
                    throw new Error('object named "' + name + '" already exists');
                }
                validateObject(obj);
                adapters[name] = obj;

                return obj;

                /** Checks whether the value is a value type or a reference type */
                function valueType(val) {
                    var to = typeof val;
                    if (val === null) {
                        to = 'null';
                    }
                    switch (to) {
                    case 'string':
                    case 'number':
                    case 'boolean':
                    case 'undefined':
                    case 'null':
                        return true;
                    case 'function':
                    case 'object':
                        return false;
                    }
                }
            }


            /**
            * Validates an adapter contains the functions defined by REQUIRED_FUNCTIONS
            * and the objects defined by REQUIRED_OBJECTS
            */
            function validateObject(adapter) {
                if (!adapter || typeof adapter !== 'object') {
                    throw new Error('adapter MUST be an object');
                }
                self.REQUIRED_FUNCTIONS.forEach(checkFunction);
                self.OPTIONAL_FUNCTIONS.forEach(checkOptionalFunction);
                self.REQUIRED_OBJECTS.forEach(checkObject);

                /** Checks that a function with the supplied name exists on the adapter */
                function checkFunction(f) {
                    if (typeof adapter[f] !== 'function') {
                        throw new Error('Object invalid. A function named "' + f + '" is expected to exist on the adapter');
                    }
                }

                /** Checks that if a property with the given name exists on the adapter, it is a function */
                function checkOptionalFunction(f) {
                    if (adapter.hasOwnProperty(f) && typeof adapter[f] !== 'function') {
                        throw new Error('Object invalid. When supplied on the adapter, the property named "' + f + '" MUST be a function');
                    }
                }

                /** Checks that an object with the supplied name exists on the adapter */
                function checkObject(o) {
                    var val = adapter[o];
                    if (!val || typeof val !== 'object') {
                        throw new Error('Object invalid. An object property named "' + o + '" is expected to exist on the adapter');
                    }
                }
            }

        }

    }

}(window.angular.module('dataConductor')));
(function adapter_service(app) {
    'use strict';

    app.factory('jsdcAdapterService', ['jsdcObjectStorageService', adapterServiceFactory]);

    /** Exposes the AdapterService type, and additionally
    *     constructs a global singleton instacnce of the service
    */
    function adapterServiceFactory(ObjectStorageService) {

        //Create the singleton
        AdapterService.global = new AdapterService();

        //Return the type
        return AdapterService;

        /**
        * Provides a storage service that stores adapters which can be checked for
        * the required functions
        */
        function AdapterService() {
            ObjectStorageService.call(this);
            this.REQUIRED_FUNCTIONS.push('find');
            this.OPTIONAL_FUNCTIONS.push('count');
            this.OPTIONAL_FUNCTIONS.push('info');
        }

    }

}(window.angular.module('dataConductor')));
(function indexed_collection_service(app) {
    'use strict';

    app.factory('jsdcIndexedCollection', indexedCollectionFactory);

    /** Creates and returns the IndexedCollection type which can be used to store and track values */
    function indexedCollectionFactory() {

        //Return the type
        return IndexedCollection;

        /**
        * Allows objects to be stored and retrieved in order of all fields specified.
        * @param {string} primary The name of the primary key on the stored objects
        * @param {Array} fields A collection of field names to index.
        */
        function IndexedCollection(primary, fields) {

            var count = 0,
                items = { },
                original = { },
                indexes = { },
                i;

            if (!primary || typeof primary  !== 'string') {
                throw new Error('primary MUST be a non empty string');
            }
            if (!Array.isArray(fields)) {
                throw new Error('fields MUST be an array');
            }
            fields = fields.slice();
            //Push in front so if
            fields.unshift(primary);
            for (i = 0; i < fields.length; i++) {
                indexes[fields[i]] = [];
            }

            this.find = find;
            this.byPrimary = byPrimary;
            this.add = add;
            this.remove = remove;
            this.count = cnt;
            this.update = update;
            this.all = all;
            this.clear = clear;
            this.min = min;
            this.max = max;
            this.lessThan = lessThan;
            this.greaterThan = greaterThan;

            /** Clears all data from the collection */
            function clear() {
                count = 0;
                items = { };
                original = { };
                fields.forEach(clearIndex);
                function clearIndex(idx) {
                    indexes[idx] = [];
                }
            }

            /**
            * Returns all items in order of the specified field
            * @param fields The field name to order by, or an array of field
            *   names to order by.
            */
            function all(fields) {
                //Make sure we have an array
                if (!Array.isArray(fields)) {
                    fields = [fields];
                }
                fields = fields.slice();

                var field = fields[0] || primary,
                    res,
                    tmp;

                //Add primary as the final order key if it has not yet been included somewhere
                if (fields.indexOf(primary) === -1) {
                    fields.push(primary);
                }

                if (indexes[field]) {
                    fields.shift(); //Remove the primary index
                    tmp = indexes[field].map(indexObjectVals);
                    res = [];
                    res = res.concat.apply(res, tmp);
                    return res;
                } else {
                    throw new Error('index named "' + field + '" could not be found!');
                }

                /** Gets all item values for the specified index value */
                function indexObjectVals(iobj) {
                    return iobj
                        .keys
                        .map(itemVal)
                        .sort(orderByFields.bind(null, fields));


                }
            }

            /** Returns the keys at the minimum end for the specified field or the primary field if no field specified */
            function min(field, count) {
                var res, tmp;
                if (arguments.length === 1) {
                    count = field;
                    field = primary;
                }
                count = count || 1;
                if (count < 1) {
                    throw new Error('supplied count MUST be greater than 0');
                }
                if (indexes[field]) {
                    tmp = indexes[field].slice(0, count);
                    tmp = tmp.map(keys);
                    res = [];
                    res = res.concat.apply(res, tmp);
                } else {
                    throw new Error('index named "' + field + '" could not be found!');
                }

                //Limit the number of returned results
                res = res.slice(0, count);

                //Return the resulting array
                return res.map(itemVal);

                /** Gets the keysn contained in the index item */
                function keys(item) {
                    return item.keys;
                }
            }

            /** Returns the keys at the maximum end for the specified field or the primary field if no field specified */
            function max(field, count) {
                var res, tmp, start, end;
                if (arguments.length === 1) {
                    count = field;
                    field = primary;
                }
                count = count || 1;
                if (count < 1) {
                    throw new Error('supplied count MUST be greater than 0');
                }
                if (indexes[field]) {
                    end = indexes[field].length - 1;
                    start = end - count;
                    tmp = indexes[field].slice(start, end);
                    res = [];
                    res = res.concat.apply(res, tmp);
                } else {
                    throw new Error('index named "' + field + '" could not be found!');
                }

                //Limit the number of results
                res = res.slice(res.length - count, res.length);

                //Return the resulting array
                return res.map(itemVal);
            }

            /** Returns all items with a key value less than the specified value */
            function lessThan(field, value) {
                var idx, tmp, res;
                if (arguments.length === 1) {
                    value = field;
                    field = primary;
                }

                if (indexes[field]) {
                    idx = bindex(field, value);
                    tmp = indexes[field].slice(0, idx)
                        .map(keys);
                    res = [];
                    res = res.concat.apply(res, tmp);
                } else {
                    throw new Error('index named "' + field + '" could not be found!');
                }

                return res;

                function keys(item) {
                    return item.keys;
                }
            }

            /** Returns all items with a key value greater than the specified value */
            function greaterThan(field, value) {
                var start, end, tmp, res;
                if (arguments.length === 1) {
                    value = field;
                    field = primary;
                }

                if (indexes[field]) {
                    end = indexes[field].length;
                    start = bindex(field, value);
                    if (indexes[field][start] && indexes[field][start].value === value) {
                        start++;
                    }
                    tmp = indexes[field].slice(start, end)
                        .map(keys);
                    res = [];
                    res = res.concat.apply(res, tmp);
                } else {
                    throw new Error('index named "' + field + '" could not be found!');
                }

                return res;

                function keys(item) {
                    return item.keys;
                }
            }

            /** Returns the item with the specified primary key */
            function byPrimary(key) {
                return items[key] || null;
            }

            /**
            * Searches for the items with the specified field value.
            * @param {string} field The named index to search for
            * @param value The value to search for
            */
            function find(field, value) {
                var keys;
                if (arguments.length === 1) {
                    value = field;
                    field = primary;
                } else if (!indexes[field]) {
                    throw new Error('index named "' + field + '" does not exist');
                }

                keys = bfind(field, value);
                if (keys === null) {
                    keys = [];
                }
                return keys.map(itemValue);

                /**
                * Returns the items with the specified primary key.
                * The primary key value to search for.
                */
                function itemValue(pkey) {
                    return items[pkey];
                }
            }

            /** Returns the number of items in the collection */
            function cnt() {
                return count;
            }

            /**
            * Adds an item to the collection.
            * @param item The item to add
            */
            function add(item) {
                var pkey = item[primary],
                    orig = { };

                //Create the change tracking object
                fields.forEach(copyVal);

                //Store the item, and the original field values for change tracking
                items[pkey] = item;
                original[pkey] = orig;

                //Add the field values
                fields.forEach(addField);

                //Increment the count
                count++;

                /** Copies a value onto the original storage object */
                function copyVal(prop) {
                    orig[prop] = item[prop];
                }

                /** Adds the field to the correct index */
                function addField(field) {
                    //Add the field to the index
                    addToIndex(field, pkey, item[field]);
                }
            }

            /**
            * Removes an item from the collection.
            * @param pkey The primary key value to remove.
            */
            function remove(pkey) {
                var res;

                //Remove from each field
                fields.forEach(remIdx);

                //Remove from original
                delete original[pkey];

                //Get the value so we can return it
                res = items[pkey];

                //Remove from items
                delete items[pkey];

                //Decrement the count.
                count--;

                return res;

                /** Removes the item from the given index */
                function remIdx(field) {
                    removeFromIndex(field, pkey, original[pkey][field]);
                }
            }

            /**
            * Re-reads the values and adjusts the indexed position accordingly
            * @param value The item to update the field values for.
            */
            function update(value) {

                //Get the primary key
                var pkey = value[primary];

                //Update each field
                fields.forEach(updateField);

                /** Updates the specified field for the value */
                function updateField(field) {

                    //Adjust the index position for the value
                    updateValue(pkey, indexes[field], original[pkey][field], value[field]);

                    //Update the dirty tracking
                    original[pkey][field] = value[field];

                    /** Repositions the supplied primary key and value in the indexes */
                    function updateValue(pkey, idx, orig, val) {
                        if (orig !== val) {
                            //Remove the original from the index if it is found
                            removeFromIndex(field, pkey, orig);

                            //Add the new value to the index
                            addToIndex(field, pkey, val);
                        }
                    }

                }
            }

            /**
            * Adds the supplied primary key to the supplied value in the specified index
            * @param field The name of the index to add to.
            * @param pkey The value of the primary key.
            * @param value The field value being added to the index.
            */
            function addToIndex(field, pkey, value) {
                //Get the new position
                var kidx = bindex(field, value);

                //Ensure the primary key is not duplicated
                if (field === primary && indexes[field][kidx] && indexes[field][kidx].value === value) {
                    if (indexes[field][kidx].keys.indexOf(pkey) > -1) {
                        throw new Error('cannot add duplicate primary key ("' + pkey + '")!');
                    }
                }

                if (!indexes[field][kidx] || indexes[field][kidx].value !== value) {
                    //If this is the first at the position, create the key value object
                    indexes[field].splice(kidx, 0, {
                        value: value,
                        keys: []
                    });
                }

                //Add the primary key
                indexes[field][kidx].keys.push(pkey);
            }

            /** Removes the supplied key from the supplied value in the specified index. */
            function removeFromIndex(field, pkey, value) {
                var idx = indexes[field],
                    kidx = bindex(field, value),
                    keys,
                    vidx;

                if (idx[kidx] && idx[kidx].value === value) {
                    //Remove from the existing index
                    keys = idx[kidx].keys;
                    vidx = keys.indexOf(pkey);
                    if (vidx > -1) {
                        //Remove from the key from current position
                        keys.splice(vidx, 1);
                        if (!keys.length) {
                            //No more entries for the field value? Remove the entry.
                            idx.splice(kidx, 1);
                        }
                    }
                }
            }

            /** Searches the collection for the specified value, and returns the key array if it is found. */
            function bfind(field, value) {
                var idx = bindex(field, value);
                if (indexes[field][idx] && indexes[field][idx].value === value) {
                    return indexes[field][idx].keys;
                } else {
                    return null;
                }
            }

            /** Retrieves the index position for the specified field and value combination */
            function bindex(field, value) {
                var arr = indexes[field];
                if (arr.length) {
                    return bidx(arr, value, 0, arr.length - 1);
                } else {
                    return 0;
                }

                /**
                * Performs a binary search on the supplied array for the specified field and value combination
                * @param {Array} arr The array to search through.
                * @param value The field to value to search for.
                * @param {number} low The low position in the array to search from.
                * @param {number} high The high position in the array to search to.
                * @returns The numerical index in the index array where the value can be found, or should be inserted.
                */
                function bidx(arr, value, low, high) {
                    var pivot, val, res;

                    if (low === high) {
                        res = low;
                        if (arr[res] && arr[res].value < value) {
                            res++;
                        }
                    } else {
                        pivot = Math.floor(low / 2 + high / 2);
                        val = arr[pivot].value;
                        if (val === value) {
                            res = pivot;
                        } else if (val < value) {
                            if (pivot + 1 <= high) {
                                pivot++;
                            }
                            res = bidx(arr, value, pivot, high);
                        } else {
                            if (pivot - 1 >= low) {
                                pivot--;
                            }
                            res = bidx(arr, value, low, pivot);
                        }
                    }
                    return res;
                }
            }

            /**
            * Determines the order according to the supplied fields
            * @param {array} fields An array of fields to order by.
            * @param {object} a Item A to compare
            * @param {object} b Item B to compare
            * @return -1 if a is less than b, 0 if they are equal, or 1 if a is greater than b
            */
            function orderByFields(fields, a, b) {

                return doOrderByFields(0);

                /** Performs the reursive calculation */
                function doOrderByFields(fidx) {
                    var fld = fields[fidx];
                    if (fld) {
                        if (a[fld] > b[fld]) {
                            return 1;
                        } else if (a[fld] < b[fld]) {
                            return -1;
                        } else {
                            return doOrderByFields(fidx + 1);
                        }
                    } else {
                        return 0;
                    }
                }
            }

            /** Returns the item with the specified primary key */
            function itemVal(pkey) {
                return items[pkey];
            }

        }
    }

}(window.angular.module('dataConductor')));
(function queue_service(app) {
    'use strict';

    //Register the factory.
    app.factory('jsdcQueue', [queueFactory]);

    /** Provides a queue type */
    function queueFactory() {

        //Return the queue type
        return Queue;

        /** Provides a FIFO list */
        function Queue() {

            //Data storage
            var head = null,
                tail = null,
                cnt = 0;

            //Expose the public API
            this.enqueue = enqueue;
            this.requeue = requeue;
            this.dequeue = dequeue;
            this.remove = remove;
            this.peek = peek;
            this.count = count;
            this.all = all;

            /** Returns an array containing all items in the queue. */
            function all() {
                var res = [],
                    curr = head;
                while (curr) {
                    res.push(curr.data);
                    curr = curr.next;
                }
                return res;
            }

            /**
            * Adds an item to the end of the queue.
            */
            function enqueue(item) {
                if (head === null) {
                    head = tail = {
                        data: item,
                        next: null
                    };
                } else {
                    tail = tail.next = {
                        data: item,
                        next: null
                    };
                }
                cnt++;
            }

            /**
            * Adds an item to the front of the queue.
            */
            function requeue(item) {
                if (head === null) {
                    head = tail = {
                        data: item,
                        next: null
                    };
                } else {
                    head = {
                        data: item,
                        next: head
                    };
                }
                cnt++;
            }

            /** Removes an item from the front of the queue and return it. */
            function dequeue() {
                var res;
                if (head) {
                    res = head.data;
                    head = head.next;
                    if (!head) {
                        tail = null;
                    }
                    cnt--;
                } else {
                    res = null;
                }
                return res;
            }

            /** Removes the specified item from the queue */
            function remove(item) {
                var curr = head;
                if (curr.data === item) {
                    //The item is first
                    return dequeue();
                }

                while (curr.next) {
                    if (curr.next.data === item) {
                        curr.next = curr.next.next || null;
                        cnt--;
                        return item;
                    }
                    curr = curr.next;
                }
                return null;
            }

            /**
            * Peeks count entries into the queue and returns the value.
            * @param {number} count The number of items into the queue to check.
            */
            function peek(count) {
                var i, curr = head;
                count = count || 0;
                for (i = 0; i < count && curr; i++) {
                    curr = curr.next;
                }
                if (curr) {
                    return curr.data;
                } else {
                    return null;
                }
            }

            /** The number of items currently stored in the queue */
            function count() {
                return cnt;
            }

        }

    }

}(window.angular.module('dataConductor')));
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
(function event_emitter_service(app) {
    'use strict';

    //Register the factory
    app.factory('jsdcEventEmitter', [eventEmitterFactory]);

    /** A factory which defines the EventEmitter type, and provides its constructor */
    function eventEmitterFactory() {

        return EventEmitter;

        /**
        * A simple event emitter.
        */
        function EventEmitter() {

            //The event handler storage
            var handlers = { };

            //Expose the public API
            this.on = on;
            this.off = off;
            this.once = once;
            this.many = many;
            this.emit = emit;

            /**
            * Called to add an event handler.
            * @param {string} name The name of the event to hook into.
            * @param {function} The handler to call when the event is raised.
            */
            function on(name, handler) {
                var arr = handlerArray(name);
                arr.push(handler);
            }

            /**
            * Called to remove an existing event handler.
            * @param {string} name The name of the event to remove the handler for.
            * @param {function} handler The handler to remove. If not supplied, all handlers for
            *   the event are removed.
            */
            function off(name, handler) {
                var idx, arr = handlerArray(name, false);
                if (arr) {
                    if (handler) {
                        idx = arr.indexOf(handler);
                        arr.splice(idx, 1);
                    } else {
                        while (arr.length) {
                            arr.pop();
                        }
                    }
                }
            }

            /**
            * Called to add an event handler that will fire no more than one time.
            * @param {string} name The name of the event to hook into.
            * @param {function} The handler to call when the event is raised.
            */
            function once(name, handler) {
                on(name, ohand);
                function ohand() {
                    var args = copyArgs(arguments);
                    handler.apply(handler, args);
                    off(name, ohand);
                }
            }

            /**
            * Called to add an event handler that will fire no more than count times.
            * @param {string} name The name of the event to hook into.
            * @param {number} count The maximum number of times the handler should fire.
            * @param {function} The handler to call when the event is raised.
            */
            function many(name, count, handler) {
                var cnt = 0;
                on(name, ohand);
                function ohand() {
                    var args = copyArgs(arguments);
                    handler.apply(handler, args);
                    cnt++;
                    if (cnt >= count) {
                        off(name, ohand);
                    }
                }
            }

            /**
            * Raises an event, calling all event handlers hooked into it.
            * @param {string} name The name of the events to raise.
            */
            function emit(name) {
                var arr = handlerArray(name, false),
                    args;
                if (arr) {
                    args = copyArgs(arguments);
                    args.shift();
                    arr.forEach(eachHandler);
                }

                /** Executed for each handler to either execute the handler, or defer it to the next digest cycle if we are in an angular context */
                function eachHandler(h) {
                    try {
                        handle(h);
                    } catch (err) {
                        console.error('event handler caused error');
                        console.log(err);
                    }
                }

                /** Performs the actual execution of a given handler */
                function handle(h) {
                    try {
                        h.apply(h, args);
                    } catch (err) {
                        console.warn('Event handler raised an error!');
                        console.error(err);
                    }
                }
            }

            /** Used to copy the arguments array */
            function copyArgs(args) {
                return Array.prototype.slice(args);
            }

            /**
            * Gets the handler array for the specified event.
            * @param {string} name The name of the event to get the handlers for.
            * @param {boolean} create Whether to create the handler array if it does not
            *   exist. Default: true.
            * @returns {array} The handler array for the specified event if available, otherwise null.
            */
            function handlerArray(name, create) {
                var ret;
                create = typeof create === 'boolean' ? create : true;
                if (handlers[name]) {
                    ret = handlers[name];
                } else if (create) {
                    ret = [];
                    handlers[name] = ret;
                } else {
                    ret = null;
                }
                return ret;
            }
        }

    }

}(window.angular.module('dataConductor')));
(function loader_service(sys, app) {
    'use strict';

    //TODO: This class could use a serious reworking for cleanup....
    //TODO: loading, waiting do not handle duplicates very well....
    //  It would probably be better to make these IndexedCollections (using command order as the primary key)

    //Register the factory
    app.factory('jsdcLoaderService', ['$timeout', '$q', 'jsdcEventEmitter', 'jsdcAdapterService', 'jsdcQueue', 'jsdcIndexedPageCache', loaderServiceFactory]);

    /**
    * Creates and returns the LoaderService
    * @param $timeout Used for retries
    * @param $q promises
    * @param EventEmitter The EventEmitter constructor
    * @param AdapterService Used to load global adapters, and to validate adapters.
    * @param Queue The queue used to hold load commands
    * @param IndexedPageCache Used to cache loaded pages
    */
    function loaderServiceFactory($timeout, $q, EventEmitter, AdapterService, Queue, IndexedPageCache) {

        //The batch break object (Used only as a reference)
        var BATCH_BREAK = { },
            //How to deal with requests for indexes already cached
            EXISTING_MODE = LoaderService.EXISTING_MODE = {
                replace: 'replace', //Download a new one
                ignore: 'ignore',   //ignore at load time (Will still be batched)
                drop: 'drop'        //Drops the request before it can be batched
            },
            //The manner in which to handle load requests
            EXECUTION_MODE = LoaderService.EXECUTION_MODE = {
                instant: 'instant',
                delayed: 'delayed'
            },
            //The available batch cancel modes
            BATCH_CANCEL_MODE = LoaderService.BATCH_CANCEL_MODE = {
                all: 'all',
                ignore: 'ignore'
            },
            LOAD_OVERFLOW_MODE = LoaderService.LOAD_OVERFLOW_MODE = {
                error: 'error',
                cancel: 'cancel'
            };

        //The default parallel number of loads
        LoaderService.DEFAULT_PARALLEL = 1;

        //Whether batching should be enabled by default.
        LoaderService.DEFAULT_BATCHING = false;

        //The amount of time to wait if the error mode is requeue before doing so
        LoaderService.DEFAULT_RETRY_DELAY = 2000;

        //How many times to retry on a failed request
        LoaderService.DEFAULT_RETRY_COUNT = 0;

        //The maximum number of items queued or loading.
        LoaderService.DEFAULT_LOAD_MAX = Number.MAX_VALUE;

        //The default maximum number of records
        LoaderService.DEFAULT_BATCH_MAX = Number.MAX_VALUE;

        //The action to take when an item already cached is requested
        LoaderService.DEFAULT_EXISTING_MODE = EXISTING_MODE.drop;

        //The default execution mode
        LoaderService.DEFAULT_EXECUTION_MODE = EXECUTION_MODE.instant;

        //What to do when an item that is part of a batch is cancelled
        LoaderService.DEFAULT_BATCH_CANCEL_MODE = BATCH_CANCEL_MODE.all;

        //When we have to many items to load (in the queue), we should throw an error when a
        //  consumer attempt to add new ones
        LoaderService.DEFAULT_LOAD_OVERFLOW_MODE = LOAD_OVERFLOW_MODE.error;

        //Return the type
        return LoaderService;

        /** A service for managing loading of data from an adapter source. */
        function LoaderService() {
            var self = this,
                //The internal storage values
                internal = {
                    order: 0, //The load order value
                    adapter: null,
                    adapterObject: null,
                    filter: null,
                    cache: new IndexedPageCache(),
                    queue: new Queue(),
                    loadCount: 0,
                    loading: { }, //A reference to items actually being loaded
                    waiting: { }, //A reference to items waiting in a retry delay
                    existingMode: LoaderService.DEFAULT_EXISTING_MODE,
                    executionMode: LoaderService.DEFAULT_EXECUTION_MODE,
                    parallel: LoaderService.DEFAULT_PARALLEL,
                    batching: LoaderService.DEFAULT_BATCHING,
                    retryCount: LoaderService.DEFAULT_RETRY_COUNT,
                    retryDelay: LoaderService.DEFAULT_RETRY_DELAY,
                    batchCancelMode: LoaderService.DEFAULT_BATCH_CANCEL_MODE,
                    batchMax: LoaderService.DEFAULT_BATCH_MAX,
                    loadMax: LoaderService.DEFAULT_LOAD_MAX,
                    loadOverflowMode: LoaderService.DEFAULT_LOAD_OVERFLOW_MODE
                };

            //Inherit from event emitter
            EventEmitter.call(this);

            //Assign the constants
            this.EXISTING_MODE = EXISTING_MODE;
            this.EXECUTION_MODE = EXECUTION_MODE;

            //Assign the public API
            //Accessors
            this.cache = getCache;
            this.adapter = getAdapter;
            this.adapterObject = getAdapterObject;
            this.setAdapter = setAdapter;
            this.filter = getFilter;
            this.setFilter = setFilter;
            this.parallel = getParallel;
            this.setParallel = setParallel;
            this.batching = getBatching;
            this.setBatching = setBatching;
            this.batchCancelMode = getBatchCancelMode;
            this.setBatchCancelMode = setBatchCancelMode;
            this.batchMax = getBatchMax;
            this.loadMax = getLoadMax;
            this.setLoadMax = setLoadMax;
            this.loadOverflowMode = getLoadOverflowMode;
            this.setLoadOverflowMode = setLoadOverflowMode;
            this.setBatchMax = setBatchMax;
            this.executionMode = getExecutionMode;
            this.setExecutionMode = setExecutionMode;
            this.existingMode = getExistingMode;
            this.setExistingMode = setExistingMode;
            this.retryDelay = getRetryDelay;
            this.setRetryDelay = setRetryDelay;
            this.retryCount = getRetryCount;
            this.setRetryCount = setRetryCount;
            this.state = getState;
            this.setState = setState;

            //Functions
            this.load = load;
            this.info = info;
            this.batchBreak = batchBreak;
            this.execute = executeCommands;
            this.clear = clear;

            /** Returns the internal cache */
            function getCache() {
                return internal.cache;
            }

            /** Gets the adapter name or object (as it was set) */
            function getAdapter() {
                return internal.adapter;
            }

            /** Gets the adapter object */
            function getAdapterObject() {
                return internal.adapterObject;
            }

            /**
            * Sets the adapter.
            * @param {string | object} value The global adapter name, or the adapter object to use.
            */
            function setAdapter(value) {
                var adapter, old;
                if (typeof value === 'string') {
                    adapter = AdapterService.global.find(value);
                    if (!adapter) {
                        throw new Error('adapter named "' + value + '" not found!');
                    }
                } else if (typeof value === 'object') {
                    AdapterService.global.validate(value);
                    adapter = value;
                } else {
                    throw new Error('invalid adapter value. MUST be a string or an object. Got a "' + typeof value + '"');
                }
                old = internal.adapter;
                internal.adapter = value;
                if (value !== old) {
                    self.emit('adapterChanged', value, old);
                }
                internal.adapterObject = adapter;
            }

            /** Returns the current filter */
            function getFilter() {
                return internal.filter;
            }

            /** Sets the filter to pass to the adapter on load */
            function setFilter(value) {
                var old;
                if (!sys.equals(internal.filter, value)) {
                    old = internal.filter;
                    internal.filter = value;
                    clear();
                    self.emit('filterChanged', value, old);
                }
            }

            /**
            * Returns the maximum number of parallel loads to perform at a given time.
            */
            function getParallel() {
                return internal.parallel;
            }

            /**
            * Sets the maximum number of parallel loads to perform at any given time.
            * @param {number} value A positive value indicating the maximum number of loads to perform.
            */
            function setParallel(value) {
                var old;
                if (value >= 1) {
                    old = internal.parallel;
                    if (old !== value) {
                        internal.parallel = value;
                        self.emit('parallelChanged', value, old);
                    }
                } else {
                    throw new Error('parallel MUST be a number greater than or equal to 1');
                }
            }

            /**
            * Returns whether request batching is enabled, and sequentuial requests should
            * be grouped together when possible.
            */
            function getBatching() {
                return internal.batching;
            }

            /**
            * Sets whether batching is enabled, and sequentuial requests should
            * be grouped together when possible.
            * @param value A truthy represenation of whether batching is enabled.
            */
            function setBatching(value) {
                var old = internal.batching;
                if (value !== old) {
                    internal.batching = value;
                    self.emit('batchingChanged', value, old);
                }
            }

            /** Returns the currently set maximum number of records to batch together. */
            function getBatchMax() {
                return internal.batchMax;
            }

            /** Updates the maximum number of records to batch together */
            function setBatchMax(value) {
                if (value > 0) {
                    internal.batchMax = value;
                } else {
                    throw new Error('batchMax MUST be a number greater than 0');
                }
            }

            /** Returns the maximum number of items to load */
            function getLoadMax() {
                return internal.loadMax;
            }

            /** Sets the maximum number of items to load */
            function setLoadMax(value) {
                var old;
                if (value > 0) {
                    old = internal.loadMax;
                    if (old !== value) {
                        internal.loadMax = value;
                        purge(value);
                        self.emit('loadMaxChanged', value, old);
                    }
                } else {
                    throw new Error('loadMax MUST be a number greater than 0');
                }
            }

            /** Returns the current batch cancel mode */
            function getLoadOverflowMode() {
                return internal.loadOverflowMode;
            }

            /** Sets the batch cancel mode. */
            function setLoadOverflowMode(value) {
                var old;
                if (LOAD_OVERFLOW_MODE[value]) {
                    old = internal.loadOverflowMode;
                    if (value !== old) {
                        internal.loadOverflowMode = value;
                        self.emit('loadOverflowModeChanged', value, old);
                    }
                } else {
                    throw new Error('invalid loadOverflowMode value "' + value + '". Must be one of the following: ' + Object.keys(LOAD_OVERFLOW_MODE).join(', '));
                }
            }

            /** Returns the current batch cancel mode */
            function getBatchCancelMode() {
                return internal.batchCancelMode;
            }

            /** Sets the batch cancel mode. */
            function setBatchCancelMode(value) {
                var old;
                if (BATCH_CANCEL_MODE[value]) {
                    old = internal.batchCancelMode;
                    if (value !== old) {
                        internal.batchCancelMode = value;
                        self.emit('batchCancelModeChanged', value, old);
                    }
                } else {
                    throw new Error('invalid batchCancelMode value "' + value + '". Must be one of the following: ' + Object.keys(BATCH_CANCEL_MODE).join(', '));
                }
            }

            /**
            * Returns the current execution mode.
            */
            function getExecutionMode() {
                return internal.executionMode;
            }

            /**
            * Sets the execution mode.
            * @param {string} value The execution mode.
            */
            function setExecutionMode(value) {
                var old;
                if (EXECUTION_MODE[value]) {
                    old = internal.executionMode;
                    if (value !== old) {
                        internal.executionMode = value;
                        self.emit('executionModeChanged', value, old);
                    }
                } else {
                    throw new Error('invalid executionMode value "' + value + '". Must be one of the following: ' + Object.keys(EXECUTION_MODE).join(', '));
                }
            }

            /** How to deal with load requests of existing items */
            function getExistingMode() {
                return internal.existingMode;
            }

            /**
            * Sets what to do when an item already exists in the cache and a load is requested.
            */
            function setExistingMode(value) {
                var old;
                if (EXISTING_MODE[value]) {
                    old = internal.existingMode;
                    if (value !== old) {
                        internal.existingMode = value;
                        self.emit('existingModeChanged', value, old);
                    }
                } else {
                    throw new Error('invalid existing mode value "' + value + '". MUST be one of the following: ' + Object.keys(EXISTING_MODE).join(', '));
                }
            }

            /** Returns the number of milliseconds to wait between retries after request failure. */
            function getRetryDelay() {
                return internal.retryDelay;
            }

            /**
            * Sets the amount of time to wait between retries after request failure.
            * @param {number} value The time to wait between retries.
            */
            function setRetryDelay(value) {
                var old;
                if (value >= 0) {
                    old = internal.retryDelay;
                    if (value !== old) {
                        internal.retryDelay = value;
                        self.emit('retryDelayChanged', value, old);
                    }
                } else {
                    throw new Error('retryDelay MUST be number greater than or equal to 0');
                }
            }

            /** Returns the maximum number of times to retry before returning failure. */
            function getRetryCount() {
                return internal.retryCount;
            }

            /**
            * Sets the maximum number of times to retry before returning an error
            * @param {number} value
            */
            function setRetryCount(value) {
                var old;
                if (value >= 0) {
                    old = internal.retryCount;
                    if (value !== old) {
                        internal.retryCount = value;
                        self.emit('retryCountChanged', value, old);
                    }
                } else {
                    throw new Error('retryCount MUST be number greater than or equal to 0');
                }
            }

            /** Returns an object representing the configuration state of the loader */
            function getState() {
                return {
                    adapter: self.adapter(),
                    filter: self.filter(),
                    existingMode: self.existingMode(),
                    executionMode: self.executionMode(),
                    parallel: self.parallel(),
                    batching: self.batching(),
                    retryCount: self.retryCount(),
                    retryDelay: self.retryDelay(),
                    batchCancelMode: self.batchCancelMode()
                };
            }

            /** Allows the configuration to be updated in bul */
            function setState(value) {
                if (!value || typeof value  !== 'object') {
                    throw new Error('supplied state MUST be an object');
                }
                if (value.hasOwnProperty('adapter')) {
                    self.setAdapter(value.adapter);
                }
                if (value.hasOwnProperty('filter')) {
                    self.setFilter(value.filter);
                }
                if (value.hasOwnProperty('existingMode')) {
                    self.setExistingMode(value.existingMode);
                }
                if (value.hasOwnProperty('executionMode')) {
                    self.setExecutionMode(value.executionMode);
                }
                if (value.hasOwnProperty('parallel')) {
                    self.setParallel(value.parallel);
                }
                if (value.hasOwnProperty('batching')) {
                    self.setBatching(value.batching);
                }
                if (value.hasOwnProperty('batchMax')) {
                    self.setBatchMax(value.batchMax);
                }
                if (value.hasOwnProperty('loadMax')) {
                    self.setLoadMax(value.loadMax);
                }
                if (value.hasOwnProperty('loadOverflowMode')) {
                    self.setLoadOverflowMode(value.loadOverflowMode);
                }
                if (value.hasOwnProperty('retryCount')) {
                    self.setRetryCount(value.retryCount);
                }
                if (value.hasOwnProperty('retryDelay')) {
                    self.setRetryDelay(value.retryDelay);
                }
                if (value.hasOwnProperty('batchCancelMode')) {
                    self.setBatchCancelMode(value.batchCancelMode);
                }
            }

            /**
            * Loads the page with the specified index from the adapter.
            * @param {number} index The page index to load
            * @returns A promise that will be resolved once the load has been completed.
            */
            function load(index, cancel) {
                var ldeferred, cdeferred, command, ps, info;
                index = parseInt(index, 10);
                if (isNaN(index)) {
                    throw new Error('supplied index MUST be a number');
                }

                ldeferred = $q.defer();

                //If the record exists and the existing mode is set to drop, we drop the load request,
                //  and immediately return the data.
                if (self.existingMode() === EXISTING_MODE.drop) {

                    //Check if we have an existing entry which has not been cancelled.
                    info = self.info(index);
                    if (info.exists && !info.cancelled) {
                        self.emit('dropped', index);
                        if (info.cached) {
                            ldeferred.resolve(info.cached);
                        } else {
                            info.loaded
                                .then(ldeferred.resolve)
                                .catch(ldeferred.reject);
                        }
                        return ldeferred.promise;
                    }
                }

                internal.order = (internal.order + 1) % (Number.MAX_SAFE_INTEGER || Number.MAX_VALUE);
                ps = internal.cache.pageSize();

                cdeferred = $q.defer();
                command = {
                    index: index * ps, //We want the item index, not the page index
                    order: internal.order,
                    loaded: ldeferred,
                    cancel: docancel,
                    userCancel: cdeferred.promise,
                    cancelled: false,
                    retry: self.retryCount(),
                    loading: false,
                    count: ps
                };
                if (cancel) {
                    if (typeof cancel.then === 'function') {
                        cancel.then(docancel);
                    } else {
                        throw new Error('when supplied, cancel MUST be a promise');
                    }
                }

                //Enqueue the command
                internal.queue.enqueue(command);

                //Have we overflowed?
                if (queueLoadCount() > self.loadMax()) {
                    if (self.loadOverflowMode() === LOAD_OVERFLOW_MODE.cancel) {
                        purge(self.loadMax());
                    } else {
                        throw new Error('loadMax loads reached. Wait until some loads have completed before attempting to load new records.');
                    }
                }

                if (internal.executionMode === EXECUTION_MODE.instant) {
                    //Execute immediately
                    self.execute();
                }

                //Return the load promise.
                return ldeferred.promise;

                /** Resolves the cancel promise, so that any cancel code that needs to run can be */
                function docancel() {
                    cdeferred.resolve();
                    if (!command.cancelled) {
                        command.cancelled = true;
                        //If we are loading the code inside execute will manage the cancel
                        if (!command.loading) {
                            internal.queue.remove(command);
                        }
                    }
                }

                function queueLoadCount() {
                    return internal.queue.count() + Object.keys(internal.loading).length + Object.keys(internal.waiting).length;
                }
            }

            /** Removes all data from the cache,  */
            function clear() {
                self.cache().clear();

                //Get loading, queued and waiting, and cancel them all
                var others = self.info();
                others.forEach(cancel);

                /** Calls the cancel function on the supplied item */
                function cancel(item) {
                    item.cancel();
                }
            }

            /** Checks whether the given page index exists in the cache or is being loaded */
            function exists(index) {
                var data = self.info(index);
                return data.cached || data.loading || data.queued || data.waiting;
            }

            /**
            * Returns information regarding the specific index, or information on all elements
            *   if no index is supplied.
            * @param {number} index The index to load the info for. If this is not supplied info for
            *   all will be supplied in an array.
            */
            function info(index) {
                var queue = sparseIndex(internal.queue.all());
                if (arguments.length > 0) {
                    return indexInfo(index, queue);
                } else {
                    return allInfo(queue);
                }

                /**
                * Converts the given array into an object using the item index
                * properties as property names on the object
                */
                function sparseIndex(arr) {
                    var i, res = { },
                        pidx;
                    for (i = 0; i < arr.length; i++) {
                        pidx = Math.floor(arr[i].index / arr[i].count);
                        res[pidx] = arr[i];
                    }
                    return res;
                }
            }

            /** Loads information for a single index */
            function indexInfo(index, queue) {
                var queued,
                    loading,
                    waiting,
                    cache,
                    info;

                //Get the data (if there is any)
                cache = self.cache().data(index);

                //Get the values
                queued = queue[index];
                loading = internal.loading[index];
                waiting = internal.waiting[index];

                //Create the info object
                info = itemInfo(index, cache, queued, loading, waiting);

                //Give the info back to the consumer
                return info;
            }

            /** Loads information for all the indexes (cached, loading, queued and waiting) */
            function allInfo(queue) {
                var i, res, cached, cache, indexes, qindexes, info;

                res = [];
                qindexes = Object.keys(queue)
                    .map(asInt);

                //Get all stored data
                cached = internal.cache.cached();

                //Get a distinct list of all indexes (cached, queued and loading)
                indexes = cached.map(indexValue);
                indexes = indexes.concat(qindexes);
                indexes = indexes.concat(Object.keys(internal.loading).map(asInt));
                indexes = indexes.concat(Object.keys(internal.waiting).map(asInt));
                indexes = indexes.filter(unique);

                //Process all indexes.
                for (i = 0; i < indexes.length; i++) {

                    //Since we have cached records first,
                    //  we can assume that if this is within
                    //  the cache count, this index is cached.
                    cache = i < cached.length ? cached[i] : null;

                    //Create the info entry
                    info = itemInfo(indexes[i], cache, queue[indexes[i]], internal.loading[indexes[i]], internal.waiting[indexes[i]]);

                    //Add the entry to the return data
                    res.push(info);
                }

                //Finally sort by index.
                res.sort(byIndex);

                //Return the data to the consumer
                return res;

                /** Returns the supplied value as an integer. */
                function asInt(val) {
                    return parseInt(val, 10);
                }

                /** Allows duplicates to be filtered */
                function unique(val, i, arr) {
                    return arr.indexOf(val) === i;
                }

                /** Sorts by index */
                function byIndex(a, b) {
                    return a.index - b.index;
                }
            }

            /** Builds up an item information object */
            function itemInfo(index, cache, queue, loading, waiting) {
                var command = null,
                    loaded,
                    cancel;

                //If the data is not cached, we should have a command.
                if (!cache) {
                    command = queue || loading || waiting;
                }

                //If we have a command, copy the loaded promise and cancel function
                //  from there.
                if (command) {
                    loaded = command.loaded.promise;
                    cancel = command.cancel;
                } else {
                    //If the item does not exist, the promise will return null,
                    //  otherwise the existing cached data will be returned.
                    loaded = $q.defer();
                    loaded.resolve(cache || null);
                    loaded = loaded.promise;
                    cancel = noop;
                }

                return {
                    index: index,
                    exists: !!cache || !!loading || !!waiting || !!queue,
                    cached: cache,
                    cancelled: (command && command.cancelled) || false,
                    //command: command,
                    loading: !!loading,
                    waiting: !!waiting,
                    queued: !!queue,
                    cancel: cancel,
                    loaded: loaded
                };
            }

            /**
            * Inserts a noop action into the queue which can be used to prevent query batching.
            * This is only useful if batching is enabled.
            */
            function batchBreak() {
                //Just add a break onto the queue.
                internal.queue.enqueue(BATCH_BREAK);
            }

            /** Runs the execute function in parallel until there are not commands left. */
            function executeCommands(single) {
                var deferred,
                    res = [],
                    tmp = new Error();

                tmp = tmp.stack;

                deferred = $q.defer();
                if (internal.queue.count()) {
                    if (single) {
                        runner();
                    } else {
                        //Begin execution
                        executeRunners();
                    }
                } else {
                    deferred.resolve(res);
                }

                //This will be resolved once all loads are done.
                return deferred.promise;

                /** Executes the maximum number of runners allowed */
                function executeRunners() {
                    var prl = self.parallel();
                    while (internal.loadCount < prl && internal.queue.count()) {
                        runner();
                    }
                }

                /**
                * Executes a runner. Note: Calling this with nothing on the queue
                *    will cause unterminated execution.
                */
                function runner() {
                    internal.loadCount++;
                    execute()
                        //Execute will never reject its promise, so we only use
                        //    success and finally (though we could use only 1).
                        .then(success)
                        .finally(done);
                }

                /** Called when data has been sucesfully received */
                function success(data) {
                    res.push(data);
                }

                /** Called once the execution function returns. */
                function done() {
                    internal.loadCount--;
                    if (!single && internal.queue.count()) {
                        executeRunners();
                    } else {
                        //Complete with all the pages loaded.
                        deferred.resolve(res);
                    }
                }
            }

            /** Executes the next set of commands and ties up to the completion event to run again */
            function execute() {

                //Get the next load command
                var i, idx, command, complete, deferred;

                //We cannot do anything without an adapter
                if (!internal.adapterObject) {
                    throw new Error('adapter has not been set. You must set an adapter before calling execute.');
                }

                //Get the next command
                command = batch();

                //Keep reading until we have an actual load command.
                while (command === null && internal.queue.count()) {
                    command = batch();
                }

                //Create an execution deferal
                deferred = $q.defer();

                if (command) {
                    //Go through the queue commands and indicate
                    //  that we have started loading, and tie up
                    //  the cancel promise.
                    for (i = 0; i < command.commands.length; i++) {
                        idx = Math.floor(command.commands[i].index / command.commands[i].count);
                        internal.loading[idx] = command.commands[i];
                        command.commands[i].loading = true;
                        if (command.commands[i].userCancel) {
                            command.commands[i].userCancel
                                .then(cancelled.bind(null, command.commands[i].index));
                        }
                    }

                    //Create the http cancel token
                    command.cancel = $q.defer();

                    //Make the call
                    complete = internal.adapterObject.find(internal.filter, {
                        skip: command.index,
                        limit: command.count,
                        cancel: command.cancel.promise
                    });

                    complete
                        .then(completed)
                        .catch(error);
                } else {
                    deferred.resolve([]);
                }

                //return the promise
                return deferred.promise;

                /** Called when the load has completed */
                function completed(data) {
                    var i, base, start, end, cmd, idx, sliced,
                        indexes = command.commands.map(indexValue);
                    command.cancelled = true;
                    base = Math.min.apply(Math, indexes);

                    //Complete the loads
                    for (i = 0; i < command.commands.length; i++) {
                        cmd = command.commands[i];

                        //We are no longer loading
                        idx = Math.floor(cmd.index / cmd.count);
                        delete internal.loading[idx];

                        //Get the bounds in the data for the page
                        start = cmd.index - base;
                        end = start + cmd.count;

                        //Perform the cache if necesary
                        if (self.existingMode() !== EXISTING_MODE.ignore || self.cache().info(idx) === null) {
                            //Cache the item only if the mode is not ignore or it does not exist
                            self.cache().cache(idx, data.slice(start, end));
                        }
                    }

                    for (i = 0; i < command.commands.length; i++) {
                        cmd = command.commands[i];

                        //Get the bounds in the data for the page
                        start = cmd.index - base;
                        end = start + cmd.count;

                        //Get the data for this page
                        sliced = data.slice(start, end);

                        //Get the page index
                        idx = Math.floor(cmd.index / cmd.count);

                        //Emit the event
                        self.emit('loaded', idx, sliced);

                        //Pass the page off.
                        cmd.loaded.resolve(data.slice(start, end));
                    }

                    //Format the return data
                    data = {
                        indexes: indexes,
                        data: data
                    };

                    //Resolve the execute promise
                    deferred.resolve(data);

                    //Emit the executed event
                    self.emit('executed', data);
                }

                /** Called when an error has occured during the load. */
                function error(err) {
                    var i, delay, idx;
                    command.cancelled = true;
                    for (i = 0; i < command.commands.length; i++) {
                        if (command.commands[i].retry) {
                            //Decrement retry, wait the retry delay and then requeue the
                            //  command so it can be retried.
                            command.commands[i].retry--;
                            delay = self.retryDelay();
                            requeue = cancelQueueCommand.bind(null, command.commands[i]);
                            idx = Math.floor(command.commands[i].index / command.commands[i].count);
                            if (!Array.isArray(internal.waiting[idx])) {
                                internal.waiting[idx] = [];
                            }
                            internal.waiting[idx].push(command.commands[i]);
                            if (delay) {
                                $timeout(requeue.bind(null, i), delay);
                            } else {
                                requeue();
                            }
                        } else {
                            //No more retries, remove from the queue and return the error.
                            cancelQueueCommand(command.commands[i], err);
                        }
                    }
                    deferred.reject(err);

                    /** Requeues the queue command with the specified index */
                    function requeue(i) {
                        //No longer waiting
                        var idx, pidx;
                        pidx = command.commands[i].index / command.commands[i].count;
                        idx = internal.waiting[pidx].indexOf(command.commands[i]);
                        internal.waiting[pidx].splice(idx, 1);
                        if (internal.waiting[pidx].length === 0) {
                            delete internal.waiting[pidx];
                        }
                        //Requeue the command
                        cancelQueueCommand(command.commands[i]);
                    }
                }

                /** Called when any of the queue commands that are part of this are cancelled. */
                function cancelled(index) {
                    var i, uc;
                    if (!command.cancelled) {
                        //If we do not ignore, we cancel the en
                        if (self.batchCancelMode() === BATCH_CANCEL_MODE.all) {
                            //Only allow this to be called once.
                            command.cancelled = true;

                            //Cancel the http load.
                            command.cancel.resolve();

                            //Requeue all others
                            for (i = 0; i < command.commands.length; i++) {
                                cancelQueueCommand(command.commands[i], command.commands[i].index === index ? 'cancelled' : false);
                            }
                            //Reject the promise returned by execute
                            deferred.reject('cancelled');
                        } else if (self.batchCancelMode() === BATCH_CANCEL_MODE.ignore) {
                            uc = command.commands.filter(uncancelled);
                            //Is this the last command left to cancel?
                            if (uc.length === 1) {
                                //Prevent any more cancel calls
                                command.cancelled = true;
                                //Cancel the http load only if there are not other commands being loaded.
                                command.cancel.resolve();
                                //Reject the promise returned by execute
                                deferred.reject('cancelled');
                            }

                            for (i = 0; i < command.commands.length; i++) {
                                if (command.commands[i].index === index) {
                                    cancelQueueCommand(command.commands[i], 'cancelled');
                                }
                            }
                        } else {
                            throw new Error('unrecognised batch cancel mode "' + self.batchCancelMode() + '"');
                        }
                    }

                    /** Returns whether the command has not been cancelled */
                    function uncancelled(item) {
                        return !item.cancelled;
                    }
                }

                /**
                * Cancels the queue command.
                * @param {object} command The queue command to cancel
                * @param {boolean} reason The reason the command is being rejected.
                *   If this is not supplied, the command will be requeued.
                */
                function cancelQueueCommand(command, reason) {
                    var idx;
                    if (reason) {
                        //Set to cancelled
                        command.cancelled = true;
                        //The load has failed.
                        command.loaded.reject(reason);
                    } else {
                        //Set loading back to false
                        command.loading = false;
                        //Set cancelled back to false
                        command.cancelled = false;
                        //Requeue the command so it can be executed again.
                        internal.queue.requeue(command);
                        //Start the execution process
                        if (self.executionMode() === EXECUTION_MODE.delayed) {
                            //true executes only a single command (ie. The one we have just requeued)
                            self.execute(true);
                        } else {
                            //Executes all commands currenty on the queue
                            self.execute();
                        }
                    }
                    idx = Math.floor(command.index / command.count);
                    delete internal.loading[idx];
                }
            }

            /**
            * Attempts to create a batch from the next set of items in the queue.
            * If batching is enabled, only the first item will be returned.
            */
            function batch() {
                var current, data, pidx, command = null;

                //This will get the next command to perform off the queue.
                while (!command || canMerge(command, internal.queue.peek())) {

                    //Get the next item off the queue
                    current = internal.queue.dequeue();

                    //This will only ever happen on the first iterarion as
                    //  canMerge will reject batch break as the next item
                    if (!current || current === BATCH_BREAK) {
                        break;
                    }

                    //On the first iteration we need to create the command.
                    if (!command) {
                        command = createCommand(current.index);
                    }

                    //Merge the queue command into the load command
                    mergeCommand(command, current);
                }

                //If the command is a single item, and existing mode is ignore , we should check for the
                //  index in the cache, and if it exists, return null so the command is ignored.
                if (command && command.commands.length === 1 && self.existingMode() === EXISTING_MODE.ignore) {
                    pidx = Math.floor(command.index / command.count);
                    data = exists(pidx);
                    if (data) {
                        self.emit('ignored', pidx);
                        if (Array.isArray(data)) {
                            //We have cached data
                            command.commands[0].loaded.resolve(data);
                        } else {
                            //We have data being queried for
                            data.loaded.promise
                                .then(command.commands[0].loaded.resolve)
                                .catch(command.commands[0].loaded.reject);
                        }
                        command = null;
                    }
                }

                //Return the load command
                return command;

                /** Creates a load command base   d at the specified index */
                function createCommand(index) {
                    var command = {
                        index: index,
                        count: 0,
                        commands: [],
                        cancelled: false
                    };
                    return command;
                }

                /** Merges a queue command into a load command. This function assumes the 2 are mergable */
                function mergeCommand(cmd, qcmd) {
                    //Note: Once here, we already know they can be merged
                    if (cmd.index === qcmd.index) {
                        cmd.count = Math.max(cmd.count, qcmd.count);
                    } else {
                        cmd.count += qcmd.count;
                        if (qcmd.index < cmd.index) {
                            cmd.index -= qcmd.count;
                        }
                    }

                    //Add the command to the commands array
                    cmd.commands.push(qcmd);
                }

                /** Checks that the queue command can be merged with the command */
                function canMerge(cmd, qcmd) {
                    var res = false;
                    if (self.batching() && qcmd && qcmd !== BATCH_BREAK) {
                        if (cmd.count < self.batchMax()) {
                            res = cmd.index === qcmd.index ||
                                cmd.index + cmd.count === qcmd.index ||
                                cmd.index - qcmd.count === qcmd.index;
                        }
                    }
                    return res;
                }
            }

            /** Purges loading items until we are under loadMax */
            function purge(cnt) {
                var lcount = internal.queue.count() +
                    Object.keys(internal.loading).length +
                    Object.keys(internal.waiting).length,
                    lm = self.loadMax(),
                    commands;

                if (lcount > lm) {
                    //Get all commands
                    commands = internal.queue.all()
                        .concat(Object.keys(internal.loading).map(item.bind(internal.loading)))
                        .concat(Object.keys(internal.loading).map(item.bind(internal.waiting)));
                    commands.sort(byOrder);

                    while (commands.length > lm) {
                        commands[0].cancel();
                        commands.shift();
                    }
                }

                /** Return the item */
                function item(val) {
                    return this[val];
                }

                /** Sorts by the order property */
                function byOrder(a, b) {
                    return a.order - b.order;
                }
            }

            /** Returns the index property on the given item */
            function indexValue(item) {
                return item.index;
            }

            /** Does nothing */
            function noop() { }

        }

    }

}(window.angular, window.angular.module('dataConductor')));
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

            this.batchCancelMode = internal.loader.batchCancelMode;
            this.setBatchCancelMode = internal.loader.setBatchCancelMode;

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
    });
}(define));
