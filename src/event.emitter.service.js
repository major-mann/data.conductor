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
