jQuery(document).ready(function() {

  getFbCount();
});

function getFbCount() {

  var url = "https://graph.facebook.com/?id=" + window.location.href.split('?')[0];

  jQuery.ajax({
    url: url,
    method: "GET"
  })
    .done(function(response) {

      var count = response.share.share_count;

      if (+count >= 10) {

        jQuery("#fb-share-count").text(count);
      } else {

        jQuery("#fb-share-count").remove();
      }
    })
    .fail(function(error) {

      console.error(error);
    });
}
