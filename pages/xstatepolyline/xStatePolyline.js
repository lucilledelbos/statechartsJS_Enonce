import Konva from "konva";
import { createMachine, interpret } from "xstate";


const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAEx8iAFgCMAVgDM2vgDZNAdgAcm85oA0ITInWL1RAJz71Ro4o07t+vuoC+-tZoWHiERBAATgCGAO4EUBRMsADG0chg-EJIIGhiktKyCggAtBpEZiaqTjpGTtVOLta2COr6RIp6VVrmTnwmbYHBGDgExFFxCRQAQtEpANawyHOZgrJ5ElIyOcWqus6uio0eTkbmqkbNiCXamkR8nqqqhtom9Q5GQ7kjYeMx8fhErRGKwONwsutRJtCjtEE9FB11Oo9PpXiYTB4rDYlPYiEY+E5tE83k4kYpNIoviFRuEJgCgfRmGxOLx1NkRPktkU4dojER1CY+HwnmTXHwsS1VH41I1Ua58YpMVSfmMIv8psDmLQAGpMCE5DYFbagYrqFxEXz6VyC-TuIwCxRXBCKvmoxT6UnGYVIpzK0KqulTJj4cRgSL6jnQ43ya6KOMHYUuHxORQmTxOkpVIjGJFGW6qVNmkz6QJBED4VAQOCQ-2ESGcmEm2P4hPVOUptOqDNuRx50wXDE6F4lsvU34kMhgetR7mldR7CrGPaaUlGAuC7RO5HtRqNQXF-TopwYv00v6TQHTo2zhx3Uy84UY3RPAtb3n3IUPGru5SC1Sl-wgA */
        id: "polyLine",

        initial: "idle",
        states : {
            idle: {
                on: {
                    MOUSECLICK: {
                        actions : "createLine",
                        target : "drawing"}
                }
            },

            drawing: {
                on: {
                    Escape: {actions :"abandon", target :"idle"},

                    Backspace: {
                        actions: "removeLastPoint",
                        cond: "plusDeDeuxPoints",
                        target: "drawing",
                        internal: true
                    },
                    
                    MOUSECLICK: [{
                        target: "drawing",
                        internal: true,
                        cond: "pasPlein",
                        actions : "addPoint"
                    }, {
                        actions : ["saveLine","addPoint"],
                        target :"idle"
                    }],

                    MOUSEMOVE: {
                        actions:"setLastPoint",
                        internal:true 
                    }
                    ,

                    Enter: {
                        actions: "saveLine",
                        cond: "plusDeDeuxPoints",
                        target: "idle",
                        internal : true

                    }
                }
            }
    }
},
    // Quelques actions et guardes que vous pouvez utiliser dans votre machine
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                polyline.remove();
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                return polyline.points().length < MAX_POINTS * 2;
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 4;
            },
        },
    }
);

// On démarre la machine
const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();
// On envoie les événements à la machine
stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineService.send(event.key);
});
