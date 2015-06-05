describe('IndexedCollection', function () {

    var IndexedCollection;

    beforeEach(module('dataConductor'));
    beforeEach(function () {
        inject(['jsdcIndexedCollection', function(IC) {
            IndexedCollection = IC;
        }]);
    });

    /** Creates a new indexed collection and returns it */
    function create(primary, fields) {
        return new IndexedCollection(primary, fields);
    }

    describe('IndexedCollection(primary, fields)', function () {
        it('should ensure primary is a non empty string', function () {
            expect(create.bind(null, '', ['f1'])).toThrowError(/non.*empty.*string/i);
            expect(create.bind(null, { }, ['f1'])).toThrowError(/non.*empty.*string/i);
            expect(create.bind(null, function () { }, ['f1'])).toThrowError(/non.*empty.*string/i);
            expect(create.bind(null, 123, ['f1'])).toThrowError(/non.*empty.*string/i);
            expect(create.bind(null, true, ['f1'])).toThrowError(/non.*empty.*string/i);
            expect(create.bind(null, 'pk', ['f1'])).not.toThrow();
        });
        it('should ensure fields is an array', function () {
            expect(create.bind(null, 'pk', 'foo bar')).toThrowError(/must.*array/i);
            expect(create.bind(null, 'pk', 123)).toThrowError(/must.*array/i);
            expect(create.bind(null, 'pk', true)).toThrowError(/must.*array/i);
            expect(create.bind(null, 'pk', { })).toThrowError(/must.*array/i);
            expect(create.bind(null, 'pk', function () { })).toThrowError(/must.*array/i);
            expect(create.bind(null, 'pk', ['f1'])).not.toThrow();
        });
    });

    describe('instance', function () {

        var ic;

        beforeEach(function () {
            ic = new IndexedCollection('pk', ['f1', 'f2', 'f3']);

            ic.add({
                pk: 1,
                f1: 'foo',
                f2: 'bar',
                f3: 'baz',
                f4: 'untracked'
            });
        });

        describe('find([field], value)', function () {
            it('should exist', function () {
                expect(ic.find).toEqual(jasmine.any(Function));
            });
            it('should use the primary field when "field" is not supplied', function () {
                var res = ic.find(1);
                expect(res.length).toBe(1);

                res = ic.find(0);
                expect(res.length).toBe(0);
            });
            it('should return an array of values containing the items with the matching field values', function () {
                var res = ic.find('f1', 'foo');
                expect(res.length).toBe(1);

                res = ic.find('f1', 'other');
                expect(res.length).toBe(0);

                res = ic.find('f2', 'bar');
                expect(res.length).toBe(1);

                res = ic.find('f2', 'other');
                expect(res.length).toBe(0);

                res = ic.find('f3', 'baz');
                expect(res.length).toBe(1);

                res = ic.find('f3', 'other');
                expect(res.length).toBe(0);

                expect(ic.find.bind(ic, 'f4', 'other')).toThrowError(/index.*f4/i);
            });
        });

        describe('add(item)', function () {
            it('should exist', function () {
                expect(ic.add).toEqual(jasmine.any(Function));
            });
            it('should add an item to the collection', function () {
                expect(ic.find(2).length).toBe(0);
                ic.add({
                    pk: 2,
                    f1: 'a',
                    f2: 'b',
                    f3: 'c'
                });
                expect(ic.find(2).length).toBe(1);
            });
            it('should increment count', function () {
                expect(ic.count()).toBe(1);
                ic.add({
                    pk: 2,
                    f1: 'a',
                    f2: 'b',
                    f3: 'c'
                });
                expect(ic.count()).toBe(2);
            });
            it('should prevent duplicate primary keys from being added', function () {
                var obj = {
                    pk: 2,
                    f1: 'a',
                    f2: 'b',
                    f3: 'c'
                };
                expect(ic.find(2).length).toBe(0);
                ic.add(obj);
                expect(ic.find(2).length).toBe(1);
                expect(ic.add.bind(ic, obj)).toThrowError(/duplicate/i);
            });
            it('should add the item to every defined index', function () {
                ic.add({
                    pk: 2,
                    f1: 'a',
                    f2: 'b',
                    f3: 'c'
                });

                expect(ic.find('f1', 'a').length).toBe(1);
                expect(ic.find('f2', 'b').length).toBe(1);
                expect(ic.find('f3', 'c').length).toBe(1);

            });
        });

        describe('remove(pkey)', function () {
            it('should exist', function () {
                expect(ic.remove).toEqual(jasmine.any(Function));
            });
            it('should remove the item with the specified primary key value', function () {
                ic.add({
                    pk: 2,
                    f1: 'a',
                    f2: 'b',
                    f3: 'c'
                });

                expect(ic.count()).toBe(2);

                ic.remove(1);
                expect(ic.count()).toBe(1);
                ic.remove(2);
                expect(ic.count()).toBe(0);
            });
            it('should remove the item from the indexes', function () {
                ic.add({
                    pk: 2,
                    f1: 'a',
                    f2: 'b',
                    f3: 'c'
                });

                expect(ic.find('f1', 'a').length).toBe(1);
                expect(ic.find('f2', 'b').length).toBe(1);
                expect(ic.find('f3', 'c').length).toBe(1);

                ic.remove(2);

                expect(ic.find('f1', 'a').length).toBe(0);
                expect(ic.find('f2', 'b').length).toBe(0);
                expect(ic.find('f3', 'c').length).toBe(0);
            });
        });

        describe('count()', function () {
            it('should exist', function () {
                expect(ic.count).toEqual(jasmine.any(Function));
            });
            it('should return the number of items stored', function () {
                expect(ic.count()).toBe(1);
                ic.add({
                    pk: 2,
                    f1: 'a',
                    f2: 'b',
                    f3: 'c'
                });
                expect(ic.count()).toBe(2);
            });
        });

        describe('clear()', function () {
            it('should exist', function () {
                expect(ic.clear).toEqual(jasmine.any(Function));
            });
            it('should remove all items from the collection', function () {
                expect(ic.count()).toBe(1);
                ic.add({
                    pk: 2,
                    f1: 'a',
                    f2: 'b',
                    f3: 'c'
                });
                expect(ic.count()).toBe(2);
                ic.clear();
                expect(ic.count()).toBe(0);
            });
        });

        describe('update(value)', function () {
            it('should exist', function () {
                expect(ic.update).toEqual(jasmine.any(Function));
            });
            it('should update the item order in the indexes according to the changed field values', function () {
                ic.remove(1);
                var a1 = {
                    pk: 1,
                    f1: 'a',
                    f2: 'b',
                    f3: 'c'
                };
                var a2 = {
                    pk: 2,
                    f1: 'd',
                    f2: 'e',
                    f3: 'f'
                };
                var a3 = {
                    pk: 3,
                    f1: 'g',
                    f2: 'h',
                    f3: 'i'
                };
                ic.add(a1);
                ic.add(a2);
                ic.add(a3);
                
                var items = ic.all('f1');
                expect(items.length).toBe(3);
                expect(items[0].pk).toBe(1);
                expect(items[1].pk).toBe(2);
                expect(items[2].pk).toBe(3);

                a1.f1 = 'z';
                items = ic.all('f1');
                expect(items.length).toBe(3);
                expect(items[0].pk).toBe(1);
                expect(items[1].pk).toBe(2);
                expect(items[2].pk).toBe(3);

                ic.update(a1);
                items = ic.all('f1');
                expect(items.length).toBe(3);
                expect(items[0].pk).toBe(2);
                expect(items[1].pk).toBe(3);
                expect(items[2].pk).toBe(1);

            });
        });

        describe('all([field])', function () {
            it('should exist', function () {
                expect(ic.all).toEqual(jasmine.any(Function));
            });
            it('should use the primary key when "field" is not supplied', function () {
                ic.remove(1);
                var a1 = {
                    pk: 1,
                    f1: 'g',
                    f2: 'h',
                    f3: 'i'
                };
                var a2 = {
                    pk: 2,
                    f1: 'd',
                    f2: 'e',
                    f3: 'f'
                };
                var a3 = {
                    pk: 3,
                    f1: 'a',
                    f2: 'b',
                    f3: 'c'
                };
                ic.add(a1);
                ic.add(a2);
                ic.add(a3);
                
                var items = ic.all();
                expect(items.length).toBe(3);

                expect(items[0].pk).toBe(1);
                expect(items[1].pk).toBe(2);
                expect(items[2].pk).toBe(3);
            });
            it('should return the items in order of the specified field', function () {
                ic.remove(1);
                var a1 = {
                    pk: 1,
                    f1: 2,
                    f2: 3,
                    f3: 1
                };
                var a2 = {
                    pk: 2,
                    f1: 3,
                    f2: 1,
                    f3: 2
                };
                var a3 = {
                    pk: 3,
                    f1: 1,
                    f2: 2,
                    f3: 3
                };
                ic.add(a1);
                ic.add(a2);
                ic.add(a3);

                var items = ic.all('f1');
                expect(items.length).toBe(3);
                expect(items[0].pk).toBe(3);
                expect(items[1].pk).toBe(1);
                expect(items[2].pk).toBe(2);

                items = ic.all('f2');
                expect(items.length).toBe(3);
                expect(items[0].pk).toBe(2);
                expect(items[1].pk).toBe(3);
                expect(items[2].pk).toBe(1);

                items = ic.all('f3');
                expect(items.length).toBe(3);
                expect(items[0].pk).toBe(1);
                expect(items[1].pk).toBe(2);
                expect(items[2].pk).toBe(3);
            });
        });
    });
});