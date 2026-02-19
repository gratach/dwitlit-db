export class Database {
  private data: Map<string, any> = new Map();
  private listeners: Set<() => void> = new Set();

  getData(id: string) {
    return this.data.get(id);
  }

  setData(id: string, value: any) {
    this.data.set(id, value);
    this.notifyListeners();
  }

  deleteData(id: string) {
    this.data.delete(id);
    this.notifyListeners();
  }

  getAllIds() {
    return Array.from(this.data.keys());
  }

  setUpdateListener(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
}

export type { IDwitlitDB } from './dwitlit_db_interface';
export { SimpleDwitlitDB } from './simple_dwitlit_db';
export { SqliteDwitlitDB } from './sqlite_dwitlit_db';
export { SqlJsDatabase } from './sql_js_wrapper';
