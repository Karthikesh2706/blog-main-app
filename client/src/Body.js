import React from 'react';
import { Link } from 'react-router-dom'; 
import './Body.css';
// Import quote-related icons
import { FaQuoteLeft, FaRocket } from 'react-icons/fa';

const Body = () => {
  return (
    <div className="body-container">
      <h1 className="blog-title">Post Your Blog</h1>

      <div className="content-wrapper">
        <div className="left-section">
          <div className="quote-card">
            <FaQuoteLeft className="quote-icon" />
            <p className="quotes">
              "Every day is a new opportunity to create the life you want. Choose to see the good in everything."
            </p>
          </div>
          
          <div className="quote-card">
            <FaQuoteLeft className="quote-icon" />
            <p className="quotes">
              "Blogging is not just writing; it's about sharing knowledge and inspiring others."
            </p>
          </div>
          
          <div className="quote-card">
            <FaQuoteLeft className="quote-icon" />
            <p className="quotes">
              "Consistent blogging builds habits, habits create opportunities, and opportunities lead to success."
            </p>
          </div>
        </div>

        <div className="right-section">
          <h2 className="welcome-message">Welcome to the Blog Platform!</h2>
          <div className="actions">
            <Link to="/register" className="start-button">
              <FaRocket className="rocket-icon" />
              <span>Kick to Start</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Body;
