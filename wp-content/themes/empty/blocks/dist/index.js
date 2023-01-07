// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"node_modules/memize/index.js":[function(require,module,exports) {
/**
 * Memize options object.
 *
 * @typedef MemizeOptions
 *
 * @property {number} [maxSize] Maximum size of the cache.
 */

/**
 * Internal cache entry.
 *
 * @typedef MemizeCacheNode
 *
 * @property {?MemizeCacheNode|undefined} [prev] Previous node.
 * @property {?MemizeCacheNode|undefined} [next] Next node.
 * @property {Array<*>}                   args   Function arguments for cache
 *                                               entry.
 * @property {*}                          val    Function result.
 */

/**
 * Properties of the enhanced function for controlling cache.
 *
 * @typedef MemizeMemoizedFunction
 *
 * @property {()=>void} clear Clear the cache.
 */

/**
 * Accepts a function to be memoized, and returns a new memoized function, with
 * optional options.
 *
 * @template {Function} F
 *
 * @param {F}             fn        Function to memoize.
 * @param {MemizeOptions} [options] Options object.
 *
 * @return {F & MemizeMemoizedFunction} Memoized function.
 */
function memize(fn, options) {
  var size = 0;

  /** @type {?MemizeCacheNode|undefined} */
  var head;

  /** @type {?MemizeCacheNode|undefined} */
  var tail;
  options = options || {};
  function memoized( /* ...args */
  ) {
    var node = head,
      len = arguments.length,
      args,
      i;
    searchCache: while (node) {
      // Perform a shallow equality test to confirm that whether the node
      // under test is a candidate for the arguments passed. Two arrays
      // are shallowly equal if their length matches and each entry is
      // strictly equal between the two sets. Avoid abstracting to a
      // function which could incur an arguments leaking deoptimization.

      // Check whether node arguments match arguments length
      if (node.args.length !== arguments.length) {
        node = node.next;
        continue;
      }

      // Check whether node arguments match arguments values
      for (i = 0; i < len; i++) {
        if (node.args[i] !== arguments[i]) {
          node = node.next;
          continue searchCache;
        }
      }

      // At this point we can assume we've found a match

      // Surface matched node to head if not already
      if (node !== head) {
        // As tail, shift to previous. Must only shift if not also
        // head, since if both head and tail, there is no previous.
        if (node === tail) {
          tail = node.prev;
        }

        // Adjust siblings to point to each other. If node was tail,
        // this also handles new tail's empty `next` assignment.
        /** @type {MemizeCacheNode} */
        node.prev.next = node.next;
        if (node.next) {
          node.next.prev = node.prev;
        }
        node.next = head;
        node.prev = null;
        /** @type {MemizeCacheNode} */
        head.prev = node;
        head = node;
      }

      // Return immediately
      return node.val;
    }

    // No cached value found. Continue to insertion phase:

    // Create a copy of arguments (avoid leaking deoptimization)
    args = new Array(len);
    for (i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    node = {
      args: args,
      // Generate the result from original function
      val: fn.apply(null, args)
    };

    // Don't need to check whether node is already head, since it would
    // have been returned above already if it was

    // Shift existing head down list
    if (head) {
      head.prev = node;
      node.next = head;
    } else {
      // If no head, follows that there's no tail (at initial or reset)
      tail = node;
    }

    // Trim tail if we're reached max size and are pending cache insertion
    if (size === /** @type {MemizeOptions} */options.maxSize) {
      tail = /** @type {MemizeCacheNode} */tail.prev;
      /** @type {MemizeCacheNode} */
      tail.next = null;
    } else {
      size++;
    }
    head = node;
    return node.val;
  }
  memoized.clear = function () {
    head = null;
    tail = null;
    size = 0;
  };
  if ("development" === 'test') {
    // Cache is not exposed in the public API, but used in tests to ensure
    // expected list progression
    memoized.getCache = function () {
      return [head, tail, size];
    };
  }

  // Ignore reason: There's not a clear solution to create an intersection of
  // the function with additional properties, where the goal is to retain the
  // function signature of the incoming argument and add control properties
  // on the return value.

  // @ts-ignore
  return memoized;
}
module.exports = memize;
},{}],"node_modules/sprintf-js/src/sprintf.js":[function(require,module,exports) {
var define;
/* global window, exports, define */

!function() {
    'use strict'

    var re = {
        not_string: /[^s]/,
        not_bool: /[^t]/,
        not_type: /[^T]/,
        not_primitive: /[^v]/,
        number: /[diefg]/,
        numeric_arg: /[bcdiefguxX]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[+-]/
    }

    function sprintf(key) {
        // `arguments` is not an array, but should be fine for this call
        return sprintf_format(sprintf_parse(key), arguments)
    }

    function vsprintf(fmt, argv) {
        return sprintf.apply(null, [fmt].concat(argv || []))
    }

    function sprintf_format(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, arg, output = '', i, k, ph, pad, pad_character, pad_length, is_positive, sign
        for (i = 0; i < tree_length; i++) {
            if (typeof parse_tree[i] === 'string') {
                output += parse_tree[i]
            }
            else if (typeof parse_tree[i] === 'object') {
                ph = parse_tree[i] // convenience purposes only
                if (ph.keys) { // keyword argument
                    arg = argv[cursor]
                    for (k = 0; k < ph.keys.length; k++) {
                        if (arg == undefined) {
                            throw new Error(sprintf('[sprintf] Cannot access property "%s" of undefined value "%s"', ph.keys[k], ph.keys[k-1]))
                        }
                        arg = arg[ph.keys[k]]
                    }
                }
                else if (ph.param_no) { // positional argument (explicit)
                    arg = argv[ph.param_no]
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++]
                }

                if (re.not_type.test(ph.type) && re.not_primitive.test(ph.type) && arg instanceof Function) {
                    arg = arg()
                }

                if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && isNaN(arg))) {
                    throw new TypeError(sprintf('[sprintf] expecting number but found %T', arg))
                }

                if (re.number.test(ph.type)) {
                    is_positive = arg >= 0
                }

                switch (ph.type) {
                    case 'b':
                        arg = parseInt(arg, 10).toString(2)
                        break
                    case 'c':
                        arg = String.fromCharCode(parseInt(arg, 10))
                        break
                    case 'd':
                    case 'i':
                        arg = parseInt(arg, 10)
                        break
                    case 'j':
                        arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0)
                        break
                    case 'e':
                        arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential()
                        break
                    case 'f':
                        arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg)
                        break
                    case 'g':
                        arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg)
                        break
                    case 'o':
                        arg = (parseInt(arg, 10) >>> 0).toString(8)
                        break
                    case 's':
                        arg = String(arg)
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 't':
                        arg = String(!!arg)
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'T':
                        arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase()
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'u':
                        arg = parseInt(arg, 10) >>> 0
                        break
                    case 'v':
                        arg = arg.valueOf()
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'x':
                        arg = (parseInt(arg, 10) >>> 0).toString(16)
                        break
                    case 'X':
                        arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase()
                        break
                }
                if (re.json.test(ph.type)) {
                    output += arg
                }
                else {
                    if (re.number.test(ph.type) && (!is_positive || ph.sign)) {
                        sign = is_positive ? '+' : '-'
                        arg = arg.toString().replace(re.sign, '')
                    }
                    else {
                        sign = ''
                    }
                    pad_character = ph.pad_char ? ph.pad_char === '0' ? '0' : ph.pad_char.charAt(1) : ' '
                    pad_length = ph.width - (sign + arg).length
                    pad = ph.width ? (pad_length > 0 ? pad_character.repeat(pad_length) : '') : ''
                    output += ph.align ? sign + arg + pad : (pad_character === '0' ? sign + pad + arg : pad + sign + arg)
                }
            }
        }
        return output
    }

    var sprintf_cache = Object.create(null)

    function sprintf_parse(fmt) {
        if (sprintf_cache[fmt]) {
            return sprintf_cache[fmt]
        }

        var _fmt = fmt, match, parse_tree = [], arg_names = 0
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree.push(match[0])
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree.push('%')
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1
                    var field_list = [], replacement_field = match[2], field_match = []
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1])
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            }
                            else {
                                throw new SyntaxError('[sprintf] failed to parse named argument key')
                            }
                        }
                    }
                    else {
                        throw new SyntaxError('[sprintf] failed to parse named argument key')
                    }
                    match[2] = field_list
                }
                else {
                    arg_names |= 2
                }
                if (arg_names === 3) {
                    throw new Error('[sprintf] mixing positional and named placeholders is not (yet) supported')
                }

                parse_tree.push(
                    {
                        placeholder: match[0],
                        param_no:    match[1],
                        keys:        match[2],
                        sign:        match[3],
                        pad_char:    match[4],
                        align:       match[5],
                        width:       match[6],
                        precision:   match[7],
                        type:        match[8]
                    }
                )
            }
            else {
                throw new SyntaxError('[sprintf] unexpected placeholder')
            }
            _fmt = _fmt.substring(match[0].length)
        }
        return sprintf_cache[fmt] = parse_tree
    }

    /**
     * export to either browser or node.js
     */
    /* eslint-disable quote-props */
    if (typeof exports !== 'undefined') {
        exports['sprintf'] = sprintf
        exports['vsprintf'] = vsprintf
    }
    if (typeof window !== 'undefined') {
        window['sprintf'] = sprintf
        window['vsprintf'] = vsprintf

        if (typeof define === 'function' && define['amd']) {
            define(function() {
                return {
                    'sprintf': sprintf,
                    'vsprintf': vsprintf
                }
            })
        }
    }
    /* eslint-enable quote-props */
}(); // eslint-disable-line

},{}],"node_modules/@wordpress/i18n/build-module/sprintf.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sprintf = sprintf;
var _memize = _interopRequireDefault(require("memize"));
var _sprintfJs = _interopRequireDefault(require("sprintf-js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * External dependencies
 */

/**
 * Log to console, once per message; or more precisely, per referentially equal
 * argument set. Because Jed throws errors, we log these to the console instead
 * to avoid crashing the application.
 *
 * @param {...*} args Arguments to pass to `console.error`
 */

var logErrorOnce = (0, _memize.default)(console.error); // eslint-disable-line no-console

/**
 * Returns a formatted string. If an error occurs in applying the format, the
 * original format string is returned.
 *
 * @param {string} format The format of the string to generate.
 * @param {...*}   args   Arguments to apply to the format.
 *
 * @see https://www.npmjs.com/package/sprintf-js
 *
 * @return {string} The formatted string.
 */

function sprintf(format) {
  try {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    return _sprintfJs.default.sprintf.apply(_sprintfJs.default, [format].concat(args));
  } catch (error) {
    if (error instanceof Error) {
      logErrorOnce('sprintf error: \n\n' + error.toString());
    }
    return format;
  }
}
},{"memize":"node_modules/memize/index.js","sprintf-js":"node_modules/sprintf-js/src/sprintf.js"}],"node_modules/@tannin/postfix/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = postfix;
var PRECEDENCE, OPENERS, TERMINATORS, PATTERN;

