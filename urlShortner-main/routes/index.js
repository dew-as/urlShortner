var express = require('express');
var router = express.Router();
const User = require('../models/userModel')
const Url = require('../models/urlModel')
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const shortid = require('shortid')


router.get('/signup', async (req, res) => {
  res.render('signup', { message: [] });
});

router.post('/signup', async (req, res) => {
  try {
    const user = new User(req.body)
    await user.save()
    res.render('login', { message: [] })
  } catch (err) {
    if (err.code === 11000 || err.code === 11001) {
      res.render('signup', { message: 'Email already exists' });
    } else if (err.name === 'ValidationError') {
      res.render('signup', { message: err.message });
    } else {
      res.render('signup', { message: 'Internal Server Error' });
    }
  }
});

router.get('/login', async (req, res) => {
  try {
    const message = req.query.message || '';
    res.render('login', { message });
  } catch (error) {
    console.log(error);
  }
  
});

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (user) {
      const isValidPass = await bcrypt.compare(req.body.password, user.password)
      if (isValidPass) {
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET = generateSecretKey(), { expiresIn: '1h' });
        req.session.token = token;
        req.session.user_email = user.email;
        res.redirect('/api/list')
      } else {
        res.render('login', { message: 'Invalid Password !' });
      }
    } else {
      res.render('login', { message: 'User Not Found !' });
    }
  } catch (err) {
    res.render('login', { message: 'Internal Server Error !' });
  }
});

router.get('/list',verifyToken, async (req, res) => {
  const { page = 1, limit = 1 } = req.query;
  const email = req.session.user_email;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    projection: { __v: 0 }
  };

  try {
    const message = req.query.message || '';
    const result = await Url.paginate({email}, options);
    res.render('list', { objects: result.docs, pagination: result, message:{user:req.session.user_email} });
    res.locals.message = '';
  } catch (error) {
    console.error(error);
    res.render('list', { objects: [], pagination: [], message: 'Internal Server Error' });
  }
});

router.get('/urlAdd', verifyToken, async (req, res) => {
  res.render('urlAdd', { message: [], update: false })
})

router.post('/urlAdd', verifyToken, async (req, res) => {
  try {
    const email = req.session.user_email
    const dataCount = await Url.find({email}).countDocuments()
    if (dataCount >= 5) {
      return res.render('urlAdd', { message: 'Maximum 5 Url Allowed , Limit Reached', update: false })
    }
    const { url, title, submittedAt } = req.body;
    const data = new Url({
      email:email,
      url,
      title,
      shortUrl: generateShortUrl(),
      submittedAt
    });
    await data.save()
    res.redirect('/api/list')
  } catch (err) {
    res.render('urlAdd', { message: err.message, update: false })
  }
})

router.get('/urlUpdate/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id
    if (!id) {
      return res.status(400).send({ message: 'ID is required' });
    }
    const url = await Url.findById(id)
    console.log(url)
    if (!url) {
      res.render('urlAdd', { data: [], update: true, message: 'Url Not Fount' })
    }
    res.render('urlAdd', { data: url, update: true, message: [] })
  } catch (err) {
    res.render('urlAdd', { data: [], update: true, message: 'Internal server error' })
  }
})

router.post('/urlUpdate/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Url.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.redirect('/api/urlAdd?message=Cannot find URL')
    }
    res.redirect(`/api/list?message=${encodeURIComponent(`${updated.title} Successfully Updated`)}`);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.get('/urlDelete/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id
    const urlDelete = await Url.findByIdAndDelete(id)
    if (!urlDelete) {
      res.redirect('/api/list?message=Cannot find URL')
    }
    res.redirect(`/api/list?message=${encodeURIComponent(`${urlDelete.title} Successfully Deleted`)}`);
  } catch (error) {
    console.log('Internal server error', error);
    res.redirect('/api/list?message=Error deleting URL');
  }
});

router.get('/search', verifyToken, async (req, res) => {
  try {
    const query = req.query.query;
    const email = req.session.user_email
    if (!query) {
      res.status(400).json({ error: 'Query parameter is required' });
    }
    const results = await Url.find({
      email:email,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { url: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/shortUrl/:url', verifyToken, async (req, res) => {
  try {
    const shortUrl = req.params.url
    const url = await Url.findOne({ shortUrl })
    if (!url) {
      res.redirect(404, '/api/list?message=Cannot find URL')
    } else {
      res.redirect(url.url)
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})


router.get('/logout', async (req, res) => {
  // try {
  //   // Remove token from client-side
  //   res.clearCookie('token');
  //   res.header('Authorization', '');

  //   // Invalidate token on server-side
  //   req.userId = null;

  //   res.redirect('/api/login');
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ message: 'Internal Server Error' });
  // }
  req.session.destroy((err) =>{
    if (err){
      console.log(err);
      res.send('Error')
    }else{
      res.redirect('/api/login')
    }
  });
});


const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateShortUrl = () => {
  return shortid.generate()
}

// for verifying token for protected route


function verifyToken(req, res, next) {
  // const token = req.headers.authorization

  // if (!token) {
  //   return res.status(401).json({ message: 'Unauthorized - Missing token' });
  // }

  // jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
  //   if (err) {
  //     return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  //   }

  //   req.userId = decoded.userId;
  //   next();
  // });
  if (req.session && req.session.token) {
    jwt.verify(req.session.token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: 'Unauthorized - Invalid token' });
        }})
    // User is authenticated, proceed to the next middleware
    return next();
  }

  // User is not authenticated, redirect to the login page
  res.redirect('/api/login?message=You are not authoriced !')
};

module.exports = router;
