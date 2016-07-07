$(document).ready(function() {
    var $header = $('.header-animated');
    var $headers = $('.header-animated opaque');
    var $logoAlt = $header.find('.logo > img').data('logo-alt');
    var $logoDefault = $header.find('.logo > img').data('logo-default'); 
    $(".header").css("display","block");       

    // navbar toggle
    $('.nav-toggle').click(function() {
        $(this).toggleClass('open');
    });

    // navbar dropdown
    $(".dropdown").hover(function() {
        $(".dropdown").addClass("open")
    }, function() {
        $(".dropdown").removeClass("open")
    });

    if (window.location.pathname == "/features" || window.location.pathname == "/about") {
       $(".header").addClass("opaque");
       $header.find('.logo > img').attr('src', $logoDefault);
    }

    // tab pane
    $('#tabs a').click(function(e) {
        e.preventDefault()
        $(this).tab('show')
    })

    // video Stop 
    $('#videoModal').on('hidden.bs.modal', function() {
        $("#videoModal iframe").attr("src", $("#videoModal iframe").attr("src"));
    });

    // typing Effect 
    var stringArray = window.home ? window.home.hero_banner.rolling_text : null    
    $(".typed").typed({
        strings: stringArray,
        typeSpeed: 30, // typing speed
        backDelay: 500, // pause before backspacing
        loop: true, // loop on or off (true or false)
        loopCount: false, // number of loops, false = infinite
        callback: function() {} // call function after typing is done
    });   

    $(window).on('scroll', function() {
        if (window.location.pathname != "/features" && window.location.pathname != "/about") {
            console.log('true');
            if ($(window).scrollTop() > 100) {
                $header.fadeIn().addClass('opaque');
                $header.find('.logo > img').attr('src', $logoDefault);

            } else {
                $header.removeClass('opaque');
                $header.find('.logo > img').attr('src', $logoAlt);
            }
        }
    });
});
