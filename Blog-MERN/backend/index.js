const express = require('express')
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer  = require('multer')
const uploadMiddleware = multer({ dest: 'uploads/' })
const fs = require('fs');
const Post = require('./models/Post')


const salt = bcrypt.genSaltSync(10);
const secret ='askljhed12312asdf'
const app = express()


app.use(cors({credentials:true, origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'))


mongoose.connect('mongodb+srv://Blog-solo:ZUQ7k5YNI4wVlcjJ@cluster0.oilo4ej.mongodb.net/');


app.post('/register', async (req,res) => {
    const {username,password} = req.body;
    try{
      const userDoc = await User.create({
        username,
        password:bcrypt.hashSync(password,salt),
      });
      res.json(userDoc);
    }catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error registering user' });
    }
  });
  
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const userDoc = await User.findOne({ username });
      if (!userDoc) {
        return res.status(404).json({ error: 'User not found' });
      }
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        // logged in
        jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error creating JWT token' });
          }
          res.cookie('token', token).json({
            id: userDoc._id,
            username,
          });
        });
      } else {
        res.status(401).json({ error: 'Wrong credentials' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error during login' });
    }
  });
  
  app.get('/profile', (req,res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err,info) => {
      if (err) throw err;
      res.json(info);
    });
  });
  
  app.post('/logout', (req,res) => {
    res.cookie('token', '').json('ok');
  });
  
  app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
    
    try {
    const {originalname,path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);
  
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
      if (err) throw err;
      const {title,summary,content} = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover:newPath,
        author:info.id,
      });
      res.json(postDoc);
    })
  }catch(error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating post' });
  }
  });
  
  app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
    try {
      let newPath = null;
      if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
      }
  
      const { token } = req.cookies;
      jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { id, title, summary, content } = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
          return res.status(400).json('you are not the author');
        }
  
        postDoc.title = title;
        postDoc.summary = summary;
        postDoc.content = content;
        postDoc.cover = newPath ? newPath : postDoc.cover;
        await postDoc.save();
  
        res.json(postDoc);
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error updating post' });
    }
  });
  
  
  app.get('/post', async (req,res) => {
    try{
      res.json(
        await Post.find()
          .populate('author', ['username'])
          .sort({createdAt: -1})
          .limit(20)
      );
    }catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching posts' });
    }
  });
  
  app.get('/post/:id', async (req, res) => {
    try{
      const {id} = req.params;
      const postDoc = await Post.findById(id).populate('author', ['username']);
      res.json(postDoc);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching post by ID' });
    }
  });
  
app.listen(4000);
  