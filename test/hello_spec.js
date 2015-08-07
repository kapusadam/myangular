/**
 * Created by Adam_Kruppa on 8/5/2015.
 */
describe("Hello", function() {
    it("says hello to receiver", function() {
        expect(sayHello('Jane')).toBe("Hello, Jane!");
    });
});

// In your node_modules, inside testem/lib folder, open browser_launcher.js, line ~123, change phantomjs to phantomjs.cmd. That worked for me. exe: 'phantomjs.cmd',