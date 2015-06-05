(function people(app) {

    app.factory('demoPeople', ['$q', '$timeout', 'demoConfig', peopleFactory]);
    function peopleFactory($q, $timeout, config) {
        var firstNames = ['Ramonita', 'Ethelene', 'Angelyn', 'Thomasina', 'Gearldine', 'Ola', 'Dierdre',
                'Hyman', 'Sima', 'Rolf', 'Madelene', 'Joie', 'Marissa', 'Eneida', 'Elvia', 'Aubrey',
                'Dorothea', 'Jolanda', 'Candida', 'Tilda', 'Marcelino', 'Enda', 'Antonina', 'Leonila',
                'Ellan', 'Bianca', 'Vito', 'Aurelio', 'Aileen', 'Diego'],
            lastNames = ['Wagnon', 'Nale', 'Mcgaughey', 'Rooney', 'Hemenway', 'Valasquez', 'Daniel',
                'Mcclintock', 'Magrath', 'Hasan', 'Glassman', 'Bramblett', 'Acton', 'Putt', 'Inge',
                'Palmisano', 'Uhrich', 'Clampitt', 'Lieu', 'Lung', 'Holts', 'Jameson', 'Jarvis',
                'Honn', 'Pletcher', 'Bergan', 'Simeone', 'Laakso', 'Fricke', 'Roberto'],
            addresses = ['Dogwood Lane', 'Chestnut Avenue', 'Cemetery Road', 'Brook Lane', 'Hanover Court',
                'Cypress Court', 'Hillcrest Drive', 'Evergreen Lane', '14th Street', 'Lexington Drive',
                'White Street', 'Willow Lane', 'Cooper Street', 'Sheffield Drive', 'School Street',
                'Adams Street', 'Grove Street', 'Beechwood Drive', 'Glenwood Drive', 'William Street',
                'Pine Street', 'Victoria Court', 'Mill Road', 'Crescent Street', 'Hamilton Road',
                'Country Club Drive', 'Front Street North', 'Grand Avenue', 'Linden Street', 'John Street'],
            company = ['Can-plex', 'Streetholding', 'Cannix', 'Whiteice', 'Ronfan', 'Bluestrip', 'Freshstrip',
                'Biogreen', 'K-dax', 'Lattax', 'Stim-fase', 'Unorancone', 'Betalex', 'Templane', 'goodlax',
                'zotis', 'zamcon', 'trustity', 'Sol-tom', 'Jobin', 'Round-trans', 'treelab', 'saofax',
                'Haytonlax', 'Vivatrans', 'Lamron', 'villahigh', 'Dingjob', 'Solzoflex', 'Tamfax'],
            data;

        data = generateData(1000);

        return {
            find: find,
            count: count
        };

        /** Searches the dataset for the given values */
        function find(filter, args) {
            var d, tout, deferred = $q.defer();
            if (filter) {
                d = wlFilter(data, filter).results;
                if (filter.sort) {
                    sort(d, filter.sort);
                }
            } else {
                d = data;
            }
            d = d.map(mapItem);
            if (config.latency) {
                tout = $timeout(function () {
                    deferred.resolve(d.slice(args.skip, args.skip + args.limit));
                }, config.latency);
                if (args.cancel) {
                    args.cancel.then(function () {
                        $timeout.cancel(tout);
                        deferred.reject('cancelled');
                    });
                }
            } else {
                deferred.resolve(d.slice(args.skip, args.skip + args.limit));
            }

            return deferred.promise;

            function mapItem(item, i) {
                return {
                    index: i,
                    first: item.first,
                    last: item.last,
                    company: item.company,
                    address: item.address
                };
            }
        }

        /** Returns the total number of items for the given filter */
        function count(filter, args) {
            var d, tout, deferred = $q.defer();
            if (filter) {
                d = wlFilter(data, filter).results;
            } else {
                d = data;
            }
            if (config.latency) {
                tout = $timeout(function () {
                    deferred.resolve(d.length);
                }, config.latency);
                if (args && args.cancel) {
                    args.cancel.then(function () {
                        $timeout.cancel(tout);
                    });
                }
            } else {
                deferred.resolve(d.length);
            }
            return deferred.promise;
        }

        /** Sorts in order of the fields */
        function sort(data, fields) {
            fields = asArray(fields);
            if (!fields.length) {
                //Do nothing
                return;
            }
            data.sort(dosort.bind(null, fields));

            function dosort(fields, a, b) {
                var fld = fields[0],
                    desc = false;

                fld = fld.split(' ');
                if (fld.length > 1) {
                    if (fld[1] === 'desc') {
                        desc = true;
                    }
                }
                fld = fld[0];

                a = a[fld];
                b = b[fld];

                if (a === b) {
                    if (fields.length === 1) {
                        return 0;
                    } else {
                        return dosort(fields.slice(1));
                    }
                } else if (a > b) {
                    if (desc) {
                        return -1;
                    } else {
                        return 1;
                    }
                } else {
                    if (desc) {
                        return 1;
                    } else {
                        return -1;
                    }
                }
            }

            function asArray(fields) {
                if (Array.isArray(fields)) {
                    return fields.slice();
                } else if (typeof fields === 'string') {
                    return [fields];
                } else if (typeof fields === 'object') {
                    return Object.keys(fields).map(objectValue.bind(null, fields));
                } else {
                    throw new Error('fields MUST be an object, array or string')
                }

                function objectValue(obj, name) {
                    if (obj[name] === 'desc' || obj[name] < 0) {
                        return name + ' desc';
                    } else {
                        return name;
                    }
                }
            }
        }

        /** Generates a random dataset using the names above */
        function generateData(count) {
            var i, fname, lname, cname, add, num, res;
            res = [];
            for (i = 0; i < count; i++) {
                fname = rand(firstNames.length);
                lname = rand(lastNames.length);
                cname = rand(company.length);
                add = rand(addresses.length);
                num = rand(1000);
                res.push({
                    first: firstNames[fname],
                    last: lastNames[lname],
                    address: num + ' ' + addresses[add],
                    company: company[cname]
                });
            }
            return res;

            /** Convienience random number function between 0 and max (Exclusive) */
            function rand(max) {
                return Math.floor(Math.random() * max);
            }
        }
    }

}(window.angular.module('pagerDemo')));
