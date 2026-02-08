import { Database } from '@dwitlit-db/data';

describe('Database', () => {
  let db: Database;

  beforeEach(() => {
    db = new Database();
  });

  test('setData and getData', () => {
    db.setData('key1', 'value1');
    expect(db.getData('key1')).toBe('value1');
  });

  test('deleteData', () => {
    db.setData('key1', 'value1');
    db.deleteData('key1');
    expect(db.getData('key1')).toBeUndefined();
  });

  test('getAllIds', () => {
    db.setData('key1', 'value1');
    db.setData('key2', 'value2');
    expect(db.getAllIds()).toEqual(['key1', 'key2']);
  });

  test('setUpdateListener', () => {
    const listener = jest.fn();
    const unsubscribe = db.setUpdateListener(listener);

    db.setData('key1', 'value1');
    expect(listener).toHaveBeenCalledTimes(1);

    db.deleteData('key1');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    db.setData('key2', 'value2');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
