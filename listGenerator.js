// listGenerator.js

import list from './list.js';
// generateHTML.js

function generateHTML(list) {
    const container = document.querySelector('.linkBox');
    if (!container) return; // If the container does not exist, exit the function

    list.slice().reverse().forEach((item, index) => {
        // Skip if item is empty
        if (!item.url && !item.title && !item.client && !item.date) return;

        const box = document.createElement('div');
        box.className = `box box${index.toString().padStart(2, '0')}`; // e.g., box00, box01

        const imgLink = document.createElement('a');
        imgLink.href = item.a || item.url; // Use url if a is blank

        const img = document.createElement('img');
        img.src = `https://s0.wp.com/mshots/v1/${encodeURIComponent(item.url)}`;
        img.alt = '';
        img.className = 'boxImg';
        imgLink.appendChild(img);

        box.appendChild(imgLink);

        const textBox = document.createElement('div');
        textBox.className = 'textBox';

        const title = document.createElement('h4');
        const titleLink = document.createElement('a');
        titleLink.href = item.a || item.url;
        titleLink.textContent = item.title;
        title.appendChild(titleLink);
        textBox.appendChild(title);



        const client = document.createElement('h5');
        client.textContent = `Client : ${item.client}`;
        textBox.appendChild(client);

        const date = document.createElement('h5');
        date.textContent = `Date : ${item.date}`;
        textBox.appendChild(date);

        box.appendChild(textBox);
        container.appendChild(box);
    });
}

generateHTML(list); // Call the function and pass the list
