import React from 'react';
import { Link } from 'react-router-dom'; 
import './Body.css';
import { 
  FaRocket, 
  FaPenFancy, 
  FaBook, 
  FaGlobeAmericas, 
  FaLightbulb, 
  FaCompass 
} from 'react-icons/fa';

const Body = () => {
  return (
    <div className="body-container">
      <div className="landing-grid">
        <div className="landing-header">
          <h1 className="blog-title">Narrative Nexus</h1>
          <p className="blog-subtitle">Explore. Create. Connect.</p>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <FaBook className="feature-icon" />
            <h3>Craft Your Story</h3>
            <p>Transform ideas into compelling narratives that resonate</p>
          </div>

          <div className="feature-card">
            <FaGlobeAmericas className="feature-icon" />
            <h3>Global Perspectives</h3>
            <p>Bridge cultures through the power of shared experiences</p>
          </div>

          <div className="feature-card">
            <FaLightbulb className="feature-icon" />
            <h3>Spark Inspiration</h3>
            <p>Discover ideas that challenge, enlighten, and transform</p>
          </div>
        </div>

        <div className="landing-cta">
          <Link to="/register" className="explore-button">
            <FaCompass className="button-icon" />
            Start Your Writing Journey
          </Link>
          <div className="cta-subtext">
            <FaPenFancy className="subtext-icon" />
            <span>Unleash Your Creative Potential</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Body;
