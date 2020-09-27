const {db} = require('../util/admin')
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