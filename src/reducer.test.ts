import { keyToPathSegments } from './reducer';

describe('keyToPathSegments', () => {
  it('works', () => {
    expect(keyToPathSegments('foo')).toEqual(['foo']);
    expect(keyToPathSegments('foo.bar')).toEqual(['foo', 'bar']);
    expect(keyToPathSegments('foo!bar')).toEqual([['foo', true], 'bar']);
    expect(keyToPathSegments('foo.bar!baz')).toEqual(['foo', ['bar', true], 'baz']);
    expect(keyToPathSegments('foo!bar.baz')).toEqual([['foo', true], 'bar', 'baz']);
  });
});
