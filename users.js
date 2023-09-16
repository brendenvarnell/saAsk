// const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLM = require('passport-local-mongoose');

const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username cannot be blank'],
    },
    email: {
        type: String,
        required: [true, 'Email Cannot Be Blank'],
        match: [/.+\@.+\..+/, 'Please enter a valid email address']
    },
    joined: Date,
    country: String,
    native: String,
    roles: {
        type: String,
        required: true,
        enum: ['user', 'editor', 'admin'],
        default: 'user',
    },
    verified: {
        type: Boolean,
        default: false,
    },
    verified_date: Date,
    password_token: {
        type: String,
        required: true,
    },
    accessRatio: { type: Number, default: 0 },
});

UserSchema.plugin(passportLM);


UserSchema.virtual('tenure').get(function() {
    const oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
    const joinedDate = new Date(this.joined);
    const today = new Date();
  
    return Math.round(Math.abs((joinedDate - today) / oneDay));
});
  

UserSchema.index({ username: 1, email: 1 });


const User = mongoose.model('User', UserSchema);
module.exports = { User };