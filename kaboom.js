// Initialize Kaboom
kaboom({
    background: [135, 206, 235],
    fullscreen: true,
});

// === CONSTANTS ===
const GAME_DURATION = 300; // 5 minutes in seconds
const INITIAL_TREES = 100;
const INITIAL_MONEY = 0;
const INITIAL_TREE_PRICE = 50;
const TREE_PRICE_MULTIPLIER = 1.1;
const REGEN_RATE = 0.01;
const INITIAL_TOOL_PRICE = 100;
const TOOL_PRICE_INCREASE = 1.15;
const TOOL_CUT_DELAY_REDUCTION = 0.1;
const REPLANT_COST = 200;
const REPLANT_TIME = 60;
const BOYCOTT_THRESHOLD = 20; // Difference between cut and replanted trees
const BOYCOTT_COST = 500; // Cost to buy public opinion
const NATURE_RESERVE_COST = 1000; // Cost to create a reserve
const PROTECTED_TREES = 10; // Trees protected by reserve

// === GAME STATE ===
let trees = INITIAL_TREES;
let money = INITIAL_MONEY;
let treePrice = INITIAL_TREE_PRICE;
let toolPrice = INITIAL_TOOL_PRICE;
let timeLeft = GAME_DURATION;
let cutDelay = 2; // Delay in seconds for cutting a tree
let lastCutTime = -cutDelay; // Initialize to allow immediate cutting
let replantQueue = [];
let boycottProgress = 0;
let inBoycott = false;
let protectedTrees = 0;

// === SPRITE LOADING ===
loadSprite("tree", "assets/image/tree_2.png");
loadSprite("boycott", "assets/image/newspaper.png"); // Load the boycott image

let treeSprites = [];

// === HELPER FUNCTIONS ===

// Update the price of a tree based on the number left
function updateTreePrice() {
    treePrice = Math.floor(INITIAL_TREE_PRICE * Math.pow(TREE_PRICE_MULTIPLIER, INITIAL_TREES - trees));
}

// Dynamically add new trees to the screen
function addNewTrees(count) {
    const screenWidth = width();
    const screenHeight = height();
    const marginX = screenWidth * 0.1; // 10% margin on sides
    const marginTop = screenHeight * 0.1; // 10% margin on top
    const marginBottom = screenHeight * 0.2; // 20% margin on bottom
    const areaWidth = screenWidth - 2 * marginX;
    const areaHeight = screenHeight - marginTop - marginBottom;

    // Calculate tree size dynamically
    const maxTrees = 200;
    const treeWidth = Math.sqrt((areaWidth * areaHeight) / maxTrees);
    const treeHeight = treeWidth * (122 / 110); // Keep original aspect ratio

    // Generate positions for new trees
    let positions = treeSprites.map(tree => tree.pos);
    for (let i = 0; i < count; i++) {
        let x, y, valid;
        do {
            x = Math.random() * (areaWidth - treeWidth) + marginX;
            y = Math.random() * (areaHeight - treeHeight) + marginTop;
            valid = positions.every(pos => {
                const dx = x - pos.x;
                const dy = y - pos.y;
                return Math.sqrt(dx * dx + dy * dy) > treeWidth;
            });
        } while (!valid);
        positions.push({ x, y });

        // Add new tree sprite
        const treeSprite = add([
            sprite("tree", { width: treeWidth, height: treeHeight }),
            pos(x, y),
        ]);
        treeSprites.push(treeSprite);
    }
}

// Remove trees from the screen
function removeTrees(count) {
    for (let i = 0; i < count; i++) {
        const tree = treeSprites.pop();
        if (tree) destroy(tree);
    }
}

// Update the entire UI
function updateUI() {
    treesLabel.text = `Trees: ${trees}`;
    moneyLabel.text = `Money: $${money}`;
    timeLabel.text = `Time Left: ${Math.ceil(timeLeft)}s`;

    // Mise à jour de la barre de boycott
    const boycottEmoji = boycottProgress >= 0.8 ? "⚠️" : boycottProgress >= 0.5 ? "❗" : "🌲";
    boycottLabel.text = `${boycottEmoji} Boycott Risk`;

    // Ajustement de la barre de progression
    boycottBar.width = Math.max(1, boycottBarMaxWidth * boycottProgress);
    boycottBar.pos.x = boycottBarContainer.pos.x + (boycottBarContainer.width - boycottBar.width) / 2;
}