/**
 * Operator precedence mapping.
 *
 * @type {Object}
 */
PRECEDENCE = {
  '(': 9,
  '!': 8,
  '*': 7,
  '/': 7,
  '%': 7,
  '+': 6,
  '-': 6,
  '<': 5,
  '<=': 5,
  '>': 5,
  '>=': 5,
  '==': 4,
  '!=': 4,
  '&&': 3,
  '||': 2,
  '?': 1,
  '?:': 1
};

/**
 * Characters which signal pair opening, to be terminated by terminators.
 *
 * @type {string[]}
 */
OPENERS = ['(', '?'];

/**
 * Characters which signal pair termination, the value an array with the
 * opener as its first member. The second member is an optional operator
 * replacement to push to the stack.
 *
 * @type {string[]}
 */
TERMINATORS = {
  ')': ['('],
  ':': ['?', '?:']
};

/**
 * Pattern matching operators and openers.
 *
 * @type {RegExp}
 */
PATTERN = /<=|>=|==|!=|&&|\|\||\?:|\(|!|\*|\/|%|\+|-|<|>|\?|\)|:/;

/**
 * Given a C expression, returns the equivalent postfix (Reverse Polish)
 * notation terms as an array.
 *
 * If a postfix string is desired, simply `.join( ' ' )` the result.
 *
 * @example
 *
 * ```js
 * import postfix from '@tannin/postfix';
 *
 * postfix( 'n > 1' );
 * // ⇒ [ 'n', '1', '>' ]
 * ```
 *
 * @param {string} expression C expression.
 *
 * @return {string[]} Postfix terms.
 */
function postfix(expression) {
  var terms = [],
    stack = [],
    match,
    operator,
    term,
    element;
  while (match = expression.match(PATTERN)) {
    operator = match[0];

    // Term is the string preceding the operator match. It may contain
    // whitespace, and may be empty (if operator is at beginning).
    term = expression.substr(0, match.index).trim();
    if (term) {
      terms.push(term);
    }
    while (element = stack.pop()) {
      if (TERMINATORS[operator]) {
        if (TERMINATORS[operator][0] === element) {
          // Substitution works here under assumption that because
          // the assigned operator will no longer be a terminator, it
          // will be pushed to the stack during the condition below.
          operator = TERMINATORS[operator][1] || operator;
          break;
        }
      } else if (OPENERS.indexOf(element) >= 0 || PRECEDENCE[element] < PRECEDENCE[operator]) {
        // Push to stack if either an opener or when pop reveals an
        // element of lower precedence.
        stack.push(element);
        break;
      }

      // For each popped from stack, push to terms.
      terms.push(element);
    }
    if (!TERMINATORS[operator]) {
      stack.push(operator);
    }

    // Slice matched fragment from expression to continue match.
    expression = expression.substr(match.index + operator.length);
  }

  // Push remainder of operand, if exists, to terms.
  expression = expression.trim();
  if (expression) {
    terms.push(expression);
  }

  // Pop remaining items from stack into terms.
  return terms.concat(stack.reverse());
}
},{}],"node_modules/@tannin/evaluate/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = evaluate;
/**
 * Operator callback functions.
 *
 * @type {Object}
 */
var OPERATORS = {
  '!': function (a) {
    return !a;
  },
  '*': function (a, b) {
    return a * b;
  },
  '/': function (a, b) {
    return a / b;
  },
  '%': function (a, b) {
    return a % b;
  },
  '+': function (a, b) {
    return a + b;
  },
  '-': function (a, b) {
    return a - b;
  },
  '<': function (a, b) {
    return a < b;
  },
  '<=': function (a, b) {
    return a <= b;
  },
  '>': function (a, b) {
    return a > b;
  },
  '>=': function (a, b) {
    return a >= b;
  },
  '==': function (a, b) {
    return a === b;
  },
  '!=': function (a, b) {
    return a !== b;
  },
  '&&': function (a, b) {
    return a && b;
  },
  '||': function (a, b) {
    return a || b;
  },
  '?:': function (a, b, c) {
    if (a) {
      throw b;
    }
    return c;
  }
};

/**
 * Given an array of postfix terms and operand variables, returns the result of
 * the postfix evaluation.
 *
 * @example
 *
 * ```js
 * import evaluate from '@tannin/evaluate';
 *
 * // 3 + 4 * 5 / 6 ⇒ '3 4 5 * 6 / +'
 * const terms = [ '3', '4', '5', '*', '6', '/', '+' ];
 *
 * evaluate( terms, {} );
 * // ⇒ 6.333333333333334
 * ```
 *
 * @param {string[]} postfix   Postfix terms.
 * @param {Object}   variables Operand variables.
 *
 * @return {*} Result of evaluation.
 */
