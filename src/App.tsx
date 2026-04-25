import { useState } from 'react'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import { Route, BrowserRouter as Router , Routes} from 'react-router-dom'
import Despensa from './pages/Despensa'
import Refrigerador from './pages/refrigerador'
import Congelador from './pages/congelador'


function App() {
  return(
    <div>
      <Router>
      <Navbar/>
      <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/despensa' element={<Despensa/>}/>
      <Route path='/refrigerador' element={<Refrigerador/>}/>
      <Route path='/congelador' element={<Congelador/>}/>
     </Routes>
      </Router>
    </div>
    
  )
  
}

export default App