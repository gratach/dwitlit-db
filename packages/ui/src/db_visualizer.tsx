// This file is ai-generated and not checked by a human.

import { useState, useEffect } from 'react'
import { Database } from '@dwitlit-db/data';

export function DBVisualizer({database}: {database: Database}) {
  const [ids, setIds] = useState<string[]>([]);
  const [data, setData] = useState<Record<string, any>>({});

  useEffect(() => {
    const update = () => {
      const allIds = database.getAllIds();
      setIds(allIds);
      const newData: Record<string, any> = {};
      allIds.forEach(id => {
        newData[id] = database.getData(id);
      });
      setData(newData);
    };

    update();
    return database.setUpdateListener(update);
  }, [database]);

  const [newId, setNewId] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newId) {
      database.setData(newId, newValue);
      setNewId('');
      setNewValue('');
    }
  };

  return (
    <div className="card">
      <h2>Database Visualizer</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="ID"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <button onClick={handleAdd}>Add/Update</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>ID</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Value</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {ids.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', padding: '1rem' }}>No data</td>
            </tr>
          ) : (
            ids.map(id => (
              <tr key={id}>
                <td>{id}</td>
                <td>{JSON.stringify(data[id])}</td>
                <td>
                  <button onClick={() => database.deleteData(id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
