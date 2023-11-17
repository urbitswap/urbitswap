import React from 'react';
import {
  get as idbGet,
  set as idbSet,
  getMany as idbGetMany,
  setMany as idbSetMany,
  update as idbUpdate,
  del as idbDel,
  delMany as idbDelMany,
  // clear as idbClear,
  entries as idbEntries,
  keys as idbKeys,
  values as idbValues,
} from 'idb-keyval';
import { APP_TERM } from '@/constants';

function idbKey(key: IDBValidKey): string {
  return `~${window.ship}/${APP_TERM}/${key}`;
}

function isAppKey(key: IDBValidKey): boolean {
  return (typeof key === 'string' || key instanceof String) && key.startsWith(idbKey(""));
}

export function get<T = any>(key: IDBValidKey): Promise<T | undefined> {
  return idbGet(idbKey(key));
}

export function set(key: IDBValidKey, value: any): Promise<void> {
  return idbSet(idbKey(key), value);
}

export function setMany(entries: [IDBValidKey, any][]): Promise<void> {
  return idbSetMany(entries.map(([k, v]: [IDBValidKey, any]) => [idbKey(k), v]));
}

export function getMany<T = any>(keys: IDBValidKey[]): Promise<T[]> {
  return idbGetMany(keys.map(idbKey));
}

export function update<T = any>(
  key: IDBValidKey,
  updater: (oldValue: T | undefined) => T,
): Promise<void> {
  return idbUpdate(idbKey(key), updater);
}

export function del(key: IDBValidKey): Promise<void> {
  return idbDel(idbKey(key));
}

export function delMany(keys: IDBValidKey[]): Promise<void> {
  return idbDelMany(keys.map(idbKey));
}

export function clear(): Promise<void> {
  return keys<IDBValidKey>().then(ks => delMany(ks));
}

export function keys<KeyType extends IDBValidKey>(): Promise<KeyType[]> {
  return idbKeys<KeyType>().then((ks: KeyType[]) =>
    ks.filter((k: KeyType) => isAppKey(k))
  );
}

export function values<T = any>(): Promise<T[]> {
  return entries<IDBValidKey, T>().then((kvs: [IDBValidKey, T][]) =>
    kvs.map(([k, v]: [IDBValidKey, T]) => v)
  );
}

export function entries<KeyType extends IDBValidKey, ValueType = any>(): Promise<[KeyType, ValueType][]> {
  return idbEntries<KeyType, ValueType>().then((kvs: [KeyType, ValueType][]) =>
    kvs.filter(([k, v]: [KeyType, ValueType]) => isAppKey(k))
  );
}
