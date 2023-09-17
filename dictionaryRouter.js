// PACKAGES
const express = require("express");
const dictionary = require("../controllers/dictionary");
const router = express.Router();

// KEYS & MODELS
const { isLoggedIn, isAdmin } = require("../middleware/middleware");


// DICTIONARY I/O DISPLAY PAGES 
router.get("/", dictionary.io)

router.get("/search", dictionary.search_io)

router.route("/node")
  .get(dictionary.get_node)
  
router.route("/d-:id")
  .get(dictionary.get_definition)
  .post(dictionary.post_definition)
  .delete(dictionary.delete_definition)


router.route("/t-:id")
  .post(dictionary.post_translation)



module.exports = router;