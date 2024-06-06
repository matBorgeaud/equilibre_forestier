

kaboom();


loadSprite("treeButton", "assets/image/tree_2.png");
loadSprite("layer1", "forest background layers/Forest layer3.png");

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
      scale(4.67),
    ]);
    layers.push({ name: image.name, layer: img });
  }
    const texte = add([
        text("Vous êtes vous déjà demandez jusqu'à quel point vous pouvez abattre une forêt"),
        pos(24, 130),
        
        
    ])
    const texte2 = add([
        text("pour le savoir appuyez sur espace"),
        anchor("center"),
        pos(width()/2, height()/2),
        
        
    ])
    onKeyPress("space", () => {
        go("main");
    })
})


scene("main", () => {

   

      
      
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
      scale(4.67),
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
        pos(24, 24),
        z(100),
        { value: 0, arbreTotal: 0 },
    ]);

    const longueurTableau = database.bonus.length;
    
    const cases = []; // Tableau pour stocker les références des cases


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
        const TestCase = add([
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

        TestCase.add([
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
                
            }  
        });

    }

    const treeButton = add([
        sprite("treeButton"),
        pos(690, 620),
        anchor("center"),
        scale(3.6),
        area(),
        "treeButton"
         
    ]);

    onKeyPress("space", (t) => {
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
    
    // function updateColorPrix(){
    //     for (let i = 0; i < longueurTableau; i++) {
    //         var colorPrix = (0, 0, 255);
    //         if (compteurArbre.value <= database.bonus[i].prix) {
    //           colorPrix = (0, 0, 220);
    //         }
    // }

    let historiquePuissancesDeQuatre = new Set();

    function verifierPuissanceDeQuatre(quantiteCookies) {
        let puissanceActuelle = 150;
        while (puissanceActuelle <= quantiteCookies) {
            if (!historiquePuissancesDeQuatre.has(puissanceActuelle)) {
                console.log(`Félicitations ! Vous avez atteint ou dépassé ${puissanceActuelle} cookies, une puissance de 2.`);
                historiquePuissancesDeQuatre.add(puissanceActuelle);
                efficacite = efficacite * 0.65;
                shake(240);
                removeTopLayer();
                if (puissanceActuelle > 8700) {
                    
                    go("acceuil")
                }
                
            }
            puissanceActuelle *= 3.95;
        }
    }   

});



// Lancement de k'acceuil
go("acceuil");
