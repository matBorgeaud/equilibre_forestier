

kaboom({
    backgroundAudio: true,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1, // Pas de mise à l'échelle initiale, car nous utilisons les dimensions de l'écran
    stretch: true, // Étendre pour s'adapter à la taille de l'écran
    letterbox: true, // Ajouter des bandes noires pour conserver les proportions
    
});
  //La fonction précédente a été créée avec l'aide de ChatGPT avec le prompt: comment ajouter du texte pour qu'il ne se déforme pas au redimensionnement avec kaboomjs.

  // Fonction utilitaire pour insérer des retours à la ligne dans un texte
  function wrapText(text, maxLineLength) {
    let lines = [];
    let words = text.split(' ');
    let currentLine = '';

    for (let word of words) {
        if ((currentLine + word).length <= maxLineLength) {
            currentLine += word + ' ';
        } else {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        }
    }
    lines.push(currentLine.trim());
    return lines.join('\n');
}

// Calculer la longueur maximale des lignes en fonction de la largeur de l'écran
const fontSize = 40; // Taille de la police
const charWidth = fontSize / 2; // Largeur approximative d'un caractère (peut varier selon la police)
const maxLineLength = Math.floor((window.innerWidth - 40) / charWidth); // Ajuster pour la marge
//La fonction précédente a été créée avec l'aide de ChatGPT avec le prompt: comment ajouter du texte pour qu'il ne se déforme pas au redimensionnement avec kaboomjs.

const pad = 50


loadSprite("treeButton", "assets/image/tree_2.png");
loadSprite("titre", "assets/image/titre.png");
loadSprite("play", "assets/image/play.gif");
loadSprite("layer1", "forest background layers/Forest layer3.png");
loadSprite("layer9", "forest background layers/Forest layer9.png");
loadSprite("layer3", "forest background layers/Forest layer3.png");
loadSound("buy", "assets/sons/buy.mp3")
loadSound("woodcrack", "assets/sons/wood_crack.mp3")
loadSound("boom", "assets/sons/boom.mp3")
loadSound("musique", "assets/sons/musique.mp3")

xWiddth = document.documentElement.clientWidth
yWiddth = document.documentElement.clientHeight
scaleRatio = xWiddth / 384

scene("acceuil", () => {
    // Charger les images
for (const image of images) {
    loadSprite(image.name, image.path);
  }
  
  // Créer les couches d'images en utilisant le tableau
  const layers = [];
  
  for (const image of images) {
    const img = add([
      sprite(image.name),
      pos(width() / 2, height() / 2),
      anchor("center"),
      scale(scaleRatio),
    ]);
    layers.push({ name: image.name, layer: img });
  }
  //La fonction précédente a été créée avec l'aide de ChatGPT avec le prompt: supperpose moi plusieurs images d'un tableau
   
    onKeyPress("space", () => {
        go("instruction");
    })
    add([
        text("Vous êtes vous déjà demandé jusqu'à quel point vous pouvez abattre une forêt. Pour le savoir appuyez sur espace.", {
            
            
            width: width() - pad * 2,
            align: "center",
            lineSpacing: 8,
            letterSpacing: 4,
        }),
        pos(24, 130),
      
        
    ]);
})

scene("instruction", () => {
       // Charger les images
for (const image of images) {
    loadSprite(image.name, image.path);
  }
  
  // Créer les couches d'images en utilisant le tableau
  const layers = [];
  for (const image of images) {
    const img = add([
      sprite(image.name),
      pos(width() / 2, height() / 2),
      anchor("center"),
      scale(scaleRatio),
    ]);
    layers.push({ name: image.name, layer: img });
  }
  

add([
    text("Il va falloir abattre l'arbre du centre. Appuyez sur espace.", {
		
		
		width: width() - pad * 2,
		align: "center",
		lineSpacing: 8,
		letterSpacing: 4,
    }),
    pos(24, 130),
  
    
]);


    onKeyPress("space", () => {
        go("main");
    })

})

