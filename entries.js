const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { recognizedLanguageArray } = require('../middleware/keys');

const EntrySchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    index: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true,
        enum: recognizedLanguageArray,
    },
    mirror: {
        type: String,
        required: true,
    },
    mirrorLanguage: {
        type: String,
        required: true,
        enum: recognizedLanguageArray,
    },
    definitionNode: {
        type: Schema.Types.ObjectId,
        required: true,
    }
}, { timestamps: true });

EntrySchema.index({ index: 1, language: 1 });


const Entry = mongoose.model('Entry', EntrySchema);

module.exports = { Entry };