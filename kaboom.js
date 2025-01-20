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
const NATURE_RESERVE_COST = 1000; // Cost to create a reserve
const PROTECTED_TREES = 10; // Trees protected by reserve
const BOYCOTT_THRESHOLD = 16;
const BOYCOTT_PENALTY_TIME = 30;
const BOYCOTT_PENALTY_MULTIPLIER = 8;

// === GAME STATE ===
let trees = INITIAL_TREES;
let money = INITIAL_MONEY;
let treePrice = INITIAL_TREE_PRICE;
let toolPrice = INITIAL_TOOL_PRICE;
let timeLeft = GAME_DURATION;
let cutDelay = 2; // Delay in seconds for cutting a tree
let lastCutTime = -cutDelay; // Initialize to allow immediate cutting
let replantQueue = [];
let protectedTrees = 0;
let treesCut = 0;

// === SPRITE LOADING ===
loadSprite("tree", "assets/image/tree_2.png");
loadSprite("boycott", "assets/image/newspaper.png");

let treeSprites = [];

let boycottProgressBar;
let boycottProgressBarBg;

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
    // Mise à jour des étiquettes
    treesLabel.text = `Trees: ${trees}`;
    moneyLabel.text = `Money: $${money}`;
    timeLabel.text = `Time Left: ${Math.ceil(timeLeft)}s`;
}

// Update the boycott progress bar
function updateBoycottProgressBar() {
    const progress = Math.min(treesCut / BOYCOTT_THRESHOLD, 1);
    boycottProgressBar.width = progress * boycottProgressBarBg.width;
}

// Create a nature reserve
function createNatureReserve() {
    if (money >= NATURE_RESERVE_COST) {
        money -= NATURE_RESERVE_COST;
        protectedTrees += PROTECTED_TREES;
        treesCut = Math.max(0, treesCut - 8);
        updateUI();
    }
}

// === ACTION FUNCTIONS ===

function cutTree() {
    if (trees > protectedTrees && time() - lastCutTime > cutDelay) {
        trees--;
        treesCut++;
        removeTrees(1);
        money += treePrice;
        updateTreePrice();
        lastCutTime = time();
        updateUI();
        if (treesCut >= BOYCOTT_THRESHOLD) {
            triggerBoycott();
        }
    } else if (trees <= protectedTrees) {
        console.log("No more trees to cut! Some trees are protected.");
    }
}

