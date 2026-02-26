import kaplay from "kaplay";
import { scaleFactor } from "./constants.js";
import { displayDialogue, setCamScale } from "./utils.js";



const k = kaplay({
    canvas: document.getElementById("game"), 
    background: [128, 0, 128],
    global: true,
});

//Loading of sprites & sounds etc .
k.loadSprite("spritesheet", "./spritesheet.png",{
    sliceX:39,
    sliceY:31,
    anims:{
        "idle-up": 862,
        "walk-up": { from: 862, to: 863, loop: true, speed: 8 },
        
        "idle-side": 903,
        "walk-side": { from: 903, to: 904, loop: true, speed: 8 },
        
        "idle-down": 901,
        "walk-down": { from: 901, to: 902, loop: true, speed: 8 },
        },
    
})

k.loadSprite("map", "./map.json.png");
k.setBackground(k.Color.fromHex("#311047"));

// Loading sound effects 
k.loadSound("blip", "./sounds/interface/appear-online.ogg");
k.loadSound("typing","./sounds/interface/click.ogg" );






//Scene creation 
k.scene("main", async () => {
    const response = await fetch("./map.tmj");
    const mapData = await response.json();
    const layers = mapData.layers;
    
    const map = k.add([
        k.sprite("map"),
        k.pos(0),
        k.scale(scaleFactor),
    ]);

    //player creation 
    const player = k.make([
        k.sprite("spritesheet",{anim:"idle-down"}),
        k.area({
            shape: new k.Rect(k.vec2(0,3),10,10)
        }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        {
            speed: 250,
            direction: "down",
            isInDialogue: false,
        },
        "player",
    ]);


    //doing background 
    for (const layer of layers){
        if (layer.name === "boundaries") {
            for (const boundary of layer.objects) {
                // sPrepare the componrents that ALL boundaries have
                const components = [
                    k.area({
                    shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
                    }),
                    k.body({ isStatic: true }),
                    k.pos(boundary.x, boundary.y),
                    boundary.name,
                ];

                if (boundary.name !== "Wall") {
                    const customMsg = boundary.properties?.find(p => p.name === "message")?.value;
                    components.push("interactable");
                    components.push({ msg: customMsg || boundary.name });
                }

                
                map.add(
                    components,
                    { name: boundary.name },
                );
            }
        }
        
        //Adding spawnpoint 
        if (layer.name === "spawnpoint") {
            const spawn = layer.objects.find(o => o.name === "Spawnpoint");
            if (spawn) {
                player.pos = k.vec2(spawn.x * scaleFactor, spawn.y * scaleFactor);
                k.add(player);
            }
        }
        continue;
    };

    // Space key (Logic)
    k.onKeyPress("space", () => {
    // Find all interactable objects (including those inside the map)
    const items = k.get("interactable", { recursive: true });

    
    items.sort((a, b) => player.worldPos().dist(a.worldPos()) - player.worldPos().dist(b.worldPos()));
    
    const closest = items[0];

    
        if (closest && player.worldPos().dist(closest.worldPos()) < 100 && !player.isInDialogue) {
            player.isInDialogue = true;

            // Trigger the dialogue with just the boundary name (closest.msg)
            displayDialogue(k, closest.msg, () => {
                player.isInDialogue = false;
            }, true); // If the name is "Tent", show the resume button(NEED to figure out)
        }
    });
    


    //camera scaling for different aspect ratios 
    setCamScale(k);

    k.onResize(() => {
        setCamScale(k);
    });


    //camera position for player 
    k.onUpdate(() => {
        k.camPos(player.pos.add(k.vec2(0, 100)));;
    });



    //movement logic (Using mouse)
    k.onMouseDown((mouseBtn) => {
        if (mouseBtn !== "left" || player.isInDialogue) return;

        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTo(worldMousePos, player.speed);


        const mouseAngle = player.pos.angle(worldMousePos);


        
        // UP movement 
        if (mouseAngle >= -135 && mouseAngle <= -45) {
            if (player.curAnim() !== "walk-up") player.play("walk-up");
            player.direction = "up";
        }

        // DOWN movement 
        else if (mouseAngle >= 45 && mouseAngle <= 135) {
            if (player.curAnim() !== "walk-down") player.play("walk-down");
            player.direction = "down";
        }

        // SIDE movement (Everything else: Left or Right)
        else {
            if (player.curAnim() !== "walk-side") player.play("walk-side");
            
            // Flip the sprite if clicking to the left (Left is > 135 or < -135)
            player.flipX = (mouseAngle > 135 || mouseAngle < -135);
            player.direction = "side";
        }
    });



    k.onUpdate(() => {
        if (player.isInDialogue) return;

        const moveDir = k.vec2(0, 0);

        // Check keys and update direction vector
        if (k.isKeyDown("a") || k.isKeyDown("left")) moveDir.x = -1;
        if (k.isKeyDown("d") || k.isKeyDown("right")) moveDir.x = 1;
        if (k.isKeyDown("w") || k.isKeyDown("up")) moveDir.y = -1;
        if (k.isKeyDown("s") || k.isKeyDown("down")) moveDir.y = 1;

        if (moveDir.x !== 0 || moveDir.y !== 0) {
            // Move the player
            player.move(moveDir.unit().scale(player.speed));

            // Animation Handling
            if (moveDir.x !== 0) {
                player.flipX = moveDir.x > 0;
                if (player.curAnim() !== "walk-side") player.play("walk-side");
                player.direction = "side";
            } else if (moveDir.y < 0) { //Press W 
                if (player.curAnim() !== "walk-down") player.play("walk-down");
                player.direction = "down";
            } else if (moveDir.y > 0) { //Press S 
                if (player.curAnim() !== "walk-up") player.play("walk-up");
                player.direction = "up";
            }
        } else {
            // If no keys are pressed AND no mouse is down, go to idle
            if (!k.isMouseDown("left") && player.curAnim()?.startsWith("walk")) {
                player.play(`idle-${player.direction}`);
            }
        }
    });



});

k.go("main");