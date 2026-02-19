// This file is ai-generated and not checked by a human.

// DwitlitDB TypeScript implementation
// Uses better-sqlite3 for storage
// All comments are in English as requested

import Database from "better-sqlite3";

export type DwitlitID = string;
export type Link = [string, number | null];
export type DataNode = [string, Link[], Uint8Array, boolean];

class SafeIterator<T> implements IterableIterator<T | null> {
    private index = 0;
    private readonly snapshotVersion: number;

    constructor(
        private readonly db: SqliteDwitlitDB,
        private readonly data: T[]
    ) {
        this.snapshotVersion = db.getVersion();
    }

    [Symbol.iterator](): IterableIterator<T | null> {
        return this;
    }

    next(): IteratorResult<T | null> {
        // Stop if database was modified
        if (this.snapshotVersion !== this.db.getVersion()) {
            return { value: null, done: true };
        }

        if (this.index >= this.data.length) {
            return { value: null, done: true };
        }

        return {
            value: this.data[this.index++],
            done: false
        };
    }
}

// --------------------
// Main Database Class
// --------------------

export class SqliteDwitlitDB {
    private db: Database.Database;
    private version = 0; // Increases on every modification

    constructor(path: string | ":memory:" = ":memory:") {
        this.db = new Database(':memory:');
        this.db.pragma("foreign_keys = ON");
        this.initialize();
    }

    // --------------------
    // Initialization
    // --------------------

