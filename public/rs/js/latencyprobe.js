// Explicit development tool (?latencyProbe=1). Requires StreamingLatencyProbe.InstallMarker in Unity.
// It uses the existing keyboard/remoting channel and detects the returned marker in decoded video.
import { configureVideoReceiver, getVideoJitterBufferTarget } from './receiverlatency.js';
export function installLatencyProbe(player, container, getReceivers) {
  const buffer = document.createElement('button');
  let minimum = getVideoJitterBufferTarget(window.RENDER_STREAMING_CONFIG) === 0;
  buffer.textContent = minimum ? 'Use automatic video buffer' : 'Use minimum video buffer';
  container.append(buffer);
  buffer.addEventListener('click', () => {
    minimum = !minimum;
    const receivers = getReceivers().filter(receiver => receiver.track.kind === 'video');
    for (const receiver of receivers) {
      configureVideoReceiver(receiver, minimum ? 0 : null);
    }
    buffer.textContent = minimum ? 'Use automatic video buffer' : 'Use minimum video buffer';
  });
  const button = document.createElement('button');
  button.textContent = 'Measure input latency';
  const output = document.createElement('output');
  output.id = 'latencyProbeResult';
  container.append(button, output);
  const cameraMode = document.createElement('button');
  cameraMode.textContent = 'Probe keyboard response';
  let camera = false;
  cameraMode.addEventListener('click', () => {
    camera = !camera;
    cameraMode.textContent = camera ? 'Probe camera response' : 'Probe keyboard response';
  });
  container.append(cameraMode);
  button.addEventListener('click', async () => {
    button.disabled = true;
    cameraMode.disabled = true;
    delete output.dataset.samples;
    output.textContent = 'Measuring 30 input-to-video frames…';
    const video = player.videoElement;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const samples = [];
    function send(pressed) {
      player.sender.keyboard.queueEvent({ type: pressed ? 'keydown' : 'keyup', code: 'ScrollLock' });
      player.sender._queueStateEvent(player.sender.keyboard.currentState, player.sender.keyboard);
      if (camera) {
        if (!player.sender.mouse.currentState) player.sender.mouse.queueEvent({type:'mousemove', clientX:0, clientY:0, movementX:0, movementY:0, buttons:0});
        player.sender.mouse.currentState.delta = [pressed ? 20 : -20, 0];
        player.sender.mouse.currentState.buttons = new Uint16Array([2]).buffer;
        player.sender._queueStateEvent(player.sender.mouse.currentState, player.sender.mouse);
      }
    }
    function waitMarker(pressed, start) {
      return new Promise((resolve, reject) => {
        let callback;
        const timeout = setTimeout(() => {
          video.cancelVideoFrameCallback(callback);
          reject(new Error('Marker timed out. Install the Unity marker first.'));
        }, 3000);
        const check = (now) => {
          context.drawImage(video, video.videoWidth * .025, video.videoHeight * .025, 1, 1, 0, 0, 1, 1);
          const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
          if (pressed ? g > 150 && r < 100 && b < 100 : r < 50 && g < 50 && b < 50) {
            clearTimeout(timeout);
            resolve(now - start);
          } else callback = video.requestVideoFrameCallback(check);
        };
        callback = video.requestVideoFrameCallback(check);
      });
    }
    try {
      send(false);
      await waitMarker(false, performance.now());
      for (let i = 0; i < 30; i++) {
        // Random phase avoids synchronizing the probe with Unity's frame cadence.
        await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 60));
        const pressed = i % 2 === 0;
        const start = performance.now();
        send(pressed);
        samples.push(await waitMarker(pressed, start));
      }
      samples.sort((a, b) => a - b);
      const result = { samples: samples.length, medianMs: samples[15], p95Ms: samples[28],
        meanMs: samples.reduce((sum, value) => sum + value, 0) / samples.length };
      output.textContent = `Input → video: median ${result.medianMs.toFixed(1)} ms; p95 ${result.p95Ms.toFixed(1)} ms; mean ${result.meanMs.toFixed(1)} ms (30 samples)`;
      output.dataset.samples = JSON.stringify(samples);
    } catch (error) { output.textContent = error.message; }
    finally {
      try {
        send(false);
        if (camera) {
          player.sender.mouse.currentState.delta = [0, 0];
          player.sender.mouse.currentState.buttons = new Uint16Array([0]).buffer;
          player.sender._queueStateEvent(player.sender.mouse.currentState, player.sender.mouse);
        }
      } catch { /* A disconnected channel cannot restore input. */ }
      button.disabled = false;
      cameraMode.disabled = false;
    }
  });
}
