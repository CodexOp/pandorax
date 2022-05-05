import logo from './logo.svg';
import './App.css';
import Navbar from './components/navbar/Navbar'
import Landing from './components/landing/Landing.js';

function App() {
  return (
    <div className='stack'>
      <Navbar />
      <Landing />
    </div>
  );
}

export default App;
