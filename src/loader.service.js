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
                                if (command.commands.index === index) {
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
