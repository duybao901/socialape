const { admin } = require('../util/admin');
const firebase = require('firebase');
const firebaseConfig = require('../util/config')
firebase.initializeApp(firebaseConfig);
const { validateSignupData, validateLoginData } = require('../util/validator')

module.exports.signUp = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    }

    const { valid, errors } = validateSignupData(newUser);
    if (!valid) {
        return res.status(400).json(errors)
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
                handle: newUser.handle,
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
}

module.exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    const { valid, errors } = validateLoginData(user);
    if (!valid) {
        return res.status(400).json(errors)
    }

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({ token })
        })
        .catch(err => {
            if (err.code = "auth/wrong-password") {
                return res.status(500).json({ general: "Wrong credential, please try again" })
            } else {
                return res.status(500).json({ err: err.code })
            }
        })

}