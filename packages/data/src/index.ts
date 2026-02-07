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
