import { useState } from 'react'
import { Database } from '@dwitlit-db/data';
//import reactLogo from './assets/react.svg'
//import viteLogo from '/vite.svg'
//import './styles.css'

export function SharedComponent() {
  const [count, setCount] = useState(0)

  return (
    <div className="card">
      <button onClick={() => setCount((count) => count + 1)}>
        Hey, the count is {count}
      </button>
    </div>
  )
}

export function DatabaseVisualizer({database}: {database: Database}) {
  // TODO
  return (
    <div className="card">
      <h2>Database Visualizer</h2>
      <p>This component will visualize the database.</p>
    </div>
  )
}