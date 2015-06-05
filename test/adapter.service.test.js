describe('adapter service', function () {

    var AdapterService, as;

    beforeEach(module('dataConductor'));
    beforeEach(function () {
        inject(['jsdcAdapterService', function (AS) {
            AdapterService = AS;
            as = new AS();
        }]);
    });

    it('should expose a global instance on the type named "global"', function () {
        expect(AdapterService.global).toEqual(jasmine.any(AdapterService));
    });

    it('should require the "find" function', function () {
        expect(as.add.bind(as, 'test', { })).toThrowError(/find/i);
        expect(as.add.bind(as, 'test', { find: { }})).toThrowError(/find/i);
        expect(as.add.bind(as, 'test', { find: function () {} })).not.toThrow();
    });

});
