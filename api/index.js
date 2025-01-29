const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const app = express();

// Ensure proper CORS and body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware for debugging
app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.path}`);
    console.log('Request Body:', req.body);
    console.log('Request Params:', req.params);
    next();
});

app.use('/uploads', express.static('uploads'));

const url = 'mongodb://localhost:27017/BlogApp';

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const mimeType = fileTypes.test(file.mimetype);
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extname) {
            return cb(null, true);
        }
        cb('Give proper files format to upload');
    }
});

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Blog Schema
const BlogSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    blogUrl: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Blog = mongoose.model('Blog', BlogSchema);

app.post('/register', async(req, res) => {
    const { username, password } = req.body;
    
    try {
        // Check if username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = new User({
            username,
            password: hashedPassword
        });
        
        await newUser.save();
        res.status(200).json({ message: 'Registration successful' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Registration failed' });
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Send user info (excluding password)
        res.json({
            id: user._id,
            username: user.username
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.post('/blogs/create', upload.single('image'), async (req, res) => {
    try {
        const { name, description, blogUrl, userId } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const imageUrl = `http://localhost:4000/uploads/${req.file.filename}`;

        const newBlog = new Blog({
            name,
            description,
            imageUrl,
            blogUrl,
            userId
        });

        await newBlog.save();
        res.status(201).json({ message: 'Blog created successfully', blog: newBlog });
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ message: 'Error creating blog' });
    }
});

app.get('/blogs/recent', async (req, res) => {
    try {
        const blogs = await Blog.find()
            .sort({ createdAt: -1 })
            .limit(6)
            .populate('userId', 'username');
            
        res.json(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Error fetching blogs' });
    }
});

app.get('/blogs/all', async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 }).populate('userId', 'username');
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    }
});

app.get('/blogs/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(401).json({ message: 'User ID is required' });
        }
        
        const blogs = await Blog.find({ userId }).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user blogs', error: error.message });
    }
});

// Update Blog Route
app.put('/blogs/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, blogUrl, userId } = req.body;
        
        console.log('Update Blog Request:', { 
            id, 
            name, 
            description, 
            blogUrl, 
            userId,
            file: req.file ? req.file.filename : 'No file'
        });
        
        // Validate input
        if (!name || !description) {
            console.error('Validation Error: Missing required fields');
            return res.status(400).json({ 
                message: 'Name and description are required',
                details: 'Please provide both name and description'
            });
        }
        
        // Find the existing blog
        const existingBlog = await Blog.findById(id);
        
        // Check if blog exists
        if (!existingBlog) {
            console.error('Blog not found:', id);
            return res.status(404).json({ 
                message: 'Blog not found', 
                details: `No blog exists with ID: ${id}` 
            });
        }
        
        // Check if user is authorized to update
        if (existingBlog.userId.toString() !== userId) {
            console.error('Unauthorized update attempt:', { 
                existingBlogUserId: existingBlog.userId, 
                requestUserId: userId 
            });
            return res.status(403).json({ 
                message: 'Not authorized to update this blog',
                details: 'You can only update your own blogs'
            });
        }
        
        // Update blog details
        existingBlog.name = name;
        existingBlog.description = description;
        existingBlog.blogUrl = blogUrl || existingBlog.blogUrl;
        
        // Update image if a new one is uploaded
        if (req.file) {
            existingBlog.imageUrl = `http://localhost:4000/uploads/${req.file.filename}`;
        }
        
        // Save updated blog
        const updatedBlog = await existingBlog.save();
        
        console.log('Blog updated successfully:', updatedBlog);
        res.json(updatedBlog);
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ 
            message: 'Failed to update blog', 
            error: error.message,
            details: error.toString(),
            stack: error.stack
        });
    }
});

// Delete Blog Route
app.delete('/blogs/:id', async (req, res) => {
    console.log('=== DELETE BLOG ROUTE CALLED ===');
    console.log('Full Request Details:', {
        method: req.method,
        path: req.path,
        params: req.params,
        body: req.body,
        headers: req.headers
    });

    try {
        const { id } = req.params;
        const { userId } = req.body;
        
        console.log('Delete Blog Request:', { 
            id, 
            userId 
        });
        
        // Validate input
        if (!id || !userId) {
            console.error('Validation Error: Missing required fields');
            return res.status(400).json({ 
                message: 'Blog ID and User ID are required',
                details: 'Please provide both blog ID and user ID'
            });
        }
        
        // Find the existing blog
        const existingBlog = await Blog.findById(id);
        
        // Check if blog exists
        if (!existingBlog) {
            console.error('Blog not found:', id);
            return res.status(404).json({ 
                message: 'Blog not found', 
                details: `No blog exists with ID: ${id}` 
            });
        }
        
        // Check if user is authorized to delete
        if (existingBlog.userId.toString() !== userId) {
            console.error('Unauthorized delete attempt:', { 
                existingBlogUserId: existingBlog.userId, 
                requestUserId: userId 
            });
            return res.status(403).json({ 
                message: 'Not authorized to delete this blog',
                details: 'You can only delete your own blogs'
            });
        }
        
        // Delete the blog
        const deletedBlog = await Blog.findByIdAndDelete(id);
        
        if (!deletedBlog) {
            console.error('Failed to delete blog:', id);
            return res.status(500).json({ 
                message: 'Failed to delete blog',
                details: `Unable to delete blog with ID: ${id}`
            });
        }
        
        console.log('Blog deleted successfully:', deletedBlog);
        res.status(200).json({ 
            message: 'Blog deleted successfully', 
            blogId: id 
        });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ 
            message: 'Failed to delete blog', 
            error: error.message,
            details: error.toString(),
            stack: error.stack
        });
    }
});

mongoose.connect(url)
    .then(() => {
        console.log("Connected To MongoDB");
        // Create uploads directory if it doesn't exist
        const fs = require('fs');
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }
        app.listen(4000, () => {
            console.log("Server is running on port 4000");
        });
    })
    .catch((err) => {
        console.log("Failed To Connect", err);
    });