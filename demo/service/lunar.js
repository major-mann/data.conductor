(function lunar_info_service(app) {
    'use strict';
    app.factory('demoLunar', ['$q', '$timeout', 'demoConfig', lunarServiceFactory]);

    /** Creates the lunar information service */
    function lunarServiceFactory($q, $timeout, config) {

        return {
            /** Searches for the data relative to the given date (in the filter) */
            find: function find(filter, args) {
                //console.log(formartArgs('find', args));
                var date = (filter && filter.date) || 0,
                    deferred,
                    res = [],
                    tout,
                    i;
                date = new Date(date);

                date.setDate(date.getDate() + args.skip);
                for (i = 0; i < args.limit; i++) {
                    res.push(info(date));
                    date.setDate(date.getDate() + 1);
                }

                deferred = $q.defer();
                if (config.latency) {
                    tout = $timeout(function () {
                        //console.log(formartArgs('resolve', args));
                        deferred.resolve(res);
                    }, config.latency);
                    if (args.cancel) {
                        args.cancel.then(function () {
                            $timeout.cancel(tout);
                            deferred.reject('cancelled');
                            //console.log(formartArgs('cancel', args));
                        });
                    }
                } else {
                    deferred.resolve(res);
                }
                return deferred.promise;
            },

            /** Returns the number of records contained in the source */
            count: function count() {
                return Infinity;
            }
        };

        function formartArgs(name, args) {
            return [
                name, '(',
                    'start: ', args.skip, '. ',
                    'end: ', args.skip + args.limit, '. ',
                    'count: ', args.limit, '.',
                ')'
            ].join('');
        }

        /** Returns lunar info for a given date */
        function info(date) {
            var pd = phaseDay(date.getFullYear(), date.getMonth() + 1, date.getDate()),
                txt;

            if (pd <= 4) {
                txt = 'New moon';
            } else if (pd < 8) {
                txt = 'Waxing crescent';
            } else if (pd < 12) {
                txt = 'First quarter';
            } else if (pd < 16) {
                txt = 'Full moon';
            } else if (pd < 20) {
                txt = 'Wanning gibbous';
            } else if (pd < 24) {
                txt = 'Third quarter';
            } else {
                txt = 'Wanning crescent';
            }

            return {
                date: new Date(date),
                phaseDay: pd,
                description: txt
            };
        }

        /**
        * Calculates the moon phase day for the given date.
        * 0 - 29. 0 is new moon. 15 is full moon
        * This comes from http://www.ben-daglish.net/moon.shtml
        */
        function phaseDay(year, month, day) {
            var n, RAD, t, t2, as, am, xtra, i, j1, jd;
            n = Math.floor(12.37 * (year - 1900 + ((1.0 * month - 0.5) / 12.0)));
            RAD = 3.14159265 / 180.0;
            t = n / 1236.85;
            t2 = t * t;
            as = 359.2242 + 29.105356 * n;
            am = 306.0253 + 385.816918 * n + 0.010730 * t2;
            xtra = 0.75933 + 1.53058868 * n + ((1.178e-4) - (1.55e-7) * t) * t2;
            xtra += (0.1734 - 3.93e-4 * t) * Math.sin(RAD * as) - 0.4068 * Math.sin(RAD * am);
            i = (xtra > 0.0 ? Math.floor(xtra) :  Math.ceil(xtra - 1.0));
            j1 = julday(year, month, day);
            jd = (2415020 + 28 * n) + i;
            return (j1 - jd + 30) % 30;

            /** Gets the julian day number */
            function julday(year, month, day) {
                var jy, jm, ja, jul;
                if (year < 0) {
                    year++;
                }
                jy = parseInt(year);
                jm = parseInt(month) + 1;
                if (month <= 2) {
                    jy--;
                    jm += 12;
                }
                jul = Math.floor(365.25 * jy) + Math.floor(30.6001 * jm) + parseInt(day) + 1720995;
                if (day + 31 * (month + 12 * year) >= (15 + 31 * (10 + 12 * 1582))) {
                    ja = Math.floor(0.01 * jy);
                    jul = jul + 2 - ja + Math.floor(0.25 * ja);
                }
                return jul;
            }
        }

    }

}(window.angular.module('pagerDemo')));
