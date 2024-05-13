var mainCanvas = document.getElementById("canvas"),
  recordingCtx,
  chunks = [],
  recorder,
  switchInterval;

function startRecording() {
  //   var recordingCanvas = mainCanvas;
  //   recordingCtx = recordingCanvas.getContext("2d");
  //   // draw one of the canvases on our recording one
  //   //   recordingAnim();
  //   // init the MediaRecorder
  //   recorder = new MediaRecorder(recordingCtx.canvas.captureStream(30));
  //   recorder.ondataavailable = saveChunks;
  //   recorder.onstop = exportVideo;
  //   recorder.start();
  //   setTimeout(() => stopRecording(), 3000);
}

// function saveChunks(evt) {
//   // store our final video's chunks
//   if (evt.data.size > 0) {
//     chunks.push(evt.data);
//   }
// }

// function stopRecording() {
//   // stop everything, this will trigger recorder.onstop
//   recorder.stop();
//   //   stopCanvasAnim();
//   //   a.style.display = b.style.display = "none";
//   //   this.parentNode.innerHTML = "";
//   //   recordingCtx.canvas.parentNode.removeChild(recordingCtx.canvas);
// }
// // when we've got everything

// function exportVideo() {
//   vid.src = URL.createObjectURL(new Blob(chunks));
// }

// // some fancy drawings
function initCanvasDrawing() {
  var aCtx = mainCanvas.getContext("2d");

  var objects = [],
    w = mainCanvas.width,
    h = mainCanvas.height;
  aCtx.fillStyle = "ivory";
  // taken from http://stackoverflow.com/a/23486828/3702797
  //   for (var i = 0; i < 100; i++) {
  //     objects.push({
  //       angle: Math.random() * 360,
  //       x: 100 + (Math.random() * w) / 2,
  //       y: 100 + (Math.random() * h) / 2,
  //       radius: 10 + Math.random() * 40,
  //       speed: 1 + Math.random() * 20,
  //     });
  //   }
  var stop = false;
  var draw = function () {
    aCtx.fillRect(0, 0, w, h);
    // for (var n = 0; n < 100; n++) {
    //   var entity = objects[n],
    //     velY = Math.cos((entity.angle * Math.PI) / 180) * entity.speed,
    //     velX = Math.sin((entity.angle * Math.PI) / 180) * entity.speed;

    //   entity.x += velX;
    //   entity.y -= velY;

    //   aCtx.drawImage(imgA, entity.x, entity.y, entity.radius, entity.radius);

    //   entity.angle++;
    // }
    if (!stop) {
      requestAnimationFrame(draw);
    }
  };

  var imgA = new Image();
  imgA.onload = function () {
    draw();
    // startRecording();
  };
  imgA.crossOrigin = "anonymous";
  imgA.src = "https://dl.dropboxusercontent.com/s/4e90e48s5vtmfbd/aaa.png";

  return function () {
    stop = true;
  };
}

// initCanvasDrawing();
