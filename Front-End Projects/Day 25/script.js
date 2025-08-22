const registerBtn = document.getElementById('registerButton');
const container = document.querySelector('.container');
const loginBtn = document.getElementById('loginButton');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});