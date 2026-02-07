//import { useState } from 'react'
//import reactLogo from './assets/react.svg'
//import viteLogo from '/vite.svg'
import { DatabaseVisualizer } from '@dwitlit-db/ui';
import { Database } from '@dwitlit-db/data';
import './App.css'

function App({db}: {db: Database}) {
  return (
    <>
      <DatabaseVisualizer database={db} />
    </>
  )
}

export default App
