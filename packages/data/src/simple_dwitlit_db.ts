// This file is ai-generated and not checked by a human.


import type { IDwitlitDB } from './dwitlit_db_interface';

export type Link = [string, number | null];

export interface DataNode {
  internal_id: number;
  dwitlit_id: string;
  link_list: Link[];
  data: Uint8Array;
  confirmation_flag: boolean;
}

export class SimpleDwitlitDB implements IDwitlitDB {
  private nodes: Map<number, DataNode> = new Map();
  private nextInternalId: number = 0;
  private modificationCount: number = 0;

  // Indices
  private uniqueIndex: Map<string, number> = new Map(); // key -> internal_id
  private nodesByDwitlitId: Map<string, Set<number>> = new Map();
  private generalBacklinks: Map<string, Set<string>> = new Map(); // target_dwitlit_id -> Set of "sourceId:linkIndex"
  private specificBacklinks: Map<number, Set<string>> = new Map(); // target_internal_id -> Set of "sourceId:linkIndex"

  private DWITLIT_ID_REGEX = /^[A-Za-z0-9\-\_\/\.]*$/;

  private databaseChangeListeners: Set<() => void> = new Set();

  private getUniqueKey(dwitlit_id: string, link_list: Link[], data: Uint8Array): string {
    const linksStr = JSON.stringify(link_list);
    const dataStr = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${dwitlit_id}|${linksStr}|${dataStr}`;
  }

  private validateDwitlitId(dwitlit_id: string): boolean {
    return this.DWITLIT_ID_REGEX.test(dwitlit_id);
  }

  setDataNode(dwitlit_id: string, link_list: Link[], data: Uint8Array, confirmation_flag: boolean | null): number | null {
    if (!this.validateDwitlitId(dwitlit_id)) {
      throw new Error(`Invalid dwitlit_id: ${dwitlit_id}`);
    }

    // Check if specific links point to existing nodes and don't form cycles (if node would be new)
    for (const [lid, tid] of link_list) {
      if (!this.validateDwitlitId(lid)) {
        throw new Error(`Invalid dwitlit_id in link: ${lid}`);
      }
      if (tid !== null) {
        if (!this.nodes.has(tid)) {
          return null;
        }
      }
    }

    const key = this.getUniqueKey(dwitlit_id, link_list, data);
    const existingId = this.uniqueIndex.get(key);

    if (existingId !== undefined) {
      if (confirmation_flag !== null) {
        const node = this.nodes.get(existingId)!;
        if (node.confirmation_flag !== confirmation_flag) {
          node.confirmation_flag = confirmation_flag;
          this.reportDatabaseChange
        }
      }
      return existingId;
    }

    // It's a new node, check for cycles
    // Since we don't have the new node's ID yet, we check if any specific link targets would lead back to the "to-be-created" node.
    // But wait, the new node can't be reached yet from any existing node.
    // The only way a cycle is formed is if we add a link from A to an ancestor of A.
    // Here we are creating A. So cycle is formed if A points to B and B (eventually) points to A.
    // But A is new, so no existing node can point to A via specific links yet.
    // Thus, no cycle can be formed by adding a NEW node, UNLESS it points to itself.
    for (const [_, tid] of link_list) {
      if (tid !== null) {
        // Can't point to itself because it doesn't have an ID yet.
        // Wait, if it's a new node, it doesn't have an internal_id yet.
        // So tid cannot be equal to the new internal_id.
      }
    }

    const internal_id = this.nextInternalId++;
    const node: DataNode = {
      internal_id,
      dwitlit_id,
      link_list: [...link_list],
      data: new Uint8Array(data),
      confirmation_flag: confirmation_flag ?? false,
    };

    this.nodes.set(internal_id, node);
    this.uniqueIndex.set(key, internal_id);

    // Update indices
    if (!this.nodesByDwitlitId.has(dwitlit_id)) {
      this.nodesByDwitlitId.set(dwitlit_id, new Set());
    }
    this.nodesByDwitlitId.get(dwitlit_id)!.add(internal_id);

    link_list.forEach(([lid, tid], index) => {
      if (tid === null) {
        if (!this.generalBacklinks.has(lid)) {
          this.generalBacklinks.set(lid, new Set());
        }
        this.generalBacklinks.get(lid)!.add(`${internal_id}:${index}`);
      } else {
        if (!this.specificBacklinks.has(tid)) {
          this.specificBacklinks.set(tid, new Set());
        }
        this.specificBacklinks.get(tid)!.add(`${internal_id}:${index}`);
      }
    });

    this.reportDatabaseChange();
    return internal_id;
  }

  getDataNode(internal_id: number): [string, Link[], Uint8Array, boolean] | null {
    const node = this.nodes.get(internal_id);
    if (!node) return null;
    return [node.dwitlit_id, node.link_list, node.data, node.confirmation_flag];
  }

  removeDataNode(internal_id: number): boolean | null {
    const node = this.nodes.get(internal_id);
    if (!node) return null;

    const specificBacks = this.specificBacklinks.get(internal_id);
    if (specificBacks && specificBacks.size > 0) {
      return false;
    }

    // Remove from indices
    this.nodes.delete(internal_id);
    const key = this.getUniqueKey(node.dwitlit_id, node.link_list, node.data);
    this.uniqueIndex.delete(key);
    this.nodesByDwitlitId.get(node.dwitlit_id)?.delete(internal_id);
    if (this.nodesByDwitlitId.get(node.dwitlit_id)?.size === 0) {
      this.nodesByDwitlitId.delete(node.dwitlit_id);
    }

    node.link_list.forEach(([lid, tid], index) => {
      if (tid === null) {
        this.generalBacklinks.get(lid)?.delete(`${internal_id}:${index}`);
        if (this.generalBacklinks.get(lid)?.size === 0) {
          this.generalBacklinks.delete(lid);
        }
      } else {
        this.specificBacklinks.get(tid)?.delete(`${internal_id}:${index}`);
        if (this.specificBacklinks.get(tid)?.size === 0) {
          this.specificBacklinks.delete(tid);
        }
      }
    });

    this.reportDatabaseChange();
    return true;
  }

  updateConfirmationFlag(internal_id: number, confirmation_flag: boolean): boolean {
    const node = this.nodes.get(internal_id);
    if (!node) return false;
    if (node.confirmation_flag !== confirmation_flag) {
      node.confirmation_flag = confirmation_flag;
      this.reportDatabaseChange();
    }
    return true;
  }

  *iterateDataNodes(): Generator<number | null> {
    const startCount = this.modificationCount;
    const ids = Array.from(this.nodes.keys());
    for (const id of ids) {
      if (this.modificationCount !== startCount) {
        yield null;
        return;
      }
      yield id;
    }
  }

  *iterateLinks(internal_id: number): Generator<Link | null> | null {
    const node = this.nodes.get(internal_id);
    if (!node) return null;

    const startCount = this.modificationCount;
    for (const link of node.link_list) {
      if (this.modificationCount !== startCount) {
        yield null;
        return;
      }
      yield link;
    }
  }

  *iterateDataNodesByDwitlitId(dwitlit_id: string): Generator<number | null> {
    const startCount = this.modificationCount;
    const ids = Array.from(this.nodesByDwitlitId.get(dwitlit_id) || []);
    for (const id of ids) {
      if (this.modificationCount !== startCount) {
        yield null;
        return;
      }
      yield id;
    }
  }

  *iterateGeneralBacklinks(dwitlit_id: string): Generator<[number, number] | null> {
    const startCount = this.modificationCount;
    const backs = Array.from(this.generalBacklinks.get(dwitlit_id) || []);
    for (const back of backs) {
      if (this.modificationCount !== startCount) {
        yield null;
        return;
      }
      const [sourceId, index] = back.split(':').map(Number);
      yield [sourceId, index];
    }
  }

  *iterateSpecificBacklinks(internal_id: number): Generator<[number, number] | null> | null {
    if (!this.nodes.has(internal_id)) return null;

    const startCount = this.modificationCount;
    const backs = Array.from(this.specificBacklinks.get(internal_id) || []);
    for (const back of backs) {
      if (this.modificationCount !== startCount) {
        yield null;
        return;
      }
      const [sourceId, index] = back.split(':').map(Number);
      yield [sourceId, index];
    }
  }

  addDatabaseChangeListener(listener: () => void): void {
    this.databaseChangeListeners.add(listener);
  }

  removeDatabaseChangeListener(listener: () => void): boolean {
    return this.databaseChangeListeners.delete(listener);
  }

  private reportDatabaseChange(): void {
    // This method can be used to notify listeners about database changes if we implement listener functionality in the future.
    this.modificationCount++;
    this.databaseChangeListeners.forEach(listener => listener());
  }

  close(): void {

  }
}
