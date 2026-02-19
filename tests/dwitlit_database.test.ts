import { SimpleDwitlitDB } from '@dwitlit-db/data';
import { SqliteDwitlitDB } from '@dwitlit-db/data';
import type { IDwitlitDB } from '@dwitlit-db/data';

type Link = [string, number | null];

function testDwitlitDB(createDB: () => IDwitlitDB, name: string) {
  describe('DwitlitDB ' + name, () => {
    let db: IDwitlitDB;

    beforeEach(() => {
      db = createDB();
    });

    afterEach(() => {
      if (!db) {
        throw new Error("createDB() returned undefined");
      }
      db.close();
    });

    test('set_data_node and get_data_node', () => {
      const data = new Uint8Array([1, 2, 3]);
      const id = db.setDataNode('test/node', [], data, true);
      expect(id).not.toBe(null);

      const result = db.getDataNode(id!);
      expect(result).toEqual(['test/node', [], data, true]);
    });

    test('uniqueness constraint', () => {
      const data = new Uint8Array([1, 2, 3]);
      const id1 = db.setDataNode('test/node', [], data, true);
      const id2 = db.setDataNode('test/node', [], data, false);

      expect(id1).toBe(id2);
      // Confirmation flag should be updated to false
      expect(db.getDataNode(id1!)![3]).toBe(false);
    });

    test('null confirmation flag in set_data_node', () => {
      const data = new Uint8Array([1, 2, 3]);
      const id1 = db.setDataNode('test/node', [], data, null);
      expect(db.getDataNode(id1!)![3]).toBe(false); // default to false

      db.updateConfirmationFlag(id1!, true);
      const id2 = db.setDataNode('test/node', [], data, null);
      expect(id1).toBe(id2);
      expect(db.getDataNode(id1!)![3]).toBe(true); // should NOT change
    });

    test('invalid dwitlit_id', () => {
      // Iterate all characters in the ASCII range to find invalid ones
      for (let i = 0; i < 128; i++) {
        const char = String.fromCharCode(i);
        if (!/^[a-zA-Z0-9\/\._-]$/.test(char)) {
          expect(()=>db.setDataNode(`invalid${char}id`, [], new Uint8Array(), true)).toThrow(`Invalid dwitlit_id: invalid${char}id`);
        }
        else {
          expect(() => db.setDataNode(`valid${char}id`, [], new Uint8Array(), true)).not.toThrow();
        }
      }
      // Test non-ascii character
      for (let i = 128; i < 1000; i += 50) {
        expect(() => db.setDataNode(`invalid${String.fromCharCode(i)}id`, [], new Uint8Array(), true)).toThrow();
      }
    });

    test('specific links and backlinks', () => {
      const data1 = new Uint8Array([1]);
      const id1 = db.setDataNode('node/1', [], data1, true);

      const data2 = new Uint8Array([2]);
      const link: Link = ['node/1', id1];
      const id2 = db.setDataNode('node/2', [link], data2, true);

      expect(id2).not.toBeNull();

      // Check specific backlink
      const backs = Array.from(db.iterateSpecificBacklinks(id1!)!);
      expect(backs).toEqual([[id2, 0]]);

      // Check link iteration
      const links = Array.from(db.iterateLinks(id2!)!);
      expect(links).toEqual([link]);
    });

    test('specific link to non-existent node fails', () => {
      const data = new Uint8Array([1]);
      const id = db.setDataNode('target/node', [], data, true);
      const id2 = db.setDataNode('other/node', [], data, true);

      // Matching internal_id but non-existent dwitlit_id
      const link3: Link = ['non/existent', id];
      const id3 = db.setDataNode('node', [link3], data, true);
      expect(id3).toBeNull();

      // Matching dwitlit_id but wrong internal_id
      const link4: Link = ['target/node', id2];
      const id4 = db.setDataNode('node', [link4], data, true);
      expect(id4).toBeNull();
    });

    test('general links and backlinks', () => {
      const data = new Uint8Array([1]);
      const link: Link = ['target/id', null];
      const id = db.setDataNode('source/id', [link], data, true);

      const backs = Array.from(db.iterateGeneralBacklinks('target/id'));
      expect(backs).toEqual([[id, 0]]);
    });

    test('remove_data_node', () => {
      const id = db.setDataNode('test', [], new Uint8Array(), true);
      expect(db.removeDataNode(id!)).toBe(true);
      expect(db.removeDataNode(id!)).toBe(null); // already removed
      expect(db.getDataNode(id!)).toBeNull();
    });

    test('remove_data_node fails if specific links exist', () => {
      const id1 = db.setDataNode('node/1', [], new Uint8Array(), true);
      db.setDataNode('node/2', [['node/1', id1]], new Uint8Array(), true);

      expect(db.removeDataNode(id1!)).toBe(false);
    });

    test('iterate_data_nodes_by_dwitlit_id', () => {
      const first_id = db.setDataNode('test', [], new Uint8Array([1]), true);
      const second_id = db.setDataNode('test', [['other', null]], new Uint8Array([1]), true);
      db.setDataNode('other', [], new Uint8Array([1]), true);

      const ids = Array.from(db.iterateDataNodesByDwitlitId('test'));
      // Order is not guaranteed, so we check for presence rather than exact order
      expect(ids).toContain(first_id);
      expect(ids).toContain(second_id);
      expect(ids.length).toBe(2);
    });

    test('iterator invalidation', () => {
      const id1 = db.setDataNode('node/1', [], new Uint8Array(), true);
      const id2 = db.setDataNode('node/2', [], new Uint8Array(), true);

      const iterator = db.iterateDataNodes();

      // Eather id1 or id2 could come first, so we check for presence rather than exact order
      const firstVal = iterator.next().value;
      expect([id1, id2]).toContain(firstVal);

      // Modify database
      db.setDataNode('node/3', [], new Uint8Array(), true);

      const nextVal = iterator.next().value;
      expect(nextVal).toBeNull();
      expect(iterator.next().done).toBe(true);
    });
  });
}

testDwitlitDB(() => new SimpleDwitlitDB(), 'SimpleDwitlitDB');
testDwitlitDB(() => new SqliteDwitlitDB(':memory:'), 'SqliteDwitlitDB');
