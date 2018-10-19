(function ( $ ) {

  var latestPackage = {};
  var packages = [];
  var tags = [];

  var $openSnippetModal = $('#modalOpenSnippet');
  var $technologySelect = $('#snippet-package-technology');
  var $versionSelect = $('#snippet-package-version');
  var $typeSelect = $('#snippet-package-type');

  if ( ['angular', 'react', 'vue'].indexOf( window.location.pathname.split('/')[1] ) === -1) {

    registerPrismButton();
  }

  if ( typeof $.fn.materialChip === 'function' ) {

    initMaterialChips();
  }

  $('[data-target="#modalSnippetSettings"]').on( 'click', function loadPackages(e) {

    e.preventDefault();

    showPreloader();

    loadSortedPackages( function () {

      createOptionsSelects();

      hidePreloader();
    });
  });

  $('#save-snippet-settings').on( 'click', function saveSettings(e) {

    e.preventDefault();

    var $this = $(this);

    showPreloader();

    var technology = encodeURIComponent( $technologySelect.val() ).toLowerCase();
    var username = $this.attr('data-user-nicename');
    var queryString = buildQueryString();

    window.location.assign( '/snippets/' + technology + '/' + username + queryString );
  });

  $('main').on('click', '.export-to-snippet', function(e) {

    e.preventDefault();

    var $this = $(this);
    var $navigation = $this.closest('.docs-pills').find('ul');

    if (!$navigation.length) {

      $navigation = $this.closest('.tab-content').siblings('ul');
    }

    var code = getSnippetCode($navigation);

    showPreloader();
    $openSnippetModal.modal();

    $.ajax({
      url: wp_ajaxurl,
      method: 'POST',
      data: { action: 'ajax_is_user_logged_in' }
    })
      .done( function (response) {

        response = typeof response === 'string' ? JSON.parse(response) : response;

        loadSortedPackages( function (packages) {

          setLatestPackage(packages);

          var snippet = prepareCreatePayload(code);

          if (response.loggedin) {

            saveSnippet(response, snippet);
          } else {

            saveGuestSnippet(response, snippet);
          }
        });
      })
      .fail(console.error);
  });

  $('a.open-snippet').on('click', function closeModal(e) {

    $openSnippetModal.modal('hide');
  });

  $('.toggle-like').on('click', function () {

    var $this = $(this);
    var likeCount = parseInt( $this.find('.count-like').text() );
    var snippetId = $this.attr('snippet-id');
    var snippetUsername = $this.attr('snippet-username');
    var snippetUserId = $this.attr('snippet-user-id');
    var currentUserId = $this.attr('current-user-id');
    var likeAction = $this.find('.like-icon').hasClass('fa-thumbs-o-up') ? 'add' : 'delete';

    if( currentUserId === snippetUserId ) {

      toastr.warning("You can't like your own snippet!", "Oops!");
      return;
    }

    $this.addClass('disabled');

    $.ajax({
      url: wp_ajaxurl,
      method: 'POST',
      data: { action: 'ajax_is_user_logged_in' }
    })
    .done( function (response) {

      response = typeof response === 'string' ? JSON.parse(response) : response;

      var user = response.current_user;

      var token = btoa(user.user_nicename + ':' + user.user_email);

      loadSortedPackages( function (packages) {

        setLatestPackage(packages);
      
        $.ajax({
          url: '/api/snippets/' + latestPackage.technology.toLowerCase() + '/' + snippetUsername + '/snippets/like/' + likeAction + '/' + snippetId,
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + token
          }
        })
        .done( function () {

          $this.removeClass('disabled');

          if( $this.find('.like-icon').hasClass('fa-thumbs-o-up') ){

            $this.find('.like-icon').removeClass('fa-thumbs-o-up').addClass('fa-thumbs-up');
            $this.find('.count-like').text(likeCount + 1)
          } else {
      
            $this.find('.like-icon').removeClass('fa-thumbs-up').addClass('fa-thumbs-o-up');
            $this.find('.count-like').text(likeCount - 1)
          }
        })
        .fail( function ( error ) {

          $this.removeClass('disabled');
          console.error( error );
        });
      });
    });
  });

  function setLatestPackage(packages) {

    latestPackage = packages.filter( function (pack) {

      return pack.type === 'PRO' && pack.technology === 'jQuery';
    })[0];
  }

  function getSnippetCode($navigation) {

    var code = {
      html: '',
      css: '',
      js: ''
    };
    $navigation.find('.nav-link').each(function () {

      var $link = $(this);
      code[$link.text().toLowerCase()] = $($link.attr('href')).find('pre').text();
    });

    return code;
  }

  function prepareCreatePayload(code) {

    return {
      packageId: latestPackage.package_id.toString(),
      title: 'New snippet ' + Date.now().toString().substr(-3),
      description: 'Forked from ' + window.location.href,
      html: code.html,
      css: code.css,
      js: code.js,
      status: 3
    };
  }

  function saveGuestSnippet(user, snippet) {

    var technology = encodeURIComponent( latestPackage.technology ).toLowerCase();
    var username = 'temp';
    var queryString = '?action=prism_export';

    createGuestSnippet(snippet, function (response) {

      $openSnippetModal.find('a.open-snippet').attr('href', '/snippets/' + technology + '/' + username + '/' + response.insertId + queryString);
      hidePreloader();
    });
  }

  function createGuestSnippet(data, callback) {

    $.ajax({
      url: '/api/snippets/' + latestPackage.technology.toLowerCase() + '/temp/snippets/temp/create',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data)
    }).done(callback).fail(console.error);
  }

  function saveSnippet(user, snippet) {

    var technology = encodeURIComponent( latestPackage.technology ).toLowerCase();
    var username = user.current_user.user_nicename;

    createSnippet(user.current_user, snippet, function (response) {

      $openSnippetModal.find('a.open-snippet').attr('href', '/snippets/' + technology + '/' + username + '/' + response.insertId);
      hidePreloader();
    });
  }

  function createSnippet(user, data, callback) {

    var token = btoa(user.user_nicename + ':' + user.user_email);

    $.ajax({
      url: '/api/snippets/' + latestPackage.technology.toLowerCase() + '/' + user.user_nicename + '/snippets/create',
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Basic ' + token
      },
      data: JSON.stringify(data)
    }).done(callback).fail(console.error);
  }

  function showPreloader() {

    $(".checkout-preloader-container").removeClass('d-none');
  }

  function hidePreloader() {

    $(".checkout-preloader-container").addClass('d-none');
  }

  function createOptionsSelects() {

    var technologies = [],
      versions = [],
      types = [];

    $technologySelect.empty();
    $versionSelect.empty();
    $typeSelect.empty();

    packages.forEach( function ( pack ) {

      if (technologies.indexOf(pack.technology) === -1) {

        technologies.push(pack.technology);
        $technologySelect.append('<option>' + pack.technology + '</option>', { value: pack.technology });
      }

      if (versions.indexOf(pack.version) === -1) {

        versions.push(pack.version);
        $versionSelect.append('<option>' + pack.version + '</option>', { value: pack.version });
      }

      if (types.indexOf(pack.type) === -1) {

        types.push(pack.type);
        var selected = pack.type === 'PRO' ? ' selected ' : '';
        $typeSelect.append('<option' + selected + '>' + pack.type + '</option>', { value: pack.type });
      }
    });

    $typeSelect.materialSelect(); // FIXME: only this one needs it
  }

  function buildQueryString() {

    var queryString = '?action=save_settings' +
      '&tech=' + encodeURIComponent( $technologySelect.val() ) +
      '&ver=' + encodeURIComponent( $versionSelect.val() ) +
      '&type=' + encodeURIComponent( $typeSelect.val() ) +
      '&title=' + encodeURIComponent( $('#snippet-title').val() ) +
      '&desc=' + encodeURIComponent( $('#snippet-description').val() ) +
      '&package=' + packages.filter( function ( pack ) {

        return pack.technology === $technologySelect.val() &&
          pack.version === $versionSelect.val() &&
          pack.type === $typeSelect.val()
      })[0].package_id;

    if ( tags.length ) {

      queryString += '&tags=' + tags.slice(0, 5).join(',');
    }

    return queryString;
  }

  function registerPrismButton() {

    Prism.plugins.toolbar.registerButton('export-to-snippet', function (env) {

      var button = document.createElement('a');
      button.innerHTML = '<i class="fa fa-photo mr-1"></i> Open in MDB Editor';
      button.classList = 'btn btn-outline-grey btn-sm px-2 waves-effect export-to-snippet';

      return button;
    });
  }

  function initMaterialChips() {

    var $chips = $('.chips.chips-initial');

    $chips.materialChip({
      placeholder: 'At least one tag such as (button, SideNav, JS), max 5 tags',
      secondaryPlaceholder: '+Tag'
    });

    $chips.on('chip.add', function (e, chip) {

      tags.push(chip.tag);
    });

    $chips.on('chip.delete', function (e, chip) {

      tags = tags.filter(function (tag) {
        return tag !== chip.tag;
      });
    });
  }

  function loadSortedPackages(callback) {

    $.ajax({
      url: '/api/snippets/snippets/packages/read',
      method: 'GET'
    }).done( function (response) {

      packages = response
        .sort( function ( a, b ) {

          return b.version.localeCompare( a.version, undefined, { numeric: true } );
        });

      callback(packages);
    }).fail( console.error );
  }
})( jQuery );
