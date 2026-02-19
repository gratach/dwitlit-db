// Interface for the SQLite wrapper used by SqliteDwitlitDB
// Designed to match the subset of better-sqlite3 that is actually used

export interface ISqliteDatabase {
    // Execute raw SQL (used for schema initialization)
    exec(sql: string): void;

    // Set SQLite pragmas (e.g. foreign_keys = ON)
    pragma(value: string): void;

    // Prepare a SQL statement
    prepare(sql: string): ISqliteStatement;

    // Run a function inside a transaction
    transaction<T>(fn: () => T): () => T;

    // Close the database connection
    close(): void;
}

// Interface for prepared SQL statements
export interface ISqliteStatement {
    // Execute statement without returning rows
    run(...params: any[]): ISqliteRunResult;

    // Get a single row
    get(...params: any[]): any;

    // Get all rows
    all(...params: any[]): any[];
}

// Result object returned by run()
export interface ISqliteRunResult {
    // ID of the last inserted row
    lastInsertRowid?: number | bigint;

    // Number of affected rows
    changes: number;
}