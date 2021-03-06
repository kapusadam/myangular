describe("Scope", function () {
    it("can be constructed and used as an object", function () {
        var scope = new Scope();
        scope.aProperty = 1;
        expect(scope.aProperty).toBe(1);
    });
    describe("digest", function () {
        var scope;
        beforeEach(function () {
            scope = new Scope();
        });
        it("calls the listener function when the watched value changes", function () {
            scope.someValue = 'a';
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.someValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            expect(scope.counter).toBe(0);
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.someValue = 'b';
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });
        it("calls listener when watch value is first undefined", function () {
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.someValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
        });
        it("calls listener with new value as old value the first time", function () {
            scope.someValue = 123;
            var oldValueGiven;
            scope.$watch(
                function (scope) {
                    return scope.someValue;
                },
                function (newValue, oldValue) {
                    oldValueGiven = oldValue;
                }
            );
            scope.$digest();
            expect(oldValueGiven).toBe(123);
        });
        it("may have watchers that omit the listener function", function () {
            var watchFn = jasmine.createSpy().and.returnValue('something');
            scope.$watch(watchFn);
            scope.$digest();
            expect(watchFn).toHaveBeenCalled();
        });
        it("triggers chained watchers in the same digest", function () {
            scope.name = 'Jane';
            scope.$watch(
                function (scope) {
                    return scope.nameUpper;
                },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.initial = newValue.substring(0, 1) + '.';
                    }
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.name;
                },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.nameUpper = newValue.toUpperCase();
                    }
                }
            );
            scope.$digest();
            expect(scope.initial).toBe('J.');
            scope.name = 'Bob';
            scope.$digest();
            expect(scope.initial).toBe('B.');
        });

        it("gives up on the watches after 10 iterations", function () {
            scope.counterA = 0;
            scope.counterB = 0;
            scope.$watch(
                function (scope) {
                    return scope.counterA;
                },
                function (newValue, oldValue, scope) {
                    scope.counterB++;
                }
            );
            scope.$watch(
                function (scope) {
                    return scope.counterB;
                },
                function (newValue, oldValue, scope) {
                    scope.counterA++;
                }
            );
            expect((function () {
                scope.$digest();
            })).toThrow();
        });

        it("ends the digest when the last watch is clean", function () {
            scope.array = _.range(100);
            var watchExecutions = 0;
            _.times(100, function (i) {
                scope.$watch(
                    function (scope) {
                        watchExecutions++;
                        return scope.array[i];
                    }
                );
            });
            scope.$digest();
            expect(watchExecutions).toBe(200);
            scope.array[0] = 420;
            scope.$digest();
            expect(watchExecutions).toBe(301);
        });

        it("does not end digest so that new watches are not run", function () {
            scope.aValue = 'abc';
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.$watch(
                        function (scope) {
                            return scope.aValue;
                        },
                        function (newValue, oldValue, scope) {
                            scope.counter++;
                        }
                    );
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("compares based on value if enabled", function () {
            scope.aValue = [1, 2, 3];
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.aValue.push(4);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it("correctly handles NaNs", function () {
            scope.number = 0 / 0; // NaN
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.number;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("executes $eval'ed function and returns result", function () {
            scope.aValue = 42;
            var result = scope.$eval(function (scope) {
                return scope.aValue;
            });
            expect(result).toBe(42);
        });
        it("passes the second $eval argument straight through", function () {
            scope.aValue = 42;
            var result = scope.$eval(function (scope, arg) {
                return scope.aValue + arg;
            }, 2);
            expect(result).toBe(44);
        });


        it("executes $apply'ed function and starts the digest", function () {
            scope.aValue = 'someValue';
            scope.counter = 0;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$apply(function (scope) {
                scope.aValue = 'someOtherValue';
            });
            expect(scope.counter).toBe(2);
        });

        it("executes $evalAsync'ed function later in the same cycle", function () {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;
            scope.asyncEvaluatedImmediately = false;
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.$evalAsync(function (scope) {
                        scope.asyncEvaluated = true;
                    });
                    scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
                }
            );
            scope.$digest();
            expect(scope.asyncEvaluated).toBe(true);
            expect(scope.asyncEvaluatedImmediately).toBe(false);
        });

        it("executes $evalAsync'ed functions added by watch functions", function () {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;
            scope.$watch(
                function (scope) {
                    if (!scope.asyncEvaluated) {
                        scope.$evalAsync(function (scope) {
                            scope.asyncEvaluated = true;
                        });
                    }
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                }
            );
            scope.$digest();
            expect(scope.asyncEvaluated).toBe(true);
        });

        it("executes $evalAsync'ed functions even when not dirty", function () {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluatedTimes = 0;
            scope.$watch(
                function (scope) {
                    if (scope.asyncEvaluatedTimes < 2) {
                        scope.$evalAsync(function (scope) {
                            scope.asyncEvaluatedTimes++;
                        });
                    }
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                }
            );
            scope.$digest();
            expect(scope.asyncEvaluatedTimes).toBe(2);
        });

        it("eventually halts $evalAsyncs added by watches", function () {
            scope.aValue = [1, 2, 3];
            scope.$watch(
                function (scope) {
                    scope.$evalAsync(function (scope) {
                    });
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                }
            );
            expect(function () {
                scope.$digest();
            }).toThrow();
        });

        it("has a $$phase field whose value is the current digest phase", function () {
            scope.aValue = [1, 2, 3];
            scope.phaseInWatchFunction = undefined;
            scope.phaseInListenerFunction = undefined;
            scope.phaseInApplyFunction = undefined;
            scope.$watch(
                function (scope) {
                    scope.phaseInWatchFunction = scope.$$phase;
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.phaseInListenerFunction = scope.$$phase;
                }
            );
            scope.$apply(function (scope) {
                scope.phaseInApplyFunction = scope.$$phase;
            });
            expect(scope.phaseInWatchFunction).toBe('$digest');
            expect(scope.phaseInListenerFunction).toBe('$digest');
            expect(scope.phaseInApplyFunction).toBe('$apply');
        });

        it("schedules a digest in $evalAsync", function(done) {
            scope.aValue = "abc";
            scope.counter = 0;
            scope.$watch(
                function(scope) { return scope.aValue; },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$evalAsync(function(scope) {
            });
            expect(scope.counter).toBe(0);
            setTimeout(function() {
                expect(scope.counter).toBe(1);
                done();
            }, 50);
        });

        it('allows async $apply with $applyAsync', function(done) {
            scope.counter = 0;
            scope.$watch(
                function(scope) { return scope.aValue; },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$applyAsync(function(scope) {
                scope.aValue = 'abc';
            });
            expect(scope.counter).toBe(1);
            setTimeout(function() {
                expect(scope.counter).toBe(2);
                done();
            }, 50);
        });

        it("never executes $applyAsync'ed function in the same cycle", function(done) {
            scope.aValue = [1, 2, 3];
            scope.asyncApplied = false;
            scope.$watch(
                function(scope) { return scope.aValue; },
                function(newValue, oldValue, scope) {
                    scope.$applyAsync(function(scope) {
                        scope.asyncApplied = true;
                    });
                }
            );
            scope.$digest();
            expect(scope.asyncApplied).toBe(false);
            setTimeout(function() {
                expect(scope.asyncApplied).toBe(true);
                done();
            }, 50);
        });

    });

    describe("inheritance", function () {
        it("inherits the parent's properties", function() {
            var parent = new Scope();
            parent.aValue = [1, 2, 3];
            var child = parent.$new();
            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it("does not cause a parent to inherit its properties", function() {
            var parent = new Scope();
            var child = parent.$new();
            child.aValue = [1, 2, 3];
            expect(parent.aValue).toBeUndefined();
        });

        it("inherits the parent's properties whenever they are defined", function() {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it("can manipulate a parent scope's property", function() {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            child.aValue.push(4);
            expect(child.aValue).toEqual([1, 2, 3, 4]);
            expect(parent.aValue).toEqual([1, 2, 3, 4]);
        });

        it("can watch a property in the parent", function() {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            child.counter = 0;
            child.$watch(
                function(scope) { return scope.aValue; },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );
            child.$digest();
            expect(child.counter).toBe(1);
            parent.aValue.push(4);
            child.$digest();
            expect(child.counter).toBe(2);
        });

        it("can be nested at any depth", function() {
            var a = new Scope();
            var aa = a.$new();
            var aaa = aa.$new();
            var aab = aa.$new();
            var ab = a.$new();
            var abb = ab.$new();
            a.value = 1;
            expect(aa.value).toBe(1);
            expect(aaa.value).toBe(1);
            expect(aab.value).toBe(1);
            expect(ab.value).toBe(1);
            expect(abb.value).toBe(1);

            ab.anotherValue = 2;
            expect(abb.anotherValue).toBe(2);
            expect(aa.anotherValue).toBeUndefined();
            expect(aaa.anotherValue).toBeUndefined();
        });

        it("shadows a parent's property with the same name", function() {
            var parent = new Scope();
            var child = parent.$new();
            parent.name = 'Joe';
            child.name = 'Jill';
            expect(child.name).toBe('Jill');
            expect(parent.name).toBe('Joe');
        });

        it("does not shadow members of parent scope's attributes", function() {
            var parent = new Scope();
            var child = parent.$new();
            parent.user = {name: 'Joe'};
            child.user.name = 'Jill';
            expect(child.user.name).toBe('Jill');
            expect(parent.user.name).toBe('Jill');
        });

        it("does not digest its parent(s)", function() {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = 'abc';
            parent.$watch(
                function(scope) { return scope.aValue; },
                function(newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );
            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });

        it("keeps a record of its children", function() {
            var parent = new Scope();
            var child1 = parent.$new();
            var child2 = parent.$new();
            var child2_1 = child2.$new();
            expect(parent.$$children.length).toBe(2);
            expect(parent.$$children[0]).toBe(child1);
            expect(parent.$$children[1]).toBe(child2);
            expect(child1.$$children.length).toBe(0);
            expect(child2.$$children.length).toBe(1);
            expect(child2.$$children[0]).toBe(child2_1);
        });

        //it("digests its children", function() {
        //    var parent = new Scope();
        //    var child = parent.$new();
        //    parent.aValue = 'abc';
        //    child.$watch(
        //        function(scope) { return scope.aValue; },
        //        function(newValue, oldValue, scope) {
        //            scope.aValueWas = newValue;
        //        }
        //    );
        //    parent.$digest();
        //    expect(child.aValueWas).toBe('abc');
        //});

    });

});