// Initialize Kaboom
function getAspectRatioDimensions() {
    const aspectRatio = 16 / 9;
    let width = window.innerWidth;
    let height = window.innerHeight;

    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }

    return { width, height };
}

const { width, height } = getAspectRatioDimensions();

kaboom({
    background: [0, 0, 0], // Set background to black for margins
    fullscreen: true,
    width: width, // Adapted width for 16:9 aspect ratio
    height: height, // Adapted height for 16:9 aspect ratio
    scale: 1,
    letterbox: true, // Enable letterboxing
});

// === CONSTANTS ===
const GAME_DURATION = 300; // 5 minutes in seconds
const INITIAL_TREES = 100;
const INITIAL_MONEY = 0;
const INITIAL_TREE_PRICE = 50;
const TREE_PRICE_MULTIPLIER = 1.05;
const REGEN_RATE = 0.01;
const INITIAL_TOOL_PRICE = 100;
const TOOL_PRICE_INCREASE = 1.15;
const TOOL_CUT_DELAY_REDUCTION = 0.1;
const REPLANT_COST = 200;
const REPLANT_TIME = 60;
const NATURE_RESERVE_COST = 1000; // Cost to create a reserve
const PROTECTED_TREES = 10; // Trees protected by reserve
const BOYCOTT_THRESHOLD = 3;
const BOYCOTT_PENALTY_TIME = 30;
const BOYCOTT_PENALTY_MULTIPLIER = 4;

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
loadSprite("info", "assets/image/info.png");
loadSprite("background", "assets/image/background.png");
loadSprite("pause", "assets/image/pause.png");
loadSprite("play", "assets/image/play.png");

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
    const screenWidth = width;
    const screenHeight = height;
    const marginX = screenWidth * 0.1; // 10% margin on sides
    const marginTop = screenHeight * 0.17; // 10% margin on top
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
    treesLabel.text = `Trees: ${trees - protectedTrees}`;
    protectedTreesLabel.text = `Protected Trees: ${protectedTrees}`;
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

function createButton(label, x, y, color, action, infoText) {
    const buttonWidth = width * 0.2;
    const buttonHeight = height * 0.06;
    const infoBubbleHeight = buttonHeight / 2; // Set info bubble height to half the button height
    const button = add([
        rect(buttonWidth, buttonHeight),
        pos(x, y),
        color,
        area(),
        "button",
        { action, originalColor: color, active: true }
    ]);
    const buttonText = button.add([text(label, { size: 20, width: buttonWidth - 20 }), anchor("center"), pos(buttonWidth / 2, buttonHeight / 2)]);
    const infoBubble = button.add([
        sprite('info'), 
        anchor("topright"),
        pos(buttonWidth - 10, -10),
        scale(infoBubbleHeight / 16), // Assuming the original height of the info sprite is 16
        area({ scale: 1.5 }),
        "infoBubble",
        { infoText }
    ]);
    infoBubble.onClick(() => {
        showInfoPopup(infoText);
        if (!isPaused) {
            togglePause("infoBubble"); // Ensure the game is paused when infoBubble is clicked
        }
    });
    button.onClick(() => {
        if (button.active) {
            button.action();
        }
    });
    buttons.push({ button, buttonText, infoBubble });
    return { button, buttonText, infoBubble };
}

// Enable or disable all buttons
function setButtonsActive(active) {
    buttons.forEach(({ button }) => {
        button.active = active;
        button.color = active ? button.originalColor : rgb(100, 100, 100);
    });
}

function showInfoPopup(infoText) {
    const popupWidth = width * 0.4;
    const popupHeight = height * 0.3;

    const infoPopup = add([
        rect(popupWidth, popupHeight),
        pos((width - popupWidth) / 2, (height - popupHeight) / 2),
        color(255, 255, 255),
        area(),
        "infoPopup",
    ]);
    const infoTextLabel = infoPopup.add([
        text(infoText, { size: 20, width: popupWidth - 40 }),
        pos(20, 20),
        color(0, 0, 0),
    ]);
    const closeButton = infoPopup.add([
        rect(100, 40),
        pos(popupWidth - 120, popupHeight - 60),
        color(200, 0, 0),
        area(),
        "closeButton",
    ]);
    const closeButtonText = closeButton.add([
        text("Close", { size: 20 }),
        anchor("center"),
        pos(50, 20),
    ]);

    // Pause the game
    togglePause("infoBubble");

    closeButton.onClick(() => {
        destroy(infoPopup);
        if (pauseReason === "infoBubble") {
            togglePause(); // Resume the game only if paused by infoBubble
        }
    });
}

