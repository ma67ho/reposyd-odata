var assert = require('assert');

const { expect } = require('chai');
const { Parser } = require('../src');

describe('Parser', function () {

    describe('OData v4.01 - query option $count', function () {
        it('should parse $count', function () {
            const result = Parser.parse('$count')
            expect(result.$count).to.be.true
        })
    })
    describe('OData v4.01 - query option $expand', function () {
        it('should parse $expand with a single property', function () {
            const ast = Parser.parse('$expand=Category');
            expect(ast.$expand[0].property).eqls('Category')
            expect(ast.$expand[0].options).to.be.an('object')
        })
        it('should parse $expand with multile properties', function () {
            const ast = Parser.parse('$expand=Category/Products,Products/Suppliers');
            assert.equal(ast.$expand[0].property, 'Category/Products');
            expect(ast.$expand[0].options).to.be.an('object')
            expect(ast.$expand[0].options).to.be.an('object')
            assert.equal(ast.$expand[1].property, 'Products/Suppliers');
            expect(ast.$expand[0].options).to.be.an('object')
        });
        it('should parse $expand with options', function () {
            const ast = Parser.parse("$expand=Category($filter=type eq '42')");
            assert.equal(ast.$expand[0].property, 'Category');
            assert.equal(typeof (ast.$expand[0].options.$filter), 'object');
        });
        it('should parse $expand with option $expand', function () {
            const ast = Parser.parse("$expand=Category($expand=Products)");
            assert.equal(ast.$expand[0].property, 'Category');
            assert.equal(typeof (ast.$expand[0].options.$expand), 'object');
        });
    })
    describe('OData v4.01 - query option $filter', function () {
        describe('Logical Operator', function () {
            describe('eq/ge/gt/le/lt/ne', function () {
                ['eq', 'ge', 'gt', 'le', 'lt', 'ne'].forEach(op => {
                it(`should parse Lastname ${op} 'Doe'`, function () {

                    const ast = Parser.parse(`$filter=Lastname ${op} 'Doe'`);

                    assert.equal(ast.$filter.type, op);
                    assert.equal(ast.$filter.left.type, "property");
                    assert.equal(ast.$filter.left.name, "Lastname");
                    assert.equal(ast.$filter.right.type, "literal");
                    assert.equal(ast.$filter.right.value, "Doe");
                });
            })
            })
            describe('and/or', function () {
                it('should parse multiple conditions in a $filter', function () {

                    const ast = Parser.parse("$filter=Name eq 'John' and LastName lt 'Doe'");

                    assert.equal(ast.$filter.type, "and");
                    assert.equal(ast.$filter.left.type, "eq");
                    assert.equal(ast.$filter.left.left.type, "property");
                    assert.equal(ast.$filter.left.left.name, "Name");
                    assert.equal(ast.$filter.left.right.type, "literal");
                    assert.equal(ast.$filter.left.right.value, "John");
                    assert.equal(ast.$filter.right.type, "lt");
                    assert.equal(ast.$filter.right.left.type, "property");
                    assert.equal(ast.$filter.right.left.name, "LastName");
                    assert.equal(ast.$filter.right.right.type, "literal");
                    assert.equal(ast.$filter.right.right.value, "Doe");
                });

            })
            describe('in', function () {
                it('should parse array', function () {
                    const ast = Parser.parse("$filter=Status in ('John')");
                    assert.equal(ast.$filter.left.name, "Status");
                    // assert.equal(ast.$filter.right.value.contains("John"), true);
                });

            })
        })
        describe('String and Collection Functions with 1 arg', function () {
            ['length'].forEach(function (func) {
                it('should parse ' + func + ' with 1 arg', function (done) {
                    const ast = Parser.parse("$filter=" + func + "(haystack) eq 'test'");
                    assert.equal(ast.$filter.type, "eq");

                    assert.equal(ast.$filter.left.type, "functioncall");
                    assert.equal(ast.$filter.left.func, func);
                    assert.equal(ast.$filter.left.args[0].type, "property");
                    assert.equal(ast.$filter.left.args[0].name, "haystack");

                    assert.equal(ast.$filter.right.type, "literal");
                    assert.equal(ast.$filter.right.value, "test");
                    done()
                });
            })
        })
        describe('String and Collection Functions with 2 args', function () {
            ['concat', 'contains', 'endswith', 'indexof', 'startswith', 'substring'].forEach(function (func) {
                it('should parse ' + func + ' with 2 args', function (done) {
                    const ast = Parser.parse("$filter=" + func + "(haystack,'needle') eq 'test'");

                    assert.equal(ast.$filter.type, "eq");

                    assert.equal(ast.$filter.left.type, "functioncall");
                    assert.equal(ast.$filter.left.func, func);
                    assert.equal(ast.$filter.left.args[0].type, "property");
                    assert.equal(ast.$filter.left.args[0].name, "haystack");
                    assert.equal(ast.$filter.left.args[1].type, "literal");
                    assert.equal(ast.$filter.left.args[1].value, "needle");

                    assert.equal(ast.$filter.right.type, "literal");
                    assert.equal(ast.$filter.right.value, "test");
                    done()
                });
            });
        })
        describe('String and Collection Functions with 3 args', function () {
            ['substring'].forEach(function (func) {
                it('should parse ' + func + ' with 3 args', function (done) {
                    const ast = Parser.parse("$filter=" + func + "(haystack,2,4) eq 'test'");

                    assert.equal(ast.$filter.type, "eq");

                    assert.equal(ast.$filter.left.type, "functioncall");
                    assert.equal(ast.$filter.left.func, func);
                    assert.equal(ast.$filter.left.args[0].type, "property");
                    assert.equal(ast.$filter.left.args[0].name, "haystack");
                    assert.equal(ast.$filter.left.args[1].type, "literal");
                    assert.equal(ast.$filter.left.args[1].value, "2");
                    assert.equal(ast.$filter.left.args[2].type, "literal");
                    assert.equal(ast.$filter.left.args[2].value, "4");

                    assert.equal(ast.$filter.right.type, "literal");
                    assert.equal(ast.$filter.right.value, "test");
                    done()
                });
            });
        })
        describe.skip('Collection Functions')
        describe('String Functions', function () {
            ['tolower', 'toupper', 'trim'].forEach(function (func) {
                it('should parse ' + func + ' $filter', function (done) {
                    const ast = Parser.parse("$filter=" + func + "(value) eq 'test'");
                    assert.equal(ast.$filter.type, "eq");

                    assert.equal(ast.$filter.left.type, "functioncall");
                    assert.equal(ast.$filter.left.func, func);
                    assert.equal(ast.$filter.left.args[0].type, "property");
                    assert.equal(ast.$filter.left.args[0].name, "value");

                    assert.equal(ast.$filter.right.type, "literal");
                    assert.equal(ast.$filter.right.value, "test");
                    done()
                });
            });

        })
        describe('Date and Time Functions', function () {
            ['year', 'month', 'day', 'hour', 'minute', 'second'].forEach(function (func) {
                it('should parse ' + func + ' $filter', function (done) {
                    const ast = Parser.parse("$filter=" + func + "(value) gt 0");

                    assert.equal(ast.$filter.type, "gt");

                    assert.equal(ast.$filter.left.type, "functioncall");
                    assert.equal(ast.$filter.left.func, func);
                    assert.equal(ast.$filter.left.args[0].type, "property");
                    assert.equal(ast.$filter.left.args[0].name, "value");

                    assert.equal(ast.$filter.right.type, "literal");
                    assert.equal(ast.$filter.right.value, "0");
                    done()
                });
            });

        })
        describe.skip('Arithmetic Functions')
        describe.skip('Type Functions')
        describe.skip('Geo Functions')
        describe.skip('Conditional Functions')
        describe('Lambda Operators', function () {
            it('should parse lambda operator all', function () {

                const ast = Parser.parse("$filter=specifies/element/all(c eq 1)");
                assert.equal(ast.$filter.type, 'lambda')
                assert.equal(ast.$filter.lambda.match, "all");
                assert.equal(ast.$filter.lambda.expression.type, "eq");
                assert.equal(ast.$filter.lambda.expression.left.type, "property");
                assert.equal(ast.$filter.lambda.expression.left.name, "c");
                assert.equal(ast.$filter.lambda.expression.right.type, "literal");
                assert.equal(ast.$filter.lambda.expression.right.value, 1);
            });
            it('should parse lambda operator any', function () {

                const ast = Parser.parse("$filter=specifies/element/any(c eq 1)");
                assert.equal(ast.$filter.type, 'lambda')
                assert.equal(ast.$filter.lambda.match, "any");
                assert.equal(ast.$filter.lambda.expression.type, "eq");
                assert.equal(ast.$filter.lambda.expression.left.type, "property");
                assert.equal(ast.$filter.lambda.expression.left.name, "c");
                assert.equal(ast.$filter.lambda.expression.right.type, "literal");
                assert.equal(ast.$filter.lambda.expression.right.value, 1);
            });
        })
        describe('Literals', function () {
            it('should parse $filter containing quote', function () {
                const ast = Parser.parse("$filter=Name eq 'O''Neil'");

                assert.equal(ast.$filter.type, "eq");
                assert.equal(ast.$filter.left.type, "property");
                assert.equal(ast.$filter.left.name, "Name");
                assert.equal(ast.$filter.right.type, "literal");
                assert.equal(ast.$filter.right.value, "O'Neil");
            });

            it('should parse $filter with subproperty', function () {
                const ast = Parser.parse("$filter=User/Name eq 'Jef'");
                assert.equal(ast.$filter.type, "eq");
                assert.equal(ast.$filter.left.type, "property");
                assert.equal(ast.$filter.left.name, "User/Name");
                assert.equal(ast.$filter.right.type, "literal");
                assert.equal(ast.$filter.right.value, "Jef");
            });
            it('should parse boolean okay', function () {
                let ast = Parser.parse('$filter=status eq true');
                assert.equal(ast.$filter.right.value, true);
                ast = Parser.parse('$filter=status eq false');
                assert.equal(ast.$filter.right.value, false);
            });

            it('should parse numbers okay', function () {
                let ast = Parser.parse('$filter=status eq 3');
                assert.equal(ast.$filter.right.value, 3);
                // Test multiple digits - problem of not joining digits to array
                ast = Parser.parse('$filter=status eq 34');
                assert.equal(ast.$filter.right.value, 34);
                // Test number starting with 1 - problem of boolean rule order
                ast = Parser.parse('$filter=status eq 12');
                assert.equal(ast.$filter.right.value, 12);
            });

            it('should parse negative numbers okay', function () {
                let ast = Parser.parse('$filter=status eq -3');
                assert.equal(ast.$filter.right.value, -3);
                ast = Parser.parse('$filter=status eq -34');
                assert.equal(ast.$filter.right.value, -34);
            });

            it('should parse decimal numbers okay', function () {
                let ast = Parser.parse('$filter=status eq 3.4');
                assert.equal(ast.$filter.right.value, '3.4');
                ast = Parser.parse('$filter=status eq -3.4');
                assert.equal(ast.$filter.right.value, '-3.4');
            });

            it('should parse double numbers okay', function () {
                let ast = Parser.parse('$filter=status eq 3.4e1');
                assert.equal(ast.$filter.right.value, '3.4e1');
                ast = Parser.parse('$filter=status eq -3.4e-1');
                assert.equal(ast.$filter.right.value, '-3.4e-1');
            });

        })
        describe('$count', function () {
            it('should filter with $count', function () {
                const ast = Parser.parse("$filter=a/b/$count eq 'John'");
                assert.equal(ast.$filter.type, "count");
                assert.equal(ast.$filter.count.left.name, "a/b");
                assert.equal(ast.$filter.count.type, "eq");
                assert.equal(ast.$filter.count.right.value, "John");
            });

        })
    })
    describe('OData v4.01 - query option $format', function () {
        it('should parse a single option', function () {
            const result = Parser.parse('$format=option=A')
            expect(result.$format).to.be.an('array')
            expect(result.$format[0]).eqls('option=A')
        })
        it('should parse a multiple options separetd by a semicolon', function () {
            const result = Parser.parse('$format=optionA=B;optionB=A')
            expect(result.$format).to.be.an('array')
            expect(result.$format[0]).eqls('optionA=B')
            expect(result.$format[1]).eqls('optionB=A')
        })
    })
    describe('OData v4.01 - query option $orderby', function () {
        it('should parse a single property and default sort order', function () {
            const result = Parser.parse('$orderby=property')
            expect(result.$orderby).to.be.an('array')
            expect(result.$orderby[0].dir).eqls('asc')
            expect(result.$orderby[0].property).eqls('property')
        })
        it('should parse a single property and sort order descending', function () {
            const result = Parser.parse('$orderby=property desc')
            expect(result.$orderby).to.be.an('array')
            expect(result.$orderby[0].dir).eqls('desc')
            expect(result.$orderby[0].property).eqls('property')
        })
        it('should parse a multiple properties', function () {
            const result = Parser.parse('$orderby=propertyA,propertyB desc')
            expect(result.$orderby).to.be.an('array')
            expect(result.$orderby[0].dir).eqls('asc')
            expect(result.$orderby[0].property).eqls('propertyA')
            expect(result.$orderby[1].dir).eqls('desc')
            expect(result.$orderby[1].property).eqls('propertyB')
        })
    })
    describe('OData v4.01 - query option $select', function () {
        it('should parse string params', function () {

            const ast = Parser.parse('$select=Rating');

            assert.equal(ast.$select[0], 'Rating');
        });
        it('should accept * in $select', function () {

            const ast = Parser.parse('$select=*');

            assert.equal(ast.$select[0], '*');
        });
        it('should accept more than two fields', function () {

            const ast = Parser.parse('$select=Rating,Name,LastName');

            assert.equal(ast.$select[0], 'Rating');
            assert.equal(ast.$select[1], 'Name');
            assert.equal(ast.$select[2], 'LastName');
        });

    })
    describe('OData v4.01 - query option $skip', function () {
        it('should parse $slip and return the value', function () {
            const ast = Parser.parse('$skip=40');
            expect(ast.$skip).eqls(40)
        })
    })
    describe('OData v4.01 - query option $top', function () {
        it('should parse $top and return the value', function () {

            const ast = Parser.parse('$top=40');

            assert.equal(ast.$top, 40);
        });
        it('should return an error if invalid value', function () {
            const ast = Parser.parse("$top=foo");

            assert.equal(ast.error, "invalid $top parameter");
        });
    })
    describe('OData v4.01 - multiple query params', function () {
        it('should parse two params', function () {

            const ast = Parser.parse('$top=4&$skip=5');

            assert.equal(ast.$top, 4);
            assert.equal(ast.$skip, 5);
        });


        it('should parse three params', function () {

            const ast = Parser.parse('$top=4&$skip=5&$select=Rating');

            assert.equal(ast.$top, 4);
            assert.equal(ast.$skip, 5);
            assert.equal(ast.$select[0], "Rating");
        });
    })

    describe('OData v4.01 - custom query options', function () {
        it('should parse a single custom option', function () {
            const ast = Parser.parse('metamodel=short')
            expect(ast.custom).to.be.an('object')
            expect(ast.custom).to.have.property('metamodel', 'short')
        })
        it('should parse a multiple custom options', function () {
            const ast = Parser.parse('metamodel=short&debug=info&timeout=2s')
            expect(ast.custom).to.be.an('object')
            expect(ast.custom).to.have.property('metamodel', 'short')
            expect(ast.custom).to.have.property('debug', 'info')
            expect(ast.custom).to.have.property('timeout', '2s')
        })
    })

    //         it('should accept * and , and / in $select', function () {

    //             const ast = Parser.parse('$select=*,Category/Name');

    //             assert.equal(ast.$select[0], '*');
    //             assert.equal(ast.$select[1], 'Category/Name');
    //         });


    //         // This select parameter is not currently supported.
    //         it('should accept * after . in $select', function () {

    //             const ast = Parser.parse('$select=DemoService.*');

    //             assert.equal(ast.$select[0], 'DemoService.*');
    //         });

    //         it('should accept single-char field in $select', function () {

    //             const ast = Parser.parse('$select=r');

    //             assert.equal(ast.$select[0], 'r');
    //         });

    //         it('should parse order by', function () {

    //             const ast = Parser.parse('$orderby=ReleaseDate desc, Rating');

    //             assert.equal(ast.$orderby[0].ReleaseDate, 'desc');
    //             assert.equal(ast.$orderby[1].Rating, 'asc');

    //         });


    //         it('should parse multiple conditions in a $filter', function () {

    //             const ast = Parser.parse("$filter=Name eq 'John' and LastName lt 'Doe'");

    //             assert.equal(ast.$filter.type, "and");
    //             assert.equal(ast.$filter.left.type, "eq");
    //             assert.equal(ast.$filter.left.left.type, "property");
    //             assert.equal(ast.$filter.left.left.name, "Name");
    //             assert.equal(ast.$filter.left.right.type, "literal");
    //             assert.equal(ast.$filter.left.right.value, "John");
    //             assert.equal(ast.$filter.right.type, "lt");
    //             assert.equal(ast.$filter.right.left.type, "property");
    //             assert.equal(ast.$filter.right.left.name, "LastName");
    //             assert.equal(ast.$filter.right.right.type, "literal");
    //             assert.equal(ast.$filter.right.right.value, "Doe");
    //         });

    //         it('should parse multiple complex conditions in a $filter', function () {

    //             const ast = Parser.parse("$filter=Name eq 'John' and (LastName lt 'Doe' or LastName gt 'Aro')");

    //             assert.equal(ast.$filter.type, "and");
    //             assert.equal(ast.$filter.left.type, "eq");
    //             assert.equal(ast.$filter.left.left.type, "property");
    //             assert.equal(ast.$filter.left.left.name, "Name");
    //             assert.equal(ast.$filter.left.right.type, "literal");
    //             assert.equal(ast.$filter.left.right.value, "John");
    //             assert.equal(ast.$filter.right.type, "or");
    //             assert.equal(ast.$filter.right.left.type, "lt");
    //             assert.equal(ast.$filter.right.left.left.name, "LastName");
    //             assert.equal(ast.$filter.right.left.right.type, "literal");
    //             assert.equal(ast.$filter.right.left.right.value, "Doe");
    //             assert.equal(ast.$filter.right.right.type, "gt");
    //             assert.equal(ast.$filter.right.right.left.name, "LastName");
    //             assert.equal(ast.$filter.right.right.right.type, "literal");
    //             assert.equal(ast.$filter.right.right.right.value, "Aro");
    //         });

    //         it('should parse substringof $filter', function () {

    //             const ast = Parser.parse("$filter=substringof('nginx', Data)");

    //             assert.equal(ast.$filter.type, "functioncall");
    //             assert.equal(ast.$filter.func, "substringof");

    //             assert.equal(ast.$filter.args[0].type, "literal");
    //             assert.equal(ast.$filter.args[0].value, "nginx");

    //             assert.equal(ast.$filter.args[1].type, "property");
    //             assert.equal(ast.$filter.args[1].name, "Data");

    //         });

    //         it('should parse substringof $filter with empty string', function () {

    //             const ast = Parser.parse("$filter=substringof('', Data)");

    //             assert.equal(ast.$filter.args[0].type, "literal");
    //             assert.equal(ast.$filter.args[0].value, "");

    //         });

    //         it('should parse substringof $filter with string containing quote', function () {

    //           const ast = Parser.parse("$filter=substringof('ng''inx', Data)");
    //           assert.equal(ast.$filter.args[0].type, "literal");
    //           assert.equal(ast.$filter.args[0].value, "ng'inx");

    //         });

    //         it('should parse substringof $filter with string starting with quote', function () {

    //           const ast = Parser.parse("$filter=substringof('''nginx', Data)");

    //           assert.equal(ast.$filter.args[0].type, "literal");
    //           assert.equal(ast.$filter.args[0].value, "'nginx");

    //         });

    //         it('should parse substringof $filter with string ending with quote', function () {

    //           const ast = Parser.parse("$filter=substringof('nginx''', Data)");

    //           assert.equal(ast.$filter.args[0].type, "literal");
    //           assert.equal(ast.$filter.args[0].value, "nginx'");

    //         });

    //         it('should parse substringof eq true in $filter', function () {

    //             const ast = Parser.parse("$filter=substringof('nginx', Data) eq true");

    //             assert.equal(ast.$filter.type, "eq");


    //             assert.equal(ast.$filter.left.type, "functioncall");
    //             assert.equal(ast.$filter.left.func, "substringof");
    //             assert.equal(ast.$filter.left.args[0].type, "literal");
    //             assert.equal(ast.$filter.left.args[0].value, "nginx");
    //             assert.equal(ast.$filter.left.args[1].type, "property");
    //             assert.equal(ast.$filter.left.args[1].name, "Data");

    //             assert.equal(ast.$filter.right.type, "literal");
    //             assert.equal(ast.$filter.right.value, true);
    //         });

    //         it('should parse startswith $filter', function () {

    //             const ast = Parser.parse("$filter=startswith('nginx', Data)");

    //             assert.equal(ast.$filter.type, "functioncall");
    //             assert.equal(ast.$filter.func, "startswith");

    //             assert.equal(ast.$filter.args[0].type, "literal");
    //             assert.equal(ast.$filter.args[0].value, "nginx");

    //             assert.equal(ast.$filter.args[1].type, "property");
    //             assert.equal(ast.$filter.args[1].name, "Data");

    //         });



    //         it('should parse year datetimeoffset $filter', function() {
    //             const ast = Parser.parse("$filter=my_year lt year(datetimeoffset'2016-01-01T01:01:01Z')");

    //             assert.equal(ast.$filter.type, "lt");

    //             assert.equal(ast.$filter.left.type, "property");
    //             assert.equal(ast.$filter.left.name, "my_year");

    //             assert.equal(ast.$filter.right.type, "functioncall");
    //             assert.equal(ast.$filter.right.func, "year");
    //             assert.equal(ast.$filter.right.args[0].type, "literal");
    //             assert.ok(ast.$filter.right.args[0].value instanceof Date);
    //         });

    // ['indexof', 'concat', 'substring', 'replace'].forEach(function (func) {
    //   it('should parse ' + func + ' $filter', function (done) {
    //     const ast = Parser.parse("$filter=" + func + "('haystack',needle) eq 'test'");

    //     assert.equal(ast.$filter.type, "eq");

    //     assert.equal(ast.$filter.left.type, "functioncall");
    //     assert.equal(ast.$filter.left.func, func);
    //     assert.equal(ast.$filter.left.args[0].type, "literal");
    //     assert.equal(ast.$filter.left.args[0].value, "haystack");
    //     assert.equal(ast.$filter.left.args[1].type, "property");
    //     assert.equal(ast.$filter.left.args[1].name, "needle");

    //     assert.equal(ast.$filter.right.type, "literal");
    //     assert.equal(ast.$filter.right.value, "test");
    //     done()
    //   });
    // });



    // it('should parse lambda operator', function () {

    //     const ast = Parser.parse("$filter=a/b/all()'");

    //     console.log(ast)
    //     // assert.equal(ast.$filter.type, "eq");
    //     // assert.equal(ast.$filter.left.type, "property");
    //     // assert.equal(ast.$filter.left.name, "Name");
    //     // assert.equal(ast.$filter.right.type, "literal");
    //     // assert.equal(ast.$filter.right.value, "Jef");
    // });

    it('should parse dummy $filter', function () {
        const ast = Parser.parse("$filter=indexof(value,'A') eq 'test'");
        assert.equal(ast.$filter.type, "eq");

        assert.equal(ast.$filter.left.type, "functioncall");
        assert.equal(ast.$filter.left.func, "indexof");
        assert.equal(ast.$filter.left.args[0].type, "property");
        assert.equal(ast.$filter.left.args[0].name, "value");

        assert.equal(ast.$filter.right.type, "literal");
        assert.equal(ast.$filter.right.value, "test");
    });

});
