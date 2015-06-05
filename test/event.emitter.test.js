(function event_emitter() {

    var app, EventEmitter;
    beforeEach(module('dataConductor'));
    beforeEach(function () {
        app = window.angular.module('dataConductor');
        inject(function (ee) {
            EventEmitter = ee;
        });
    });

    describe('EventEmitter', function () {

        var ee;
        beforeEach(function () {
            ee = new EventEmitter();
        });

        describe('type', function () {

            //Check that all the functions required exist
            it('should have a function named "on"', functionExists('on'));
            it('should have a function named "off"', functionExists('off'));
            it('should have a function named "once"', functionExists('once'));
            it('should have a function named "many"', functionExists('many'));
            it('should have a function named "emit"', functionExists('emit'));

            /** Checks whether a function exists or not. */
            function functionExists(name) {
                return function () {
                    expect(ee[name]).toEqual(jasmine.any(Function));
                };
            }
        });

        describe('on(name, handler)', function () {
            it('should ensure name is a value type', function () {
                expect(ee.on.bind(ee, { }, noop)).toThrow();
                expect(ee.on.bind(ee, noop, noop)).toThrow();
                expect(ee.on.bind(ee, 'foo bar', noop)).not.toThrow();
            });
            it('should ensure handler is a function', function () {
                expect(ee.on.bind(ee, 'foo bar', {})).toThrow();
                expect(ee.on.bind(ee, 'foo bar', 'foo bar')).toThrow();
                expect(ee.on.bind(ee, 'foo bar', 123)).toThrow();
                expect(ee.on.bind(ee, 'foo bar', true)).toThrow();
                expect(ee.on.bind(ee, 'foo bar', noop)).not.toThrow();
            });
            it('should add an event handler to be executed', function () {
                var cnt = 0;
                ee.on('foo', handler);
                ee.emit('foo');
                ee.emit('foo');
                expect(cnt).toBe(2);
                /** Increments the count */
                function handler() {
                    cnt++;
                }
            });
        });

        describe('off(name)', function () {
            it('should ensure name is a value type', function () {
                expect(ee.off.bind(ee, {})).toThrow();
                expect(ee.off.bind(ee, noop)).toThrow();
                expect(ee.off.bind(ee, true)).not.toThrow();
                expect(ee.off.bind(ee, 123)).not.toThrow();
                expect(ee.off.bind(ee, 'foo bar')).not.toThrow();
            });
            it('should remove an event handler', function () {
                var cnt = 0;
                ee.on('foo', handler);
                ee.emit('foo');
                ee.off('foo');
                ee.emit('foo');
                expect(cnt).toBe(1);

                /** Increments the count */
                function handler() {
                    cnt++;
                } 
            });
        });

        describe('emit(name, [arg1], [arg2], [argN]', function () {
            it('should ensure name is a value type', function () {
                expect(ee.emit.bind(ee, {})).toThrow();
                expect(ee.emit.bind(ee, noop)).toThrow();
                expect(ee.emit.bind(ee, true)).not.toThrow();
                expect(ee.emit.bind(ee, 123)).not.toThrow();
                expect(ee.emit.bind(ee, 'foo bar')).not.toThrow();
            });
            it('should execute any handlers with the supplied name', function () {
                var cnt = 0;
                ee.on('foo', h1);
                ee.on('foo', h2);
                ee.emit('foo');
                expect(cnt).toBe(110);
                function h1() {
                    cnt = cnt + 10;
                }
                function h2() {
                    cnt = cnt + 100;
                }
            });
            it('should pass the supplied arguments to the handler', function () {

                ee.on('foo', handler);
                ee.emit('foo', 100, 'foo', true);

                function handler(a, b, c) {
                    expect(a).toBe(100);
                    expect(b).toBe('foo');
                    expect(c).toBe(true);
                }
            });
        });

        describe('once(name, handler)', function () {
            it('should ensure name is a value type', function () {
                expect(ee.once.bind(ee, {})).toThrow();
                expect(ee.once.bind(ee, noop)).toThrow();
                expect(ee.once.bind(ee, true)).not.toThrow();
                expect(ee.once.bind(ee, 123)).not.toThrow();
                expect(ee.once.bind(ee, 'foo bar')).not.toThrow();
            });
            it('should ensure handler is a function', function () {
                expect(ee.once.bind(ee, 'foo', 123)).toThrow();
                expect(ee.once.bind(ee, 'foo', true)).toThrow();
                expect(ee.once.bind(ee, 'foo', 'foo')).toThrow();
                expect(ee.once.bind(ee, 'foo', {})).toThrow();
                expect(ee.once.bind(ee, 'foo', noop)).not.toThrow();
            });
            it('should execute the handler once', function () {
                var cnt = 0;
                ee.once('foo', handler);
                ee.emit('foo');
                ee.emit('foo');
                expect(cnt).toBe(1);
                function handler() {
                    cnt++;
                }
            });
        });

        describe('many(name, count, handler)', function () {
            it('should ensure name is a value type', function () {
                expect(ee.once.bind(ee, 1, {})).toThrow();
                expect(ee.once.bind(ee, 1, noop)).toThrow();
                expect(ee.once.bind(ee, 1, true)).not.toThrow();
                expect(ee.once.bind(ee, 1, 123)).not.toThrow();
                expect(ee.once.bind(ee, 1, 'foo bar')).not.toThrow();
            });
            it('should ensure count is a number', function () {
                expect(ee.once.bind(ee, true, noop)).toThrow();
                expect(ee.once.bind(ee, {}, noop)).toThrow();
                expect(ee.once.bind(ee, 'foo', noop)).toThrow();
                expect(ee.once.bind(ee, noop, noop)).toThrow();
                expect(ee.once.bind(ee, 1, noop)).not.toThrow();
            });
            it('should ensure handler is a function', function () {
                expect(ee.once.bind(ee, 'foo', 1, 123)).toThrow();
                expect(ee.once.bind(ee, 'foo', 1, true)).toThrow();
                expect(ee.once.bind(ee, 'foo', 1, 'foo')).toThrow();
                expect(ee.once.bind(ee, 'foo', {  })).toThrow();
                expect(ee.once.bind(ee, 'foo', noop)).not.toThrow();
            });
            it('should execute the handler "count" times.', function () {
                var cnt = 0;
                ee.many('foo', 2, handler);
                ee.emit('foo');
                ee.emit('foo');
                ee.emit('foo');
                expect(cnt).toBe(2);
                function handler() {
                    cnt++;
                }
            });
        });

        function noop(){ }
    });

}());