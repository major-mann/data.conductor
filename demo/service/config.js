(function config(app) {

    //Register the config factory
    app.factory('demoConfig', [demoConfigFactory]);

    /** Returns the configuration */
    function demoConfigFactory() {
        return {
            latency: 1000
        }
    }

}(window.angular.module('pagerDemo')));
