describe('Web environment compatibility', () => {
  let originalProcess: any;

  beforeAll(() => {
    originalProcess = globalThis.process;
  });

  afterAll(() => {
    (globalThis as any).process = originalProcess;
  });

  test('should not throw require is not defined in non-node environment', async () => {
    // Mock the browser build of sql.js to avoid actually trying to load WASM
    jest.mock('sql.js/dist/sql-wasm-browser.js', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(async () => ({
        Database: class MockDatabase {
          close() {}
        }
      }))
    }), { virtual: true });

    // Mock process to simulate browser
    try {
        const mockProcess = {
          ...originalProcess,
          versions: { ...originalProcess?.versions, node: undefined },
          browser: true
        };
        (globalThis as any).process = mockProcess;
    } catch (e) {
        // if read-only, we might not be able to mock it perfectly
    }

    // Path to the module to test
    const modulePath = '../packages/data/src/sql_js_wrapper.ts';

    await new Promise<void>((resolve, reject) => {
        jest.isolateModules(async () => {
            try {
                // Import the module. This should not throw ReferenceError for 'require'
                const { SqlJsDatabase: SqlJsDatabaseMocked } = await import(modulePath);

                // Try to create a database.
                // Since we mocked the browser build, this should now succeed.
                const db = await SqlJsDatabaseMocked.create();
                expect(db).toBeDefined();
                db.close();

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    });
  });
});
