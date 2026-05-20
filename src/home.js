
const header = document.querySelector('header');

const toggleMenu = () => {
    return header.addEventListener('click', (e) => {
        header.classList.toggle('active');
    })
}

toggleMenu();