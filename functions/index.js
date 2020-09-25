const admin = require('firebase-admin')
const functions = require('firebase-functions');
const express = require('express');

const app = express();
admin.initializeApp();

// Lấy tất cả dữ liệu từ database database
app.get('/screams', (req, res) => {
    admin.firestore().collection('screams').get()
        .then(data => {
            let screams = [];
            data.forEach(doc => {
                screams.push({
                    userId: doc.id,
                    ...doc.data() 
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
        createdAt: new Date().toISOString()
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

//*  https://baseurl.com/api/
exports.api = functions.https.onRequest(app);
// functions.https.onRequest sẽ bắt được sự kiện khi có request đến
// Tạo ra functions kết hợp vs express để tạo ra url như thế này https://baseurl.com/api/screams