function replantTree() {
    if (money >= REPLANT_COST) {
        money -= REPLANT_COST;
        replantQueue.push(time() + REPLANT_TIME);
        treesCut = Math.max(0, treesCut - 0.5);
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

// === BUTTON HANDLING ===
let buttons = [];

function createButton(label, x, y, color, action) {
    const buttonWidth = width() * 0.2;
    const buttonHeight = height() * 0.06;
    const button = add([
        rect(buttonWidth, buttonHeight),
        pos(x, y),
        color,
        area(),
        "button",
        { action, originalColor: color, active: true }
    ]);
    const buttonText = button.add([text(label, { size: 20 }), anchor("center"), pos(buttonWidth / 2, buttonHeight / 2)]);
    button.onClick(() => {
        if (button.active) {
            button.action();
        }
    });
    buttons.push({ button, buttonText });
    return { button, buttonText };
}

function setButtonsActive(active) {
    buttons.forEach(({ button }) => {
        button.active = active;
        button.color = active ? button.originalColor : rgb(100, 100, 100);
    });
}

// Trigger boycott
function triggerBoycott() {
    const popupWidth = width() * 0.4;
    const popupHeight = height() * 0.5;
    const imageSize = Math.min(popupWidth * 0.8, popupHeight * 0.8);
    const buttonWidth = imageSize / 2 - 10; // Two buttons should fit under the image with some margin
    const buttonHeight = height() * 0.08;

    const boycottPopup = add([
        rect(popupWidth, popupHeight),
        pos((width() - popupWidth) / 2, (height() - popupHeight) / 2),
        color(255, 255, 255),
        area(),
        "boycottPopup",
    ]);
    const boycottImage = boycottPopup.add([
        sprite("boycott", { width: imageSize, height: imageSize }),
        pos((popupWidth - imageSize) / 2, 20),
    ]);
    const timePenaltyButton = boycottPopup.add([
        rect(buttonWidth, buttonHeight),
        pos((popupWidth - imageSize) / 2 + 10, popupHeight - buttonHeight - 20),
        color(255, 0, 0),
        area(),
        "timePenaltyButton",
    ]);
    const timePenaltyText = timePenaltyButton.add([
        text("Lose 30 seconds", { size: 20 }),
        anchor("center"),
        pos(buttonWidth / 2, buttonHeight / 2),
    ]);
    const moneyPenaltyButton = boycottPopup.add([
        rect(buttonWidth, buttonHeight),
        pos((popupWidth + imageSize) / 2 - buttonWidth - 10, popupHeight - buttonHeight - 20),
        color(0, 255, 0),
        area(),
        "moneyPenaltyButton",
    ]);
    const moneyPenaltyText = moneyPenaltyButton.add([
        text(`Pay $${treePrice * BOYCOTT_PENALTY_MULTIPLIER}`, { size: 20 }),
        anchor("center"),
        pos(buttonWidth / 2, buttonHeight / 2),
    ]);

    // Pause the game
    const originalCutDelay = cutDelay;
    cutDelay = Infinity;
    const originalTimeLeft = timeLeft;

    // Disable other buttons
    setButtonsActive(false);

    timePenaltyButton.onClick(() => {
        timeLeft = originalTimeLeft - BOYCOTT_PENALTY_TIME;
        destroy(boycottPopup);
        cutDelay = originalCutDelay; // Resume the game
        treesCut = 0; // Reset the counter
        // Enable other buttons
        setButtonsActive(true);
    });

    moneyPenaltyButton.onClick(() => {
        if (money >= treePrice * BOYCOTT_PENALTY_MULTIPLIER) {
            money -= treePrice * BOYCOTT_PENALTY_MULTIPLIER;
            destroy(boycottPopup);
            cutDelay = originalCutDelay; // Resume the game
            timeLeft = originalTimeLeft;
            treesCut = 0; // Reset the counter
            // Enable other buttons
            setButtonsActive(true);
        }
    });
}

// === FINAL SCENE ===
function showFinalScene(win) {
    scene("final", () => {
        add([
            text(win ? "You Win!" : "Game Over", { size: 48 }),
            pos(width() / 2, height() / 4),
            anchor("center"),
        ]);

        add([
            text(`Trees Left: ${trees}`, { size: 24 }),
            pos(width() / 2, height() / 2 - 40),
            anchor("center"),
        ]);

        add([
            text(`Money Earned: $${money}`, { size: 24 }),
            pos(width() / 2, height() / 2),
            anchor("center"),
        ]);

        add([
            text(`Time Played: ${GAME_DURATION - Math.ceil(timeLeft)}s`, { size: 24 }),
            pos(width() / 2, height() / 2 + 40),
            anchor("center"),
        ]);

        const replayButton = add([
            rect(200, 50),
            pos(width() / 2 - 100, height() * 0.75),
            color(0, 200, 0),
            area(),
            anchor("center"),
            "replayButton",
        ]);

        const replayButtonText = replayButton.add([
            text("Replay", { size: 24 }),
            anchor("center"),
            pos(100, 25),
        ]);

        replayButton.onClick(() => {
            resetGame();
            go("main");
        });
    });

    go("final");
}

// Reset game stats
function resetGame() {
    trees = INITIAL_TREES;
    money = INITIAL_MONEY;
    treePrice = INITIAL_TREE_PRICE;
    toolPrice = INITIAL_TOOL_PRICE;
    timeLeft = GAME_DURATION;
    cutDelay = 2;
    lastCutTime = -cutDelay;
    replantQueue = [];
    protectedTrees = 0;
    treesCut = 0;
    treeSprites.forEach(tree => destroy(tree));
    treeSprites = [];
}

// === MAIN GAME SCENE ===
scene("main", () => {
    // UI Elements
    treesLabel = add([text("Trees: 0", { size: 24 }), pos(20, 20)]);
    moneyLabel = add([text("Money: $0", { size: 24 }), pos(20, 50)]);
    timeLabel = add([text("Time Left: 0s", { size: 24 }), pos(20, 80)]);

    // Boycott progress bar
    add([
        text("Boycott Risk", { size: 20 }),
        pos(20, 110),
    ]);
    boycottProgressBarBg = add([
        rect(width() * 0.08, 20), // Shortened width
        pos(20, 140),
        color(200, 200, 200),
    ]);
    boycottProgressBar = add([
        rect(0, 20),
        pos(20, 140),
        color(255, 0, 0),
    ]);

    // Button dimensions
    const buttonY = height() - height() * 0.06 - 20;

    // Buttons
    const { button: cutButton, buttonText: cutButtonText } = createButton("Cut Tree", width() * 0.05, buttonY, rgb(255, 0, 0), cutTree);
    const { button: toolButton, buttonText: toolButtonText } = createButton(`Buy Tool ($${toolPrice})`, width() * 0.3, buttonY, rgb(200, 200, 0), buyTool);
    const { button: replantButton, buttonText: replantButtonText } = createButton(`Replant Tree ($${REPLANT_COST})`, width() * 0.55, buttonY, rgb(0, 200, 0), replantTree);
    const { button: reserveButton, buttonText: reserveButtonText } = createButton(`Create Reserve ($${NATURE_RESERVE_COST})`, width() * 0.8, buttonY, rgb(0, 0, 200), createNatureReserve);

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

    // Initialize button state
    updateCutButton();

    // === GAME LOOP ===
    onUpdate(() => {
        if (cutDelay !== Infinity) {
            timeLeft -= dt();
        }
        if (timeLeft <= 0 || (money >= 20000 && trees >= 30)) {
            showFinalScene(money >= 20000 && trees >= 30);
        }
        checkReplantedTrees();
        updateCutButton();
        updateUI();
        updateBoycottProgressBar();

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
