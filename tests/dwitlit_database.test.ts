import { DwitlitDB, Link } from '@dwitlit-db/data';

describe('DwitlitDB', () => {
  let db: DwitlitDB;

  beforeEach(() => {
    db = new DwitlitDB();
  });

  test('set_data_node and get_data_node', () => {
    const data = new Uint8Array([1, 2, 3]);
    const id = db.set_data_node('test/node', [], data, true);
    expect(id).toBe(0);

    const result = db.get_data_node(id!);
    expect(result).toEqual(['test/node', [], data, true]);
  });

  test('uniqueness constraint', () => {
    const data = new Uint8Array([1, 2, 3]);
    const id1 = db.set_data_node('test/node', [], data, true);
    const id2 = db.set_data_node('test/node', [], data, false);

    expect(id1).toBe(id2);
    // Confirmation flag should be updated to false
    expect(db.get_data_node(id1!)![3]).toBe(false);
  });

  test('null confirmation flag in set_data_node', () => {
    const data = new Uint8Array([1, 2, 3]);
    const id1 = db.set_data_node('test/node', [], data, null);
    expect(db.get_data_node(id1!)![3]).toBe(false); // default to false

    db.update_confirmation_flag(id1!, true);
    const id2 = db.set_data_node('test/node', [], data, null);
    expect(id1).toBe(id2);
    expect(db.get_data_node(id1!)![3]).toBe(true); // should NOT change
  });

  test('invalid dwitlit_id', () => {
    expect(() => db.set_data_node('invalid id!', [], new Uint8Array(), true)).toThrow();
  });

  test('specific links and backlinks', () => {
    const data1 = new Uint8Array([1]);
    const id1 = db.set_data_node('node/1', [], data1, true);

    const data2 = new Uint8Array([2]);
    const link: Link = ['node/1', id1];
    const id2 = db.set_data_node('node/2', [link], data2, true);

    expect(id2).not.toBeNull();

    // Check specific backlink
    const backs = Array.from(db.iterate_specific_backlinks(id1!)!);
    expect(backs).toEqual([[id2, 0]]);

    // Check link iteration
    const links = Array.from(db.iterate_links(id2!)!);
    expect(links).toEqual([link]);
  });

  test('general links and backlinks', () => {
    const data = new Uint8Array([1]);
    const link: Link = ['target/id', null];
    const id = db.set_data_node('source/id', [link], data, true);

    const backs = Array.from(db.iterate_general_backlinks('target/id'));
    expect(backs).toEqual([[id, 0]]);
  });

  test('remove_data_node', () => {
    const id = db.set_data_node('test', [], new Uint8Array(), true);
    expect(db.remove_data_node(id!)).toBe(true);
    expect(db.get_data_node(id!)).toBeNull();
  });

  test('remove_data_node fails if specific links exist', () => {
    const id1 = db.set_data_node('node/1', [], new Uint8Array(), true);
    db.set_data_node('node/2', [['node/1', id1]], new Uint8Array(), true);

    expect(db.remove_data_node(id1!)).toBe(false);
  });

  test('iterate_data_nodes_by_dwitlit_id', () => {
    db.set_data_node('test', [], new Uint8Array([1]), true);
    db.set_data_node('test', [['other', null]], new Uint8Array([1]), true);
    db.set_data_node('other', [], new Uint8Array([1]), true);

    const ids = Array.from(db.iterate_data_nodes_by_dwitlit_id('test'));
    expect(ids).toHaveLength(2);
  });

  test('iterator invalidation', () => {
    db.set_data_node('node/1', [], new Uint8Array(), true);
    db.set_data_node('node/2', [], new Uint8Array(), true);

    const iterator = db.iterate_data_nodes();

    expect(iterator.next().value).toBe(0);

    // Modify database
    db.set_data_node('node/3', [], new Uint8Array(), true);

    const nextVal = iterator.next().value;
    expect(nextVal).toBeNull();
    expect(iterator.next().done).toBe(true);
  });

  test('specific link to non-existent node returns null', () => {
    const id = db.set_data_node('node', [['ghost', 999]], new Uint8Array(), true);
    expect(id).toBeNull();
  });
});
