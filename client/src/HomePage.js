import React, { useState, useEffect, useContext } from 'react';
import Header from './Header';
import { UserContext } from './UserContext';
import './HomePage.css';
import { FaPlus, FaTimes } from 'react-icons/fa';

const HomePage = () => {
  const { userInfo } = useContext(UserContext);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [newBlog, setNewBlog] = useState({
    name: '',
    description: '',
    imageUrl: null,
    blogUrl: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecentBlogs();
  }, []);

  const fetchRecentBlogs = async () => {
    try {
      const response = await fetch('http://localhost:4000/blogs/recent');
      if (response.ok) {
        const data = await response.json();
        setRecentBlogs(data);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setNewBlog({ ...newBlog, imageUrl: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    setError('');

    if (!userInfo || !userInfo.id) {
      setError('Please log in to create a blog');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newBlog.name);
      formData.append('description', newBlog.description);
      formData.append('blogUrl', newBlog.blogUrl);
      formData.append('userId', userInfo.id);

      if (newBlog.imageUrl) {
        formData.append('image', newBlog.imageUrl);
      } else {
        setError('Please select an image');
        return;
      }

      const response = await fetch('http://localhost:4000/blogs/create', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateModal(false);
        fetchRecentBlogs();
        setNewBlog({ name: '', description: '', imageUrl: null, blogUrl: '' });
        setPreviewImage(null);
        alert('Blog created successfully!');
      } else {
        setError(data.message || 'Error creating blog');
      }
    } catch (error) {
      console.error('Error creating blog:', error);
      setError('Error creating blog. Please try again.');
    }
  };

  const handleBlogClick = (url) => {
    window.open(url, '_blank');
  };

  const filteredBlogs = activeTab === 'my' && userInfo
    ? recentBlogs.filter(blog => blog.userId === userInfo.id)
    : recentBlogs;

  return (
    <div className="home-container">
      <Header />
      
      <main className="main-content">
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Discover and Share</h1>
            <p>Your gateway to creative expression and knowledge sharing</p>
            <div className="welcome-actions">
              <button 
                className="create-blog-btn" 
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus /> Create Blog
              </button>
            </div>
          </div>
        </div>

        {showCreateModal && (
          <div className="modal-overlay">
            <div className="create-blog-modal">
              <button className="close-modal" onClick={() => setShowCreateModal(false)}>
                <FaTimes />
              </button>
              
              <h2>Create Your Blog</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleCreateBlog}>
                <div className="form-group">
                  <label>Blog Title</label>
                  <input
                    type="text"
                    value={newBlog.name}
                    onChange={(e) => setNewBlog({ ...newBlog, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newBlog.description}
                    onChange={(e) => setNewBlog({ ...newBlog, description: e.target.value })}
                    placeholder="Write a brief description of your blog..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Blog URL</label>
                  <input
                    type="url"
                    value={newBlog.blogUrl}
                    onChange={(e) => setNewBlog({ ...newBlog, blogUrl: e.target.value })}
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Thumbnail Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    required
                  />
                  {previewImage && (
                    <div className="image-preview">
                      <img src={previewImage} alt="Preview" />
                    </div>
                  )}
                </div>

                <button type="submit" className="submit-blog-btn">
                  Publish Blog
                </button>
              </form>
            </div>
          </div>
        )}

        <section className="recent-blogs">
          <div className="blogs-header">
            <h2>Explore Blogs</h2>
            <div className="section-tabs">
              <button
                className={`section-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Blogs
              </button>
              {userInfo && (
                <button
                  className={`section-tab ${activeTab === 'my' ? 'active' : ''}`}
                  onClick={() => setActiveTab('my')}
                >
                  My Blogs
                </button>
              )}
            </div>
          </div>
          <div className="blogs-grid">
            {filteredBlogs.map((blog) => (
              <div
                key={blog._id}
                className="blog-card"
                onClick={() => handleBlogClick(blog.blogUrl)}
              >
                <div className="blog-image">
                  <img 
                    src={blog.imageUrl} 
                    alt={blog.name} 
                    className="blog-thumbnail"
                  />
                </div>
                <div className="blog-details">
                  <h3>{blog.name}</h3>
                  <p>{blog.description}</p>
                  <div className="blog-meta">
                    <span className="blog-author">
                      {blog.userId === userInfo?.id ? 'You' : 'Another User'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
