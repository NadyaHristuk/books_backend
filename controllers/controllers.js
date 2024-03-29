const axios = require("axios");
const Book = require("../models/books");

const url =
  "https://api.nytimes.com/svc/books/v3/lists/full-overview.json?api-key=UQBsPtGUcT967keuC3CHtc8j9QJKiYCJ";

const today = new Date().toString().slice(0, 15);

const getFullOverview = async () => {
  const data = await axios.get(url);
  const existingBooks = await Book.find({});
  data.data.results.lists.map(async (list) => {
    const list_name = list.list_name;

    for (const item of list.books) {
      const existingBook = existingBooks.find(
        (book) => book.title === item.title && book.list_name === list_name
      );

      if (existingBook) {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        await Book.updateOne({title: item.title}, {date: Date.now()});
      }

      if (!existingBook) {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        await Book.create({ ...item, list_name });
      }
    }
  });
  // Delete books that are not in the new collection
  await Book.deleteMany({
    title: {
      $nin: data.data.results.lists.flatMap((list) =>
        list.books.map((book) => book.title)
      ),
    },
  });

};

const categoryList = async (req, res) => {
  const oneBook = await Book.find().limit(1);
  if (!oneBook) {
    return res.status(400).json({
      success: false,
      message: "No data in BD",
    });
  }
  const bookDate = new Date(oneBook[0]?.date).toString().slice(0, 15);
  if (bookDate !== today) {
    await getFullOverview();
  }
  const result = await Book.aggregate([
    {
      $group: {
        _id: "$list_name",
      },
    },
    {
      $project: {
        _id: 0,
        list_name: "$_id",
      },
    },
  ]);
  if (!result) {
    return res.status(400).json({
      success: false,
      message: "Not found category list",
    });
  }
  res.send(result);
};

const getTopBooks = async (req, res) => {
  const oneBook = await Book.find().limit(1);
  if (!oneBook) {
    return res.status(400).json({
      success: false,
      message: "No data in BD",
    });
  }
  const bookDate = new Date(oneBook[0].date).toString().slice(0, 15);
  if (bookDate !== today) {
    await getFullOverview();
  }
  const result = await Book.aggregate([
    {
      $group: {
        _id: "$list_name",
        books: {
          $push: "$$ROOT",
        },
      },
    },
    {
      $project: {
        _id: 0,
        list_name: "$_id",
        books: {
          $slice: ["$books", 0, 5],
        },
      },
    },
    { $sort: { list_name: 1 } },
  ]);
  if (!result) {
    return res.status(500).json({
      success: false,
      message: "Not found list of top books",
    });
  }
  res.send(result);
};

const getById = async (req, res) => {
  const oneBook = await Book.find().limit(1);
  if (!oneBook) {
    return res.status(400).json({
      success: false,
      message: "No data in BD",
    });
  }
  const bookDate = new Date(oneBook[0].date).toString().slice(0, 15);
  if (bookDate !== today) {
    await getFullOverview();
  }
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "id not sent",
    });
  }
  const result = await Book.findById(id);
  if (!result) {
    return res.status(400).json({
      success: false,
      message: "Not found book with this ID",
    });
  }
  res.send(result);
};

const getByCategory = async (req, res) => {
  const oneBook = await Book.find().limit(1);
  if (!oneBook) {
    return res.status(400).json({
      success: false,
      message: "No data in BD",
    });
  }
  const bookDate = new Date(oneBook[0].date).toString().slice(0, 15);
  if (bookDate !== today) {
    await getFullOverview();
  }
  const category = req.query.category;
  if (!category) {
    return res.status(400).json({
      success: false,
      message: "category not sent",
    });
  }
  const result = await Book.find({ list_name: category }).limit(20);
  if (!result) {
    return res.status(400).json({
      success: false,
      message: `Not found books with category ${category}`,
    });
  }
  res.send(result);
};

module.exports = {
  categoryList,
  getFullOverview,
  getTopBooks,
  getById,
  getByCategory,
};
