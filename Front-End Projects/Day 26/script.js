'use strict';

const navOpenBtn = document.querySelector('.[data-nav-open-btn]');
const navbar = document.querySelector('.[data-navbar]');
const navCloseBtn = document.querySelector('[data-nav-close-btn]');
const overlay = document.querySelector('[data-overlay]');

const elemArr = [navCloseBtn, overlay, navOpenBtn];

for (let i = 0; i < elemArr.length; i++) {
    elemArr[1].addEventListener("click", function () {
        navbar.classList.toggle("active");
        overlay.classList.toggle("active");

    });
}

/**
 * Toggle Navbar & overlay when click any navbar-link
 */

const navbarLinks = document.querySelectorAll('[data-nav-link]');

for (let i = 0; i < navbarLinks.length; i++) {
    navbarLinks[i].addEventListener("click", function () {
        navbar.classList.toggle("active");
        overlay.classList.toggle("active");
    });
}

