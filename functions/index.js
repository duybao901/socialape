const admin = require('firebase-admin')
const functions = require('firebase-functions');
const express = require('express');

const app = exports();
admin.initializeApp();

// Lấy tất cả dữ liệu từ database database
app.get('/screams', (req, res) => {
    admin.firestore().collection('screams').get()
        .then(data => {
            let screams = [];
            data.forEach(doc => {
                screams.push(doc.data());
            })
            return res.json(screams);
        })
        .catch(err => {
            console.log(err);
        })
})



// Tạo dữ liệu gửi lên database
exports.createScreams = functions.https.onRequest((req, res) => {
    if (req.method !== "POST") {
        return res.status(400).json({ err: `Method not alow` })
    }
    const newScreams = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
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

//*  https://baseurl/api/
exports.api = functions.https.onRequest(app);