scene("main", () => {

   
    const musique = play("musique", {
        loop: true,
        paused: false,
    })  
      
      
// Charger les images
for (const image of images) {
    loadSprite(image.name, image.path);
  }
  
  // Créer les couches d'images en utilisant le tableau
  const layers = [];
  for (const image of images) {
    const img = add([
      sprite(image.name),
      pos(width() / 2, height() / 2),
      anchor("center"),
      scale(scaleRatio),
    ]);
    layers.push({ name: image.name, layer: img });
  }
  
  // Fonction pour retirer la dernière couche
  function removeTopLayer() {
    if (layers.length > 0) {
      const topLayer = layers.pop(); // Retirer la dernière couche du tableau
      destroy(topLayer.layer);
    }
  }
      

    const compteurArbre = add([
        text("0"),
        pos(xWiddth*0.4, yWiddth*0.1),
        z(100),
        { value: 0, arbreTotal: 0 },
    ]);

    const longueurTableau = database.bonus.length;
    
    const cases = []; // Tableau pour stocker les références des cases

    const screenWidth = width();
    const screenHeight = height();
    const caseWidth = screenWidth / 3.3;
    const caseHeight = screenHeight; 
    
// Créer une grande case sur le quart droit de l'écran
// add([
//     rect(caseWidth, caseHeight), // Crée un rectangle avec les dimensions définies
//     pos(screenWidth - caseWidth, 0), // Positionner la case sur le quart droit
//     color(204, 204, 204) 
// ]);


const txtStyle = {
    size: 50, 
    color: rgb(255, 255, 255), 
};

add([
    text("Bonus", txtStyle),
    pos(screenWidth - caseWidth / 2, screenHeight / 20),
    anchor("center"), // Centrer le texte
]);
// fonction fabriquée avec ChatGPT: comnment faire une case en kaboomjs


    for (let i = 0; i < longueurTableau; i++) {
        loadSprite(database.bonus[i].name, database.bonus[i].assetLocation); 
        var colorPrix = (0, 0, 255);
        function updateColorPrix() {
            if (compteurArbre.value <= database.bonus[i].prix) {
               CasePrix.color = RED; 
            }
            else {
                CasePrix.color = GREEN;
            }
        }
        
        const y = 300 + 100*i;
        const CaseAmelioration = add([
            rect (500, 100),
            pos(1520, y),
            outline(4),
            anchor("center"),
            area(),
            `${'caseBonus'+i}`
        ]);
        const CaseQuantite = add([
            text(database.bonus[i].quantite),
            color(0, 0, 255),
            pos(1420, y-30),
        ]);
        const CasePrix = add([
            text(database.bonus[i].prix),
            color(0, 0, 255),
            pos(1660, y),
        ]);

        CaseAmelioration.add([
            sprite(database.bonus[i].name),
            pos(-220,0),
            scale(0.13),
           
        ]);

        function updatePrix() {
            database.bonus[i].prix = database.bonus[i].prix * 1.15;
            
        }

        onUpdate(() => {
            updateColorPrix()
        })
        
        onClick("caseBonus"+i, () => {
            if (compteurArbre.value >= database.bonus[i].prix) {
                compteurArbre.value = compteurArbre.value - database.bonus[i].prix;
                compteurArbre.text = Math.round(compteurArbre.value * 10)/10; 
                database.bonus[i].quantite += 1;
                queryDB();
                updatePrix();
                CaseQuantite.text = database.bonus[i].quantite;    
                CasePrix.text = Math.round(database.bonus[i].prix);
                console.log(database.bonus[i].name + " acheté");
                play("buy")
                
            }  
        });

    }

    const treeButton = add([
        sprite("treeButton"),
        pos(width()/ 2.54, height() / 1.6),
        anchor("center"),
        scale(3.6),
        area(),
        "treeButton"
         
    ]);

    onKeyPress("space", (t) => {
        play("woodcrack")
        abattreArbre();
        function zoomOut(t){
            t.width  = t.width   * CLICK_JUMP;
            t.height = t.height  * CLICK_JUMP;
            wait(0.1, () => {
                t.width  = t.width  / CLICK_JUMP;
                t.height = t.height / CLICK_JUMP;
            })
        }
        zoomOut(t); 
    })

    onClick("treeButton", (t) => {
        play("woodcrack")
        abattreArbre();
        function zoomOut(t){
            t.width  = t.width   * CLICK_JUMP;
            t.height = t.height  * CLICK_JUMP;
            wait(0.1, () => {
                t.width  = t.width  / CLICK_JUMP;
                t.height = t.height / CLICK_JUMP;
            })
        }
        zoomOut(t);
        
        
        
    });

    function abattreArbre(){
        vitesseAbattage = 1 + vitesseDonneeParBonus;
        console.log(vitesseAbattage);
        compteurArbre.value = compteurArbre.value + vitesseAbattage * efficacite;
        compteurArbre.arbreTotal = compteurArbre.arbreTotal + vitesseAbattage * efficacite;
        compteurArbre.text = Math.round(compteurArbre.value * 10)/10;
        console.log("nombre d'arbres abattus: " + compteurArbre.value);
        verifierPuissanceDeQuatre(compteurArbre.arbreTotal);
        
    }
    
  

    let historiquePuissancesDeQuatre = new Set();

    function verifierPuissanceDeQuatre(quantiteCookies) {
        let puissanceActuelle = 150;
        while (puissanceActuelle <= quantiteCookies) {
            if (!historiquePuissancesDeQuatre.has(puissanceActuelle)) {
                console.log(`Félicitations ! Vous avez atteint ou dépassé ${puissanceActuelle} cookies, une puissance de 2.`);
                historiquePuissancesDeQuatre.add(puissanceActuelle);
                efficacite = efficacite * 0.6;
                shake(240);
                removeTopLayer();
                play("boom");
                if (puissanceActuelle > 8700) {
                    
                    go("fin")
                }
                
            }
            puissanceActuelle *= 3.95;
        }
    }   
    // cette fonction a été générée avec l'aide de chatGPT, voici le prompt utilisé: fais moi une fonction js qui vérifie si x a atteint ou dépassé une puissance de 4 non encore atteinte par le passé. Le résultat de chatGPT ne correspond pas tout à fait les variables doivent notamment être adaptées

});

