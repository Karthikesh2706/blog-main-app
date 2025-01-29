import React from 'react'
import { Link } from 'react-router-dom';
import './Header.css'; 

const Header = () => {
  return (
    <div>
       <header className="header">
            <h1 className="app-title">Block APP</h1>
            <nav className="nav-bar">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/blogs" className="nav-link">Blogs</Link>
            </nav>
            </header>
            
    </div>
  )
}

export default Header
