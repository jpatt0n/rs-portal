// Interactive clients prefer fresh frames. This is a hint: WebRTC still adapts to jitter/loss.
// null restores the browser's automatic policy; older browsers retain their normal behavior.
export function getVideoJitterBufferTarget(config = {}) {
  const value = config.videoJitterBufferTargetMs;
  if (value === null) return null;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 4000 ? value : 0;
}

export function configureVideoReceiver(receiver, targetMs) {
  if (receiver?.track?.kind !== 'video') return 'not-video';
  try {
    if ('jitterBufferTarget' in receiver) {
      receiver.jitterBufferTarget = targetMs;
      return 'jitterBufferTarget';
    }
    if ('playoutDelayHint' in receiver) {
      // Chromium's older hint uses seconds; the standard property uses milliseconds.
      receiver.playoutDelayHint = targetMs === null ? null : targetMs / 1000;
      return 'playoutDelayHint';
    }
  } catch (error) {
    console.warn('Video latency hint was rejected; retaining browser playback policy.', error);
    return 'rejected';
  }
  return 'unsupported';
}
