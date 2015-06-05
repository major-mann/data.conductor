describe('queue service', function () {

    var Queue, q;

    beforeEach(module('dataConductor'));
    beforeEach(function () {
        inject(['jsdcQueue', function (Q) {
            Queue = Q;
            q = new Q();
        }]);
    });

    describe('enqueue(item)', function () {
        it('should add an item to the end of queue', function () {
            q.enqueue(1);
            expect(q.peek()).toBe(1);
            q.enqueue(2);
            expect(q.peek()).toBe(1);
            expect(q.peek(1)).toBe(2);
        });
    });
    describe('dequeue()', function () {
        it('should remove an item from the front of the queue', function () {
            q.enqueue(1);
            q.enqueue(2);
            q.enqueue(3);
            q.enqueue(4);
            q.enqueue(5);
            expect(q.peek()).toBe(1);
            expect(q.dequeue()).toBe(1);
            expect(q.peek()).toBe(2);
            expect(q.dequeue()).toBe(2);
            expect(q.peek()).toBe(3);
        });
    });
    describe('requeue(item)', function() {
        it('should add an item to the front of queue', function () {
            q.enqueue(1);
            q.enqueue(2);
            q.enqueue(3);
            q.enqueue(4);
            q.enqueue(5);
            expect(q.peek()).toBe(1);
            q.requeue(0);
            expect(q.peek()).toBe(0);
        });
    });
    describe('peek([count])', function () {
        it('should return the item count entries from the front of the queue', function () {
            q.enqueue(1);
            q.enqueue(2);
            q.enqueue(3);
            q.enqueue(4);
            q.enqueue(5);

            expect(q.peek()).toBe(1);
            expect(q.peek(0)).toBe(1);
            expect(q.peek(1)).toBe(2);
            expect(q.peek(2)).toBe(3);
            expect(q.peek(3)).toBe(4);
            expect(q.peek(4)).toBe(5);
        });
    });
    describe('count()', function() {
        it('should return the number of items stored in the queue', function () {
            q.enqueue(1);
            q.enqueue(1);
            q.enqueue(1);
            q.enqueue(1);
            q.enqueue(1);
            expect(q.count()).toBe(5);
            q.enqueue(1);
            q.enqueue(1);
            expect(q.count()).toBe(7);
        });
    });
});
