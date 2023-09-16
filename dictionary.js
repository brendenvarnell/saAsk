// Packages
const mongoose = require('mongoose');

// KEYS & MODELS
const { Entry } = require('../models/entries');
const { User } = require('../models/users');
const { partsOfSpeechKey,
  recognizedPartsOfSpeechArray,
  recognizedLanguageArray,
  languagesISO3ConversionObject } = require("../middleware/keys.js");


// MIDDLEWARE
const Sanitize = require('../utils/Sanitize');
const ErrorHandler = (req, error, message, res) => {
  if (process.NODE_ENV === 'development') {
    console.log("error", error)
  };
  req.flash("error", message)
  return res.redirect("/d/")
};



// Interface
module.exports.io = async (req, res) => {
  const { q } = Sanitize(req.query);

  if (!q) {
    return res.render('dictionary/_io', {
      title: `dictionary.io`,
      searchParams: {},
      keys: {},
      q,
      entries: [],
    });
  }

  // Language delimiter "@" e.g. @french
  const parameters = q.split("@");
  const query = parameters[0].trim();

  // simply regex to return any entries containing exact string as substring
  const databaseSearchParams = {
    index: {$regex: "(^|\\s)" + query + "($|\\s)", $options: "i"},
  };

  const entries = await Entry.find(databaseSearchParams);


  return res.render('dictionary/_io', {
    title: `dictionary.io`,
    searchParams: {
      query,
    },
    q,
    entries,
  });
};

// API new http route
module.exports.search_io = async (req, res) => {
  const { q } = Sanitize(req.query);

  try {

    if (!q) throw new Error('no query');

    // Language delimiter "@" e.g. @french
    const parameters = q.split("@");
    const query = parameters[0].trim();

    // simply regex to return any entries containing exact string as substring
    const databaseSearchParams = {
      header: {$regex: "(^|\\s)" + query + "($|\\s)", $options: "i"},
      [parameters.length > 1 ? 'language' : null]: parameters[1]
    };

    const entries = await Entry.find(databaseSearchParams);

    res.status(200).json({ success: true, message: 'Resource', entries  });


  } catch (error) {

    if (error === 'no query') res.status(400).json({ success: false, message: 'Resource undefined', entries  });
  }
};


// NODES
module.exports.get_node = async (req, res) => {
  try {
    const searchParams = {};
    const response = {};
    const q = '';
    return res.render('dictionary/node',
      {
        title: 'new translation',
        searchParams,
        q
      });

  } catch (error) {
    console.error(error)
    req.flash("error", "Something went wrong.")
    res.redirect(`/d/`)

  }


};
module.exports.get_definition = async (req, res) => {
  const { id: definitionNode } = Sanitize(req.params);
  const { q } = Sanitize(req.query);

  const entries = await Entry.find({ definitionNode });
  const author = await User.findById(entries[0].author);
  const notes = [];
  const translations = [];


  return res.render('dictionary/definition', {
    title: `node page`, q, definitionNode, entries, author, notes, translations
  })
};
module.exports.post_definition = async (req, res) => {
  const { entrySubmission, mirrorSubmission } = Sanitize(req.body.data);

  let session;

  try {
    // Start a new mongoose session
    session = await mongoose.startSession()
    session.startTransaction();

    if (!entrySubmission) throw new Error("Blank data submission");
    if (!entrySubmission.includes("@")) throw new Error("Blank entry language submission");
    if (mirrorSubmission && !mirrorSubmission.includes("@")) {
      throw new Error("Blank mirror language submission")
    };

    let entryData, mirrorData;

    if (entrySubmission) entryData = {
      index: entrySubmission.split("@")[0].trim(),
      language: entrySubmission.split("@")[1].trim()
    };

    if (mirrorSubmission) mirrorData = {
      index: mirrorSubmission.split("@")[0].trim(),
      language: mirrorSubmission.split("@")[1].trim()
    };

    if (entryData && mirrorData) {
      entryData.mirror = mirrorData.index;
      entryData.mirrorLanguage = mirrorData.language
      mirrorData.mirror = entryData.index;
      mirrorData.mirrorLanguage = entryData.language;
    };

    // User Confirmation & handling
    const user = await User.findById(req.user._id);
    if (!user) throw new Error("No User Found");

    let entry, mirror, definitionNode, origin;

    entry = await Entry.findOne(entryData);

    if (entry) {
      origin = 'tenured';
      definitionNode = entry.definitionNode
    };

    if (!entry) {
      definitionNode = new mongoose.Types.ObjectId();

      entryData.author = user._id;
      entryData.definitionNode = definitionNode;

      mirrorData.author = user._id;
      mirrorData.definitionNode = definitionNode;

      entry = new Entry(entryData);
      mirror = new Entry(mirrorData);

      await entry.save({ session });
      await mirror.save({ session });

      origin = 'new';
    };

    console.log("here")


    await session.commitTransaction();

    if (origin === 'tenured') req.flash('success', "Node already exists")
    if (origin === 'new') req.flash('success', "Node made")
    return res.status(200).json({ entry, mirror, definitionNode });


  } catch (error) {

    console.error(error);

    if (session) {
      await session.abortTransaction();
    }

    // Check for ValidationError from Mongoose
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }

    // Custom application error types
    return res.status(500).json({ error: error.message });

  } finally {

    session.endSession();

  }

};
module.exports.delete_definition = async (req, res) => {
  const { id } = Sanitize(req.params);


  let session;

  try {
    // Start a new session and transaction
    session = await mongoose.startSession();
    session.startTransaction();

    const { definitionNode } = await Entry.findById(id);

    // Deletes the entry
    await Entry.deleteMany({definitionNode})
      .session(session)

    // Commit the transaction
    await session.commitTransaction();

    req.flash("success", "Entry deleted.")
    return res.redirect('/d/')
    // res.status(200).json({ success: true, message: 'Resource deleted' });

  } catch (error) {
    // Abort the transaction in case of errors
    console.error(error)
    await session.abortTransaction();
    ErrorHandler(req, error, 'Definition unsuccessfully deleted', res);
  } finally {
    // End the session whether success or failure
    session.endSession();
  }
};

// Usage Notes
module.exports.post_notes = async (req, res) => {
  const { notes } = Sanitize(req.body);
  return res.json(notes)
};


// Translations
module.exports.post_translation = async (req, res) => {
  
  const { translation } = Sanitize(req.body);
  return res.json(translation)
};