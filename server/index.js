/**
 * Created by Vadym Yatsyuk on 11/06/16
 */

var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var PORT = process.env.PORT || 8888;

mongoose.connect('mongodb://' + process.env.MONGODB);

var Mark = mongoose.model('Mark', {
  text: String,
  xPath: String,
  site: String
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.end();
});

app.get('/sites/:site/marks', (req, res) => {
  Mark.find({ site: req.params.site}, (err, marks) => {
    if (err) {
      return res.statusCode(400)
        .end();
    }

    res.send(marks);
  });
});

app.post('/sites/:site/marks', (req, res) => {
  (new Mark({ site: req.params.site, text: req.body.text, xPath: req.body.xPath })).save((err, mark) => {
    if (err) {
      return res.statusCode(400)
        .end();
    }
    
    res.send(mark);
  });
});

app.listen(PORT, () => {
  console.log('Server started');
});