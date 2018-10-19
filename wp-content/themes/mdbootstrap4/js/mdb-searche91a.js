jQuery(document).ready(function($) {

    var redirecturl = mdw_search_object.redirecturl;
    var action = mdw_search_object.action;

    var $mdbMainSearch = action === 'angular_search' ? $('#angular_search') : $('#mdw_main_search');

    function mdbSearchHandler() {
        var query = $mdbMainSearch.val();

        if (query !== '') {
            var data = {
                'action': action,
                'query': query,
                'redirectUrl': redirecturl,
            };
            $.post(mdw_search_object.ajaxurl, data,
                function(response) {
                    var li = '<li>';
                    if (response.indexOf(li) !== -1) {
                        $('.dropdown-wrapper').html(response);
                    } else {
                        $('.dropdown-wrapper').html('');
                    }
                });
        } else {
            $('.dropdown-wrapper').html('');
        }
    }

    $mdbMainSearch.on('keyup', mdbSearchHandler);

    $mdbMainSearch.on('click', mdbSearchHandler);

    $('.search-form').on('click',function(e){
    	e.stopPropagation();
    });

    $('body').on('click',function(){
        $('.dropdown-wrapper').html('');
    });

    $(".dropdown-wrapper").on('click','.sv-phr',function(){

        var phrase = $(this).text();
        var userId = localStorage.getItem('_uuid').substring(0,5);
        var link = window.location.pathname;

        $.ajax({
            type: 'POST',
            url: mdw_search_object.ajaxurl,
            data: { action: "save_phrase", phrase: phrase, userId: userId, link: link }
        });

    });

});