scene("fin", () => {
    const img = add([
        sprite("layer9"),
        pos(width() / 2, height() / 2),
        anchor("center"),
        scale(scaleRatio),
      ]);
      const img2 = add([
        sprite("layer1"),
        pos(width() / 2, height() / 2),
        anchor("center"),
        scale(scaleRatio),
      ]);
      const texte = add([
        text("Difficile d'abattre des arbres maintenant qu'il n'y en a plus et que la forêt ne se régénera pas. Vous avez déjà probablement remarqué qu'indépendamment des bonus il était plus difficile de les abattre. Si vous y avez déjà joué plusieurs fois et que le résultat est toujours le même c'est qu'il est peut-être tant d'arrêter d'y jouer pour espérer gagner",{
            width: width() - pad * 2,
		align: "center",
		lineSpacing: 8,
		letterSpacing: 4,
        }),
        pos(24, 130),
        
        
    ])
    onKeyPress("space", (t) => {
        resetQuantite(database);
        var compteurArgent = 0;
        var prixArbre = 1;
        var vitesseAbattage = 1;
        var efficacite = 1;
        go("pageAcceuil")
    })
})



scene("pageAcceuil", () => {
    scaleRatioTitre = document.documentElement.clientWidth / 1920
    const img = add([
       sprite("titre"),
       anchor("center"),
       pos(width()/2, height() / 2),
       scale(scaleRatioTitre)
        
        
    ])
    const play = add([
        sprite("play"),
        anchor("center"),
        scale(0.4),
        pos(width() / 2, height() / 2),
        area(),
        "play"


         
         
     ])
    onKeyPress("space", (t) => {
        go("acceuil")
    })
    onClick("play", () => {
        go("acceuil")
    });

})

// Lancement de l'acceuil
go("pageAcceuil")