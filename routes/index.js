var express = require('express');
var router = express.Router();
const random = require('random');
let fs = require('fs'); 
let jwt = require('jsonwebtoken');
let bcrypt = require('bcryptjs');
let config = require('../config');
// let TokenValidator = require('./tokenvalidator');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/addUser', (req, res) => {
  try {
    let input = req.body;
    let userArr = [];
    let userObj = {};
    userObj.name = input.firstName+ " " + input.lastName;
    userObj.customer = input.customer;
    userObj.username = input.username;
    userObj.email = input.email;
    userObj.isTrial = input.isTrial;
    userObj.roles = input.roles;
    userObj.id = random.int((min = 1), (max = 9999));
    userArr.push(userObj);
    fs.readFile('data.json', (err, data) => {
      if (err) {
        console.log(err);
      }
      else {
        let existingData = JSON.parse(data);
        let mergedArr = userArr.concat(existingData);
        fs.writeFileSync('data.json', JSON.stringify(mergedArr));
      }
    });

    res.status(200).send({"data":userObj});
  }
  catch(err) {
    console.log(err);
    res.status(500).send({"error": "Internal Server Error"});
  }
});

router.get('/viewUsers', (req, res) => {
  try {
    fs.readFile('data.json', (err, data) => {
      if (err) {
        console.log(err);
      }
      else {
        let json = JSON.parse(data);
        res.status(200).send({"userData":json});
      }
    });
  }
  catch(err) {
    console.log(err);
    res.status(500).send({"error": "Internal Server Error"});
  }
});

router.post('/updateUser/:id', (req, res) => {
    try {
      let userId = req.params.id;
      let incomingData = req.body;
      fs.readFile('data.json', (err, data) => {
        if (err) {
          console.log(err);
        }
        else {
          let json = JSON.parse(data);
          let filteredData = json.filter(user => user.id == userId);
          let dataToUpdate = filteredData[0];
          if (incomingData.firstName && incomingData.lastName) {
            let updatedName = incomingData.firstName + " " + incomingData.lastName;
            dataToUpdate.name = updatedName;
          }
          if (incomingData.email) {
            dataToUpdate.email = incomingData.email;
          }
          if (incomingData.roles) {
            dataToUpdate.roles = incomingData.roles;
          }
          if (incomingData.isTrial) {
            dataToUpdate.isTrial = incomingData.isTrial
          }
          if (incomingData.username) {
            dataToUpdate.username = incomingData.username;
          }
          if (incomingData.customer) {
            dataToUpdate.customer = incomingData.customer;
          }
          let index = json.findIndex(obj => obj.id === userId);
          json.splice(index, 1, dataToUpdate)
          fs.writeFileSync('data.json', JSON.stringify(json));
          res.status(200).send({"updatedData":dataToUpdate});
        }
      });
    }
    catch(err) {
      console.log(err);
      res.status(500).send({"error": "Internal Server Error"});
    }
});

router.delete('/deleteUser/:id', (req, res) => {
  try {
    let userId = req.params.id;
    fs.readFile('data.json', (err, data) => {
      if (err) {
        console.log(err);
      }
      else {
        let json = JSON.parse(data);
        let index = json.findIndex(obj => obj.id === parseInt(userId));
        let dataToDelete = json.filter(user => user.id == userId);
        if (index!= -1) {
          json.splice(index, 1);
          fs.writeFileSync('data.json', JSON.stringify(json));
          res.status(200).send({"deletedData":dataToDelete});
        }
        else {
          res.status(400).send({"Bad request":"Data Not Found"});
        }
      }
    });
  }
  catch(err) {
    console.log(err);
    res.status(500).send({"error": "Internal Server Error"});
  }
});

router.get('/login', async (req, res) => {
   try {
    let username = req.headers["username"];
    let password = '', jwttoken = ''
    if (req.headers["password"]) {
      password = req.headers["password"];
    }
    if (req.headers["token"]) {
      jwttoken = req.headers["token"];
    }
    // Validate user input
    if (!(username && (password || jwttoken))) {
      res.status(400).send("All input is required");
    }
    fs.readFile('login.json', async (err, data) => {
      if (err) {
        console.log(err);
      }
      else {
        let existingData = JSON.parse(data);
        const oldUser = existingData.filter(user => user.username == username);
        if (oldUser && oldUser.length > 0) {
          if (!(token.length > 0)) {
            return res.status(400).send({ auth: false, message: "User already exists, please provide the token" });
          }
          jwt.verify(jwttoken, config.secret, function(err, decoded) {
            if (err) {
              console.log(err);
              return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
            }
            res.status(200).send(decoded);
          });
        }
        else {
          //Encrypt user password
          if (!(password.length > 0)) {
            return res.status(400).send({ auth: false, message: "User doesn't exist, please provide a password" });
          }
          encryptedPassword = await bcrypt.hash(password, 10);
          // Create userLogin details
          const user = {
            username: username.toLowerCase(), // sanitize: convert email to lowercase
            password: encryptedPassword
          };
          
          // Create token
          const token = jwt.sign({ id: user.username }, config.secret, {
            expiresIn: 31556926 // expires in 24 hours
          })
          // save user token
          user.token = token;
          existingData.push(user);
          fs.writeFileSync('login.json', JSON.stringify(existingData));
          res.status(200).send({'token': token});
        }
      }
    });
    

    
   }
   catch(err) {
    console.log(err);
    // return next(err)
    res.status(500).send({"error": "Internal Server Error"});
   }
})


module.exports = router;
