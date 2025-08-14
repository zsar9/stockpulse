declare module 'better-sqlite3' {
	interface Statement {
		run: (...params: any[]) => any;
		all: (...params: any[]) => any[];
		get: (...params: any[]) => any;
	}
	class Database<T = any> {
		constructor(filename: string);
		prepare<TStmt = any>(sql: string): Statement;
		exec(sql: string): void;
		pragma(s: string): void;
		transaction<TArgs = any>(fn: (args: TArgs) => void): (args: TArgs) => void;
	}
	export default Database;
}