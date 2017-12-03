$(function() {
  $("#filter").on("click", function() {
    var filter = $("#filter-select").val();
    var minimum = $("#filter-minimum").val();
    document.location = "http://localhost:8080/marketplace" + "?filters=" + filter + "&min=" + minimum;
  });
});
