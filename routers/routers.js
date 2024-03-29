const router = require("express").Router();

const {
  getTopBooks,
  getById,
  getByCategory,
  categoryList,
  getFullOverview,
} = require("../controllers/controllers");

router.get("/full-overview", getFullOverview);
router.get("/category-list", categoryList);
router.get("/top-books", getTopBooks);
router.get("/category", getByCategory);
router.get("/:id", getById);
 
module.exports = router;