function triggerBoycott() {
    // Pause the game
    togglePause("boycott");

    const popupWidth = width * 0.4;
    const popupHeight = height * 0.5;
    const imageSize = Math.min(popupWidth * 0.8, popupHeight * 0.8);
    const buttonWidth = imageSize / 2 - 10; // Two buttons should fit under the image with some margin
    const buttonHeight = height * 0.08;

    const boycottPopup = add([
        rect(popupWidth, popupHeight),
        pos((width - popupWidth) / 2, (height - popupHeight) / 2),
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

    const canPay = money >= treePrice * BOYCOTT_PENALTY_MULTIPLIER;
    const moneyPenaltyButton = boycottPopup.add([
        rect(buttonWidth, buttonHeight),
        pos((popupWidth + imageSize) / 2 - buttonWidth - 10, popupHeight - buttonHeight - 20),
        color(canPay ? rgb(0, 255, 0) : rgb(100, 100, 100)),
        area(),
        "moneyPenaltyButton",
    ]);
    const moneyPenaltyText = moneyPenaltyButton.add([
        text(`Pay $${treePrice * BOYCOTT_PENALTY_MULTIPLIER}`, { size: 20 }),
        anchor("center"),
        pos(buttonWidth / 2, buttonHeight / 2),
    ]);

    timePenaltyButton.onClick(() => {
        timeLeft = Math.max(0, timeLeft - BOYCOTT_PENALTY_TIME); // Deduct 30 seconds, ensure timeLeft doesn't go negative
        destroy(boycottPopup);
        if (pauseReason === "boycott") {
            togglePause(); // Resume the game only if paused by boycott
        }
        treesCut = 0; // Reset the counter
    });

    moneyPenaltyButton.onClick(() => {
        if (canPay) {
            money -= treePrice * BOYCOTT_PENALTY_MULTIPLIER;
            destroy(boycottPopup);
            if (pauseReason === "boycott") {
                togglePause(); // Resume the game only if paused by boycott
            }
            treesCut = 0; // Reset the counter
        }
    });
}

// === FINAL SCENE ===
function showFinalScene(win) {
    scene("final", () => {
        add([
            text(win ? "You Win!" : "Game Over", { size: 48 }),
            pos(width / 2, height / 4),
            anchor("center"),
        ]);

        add([
            text(`Trees Left: ${trees}`, { size: 24 }),
            pos(width / 2, height / 2 - 40),
            anchor("center"),
        ]);

        add([
            text(`Money Earned: $${money}`, { size: 24 }),
            pos(width / 2, height / 2),
            anchor("center"),
        ]);

        add([
            text(`Time Played: ${GAME_DURATION - Math.ceil(timeLeft)}s`, { size: 24 }),
            pos(width / 2, height / 2 + 40),
            anchor("center"),
        ]);

        const replayButton = add([
            rect(200, 50),
            pos(width / 2, height * 0.75),
            anchor("center"),
            color(0, 200, 0),
            area(),
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

// === PAUSE FUNCTIONALITY ===
let isPaused = false;
let originalCutDelay = cutDelay;
let originalLastCutTime = lastCutTime;
let playButton;
let pauseReason = null; // null signifie que le jeu n'est pas en pause.

function togglePause(reason = null) {
    if (!isPaused) {
        // Mise en pause
        isPaused = true;
        pauseReason = reason;
        originalCutDelay = cutDelay;
        originalLastCutTime = lastCutTime;
        cutDelay = Infinity;
        setButtonsActive(false);

        // Afficher le bouton "Play" uniquement si la raison est le bouton "Pause"
        if (reason === "pauseButton") {
            showPlayButton();
        }
    } else {
        // Reprendre le jeu
        isPaused = false;
        pauseReason = null;
        cutDelay = originalCutDelay;
        lastCutTime = originalLastCutTime;
        setButtonsActive(true);

        if (playButton) destroy(playButton); // Supprimer le bouton "Play"
    }
}


function createPauseButton(x, y, size, spriteName, onClickAction) {
    const button = add([
        sprite(spriteName, { width: size, height: size }),
        pos(x, y),
        anchor("center"),
        area(),
        "pauseButton",
    ]);

    button.onClick(() => {
        onClickAction("pauseButton");
    });

    return button;
}

function showPlayButton() {
    const playButtonSize = height / 4;
    playButton = createPauseButton(width / 2, height / 2, playButtonSize, "play", togglePause);
}

// === MAIN GAME SCENE ===
scene("main", () => {
    // Add background image
    const scaleRatio = Math.max(width / 400, height / 225);
    add([
        sprite("background"),
        pos(width / 2, height / 2),
        anchor("center"),
        scale(scaleRatio),
    ]);

    // UI Elements
    treesLabel = add([text("Trees: 0", { size: 24 }), pos(20, 20)]);
    protectedTreesLabel = add([text("Protected Trees: 0", { size: 24 }), pos(20, 50)]);
    moneyLabel = add([text("Money: $0", { size: 24 }), pos(20, 80)]);
    timeLabel = add([text("Time Left: 0s", { size: 24 }), pos(20, 110)]);

    // Boycott progress bar
    add([
        text("Boycott Risk", { size: 20 }),
        pos(20, 140),
    ]);
    boycottProgressBarBg = add([
        rect(width * 0.08, 20), // Shortened width
        pos(20, 170),
        color(200, 200, 200),
    ]);
    boycottProgressBar = add([
        rect(0, 20),
        pos(20, 170),
        color(255, 0, 0),
    ]);

    // Pause button
    const pauseButtonSize = height / 12;
    createPauseButton(width - pauseButtonSize - 20, 20, pauseButtonSize, "pause", togglePause);

    // Button dimensions
    const buttonY = height - height * 0.06 - 20;

    // Buttons
    const { button: cutButton, buttonText: cutButtonText } = createButton("Cut Tree", width * 0.05, buttonY, rgb(255, 0, 0), cutTree, "Coupez un arbre pour gagner de l'argent. Plus les arbres se font rares plus les arbres rapportent de l'argent mais attention le taux de génération est aussi réduit.");
    const { button: toolButton, buttonText: toolButtonText } = createButton(`Buy Tool ($${toolPrice})`, width * 0.3, buttonY, rgb(200, 200, 0), buyTool, "Achetez des haches pour réduire le délais d'abattage. Attention le prix augmente à chaque achat.");
    const { button: replantButton, buttonText: replantButtonText } = createButton(`Replant Tree ($${REPLANT_COST})`, width * 0.55, buttonY, rgb(0, 200, 0), replantTree, "Replantez un arbre en échange d'argent. Attention le temps de croissance est d'une minute, pensez à anticiper vos besoins futurs.");
    const { button: reserveButton, buttonText: reserveButtonText } = createButton(`Create Reserve ($${NATURE_RESERVE_COST})`, width * 0.8, buttonY, rgb(0, 0, 200), createNatureReserve, "Créez une réserve naturelle pour protéger 10 arbres par réserve. Attention les arbre protégés ne peuvent plus être abattus, mais en échange le risque de boycott est diminué.");

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
        if (!isPaused) {
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
        }
    });

    // Forest regeneration
    loop(1, regenerateForest);

    // Initialize game
    addNewTrees(trees);
    updateTreePrice();
    updateUI();
});

// === INSTRUCTION SCENE ===
scene("instructions", () => {
    // Add background image
    const scaleRatio = Math.max(width / 400, height / 225);
    add([
        sprite("background"),
        pos(width / 2, height / 2),
        anchor("center"),
        scale(scaleRatio),
    ]);

    // Instruction text
    add([
        text("Bienvenue dans Équilibre Forestier !\n\nObjectifs :\n1. À la fin des 5 minutes, vous devez :\n- Avoir au moins 30 arbres.\n- Posséder 20,000 dollars ou plus.\n\n2. Vous perdez si :\n- Le nombre d'arbres atteint 0 avant la fin du temps.\n\nAttention :\n- Couper des arbres augmente le risque de boycott.\n- Replanter des arbres réduit ce risque et aide à atteindre vos objectifs.\n\nBonne chance !", { size: 38, width: width * 0.8, align: "center" }),
        pos(width / 2, height / 4),
        anchor("center"),
        color(0, 0, 0), // Set text color to black
    ]);

    // Play button
    const playButton = add([
        rect(200, 50),
        pos(width / 2, height * 0.75),
        anchor("center"),
        color(0, 200, 0),
        area(),
        "playButton",
    ]);

    const playButtonText = playButton.add([
        text("Play", { size: 38 }),
        anchor("center"),
        pos(0, 0),
    ]);

    playButton.onClick(() => {
        go("main");
    });
});

// Start the game with the instruction scene
go("instructions");
