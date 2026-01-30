import { Route, Routes } from "react-router-dom"

import Access from "@/pages/Access"
import Home from "@/pages/Home"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/access" element={<Access />} />
    </Routes>
  )
}

export default App
