//Provides an infinite list bound to the named pager
(function ilist(app) {
    //Constants
    var REPEAT_INITIAL_DELAY = 500,
        REPEAT_DELAY = 100,
        SCROLL_AMOUNT = 120;

    //Register the directive
    app.directive('infList', ['$timeout', '$interval', infiniteListDirective]);

    /** Creates and returns the infinite list directive */
    function infiniteListDirective($timeout, $interval) {
        return {
            restrict: 'E',
            templateUrl: 'directive/ilist.html',
            scope: {
                data: '='
            },
            link: link
        }

        function link(scope, element) {
            var current = 0, cheight, theight, vpheight;

            //Initialise the view styles
            scope.style = {
                height: '0px',
                transform: 'translate(0px,0px)',
                top: top
            };

            //Initialise selected to nothing
            scope.selected = null;

            //Watches
            scope.$watchCollection('data', onDataChanged);
            scope.$watch('selected', onSelectedChanged);

            //Events
            element.on('wheel', onMouseWheelMoved);
            element.on('keydown', onKeyDown);

            /** Determines the top (in pixels) for the specified index */
            function top(index) {
                var y;
                if (!theight) {
                    //This is the first time we are guaranteed to have a template available to measure
                    updateDimensions();
                }
                y = index * theight + vpheight / 2 - theight / 2;
                return y;
            }

            /** Scrolls the list downwards by the specified amount */
            function scrollDown(amount) {
                moveTo(current - amount);
                scope.selected = item();
            }

            /** Scrolls the list upwards by the specified amount */
            function scrollUp(amount) {
                moveTo(current + amount);
                scope.selected = item();
            }

            /** Moves the scroll to the specified position */
            function moveTo(pos) {
                current = pos;
                updateTransform();
            }

            /** Deterimes the most central item according to the currect scroll */
            function item() {
                var res;
                if (theight) {
                    res = Math.round(current / theight) * -1;
                } else {
                    res = null;
                }
                return res;
            }

            /** Updates the transform to translate the container div appropriately for the current position */
            function updateTransform() {
                scope.style.transform = 'translate(0,' + current + 'px)';
            }

            /** Calculates template height, container height and viewport height */
            function updateDimensions() {
                theight = templateHeight();
                cheight = containerHeight();
                vpheight = viewPortHeight();
            }

            /** Determines the height (including margin) of the first element in the scroll container */
            function templateHeight() {
                var ele = element.find('ilist-item')[0],
                    cstyle,
                    margin,
                    res;
                if (ele) {
                    cstyle = window.getComputedStyle(ele);
                    margin = parseInt(cstyle.marginTop, 10) + parseInt(cstyle.marginBottom, 10);
                    res = ele.offsetHeight + margin;
                } else {
                    res = 0;
                }
                return res;
            }

            /** Calculates the container height */
            function containerHeight() {
                var cnt = scope.data && scope.data.length || 0;
                return cnt * theight;
            }

            /** Calculates the viewport height */
            function viewPortHeight() {
                var vp = element.find('div')[0];
                return vp.clientHeight;
            }

            /** Called when the selected value has changed */
            function onSelectedChanged(val) {
                scope.$emit('selectedchange', val);
            }

            /** Raised when the mouse wheel has been moved over the list */
            function onMouseWheelMoved(e) {
                var wd = e.originalEvent.deltaY;
                if (wd < 0) {
                    scrollUp(SCROLL_AMOUNT);
                } else if (wd > 0) {
                    scrollDown(SCROLL_AMOUNT);
                }
                scope.$digest();
            }

            /** Raised when a key is pressed down on the list */
            function onKeyDown(e) {
                switch (e.which) {
                case 38:
                    scrollUp(SCROLL_AMOUNT);
                    break;
                case 40:
                    scrollDown(SCROLL_AMOUNT);
                    break;
                default:
                    break;
                }
                scope.$digest();
            }

            /** Called when the data has changed */
            function onDataChanged(vals) {
                var curr = scope.selected;
                if (vals && vals.length) {
                    if (curr === null) {
                        scope.selected = 0;
                    } else if (curr >= vals.length) {
                        scope.selected = 0;
                    } //Otherwise do nothing, as we should be in the correct position.
                } else {
                    scope.selected = null;
                }
            }
        }
    }

}(window.angular.module('pagerDemo')));
