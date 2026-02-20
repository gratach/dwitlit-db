import type { SqlJsStatic, Database } from "sql.js";

// sql_js_wrapper.ts

type UniversalTextDecoder = {
  decode(
    input?: ArrayBuffer | ArrayBufferView | SharedArrayBuffer | null,
    options?: { stream?: boolean }
  ): string;
};

type UniversalTextEncoder = {
  encode(input?: string): Uint8Array;
};

let TextDecoderImpl: {
  new (...args: any[]): UniversalTextDecoder;
};

let TextEncoderImpl: {
  new (...args: any[]): UniversalTextEncoder;
};

async function loadEncoding() {
  if (
    typeof globalThis.TextDecoder !== "undefined" &&
    typeof globalThis.TextEncoder !== "undefined"
  ) {
    TextDecoderImpl = globalThis.TextDecoder as any;
    TextEncoderImpl = globalThis.TextEncoder as any;
    return;
  }

  const util = await import("util");

  TextDecoderImpl = util.TextDecoder as any;
  TextEncoderImpl = util.TextEncoder as any;
}

export async function ensureEncoding() {
  await loadEncoding();

  if (!(globalThis as any).TextDecoder) {
    (globalThis as any).TextDecoder = TextDecoderImpl;
  }

  if (!(globalThis as any).TextEncoder) {
    (globalThis as any).TextEncoder = TextEncoderImpl;
  }
}

// Execute this at the start of your application to ensure TextDecoder/TextEncoder are available
ensureEncoding().catch((err) => {
  console.error("Failed to load TextDecoder/TextEncoder:", err);
  throw err;
});

// --------------------
// Environment Detection
// --------------------

const isNode =
    typeof process !== "undefined" &&
    !!process.versions?.node;

// --------------------
// Load sql.js build
// --------------------

let initSqlJs: (config?: any) => Promise<SqlJsStatic>;

if (isNode) {
    // Node build (uses fs)
    initSqlJs = require("sql.js/dist/sql-wasm.js");
} else {
    // Browser build (uses fetch)
    initSqlJs = require("sql.js/dist/sql-wasm-browser.js");
}

import {
    ISqliteDatabase,
    ISqliteStatement,
    ISqliteRunResult
} from "./sqlite_database_interface";

// Wrapper around sql.js Database
export class SqlJsDatabase implements ISqliteDatabase {
    private db: Database;

    private constructor(db: Database) {
        this.db = db;
    }

    // Factory method because sql.js initialization is async
    static async create(
        initialData?: Uint8Array
    ): Promise<SqlJsDatabase> {

        const SQL: SqlJsStatic = await initSqlJs({
            locateFile: (file: string) => {

                // --------------------
                // Node.js: absolute path
                // --------------------
                if (isNode) {
                    return require.resolve(`sql.js/dist/${file}`);
                }

                // --------------------
                // Browser: public path
                // --------------------
                // Put sql-wasm.wasm into /public/wasm/
                return `/wasm/${file}`;
            }
        });

        const db = new SQL.Database(initialData);

        return new SqlJsDatabase(db);
    }

    exec(sql: string): void {
        this.db.exec(sql);
    }

    pragma(value: string): void {
        // sql.js does not support pragma() directly
        this.db.exec(`PRAGMA ${value}`);
    }

    prepare(sql: string): ISqliteStatement {
        const stmt = this.db.prepare(sql);
        return new SqlJsStatement(this.db, stmt);
    }

    transaction<T>(fn: () => T): () => T {
        return () => {
            this.db.exec("BEGIN");

            try {
                const result = fn();
                this.db.exec("COMMIT");
                return result;
            } catch (err) {
                this.db.exec("ROLLBACK");
                throw err;
            }
        };
    }

    close(): void {
        this.db.close();
    }

    // Export database to Uint8Array (optional utility)
    export(): Uint8Array {
        return this.db.export();
    }
}

// Wrapper for sql.js statements
class SqlJsStatement implements ISqliteStatement {
    private stmt: any;
    private db: any;

    constructor(db: any, stmt: any) {
        this.db = db;
        this.stmt = stmt;
    }

    run(...params: any[]): ISqliteRunResult {
        this.bind(params);

        this.stmt.step();

        const result: ISqliteRunResult = {
            lastInsertRowid: this.getLastInsertId(),
            changes: this.getChanges()
        };

        this.stmt.reset();

        return result;
    }

    get(...params: any[]): any {
        this.bind(params);

        if (!this.stmt.step()) {
            this.stmt.reset();
            return undefined;
        }

        const row = this.getRowObject();

        this.stmt.reset();

        return row;
    }

    all(...params: any[]): any[] {
        this.bind(params);

        const rows: any[] = [];

        while (this.stmt.step()) {
            rows.push(this.getRowObject());
        }

        this.stmt.reset();

        return rows;
    }

    // --------------------
    // Internal Helpers
    // --------------------

    private bind(params: any[]): void {
        this.stmt.reset();
        this.stmt.bind(params);
    }

    private getRowObject(): any {
        const row: any = {};
        const columns = this.stmt.getColumnNames();
        const values = this.stmt.get();

        for (let i = 0; i < columns.length; i++) {
            row[columns[i]] = values[i];
        }

        return row;
    }
    private getLastInsertId(): number {
        const res = this.db.exec(
            "SELECT last_insert_rowid() AS id"
        );

        if (!res.length) return 0;

        return res[0].values[0][0] as number;
    }
    private getChanges(): number {
        const res = this.db.exec(
            "SELECT changes() AS c"
        );

        if (!res.length) return 0;

        return res[0].values[0][0] as number;
    }
}
