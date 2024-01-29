let pantryItems = JSON.parse(localStorage.getItem('pantryItems')) || [];
const pantryList = document.getElementById('pantry-list');

function render(){
    let pantryItems = JSON.parse(localStorage.getItem('pantryItems')) || [];
    pantryList.innerHTML = '';
    pantryItems.sort((a, b) => {
        return new Date(a.expiryDate) - new Date(b.expiryDate);
    });

    pantryItems.forEach(item => {
        const li = document.createElement('li');

        const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3) {
            li.classList.add('expired');
        }
        if (daysLeft < 7 && daysLeft > 3) {
            li.classList.add('expiring');
        }
        // format the days left to months if it's more than 2 weeks, to years if it's more than a year
        let relativeTime = `(${daysLeft}d)`
        if (daysLeft > 14) {
            const weeksLeft = Math.floor(daysLeft / 7);
            const monthsLeft = Math.floor(daysLeft / 30);
            if (monthsLeft > 12) {
                const yearsLeft = Math.floor(monthsLeft / 12);
                relativeTime = `(${yearsLeft}y)`;
            } else if (monthsLeft >= 1) {
                relativeTime = `(${monthsLeft}m)`;
            } else {
                relativeTime = `(${weeksLeft}w)`;
            }
        }
        li.textContent = `${item.name} ${relativeTime} `;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = "🗑";
        li.appendChild(deleteButton);

        pantryList.appendChild(li);
    });
}

function addPantryItem(name, expiryDate) {
    const item = {
        name,
        expiryDate
    }
    const pantryItems = JSON.parse(localStorage.getItem('pantryItems')) || [];
    pantryItems.push(item);
    localStorage.setItem('pantryItems', JSON.stringify(pantryItems));
}

function removePantryItem(index) {
    const pantryItems = JSON.parse(localStorage.getItem('pantryItems')) || [];
    pantryItems.splice(index, 1);
    localStorage.setItem('pantryItems', JSON.stringify(pantryItems));
}

// UI listeners
document.getElementById('name').addEventListener('change', () => {
    document.getElementById('expiry-date-text').focus();
});

document.getElementById('expiry-date-text').addEventListener('change', () => {
    const name = document.getElementById('name').value;
    const expiryDateText = document.getElementById('expiry-date-text').value;
    const [year, month, day] = expiryDateText.split(/年|月|日|號/);
    const expiryDate = new Date(year, month - 1, day, 1, 0, 0, 0); // Need to be 1am to avoid timezone issues
    console.log(expiryDate)
    document.getElementById('expiry-date').valueAsDate = expiryDate;
    document.getElementById('expiry-date').dispatchEvent(new Event('change'));
});

document.getElementById('expiry-date').addEventListener('change', () => {
    const name = document.getElementById('name').value;
    const expiryDate = document.getElementById('expiry-date').value;
    addPantryItem(name, expiryDate);

    document.getElementById('name').value = '';
    document.getElementById('expiry-date-text').value = '';
    document.getElementById('expiry-date').value = '';


    render();
    // focus on the name input for smooth adding of items
    document.getElementById('name').focus();
});

pantryList.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' && event.target.textContent === "🗑") {
        const confirmDelete = confirm('Are you sure you want to delete this item?');
        if (!confirmDelete) {
            return;
        }
        const index = Array.from(pantryList.children).indexOf(event.target.parentNode);
        removePantryItem(index);
        render();
    }
});


render();

// Export and Import
// When the export button is clicked, download the pantryItems as a json file
document.getElementById('export').addEventListener('click', () => {
    const pantryItemsJson = JSON.stringify(pantryItems);
    const blob = new Blob([pantryItemsJson], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // set the filename to pantry-export-<date>.json
    const date = new Date().toISOString().split('T')[0];
    a.download = `pantry-export-${date}.json`;
    a.click();
});

// When the import button is clicked, open a file picker and let the user select a json file, then import it into the pantryItems and save to localstorage
document.getElementById('import').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.click();
    input.addEventListener('change', () => {
        const file = input.files[0];
        const reader = new FileReader();
        reader.readAsText(file);
        reader.addEventListener('load', () => {
            const importedPantryItems = JSON.parse(reader.result);
            // Ask if I want to overwrite the existing pantry items
            const confirmMerge = confirm('Do you want to keep existing items? Select YES to merge the imported items with the existing items, or NO to overwrite the existing items with the imported items.');
            const newPantryItems = confirmMerge ? importedPantryItems.concat(pantryItems) : importedPantryItems;
            
            localStorage.setItem('pantryItems', JSON.stringify(newPantryItems));
            render();
        });
    });
});