// *********************************************************************************************************************
// Basic

export type AnyRecord = Record<string, any>;
export type StringKeys<T> = keyof T extends string ? keyof T : never;

// *********************************************************************************************************************
// Deep partial
// https://stackoverflow.com/a/61233706/2405595

type DeepPartial<T> = {
  [key in keyof T]?: T[key] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[key] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[key]>;
};

// *********************************************************************************************************************
// Deep path

type RecursionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 'max';
type NextRecursionLevel<Level> = Level extends 0
  ? 1
  : Level extends 1
  ? 2
  : Level extends 2
  ? 3
  : Level extends 3
  ? 4
  : 'max';

export type DeepStringPath<
  TTarget extends AnyRecord,
  TLevel extends RecursionLevel = 0
> = TLevel extends 'max'
  ? never
  : {
      [Key in StringKeys<TTarget>]: TTarget[Key] extends (...args: any[]) => any
        ? never
        : TTarget[Key] extends string
        ? `${Key}`
        : `${Key}` | `${Key}.${DeepStringPath<TTarget[Key], NextRecursionLevel<TLevel>>}`;
    }[StringKeys<TTarget>];

export type ValueAtDeepStringPath<
  TTarget extends AnyRecord,
  TPath extends string
> = TPath extends `${infer Head}.${infer Rest}`
  ? TTarget[Head] extends AnyRecord
    ? ValueAtDeepStringPath<TTarget[Head], Rest>
    : never
  : TPath extends keyof TTarget
  ? TTarget[TPath]
  : never;

// *********************************************************************************************************************
// Actions

export interface IReduxAction {
  type: string;
}

export type IActionCommit<TValue> = {
  [path in DeepStringPath<TValue>]: ValueAtDeepStringPath<TValue, path>;
};

export type IGitLikeReduxAction<TValue> = IReduxAction & DeepPartial<IActionCommit<TValue>>;
