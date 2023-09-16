// PACKAGES
const express = require("express");
const catchAsync = require("../utils/catchAsync");
const dictionary = require("../controllers/dictionary");
const router = express.Router();

// KEYS & MODELS
const { isLoggedIn, isAdmin } = require("../middleware/middleware");


// DICTIONARY I/O DISPLAY PAGES 
router.get("/", catchAsync(dictionary.io))

router.get("/search", catchAsync(dictionary.search_io))

router.route("/node")
  .get(catchAsync(dictionary.get_node))
  
router.route("/d-:id")
  .get(catchAsync(dictionary.get_definition))
  .post(catchAsync(dictionary.post_definition))
  .delete(catchAsync(dictionary.delete_definition))

router.route("/u-:id")
  .post(catchAsync(dictionary.post_notes))

router.route("/t-:id")
  .post(catchAsync(dictionary.post_translation))



module.exports = router;