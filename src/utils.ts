export function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

const objectCtorString = Function.prototype.toString.call(Object);

export function isPlainObject(value) {
  if (!isObjectLike(value) || Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }

  const Ctor = Object.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (
    typeof Ctor == 'function' &&
    Ctor instanceof Ctor &&
    Function.prototype.toString.call(Ctor) == objectCtorString
  );
}