function evaluate(postfix, variables) {
  var stack = [],
    i,
    j,
    args,
    getOperatorResult,
    term,
    value;
  for (i = 0; i < postfix.length; i++) {
    term = postfix[i];
    getOperatorResult = OPERATORS[term];
    if (getOperatorResult) {
      // Pop from stack by number of function arguments.
      j = getOperatorResult.length;
      args = Array(j);
      while (j--) {
        args[j] = stack.pop();
      }
      try {
        value = getOperatorResult.apply(null, args);
      } catch (earlyReturn) {
        return earlyReturn;
      }
    } else if (variables.hasOwnProperty(term)) {
      value = variables[term];
    } else {
      value = +term;
    }
    stack.push(value);
  }
  return stack[0];
}
},{}],"node_modules/@tannin/compile/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = compile;
var _postfix = _interopRequireDefault(require("@tannin/postfix"));
var _evaluate = _interopRequireDefault(require("@tannin/evaluate"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Given a C expression, returns a function which can be called to evaluate its
 * result.
 *
 * @example
 *
 * ```js
 * import compile from '@tannin/compile';
 *
 * const evaluate = compile( 'n > 1' );
 *
 * evaluate( { n: 2 } );
 * // ⇒ true
 * ```
 *
 * @param {string} expression C expression.
 *
 * @return {(variables?:{[variable:string]:*})=>*} Compiled evaluator.
 */
function compile(expression) {
  var terms = (0, _postfix.default)(expression);
  return function (variables) {
    return (0, _evaluate.default)(terms, variables);
  };
}
},{"@tannin/postfix":"node_modules/@tannin/postfix/index.js","@tannin/evaluate":"node_modules/@tannin/evaluate/index.js"}],"node_modules/@tannin/plural-forms/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pluralForms;
var _compile = _interopRequireDefault(require("@tannin/compile"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Given a C expression, returns a function which, when called with a value,
 * evaluates the result with the value assumed to be the "n" variable of the
 * expression. The result will be coerced to its numeric equivalent.
 *
 * @param {string} expression C expression.
 *
 * @return {Function} Evaluator function.
 */
function pluralForms(expression) {
  var evaluate = (0, _compile.default)(expression);
  return function (n) {
    return +evaluate({
      n: n
    });
  };
}
},{"@tannin/compile":"node_modules/@tannin/compile/index.js"}],"node_modules/tannin/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Tannin;
var _pluralForms = _interopRequireDefault(require("@tannin/plural-forms"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Tannin constructor options.
 *
 * @typedef {Object} TanninOptions
 *
 * @property {string}   [contextDelimiter] Joiner in string lookup with context.
 * @property {Function} [onMissingKey]     Callback to invoke when key missing.
 */

/**
 * Domain metadata.
 *
 * @typedef {Object} TanninDomainMetadata
 *
 * @property {string}            [domain]       Domain name.
 * @property {string}            [lang]         Language code.
 * @property {(string|Function)} [plural_forms] Plural forms expression or
 *                                              function evaluator.
 */

/**
 * Domain translation pair respectively representing the singular and plural
 * translation.
 *
 * @typedef {[string,string]} TanninTranslation
 */

/**
 * Locale data domain. The key is used as reference for lookup, the value an
 * array of two string entries respectively representing the singular and plural
 * translation.
 *
 * @typedef {{[key:string]:TanninDomainMetadata|TanninTranslation,'':TanninDomainMetadata|TanninTranslation}} TanninLocaleDomain
 */

/**
 * Jed-formatted locale data.
 *
 * @see http://messageformat.github.io/Jed/
 *
 * @typedef {{[domain:string]:TanninLocaleDomain}} TanninLocaleData
 */

/**
 * Default Tannin constructor options.
 *
 * @type {TanninOptions}
 */
var DEFAULT_OPTIONS = {
  contextDelimiter: '\u0004',
  onMissingKey: null
};

/**
 * Given a specific locale data's config `plural_forms` value, returns the
 * expression.
 *
 * @example
 *
 * ```
 * getPluralExpression( 'nplurals=2; plural=(n != 1);' ) === '(n != 1)'
 * ```
 *
 * @param {string} pf Locale data plural forms.
 *
 * @return {string} Plural forms expression.
 */
function getPluralExpression(pf) {
  var parts, i, part;
  parts = pf.split(';');
  for (i = 0; i < parts.length; i++) {
    part = parts[i].trim();
    if (part.indexOf('plural=') === 0) {
      return part.substr(7);
    }
  }
}

/**
 * Tannin constructor.
 *
 * @class
 *
 * @param {TanninLocaleData} data      Jed-formatted locale data.
 * @param {TanninOptions}    [options] Tannin options.
 */
function Tannin(data, options) {
  var key;

  /**
   * Jed-formatted locale data.
   *
   * @name Tannin#data
   * @type {TanninLocaleData}
   */
  this.data = data;

  /**
   * Plural forms function cache, keyed by plural forms string.
   *
   * @name Tannin#pluralForms
   * @type {Object<string,Function>}
   */
  this.pluralForms = {};

  /**
   * Effective options for instance, including defaults.
   *
   * @name Tannin#options
   * @type {TanninOptions}
   */
  this.options = {};
  for (key in DEFAULT_OPTIONS) {
    this.options[key] = options !== undefined && key in options ? options[key] : DEFAULT_OPTIONS[key];
  }
}

/**
 * Returns the plural form index for the given domain and value.
 *
 * @param {string} domain Domain on which to calculate plural form.
 * @param {number} n      Value for which plural form is to be calculated.
 *
 * @return {number} Plural form index.
 */
Tannin.prototype.getPluralForm = function (domain, n) {
  var getPluralForm = this.pluralForms[domain],
    config,
    plural,
    pf;
  if (!getPluralForm) {
    config = this.data[domain][''];
    pf = config['Plural-Forms'] || config['plural-forms'] ||
    // Ignore reason: As known, there's no way to document the empty
    // string property on a key to guarantee this as metadata.
    // @ts-ignore
    config.plural_forms;
    if (typeof pf !== 'function') {
      plural = getPluralExpression(config['Plural-Forms'] || config['plural-forms'] ||
      // Ignore reason: As known, there's no way to document the empty
      // string property on a key to guarantee this as metadata.
      // @ts-ignore
      config.plural_forms);
      pf = (0, _pluralForms.default)(plural);
    }
    getPluralForm = this.pluralForms[domain] = pf;
  }
  return getPluralForm(n);
};

/**
 * Translate a string.
 *
 * @param {string}      domain   Translation domain.
 * @param {string|void} context  Context distinguishing terms of the same name.
 * @param {string}      singular Primary key for translation lookup.
 * @param {string=}     plural   Fallback value used for non-zero plural
 *                               form index.
 * @param {number=}     n        Value to use in calculating plural form.
 *
 * @return {string} Translated string.
 */
Tannin.prototype.dcnpgettext = function (domain, context, singular, plural, n) {
  var index, key, entry;
  if (n === undefined) {
    // Default to singular.
    index = 0;
  } else {
    // Find index by evaluating plural form for value.
    index = this.getPluralForm(domain, n);
  }
  key = singular;

  // If provided, context is prepended to key with delimiter.
  if (context) {
    key = context + this.options.contextDelimiter + singular;
  }
  entry = this.data[domain][key];

  // Verify not only that entry exists, but that the intended index is within
  // range and non-empty.
  if (entry && entry[index]) {
    return entry[index];
  }
  if (this.options.onMissingKey) {
    this.options.onMissingKey(singular, domain);
  }

  // If entry not found, fall back to singular vs. plural with zero index
  // representing the singular value.
  return index === 0 ? singular : plural;
};
},{"@tannin/plural-forms":"node_modules/@tannin/plural-forms/index.js"}],"node_modules/@wordpress/i18n/build-module/create-i18n.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createI18n = void 0;
var _tannin = _interopRequireDefault(require("tannin"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/**
 * @typedef {Record<string,any>} LocaleData
 */

/**
 * Default locale data to use for Tannin domain when not otherwise provided.
 * Assumes an English plural forms expression.
 *
 * @type {LocaleData}
 */

var DEFAULT_LOCALE_DATA = {
  '': {
    /** @param {number} n */plural_forms: function plural_forms(n) {
      return n === 1 ? 0 : 1;
    }
  }
};
/*
 * Regular expression that matches i18n hooks like `i18n.gettext`, `i18n.ngettext`,
 * `i18n.gettext_domain` or `i18n.ngettext_with_context` or `i18n.has_translation`.
 */

var I18N_HOOK_REGEXP = /^i18n\.(n?gettext|has_translation)(_|$)/;
/**
 * @typedef {(domain?: string) => LocaleData} GetLocaleData
 *
 * Returns locale data by domain in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */

/**
 * @typedef {(data?: LocaleData, domain?: string) => void} SetLocaleData
 *
 * Merges locale data into the Tannin instance by domain. Note that this
 * function will overwrite the domain configuration. Accepts data in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */

/**
 * @typedef {(data?: LocaleData, domain?: string) => void} AddLocaleData
 *
 * Merges locale data into the Tannin instance by domain. Note that this
 * function will also merge the domain configuration. Accepts data in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */

/**
 * @typedef {(data?: LocaleData, domain?: string) => void} ResetLocaleData
 *
 * Resets all current Tannin instance locale data and sets the specified
 * locale data for the domain. Accepts data in a Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */

/** @typedef {() => void} SubscribeCallback */

/** @typedef {() => void} UnsubscribeCallback */

/**
 * @typedef {(callback: SubscribeCallback) => UnsubscribeCallback} Subscribe
 *
 * Subscribes to changes of locale data
 */

/**
 * @typedef {(domain?: string) => string} GetFilterDomain
 * Retrieve the domain to use when calling domain-specific filters.
 */

/**
 * @typedef {(text: string, domain?: string) => string} __
 *
 * Retrieve the translation of text.
 *
 * @see https://developer.wordpress.org/reference/functions/__/
 */

/**
 * @typedef {(text: string, context: string, domain?: string) => string} _x
 *
 * Retrieve translated string with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_x/
 */

/**
 * @typedef {(single: string, plural: string, number: number, domain?: string) => string} _n
 *
 * Translates and retrieves the singular or plural form based on the supplied
 * number.
 *
 * @see https://developer.wordpress.org/reference/functions/_n/
 */

/**
 * @typedef {(single: string, plural: string, number: number, context: string, domain?: string) => string} _nx
 *
 * Translates and retrieves the singular or plural form based on the supplied
 * number, with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_nx/
 */

/**
 * @typedef {() => boolean} IsRtl
 *
 * Check if current locale is RTL.
 *
 * **RTL (Right To Left)** is a locale property indicating that text is written from right to left.
 * For example, the `he` locale (for Hebrew) specifies right-to-left. Arabic (ar) is another common
 * language written RTL. The opposite of RTL, LTR (Left To Right) is used in other languages,
 * including English (`en`, `en-US`, `en-GB`, etc.), Spanish (`es`), and French (`fr`).
 */

/**
 * @typedef {(single: string, context?: string, domain?: string) => boolean} HasTranslation
 *
 * Check if there is a translation for a given string in singular form.
 */

/** @typedef {import('@wordpress/hooks').Hooks} Hooks */

/**
 * An i18n instance
 *
 * @typedef I18n
 * @property {GetLocaleData}   getLocaleData   Returns locale data by domain in a Jed-formatted JSON object shape.
 * @property {SetLocaleData}   setLocaleData   Merges locale data into the Tannin instance by domain. Note that this
 *                                             function will overwrite the domain configuration. Accepts data in a
 *                                             Jed-formatted JSON object shape.
 * @property {AddLocaleData}   addLocaleData   Merges locale data into the Tannin instance by domain. Note that this
 *                                             function will also merge the domain configuration. Accepts data in a
 *                                             Jed-formatted JSON object shape.
 * @property {ResetLocaleData} resetLocaleData Resets all current Tannin instance locale data and sets the specified
 *                                             locale data for the domain. Accepts data in a Jed-formatted JSON object shape.
 * @property {Subscribe}       subscribe       Subscribes to changes of Tannin locale data.
 * @property {__}              __              Retrieve the translation of text.
 * @property {_x}              _x              Retrieve translated string with gettext context.
 * @property {_n}              _n              Translates and retrieves the singular or plural form based on the supplied
 *                                             number.
 * @property {_nx}             _nx             Translates and retrieves the singular or plural form based on the supplied
 *                                             number, with gettext context.
 * @property {IsRtl}           isRTL           Check if current locale is RTL.
 * @property {HasTranslation}  hasTranslation  Check if there is a translation for a given string.
 */

/**
 * Create an i18n instance
 *
 * @param {LocaleData} [initialData]   Locale data configuration.
 * @param {string}     [initialDomain] Domain for which configuration applies.
 * @param {Hooks}      [hooks]         Hooks implementation.
 *
 * @return {I18n} I18n instance.
 */

var createI18n = function createI18n(initialData, initialDomain, hooks) {
  /**
   * The underlying instance of Tannin to which exported functions interface.
   *
   * @type {Tannin}
   */
  var tannin = new _tannin.default({});
  var listeners = new Set();
  var notifyListeners = function notifyListeners() {
    listeners.forEach(function (listener) {
      return listener();
    });
  };
  /**
   * Subscribe to changes of locale data.
   *
   * @param {SubscribeCallback} callback Subscription callback.
   * @return {UnsubscribeCallback} Unsubscribe callback.
   */

  var subscribe = function subscribe(callback) {
    listeners.add(callback);
    return function () {
      return listeners.delete(callback);
    };
  };
  /** @type {GetLocaleData} */

  var getLocaleData = function getLocaleData() {
    var domain = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';
    return tannin.data[domain];
  };
  /**
   * @param {LocaleData} [data]
   * @param {string}     [domain]
   */

  var doSetLocaleData = function doSetLocaleData(data) {
    var _tannin$data$domain;
    var domain = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'default';
    tannin.data[domain] = _objectSpread(_objectSpread({}, tannin.data[domain]), data); // Populate default domain configuration (supported locale date which omits
    // a plural forms expression).

    tannin.data[domain][''] = _objectSpread(_objectSpread({}, DEFAULT_LOCALE_DATA['']), (_tannin$data$domain = tannin.data[domain]) === null || _tannin$data$domain === void 0 ? void 0 : _tannin$data$domain['']); // Clean up cached plural forms functions cache as it might be updated.

    delete tannin.pluralForms[domain];
  };
  /** @type {SetLocaleData} */

  var setLocaleData = function setLocaleData(data, domain) {
    doSetLocaleData(data, domain);
    notifyListeners();
  };
  /** @type {AddLocaleData} */

  var addLocaleData = function addLocaleData(data) {
    var _tannin$data$domain2;
    var domain = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'default';
    tannin.data[domain] = _objectSpread(_objectSpread(_objectSpread({}, tannin.data[domain]), data), {}, {
      // Populate default domain configuration (supported locale date which omits
      // a plural forms expression).
      '': _objectSpread(_objectSpread(_objectSpread({}, DEFAULT_LOCALE_DATA['']), (_tannin$data$domain2 = tannin.data[domain]) === null || _tannin$data$domain2 === void 0 ? void 0 : _tannin$data$domain2['']), data === null || data === void 0 ? void 0 : data[''])
    }); // Clean up cached plural forms functions cache as it might be updated.

    delete tannin.pluralForms[domain];
    notifyListeners();
  };
  /** @type {ResetLocaleData} */

  var resetLocaleData = function resetLocaleData(data, domain) {
    // Reset all current Tannin locale data.
    tannin.data = {}; // Reset cached plural forms functions cache.

    tannin.pluralForms = {};
    setLocaleData(data, domain);
  };
  /**
   * Wrapper for Tannin's `dcnpgettext`. Populates default locale data if not
   * otherwise previously assigned.
   *
   * @param {string|undefined} domain   Domain to retrieve the translated text.
   * @param {string|undefined} context  Context information for the translators.
   * @param {string}           single   Text to translate if non-plural. Used as
   *                                    fallback return value on a caught error.
   * @param {string}           [plural] The text to be used if the number is
   *                                    plural.
   * @param {number}           [number] The number to compare against to use
   *                                    either the singular or plural form.
   *
   * @return {string} The translated string.
   */

  var dcnpgettext = function dcnpgettext() {
    var domain = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';
    var context = arguments.length > 1 ? arguments[1] : undefined;
    var single = arguments.length > 2 ? arguments[2] : undefined;
    var plural = arguments.length > 3 ? arguments[3] : undefined;
    var number = arguments.length > 4 ? arguments[4] : undefined;
    if (!tannin.data[domain]) {
      // Use `doSetLocaleData` to set silently, without notifying listeners.
      doSetLocaleData(undefined, domain);
    }
    return tannin.dcnpgettext(domain, context, single, plural, number);
  };
  /** @type {GetFilterDomain} */

  var getFilterDomain = function getFilterDomain() {
    var domain = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';
    return domain;
  };
  /** @type {__} */

  var __ = function __(text, domain) {
    var translation = dcnpgettext(domain, undefined, text);
    if (!hooks) {
      return translation;
    }
    /**
     * Filters text with its translation.
     *
     * @param {string} translation Translated text.
     * @param {string} text        Text to translate.
     * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
     */

    translation = /** @type {string} */

    /** @type {*} */
    hooks.applyFilters('i18n.gettext', translation, text, domain);
    return (/** @type {string} */

      /** @type {*} */
      hooks.applyFilters('i18n.gettext_' + getFilterDomain(domain), translation, text, domain)
    );
  };
  /** @type {_x} */

  var _x = function _x(text, context, domain) {
    var translation = dcnpgettext(domain, context, text);
    if (!hooks) {
      return translation;
    }
    /**
     * Filters text with its translation based on context information.
     *
     * @param {string} translation Translated text.
     * @param {string} text        Text to translate.
     * @param {string} context     Context information for the translators.
     * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
     */

    translation = /** @type {string} */

    /** @type {*} */
    hooks.applyFilters('i18n.gettext_with_context', translation, text, context, domain);
    return (/** @type {string} */

      /** @type {*} */
      hooks.applyFilters('i18n.gettext_with_context_' + getFilterDomain(domain), translation, text, context, domain)
    );
  };
  /** @type {_n} */

  var _n = function _n(single, plural, number, domain) {
    var translation = dcnpgettext(domain, undefined, single, plural, number);
    if (!hooks) {
      return translation;
    }
    /**
     * Filters the singular or plural form of a string.
     *
     * @param {string} translation Translated text.
     * @param {string} single      The text to be used if the number is singular.
     * @param {string} plural      The text to be used if the number is plural.
     * @param {string} number      The number to compare against to use either the singular or plural form.
     * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
     */

    translation = /** @type {string} */

    /** @type {*} */
    hooks.applyFilters('i18n.ngettext', translation, single, plural, number, domain);
    return (/** @type {string} */

      /** @type {*} */
      hooks.applyFilters('i18n.ngettext_' + getFilterDomain(domain), translation, single, plural, number, domain)
    );
  };
  /** @type {_nx} */

  var _nx = function _nx(single, plural, number, context, domain) {
    var translation = dcnpgettext(domain, context, single, plural, number);
    if (!hooks) {
      return translation;
    }
    /**
     * Filters the singular or plural form of a string with gettext context.
     *
     * @param {string} translation Translated text.
     * @param {string} single      The text to be used if the number is singular.
     * @param {string} plural      The text to be used if the number is plural.
     * @param {string} number      The number to compare against to use either the singular or plural form.
     * @param {string} context     Context information for the translators.
     * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
     */

    translation = /** @type {string} */

    /** @type {*} */
    hooks.applyFilters('i18n.ngettext_with_context', translation, single, plural, number, context, domain);
    return (/** @type {string} */

      /** @type {*} */
      hooks.applyFilters('i18n.ngettext_with_context_' + getFilterDomain(domain), translation, single, plural, number, context, domain)
    );
  };
  /** @type {IsRtl} */

  var isRTL = function isRTL() {
    return 'rtl' === _x('ltr', 'text direction');
  };
  /** @type {HasTranslation} */

  var hasTranslation = function hasTranslation(single, context, domain) {
    var _tannin$data, _tannin$data2;
    var key = context ? context + "\x04" + single : single;
    var result = !!((_tannin$data = tannin.data) !== null && _tannin$data !== void 0 && (_tannin$data2 = _tannin$data[domain !== null && domain !== void 0 ? domain : 'default']) !== null && _tannin$data2 !== void 0 && _tannin$data2[key]);
    if (hooks) {
      /**
       * Filters the presence of a translation in the locale data.
       *
       * @param {boolean} hasTranslation Whether the translation is present or not..
       * @param {string}  single         The singular form of the translated text (used as key in locale data)
       * @param {string}  context        Context information for the translators.
       * @param {string}  domain         Text domain. Unique identifier for retrieving translated strings.
       */
      result = /** @type { boolean } */

      /** @type {*} */
      hooks.applyFilters('i18n.has_translation', result, single, context, domain);
      result = /** @type { boolean } */

      /** @type {*} */
      hooks.applyFilters('i18n.has_translation_' + getFilterDomain(domain), result, single, context, domain);
    }
    return result;
  };
  if (initialData) {
    setLocaleData(initialData, initialDomain);
  }
  if (hooks) {
    /**
     * @param {string} hookName
     */
    var onHookAddedOrRemoved = function onHookAddedOrRemoved(hookName) {
      if (I18N_HOOK_REGEXP.test(hookName)) {
        notifyListeners();
      }
    };
    hooks.addAction('hookAdded', 'core/i18n', onHookAddedOrRemoved);
    hooks.addAction('hookRemoved', 'core/i18n', onHookAddedOrRemoved);
  }
  return {
    getLocaleData: getLocaleData,
    setLocaleData: setLocaleData,
    addLocaleData: addLocaleData,
    resetLocaleData: resetLocaleData,
    subscribe: subscribe,
    __: __,
    _x: _x,
    _n: _n,
    _nx: _nx,
    isRTL: isRTL,
    hasTranslation: hasTranslation
  };
};
exports.createI18n = createI18n;
},{"tannin":"node_modules/tannin/index.js"}],"node_modules/@wordpress/hooks/build-module/validateNamespace.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/**
 * Validate a namespace string.
 *
 * @param {string} namespace The namespace to validate - should take the form
 *                           `vendor/plugin/function`.
 *
 * @return {boolean} Whether the namespace is valid.
 */
