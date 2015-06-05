(function (module) {

    //We add a fake window variable to be used in the scripts.
    var PROJECT_MODULE = 'dataConductor',
        window = {},
        pmod;
    window.angular = require('angular');
