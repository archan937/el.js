## el.js CHANGELOG

### Version 2.0.2 (December 27, 2020)

* Fix handling array deletions and overwrites
* Support adding the `el:` prefix to attributes

### Version 2.0.1 (January 3, 2020)

* Improve RegExp used for evaluating template expressions (increases browser support by not using negative lookbehinds ^^)
* Add ElementJS.debugMode() which logs matched expressions (when enabled)

### Version 2.0.0 (January 3, 2020)

* Replace 'for' (attribute) with 'forEach' to avoid (label) 'for' attribute conflicts [BREAKING]

### Version 1.0.0 (November 27, 2019)

* Feature: Improve "scoping" whilst force using `el.binding` [BREAKING]

### Version 0.2.1 (November 13, 2019)

* Feature: Interpolate with the notion of "scoping" / "inherited bindings"
* Bugfix: Wrap element within a `<div>` when dealing with a single 'for' tag

### Version 0.2.0 (November 8, 2019)

* Feature: Add document.render() / El.renderPage() to render the entire page right after it is loaded (w00t!)
* Feature: Provide document.binding / El.pageBinding returning the binded object for page rendering
* Feature: Support using `.` for interpolating the binding itself (e.g. strings, integers)

### Version 0.1.1 (November 7, 2019)

* Bugfix: Respect order when item has been added to arrays

### Version 0.1.0 (April 29, 2019)

* Initial release
