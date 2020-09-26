const app = require('express')();
const admin = require('firebase-admin')
const functions = require('firebase-functions');
const firebase = require('firebase');
const { exampleIssue } = require('firebase-functions-test/lib/providers/crashlytics');

// admin setup
admin.initializeApp();

// firebase setup
var firebaseConfig = {
   apiKey: "AIzaSyD8yETMJlKQTU5bI54ZTL7ZmEBIyB0HY7U",
   authDomain: "socialape-341fa.firebaseapp.com",
   databaseURL: "https://socialape-341fa.firebaseio.com",
   projectId: "socialape-341fa",
   storageBucket: "socialape-341fa.appspot.com",
   messagingSenderId: "330116703472",
   appId: "1:330116703472:web:5095bbf252d8b1e92ece35",
   measurementId: "G-BWDG94FLCZ"
};
firebase.initializeApp(firebaseConfig);


// Lấy tất cả dữ liệu từ database database
app.get('/screams', (req, res) => {
   admin.firestore().collection('screams').get()
      .orderBy('createdAt')
      .then(data => {
         let screams = [];
         data.forEach(doc => {
            screams.push({
               screams: doc.id,
               body: doc.data().body,
               userHandle: doc.data().userHandle,
               createdAt: doc.data().createdAt,
               likeCount: doc.data().likeCount,
               commentCount: doc.data().commentCount,
            });
         })
         return res.json(screams);
      })
      .catch(err => {
         console.log(err);
      })
})

// Tạo dữ liệu gửi lên database
app.post('/screams', (req, res) => {
   if (req.method !== "POST") {
      return res.status(400).json({ err: `Method not alow` })
   }
   const newScreams = {
      body: req.body.body,
      userHandle: req.body.userHandle,
      createdAt: new Date().toISOString(),
   };

   admin.firestore().collection('screams')
      .add(newScreams)
      .then(doc => {
         res.json({ message: `document ${doc.id} created successfully` })
      })
      .catch(err => {
         return res.status(400).json({ err: `something error ` })
      })
})

const idEmail = (email) => {
   const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
   if (email.match(regex)) {
      return true;
   } else {
      return false;
   }
}

const isEmpty = (string) => {
   if (string.trim() === '') {
      return true;
   } else {
      return false;
   }
}

// Signup Route
app.post('/signup', (req, res) => {
   const newUser = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      handle: req.body.handle
   }

   let errors = {};
   if (isEmpty(newUser.email)) {
      errors.email = 'Email must not be empty';
   } else {
      if (isEmpty(newUser.email)) {
         errors.email = 'Email must be a email address';
      }
   }
   if (newUser.password === "") errors.password = 'Must not be empty';
   if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = "Password must match"
   if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty';
   if (Object.keys(errors).length > 0) {
      // 400 = bad request
      res.status(400).json(errors);
   }

   // TODO: vadidate Data
   // Doc(/users/${newUser.handle}) -> kiểm tra doc.exists -> chưa tồn tại -> 
   // Tạo user và lưu vào aithentication -> Trả về Promise  (data)  ->  // Trả về Promise (token) -> Lấy token là lưu vào collection: users của cloud store
   let token, userID;
   admin.firestore().doc(`/users/${newUser.handle}`).get()
      .then(doc => {
         if (doc.exists) {
            res.status(400).json({ handle: `this handle is already taken` })
         } else {
            // Tạo user và lưu vào aithentication
            return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password) // Trả về Promise  (data)                
         }
      })
      .then(data => {
         userID = data.user.uid;
         return data.user.getIdToken() // Trả về Promise (token)
      })
      .then(tokenId => {
         // Lấy token là lưu vào collection: users của cloud store
         token = tokenId;
         const userCredential = {
            email: newUser.email,
            passowrd: newUser.password,
            createdAt: new Date().toISOString(),
            userId: userID
         }
         admin.firestore().doc(`/users/${newUser.handle}`).set(userCredential) // Trả về 1 Promise   
      })
      .then(() => {
         return res.status(201).json({ token })
      })
      .catch(err => { // Bắt lỗi khi post lên user đã tồn tại
         console.log(err)
         if (err.code === "auth/email-already-in-use") {
            return res.status(500).json({ email: `Email is already used` })
         } else {
            return res.status(500).json({ err: err.code })
         }
      })
})

//*  https://baseurl.com/api/
// functions.https.onRequest sẽ bắt được sự kiện khi có request đến
// Tạo ra functions kết hợp vs express để tạo ra url như thế này https://baseurl.com/api/screams
exports.api = functions.https.onRequest(app);