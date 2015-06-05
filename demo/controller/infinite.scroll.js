(function indexed_grid(app) {
    'use strict';

    app.controller('InfiniteScrollController', ['$scope', 'demoConfig', 'demoLunar', 'jsdcIndexedPagerService', infiniteScrollController]);

    function infiniteScrollController($scope, config, lunar, Pager) {
        var hashes = { },
            container = document.getElementById('container'),
            pager = new Pager();

        pager.setAdapter(lunar, true);
        $scope.pages = [];
        $scope.count = 0;



        $scope.latency = config.latency;
        $scope.date = new Date(0);

        $scope.options = pager.state();
        $scope.options.index = 0;
        $scope.options.batching = true;
        $scope.options.indexMode = pager.INDEX_MODE.full;
        $scope.options.maxItems = 41;
        $scope.options.pageSize = 10;
        $scope.options.padLow = 10;
        $scope.options.padHigh = 10;
        $scope.options.loadOverflowMode = pager.LOAD_OVERFLOW_MODE.cancel;
        $scope.options.loadMax = 50;

        $scope.$watch('options', function () {
            pager.setState($scope.options)
                .then(getPages, error, getPages);
            getPages();
        }, true);
        $scope.$watch('latency', onLatencyChanged);
        $scope.$watch('date', onDateChanged);

        //This event comes from the list
        $scope.$on('selectedchange', function (scope, selected) {
            if (selected !== null) {
                $scope.options.index = selected;
                if (pager.index() !== selected) {
                    pager.setIndex(selected)
                        .then(getPages);
                    getPages();
                }
            }
        });

        /** Returns the currently cached pages, copying their angular hashes if they exist */
        function getPages() {
            var pgs, i, j, pages = $scope.pages;
            while (pages.length) {
                if (pages[pages.length - 1].$$hashKey) {
                    hashes[pages[pages.length - 1].index] = pages[pages.length - 1].$$hashKey;
                    pages.pop();
                }
            }
            pgs = pager.pages();
            for (i = 0; i < pgs.length; i++) {
                if (hashes[pgs[i].index]) {
                    pgs[i].$$hashKey = hashes[pgs[i].index];
                }
                pages.push(pgs[i]);
            }
        }

        function error(err) {
            console.error(err);
        }

        /** Called when the latency option has changed */
        function onLatencyChanged(value) {
            if (value >= 0) {
                config.latency = value;
            }
        }

        /** Raised when the date has a changed */
        function onDateChanged(value, old) {
            if (value !== old) {
                //pager.setFilter({ date: value });
                //pager.setState($scope.options);
                $scope.options.filter = { date: value };
            }
            //pager.setFilter({ date: value });
            //$scope.options.filter = { date: value };
            /*var filt = { date: value };
            pager.setFilter(filt);
            pager.setIndex(scope.options.index)
                .then(getPages);*/
        }

    }

}(window.angular.module('pagerDemo')));
