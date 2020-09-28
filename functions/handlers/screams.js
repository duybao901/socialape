const { db } = require('../util/admin')

// fetch all scream
module.exports.getAllScreams = (req, res) => {
    db.collection('screams').get()
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
}

// Post a scream
module.exports.postOneScream = (req, res) => {
    if (req.method !== "POST") {
        return res.status(400).json({ err: `Method not alow` })
    }
    const newScreams = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString(),
    };

    db.collection('screams')
        .add(newScreams)
        .then(doc => {
            res.json({ message: `document ${doc.id} created successfully` })
        })
        .catch(err => {
            return res.status(400).json({ err: `something error ` })
        })
}

// fetch a scream 
module.exports.getScream = (req, res) => {
    let screamData = {};

    db.doc(`/screams/${req.params.screamId}`).get()
        .then((doc) => {
            if (!doc.exists) {
                res.status(404).json({ err: "scream not found" })
            }
            screamData = doc.data();
            // doc.id -> scream id
            screamData.screamId = doc.id;
            return db.collection('comments')
                // .orderBy('createdAt','desc') Muốn sủ dụng hàm này thì cần phải tạo index
                .where("screamId", "==", req.params.screamId).get()
        })
        .then((data) => {
            screamData.comments = [];
            data.forEach(doc => {
                screamData.comments.push(doc.data());
            })
            res.json(screamData);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ err: err.code })
        })
}

// Post a comments
module.exports.commentOnScream = (req, res) => {
    // Validate body
    if (req.body.body.trim() === '') return res.status(404).json({ message: 'Body not empty' });

    let newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        userHandler: req.user.handle,
        userImage: req.user.imageUrl,
        screamId: req.params.screamId
    }

    db.doc(`/screams/${req.params.screamId}`).get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(500).json({err: 'Screams Not found'})
            }
            db.collection('comments').add(newComment);
        })
        .then(() => {
            res.json('Add comment successfully');
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({err: err.code})
        })
}