const Meyda = require("meyda");
const p5 = require("p5");
const dat = require("dat.gui");
let lastFeatures;
function prepareMicrophone(callback) {
    navigator.mediaDevices.getUserMedia({audio:true, video:false}).then((stream) => {
        const context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        callback(context, source);
    });
}
prepareMicrophone((context, source) => {
    let newBlock = document.createElement("h1");
    newBlock.innerHTML = "Microphone on!";
    document.body.appendChild(newBlock);
    const analyzer = Meyda.createMeydaAnalyzer({
        audioContext: context,
        source: source,
        bufferSize: 2048,
        featureExtractors: ["loudness", "chroma"],
        callback: (features) => {
            lastFeatures = features;
            //passes features to lastFeatures which is global
        }
    });
    analyzer.start();
});
// p5


const basicDrawing = (p) => {
    p.setup = () => {
        p.createCanvas(700, 400);
        p.background(10, 255, 10);
    };
    p.draw = () => {
        p.colorMode(p.RGB, 255);
        p.background(255, 255, 255);
        if (lastFeatures){
        p.noFill();
        // specific will be an array of 24 values
        lastFeatures.loudness.specific.forEach((loudness, i) =>{
            const radius = loudness * 100;
            p.colorMode(p.HSB, 255);
            p.strokeWeight(6);
            const hue = 255 * i / lastFeatures.loudness.specific.length;
            p.stroke(hue, 255, 255, 100);
            p.ellipse(p.width / 2, p.height / 2, radius, radius);
        });
        }
    }
};

const chromaDrawing = (p) => {
    let isArrayCreated;
    let colorArray;
    

    const params = {
        scale: 15,
        color1: [30,87,132],
        color2: [255,150,144],
        color3: [254,224,190],
    }
    const gui = new dat.GUI();
    let oldChroma;
    let oldLoudness;
    gui.add(params, "scale", 0, 30);
    var f1 = gui.addFolder('Colors');
    f1.addColor(params, 'color1');
    f1.addColor(params, 'color2');
    f1.addColor(params, 'color3');


    p.setup = () => {
        p.createCanvas(700, 700);
        p.background(10, 255, 10);
        
    };
    
    p.draw = () => {
        p.colorMode(p.RGB, 255);
        p.background(20, 20, 20);
        if (lastFeatures){
            let channels = lastFeatures.chroma.length;
            
            //use colors to create a gradient for chroma channels
            if(!isArrayCreated) colorArray = interpolateColors(params.color1, params.color2, params.color3, channels);
            
            
            if(oldChroma === undefined){
                oldChroma = lastFeatures.chroma;
            }
            //weighted average of previous chroma value and last chroma value
            const mixedChroma = oldChroma.map((val, i) => {
                return oldChroma[i] * 0.90 + lastFeatures.chroma[i] * 0.1;
            })
            oldChroma = mixedChroma;

            //create array to smooth loudness values
            if(oldLoudness === undefined){
                oldLoudness = new Array(10).fill(0);
                oldLoudness[oldLoudness.length -1] = lastFeatures.loudness.total;
            }
            // update loudness array
            oldLoudness = loudnessArray(oldLoudness); 
            
            //average loudness across array
            let total = 0;
            for(let i = 0; i < oldLoudness.length; i++ ){
                total += oldLoudness[i];
            }
            let avgLoudness = total/oldLoudness.length;
            console.log("Current loudness: " + lastFeatures.loudness.total + " Avg: " + avgLoudness);
            

            
            //create the visualizer
            mixedChroma.forEach((c,i) =>{
                const radius = params.scale;
                let l = avgLoudness / 24;
                const color = p.color(colorArray[i][0],colorArray[i][1],colorArray[i][2]);
                drawCircles(color, i, c, l, radius);

            });

        }
    }

    function drawCircles(color, i, c, l,r){
        p.colorMode(p.RGB, 255);
        p.noStroke();
        p.fill(color);

        let offset = 30;
        let x_start = p.width/2 - (i*offset);
        let y_start = p.height/2;
        let circumference = x_start * Math.PI * 2;
        let arcLength = circumference * (c/10) *l;
        for(let j =0; j< arcLength ; j++){
            let angleStep = j / x_start;
            let x = p.width/2 - (Math.cos(angleStep * l) * x_start);
            let y = (p.height/2) - (Math.sin(angleStep * l) * x_start);      
            p.ellipse(x,y,r*c, r*c);
        }
        for(let j =0; j< arcLength ; j++){
            let angleStep = j / x_start;
            let x = p.width/2 + (Math.cos(angleStep * l) * x_start);
            let y = (p.height/2) + (Math.sin(angleStep * l) * x_start);      
            p.ellipse(x,y,r*c, r*c);
        }

    }
};

function interpolateColors(color1, color2, color3, steps){
    steps = steps/2;
    const stepFactor = 1/ (steps-1);
    let interpolatedColorArray = [];

    for(var i = 0; i < steps; i++) {
        interpolatedColorArray.push(interpolateColor(color1, color2, stepFactor * i));
    }
    for(var i = 0; i < steps; i++) {
        interpolatedColorArray.push(interpolateColor(color2, color3, stepFactor * i));
    }
    isArrayCreated = true;
    return interpolatedColorArray;
}

function interpolateColor(color1, color2, factor) {
    if (arguments.length < 3) { 
        factor = 0.5; 
    }
    var result = color1.slice();
    for (var i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
};

function loudnessArray(oldLoudness) {
    oldLoudness.splice(0,1);
    oldLoudness.push(lastFeatures.loudness.total);
    return oldLoudness;
}

//const myp5 = new p5(basicDrawing, "main");
const myp5 = new p5(chromaDrawing, "main");

