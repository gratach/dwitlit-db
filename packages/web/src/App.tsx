//import { useState } from 'react'
//import reactLogo from './assets/react.svg'
//import viteLogo from '/vite.svg'
import { DwitlitDBVisualizer } from '@dwitlit-db/ui';
import type { IDwitlitDB } from '@dwitlit-db/data';
import './App.css'

function App({db}: {db: IDwitlitDB}) {
  return (
    <>
      <DwitlitDBVisualizer database={db} />
    </>
  )
}

export default App
