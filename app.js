//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const e = require("express");
const _ = require('lodash')

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));


//GLOBAL

let day = date.getDate();

// MONGOOSE

mongoose.connect("mongodb://localhost:27017/toDoListDB", { useNewUrlParser: true});

const itemsSchema = new mongoose.Schema ({
    name: {
        type: String
    }
});

const Item = mongoose.model ("Item", itemsSchema);

const item1 = new Item ({
    name: 'Get up'
});

const item2 = new Item ({
    name: 'Cook'
});

const item3 = new Item ({
    name: 'Have breakfast'
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// GET REQUESTS

app.get("/", function(req, res) {

// let day = date.getDate();
    
    Item.find(function(err, foundItems) {
        if (err) {
            console.log(err);
        } else if (foundItems.length === 0) {
                Item.insertMany(defaultItems, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log('default items added to list successfuly');
            }
        });
        res.redirect('/');
        }
         else {
            res.render('list', {listTitle: day, newListItems: foundItems});
        }
    });
});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);
  
    List.findOne({name: customListName}, function(err, foundList){
      if (!err){
        if (!foundList){
          //Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);
        } else {
          //Show an existing list
  
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
      }
    });
});

// POST REQUESTS

app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item ({
        name: itemName
    });
    if (listName == day){
        item.save(); 
        res.redirect('/');  
    } else {
        List.findOne({name: listName}, function(err, foundList) {
            if (err) {
                console.log(err);
            } else {
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName)
            }
        });
    }
});

app.post("/delete", function(req, res) {
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;

    if (listName == day) {

        Item.findByIdAndRemove(checkedItemID, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log('checked item succesfully removed from root');
                res.redirect('/');
            }
    });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}},
            function(err, foundList) {
                if(!err) {
                    console.log('checked item succesfully removed from ' + listName);
                    res.redirect('/' + listName)
                } else {
                    console.log(err);
                }
            })
    }
});

app.listen(3000, function() {
    console.log("Server started on port '3000'");
});