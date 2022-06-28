const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
// main().catch(err => console.log(err));

const itemSchema = {
  name: String,
};
const Item = new mongoose.model("Item", itemSchema);

// mongoose.connection.close();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

var items = [
  new Item({
    name: "Buy Grocery",
  }),
  new Item({
    name: "Get Car serviced",
  }),
  new Item({
    name: "Read Novel",
  }),
];

function titleCase(str) {
  var splitStr = str.toLowerCase().split(" ");
  for (var i = 0; i < splitStr.length; i++) {
    // You do not need to check if i is larger than splitStr length, as your for does that for you
    // Assign it back to the array
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
  return splitStr.join(" ");
}

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = new mongoose.model("List", listSchema);

const uri = `mongodb+srv://${encodeURIComponent(
  process.env.USER
)}:${encodeURIComponent(
  process.env.PASSWORD
)}@cluster0.udnu6.mongodb.net/?retryWrites=true&w=majority`;

mongoose.connect(uri, { useNewUrlParser: true }, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Successfully connected to mongodb");

    app.get("/", (req, res) => {
      Item.find((err, result) => {
        if (result.length === 0) {
          Item.insertMany(items, (err) => {
            if (err) console.log(err);
            else console.log("Items pushed successfully");
          });
          res.redirect("/");
        } else {
          res.render("list", { title: "Today", items: result });
        }
      });
    });

    app.get("/:customUrl", (req, res) => {
      // console.log(titleCase(req.params.customUrl));
      List.findOne({ name: titleCase(req.params.customUrl) }, (err, result) => {
        if (err) console.log(err);
        else {
          if (!result) {
            const list = new List({
              name: titleCase(req.params.customUrl),
              items: items,
            });
            list.save();
            res.redirect("/" + titleCase(req.params.customUrl));
          } else {
            // console.log("Exists");
            res.render("list", { title: result.name, items: result.items });
            // console.log("DN Exists");
          }
        }
      });
    });
  }
});

app.post("/", (req, res) => {
  const newItem = req.body.todoItem;
  const title = req.body.listTitle;
  const item = new Item({
    name: newItem,
  });
  if (title === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: title }, (err, result) => {
      result.items.push(item);
      result.save();
      res.redirect("/" + title);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) console.log(err);
      else res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, result) => {
        if (err) console.log(err);
        else {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(process.env.port||3000, () => {
  console.log("Server is running");
});
