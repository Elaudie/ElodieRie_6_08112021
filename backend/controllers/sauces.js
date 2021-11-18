const Thing = require('../models/sauces');
const fs = require('fs');

exports.createThing = (req, res, next) => {
    console.log(req.body)
    const thingObject = JSON.parse(req.body.sauce);
    delete thingObject._id;
    const thing = new Thing({
        ...thingObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    thing.save()
      .then(() => res.status(201).json({message: 'Objet enregistré !'}))
      .catch(error => res.status(400).json({ error }));
};

exports.modifyThing = (req, res, next) => {
    const thingObject = req.file ?
        {
          ...JSON.parse(req.body.thing),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`  
         } : { ...req.body };
    Thing.updateOne({ _id: req.params.id }, { ...thingObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Objet modifié !' }))
        .catch(error => res.status(400).json({ error }))
};

exports.deleteThing = (req, res, next) => {
    Thing.findOne({ _id: req.params.id })
        .then(thing => {
            const filename = thing.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Thing.deleteOne({ _id: req.params.id})
                    .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
                    .catch(error => res.status(400).json({ error }))
            })
        })
        .catch(error => res.status(500).json({ error }));
    
};

exports.getOneThing = (req, res, next) => {
    Thing.findOne({ _id: req.params.id })
        .then(thing => res.status(200).json(thing))
        .catch(error => res.status(404).json({ error }))
};

exports.getAllThing = (req, res, next) => {
    Thing.find()
        .then(things => res.status(200).json(things))
        .catch(error => res.status(400).json({ error }));
};

exports.likeOrDislikeSauce = (req, res, next) => {
    let like = req.body.like;
    let userId = req.body.userId
    let sauceId = req.params.id;

    switch (like) {
        case 1:
            Sauce.updateOne({ _id: sauceId }, { $push:{ usersLiked: userId }, $inc:{ likes: +1 } })
                .then(()=> res.status(200).json({ message: 'Like ajouté !'}))
                .catch(error => res.status(400).json({ error }))
            break;
        case -1:
            Sauce.updateOne({ _id: sauceId }, { $push:{ usersDisliked: userId }, $inc:{ dislikes: +1 } })
                .then(()=> res.status(200).json({ message: 'Dislike ajouté !'}))
                .catch(error => res.status(400).json({ error }))
            break;
        case 0:
            Sauce.findOne({ _id: sauceId })
                .then((sauce) => {
                    if (sauce.usersLiked.includes(userId)) {
                        Sauce.updateOne({ _id: sauceId }, { $pull:{ usersLiked: userId }, $inc:{ likes: -1 } })
                            .then(()=> res.status(200).json({ message: 'Like annulé !'}))
                            .catch(error => res.status(400).json({ error }));
                    }
                    if (sauce.usersDisliked.includes(userId)) {
                        Sauce.updateOne({ _id: sauceId }, { $pull:{ usersDisliked: userId }, $inc:{ dislikes: -1 } })
                            .then(()=> res.status(200).json({ message: 'Dislike annulé !'}))
                            .catch(error => res.status(400).json({ error }));
                    }
                })
                .catch(error => res.status(400).json({ error }))
            break;
        default: console.log(error);
    }
};