(function list(app, $) {

    //Constants
    var REPEAT_INITIAL_DELAY = 500,
        REPEAT_DELAY = 100,
        SCROLL_AMOUNT = 120;

    app.directive('list', ['$interpolate', listDirective]);

    /** Displays a list of items */
    function listDirective($interpolate) {
        var templateHtml;

        return {
            restrict: 'E',
            scope: {
                data: '='
            },
            templateUrl: 'directive/list.html',
            transclude: true,
            compile: compile
        }

        /** Compiles the template */
        function compile(template) {

            var container = $(template.querySelector('[ng-transclude]'));
            container.removeAttr('ng-transclude');
            templateHtml = container[0].innerHTML;
            container[0].innerHTML = '';

            return link;
        }

        /** Perform the directive linking */
        function link(scope, element) {

            //Holds a reference to the DOM items.
            var items = { },
                theight = templateHeight();

            //Initialise the scope values
            scope.style = {
                height: 0
            };

            //$scope.$watchCollection('data', onDataChanged);

            //Add the template
            //Determine the item height



            /*function onDataChanged(values, oldValues) {
                scope.style.height = values * theight;
            }*/

            /** Determines the height of the template */
            function templateHeight() {
                var template = $(templateHtml),
                    cstyle,
                    margin,
                    res;
                element.append(template);
                cstyle = window.getComputedStyle(template[0]);
                margin = parseInt(cstyle.marginTop, 10);
                margin = margin + parseInt(cstyle.marginBottom, 10);
                res = parseInt(cstyle.height, 10) + margin;
                template.remove();
                return res;
            }

            //TODO: The template will be the contents

            //var container, template;

            //$interpolate(template)(<item>)

            /** Scrolls the list upwards by the specified amount */
            /*function scrollUp(amount) {

            }*/

            /** Scrolls the list downwards by the specified amount */
            /*function scrollDown(amount) {

            }*/

            /** Triggers the repeat function for when an arrow key is held down */
            /*function triggerRepeat(up) {
                repeatInterval = setInterval(function () {
                    if (up) {
                        scrollUp(SCROLL_AMOUNT);
                    } else {
                        scrollDown(SCROLL_AMOUNT);
                    }
                }, REPEAT_DELAY);
            }*/
        }
    }

}(window.angular.module('pagerDemo'), window.angular.element));
