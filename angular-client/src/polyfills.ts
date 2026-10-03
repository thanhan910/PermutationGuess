// Angular uses Object.hasOwn during module evaluation, before bootstrap runs.
// Safari only provides it from 15.4 onwards. Load this before the main bundle.
if (typeof Object.hasOwn !== 'function') {
  Object.defineProperty(Object, 'hasOwn', {
    value: function hasOwn(object: object, property: PropertyKey): boolean {
      return Object.prototype.hasOwnProperty.call(object, property);
    },
    writable: true,
    configurable: true,
  });
}
