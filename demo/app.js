(function app(angular) {

    angular.module('pagerDemo', ['ngRoute', 'dataConductor'])
        .config(['$routeProvider', configRouting]);

    /** Configures the application routes */
    function configRouting($routeProvider) {
        $routeProvider
            .when('/', {
                controller: 'IndexController',
                templateUrl: 'view/index.html'
            })
            .when('/igrid', {
                controller: 'IndexedGridController',
                templateUrl: 'view/indexed.grid.html'
            })
            .when('/iscroll', {
                controller: 'InfiniteScrollController',
                templateUrl: 'view/infinite.scroll.html'
            })
            .otherwise({
                redirectTo: '/'
            });
    }
}(window.angular));