function validateNamespace(namespace) {
  if ('string' !== typeof namespace || '' === namespace) {
    // eslint-disable-next-line no-console
    console.error('The namespace must be a non-empty string.');
    return false;
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_.\-\/]*$/.test(namespace)) {
    // eslint-disable-next-line no-console
    console.error('The namespace can only contain numbers, letters, dashes, periods, underscores and slashes.');
    return false;
  }
  return true;
}
var _default = validateNamespace;
exports.default = _default;
},{}],"node_modules/@wordpress/hooks/build-module/validateHookName.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/**
 * Validate a hookName string.
 *
 * @param {string} hookName The hook name to validate. Should be a non empty string containing
 *                          only numbers, letters, dashes, periods and underscores. Also,
 *                          the hook name cannot begin with `__`.
 *
 * @return {boolean} Whether the hook name is valid.
 */
function validateHookName(hookName) {
  if ('string' !== typeof hookName || '' === hookName) {
    // eslint-disable-next-line no-console
    console.error('The hook name must be a non-empty string.');
    return false;
  }
  if (/^__/.test(hookName)) {
    // eslint-disable-next-line no-console
    console.error('The hook name cannot begin with `__`.');
    return false;
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(hookName)) {
    // eslint-disable-next-line no-console
    console.error('The hook name can only contain numbers, letters, dashes, periods and underscores.');
    return false;
  }
  return true;
}
var _default = validateHookName;
exports.default = _default;
},{}],"node_modules/@wordpress/hooks/build-module/createAddHook.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _validateNamespace = _interopRequireDefault(require("./validateNamespace.js"));
var _validateHookName = _interopRequireDefault(require("./validateHookName.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Internal dependencies
 */

/**
 * @callback AddHook
 *
 * Adds the hook to the appropriate hooks container.
 *
 * @param {string}               hookName      Name of hook to add
 * @param {string}               namespace     The unique namespace identifying the callback in the form `vendor/plugin/function`.
 * @param {import('.').Callback} callback      Function to call when the hook is run
 * @param {number}               [priority=10] Priority of this hook
 */

/**
 * Returns a function which, when invoked, will add a hook.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {AddHook} Function that adds a new hook.
 */

function createAddHook(hooks, storeKey) {
  return function addHook(hookName, namespace, callback) {
    var priority = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 10;
    var hooksStore = hooks[storeKey];
    if (!(0, _validateHookName.default)(hookName)) {
      return;
    }
    if (!(0, _validateNamespace.default)(namespace)) {
      return;
    }
    if ('function' !== typeof callback) {
      // eslint-disable-next-line no-console
      console.error('The hook callback must be a function.');
      return;
    } // Validate numeric priority

    if ('number' !== typeof priority) {
      // eslint-disable-next-line no-console
      console.error('If specified, the hook priority must be a number.');
      return;
    }
    var handler = {
      callback: callback,
      priority: priority,
      namespace: namespace
    };
    if (hooksStore[hookName]) {
      // Find the correct insert index of the new hook.
      var handlers = hooksStore[hookName].handlers;
      /** @type {number} */

      var i;
      for (i = handlers.length; i > 0; i--) {
        if (priority >= handlers[i - 1].priority) {
          break;
        }
      }
      if (i === handlers.length) {
        // If append, operate via direct assignment.
        handlers[i] = handler;
      } else {
        // Otherwise, insert before index via splice.
        handlers.splice(i, 0, handler);
      } // We may also be currently executing this hook.  If the callback
      // we're adding would come after the current callback, there's no
      // problem; otherwise we need to increase the execution index of
      // any other runs by 1 to account for the added element.

      hooksStore.__current.forEach(function (hookInfo) {
        if (hookInfo.name === hookName && hookInfo.currentIndex >= i) {
          hookInfo.currentIndex++;
        }
      });
    } else {
      // This is the first hook of its type.
      hooksStore[hookName] = {
        handlers: [handler],
        runs: 0
      };
    }
    if (hookName !== 'hookAdded') {
      hooks.doAction('hookAdded', hookName, namespace, callback, priority);
    }
  };
}
var _default = createAddHook;
exports.default = _default;
},{"./validateNamespace.js":"node_modules/@wordpress/hooks/build-module/validateNamespace.js","./validateHookName.js":"node_modules/@wordpress/hooks/build-module/validateHookName.js"}],"node_modules/@wordpress/hooks/build-module/createRemoveHook.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _validateNamespace = _interopRequireDefault(require("./validateNamespace.js"));
var _validateHookName = _interopRequireDefault(require("./validateHookName.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Internal dependencies
 */

/**
 * @callback RemoveHook
 * Removes the specified callback (or all callbacks) from the hook with a given hookName
 * and namespace.
 *
 * @param {string} hookName  The name of the hook to modify.
 * @param {string} namespace The unique namespace identifying the callback in the
 *                           form `vendor/plugin/function`.
 *
 * @return {number | undefined} The number of callbacks removed.
 */

/**
 * Returns a function which, when invoked, will remove a specified hook or all
 * hooks by the given name.
 *
 * @param {import('.').Hooks}    hooks             Hooks instance.
 * @param {import('.').StoreKey} storeKey
 * @param {boolean}              [removeAll=false] Whether to remove all callbacks for a hookName,
 *                                                 without regard to namespace. Used to create
 *                                                 `removeAll*` functions.
 *
 * @return {RemoveHook} Function that removes hooks.
 */

function createRemoveHook(hooks, storeKey) {
  var removeAll = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return function removeHook(hookName, namespace) {
    var hooksStore = hooks[storeKey];
    if (!(0, _validateHookName.default)(hookName)) {
      return;
    }
    if (!removeAll && !(0, _validateNamespace.default)(namespace)) {
      return;
    } // Bail if no hooks exist by this name.

    if (!hooksStore[hookName]) {
      return 0;
    }
    var handlersRemoved = 0;
    if (removeAll) {
      handlersRemoved = hooksStore[hookName].handlers.length;
      hooksStore[hookName] = {
        runs: hooksStore[hookName].runs,
        handlers: []
      };
    } else {
      // Try to find the specified callback to remove.
      var handlers = hooksStore[hookName].handlers;
      var _loop = function _loop(i) {
        if (handlers[i].namespace === namespace) {
          handlers.splice(i, 1);
          handlersRemoved++; // This callback may also be part of a hook that is
          // currently executing.  If the callback we're removing
          // comes after the current callback, there's no problem;
          // otherwise we need to decrease the execution index of any
          // other runs by 1 to account for the removed element.

          hooksStore.__current.forEach(function (hookInfo) {
            if (hookInfo.name === hookName && hookInfo.currentIndex >= i) {
              hookInfo.currentIndex--;
            }
          });
        }
      };
      for (var i = handlers.length - 1; i >= 0; i--) {
        _loop(i);
      }
    }
    if (hookName !== 'hookRemoved') {
      hooks.doAction('hookRemoved', hookName, namespace);
    }
    return handlersRemoved;
  };
}
var _default = createRemoveHook;
exports.default = _default;
},{"./validateNamespace.js":"node_modules/@wordpress/hooks/build-module/validateNamespace.js","./validateHookName.js":"node_modules/@wordpress/hooks/build-module/validateHookName.js"}],"node_modules/@wordpress/hooks/build-module/createHasHook.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/**
 * @callback HasHook
 *
 * Returns whether any handlers are attached for the given hookName and optional namespace.
 *
 * @param {string} hookName    The name of the hook to check for.
 * @param {string} [namespace] Optional. The unique namespace identifying the callback
 *                             in the form `vendor/plugin/function`.
 *
 * @return {boolean} Whether there are handlers that are attached to the given hook.
 */

