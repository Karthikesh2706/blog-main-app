import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from './UserContext';
import Header from './Header';
import './HomePage.css';
import { FaPlus, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';

// Configure Axios base URL and default headers
axios.defaults.baseURL = 'http://localhost:4000';
axios.defaults.headers.common['Content-Type'] = 'application/json';

const HomePage = () => {
  const { userInfo } = useContext(UserContext);
  const [allBlogs, setAllBlogs] = useState([]);
  const [userBlogs, setUserBlogs] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [newBlog, setNewBlog] = useState({
    name: '',
    description: '',
    imageUrl: null,
    blogUrl: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch blogs when component mounts or user changes
  useEffect(() => {
    fetchAllBlogs();
    if (userInfo) {
      fetchUserBlogs();
    }
  }, [userInfo]);

  // Fetch all blogs for all users
  const fetchAllBlogs = async () => {
    try {
      const response = await axios.get('/blogs/all');
      setAllBlogs(response.data);
    } catch (error) {
      console.error('Error fetching all blogs:', error);
      setError('Failed to fetch blogs');
    }
  };

  // Fetch blogs specific to the logged-in user
  const fetchUserBlogs = async () => {
    try {
      if (!userInfo || !userInfo.id) {
        setUserBlogs([]);
        return;
      }

      const response = await axios.get(`/blogs/user/${userInfo.id}`);
      setUserBlogs(response.data);
    } catch (error) {
      console.error('Error fetching user blogs:', error);
      setUserBlogs([]);
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

    const formData = new FormData();
    formData.append('name', newBlog.name);
    formData.append('description', newBlog.description);
    formData.append('blogUrl', newBlog.blogUrl);
    formData.append('userId', userInfo.id);

    // Handle image upload
    if (newBlog.imageUrl) {
      // If it's a File object, append it
      if (newBlog.imageUrl instanceof File) {
        formData.append('image', newBlog.imageUrl);
      }
    } else {
      setError('Please select an image');
      return;
    }

    try {
      const response = await axios.post('/blogs/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newBlogData = response.data.blog;
      
      // Add new blog to both all blogs and user blogs
      setAllBlogs([...allBlogs, newBlogData]);
      setUserBlogs([...userBlogs, newBlogData]);
      
      // Reset form and close modal
      setShowCreateModal(false);
      setNewBlog({ name: '', description: '', imageUrl: null, blogUrl: '' });
      setPreviewImage(null);
      alert('Blog created successfully!');
    } catch (error) {
      console.error('Error in blog operation:', error);
      
      // More detailed error handling
      if (error.response) {
        setError(error.response.data.message || 'Server error while processing blog');
        console.error('Server error details:', error.response.data);
      } else if (error.request) {
        setError('No response received from server. Please check your connection.');
      } else {
        setError('Error setting up the request. Please try again.');
      }
    }
  };

  // Open Edit Modal
  const openEditModal = (blog) => {
    console.log('Opening Edit Modal for Blog:', blog);
    
    // Ensure we have a complete blog object
    setCurrentBlog({
      _id: blog._id,
      name: blog.name,
      description: blog.description,
      blogUrl: blog.blogUrl,
      imageUrl: blog.imageUrl,
      userId: blog.userId
    });
    
    // Set preview image if exists
    setPreviewImage(blog.imageUrl);
    setShowEditModal(true);
  };

  // Edit Blog Handler
  const handleEditBlog = async (e) => {
    e.preventDefault();
    setError('');

    // Comprehensive logging
    console.log('Edit Blog - Current User:', userInfo);
    console.log('Edit Blog - Current Blog:', currentBlog);

    if (!userInfo || !userInfo.id) {
      const errorMsg = 'Please log in to edit a blog';
      setError(errorMsg);
      alert(errorMsg);
      return;
    }

    // Validate required fields
    if (!currentBlog.name || !currentBlog.description) {
      const errorMsg = 'Name and description are required';
      setError(errorMsg);
      alert(errorMsg);
      return;
    }

    const formData = new FormData();
    formData.append('name', currentBlog.name);
    formData.append('description', currentBlog.description);
    formData.append('blogUrl', currentBlog.blogUrl || '');
    formData.append('userId', userInfo.id);

    // Handle image upload
    if (currentBlog.imageUrl instanceof File) {
      formData.append('image', currentBlog.imageUrl);
    }

    try {
      console.log('Sending Update Request with FormData:', Object.fromEntries(formData));
      
      const response = await axios.put(`/blogs/${currentBlog._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const updatedBlog = response.data;
      console.log('Blog Update Response:', updatedBlog);
      
      // Update blogs in both all blogs and user blogs
      const updateBlogInList = (blogList) => 
        blogList.map(blog => 
          blog._id === updatedBlog._id ? updatedBlog : blog
        );
      
      setAllBlogs(prevBlogs => updateBlogInList(prevBlogs));
      setUserBlogs(prevBlogs => updateBlogInList(prevBlogs));
      
      // Reset edit modal
      setShowEditModal(false);
      setCurrentBlog(null);
      setPreviewImage(null);
      
      alert('Blog updated successfully!');
    } catch (error) {
      console.error('Error updating blog - Full Error:', error);
      
      // More detailed error handling
      const errorMessage = error.response?.data?.message || 
        error.response?.data?.details || 
        error.message ||
        'Failed to update blog';
      
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  // Delete Blog Handler
  const handleDeleteBlog = async (blogId) => {
    console.log('Attempting to delete blog:', blogId);
    console.log('Current User:', userInfo);

    if (!userInfo || !userInfo.id) {
      const errorMsg = 'Please log in to delete a blog';
      setError(errorMsg);
      alert(errorMsg);
      return;
    }

    // Confirm deletion
    const confirmDelete = window.confirm('Are you sure you want to delete this blog?');
    if (!confirmDelete) return;

    try {
      console.log('Sending Delete Request:', { 
        blogId, 
        userId: userInfo.id,
        userInfoType: typeof userInfo.id
      });
      
      // Ensure userId is sent as a string
      const response = await axios({
        method: 'delete',
        url: `/blogs/${blogId}`,
        data: { 
          userId: userInfo.id.toString() 
        }
      });
      
      console.log('Delete Response:', response.data);
      
      // Remove blog from both all blogs and user blogs
      const removeBlogFromList = (blogList) => 
        blogList.filter(blog => blog._id !== blogId);
      
      setAllBlogs(prevBlogs => removeBlogFromList(prevBlogs));
      setUserBlogs(prevBlogs => removeBlogFromList(prevBlogs));
      
      alert('Blog deleted successfully!');
    } catch (error) {
      console.error('Error deleting blog - Full Error:', error);
      
      // More detailed error handling
      const errorMessage = error.response?.data?.message || 
        error.response?.data?.details || 
        error.message ||
        'Failed to delete blog';
      
      setError(errorMessage);
      alert(errorMessage);

      // Log additional details for debugging
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Response Data:', error.response.data);
        console.error('Response Status:', error.response.status);
        console.error('Response Headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request Data:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error Message:', error.message);
      }
    }
  };

  const handleBlogNavigation = (blogUrl) => {
    // Ensure the URL starts with http:// or https://
    const formattedUrl = blogUrl.startsWith('http://') || blogUrl.startsWith('https://') 
      ? blogUrl 
      : `https://${blogUrl}`;
    
    // Open the URL in a new tab
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  // Render blogs based on active tab
  const renderBlogs = () => {
    // Determine which blogs to render based on active tab
    const blogsToRender = activeTab === 'all' 
      ? allBlogs 
      : userBlogs;

    // Show message if no blogs in My Blogs section
    if (activeTab === 'my' && blogsToRender.length === 0) {
      return <p className="no-blogs-message">No blogs created yet</p>;
    }

    return blogsToRender.map(blog => (
      <div
        key={blog._id}
        className="blog-card"
        onClick={() => handleBlogNavigation(blog.blogUrl)}
      >
        <img src={blog.imageUrl} alt={blog.name} className="blog-thumbnail" />
        <div className="blog-details">
          <h3>{blog.name}</h3>
          <p>{blog.description}</p>
          <div className="blog-meta">
            <span>
              {blog.userId === userInfo?.id 
                ? 'Your Blog' 
                : 'Another User\'s Blog'}
            </span>
            {blog.userId === userInfo?.id && (
              <div 
                className="blog-actions" 
                onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking action buttons
              >
                <button 
                  className="edit-btn" 
                  onClick={() => openEditModal(blog)}
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDeleteBlog(blog._id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="home-container">
      <Header />

      <main className="main-content">
        {/* Create Blog Modal */}
        {showCreateModal && (
          <div className="create-blog-modal">
            <div className="modal-content">
              <button 
                className="close-modal" 
                onClick={() => setShowCreateModal(false)}
              >
                <FaTimes />
              </button>

              <h2>Create New Blog</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleCreateBlog} className="create-blog-form">
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
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Upload Image</label>
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

        {/* Edit Blog Modal */}
        {showEditModal && (
          <div className="create-blog-modal">
            <div className="modal-content">
              <button 
                className="close-modal" 
                onClick={() => setShowEditModal(false)}
              >
                <FaTimes />
              </button>

              <h2>Edit Blog</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleEditBlog} className="create-blog-form">
                <div className="form-group">
                  <label>Blog Title</label>
                  <input
                    type="text"
                    value={currentBlog.name}
                    onChange={(e) => setCurrentBlog({ ...currentBlog, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={currentBlog.description}
                    onChange={(e) => setCurrentBlog({ ...currentBlog, description: e.target.value })}
                    placeholder="Write a brief description of your blog..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Blog URL</label>
                  <input
                    type="url"
                    value={currentBlog.blogUrl}
                    onChange={(e) => setCurrentBlog({ ...currentBlog, blogUrl: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPreviewImage(reader.result);
                        setCurrentBlog({ ...currentBlog, imageUrl: file });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {previewImage && (
                    <div className="image-preview">
                      <img src={previewImage} alt="Preview" />
                    </div>
                  )}
                </div>
                <button type="submit" className="submit-blog-btn">
                  Update Blog
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Welcome to Blockify</h1>
            <p>Share your thoughts, stories, and ideas with the world</p>
            {userInfo && (
              <button 
                className="create-blog-btn" 
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus /> Create New Blog
              </button>
            )}
          </div>
        </div>

        <section className="recent-blogs">
          <h2 className="section-title">Blogs</h2>
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
          <div className="blogs-grid">
            {renderBlogs()}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;