/**
 * Created by Adam_Kruppa on 8/5/2015.
 */
var scope = new Scope();
//
//scope.someValue = 'a';
//scope.counter = 0;
//scope.$watch(
//    function(scope) {
//        return scope.someValue;
//    },
//    function(newValue, oldValue, scope) {
//        scope.counter++;
//    }
//);
//console.log(scope.counter);//0
//scope.$digest();
//console.log(scope.counter);//1
//scope.$digest();
//console.log(scope.counter);//1
//scope.someValue = 'b';
//console.log(scope.counter);//1
//scope.$digest();
//console.log(scope.counter);//2


scope.aValue = 'someValue';
scope.counter = 0;
scope.$watch(
    function(scope) {
        return scope.aValue;
    },
    function(newValue, oldValue, scope) {
        scope.counter++;
    }
);
scope.$digest();
console.log(scope.counter);//1
scope.$apply(function(scope) {
    scope.aValue = 'someOtherValue';
});
console.log(scope.counter);//2

