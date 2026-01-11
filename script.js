// Select elements
const button = document.getElementById('colorBtn');
const title = document.getElementById('title');

// Array of colors
const colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#8E44AD', '#1ABC9C'];

// Function to change background
const changeColor = () => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    document.body.style.backgroundColor = randomColor;
    title.innerText = `Background Color: ${randomColor}`;
};

// Event listener for button
button.addEventListener('click', changeColor);
