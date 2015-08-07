/**
 * Created by Adam_Kruppa on 8/5/2015.
 */
function sayHello(to) {
    return _.template("Hello, <%= name %>!")({name: to});
}
