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
