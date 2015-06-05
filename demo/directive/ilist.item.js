(function ilist_item(app) {

    app.directive('ilistItem', ilistItemDirective);

    function ilistItemDirective() {
        return {
            restrict: 'E',
            scope: {
                item: '='
            },
            templateUrl: 'directive/ilist.item.html',
            link: link
        }

        /** Performs the linking between the template and the code */
        function link(scope) {
            scope.date = date;
        }

        /** Returns a formatted date */
        function date(dt) {
            if (dt) {
                return dt.toDateString();
            } else {
                return '';
            }
        }
    }

}(window.angular.module('pagerDemo')));
