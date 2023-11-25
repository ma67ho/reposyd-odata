const chai = require('chai')
const { expect } = require('chai')
const { Query } = require('../src')

describe('Query', function () {
  it('should contruct am empty query', function () {
    const q = new Query()
    expect(q.toString()).to.be.empty
  })
  it('should set top(10)', function () {
    const q = new Query()
    q.top(10)
    expect(q.toString()).to.include('$top=10')
  })

  it('should add a simple filter', function () {
    const q = new Query()
    q.filter().equals(Query.property('a'), Query.literal('b'))
    expect(q.toString()).eqls("$filter=a eq 'b'")
  })
  it('should add a complex filter', function () {
    const q = new Query()
    q.filter()
      .and()
      .equals(Query.property('a'), Query.literal('b'))
      .equals(Query.property('c'), Query.literal('d'))

    expect(q.toString()).eqls("$filter=a eq 'b' and c eq 'd'")
  })
  it('should add a more complex filter', function () {
    const q = new Query()
    q.filter()
      .and()
      .equals(Query.property('a'), Query.literal('b'))
      .or()
      .equals(Query.property('c'), Query.literal('d'))
      .equals(Query.property('e'), Query.literal('f'))

    expect(q.toString()).eqls("$filter=a eq 'b' and (c eq 'd' or e eq 'f')")
  })
  it('should add a even more complex filter', function () {
    const q = new Query()
    q.filter()
      .or()
      .and()
      .equals(Query.property('a'), Query.literal('b'))
      .equals(Query.property('c'), Query.literal('d'))
      .up()
      .and()
      .equals(Query.property('e'), Query.literal('f'))
      .equals(Query.property('g'), Query.literal('h'))

    expect(q.toString()).eqls("$filter=(a eq 'b' and c eq 'd') or (e eq 'f' and g eq 'h')")
  })
  it('should add expand item', () => {
    const q = new Query()
    q.expand().add('a')
    expect(q.toString()).to.include('$expand=a')
  })

  it('should add expand item with filter', () => {
    const q = new Query()
    q.expand()
      .add('a')
      .filter()
      .equals(Query.property('c'), Query.literal('d'))
    expect(q.toString()).eqls("$expand=a($filter=c eq 'd')")
  })

  it('should parse $filter', function () {
    const q = Query.parse('$filter=answer eq 42')
    expect(q.toString()).to.include('$filter=answer eq 42')
  })

  it('should parse $top=20', function () {
    const q = Query.parse('$top=20')
    expect(q.toString()).to.include('$top=20')
  })
})
