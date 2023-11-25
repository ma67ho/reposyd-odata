const parser = require('./odata-parser')

const LOGICALOPERATOR = {
  EQUALS: 'eq',
  AND: 'and',
  OR: 'or',
  GREATER_THAN: 'gt',
  GREATER_THAN_EQUAL: 'ge',
  LESS_THAN: 'lt',
  LESS_THAN_EQUAL: 'le',
  LIKE: 'like',
  NOT_EQUAL: 'ne',
  IN: 'in'
}

function logicalOperator(item, left, type, right) {
  return new LogicalOperator(item, type, left, right)
}

class QueryOperand {
  constructor(type) {
    this._type = type
  }

  toString() {
    return ''
  }

  get type() {
    return this._type
  }
}

class QueryLiteral extends QueryOperand {
  constructor(value) {
    super('literal')
    this._value = value
  }

  toString() {
    if (typeof this._value === 'string') {
      return `'${this._value}'`
    }
    return String(this._value)
  }

  get value() {
    return this._value
  }
}

class QueryProperty extends QueryOperand {
  constructor(name) {
    super('property')
    this._name = name
  }

  get name() {
    this._name
  }

  toString() {
    return this._name.trim()
  }
}

class QueryFilterItem {
  constructor(parent, type) {
    this._parent = parent
    this._type = type
  }

  toString() {
    return ''
  }

  up() {
    return this._parent
  }

  get type() {
    return this._type
  }
}

class LogicalOperatorAndOr extends QueryFilterItem {
  constructor(parent, type) {
    super(parent, type)
    this._conditions = []
  }

  equals(left, right) {
    this._conditions.push(new LogicalOperator(this, 'eq', left, right))
    return this
  }

  and() {
    const item = new LogicalOperatorAndOr(this, 'and')
    this._conditions.push(item)
    return item
  }

  or() {
    const item = new LogicalOperatorAndOr(this, 'or')
    this._conditions.push(item)
    return item
  }

  toString() {
    if (this._conditions.length < 2) {
      return ''
    }
    let s = ''
    let closingBracket = 9
    for (let i = 0; i < this._conditions.length; i++) {
      if (i > 0) {
        s += ` ${this.type} `
      }
      if (i > 2 || this._conditions[i].type === 'and' || this._conditions[i].type === 'or') {
        closingBracket++
        s += '('
      }
      s += this._conditions[i].toString()
      if (this._conditions[i].type === 'and' || this._conditions[i].type === 'or') {
        closingBracket--
        s += ')'
      }
    }
    s = s.padEnd(closingBracket, ')')
    return s
  }
}

class LogicalOperator extends QueryFilterItem {
  constructor(parent, type, left, right) {
    super(parent, type)
    this._left = left
    this._right = right
  }

  toString() {
    return `${this._left.toString()} ${this.type} ${this._right.toString()}`
  }
}


class QueryFilter {
  constructor(parent) {
    this._root = null
    this._parent = parent
  }

  and() {
    if (this._root !== null) {
      throw new Error()
    }
    this._root = new LogicalOperatorAndOr(this, 'and')
    return this._root
  }
  or() {
    if (this._root !== null) {
      throw new Error()
    }
    this._root = new LogicalOperatorAndOr(this, 'or')
    return this._root
  }

  equals(left, right) {
    this._root = logicalOperator(this, left, LOGICALOPERATOR.EQUALS, right)
  }
  greaterThan(left, right) {
    this._root = logicalOperator(this, left, LOGICALOPERATOR.GREATER_THAN, right)
  }
  greaterThanEqual(left, right) {
    this._root = logicalOperator(this, left, LOGICALOPERATOR.GREATER_THAN_EQUAL, right)
  }
  lessThan(left, right) {
    this._root = logicalOperator(this, left, LOGICALOPERATOR.LESS_THAN, right)
  }
  lessThanEqual(left, right) {
    this._root = logicalOperator(this, left, LOGICALOPERATOR.LESS_THAN_EQUAL, right)
  }
  notEquals(left, right) {
    this._root = logicalOperator(this, left, LOGICALOPERATOR.NOT_EQUAL, right)
  }

  hasCondition() {
    return this._root !== null
  }

  query() {
    if (this._parent instanceof Query) {
      return this._parent
    }
    return this._parent.query()
  }

  toString() {
    if (this._root === null) {
      return ''
    }
    return this._root.toString()
  }

