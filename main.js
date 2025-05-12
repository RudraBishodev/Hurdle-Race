import { Game } from 'game';

const renderDiv = document.getElementById('renderDiv');
if (!renderDiv) {
    console.error("Fatal Error: renderDiv not found in HTML. Game cannot start.");
} else {
    const game = new Game(renderDiv);
    game.start();
}