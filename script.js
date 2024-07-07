"use strict";

const itemSet = ["Apple", "Banana", "Orange", "Pear", "Grape"];
const correctOrder = [...itemSet].sort(() => Math.random() - 0.5);
const maxGuessCount = 8;

const guessContainer = document.getElementById('guessBox');
const itemContainer = document.getElementById('itemBox');

itemSet.forEach((item, index) => {    
    const cellElement = document.createElement('div');
    cellElement.classList.add('cell');
    cellElement.dataset.index = index;
    guessContainer.appendChild(cellElement);

    const itemElement = document.createElement('div');
    itemElement.id = item;
    itemElement.classList.add('item');
    itemElement.draggable = true;
    itemElement.innerText = item;
    itemContainer.appendChild(itemElement);
});

document.getElementById('feedback').innerText = "You have " + maxGuessCount + " guesses left.";

let hasCorrectlyGuessed = false;
let currentGuess = [];
let history = [];

const items = document.querySelectorAll('.item');
const cells = document.querySelectorAll('.cell');

items.forEach(item => {
    item.addEventListener('dragstart', dragStart);
    item.addEventListener('dragend', dragEnd);
});

cells.forEach(cell => {
    cell.addEventListener('dragover', dragOver);
    cell.addEventListener('dragenter', dragEnter);
    cell.addEventListener('dragleave', dragLeave);
    cell.addEventListener('drop', drop);
});

const itemBox = document.getElementById('itemBox');
itemBox.addEventListener('dragover', dragOver);
itemBox.addEventListener('dragenter', dragEnter);
itemBox.addEventListener('dragleave', dragLeave);
itemBox.addEventListener('drop', dropToItemBox);

function dragStart(event) {
    event.target.classList.add('dragging');
    event.dataTransfer.setData('text/plain', event.target.id);
}

function dragEnd(event) {
    event.target.classList.remove('dragging');
}

function dragOver(event) {
    event.preventDefault();
}

function dragEnter(event) {
    if (event.target.classList.contains('cell') || event.target.classList.contains('item') || event.target.id === 'itemBox') {
        event.target.classList.add('drag-over');
    }
}

function dragLeave(event) {
    if (event.target.classList.contains('cell') || event.target.classList.contains('item') || event.target.id === 'itemBox') {
        event.target.classList.remove('drag-over');
    }
}

function drop(event) {
    event.preventDefault();
    const draggedItemId = event.dataTransfer.getData('text/plain');
    const targetCell = event.target;

    if (targetCell.classList.contains('cell') && !targetCell.hasChildNodes()) {
        const draggedElement = document.getElementById(draggedItemId);
        targetCell.appendChild(draggedElement);
        // Make the width of the cell the same as the item
        targetCell.style.width = draggedElement.offsetWidth + 'px';
        // Make the height of the cell the same as the item
        targetCell.style.height = draggedElement.offsetHeight + 'px';
    }

    targetCell.classList.remove('drag-over');
    updateCurrentGuess();
}

function dropToItemBox(event) {
    event.preventDefault();
    const draggedItemId = event.dataTransfer.getData('text/plain');
    const draggedElement = document.getElementById(draggedItemId);

    if (event.target.id === 'itemBox' && draggedElement) {
        itemBox.appendChild(draggedElement);
    }

    event.target.classList.remove('drag-over');
    updateCurrentGuess();
}

function updateCurrentGuess() {
    currentGuess = Array.from(cells).map(cell => {
        return cell.hasChildNodes() ? cell.firstChild.id : null;
    });
}

document.getElementById('submitGuess').addEventListener('click', () => {

    if (hasCorrectlyGuessed) {
        return;
    }

    if (history.length >= maxGuessCount) {
        alert("You have run out of guesses. The correct order was: " + correctOrder.join(', '));
        return;
    }

    if ((currentGuess.length !== correctOrder.length) || currentGuess.includes(null)) {
        alert("Please place all items.");
        return;
    }

    const correctCount = currentGuess.reduce((count, item, index) => {
        return count + (item === correctOrder[index] ? 1 : 0);
    }, 0);

    history.push({ guess: [...currentGuess], correctCount });

    const feedback = `You have ${correctCount} item${correctCount === 1 ? '' : 's'} in the correct position. ${maxGuessCount - history.length} guess${maxGuessCount - history.length === 1 ? '' : 'es'} remaining.`;
    
    document.getElementById('feedback').innerText = feedback;

    const historyText = history.map(entry => `Guess: ${entry.guess.join(', ')} - Correct: ${entry.correctCount}`).join('<br>');
    document.getElementById('history').innerHTML = historyText;

    if (correctCount === correctOrder.length) {
        hasCorrectlyGuessed = true;
        const feedback = "Congratulations! You guessed the correct order in " + history.length + " guess" + (history.length === 1 ? '' : 'es') + ".";
        document.getElementById('feedback').innerText = feedback;
        return;
    }

    if (history.length >= maxGuessCount) {
        const feedback = "You have run out of guesses. The correct order was: " + correctOrder.join(', ');
        document.getElementById('feedback').innerText = feedback;
        return;
    }
});
