{
	function count(item) {
    	return { name: item, type: 'count' }        	
    }
    function conditionLeft(v) {
    	return typeof v === 'object' ? v : { name: v, type: 'property' }
    }
	function literal(item) {
    	return { value: item, type: 'literal' }
    }
}

start = query
//
// Constants
//
DIGIT                       = 	[0-9]
INT                         = 	a:DIGIT+ { return a.join(''); }
HEXDIG                      =   [0-9a-fA-F]
//peg does not support repetition (ie: [a]{4})
HEXDIG2                     =   HEXDIG HEXDIG
HEXDIG4                     =   HEXDIG2 HEXDIG2
HEXDIG8                     =   HEXDIG4 HEXDIG8
PATHSEPARATOR				= 	"/"
SQUOTE                      =   "%x27" / "'"
WHITESPACE                  =  	' '  //Whitespace
WILDCARD					=	"*"
// helpers
unreserved                  = a:[a-zA-Z0-9-_]+ { return a.join(''); }
validstring                 = a:([^']/escapedQuote)* { return a.join('').replace(/('')/g, "'"); }
escapedQuote                = a:"''" { return a; }

//
// Literal definitions
//
arrayValue                  = a:int32 / guid / string
arraySeparator              = a:", " / ","
array                       = "(" a:arrayValue b:(arraySeparator arrayValue)* ")" {
                                return [a].concat(b.map(f => f[1]))
                              }

binary                      =   ( "%d88" / "binary" )
                                SQUOTE
                                HEXDIG HEXDIG
                                SQUOTE
                                // note: "X" is case sensitive "binary" is not hence using the character code.

boolean                     =   "true" { return true; } /
                                "1" { return true; } /
                                "false" { return false; } /
                                "0" { return false; }

byte                        =   DIGIT DIGIT DIGIT
                                // numbers in the range from 0 to 257
dateTime                    =   "datetime" SQUOTE a:dateTimeBody SQUOTE { return new Date(a); }

dateTimeOffset              =   "datetimeoffset" SQUOTE a:dateTimeOffsetBody SQUOTE { return new Date(a); }

dateTimeBodyA               =  a:year "-" b:month "-" c:day "T" d:hour ":" e:minute {
                                    return a + '-' + b + '-' + c + "T" + d + ":" + e;
                                }
dateTimeBodyB               =  a:dateTimeBodyA ":" b:second { return a + ":" + b; }
dateTimeBodyC               =  a:dateTimeBodyB "." b:nanoSeconds { return a + "." + b; }
dateTimeBodyD               =  a:dateTimeBodyC "-" b:zeroToTwentyFour ":" c:zeroToSixty {
                                    return a + "-" + b + ":" + c;
                                }
dateTimeBody                =
                               dateTimeBodyD
                             / dateTimeBodyC
                             / dateTimeBodyB
                             / dateTimeBodyA

dateTimeOffsetBody          =   a:dateTimeBody "Z" { return a + "Z"; } /
                                a:dateTimeBody b:sign c:zeroToThirteen ":00" { return a + b + c + ":00"; } /
                                a:dateTimeBody b:sign c:zeroToThirteen { return a + b + c; } /
                                a:dateTimeBody b:sign c:zeroToTwelve ":" d:zeroToSixty { return a + b + c + ":" + d; } /
                                a:dateTimeBody b:sign c:zeroToTwelve { return a + b + c; }

decimal                     =  sign:sign? digit:DIGIT+ "." decimal:DIGIT+ ("M"/"m")? { return (sign || '') + digit.join('') + '.' + decimal.join(''); } /
                               sign:sign? digit:DIGIT+ ("M"/"m") { return sign + digit.join(''); }

double                      =  sign:sign? digit:DIGIT "." decimal:DIGIT+ ("e" / "E") signexp:sign? exp:DIGIT+ ("D" / "d")? { return (sign || '') + digit + '.' + decimal.join('') + 'e' + (signexp || '') + exp.join(''); } /
                               sign:sign? digit:DIGIT+ "." decimal:DIGIT+ ("D" / "d") { return sign + digit.join('') + '.' + decimal.join(''); } /
                               sign:sign? digit:DIGIT+ ("D" / "d") { return (sign || '') + digit.join(''); } /
                               nanInfinity ("D" / "d")?

guid                        =   "guid" SQUOTE HEXDIG8 "-" HEXDIG4 "-" HEXDIG4 "-" HEXDIG8 HEXDIG4 SQUOTE

int32                       =   sign:sign? digit:DIGIT+ { return parseInt(digit.join('')) * (sign === '-' ? -1 : 1); }
                                // numbers in the range from -2147483648 to 2147483647

int64                       =   sign? DIGIT+ ( "L" / "l" )?
                                // numbers in the range from -9223372036854775808 to 9223372036854775807

sign                        =   "+" / "-"
nan                         =   "NaN"
negativeInfinity            =   "-INF"
positiveInfinity            =   "INF"
nanInfinity                 =   nan / negativeInfinity / positiveInfinity

null                        =   "null"?
                                // The optional qualifiedTypeName is used to specify what type this null value should be considered.
                                // Knowing the type is useful for function overload resolution purposes.
sbyte                       =   sign? DIGIT DIGIT? DIGIT?
                                // numbers in the range from -128 to 127

single                      =   (
                                    sign DIGIT "." DIGIT+ ( "e" / "E" ) sign DIGIT+ /
                                    sign DIGIT* "." DIGIT+ /
                                    sign DIGIT+
                                ) ("F" / "f") /
                                nanInfinity ( "F" / "f" )?

string                      =   l:SQUOTE v:validstring  r:SQUOTE { return v; }

oneToNine                   =   [1-9]

zeroToTwelve                =   a:"0" b:[1-9] { return a + b;} / a:"1" b:[0-2] { return a + b; }

zeroToThirteen              =   zeroToTwelve / "13"

zeroToSixty                 =   "60" / a:[0-5] b:DIGIT { return a + b; }

zeroToThirtyOne             =   "3" a:[0-1] { return "3" + a; } / a:[0-2] b:DIGIT { return a + b; }

zeroToTwentyFour            =   "2" a:[0-4] { return "2" + a; } / a:[0-1] b:DIGIT { return a + b; }

year                        =  a:DIGIT b:DIGIT c:DIGIT d:DIGIT { return a + b + c + d; }

month                       =   zeroToTwelve

day                         =   zeroToThirtyOne

hour                        =   zeroToTwentyFour

minute                      =   zeroToSixty

second                      =   zeroToSixty

nanoSeconds                 =  INT

//literals					=   array / int32 / boolean / binary / byte / boolean / double / decimal /string / int32 / int64 / null
literals2					=   
                                int32 /
                                int64 /
                                null /
                                guid /
                                double /
                                decimal /
                                single /
                                int32 /
                                int64 /
                                byte /
                                sbyte /
                                boolean /
                                string /
                                array
literals            =   null /
                                binary /
                                dateTime /
                                dateTimeOffset /
                                guid /
                                double /
                                decimal /
                                single /
                                int32 /
                                int64 /
                                byte /
                                sbyte /
                                boolean /
                                string                                

// Operator
OPERATOR					=	"eq" /
     	                        "ne" /
                                "lt" /
                                "le" /
     	                        "gt" /
                                "ge" /
                                "add" /
                                "sub" /
                                "mul" /
                                "div" /
                                "mod" /
                                "in"
                                
notOperator					= "not"                                
inOperator					= "in" WHITESPACE v:array
//
identWord = a:[a-zA-Z]+ { return a.join('')  }
identCount = "$count"
// property path
propertyPathSegment 		= a:[a-zA-Z]+ { return a.join('')  }
propertyPathSegments		= propertyPathSegment|..,  "/" |        
propertyPath 				= l:propertyPathSegments { return l.join('/') }
propertyPathArraySeparator	= 	","
propertyPathArray			= 	a:propertyPath b:(propertyPathArraySeparator propertyPath)* {
									return [a].concat(b.map(f => f[1]))
                        		}
selectPath					= 	w:WILDCARD / a:propertyPath b:(propertyPathArraySeparator propertyPath)* {
									return [a].concat(b.map(f => f[1]))
                        		}
                                
logicalConjunctionSegment	=	filterExpressions
logicalConjunctionSegments	=	logicalConjunctionSegment|.., WHITESPACE ("and" / "or") WHITESPACE |
logicalConjunction			=	l:logicalConjunctionSegments
// 
//
// filter conditions
//
stringLiteral				=	s:string { return { type: 'literal', value: s } }
arrayArgument				=	a:array { return { type: 'literal', value: a }}
booleanArgument				=	a:boolean { return { type: 'literal', value: a } }
stringArgument				=	a:string { return { type: 'literal', value: a } }
propertyArgument			=	a:propertyPath { return { name: a, type: 'property' } }
numberArgument				=	a:(double / decimal / int32 / int64) { return { type: 'literal', value: a } }

literalArgument				=	arrayArgument / numberArgument/ booleanArgument / stringArgument / numberArgument

dateTimeFunctions			= 	"day" /
								"fractionalseconds" /
    	                        "hour" /
        	                    "minute" /
            	                "month" /
                	            "now" /
                    	        "second" /
                        	    "year"
                            
mathFunctions	 			=	"ceiling" /
								"floor" /
								"round"
stringFunctions				=	"substring" / "tolower" / "toupper"

noArgFunctions				= 	"now"
noArgFunction				=	f:noArgFunctions "()" {
									return { args: [], func: f, type: "functioncall" }
                                }

oneArgFunctions				=	"length" / "toupper" / "tolower" / "trim" / dateTimeFunctions
oneArgFunction				= 	f:oneArgFunctions "(" arg0:(oneArgFunction / twoArgsFunction / propertyArgument) ")" {
								return { args: [arg0], func: f, type: "functioncall" }
							}

twoArgsFunctions			= 	"concat" /
								"contains" / 							
    	                        "endswith" /                            
        	                    "indexof" /
            	                "startswith" /
                	            "substring"
                            
twoArgsFunction				= 	f:twoArgsFunctions "(" arg0:(oneArgFunction / twoArgsFunction / propertyArgument) "," arg1:literalArgument ")" {
									return { args: [arg0,arg1], func: f, type: "functioncall" }
								} /
	                            "substring("arg0:propertyArgument "," arg1:literalArgument "," arg2:literalArgument ")" {
									return { args: [arg0,arg1,arg2], func: 'substring',  type: "functioncall" }
								}

lambda 						= 	"(" v:[a-z] ":" WHITESPACE ")" { return v }


filterLogicalConjunction	=	l:filterLeft WHITESPACE o:("and" / "or") WHITESPACE r:filterLeft {
									return { left: l, right: r, type: o}
                                } /
                               "(" l:filterProperty WHITESPACE o:("and" / "or") WHITESPACE r:filterProperty ")" {
									return { left: l, right: r, type: o}
                                }

lambdaOperator				=	l:("all" / "any") "(" e:filterExpressions ")" { return { expression: e, match: l } }
lambdaSegment				= 	a:[a-zA-Z]+ "/" { return a.join('')  }
lambdaSegments				= 	l:lambdaSegment|2..| { return l.join('/') }

filterLambda				=	p:lambdaSegments l:lambdaOperator { return { path: p, lambda: l, type: 'lambda' } }

filterProperty				=   l:filterLeft WHITESPACE o:OPERATOR WHITESPACE r:filterPartRight {
									return { left: conditionLeft(l), right: literal(r), type: o }
								}


filterEntityCount 				= p:propertyPathSegments "/$count" WHITESPACE o:OPERATOR WHITESPACE l:literalArgument { 
									return { 
                                    	count: { 
                                    		left: { name: p.join('/'), type: 'property' },
                                        	right: l,
                                            type: o
                                        },
                                        type: 'count'
                                	}
                                }
filterLeft					=	noArgFunction / oneArgFunction / twoArgsFunction / propertyArgument
filterPartRight				=	literals
                                
filterAndOr					=	"(" l:filterCondition WHITESPACE o:("and" / "or") WHITESPACE n:(notOperator WHITESPACE)? r:filterCondition ")"{
                                	return {left: l, right: r, negate: n || false,type: o }
                                } /
								l:filterCondition WHITESPACE o:("and" / "or") WHITESPACE n:(notOperator WHITESPACE)? r:(filterAndOr / filterCondition) {
                                	return {left: l, right: r, negate: n ? true : false, type: o }
                                }
								
filterCondition				=	l:filterLeft WHITESPACE o:OPERATOR WHITESPACE r:(literalArgument / filterLambda) {
									return { left: l, right: r, type: o}
                                }

filterExpressions			=	filterAndOr / filterCondition / filterEntityCount / filterLambda / filterAndOr / filterProperty 
//filterExpressions			=	filterLogicalConjunction / filterIn / filterEntityCount / filterLambda / filterProperty 

filter						=	"$filter=" f:(filterExpressions) { return [ '$filter', f ] }
//
// $expand
//

navigationPathSegments		= 	s:propertyPathSegment|2..,  "/" | 
navigationPath				= 	p:propertyPathSegments { return { expand: p.join('/') } }
navigationPathFilter		= 	p:propertyPathSegments "($filter=" e:filterExpressions ")" {
									return { expand: p.join('/'), $filter: e}
								}

expandPropertyPath				= 	p:propertyPathSegments { return p.join('/') }
expandEntity					=	p:expandPropertyPath { return { options: {}, property: p } }
expandEntityWithOptions			=	p:expandPropertyPath "(" o:expandEntityOptions ")" { 
									return { options: o, property: p }
                             	   }
expandOptionExpand				=	o:expand
expandOptionFilter				=	f:filter { return { "$filter": f[1] } }                                
expandEntityOptions				=	expandOptionFilter / o:expandOptionExpand {return { "$expand": o[1] }} / navigationPath
expandEntityOptionsSeparator	= 	";"
expandEntityOptionsArray		= 	a:expandEntity b:(expandEntityOptionsSeparator expandEntityOptions)

expandOptions					=	expandEntityWithOptions / expandEntity

expandArraySeparator			=	","
expandArray             		= 	a:expandOptions b:(expandArraySeparator expandOptions)* {
                               		return [a].concat(b.map(f => f[1]))
                                	}                               
expand 							= "$expand=" o:expandArray { return ["$expand", o] }
//
// $orderby
//
orderbySegment				=	p:propertyPathSegment o:(" " d:("asc" / "desc"))? {
									return { dir: o ? o[1] : 'asc' , property: p  }
								}
orderby						=	"$orderby=" l:orderbySegment|.., (", " / ",") | {
								return ["$orderby", l]
                                }
count						=	"$count" { return ["$count", true ] }
formatOptionSeparator		=	";"
formatOption				=	o:([a-zA-Z0-9-_.+! *%'(),\/\\=#&]+) { return o.join('') }
formatArray					=	a:formatOption b:(formatOptionSeparator formatOption)* {
									return [a].concat(b.map(f => f[1]))
                                }
format						=	"$format=" l:formatArray { return ["$format", l] }

select						=	"$select=" p:selectPath {
								return ["$select", p]
                                }
skip                        =	"$skip=" a:INT { return ['$skip', ~~a ]; }
							/   "$skip" .* { return {"error": 'invalid $skip parameter'}; }

top                         =   "$top=" a:INT { return ['$top', ~~a ]; }
                            /   "$top=" .* { return ['error', 'invalid $top parameter'] }

unsupported                 =   "$" er:.* { return [ 'error', "unsupported method: " + er.join(er) ] }                            

customSeparator				=	"&"
customValue					= 	k:[a-z0-9-_.+! *%'(),]+ "=" v:[a-z0-9-_.+! *%'(),]+ { 
                                    const o = {}
                                    o[k.join('')] = v.join('')
                                    //return o
                                    return [k.join(''), v.join('')]
                                }
customArray		           	 =	a:customValue b:(customSeparator v:customValue { return v })* {
									const o = {}
                                    o[a[0]] = a[1]
                                    for(let i in b){
                                    	o[b[i][0]] = b[i][1]
                                    }
									return o
                              	}
custom 						=	c:customArray { return [ "custom", c]}
//
// query definition
//
keyword						=	expand /
								filter /
                                format /
								skip /
								top /
                                orderby /
                                select /
                                count /
                                unsupported /
                                custom 
                                
keywords                    =	e:keyword "&" el:keywords { return [e].concat(el); } /
                              	e:keyword { return [e]; }

query1   	               	=	k:keywords { return k }
query   	               	=	k:keywords {
									const o = {}
    	                            for(let i in k){
        	                        		o[k[i][0]] = k[i][1]
            	                    }
									return o
                    	        }
 