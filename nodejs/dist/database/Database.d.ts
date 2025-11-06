import SQLiteDatabase from 'better-sqlite3';
declare class DatabaseManager {
    private db;
    constructor();
    private initDb;
    prepare(sql: string): SQLiteDatabase.Statement;
    exec(sql: string): SQLiteDatabase.Database;
    transaction<T>(fn: () => T): T;
    close(): void;
}
declare const _default: DatabaseManager;
export default _default;
//# sourceMappingURL=Database.d.ts.map