// Trigger boycott consequences
function triggerBoycott() {
    inBoycott = true;
    const popupWidth = width() * 0.6;
    const popupHeight = height() * 0.4;
    const popupX = width() * 0.2;
    const popupY = height() * 0.3;

    const boycottPopup = add([
        rect(popupWidth, popupHeight),
        pos(popupX, popupY),
        color(50, 50, 50),
        outline(4, rgb(200, 0, 0)),
        "boycottPopup"
    ]);

    add([text("Boycott!", { size: 32, color: rgb(255, 255, 255) }), pos(popupX + popupWidth / 2 - 50, popupY + 20)]);

    const boycottImage = add([
        sprite("boycott", { width: popupWidth * 0.8, height: popupHeight * 0.5 }),
        pos(popupX + popupWidth * 0.1, popupY + 60),
    ]);

    const payButton = add([
        rect(150, 50),
        pos(popupX + popupWidth * 0.25, popupY + popupHeight - 70),
        color(0, 200, 0),
        area(),
        "payButton"
    ]);
    payButton.add([text("Pay $500", { size: 20 }), anchor("center"), pos(75, 25)]);

    const timeButton = add([
        rect(150, 50),
        pos(popupX + popupWidth * 0.55, popupY + popupHeight - 70),
        color(200, 0, 0),
        area(),
        "timeButton"
    ]);
    timeButton.add([text("Lose 30s", { size: 20 }), anchor("center"), pos(75, 25)]);

    onClick("payButton", () => {
        if (money >= BOYCOTT_COST) {
            money -= BOYCOTT_COST;
            destroy(boycottPopup);
            destroy(boycottImage);
            destroy(payButton);
            destroy(timeButton);
            inBoycott = false;
            updateUI();
        }
    });

    onClick("timeButton", () => {
        timeLeft = Math.max(0, timeLeft - 30);
        destroy(boycottPopup);
        destroy(boycottImage);
        destroy(payButton);
        destroy(timeButton);
        inBoycott = false;
        updateUI();
    });
}

// Create a nature reserve
function createNatureReserve() {
    if (money >= NATURE_RESERVE_COST) {
        money -= NATURE_RESERVE_COST;
        protectedTrees += PROTECTED_TREES;
        updateUI();
    }
}

// === ACTION FUNCTIONS ===

function cutTree() {
    if (trees > protectedTrees && time() - lastCutTime > cutDelay) {
        trees--;
        removeTrees(1);
        money += treePrice;
        updateTreePrice();
        lastCutTime = time();
        boycottProgress += 1 / BOYCOTT_THRESHOLD;
        if (boycottProgress >= 1 && !inBoycott) {
            triggerBoycott();
        }
        updateUI();
    } else if (trees <= protectedTrees) {
        console.log("No more trees to cut! Some trees are protected.");
    }
}

function replantTree() {
    if (money >= REPLANT_COST) {
        money -= REPLANT_COST;
        replantQueue.push(time() + REPLANT_TIME);
        boycottProgress = Math.max(0, boycottProgress - 0.1);
        updateUI();
    }
}

function buyTool() {
    if (money >= toolPrice) {
        money -= toolPrice;
        cutDelay = Math.max(0.5, cutDelay - TOOL_CUT_DELAY_REDUCTION);
        toolPrice = Math.floor(toolPrice * TOOL_PRICE_INCREASE);
        updateUI();
    }
}

// Check if replanted trees are ready to grow
function checkReplantedTrees() {
    const now = time();
    const grownTrees = replantQueue.filter(growTime => now >= growTime);
    if (grownTrees.length > 0) {
        replantQueue = replantQueue.filter(growTime => now < growTime);
        trees += grownTrees.length;
        addNewTrees(grownTrees.length);
        updateTreePrice();
        updateUI();
    }
}

// Regenerate the forest over time
function regenerateForest() {
    const regeneratedTrees = Math.floor(trees * REGEN_RATE);
    const treesToAdd = Math.min(regeneratedTrees, INITIAL_TREES - trees);
    trees += treesToAdd;
    addNewTrees(treesToAdd);
    updateTreePrice();
    updateUI();
}

