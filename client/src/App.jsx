import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Lists from './lists/Lists'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="lists" replace />} />
        <Route path="lists" element={<Lists />} />
      </Route>
    </Routes>
  )
}

export default App
