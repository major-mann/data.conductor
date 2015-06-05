(function queue_service(app) {
    'use strict';

    //Register the factory.
    app.factory('jsdcQueue', [queueFactory]);

    /** Provides a queue type */
    function queueFactory() {

        //Return the queue type
        return Queue;

        /** Provides a FIFO list */
        function Queue() {

            //Data storage
            var head = null,
                tail = null,
                cnt = 0;

            //Expose the public API
            this.enqueue = enqueue;
            this.requeue = requeue;
            this.dequeue = dequeue;
            this.remove = remove;
            this.peek = peek;
            this.count = count;
            this.all = all;

            /** Returns an array containing all items in the queue. */
            function all() {
                var res = [],
                    curr = head;
                while (curr) {
                    res.push(curr.data);
                    curr = curr.next;
                }
                return res;
            }

            /**
            * Adds an item to the end of the queue.
            */
            function enqueue(item) {
                if (head === null) {
                    head = tail = {
                        data: item,
                        next: null
                    };
                } else {
                    tail = tail.next = {
                        data: item,
                        next: null
                    };
                }
                cnt++;
            }

            /**
            * Adds an item to the front of the queue.
            */
            function requeue(item) {
                if (head === null) {
                    head = tail = {
                        data: item,
                        next: null
                    };
                } else {
                    head = {
                        data: item,
                        next: head
                    };
                }
                cnt++;
            }

            /** Removes an item from the front of the queue and return it. */
            function dequeue() {
                var res;
                if (head) {
                    res = head.data;
                    head = head.next;
                    if (!head) {
                        tail = null;
                    }
                    cnt--;
                } else {
                    res = null;
                }
                return res;
            }

            /** Removes the specified item from the queue */
            function remove(item) {
                var curr = head;
                if (curr.data === item) {
                    //The item is first
                    return dequeue();
                }

                while (curr.next) {
                    if (curr.next.data === item) {
                        curr.next = curr.next.next || null;
                        cnt--;
                        return item;
                    }
                    curr = curr.next;
                }
                return null;
            }

            /**
            * Peeks count entries into the queue and returns the value.
            * @param {number} count The number of items into the queue to check.
            */
            function peek(count) {
                var i, curr = head;
                count = count || 0;
                for (i = 0; i < count && curr; i++) {
                    curr = curr.next;
                }
                if (curr) {
                    return curr.data;
                } else {
                    return null;
                }
            }

            /** The number of items currently stored in the queue */
            function count() {
                return cnt;
            }

        }

    }

}(window.angular.module('dataConductor')));