  static isLiternal(type) {
    return type === 'literal'
  }
  static isLogicalConnection(type) {
    return [LOGICALOPERATOR.AND, LOGICALOPERATOR.OR].includes(type)
  }
  static isLogicalOperator(type) {
    return Object.values(LOGICALOPERATOR).includes(type)
  }
  static isProperty(type) {
    return type === 'property'
  }


}

class QueryOption {
  constructor(query) {
    this._query = query
  }

  query() {
    return this._query
  }
}

class QueryExpandItem {
  constructor(parent, property) {
    this._filter = null
    this._parent = parent
    this._property = property
  }
  filter() {
    if (this._filter === null) {
      this._filter = new QueryFilter(this)
    }
    return this._filter
  }

  query() {
    if (parent instanceof QueryExpand) {
      return parent.query()
    }
    return this._parent.query()
  }

  toString() {
    let s = this._property
    const opts = []
    if (this._filter) {
      opts.push(`$filter=${this._filter.toString()}`)
    }
    if (opts.length > 0) {
      s += `(${opts.map(it => it.toString()).join(';')})`
    }
    return s
  }
}

class QueryExpand extends QueryOption {
  constructor(query) {
    super(query)
    this._items = []
  }

  add(property) {
    const item = new QueryExpandItem(this, property)
    this._items.push(item)
    return item
  }

  items() {
    return this._items
  }

  toString() {
    if (this._items.length === 0) {
      return ''
    }
    return "$expand=" + this._items.map(it => it.toString()).join(',')
  }
}

class Query {
  constructor(params) {
    params = params || {}
    this._expand = new QueryExpand(this)
    this._filter = null
    this._top = params.$top || -1
  }

  expand() {
    return this._expand
  }

  filter() {
    if (this._filter === null) {
      this._filter = new QueryFilter()
    }
    return this._filter
  }

  top(val) {
    if (val !== undefined) {
      this._top = val
    }
    return this
  }

  toString() {
    const opts = []
    if (this._expand.items().length > 0) {
      opts.push(this._expand.toString())
    }
    if (this._filter !== null) {
      opts.push(`$filter=${this._filter.toString()}`)
    }
    if (this._top > -1) {
      opts.push(`$top=${this._top}`)
    }

    return opts.join('&')
  }

  static literal(value) {
    return new QueryLiteral(value)
  }

  static property(name) {
    return new QueryProperty(name)
  }


  static parse(params) {
    function logicalConnection(item, parent) {
      let it
      if (item.type === 'and') {
        it = parent.and()
      } else if (item.type === 'and') {
        it = parent.or()
      }
      parseItem(item.left, it)
      parseItem(item.right, it)
      return it
    }
    function logicalOperator(item, parent) {
      if (item.type === LOGICALOPERATOR.EQUALS) {
        return parent.equals(parseItem(item.left), parseItem(item.right))
      } else if (item.type === LOGICALOPERATOR.GREATER_THAN) {
        return parent.greaterThan(parseItem(item.left), parseItem(item.right))
      } else if (item.type === LOGICALOPERATOR.GREATER_THAN_EQUAL) {
        return parent.greaterThanEqual(parseItem(item.left), parseItem(item.right))
      } else if (item.type === LOGICALOPERATOR.IN) {
        return parent.in(parseItem(item.left), parseItem(item.right))
      } else if (item.type === LOGICALOPERATOR.LESS_THAN) {
        return parent.lessThan(parseItem(item.left), parseItem(item.right))
      } else if (item.type === LOGICALOPERATOR.LESS_THAN_EQUAL) {
        return parent.lessThanEqual(parseItem(item.left), parseItem(item.right))
      }
    }

    function parseItem(item, parent) {
      if (QueryFilter.isLiternal(item.type)) {
        return Query.literal(item.value)
      } else if (QueryFilter.isLogicalConnection(item.type)) {
        return logicalConnection(item, parent)
      } else if (QueryFilter.isLogicalOperator(item.type)) {
        return logicalOperator(item, parent)
      } else if (QueryFilter.isProperty(item.type)) {
        return Query.property(item.name)
      }
    }
    let odata
    if (typeof params === 'string') {
      odata = parser.parse(params)
    } else {
      odata = params
    }
    const q = new Query()
    if (odata.$filter !== undefined) {
      parseItem(odata.$filter, q.filter())
    }
    if (odata.$top !== undefined) {
      q.top(odata.$top)
    }
    return q
  }
}

module.exports = Query
