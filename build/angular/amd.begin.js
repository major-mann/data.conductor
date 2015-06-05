(function (define) {
	'use strict';
    //We add a fake window variable to be used in the scripts.
    var window = {};
    define('jsdc', ['angular'], function(angular) {
        window.angular = angular;
        