describe('Object Storage Service', function() {

    var ObjectStorageService, oss;
    beforeEach(module('dataConductor'));
    beforeEach(function() {
        inject(['jsdcObjectStorageService', function(OSS) {
            ObjectStorageService = OSS;
            oss = new OSS();
        }]);
    });

    describe('validate(adapter)', function() {
        it('must check adapter is an object', function() {
            expect(oss.validate.bind(oss, null)).toThrowError(/object/i);
            expect(oss.validate.bind(oss, 123)).toThrowError(/object/i);
            expect(oss.validate.bind(oss, 'foo bar baz')).toThrowError(/object/i);
            expect(oss.validate.bind(oss, function() {})).toThrowError(/object/i);
            expect(oss.validate.bind(oss, { })).not.toThrow();
        });
        it('must check that the functions defined by REQUIRED_FUNCTIONS are supplied', function() {
            oss.REQUIRED_FUNCTIONS.push('test');
            expect(oss.validate.bind(oss, {  })).toThrowError(/test/i);
            expect(oss.validate.bind(oss, { test: function() { } })).not.toThrow();
        });
        it('must check that the properties defined by OPTIONAL_FUNCTIONS are functions when supplied', function() {
            oss.OPTIONAL_FUNCTIONS.push('test');
            expect(oss.validate.bind(oss, { })).not.toThrow();
            expect(oss.validate.bind(oss, { test: { } })).toThrowError(/test/i);
            expect(oss.validate.bind(oss, { test: function() { } })).not.toThrow();
        });
        it('must check that the objects defined by REQUIRED_OBJECTS are defined', function() {
            oss.REQUIRED_OBJECTS.push('test');
            expect(oss.validate.bind(oss, {  })).toThrowError(/test/i);
            expect(oss.validate.bind(oss, { test: function() {  } })).toThrowError(/test/i);
            expect(oss.validate.bind(oss, { test: {  } })).not.toThrow(); 
        });
    });

    describe('find(name)', function() {
        it('should return the stored adapter with the supplied name', function() {
            var a1 = {}, a2 = {};
            oss.add('test1', a1);
            oss.add('test2', a2);
            expect(oss.find('test1')).toBe(a1);
            expect(oss.find('test2')).toBe(a2);
        });
    });

    describe('add(name, adapter)', function() {
        it('should add an adapter with the given name', function() {
            var adapter = { };
            oss.add('test', adapter);
            expect(oss.find('test')).toBe(adapter);
        });
        it('should throw an Error if the supplied name is not a value type', function() {
            expect(oss.add.bind(oss, { }, { })).toThrowError(/value.*type/i);
            expect(oss.add.bind(oss, function() { }, { })).toThrowError(/value.*type/i);
            expect(oss.add.bind(oss, 123, { })).not.toThrow();
            expect(oss.add.bind(oss, 'foo bar baz', { })).not.toThrow();
            expect(oss.add.bind(oss, true, { })).not.toThrow();
        });
        it('should throw an Error if the supplied adapter is invalid', function() {
            oss.REQUIRED_FUNCTIONS.push('test');
            expect(oss.add.bind(oss, 'test', { })).toThrowError(/test/i);
            expect(oss.add.bind(oss, 'test', { test: { } })).toThrowError(/test/i);
            expect(oss.add.bind(oss, 'test', { test: function() { }})).not.toThrow();
        });
        it('should return the added adapter', function() {
            var obj = { };
            var ad = oss.add('test', obj);
            expect(ad).toBe(obj);
        });
    });

    describe('remove(name)', function() {
        it('should remove the adapter with the given name', function() {
            var obj = {};
            oss.add('test', obj);
            expect(oss.find('test')).toBe(obj);
            oss.remove('test');
            expect(oss.find('test')).toBe(null);
        });
        it('should return the removed adapter', function() {
            var obj = {};
            oss.add('test', obj);
            expect(oss.find('test')).toBe(obj);
            var removed = oss.remove('test');
            expect(oss.find('test')).toBe(null);
            expect(removed).toBe(obj);
        });
    });

    describe('all()', function() {
        it('should return an array of objects containing all stored adapters and their names', function() {
            var a1 = {}, a2 = {};
            oss.add('test1', a1);
            oss.add('test2', a2);

            var all = oss.all();
            expect(all.length).toBe(2);
            expect(all[0].name).toBe('test1');
            expect(all[0].adapter).toBe(a1);
            expect(all[1].name).toBe('test2');
            expect(all[1].adapter).toBe(a2);
        });
    });

});