/**
 * Returns a function which, when invoked, will return whether any handlers are
 * attached to a particular hook.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {HasHook} Function that returns whether any handlers are
 *                   attached to a particular hook and optional namespace.
 */
function createHasHook(hooks, storeKey) {
  return function hasHook(hookName, namespace) {
    var hooksStore = hooks[storeKey]; // Use the namespace if provided.

    if ('undefined' !== typeof namespace) {
      return hookName in hooksStore && hooksStore[hookName].handlers.some(function (hook) {
        return hook.namespace === namespace;
      });
    }
    return hookName in hooksStore;
  };
}
var _default = createHasHook;
exports.default = _default;
},{}],"node_modules/@wordpress/hooks/build-module/createRunHook.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
/**
 * Returns a function which, when invoked, will execute all callbacks
 * registered to a hook of the specified type, optionally returning the final
 * value of the call chain.
 *
 * @param {import('.').Hooks}    hooks                  Hooks instance.
 * @param {import('.').StoreKey} storeKey
 * @param {boolean}              [returnFirstArg=false] Whether each hook callback is expected to
 *                                                      return its first argument.
 *
 * @return {(hookName:string, ...args: unknown[]) => unknown} Function that runs hook callbacks.
 */
function createRunHook(hooks, storeKey) {
  var returnFirstArg = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return function runHooks(hookName) {
    var hooksStore = hooks[storeKey];
    if (!hooksStore[hookName]) {
      hooksStore[hookName] = {
        handlers: [],
        runs: 0
      };
    }
    hooksStore[hookName].runs++;
    var handlers = hooksStore[hookName].handlers; // The following code is stripped from production builds.

    if ('production' !== "development") {
      // Handle any 'all' hooks registered.
      if ('hookAdded' !== hookName && hooksStore.all) {
        handlers.push.apply(handlers, _toConsumableArray(hooksStore.all.handlers));
      }
    }
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    if (!handlers || !handlers.length) {
      return returnFirstArg ? args[0] : undefined;
    }
    var hookInfo = {
      name: hookName,
      currentIndex: 0
    };
    hooksStore.__current.push(hookInfo);
    while (hookInfo.currentIndex < handlers.length) {
      var handler = handlers[hookInfo.currentIndex];
      var result = handler.callback.apply(null, args);
      if (returnFirstArg) {
        args[0] = result;
      }
      hookInfo.currentIndex++;
    }
    hooksStore.__current.pop();
    if (returnFirstArg) {
      return args[0];
    }
  };
}
var _default = createRunHook;
exports.default = _default;
},{}],"node_modules/@wordpress/hooks/build-module/createCurrentHook.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/**
 * Returns a function which, when invoked, will return the name of the
 * currently running hook, or `null` if no hook of the given type is currently
 * running.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {() => string | null} Function that returns the current hook name or null.
 */
