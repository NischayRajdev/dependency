# Gate 2 Reachability Fixtures and Expectations

## Supported Initial Patterns
- Direct named/default imports
- Literal require
- Local functions
- Simple lexical aliases
- Direct calls
- Cycles

## Supported Positive Paths (8 cases)

| Case | Entry Point | Exact Instance | Source Locations | Expected State | Expected Path / Gap | Assumptions | Author |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Direct named import | `app.js` | `packageA@1.0.0` | `app.js` -> `packageA.foo()` | `potential_path_found` | `app.js` -> `packageA.foo()` | `foo` is explicitly called | Agent |
| 2. Literal require | `app.js` | `packageB@2.1.0` | `app.js` -> `packageB()` | `potential_path_found` | `app.js` -> `packageB()` | Requires package root | Agent |
| 3. Local functions | `app.js` | `packageC@3.0.0` | `app.js` -> `localFunc()` -> `packageC.bar()` | `potential_path_found` | `app.js` -> `localFunc()` -> `packageC.bar()` | Local function is invoked | Agent |
| 4. Simple lexical aliases | `app.js` | `packageD@1.0.0` | `const {x: y} = require('packageD')` -> `y()` | `potential_path_found` | `app.js` -> `y()` -> `packageD.x()` | Alias `y` tracks to `packageD.x` | Agent |
| 5. Direct calls (chaining) | `app.js` | `packageE@1.0.0` | `import E` -> `E.start().run()` | `potential_path_found` | `app.js` -> `E.start()` -> `packageE.start` | Target method is reached | Agent |
| 6. Cycles | `app.js` | `packageF@1.0.0` | `app.js` -> `helper.js` -> `app.js` -> `packageF.init()` | `potential_path_found` | `app.js` -> `helper.js` -> `app.js` -> `packageF.init()` | Cycle resolves without infinite recursion | Agent |
| 7. Default imports | `app.js` | `packageG@1.0.0` | `import G` -> `G()` | `potential_path_found` | `app.js` -> `G()` -> `packageG` | Default export is called | Agent |
| 8. Transitive direct calls | `app.js` | `packageH@1.0.0` | `app.js` -> `lib.js` -> `packageH.method()` | `potential_path_found` | `app.js` -> `lib.js` -> `packageH.method()` | Inter-file resolution works | Agent |

## Supported Negative Paths (8 cases)

| Case | Entry Point | Exact Instance | Source Locations | Expected State | Expected Path / Gap | Assumptions | Author |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9. Dead function | `app.js` | `packageI@1.0.0` | `deadFunc` calling `packageI()` | `no_path_found_in_scope` | `deadFunc` is never invoked | Lack of call path to dead code | Agent |
| 10. Shadowed binding | `app.js` | `packageJ@1.0.0` | `import {x}` -> `function foo(x) { x() }` | `no_path_found_in_scope` | `x()` calls the parameter, not the import | Lexical scope models shadowing | Agent |
| 11. Different version | `app.js` | `packageK@2.0.0` | `app.js` -> `packageK@1.0.0` | `no_path_found_in_scope` | Call path targets v1, not v2 | Boundary prevents cross-version reachability | Agent |
| 12. Unused named import | `app.js` | `packageL@1.0.0` | `import { unused, used }` -> `used()` | `no_path_found_in_scope` | `unused` is never called | Granular export tracking works | Agent |
| 13. Teammate Case A | `app.js` | `packageQ@1.0.0` | `const q = require('packageQ');` -> unused | `no_path_found_in_scope` | `q` is imported but never invoked | Import alone is not an invocation | Teammate |
| 14. Teammate Case B | `app.js` | `packageR@1.0.0` | `function unused() { require('packageR') }` | `no_path_found_in_scope` | Function `unused` is never called | Reachability requires a path from entry points | Teammate |
| 15. Teammate Case C | `app.js` | `packageS@1.0.0` | `import { S } from 'packageS'; const x = S;` | `no_path_found_in_scope` | Assigned but not invoked | Data flow without invocation is out of scope | Teammate |
| 16. Teammate Case D | `app.js` | `packageT@1.0.0` | `import { T } from 'packageT'; // commented out T()` | `no_path_found_in_scope` | `T()` is in a comment | Comments are ignored by parser | Teammate |

## Unsupported Cases (Must return unknown) (8 cases)

| Case | Entry Point | Exact Instance | Source Locations | Expected State | Expected Path / Gap | Assumptions | Author |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 17. Computed require | `app.js` | `packageM@1.0.0` | `require('package' + 'M')` | `unknown` | Computed require | Cannot safely evaluate string concatenation | Agent |
| 18. Dynamic import | `app.js` | `packageN@1.0.0` | `import('packageN')` | `unknown` | Dynamic import | Promises are not fully traced | Agent |
| 19. Reflection / DI | `app.js` | `packageO@1.0.0` | `injector.get('packageO')` | `unknown` | Unmodelled DI container | Custom reflection is untraceable statically | Agent |
| 20. Monkey patching | `app.js` | `packageP@1.0.0` | `global.fs = require('packageP')` | `unknown` | Global pollution | We don't trace global scope mutations | Agent |
| 21. Teammate Case E | `app.js` | `packageU@1.0.0` | `eval("require('packageU')")` | `unknown` | `eval` usage | Cannot safely parse `eval` | Teammate |
| 22. Teammate Case F | `app.js` | `packageV@1.0.0` | `import * as V from 'packageV'; const m = 'foo'; V[m]()` | `unknown` | Computed member access | Property access by dynamic string is unknown | Teammate |
| 23. Teammate Case G | `app.js` | `packageW@1.0.0` | `require(getModuleName())` | `unknown` | Function return used as module name | Statically unresolvable require | Teammate |
| 24. Teammate Case H | `app.js` | `packageX@1.0.0` | `[1].map(require('packageX'))` | `unknown` | Higher-order function callback | Implicit framework/callback invocations are untraced | Teammate |
