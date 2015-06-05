(function scroll(app, $) {
    'use strict';

    var REPEAT_INITIAL_DELAY = 500,
        REPEAT_DELAY = 100,
        SCROLL_AMOUNT = 120;


    app.directive('scroll', scrollDirective);

    function scrollDirective() {
        var triggerTimeout, repeatInterval, current = 0;
        return {
            restrict: 'A',
            link: function link(scope, element) {

                element.on('mousewheel', function onMouseWheel(e) {
                    var wd = e.originalEvent.wheelDelta;
                    if (wd > 0) {
                        scrollUp(wd);
                    } else if (wd < 0) {
                        scrollDown(wd * -1);
                    }
                });

                element.on('keydown', function onKeyPress(e) {
                    switch (e.which) {
                    case 38:
                        scrollUp(SCROLL_AMOUNT);
                        triggerTimeout = setTimeout(triggerRepeat.bind(null, true), REPEAT_INITIAL_DELAY);
                        break;
                    case 40:
                        scrollDown(SCROLL_AMOUNT);
                        triggerTimeout = setTimeout(triggerRepeat.bind(null, false), REPEAT_INITIAL_DELAY);
                        break;
                    default:
                        break;
                    }
                });

                element.on('keyup', function onKeyPress(e) {
                    switch (e.which) {
                    case 38:
                    case 40:
                        clearTimeout(triggerTimeout);
                        clearInterval(repeatInterval);
                        break;
                    default:
                        break;
                    }
                });

                function triggerRepeat(up) {
                    repeatInterval = setInterval(function () {
                        if (up) {
                            scrollUp(SCROLL_AMOUNT);
                        } else {
                            scrollDown(SCROLL_AMOUNT);
                        }
                    }, REPEAT_DELAY);
                }

                function scrollUp(amount) {
                    var ele;
                    current += amount;
                    ele = element.children().first();
                    if (ele) {
                        ele.css('transform', containerTransform());
                    }
                    scope.$emit('scroll', current);
                    console.log(current);
                }

                function scrollDown(amount) {
                    var ele;
                    current -= amount;
                    ele = element.children().first();
                    if (ele) {
                        ele.css('transform', containerTransform());
                    }
                    scope.$emit('scroll', current);
                    console.log(current);
                }

                function containerTransform() {
                    return 'translate(0px,' + current + 'px)';
                }

            }
        };
    }

}(window.angular.module('pagerDemo'), window.angular.element));
