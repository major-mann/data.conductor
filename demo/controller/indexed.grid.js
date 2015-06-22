(function indexed_grid(app) {
    'use strict';

    app.controller('IndexedGridController', ['$scope', '$q', 'demoConfig', 'demoPeople', 'jsdcIndexedPagerService', indexedGridController]);

    var iconDown = 'glyphicon glyphicon-chevron-down',
        iconUp = 'glyphicon glyphicon-chevron-up';

    function indexedGridController($scope, $q, config, people, Pager) {

        var pager, count, pageCount, hashes = { }, tags = [], tagValues = [];

        //Initialise the pager and set people as the adapter
        pager = new Pager();
        pager.setAdapter(people);
        pager.setPageSize(5);
        pager.setBatching(true);
        pager.setFilter({
            sort: 'first'
        });

        people.request.then(noop, noop, onDataRequest);
        people.response.then(noop, noop, onDataResponse);

        //Initially, report the count as massive
        count = pageCount = Number.MAX_SAFE_INTEGER || Number.MAX_VALUE;

        //Intialise the scope
        $scope.current = null;
        $scope.info = [];
        $scope.count = 0;
        $scope.latency = config.latency;
        $scope.requests = [];

        //Initialise the pager options scope
        $scope.options = pager.state();
        $scope.options.index = 0;

        //Sort values
        $scope.sort = {
            first: true,
            last: null,
            company: null,
            address: null
        };
        $scope.sortValue = 'first';

        //The actions used by the view
        $scope.action = {
            prev: previous,
            next: next,
            change: change,
            sort: sortBy
        };

        //View styles
        $scope.style = {
            sort: {
                first: iconDown,
                last: '',
                company: '',
                address: ''
            },
            first: true,
            last: true
        };

        //Assign the watches to maintain state
        $scope.$watchCollection('sort', onSortChanged);
        $scope.$watch('sortValue', onSortValueChanged);
        $scope.$watchCollection('options', onOptionChanged);
        $scope.$watch('count', onCountChanged);
        $scope.$watch('latency', onLatencyChanged);

        //-----------------------------------------
        //--------------VIEW ACTIONS---------------
        //-----------------------------------------

        /** Adjusts the sorting values */
        function sortBy(value) {
            if ($scope.sort[value] === null) {
                $scope.sort.first = null;
                $scope.sort.last = null;
                $scope.sort.company = null;
                $scope.sort.address = null;
                $scope.sort[value] = true;
            } else {
                $scope.sort[value] = !$scope.sort[value];
            }
        }

        /** Moves to the previous page if there is one. */
        function previous() {
            if ($scope.options.index > 0) {
                $scope.options.index--;
            }
        }

        /** Changes the page to the supplied page number (1 based) */
        function change(index) {
            $scope.options.index = index;
        }

        /** Moves to the next page */
        function next() {
            if ($scope.options.index < pageCount - 1) {
                $scope.options.index++;
            }
        }

        //-----------------------------------------
        //------------EVENT HANDLERS---------------
        //-----------------------------------------

        /** Called once the count has been received */
        function onGotCount(cnt) {
            $scope.count = count = cnt;
            pageCount = Math.ceil(cnt / pager.pageSize());
            $scope.info = pageInfo();
        }

        /** Called when the sort value has changed and the data should be adapted */
        function onSortValueChanged() {
            $scope.options.filter = { sort: $scope.sortValue };
        }

        /** Called when data is requested from the people adapter */
        function onDataRequest(info) {
            var tag = info.tag,
                filter = info.filter,
                args = info.args,
                request = {
                    completed: false,
                    skip: args.skip,
                    count: args.limit
                };
            tags.push(tag);
            tagValues.push(request);
            $scope.requests.push(request);
        }

        /** Called when data is returned from the people adapter */
        function onDataResponse(info) {
            var tag = info.tag,
                idx = tags.indexOf(tag),
                value = tagValues[idx];
            tags.splice(idx, 1);
            tagValues.splice(idx, 1);
            value.completed = true;
        }

        /**
        * Raised when an option has changed.
        *   This will update the pager, and refresh the data
        *   once the update is done.
        */
        function onOptionChanged() {
            var prom = pager.setState($scope.options);
            prom.then(ref, error, ref);
            ref();

            /** Refreshes the current data */
            function ref() {
                refresh(true);
            }
        }

        /** Called when the latency option has changed */
        function onLatencyChanged(value) {
            if (value >= 0) {
                config.latency = value;
            }
        }

        /** Called when the count scope value has been changed */
        function onCountChanged(value) {
            pager.updateCount(value);
            refresh(false);
        }

        /**
        * Raised when a property on the sort object has changed.
        *   Updates the individual sort values to their correct
        *   value according to the sort value set.
        */
        function onSortChanged() {

            //Update the style values
            Object.keys($scope.sort)
                .forEach(updateValue);

            function updateValue(name) {
                var val = $scope.sort[name],
                    field,
                    desc;
                switch (val) {
                case true:
                    field = name;
                    desc = '';
                    $scope.style.sort[name] = iconDown;
                    break;
                case false:
                    field = name;
                    field += ' desc';
                    $scope.style.sort[name] = iconUp;
                    break;
                default:
                    $scope.style.sort[name] = '';
                    break;
                }

                if (field) {
                    $scope.sortValue = field;
                }
            }
        }

        //-----------------------------------------
        //----------------FUNCTIONS----------------
        //-----------------------------------------

        /** Refreshes the scope data with the most up to date pager data */
        function refresh(current) {
            $scope.info = pageInfo();
            if (current) {
                $scope.current = viewPage($scope.options.index, $scope.options.pageSize);
            }
            $scope.style.first = $scope.options.index === 0;
            $scope.style.last = $scope.options.index === Math.ceil(count / $scope.options.pageSize) - 1;

            //Refresh the count
            pager.count().then(onGotCount);
        }

        /** Writes an error to the console if it is not "cancelled" */
        function error(err) {
            if (err !== 'cancelled') { //We don't care about cancelled.
                //TODO: It may be useful in some cases to display the error. Which cases?
                console.error(err);
            }
        }

        /** Gets the page information, and loads fake data if there is no data available */
        function viewPage(index, count) {
            var page = pager.page(index);
            if (!page.data) {
                page.data = fakeData(count);
            }
            return page;

            /** Generates data which can be used to indicate loading, while keeping the table at the correct height */
            function fakeData(count) {
                var i, res = [];
                for (i = 0; i < count; i++) {
                    res.push({
                        index: '',
                        first: 'Loading',
                        last: '',
                        company: '',
                        address: ''
                    });
                }
                return res;
            }
        }

        /** Returns the page info */
        function pageInfo() {
            var nums = numbers(),
                pages = pager.pages(),
                pdata = sparse(pages),
                res;

            //Get the hashes.
            $scope.info.forEach(copyHash);

            //Get the info
            res = nums.map(info);

            return res;

            /** Constructs information for the given page number */
            function info(pnum) {
                //We need loading and cached info as well as the page info.
                var idx = pnum - 1,
                    res;

                res = {
                    page: pnum,
                    index: idx,
                    cached: pdata[idx] && !!pdata[idx].data,
                    loading: pdata[idx] && !!pdata[idx].loading
                };

                //Copy the hash onto the object if it exists.
                if (hashes[idx]) {
                    res.$$hashKey = hashes[idx];
                }

                return res;
            }

            /** Creates an obhect with the stored page indexes as properties */
            function sparse(arr) {
                var i, res = { };
                for (i = 0; i < arr.length; i++) {
                    res[arr[i].index] = arr[i];
                }
                return res;
            }

            /** Copies the hash from the item (if it has one) onto the hashes object */
            function copyHash(item) {
                if (item.$$hashKey) {
                    hashes[item.index] = item.$$hashKey;
                }
            }
        }

        /** Gets the array of numbers to display */
        function numbers() {
            //Minimum 5, 2 each side of index...
            var i, min, max, res, cnt = pageCount;

            min = $scope.options.index - 4;
            max = $scope.options.index + 4;

            if (min < 0) {
                max = max - min;
                min = 0;
            } else if (max >= cnt) {
                min = min - (max - cnt + 1);
                max = cnt - 1;
            }
            if (min < 0) {
                min = 0;
            }
            if (max >= cnt) {
                max = cnt - 1;
            }

            res = [];
            for (i = min; i <= max; i++) {
                res.push(i + 1);
            }
            return res;
        }

        /** Does nothing */
        function noop() { }
    }

}(window.angular.module('pagerDemo')));