    private initialize(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS dwitlit_ids (
                dwitlit_id_id INTEGER PRIMARY KEY AUTOINCREMENT,
                dwitlit_id TEXT UNIQUE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS data_table (
                data_id INTEGER PRIMARY KEY AUTOINCREMENT,
                data BLOB NOT NULL
            );

            CREATE TABLE IF NOT EXISTS data_nodes (
                internal_id INTEGER PRIMARY KEY AUTOINCREMENT,
                dwitlit_id_id INTEGER NOT NULL,
                data_id INTEGER NOT NULL,
                link_list_length INTEGER NOT NULL,
                confirmation_flag INTEGER NOT NULL,
                FOREIGN KEY(dwitlit_id_id) REFERENCES dwitlit_ids(dwitlit_id_id),
                FOREIGN KEY(data_id) REFERENCES data_table(data_id)
            );

            CREATE TABLE IF NOT EXISTS links (
                link_id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_internal_id INTEGER NOT NULL,
                dwitlit_id_id INTEGER NOT NULL,
                target_internal_id INTEGER,
                link_index INTEGER NOT NULL,
                FOREIGN KEY(source_internal_id) REFERENCES data_nodes(internal_id),
                FOREIGN KEY(dwitlit_id_id) REFERENCES dwitlit_ids(dwitlit_id_id),
                FOREIGN KEY(target_internal_id) REFERENCES data_nodes(internal_id)
            );
        `);
    }

    // --------------------
    // Version Handling
    // --------------------

    private bumpVersion(): void {
        this.version++;
    }

    getVersion(): number {
        return this.version;
    }

    // --------------------
    // Utility Functions
    // --------------------

    private getOrCreateDwitlitId(id: DwitlitID): number {
        const row : any = this.db
            .prepare("SELECT dwitlit_id_id FROM dwitlit_ids WHERE dwitlit_id = ?")
            .get(id);

        if (row) return row.dwitlit_id_id;

        const result = this.db
            .prepare("INSERT INTO dwitlit_ids (dwitlit_id) VALUES (?)")
            .run(id);

        return Number(result.lastInsertRowid);
    }

    private insertData(data: Uint8Array): number {
        const result = this.db
            .prepare("INSERT INTO data_table (data) VALUES (?)")
            .run(Buffer.from(data));

        return Number(result.lastInsertRowid);
    }

    private nodeExists(id: number): boolean {
        const row = this.db
            .prepare("SELECT 1 FROM data_nodes WHERE internal_id = ?")
            .get(id);

        return !!row;
    }

    // Check if specific link creates a cycle
    private createsCycle(source: number, target: number): boolean {
        if (source === target) return true;

        const visited = new Set<number>();
        const stack: number[] = [target];

        while (stack.length > 0) {
            const current = stack.pop()!;

            if (current === source) return true;
            if (visited.has(current)) continue;

            visited.add(current);

            const rows : any[] = this.db
                .prepare(`
                    SELECT target_internal_id
                    FROM links
                    WHERE source_internal_id = ?
                    AND target_internal_id IS NOT NULL
                `)
                .all(current);

            for (const row of rows) {
                stack.push(row.target_internal_id);
            }
        }

        return false;
    }

    // --------------------
    // Public API
    // --------------------

    // set_data_node
    setDataNode(
        dwitlitId: DwitlitID,
        links: Link[],
        data: Uint8Array,
        confirmationFlag: boolean | null
    ): number | null {
        const tx = this.db.transaction(() => {
            // Validate specific links
            for (const link of links) {
                if (link[1] !== null) {
                    if (!this.nodeExists(link[1])) {
                        return null;
                    }
                }
            }

            const dwId = this.getOrCreateDwitlitId(dwitlitId);
            const dataBuffer = Buffer.from(data);

            // Check for existing node
            const existing : any[] = this.db
                .prepare(`
                    SELECT dn.internal_id
                    FROM data_nodes dn
                    JOIN data_table dt ON dn.data_id = dt.data_id
                    WHERE dn.dwitlit_id_id = ?
                    AND dt.data = ?
                    AND dn.link_list_length = ?
                `)
                .all(dwId, dataBuffer, links.length);

            for (const row of existing) {
                const internalId = row.internal_id;

                const linkRows: any = this.db
                    .prepare(`
                        SELECT l.link_index, di.dwitlit_id, l.target_internal_id
                        FROM links l
                        JOIN dwitlit_ids di ON l.dwitlit_id_id = di.dwitlit_id_id
                        WHERE l.source_internal_id = ?
                        ORDER BY l.link_index
                    `)
                    .all(internalId);

                let match = true;

                if (linkRows.length !== links.length) {
                    match = false;
                } else {
                    for (let i = 0; i < links.length; i++) {
                        const a = links[i];
                        const b = linkRows[i];

                        if (
                            a[0] !== b.dwitlit_id ||
                            a[1] !== b.target_internal_id
                        ) {
                            match = false;
                            break;
                        }
                    }
                }

                if (match) {
                    // Update confirmation flag if needed
                    if (confirmationFlag !== null) {
                        this.db
                            .prepare(`
                                UPDATE data_nodes
                                SET confirmation_flag = ?
                                WHERE internal_id = ?
                            `)
                            .run(confirmationFlag ? 1 : 0, internalId);
                    }

                    return internalId;
                }
            }

            // Insert new data
            const dataId = this.insertData(data);

            const result = this.db
                .prepare(`
                    INSERT INTO data_nodes
                    (dwitlit_id_id, data_id, link_list_length, confirmation_flag)
                    VALUES (?, ?, ?, ?)
                `)
                .run(
                    dwId,
                    dataId,
                    links.length,
                    confirmationFlag === null ? 0 : confirmationFlag ? 1 : 0
                );

            const internalId = Number(result.lastInsertRowid);

            // Insert links
            for (let i = 0; i < links.length; i++) {
                const link = links[i];

                const linkDwId = this.getOrCreateDwitlitId(link[0]);

                if (link[1] !== null) {
                    if (this.createsCycle(internalId, link[1])) {
                        throw new Error("Specific link cycle detected");
                    }
                }

                this.db
                    .prepare(`
                        INSERT INTO links
                        (source_internal_id, dwitlit_id_id, target_internal_id, link_index)
                        VALUES (?, ?, ?, ?)
                    `)
                    .run(
                        internalId,
                        linkDwId,
                        link[1],
                        i
                    );
            }

            this.bumpVersion();
            return internalId;
        });

        try {
            return tx();
        } catch {
            return null;
        }
    }

    // get_data_node
    getDataNode(internalId: number): DataNode | null {
        const node: any = this.db
            .prepare(`
                SELECT dn.*, di.dwitlit_id, dt.data
                FROM data_nodes dn
                JOIN dwitlit_ids di ON dn.dwitlit_id_id = di.dwitlit_id_id
                JOIN data_table dt ON dn.data_id = dt.data_id
                WHERE dn.internal_id = ?
            `)
            .get(internalId);

        if (!node) return null;

        const links = this.db
            .prepare(`
                SELECT l.link_index, di.dwitlit_id, l.target_internal_id
                FROM links l
                JOIN dwitlit_ids di ON l.dwitlit_id_id = di.dwitlit_id_id
                WHERE l.source_internal_id = ?
                ORDER BY l.link_index
            `)
            .all(internalId)
            .map((r: any) => ([r.dwitlit_id, r.target_internal_id] as [string, number | null]));

        return [
            node.dwitlit_id,
            links,
            Buffer.from(node.data),
            !!node.confirmation_flag
        ];
    }

    // remove_data_node
    removeDataNode(internalId: number): boolean | null {
        if (!this.nodeExists(internalId)) return null;

        const backlinks = this.db
            .prepare(`
                SELECT 1 FROM links
                WHERE target_internal_id = ?
                LIMIT 1
            `)
            .get(internalId);

        if (backlinks) return false;

        const tx = this.db.transaction(() => {
            this.db
                .prepare("DELETE FROM links WHERE source_internal_id = ?")
                .run(internalId);

            this.db
                .prepare("DELETE FROM data_nodes WHERE internal_id = ?")
                .run(internalId);

            this.bumpVersion();
        });

        tx();
        return true;
    }

    // update_confirmation_flag
    updateConfirmationFlag(
        internalId: number,
        flag: boolean
    ): boolean {
        const result = this.db
            .prepare(`
                UPDATE data_nodes
                SET confirmation_flag = ?
                WHERE internal_id = ?
            `)
            .run(flag ? 1 : 0, internalId);

        if (result.changes > 0) {
            this.bumpVersion();
            return true;
        }

        return false;
    }

    // iterate_data_nodes
    iterateDataNodes(): IterableIterator<number | null> {
        const rows = this.db
            .prepare("SELECT internal_id FROM data_nodes ORDER BY internal_id")
            .all()
            .map((r: any) => r.internal_id);

        return new SafeIterator(this, rows);
    }

    // iterate_links
    iterateLinks(internalId: number): IterableIterator<[string, number | null] | null> | null {
        if (!this.nodeExists(internalId)) return null;

        const rows = this.db
            .prepare(`
                SELECT di.dwitlit_id, l.target_internal_id
                FROM links l
                JOIN dwitlit_ids di ON l.dwitlit_id_id = di.dwitlit_id_id
                WHERE l.source_internal_id = ?
                ORDER BY l.link_index
            `)
            .all(internalId)
            .map((r: any) => [r.dwitlit_id, r.target_internal_id] as [string, number | null]);

        return new SafeIterator(this, rows);
    }

    // iterate_data_nodes_by_dwitlit_id
    iterateDataNodesByDwitlitId(dwitlitId: string): IterableIterator<number | null> {
        const rows = this.db
            .prepare(`
                SELECT dn.internal_id
                FROM data_nodes dn
                JOIN dwitlit_ids di ON dn.dwitlit_id_id = di.dwitlit_id_id
                WHERE di.dwitlit_id = ?
                ORDER BY dn.internal_id
            `)
            .all(dwitlitId)
            .map((r: any) => r.internal_id);

        return new SafeIterator(this, rows);
    }

    // iterate_general_backlinks
    iterateGeneralBacklinks(
        dwitlitId: string
    ): IterableIterator<[number, number] | null> {
        const rows = this.db
            .prepare(`
                SELECT l.source_internal_id, l.link_index
                FROM links l
                JOIN dwitlit_ids di ON l.dwitlit_id_id = di.dwitlit_id_id
                WHERE di.dwitlit_id = ?
                AND l.target_internal_id IS NULL
                ORDER BY l.source_internal_id, l.link_index
            `)
            .all(dwitlitId)
            .map((r: any) => [r.source_internal_id, r.link_index] as [number, number]);

        return new SafeIterator(this, rows);
    }

    // iterate_specific_backlinks
    iterateSpecificBacklinks(
        internalId: number
    ): IterableIterator<[number, number] | null> | null {
        if (!this.nodeExists(internalId)) return null;

        const rows = this.db
            .prepare(`
                SELECT source_internal_id, link_index
                FROM links
                WHERE target_internal_id = ?
                ORDER BY source_internal_id, link_index
            `)
            .all(internalId)
            .map((r: any) => [r.source_internal_id, r.link_index] as [number, number]);

        return new SafeIterator(this, rows);
    }

    // --------------------
    // Close Database
    // --------------------

    close(): void {
        this.db.close();
    }
}
