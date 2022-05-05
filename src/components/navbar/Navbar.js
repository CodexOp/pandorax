import React from 'react';
import './navbar.css';
import logo from '../../images/logo.png'

const Navbar = () => {
  return (
    <div>
        <div className='navbar_outer'>
            
            <div className='logo_container'><img className="logo" src={logo} /><h2>PandoraX</h2></div>
            <div className='connect_wallet_container'>
                <button className='wallet'>CONNECT</button>
            </div>
        </div>
    </div>
  )
}

export default Navbar;