function createCurrentHook(hooks, storeKey) {
  return function currentHook() {
    var _hooksStore$__current, _hooksStore$__current2;
    var hooksStore = hooks[storeKey];
    return (_hooksStore$__current = (_hooksStore$__current2 = hooksStore.__current[hooksStore.__current.length - 1]) === null || _hooksStore$__current2 === void 0 ? void 0 : _hooksStore$__current2.name) !== null && _hooksStore$__current !== void 0 ? _hooksStore$__current : null;
  };
}
var _default = createCurrentHook;
exports.default = _default;
},{}],"node_modules/@wordpress/hooks/build-module/createDoingHook.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/**
 * @callback DoingHook
 * Returns whether a hook is currently being executed.
 *
 * @param {string} [hookName] The name of the hook to check for.  If
 *                            omitted, will check for any hook being executed.
 *
 * @return {boolean} Whether the hook is being executed.
 */

/**
 * Returns a function which, when invoked, will return whether a hook is
 * currently being executed.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {DoingHook} Function that returns whether a hook is currently
 *                     being executed.
 */
function createDoingHook(hooks, storeKey) {
  return function doingHook(hookName) {
    var hooksStore = hooks[storeKey]; // If the hookName was not passed, check for any current hook.

    if ('undefined' === typeof hookName) {
      return 'undefined' !== typeof hooksStore.__current[0];
    } // Return the __current hook.

    return hooksStore.__current[0] ? hookName === hooksStore.__current[0].name : false;
  };
}
var _default = createDoingHook;
exports.default = _default;
},{}],"node_modules/@wordpress/hooks/build-module/createDidHook.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _validateHookName = _interopRequireDefault(require("./validateHookName.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Internal dependencies
 */

/**
 * @callback DidHook
 *
 * Returns the number of times an action has been fired.
 *
 * @param {string} hookName The hook name to check.
 *
 * @return {number | undefined} The number of times the hook has run.
 */

/**
 * Returns a function which, when invoked, will return the number of times a
 * hook has been called.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {DidHook} Function that returns a hook's call count.
 */

