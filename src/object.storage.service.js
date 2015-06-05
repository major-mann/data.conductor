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
