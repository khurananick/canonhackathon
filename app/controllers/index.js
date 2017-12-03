module.exports = function(router) {
  var Helper = require('./helper.js');
  var fs = require('fs');

  router.get("/images/new", function(req,res) {
    req.DB.query("select id from images where metadata is null", function(error, rows) {
      var response = [];
      for(var key in rows) {
        response.push({ id: rows[key].id, path: "http://a64a62cd.ngrok.io/image/"+rows[key].id });
      }
      return res.send(response);
    });
  });

  router.get("/images/:id", function(req,res) {
    req.DB.query("select base64 from images where id = " + req.params.id, function(error, rows) {
      function decodeBase64Image(dataString) {
        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
          response = {};

        if (matches.length !== 3) {
          return new Error('Invalid input string');
        }

        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');

        return response;
      }
      var str = rows[0].base64.toString();
      var imageBuffer = decodeBase64Image(str);
      res.writeHead(200, {'Content-Type': 'image/jpg', 'Content-Disposition': 'attachment; filename=img.jpg' });
      res.end(imageBuffer.data, 'binary');
    });
  });

  router.post("/images/:id/update", function(req,res) {
    req.DB.query("update images set metadata='"+req.query.sessionadata+"' where id='"+req.params.id+"'", function(error, rows) {
      return res.send({ success: "IMAGE_METADATA_UPDATED_SUCCESSFULLY", asset_id: req.params.id });
    });
  });

  router.get("/", function(req,res) {
    return res.render("index", { title: 'Homepage', message: 'Homepage'});
  });

  router.get("/dashboard", function(req, res) {
    req.DB.query("select * from images", function(error, rows) {
      return res.render("Dashboard", { title: 'Dashboard', rows: rows });
    });
  });

  router.get("/marketplace", function(req, res) {
    return res.render("Marketplace", { title: 'Marketplace' });
  });

  router.get("/convert", function(req, res) {
    var fs = require('fs');
    var dir = "/Library/WebServer/Documents/canonhack/temp";
    var path;

    fs.readdirSync(dir).forEach(function(file) {
      if(file.match("JPG")) {
        var filepath = "/Library/WebServer/Documents/canonhack/temp/" + file;
        var bitmap = fs.readFileSync(filepath);
        var buffer = new Buffer(bitmap).toString('base64');
        req.DB.query("insert into images set base64='data:image/jpeg;base64,"+buffer+"'");
      }
    });

    res.send({ success: true });
  });
};