function createDidHook(hooks, storeKey) {
  return function didHook(hookName) {
    var hooksStore = hooks[storeKey];
    if (!(0, _validateHookName.default)(hookName)) {
      return;
    }
    return hooksStore[hookName] && hooksStore[hookName].runs ? hooksStore[hookName].runs : 0;
  };
}
var _default = createDidHook;
exports.default = _default;
},{"./validateHookName.js":"node_modules/@wordpress/hooks/build-module/validateHookName.js"}],"node_modules/@wordpress/hooks/build-module/createHooks.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports._Hooks = void 0;
var _createAddHook = _interopRequireDefault(require("./createAddHook"));
var _createRemoveHook = _interopRequireDefault(require("./createRemoveHook"));
var _createHasHook = _interopRequireDefault(require("./createHasHook"));
var _createRunHook = _interopRequireDefault(require("./createRunHook"));
var _createCurrentHook = _interopRequireDefault(require("./createCurrentHook"));
var _createDoingHook = _interopRequireDefault(require("./createDoingHook"));
var _createDidHook = _interopRequireDefault(require("./createDidHook"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
/**
 * Internal class for constructing hooks. Use `createHooks()` function
 *
 * Note, it is necessary to expose this class to make its type public.
 *
 * @private
 */
var _Hooks = /*#__PURE__*/_createClass(function _Hooks() {
  _classCallCheck(this, _Hooks);
  /** @type {import('.').Store} actions */
  this.actions = Object.create(null);
  this.actions.__current = [];
  /** @type {import('.').Store} filters */

  this.filters = Object.create(null);
  this.filters.__current = [];
  this.addAction = (0, _createAddHook.default)(this, 'actions');
  this.addFilter = (0, _createAddHook.default)(this, 'filters');
  this.removeAction = (0, _createRemoveHook.default)(this, 'actions');
  this.removeFilter = (0, _createRemoveHook.default)(this, 'filters');
  this.hasAction = (0, _createHasHook.default)(this, 'actions');
  this.hasFilter = (0, _createHasHook.default)(this, 'filters');
  this.removeAllActions = (0, _createRemoveHook.default)(this, 'actions', true);
  this.removeAllFilters = (0, _createRemoveHook.default)(this, 'filters', true);
  this.doAction = (0, _createRunHook.default)(this, 'actions');
  this.applyFilters = (0, _createRunHook.default)(this, 'filters', true);
  this.currentAction = (0, _createCurrentHook.default)(this, 'actions');
  this.currentFilter = (0, _createCurrentHook.default)(this, 'filters');
  this.doingAction = (0, _createDoingHook.default)(this, 'actions');
  this.doingFilter = (0, _createDoingHook.default)(this, 'filters');
  this.didAction = (0, _createDidHook.default)(this, 'actions');
  this.didFilter = (0, _createDidHook.default)(this, 'filters');
});
/** @typedef {_Hooks} Hooks */
/**
 * Returns an instance of the hooks object.
 *
 * @return {Hooks} A Hooks instance.
 */
exports._Hooks = _Hooks;
function createHooks() {
  return new _Hooks();
}
var _default = createHooks;
exports.default = _default;
},{"./createAddHook":"node_modules/@wordpress/hooks/build-module/createAddHook.js","./createRemoveHook":"node_modules/@wordpress/hooks/build-module/createRemoveHook.js","./createHasHook":"node_modules/@wordpress/hooks/build-module/createHasHook.js","./createRunHook":"node_modules/@wordpress/hooks/build-module/createRunHook.js","./createCurrentHook":"node_modules/@wordpress/hooks/build-module/createCurrentHook.js","./createDoingHook":"node_modules/@wordpress/hooks/build-module/createDoingHook.js","./createDidHook":"node_modules/@wordpress/hooks/build-module/createDidHook.js"}],"node_modules/@wordpress/hooks/build-module/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyFilters = exports.addFilter = exports.addAction = exports.actions = void 0;
Object.defineProperty(exports, "createHooks", {
  enumerable: true,
  get: function () {
    return _createHooks.default;
  }
});
exports.removeFilter = exports.removeAllFilters = exports.removeAllActions = exports.removeAction = exports.hasFilter = exports.hasAction = exports.filters = exports.doingFilter = exports.doingAction = exports.doAction = exports.didFilter = exports.didAction = exports.defaultHooks = exports.currentFilter = exports.currentAction = void 0;
var _createHooks = _interopRequireDefault(require("./createHooks"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Internal dependencies
 */

/** @typedef {(...args: any[])=>any} Callback */

/**
 * @typedef Handler
 * @property {Callback} callback  The callback
 * @property {string}   namespace The namespace
 * @property {number}   priority  The namespace
 */

/**
 * @typedef Hook
 * @property {Handler[]} handlers Array of handlers
 * @property {number}    runs     Run counter
 */

/**
 * @typedef Current
 * @property {string} name         Hook name
 * @property {number} currentIndex The index
 */

/**
 * @typedef {Record<string, Hook> & {__current: Current[]}} Store
 */

/**
 * @typedef {'actions' | 'filters'} StoreKey
 */

/**
 * @typedef {import('./createHooks').Hooks} Hooks
 */

var defaultHooks = (0, _createHooks.default)();
exports.defaultHooks = defaultHooks;
var addAction = defaultHooks.addAction,
  addFilter = defaultHooks.addFilter,
  removeAction = defaultHooks.removeAction,
  removeFilter = defaultHooks.removeFilter,
  hasAction = defaultHooks.hasAction,
  hasFilter = defaultHooks.hasFilter,
  removeAllActions = defaultHooks.removeAllActions,
  removeAllFilters = defaultHooks.removeAllFilters,
  doAction = defaultHooks.doAction,
  applyFilters = defaultHooks.applyFilters,
  currentAction = defaultHooks.currentAction,
  currentFilter = defaultHooks.currentFilter,
  doingAction = defaultHooks.doingAction,
  doingFilter = defaultHooks.doingFilter,
  didAction = defaultHooks.didAction,
  didFilter = defaultHooks.didFilter,
  actions = defaultHooks.actions,
  filters = defaultHooks.filters;
exports.filters = filters;
exports.actions = actions;
exports.didFilter = didFilter;
exports.didAction = didAction;
exports.doingFilter = doingFilter;
exports.doingAction = doingAction;
exports.currentFilter = currentFilter;
exports.currentAction = currentAction;
exports.applyFilters = applyFilters;
exports.doAction = doAction;
exports.removeAllFilters = removeAllFilters;
exports.removeAllActions = removeAllActions;
exports.hasFilter = hasFilter;
exports.hasAction = hasAction;
exports.removeFilter = removeFilter;
exports.removeAction = removeAction;
exports.addFilter = addFilter;
exports.addAction = addAction;
},{"./createHooks":"node_modules/@wordpress/hooks/build-module/createHooks.js"}],"node_modules/@wordpress/i18n/build-module/default-i18n.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.subscribe = exports.setLocaleData = exports.resetLocaleData = exports.isRTL = exports.hasTranslation = exports.getLocaleData = exports.default = exports._x = exports._nx = exports._n = exports.__ = void 0;
var _createI18n = require("./create-i18n");
var _hooks = require("@wordpress/hooks");
/**
 * Internal dependencies
 */

/**
 * WordPress dependencies
 */

var i18n = (0, _createI18n.createI18n)(undefined, undefined, _hooks.defaultHooks);
/**
 * Default, singleton instance of `I18n`.
 */
var _default = i18n;
/*
 * Comments in this file are duplicated from ./i18n due to
 * https://github.com/WordPress/gutenberg/pull/20318#issuecomment-590837722
 */
/**
 * @typedef {import('./create-i18n').LocaleData} LocaleData
 * @typedef {import('./create-i18n').SubscribeCallback} SubscribeCallback
 * @typedef {import('./create-i18n').UnsubscribeCallback} UnsubscribeCallback
 */
/**
 * Returns locale data by domain in a Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 *
 * @param {string} [domain] Domain for which to get the data.
 * @return {LocaleData} Locale data.
 */
exports.default = _default;
var getLocaleData = i18n.getLocaleData.bind(i18n);
/**
 * Merges locale data into the Tannin instance by domain. Accepts data in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 *
 * @param {LocaleData} [data]   Locale data configuration.
 * @param {string}     [domain] Domain for which configuration applies.
 */
exports.getLocaleData = getLocaleData;
var setLocaleData = i18n.setLocaleData.bind(i18n);
/**
 * Resets all current Tannin instance locale data and sets the specified
 * locale data for the domain. Accepts data in a Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 *
 * @param {LocaleData} [data]   Locale data configuration.
 * @param {string}     [domain] Domain for which configuration applies.
 */
exports.setLocaleData = setLocaleData;
var resetLocaleData = i18n.resetLocaleData.bind(i18n);
/**
 * Subscribes to changes of locale data
 *
 * @param {SubscribeCallback} callback Subscription callback
 * @return {UnsubscribeCallback} Unsubscribe callback
 */
exports.resetLocaleData = resetLocaleData;
var subscribe = i18n.subscribe.bind(i18n);
/**
 * Retrieve the translation of text.
 *
 * @see https://developer.wordpress.org/reference/functions/__/
 *
 * @param {string} text     Text to translate.
 * @param {string} [domain] Domain to retrieve the translated text.
 *
 * @return {string} Translated text.
 */
exports.subscribe = subscribe;
var __ = i18n.__.bind(i18n);
/**
 * Retrieve translated string with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_x/
 *
 * @param {string} text     Text to translate.
 * @param {string} context  Context information for the translators.
 * @param {string} [domain] Domain to retrieve the translated text.
 *
 * @return {string} Translated context string without pipe.
 */
exports.__ = __;
var _x = i18n._x.bind(i18n);
/**
 * Translates and retrieves the singular or plural form based on the supplied
 * number.
 *
 * @see https://developer.wordpress.org/reference/functions/_n/
 *
 * @param {string} single   The text to be used if the number is singular.
 * @param {string} plural   The text to be used if the number is plural.
 * @param {number} number   The number to compare against to use either the
 *                          singular or plural form.
 * @param {string} [domain] Domain to retrieve the translated text.
 *
 * @return {string} The translated singular or plural form.
 */
