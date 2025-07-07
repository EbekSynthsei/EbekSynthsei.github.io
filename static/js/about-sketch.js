// Moved the aboutSketch function to this file
function aboutSketch(p) {
    console.log('Initializing p5.js Sketch');
    var seed = Math.random() * 1000;
    var xOff;
    var color1, color2;
    let colorbg;
    var grad;
    let filter;

    p.setup = function () {
        const aboutContainer = document.getElementById('about'); // Change parent to the entire about section
        if (!aboutContainer) {
            console.error('Error: #about section not found in the DOM.');
            return;
        }
        const canvas = p.createCanvas(aboutContainer.scrollWidth, aboutContainer.scrollHeight);
        canvas.parent('about'); // Parent the canvas to the entire about section
        canvas.addClass('p5Canvas'); // Apply the p5Canvas class

        // Force a reflow to ensure styles are applied
        const reflow = canvas.elt.offsetHeight;
        loadColorsFromJSON().then(colorsData => {
            if (colorsData) {
                const colorGroups1 = ["colors1", "colors2", "colors3", "colors4", "colors5"];
                const colorGroups2 = ["colors12", "colors22", "colors32", "colors42", "colors52"];
                color1 = colorsData[p.random(colorGroups1)];
                color2 = colorsData[p.random(colorGroups2)];

                // Store palette globally for other sketches
                window.aboutSketchPalette = {
                    color1: color1,
                    color2: color2,
                    colorbg: colorbg
                };

                const isDarkMode = document.body.classList.contains('dark-mode');
                colorbg = isDarkMode ? "#000000" : "#ffffff";
            } else {
                console.error('Failed to load colors data.');
            }
        });
        xOff = -100;
        filter = new makeFilter(aboutContainer.scrollWidth, aboutContainer.scrollHeight);
    };

    p.draw = function () {
        const isDarkMode = document.body.classList.contains('dark-mode');
        colorbg = isDarkMode ? "#000000" : "#ffffff";
        p.randomSeed(seed);
        p.background(colorbg);
        p.noStroke();
        let mountain_h = p.height / p.int(p.random(10, 30));
        for (let n = 0; n < p.height; n += mountain_h) {
            p.push();
            p.translate(0, p.height - n);
            grad = p.drawingContext.createLinearGradient(0, -mountain_h, 0, mountain_h);
            grad.addColorStop(0, p.random(color1));
            grad.addColorStop(1, p.random(color2));
            p.drawingContext.fillStyle = grad;
            p.beginShape();
            p.curveVertex(-n, n);
            for (let i = xOff; i < p.width + 100; i += 50) {
                let pOffset = p.random(-50, 50);
                p.curveVertex(i, p.sin(i) * pOffset);
            }
            p.curveVertex(p.width + n, n);
            p.endShape(p.CLOSE);
            p.pop();
        }
        p.image(overAllTexture, 0, 0);
        p.noLoop();
    };

    function makeFilter(width, height) {
        p.colorMode(p.HSB, 360, 100, 100, 100);
        p.drawingContext.shadowColor = p.color(0, 0, 5, 95);
        p.clear();
        overAllTexture = p.createGraphics(width, height);
        overAllTexture.loadPixels();
        for (var i = 0; i < width; i++) {
            for (var j = 0; j < height; j++) {
                overAllTexture.set(
                    i,
                    j,
                    p.color(
                        0,
                        0,
                        0,
                        p.noise(i / 3, j / 3, (i * j) / 50) * p.random(5, 15)
                    )
                );
            }
        }
        overAllTexture.updatePixels();
    }

    p.windowResized = function () {
        const aboutContainer = document.getElementById('about');
        if (aboutContainer) {
            p.resizeCanvas(aboutContainer.scrollWidth, aboutContainer.scrollHeight);
            makeFilter(parseFloat(getComputedStyle(aboutContainer).width), parseFloat(getComputedStyle(aboutContainer).height)); // Recreate the filter on resize
            p.redraw();
        }
    };

    document.addEventListener('darkModeToggled', () => {
        console.log('Dark mode toggled, redrawing sketch');
        p.redraw();
    });
}

function loadColorsFromJSON() {
    return fetch('../assets/aboutColors.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error loading colors JSON:', error);
            return null;
        });
}