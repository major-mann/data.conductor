(function adapter_service(app) {
    'use strict';

    app.factory('jsdcAdapterService', ['jsdcObjectStorageService', adapterServiceFactory]);

    /** Exposes the AdapterService type, and additionally
    *     constructs a global singleton instacnce of the service
    */
    function adapterServiceFactory(ObjectStorageService) {

        //Create the singleton
        AdapterService.global = new AdapterService();

        //Return the type
        return AdapterService;

        /**
        * Provides a storage service that stores adapters which can be checked for
        * the required functions
        */
        function AdapterService() {
            ObjectStorageService.call(this);
            this.REQUIRED_FUNCTIONS.push('find');
            this.OPTIONAL_FUNCTIONS.push('count');
            this.OPTIONAL_FUNCTIONS.push('info');
        }

    }

}(window.angular.module('dataConductor')));
