// For the scrolldown animation on the Front Page
// Used Jquery for this function because it was easier.
$("#scroll-arrow").click(function(e) {
    e.preventDefault();
    var section = $(this).attr("href");
    $(".frontpage-layout-container").animate({
        scrollTop: $(section).offset().top
    });
});


// For the sidebar animation on the Park Map Page
var toggleBtn = document.querySelector('.filterBtn');
var sidebar = document.querySelector('.sidebarFilterContainer');
var btnIcon = document.querySelector('.btnIcon');
if(toggleBtn){ // If statement to prevent null error
    toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('sidebar-is-open');
        btnIcon.classList.toggle('btn-is-active');
    })
}

// For expanding the "game boxes" when clicked
var box = document.querySelector('.game-box');
if(box) { // If statement to prevent null error
    box.addEventListener('click', function() {
        box.classList.toggle('container-active');
    }) 
}

// For showing the hint while playing a game
var btn = document.querySelector('.showHint');
var hint = document.querySelector('.hint');
if(btn) { // If statement to prevent null error
    btn.addEventListener('click', function() {
        btn.style.display = "none";
        hint.style.display = "block";
    })
}