// === MAIN GAME SCENE ===
scene("main", () => {
    // UI Elements
    treesLabel = add([text("Trees: 0", { size: 24 }), pos(20, 20)]);
    moneyLabel = add([text("Money: $0", { size: 24 }), pos(20, 50)]);
    timeLabel = add([text("Time Left: 0s", { size: 24 }), pos(20, 80)]);

    // Boycott Risk UI
    boycottLabel = add([text("🌲 Boycott Risk", { size: 24 }), pos(20, 110)]);

    // Conteneur pour la barre de progression avec cadre
    const boycottBarWidth = width() * 0.2; // Réduction de la longueur totale
    const boycottBarHeight = 20;
    boycottBarMaxWidth = boycottBarWidth;

    boycottBarContainer = add([
        rect(boycottBarWidth, boycottBarHeight), // Conteneur avec cadre
        pos(200, 115), // Position ajustée
        outline(2, rgb(0, 0, 0)), // Ajout d'un cadre noir
        color(200, 200, 200), // Couleur de fond gris clair
    ]);

    // Barre intérieure (progrès)
    boycottBar = add([
        rect(1, boycottBarHeight - 4), // Ajustement pour qu'elle soit à l'intérieur du cadre
        pos(boycottBarContainer.pos.x + 2, boycottBarContainer.pos.y + 2),
        color(50, 50, 50), // Couleur gris foncé
    ]);

    // Button dimensions
    const buttonWidth = width() * 0.2;
    const buttonHeight = height() * 0.06;
    const buttonY = height() - buttonHeight - 20;

    // Buttons
    const cutButton = add([
        rect(buttonWidth, buttonHeight),
        pos(width() * 0.05, buttonY),
        color(255, 0, 0),
        area(),
        "cutButton",
    ]);
    const cutButtonText = cutButton.add([text("Cut Tree", { size: 20 }), anchor("center"), pos(buttonWidth / 2, buttonHeight / 2), "buttonText"]);

    const toolButton = add([
        rect(buttonWidth, buttonHeight),
        pos(width() * 0.3, buttonY),
        color(200, 200, 0),
        area(),
        "toolButton",
    ]);
    const toolButtonText = toolButton.add([text(`Buy Tool ($${toolPrice})`, { size: 20 }), anchor("center"), pos(buttonWidth / 2, buttonHeight / 2), "buttonText"]);

    const replantButton = add([
        rect(buttonWidth, buttonHeight),
        pos(width() * 0.55, buttonY),
        color(0, 200, 0),
        area(),
        "replantButton",
    ]);
    const replantButtonText = replantButton.add([text(`Replant Tree ($${REPLANT_COST})`, { size: 20 }), anchor("center"), pos(buttonWidth / 2, buttonHeight / 2), "buttonText"]);

    const reserveButton = add([
        rect(buttonWidth, buttonHeight),
        pos(width() * 0.8, buttonY),
        color(0, 0, 200),
        area(),
        "reserveButton",
    ]);
    const reserveButtonText = reserveButton.add([text(`Create Reserve ($${NATURE_RESERVE_COST})`, { size: 20 }), anchor("center"), pos(buttonWidth / 2, buttonHeight / 2), "buttonText"]);

    // === UPDATE BUTTON COLOR AND TEXT BASED ON CUT DELAY ===
    function updateCutButton() {
        const timeSinceLastCut = time() - lastCutTime;
        const progress = Math.min(timeSinceLastCut / cutDelay, 1);
        const red = 255 * (1 - progress);
        const green = 255 * progress;
        cutButton.color = rgb(red, green, 0);
        if (progress < 1) {
            cutButtonText.text = `Cutting... ${Math.floor(progress * 100)}%`;
        } else {
            cutButtonText.text = "Cut Tree";
        }
    }

    // === CUT TREE FUNCTION ===
    function cutTree() {
        if (time() - lastCutTime >= cutDelay) {
            if (trees > 0) {
                trees--;
                money += treePrice;
                updateTreePrice();
                lastCutTime = time();
                updateCutButton();
                updateUI();
                removeTrees(1);
                boycottProgress = Math.min(1, boycottProgress + 0.05);
                if (boycottProgress >= 1 && !inBoycott) {
                    triggerBoycott();
                }
            }
        }
    }

    // === REPLANT TREE FUNCTION ===
    function replantTree() {
        if (money >= REPLANT_COST) {
            money -= REPLANT_COST;
            replantQueue.push(time() + REPLANT_TIME);
            boycottProgress = Math.max(0, boycottProgress - 0.1);
            updateUI();
        }
    }

    // === BUTTON CLICK EVENT ===
    function handleButtonClick(button, action) {
        button.onClick(() => {
            button.color = rgb(100, 100, 100); // Change color on click
            wait(0.1, () => button.color = rgb(255, 255, 255)); // Reset color after 0.1s
            action();
        });
    }

    handleButtonClick(cutButton, cutTree);
    handleButtonClick(toolButton, buyTool);
    handleButtonClick(replantButton, replantTree);
    handleButtonClick(reserveButton, createNatureReserve);

    // Initialize button state
    updateCutButton();

    // === GAME LOOP ===
    onUpdate(() => {
        timeLeft -= dt();
        if (timeLeft <= 0) {
            endGame();
        }
        checkReplantedTrees();
        updateCutButton();
        updateUI();

        // Update button states based on money
        toolButton.color = money >= toolPrice ? rgb(200, 200, 0) : rgb(100, 100, 100);
        replantButton.color = money >= REPLANT_COST ? rgb(0, 200, 0) : rgb(100, 100, 100);
        reserveButton.color = money >= NATURE_RESERVE_COST ? rgb(0, 0, 200) : rgb(100, 100, 100);

        // Update button texts with prices
        toolButtonText.text = `Buy Tool ($${toolPrice})`;
        replantButtonText.text = `Replant Tree ($${REPLANT_COST})`;
        reserveButtonText.text = `Create Reserve ($${NATURE_RESERVE_COST})`;
    });

    // Forest regeneration
    loop(1, regenerateForest);

    // Initialize game
    addNewTrees(trees);
    updateTreePrice();
    updateUI();
});

// Start the game
go("main");
