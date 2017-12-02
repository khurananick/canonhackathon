module.exports = function(router) {
  var Helper = require('./helper.js');
  var fs = require('fs');

  router.get("/images/new", function(req,res) {
    return res.send([
      { id: 1, asset_url: "https://www.s3.com/path/to/image" },
      { id: 2, asset_url: "https://www.s3.com/path/to/image/2" }
    ]);
  });

  router.post("/images/:id/update", function(req,res) {
    return res.send({ success: "IMAGE_METADATA_UPDATED_SUCCESSFULLY", asset_id: req.query.id });
  });

  router.get("/", function(req,res) {
    return res.render("index", { title: 'Homepage', message: 'Homepage'});
  });

  router.get("/dashboard", function(req, res) {
    req.DB.query("select * from images", function(error, rows) {
      console.log(error);
      return res.render("Dashboard", { title: 'Dashboard', rows: rows });
    });
  });

  router.get("/marketplace", function(req, res) {
    return res.render("Marketplace", { title: 'Marketplace' });
  });
};
