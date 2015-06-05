(function module_test(angular) {

    describe('module', function () {
        it('should create an angular module named "dataConductor"', function () {
            //This should throw an error if the module does not exist.
            angular.module('dataConductor');
            inject(['dataConductor', function (jsdc) {
                expect(jsdc).toBeDefined();
            }]);
        });
    });

}(window.angular));
