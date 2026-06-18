import { useState } from 'react'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import { Route, BrowserRouter as Router , Routes} from 'react-router-dom'
import Despensa from './pages/Despensa'
import Refrigerador from './pages/Refrigerador'
import Congelador from './pages/Congelador'


function App() {
  return(
    <div>
      <Router>
      <Navbar/>
      <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/Despensa' element={<Despensa/>}/>
      <Route path='/Refrigerador' element={<Refrigerador/>}/>
      <Route path='/Congelador' element={<Congelador/>}/>
     </Routes>
      </Router>
    </div>
    
  )
  
}

export default App
