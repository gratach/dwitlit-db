import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SimpleDwitlitDB } from '@dwitlit-db/data';
import './index.css'
import App from './App.tsx'

let db = new SimpleDwitlitDB(); // This database is very simple and only exists in memory. It has five functions: getData(id), setData(id, data), deleteData(id), getAllIds() and setUpdateListener(listener).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App db={db} />
  </StrictMode>,
)
