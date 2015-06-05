
pmod = window.angular.module(PROJECT_MODULE);
    modules.exports = {
        jsdcAdapterService: pmod.get('jsdcAdapterService'),
        jsdcEventEmitter: pmod.get('jsdcEventEmitter'),
        jsdcIndexedCollection: pmod.get('jsdcIndexedCollection'),
        jsdcIndexedPageCache: pmod.get('jsdcIndexedPageCache'),
        jsdcIndexedPagerService: pmod.get('jsdcIndexedPagerService'),
        jsdcLoaderService: pmod.get('jsdcLoaderService'),
        jsdcObjectStorageService: pmod.get('jsdcObjectStorageService'),
        jsdcQueue: pmod.get('jsdcQueue')
    };
}(module));