exports._x = _x;
var _n = i18n._n.bind(i18n);
/**
 * Translates and retrieves the singular or plural form based on the supplied
 * number, with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_nx/
 *
 * @param {string} single   The text to be used if the number is singular.
 * @param {string} plural   The text to be used if the number is plural.
 * @param {number} number   The number to compare against to use either the
 *                          singular or plural form.
 * @param {string} context  Context information for the translators.
 * @param {string} [domain] Domain to retrieve the translated text.
 *
 * @return {string} The translated singular or plural form.
 */
exports._n = _n;
var _nx = i18n._nx.bind(i18n);
/**
 * Check if current locale is RTL.
 *
 * **RTL (Right To Left)** is a locale property indicating that text is written from right to left.
 * For example, the `he` locale (for Hebrew) specifies right-to-left. Arabic (ar) is another common
 * language written RTL. The opposite of RTL, LTR (Left To Right) is used in other languages,
 * including English (`en`, `en-US`, `en-GB`, etc.), Spanish (`es`), and French (`fr`).
 *
 * @return {boolean} Whether locale is RTL.
 */
exports._nx = _nx;
var isRTL = i18n.isRTL.bind(i18n);
/**
 * Check if there is a translation for a given string (in singular form).
 *
 * @param {string} single    Singular form of the string to look up.
 * @param {string} [context] Context information for the translators.
 * @param {string} [domain]  Domain to retrieve the translated text.
 * @return {boolean} Whether the translation exists or not.
 */
exports.isRTL = isRTL;
var hasTranslation = i18n.hasTranslation.bind(i18n);
exports.hasTranslation = hasTranslation;
},{"./create-i18n":"node_modules/@wordpress/i18n/build-module/create-i18n.js","@wordpress/hooks":"node_modules/@wordpress/hooks/build-module/index.js"}],"node_modules/@wordpress/i18n/build-module/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  sprintf: true,
  defaultI18n: true,
  setLocaleData: true,
  resetLocaleData: true,
  getLocaleData: true,
  subscribe: true,
  __: true,
  _x: true,
  _n: true,
  _nx: true,
  isRTL: true,
  hasTranslation: true
};
Object.defineProperty(exports, "__", {
  enumerable: true,
  get: function () {
    return _defaultI18n.__;
  }
});
Object.defineProperty(exports, "_n", {
  enumerable: true,
  get: function () {
    return _defaultI18n._n;
  }
});
Object.defineProperty(exports, "_nx", {
  enumerable: true,
  get: function () {
    return _defaultI18n._nx;
  }
});
Object.defineProperty(exports, "_x", {
  enumerable: true,
  get: function () {
    return _defaultI18n._x;
  }
});
Object.defineProperty(exports, "defaultI18n", {
  enumerable: true,
  get: function () {
    return _defaultI18n.default;
  }
});
Object.defineProperty(exports, "getLocaleData", {
  enumerable: true,
  get: function () {
    return _defaultI18n.getLocaleData;
  }
});
Object.defineProperty(exports, "hasTranslation", {
  enumerable: true,
  get: function () {
    return _defaultI18n.hasTranslation;
  }
});
Object.defineProperty(exports, "isRTL", {
  enumerable: true,
  get: function () {
    return _defaultI18n.isRTL;
  }
});
Object.defineProperty(exports, "resetLocaleData", {
  enumerable: true,
  get: function () {
    return _defaultI18n.resetLocaleData;
  }
});
Object.defineProperty(exports, "setLocaleData", {
  enumerable: true,
  get: function () {
    return _defaultI18n.setLocaleData;
  }
});
Object.defineProperty(exports, "sprintf", {
  enumerable: true,
  get: function () {
    return _sprintf.sprintf;
  }
});
Object.defineProperty(exports, "subscribe", {
  enumerable: true,
  get: function () {
    return _defaultI18n.subscribe;
  }
});
var _sprintf = require("./sprintf");
var _createI18n = require("./create-i18n");
Object.keys(_createI18n).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _createI18n[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _createI18n[key];
    }
  });
});
var _defaultI18n = _interopRequireWildcard(require("./default-i18n"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
},{"./sprintf":"node_modules/@wordpress/i18n/build-module/sprintf.js","./create-i18n":"node_modules/@wordpress/i18n/build-module/create-i18n.js","./default-i18n":"node_modules/@wordpress/i18n/build-module/default-i18n.js"}],"blocks/Example/edit.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _i18n = require("@wordpress/i18n");
var _wp$blockEditor = wp.blockEditor,
  InnerBlocks = _wp$blockEditor.InnerBlocks,
  useBlockProps = _wp$blockEditor.useBlockProps;
var SupportersEditor = function SupportersEditor() {
  var blockProps = useBlockProps();
  return /*#__PURE__*/React.createElement("div", blockProps, /*#__PURE__*/React.createElement(InnerBlocks, {
    template: [['core/group', {
      align: 'full',
      layout: {
        type: 'flex',
        orientation: 'vertical',
        justifyContent: 'center'
      }
    }, [['core/heading', {
      content: (0, _i18n.__)('Title', 'empty'),
      textAlign: 'center',
      level: 2
    }], ['core/paragraph', {
      content: (0, _i18n.__)('Text example', 'empty')
    }]]]]
  }));
};
var _default = SupportersEditor;
exports.default = _default;
},{"@wordpress/i18n":"node_modules/@wordpress/i18n/build-module/index.js"}],"blocks/Example/save.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _wp$blockEditor = wp.blockEditor,
  InnerBlocks = _wp$blockEditor.InnerBlocks,
  useBlockProps = _wp$blockEditor.useBlockProps;
var SupportersSave = function SupportersSave() {
  var blockProps = useBlockProps.save();
  return /*#__PURE__*/React.createElement("div", blockProps, /*#__PURE__*/React.createElement(InnerBlocks.Content, null));
};
var _default = SupportersSave;
exports.default = _default;
},{}],"blocks/Example/index.jsx":[function(require,module,exports) {
"use strict";

var _i18n = require("@wordpress/i18n");
var _edit = _interopRequireDefault(require("./edit"));
var _save = _interopRequireDefault(require("./save"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var registerBlockType = wp.blocks.registerBlockType;
registerBlockType('app/example-block', {
  title: (0, _i18n.__)('Empty Theme Example Block', 'empty'),
  description: (0, _i18n.__)('Display a example block', 'empty'),
  category: 'theme',
  edit: function edit(props) {
    return /*#__PURE__*/React.createElement(_edit.default, props);
  },
  save: function save(props) {
    return /*#__PURE__*/React.createElement(_save.default, props);
  }
});
},{"@wordpress/i18n":"node_modules/@wordpress/i18n/build-module/index.js","./edit":"blocks/Example/edit.jsx","./save":"blocks/Example/save.jsx"}],"blocks/index.js":[function(require,module,exports) {
"use strict";

require("./Example");
},{"./Example":"blocks/Example/index.jsx"}],"../node_modules/parcel-bundler/src/builtins/bundle-url.js":[function(require,module,exports) {
var bundleURL = null;
function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }
  return bundleURL;
}
function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);
    if (matches) {
      return getBaseURL(matches[0]);
    }
  }
  return '/';
}
function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)?\/[^/]+(?:\?.*)?$/, '$1') + '/';
}
exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],"../node_modules/parcel-bundler/src/builtins/css-loader.js":[function(require,module,exports) {
var bundle = require('./bundle-url');
function updateLink(link) {
  var newLink = link.cloneNode();
  newLink.onload = function () {
    link.remove();
  };
  newLink.href = link.href.split('?')[0] + '?' + Date.now();
  link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
  if (cssTimeout) {
    return;
  }
  cssTimeout = setTimeout(function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      if (bundle.getBaseURL(links[i].href) === bundle.getBundleURL()) {
        updateLink(links[i]);
      }
    }
    cssTimeout = null;
  }, 50);
}
module.exports = reloadCSS;
},{"./bundle-url":"../node_modules/parcel-bundler/src/builtins/bundle-url.js"}],"styles/index.scss":[function(require,module,exports) {
var reloadCSS = require('_css_loader');
module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"index.js":[function(require,module,exports) {
"use strict";

require("./blocks/index.js");
require("./styles/index.scss");
},{"./blocks/index.js":"blocks/index.js","./styles/index.scss":"styles/index.scss"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}
module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "50432" + '/');
  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);
    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);
          if (didAccept) {
            handled = true;
          }
        }
      });

      // Enable HMR for CSS by default.
      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });
      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }
    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }
    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }
    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}
function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
}
function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  // html encode message and stack trace
  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}
function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }
  var parents = [];
  var k, d, dep;
  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }
  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }
  return parents;
}
function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }
  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}
function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }
  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }
  if (checkedAssets[id]) {
    return;
  }
  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }
  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}
function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};
  if (cached) {
    cached.hot.data = bundle.hotData;
  }
  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }
  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });
    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.js"], null)
//# sourceMappingURL=index.js.map