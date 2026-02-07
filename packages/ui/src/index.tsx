import { useState } from 'react'
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