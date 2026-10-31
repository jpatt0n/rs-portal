import {
  Mouse,
  Keyboard,
  KeyboardState,
  Gamepad,
  Touchscreen,
  InputEvent,
  StateEvent,
  TextEvent
} from "./inputdevice.js";

import { LocalInputManager, MessageType } from "./inputremoting.js";
import { GamepadHandler } from "./gamepadhandler.js";
import { TouchPhase } from "./touchphase.js";
import { PointerCorrector } from "./pointercorrect.js";

/**
 * The streamed application's quickcam keys, taken from the browser so they reach the game.
 *
 * F1-F5 are the primary form and are claimed on their own. Chrome puts help on F1 and find on F3,
 * but neither is reserved, so cancelling the keydown is enough.
 */
const APP_CLAIMED_KEYS = new Set(['F1', 'F2', 'F3', 'F4', 'F5']);

/**
 * The fallback form: the same five as Ctrl + digit.
 *
 * Chrome maps Ctrl+1..8 to "switch to tab N", but unlike Ctrl+T or Ctrl+W those are not reserved
 * either. Firefox and Safari do reserve theirs, so there the chord only lands while the player is
 * fullscreen and the Keyboard Lock API (see videoplayer.js) is holding these codes.
 */
const APP_CLAIMED_MODIFIER_DIGITS = new Set([
  'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
  'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5'
]);

export class Sender extends LocalInputManager {
  constructor(elem) {
    super();
    this._devices = [];
    this._elem = elem;
    this._loggedMouseEvent = false;
    this._loggedKeyEvent = false;
    this._pressedKeys = new Set();
    this._inputCaptured = false;
    this.onInputCaptureChanged = null;
    this._altAsControlFallback = false;
    this._mouseSensitivity = 1;
    this._handheldMirror = false;
    this._applicationPointerLock = false;
    this._cameraOwnedPointerLock = false;
    this._manualPointerLock = false;
    this._pointerLockRequest = null;
    this._manipulationEnabled = false;
    this._cameraDragEnabled = false;
    this._pointerLockAnchor = null;
    this._expectedPointerUnlock = false;
    this._dragPointerId = null;
    this._corrector = new PointerCorrector(
      this._elem.videoWidth,
      this._elem.videoHeight,
      this._elem
      );

    this._onResizeEventHandler = this._onResizeEvent.bind(this);
    this._onMouseEventHandler = this._onMouseEvent.bind(this);
    this._onOutsideMouseEventHandler = event => {
      if (event.target !== this._elem && this._inputCaptured &&
          (this._isManipulatingPointer() || this._hasMouseButtons())) this._onMouseEvent(event);
    };
    this._onDragPointerDownHandler = event => {
      if (event.pointerType !== 'mouse' || document.pointerLockElement || !this._elem.setPointerCapture) return;
      this._elem.setPointerCapture(event.pointerId);
      this._dragPointerId = event.pointerId;
    };
    this._onDragPointerLostHandler = event => {
      if (event.pointerId !== this._dragPointerId) return;
      this._dragPointerId = null;
      if (event.buttons) this.releaseInputCapture();
    };
    this._onDragPointerCancelHandler = () => this.releaseInputCapture();
    this._onPagePointerLeaveHandler = () => {
      // Keyboard-only manipulation cannot capture the pointer outside the page.
      // Retire that gesture rather than leaving its edge continuation running.
      if (this._dragPointerId === null && document.pointerLockElement !== this._elem &&
          (this._isManipulatingPointer() || this._hasMouseButtons())) this.releaseInputCapture();
    };
    this._onVideoPointerEnterHandler = () => this.syncInputFocus();
    this._onKeyEventHandler = this._onKeyEvent.bind(this);
    this._onGamepadEventHandler = this._onGamepadEvent.bind(this);
    this._onTouchEventHandler = this._onTouchEvent.bind(this);
    this._onWindowBlurHandler = this._onWindowBlur.bind(this);
    this._onWindowFocusHandler = this._onWindowFocus.bind(this);
    this._onPageHideHandler = this._onPageHide.bind(this);
    this._onVisibilityChangeHandler = this._onVisibilityChange.bind(this);
    this._onPointerLockChangeHandler = this._onPointerLockChange.bind(this);
    document.addEventListener('pointerlockchange', this._onPointerLockChangeHandler, false);
    this._onOutsidePressHandler = event => {
      if (event.target !== this._elem) this.releaseInputCapture();
    };
    document.addEventListener('pointerdown', this._onOutsidePressHandler, true);
    this._onFocusInHandler = event => {
      if (event.target === this._elem) this.acquireInputCapture();
      else this.releaseInputCapture();
    };
    document.addEventListener('focusin', this._onFocusInHandler, true);

    //since line 27 cannot complete resize initialization but can only monitor div dimension changes, line 26 needs to be reserved
    this._elem.addEventListener('resize', this._onResizeEventHandler, false);
    this._resizeObserver = new ResizeObserver(this._onResizeEventHandler);
    this._resizeObserver.observe(this._elem);
  }

  addMouse() {
    const descriptionMouse = {
      m_InterfaceName: "RawInput",
      m_DeviceClass: "Mouse",
      m_Manufacturer: "",
      m_Product: "",
      m_Serial: "",
      m_Version: "",
      m_Capabilities: ""
    };
    this.mouse = new Mouse("Mouse", "Mouse", 1, null, descriptionMouse);
    this._devices.push(this.mouse);

    this._elem.addEventListener('click', this._onMouseEventHandler, false);
    this._elem.addEventListener('mousedown', this._onMouseEventHandler, false);
    this._elem.addEventListener('mouseup', this._onMouseEventHandler, false);
    this._elem.addEventListener('mousemove', this._onMouseEventHandler, false);
    this._elem.addEventListener('wheel', this._onMouseEventHandler, false);
    this._elem.addEventListener('pointerdown', this._onDragPointerDownHandler, false);
    this._elem.addEventListener('lostpointercapture', this._onDragPointerLostHandler, false);
    this._elem.addEventListener('pointercancel', this._onDragPointerCancelHandler, false);
    this._elem.addEventListener('mouseenter', this._onVideoPointerEnterHandler, false);
    // Captured drags target the video; modifier-only motion outside it bubbles to
    // the window. The target check prevents sending a video event twice.
    window.addEventListener('mousemove', this._onOutsideMouseEventHandler, false);
    window.addEventListener('mouseup', this._onOutsideMouseEventHandler, false);
    document.addEventListener('mouseleave', this._onPagePointerLeaveHandler, false);
  }

  addKeyboard() {
    const descriptionKeyboard = {
      m_InterfaceName: "RawInput",
      m_DeviceClass: "Keyboard",
      m_Manufacturer: "",
      m_Product: "",
      m_Serial: "",
      m_Version: "",
      m_Capabilities: ""
    };
    this.keyboard = new Keyboard("Keyboard", "Keyboard", 2, null, descriptionKeyboard);
    this._devices.push(this.keyboard);

    document.addEventListener('keyup', this._onKeyEventHandler, false);
    document.addEventListener('keydown', this._onKeyEventHandler, false);
    window.addEventListener('blur', this._onWindowBlurHandler, false);
    window.addEventListener('focus', this._onWindowFocusHandler, false);
    window.addEventListener('pagehide', this._onPageHideHandler, false);
    document.addEventListener('visibilitychange', this._onVisibilityChangeHandler, false);
  }

  setAltAsControlFallback(enabled) {
    const next = !!enabled;
    if (this._altAsControlFallback === next) {
      return;
    }
    this.releaseAllInputs();
    this._altAsControlFallback = next;
  }

  setMouseSensitivity(value) {
    const next = Number(value);
    this._mouseSensitivity = Number.isFinite(next) && next > 0 ? next : 1;
  }

  addGamepad() {
    const descriptionGamepad = {
      m_InterfaceName: "RawInput",
      m_DeviceClass: "Gamepad",
      m_Manufacturer: "",
      m_Product: "",
      m_Serial: "",
      m_Version: "",
      m_Capabilities: ""
    };
    this.gamepad = new Gamepad("Gamepad", "Gamepad", 3, null, descriptionGamepad);
    this._devices.push(this.gamepad);

    window.addEventListener("gamepadconnected", this._onGamepadEventHandler, false);
    window.addEventListener("gamepaddisconnected", this._onGamepadEventHandler, false);
    this._gamepadHandler = new GamepadHandler();
    this._gamepadHandler.addEventListener("gamepadupdated", this._onGamepadEventHandler, false);
  }

  addTouchscreen() {
    const descriptionTouch = {
      m_InterfaceName: "RawInput",
      m_DeviceClass: "Touch",
      m_Manufacturer: "",
      m_Product: "",
      m_Serial: "",
      m_Version: "",
      m_Capabilities: ""
    };
    this.touchscreen = new Touchscreen("Touchscreen", "Touchscreen", 4, null, descriptionTouch);
    this._devices.push(this.touchscreen);

    this._elem.addEventListener('touchend', this._onTouchEventHandler, false);
    this._elem.addEventListener('touchstart', this._onTouchEventHandler, false);
    this._elem.addEventListener('touchcancel', this._onTouchEventHandler, false);
    this._elem.addEventListener('touchmove', this._onTouchEventHandler, false);
    this._elem.addEventListener('click', this._onTouchEventHandler, false);
  }

  /**
   * @returns {InputDevice[]}
   */
  get devices() {
    return this._devices;
  }

  _onResizeEvent() {
    this._corrector.reset(
      this._elem.videoWidth,
      this._elem.videoHeight,
      this._elem
    );
  }
  get inputCaptured() { return this._inputCaptured; }

  syncInputFocus() {
    if (document.visibilityState !== 'hidden' && document.hasFocus() && document.activeElement === this._elem)
      this.acquireInputCapture();
    else this.releaseInputCapture();
  }

  acquireInputCapture(clientPosition = null) {
    if (this._inputCaptured || document.visibilityState === 'hidden' || !document.hasFocus()) return;
    const pixels = clientPosition && this._corrector.isReady ? this._corrector.map(clientPosition) : null;
    this._inputCaptured = true;
    this._elem.focus?.({ preventScroll: true });
    // Focus precedes device packets on the same ordered input channel. The first press
    // is delivered normally; this neutral snapshot establishes its absolute position.
    this.onInputCaptureChanged?.(true);
    if (pixels && this.mouse) {
      this.mouse.queueEvent({ type: 'mousemove', clientX: pixels[0], clientY: pixels[1],
        movementX: 0, movementY: 0, buttons: 0 });
      this._queueStateEvent(this.mouse.currentState, this.mouse);
    }
  }

  releaseInputCapture() {
    const captured = this._inputCaptured;
    this._inputCaptured = false;
    const pointerId = this._dragPointerId;
    this._dragPointerId = null;
    if (pointerId !== null && this._elem.hasPointerCapture?.(pointerId))
      this._elem.releasePointerCapture(pointerId);
    this.releaseAllInputs();
    this._releaseCameraPointerLock();
    if (captured) this.onInputCaptureChanged?.(false);
  }

  _onMouseEvent(event) {
    if (!this._inputCaptured) {
      if (event.type === 'mousedown') this.acquireInputCapture([event.clientX, event.clientY]);
      if (!this._inputCaptured) return;
    }
    if (!this._corrector.isReady) {
      return;
    }
    if ((event.type === 'mousedown' || event.type === 'mouseup') &&
      (event.button === 3 || event.button === 4)) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!this._loggedMouseEvent) {
      this._loggedMouseEvent = true;
    }
    const heldButtons = this.mouse.currentState?.buttons;
    this.mouse.queueEvent(event);
    // Raw pointer-lock movement can report buttons=0 even while a button is held.
    // Button edges own the hold during capture; movement/wheel/click packets cannot
    // cancel it. Focus loss still sends a neutral snapshot through releaseAllInputs.
    if (this._pointerLockAnchor && heldButtons &&
        event.type !== 'mousedown' && event.type !== 'mouseup')
      this.mouse.currentState.buttons = heldButtons;
    // Pointer movement and Q/E manipulation use video pixels. Camera modes retain the
    // viewer's sensitivity, including handheld movement without a mouse button held.
    if (event.type === 'mousemove') {
      const pointerPixels = this._isManipulatingPointer() && !this._isCameraDrag() &&
        !this._applicationPointerLock && !this._handheldMirror;
      this.mouse.currentState.delta = pointerPixels
        ? this._corrector.mapDelta(this.mouse.currentState.delta)
        : this.mouse.currentState.delta.map(value => value * this._mouseSensitivity);
    }
    // Wheel packets replace the full mouse state too, so every event must use video coordinates.
    this.mouse.currentState.position = this._pointerLockAnchor
      ? [...this._pointerLockAnchor] : this._corrector.map(this.mouse.currentState.position);
    this._queueStateEvent(this.mouse.currentState, this.mouse);
    // Request inside the initiating button gesture, after recording its real position.
    if (event.type === 'mousedown' || event.type === 'mouseup') this._updatePointerLock();
  }
  _onKeyEvent(event) {
    if (!this._inputCaptured && event.type === 'keydown') this.syncInputFocus();
    if (!this._inputCaptured) return;
    // Alt-Tab can leave a keydown arriving after blur, with its keyup going to another app.
    // Release edges remain safe to deliver; background presses must not restart a hold.
    if (event.type === 'keydown' &&
        (document.visibilityState === 'hidden' || !document.hasFocus())) {
      return;
    }
    const code = this._resolveKeyCode(event);
    if (!code) {
      return;
    }
    const isAppClaimedChord = this._isAppClaimedChord(event);
    if (isAppClaimedChord) {
      // Held back from the browser so the key reaches the application rather than opening help or
      // switching tabs.
      event.preventDefault();
    }
    if(event.type == 'keydown') {
      if(!event.repeat) { // StateEvent
        this._pressedKeys.add(code);
        if (code === 'KeyQ' || code === 'KeyE') this._updatePointerLock();
        this.keyboard.queueEvent({ type: 'keydown', code: code });
        this._queueStateEvent(this.keyboard.currentState, this.keyboard);
        this._updateHandheldMirror(event);
        if (!this._loggedKeyEvent) {
          this._loggedKeyEvent = true;
        }
      }
      // TextEvent
      if (!isAppClaimedChord && this._isTextInputKey(event)) {
        this._queueTextEvent(this.keyboard, event);
      }
    }
    else if(event.type == 'keyup') {
      this._pressedKeys.delete(code);
      if (code === 'KeyQ' || code === 'KeyE') this._updatePointerLock();
      this.keyboard.queueEvent({ type: 'keyup', code: code });
      this._queueStateEvent(this.keyboard.currentState, this.keyboard);
    }
  }

  /**
   * True for a key the application owns: one of its bare function keys, or the modifier + digit
   * fallback for the same four.
   *
   * Alt counts alongside Ctrl on the digits because outside fullscreen the sender already stands
   * Alt in for Control (see `setAltAsControlFallback`), so Alt+1 is how a windowed player types
   * Ctrl+1. AltGr - which Windows reports as Ctrl+Alt - is left alone: on many layouts it produces
   * a real character, and swallowing it would break typing.
   */
  _isAppClaimedChord(event) {
    if (!event || !event.code) {
      return false;
    }
    if (APP_CLAIMED_KEYS.has(event.code)) {
      return true;
    }
    if (!APP_CLAIMED_MODIFIER_DIGITS.has(event.code)) {
      return false;
    }
    if (event.ctrlKey && event.altKey) {
      return false;
    }
    return event.ctrlKey || event.metaKey || (this._altAsControlFallback && event.altKey);
  }

  /**
   * The application's handheld camera (F4 / Ctrl+4, Esc to exit) pans on bare mouse movement, so
   * while it is up the OS cursor must not exist to run into a window edge and stall the pan. Only
   * the page can reach the Pointer Lock API, so the handheld's own keys are mirrored here and the
   * lock follows them until Unity's authoritative cursor state arrives.
   */
  _updateHandheldMirror(event) {
    if (this._isHandheldToggleChord(event)) {
      if (this._handheldMirror) {
        this._releaseHandheldPointerLock();
      } else {
        this._captureHandheldPointerLock();
      }
      return;
    }
  }

  _isHandheldToggleChord(event) {
    if (event.code === 'F4') {
      return true;
    }
    return (event.code === 'Digit4' || event.code === 'Numpad4') && this._isAppClaimedChord(event);
  }

  _captureHandheldPointerLock() {
    this._handheldMirror = true;
    this._captureCameraPointerLock();
  }

  /** Only handheld requests automatic lock. Gesture permissions still select delta scaling. */
  setApplicationPointerLock(active, manipulationEnabled = false, cameraDragEnabled = false) {
    this._applicationPointerLock = active === true;
    if (!this._applicationPointerLock) this._handheldMirror = false;
    this._manipulationEnabled = manipulationEnabled === true;
    this._cameraDragEnabled = cameraDragEnabled === true;
    this._updatePointerLock();
  }

  _wantsCameraPointerLock() {
    return this._inputCaptured && (this._manualPointerLock || this._handheldMirror || this._applicationPointerLock);
  }

  /** The optional mouse-lock setting shares the application's capture owner. */
  setManualPointerLock(active) {
    this._manualPointerLock = active === true;
    if (this._wantsCameraPointerLock()) this._captureCameraPointerLock();
    else this._releaseCameraPointerLock();
  }

  _isManipulatingPointer() {
    return this._manipulationEnabled && (this._pressedKeys.has('KeyQ') || this._pressedKeys.has('KeyE'));
  }

  _isCameraDrag() {
    return this._cameraDragEnabled && this.mouse?.currentState?.buttons &&
      (new Uint16Array(this.mouse.currentState.buttons)[0] & 2) !== 0;
  }

  _hasMouseButtons() {
    return this.mouse?.currentState?.buttons && new Uint16Array(this.mouse.currentState.buttons)[0] !== 0;
  }

  _updatePointerLock() {
    if (this._wantsCameraPointerLock()) this._captureCameraPointerLock();
    else this._releaseCameraPointerLock();
  }

  _captureCameraPointerLock(unadjustedMovement = true) {
    if (!this._inputCaptured) return;
    if (document.pointerLockElement) {
      // Riding someone else's lock means leaving it alone when the camera mode ends.
      this._cameraOwnedPointerLock = document.pointerLockElement === this._elem &&
        this._cameraOwnedPointerLock;
      return;
    }
    if (!this._elem.requestPointerLock || this._pointerLockRequest) {
      return;
    }
    this._cameraOwnedPointerLock = true;
    // One return point for right-drag, handheld, Q/E and manual lock. Never integrate
    // relative camera motion into the absolute pointer or retain an offset after unlock.
    if (!this._pointerLockAnchor && this.mouse?.currentState)
      this._pointerLockAnchor = [...this.mouse.currentState.position];
    const token = this._pointerLockRequest = {};
    let request;
    try {
      // Raw relative input avoids OS acceleration and cursor-recentering jumps on
      // fast turns. Keep ordinary pointer lock for platforms without raw input.
      request = unadjustedMovement
        ? this._elem.requestPointerLock({ unadjustedMovement: true })
        : this._elem.requestPointerLock();
    } catch (error) {
      this._pointerLockRequest = null;
      this._cameraOwnedPointerLock = false;
      if (unadjustedMovement && error?.name === 'NotSupportedError' && this._wantsCameraPointerLock())
        this._captureCameraPointerLock(false);
      else this._pointerLockAnchor = null;
      return;
    }
    if (request && request.catch) {
      request.then(() => {
        if (this._pointerLockRequest !== token) return;
        this._pointerLockRequest = null;
        this._cameraOwnedPointerLock = document.pointerLockElement === this._elem;
        if (!this._wantsCameraPointerLock()) this._releaseCameraPointerLock();
      }).catch(error => {
        if (this._pointerLockRequest !== token) return;
        this._pointerLockRequest = null;
        this._cameraOwnedPointerLock = document.pointerLockElement === this._elem;
        if (unadjustedMovement && error?.name === 'NotSupportedError' && this._wantsCameraPointerLock())
          this._captureCameraPointerLock(false);
        else if (!this._cameraOwnedPointerLock) this._pointerLockAnchor = null;
      });
    } else {
      this._pointerLockRequest = null;
    }
  }

  _releaseHandheldPointerLock() {
    this._handheldMirror = false;
    if (!this._wantsCameraPointerLock()) {
      this._releaseCameraPointerLock();
    }
  }

  _releaseCameraPointerLock() {
    if (this._cameraOwnedPointerLock &&
        document.pointerLockElement === this._elem &&
        document.exitPointerLock) {
      this._expectedPointerUnlock = true;
      document.exitPointerLock();
    }
    this._cameraOwnedPointerLock = false;
    if (!this._pointerLockRequest && document.pointerLockElement !== this._elem) this._pointerLockAnchor = null;
  }

  _onPointerLockChange() {
    if (document.pointerLockElement) {
      // All player capture paths target this video, including the manual setting.
      if (document.pointerLockElement === this._elem) {
        this._cameraOwnedPointerLock = true;
        if (!this._wantsCameraPointerLock()) this._releaseCameraPointerLock();
      }
      return;
    }
    this._cameraOwnedPointerLock = false;
    this._pointerLockAnchor = null;
    if (this._expectedPointerUnlock) {
      this._expectedPointerUnlock = false;
      if (this._wantsCameraPointerLock()) this._captureCameraPointerLock();
      return;
    }
    // Forced browser unlock releases focus. It does not synthesize an Escape that
    // could race the capture notification on another data channel.
    this.releaseInputCapture();
  }

  _resolveKeyCode(event) {
    if (!event || !event.code) {
      return null;
    }
    if (!this._altAsControlFallback) {
      return event.code;
    }
    if (event.code === 'AltLeft') {
      return 'ControlLeft';
    }
    if (event.code === 'AltRight') {
      return 'ControlRight';
    }
    return event.code;
  }
  _isTextInputKey(event) {
    if (!event || !event.key) {
      return false;
    }
    if (event.key.length === 1) {
      return true;
    }
    return event.key === 'Enter'
      || event.key === 'Backspace'
      || event.key === 'Tab'
      || event.key === 'Delete';
  }
  _onTouchEvent(event) {
    if (!this._inputCaptured) {
      if (event.type === 'touchstart') {
        const touch = event.changedTouches[0];
        this.acquireInputCapture([touch.clientX, touch.clientY]);
      }
      if (!this._inputCaptured) return;
    }
    if (event.type === 'click') return; // Mouse compatibility event, not a second touch.
    if (!this._corrector.isReady) {
      return;
    }
    this.touchscreen.queueEvent(event, this.timeSinceStartup);
    for(let touch of this.touchscreen.currentState.touchData) {
      let clone = touch.copy();
      clone.position = this._corrector.map(clone.position);
      this._queueStateEvent(clone, this.touchscreen);
    }
  }
  _onGamepadEvent(event) {
    switch(event.type) {
      case 'gamepadconnected': {
        this._gamepadHandler.addGamepad(event.gamepad);
        break;
      }
      case 'gamepaddisconnected': {
        this._gamepadHandler.removeGamepad(event.gamepad);
        break;
      }
      case 'gamepadupdated': {
        if (!this._inputCaptured) return;
        this.gamepad.queueEvent(event);
        this._queueStateEvent(this.gamepad.currentState, this.gamepad);
        break;
      }
    }
  }

  _onWindowBlur() {
    this.releaseInputCapture();
  }

  _onWindowFocus() {
    this.syncInputFocus();
  }

  _onPageHide() {
    this.releaseInputCapture();
  }

  _onVisibilityChange() {
    this.syncInputFocus();
  }

  _releaseAllKeys() {
    this._pressedKeys.clear();
    if (!this.keyboard?.currentState) {
      return;
    }
    // Send one complete neutral snapshot, even if local bookkeeping is already empty.
    // This also clears whichever modifier Alt was mapped to before focus was lost.
    new Uint8Array(this.keyboard.currentState.keys).fill(0);
    this._queueStateEvent(this.keyboard.currentState, this.keyboard);
  }

  _releaseMouseButtons() {
    if (!this.mouse) {
      return;
    }
    const hasButtonsDown =
      this.mouse.currentState != null
      && this.mouse.currentState.buttons != null
      && new Uint16Array(this.mouse.currentState.buttons)[0] !== 0;
    if (!hasButtonsDown) {
      return;
    }
    const state = this.mouse.currentState;
    const event = {
      type: 'mouseup',
      button: 0,
      buttons: 0,
      clientX: state.position[0],
      clientY: state.position[1],
      movementX: 0,
      movementY: 0,
    };
    this.mouse.queueEvent(event);
    this._queueStateEvent(this.mouse.currentState, this.mouse);
  }

  releaseAllInputs() {
    this._releaseAllKeys();
    this._releaseMouseButtons();
    const pad = this.gamepad?.currentState;
    if (pad) {
      new Uint8Array(pad.buttons).fill(0);
      pad.leftStick = [0, 0];
      pad.rightStick = [0, 0];
      pad.leftTrigger = pad.rightTrigger = 0;
      this._queueStateEvent(pad, this.gamepad);
    }
    const touches = this.touchscreen?.currentState?.touchData;
    if (touches) {
      for (const touch of touches) {
        if (touch.phaseId === TouchPhase.Ended || touch.phaseId === TouchPhase.Canceled) continue;
        const canceled = touch.copy();
        canceled.phaseId = TouchPhase.Canceled;
        canceled.delta = [0, 0];
        canceled.pressure = 0;
        canceled.position = this._corrector.map(canceled.position);
        this._queueStateEvent(canceled, this.touchscreen);
      }
      touches.length = 0;
    }
    this._updatePointerLock();
  }

  dispose() {
    this.releaseInputCapture();
    this._applicationPointerLock = false;
    this._manualPointerLock = false;
    this._releaseHandheldPointerLock();
    document.removeEventListener('pointerlockchange', this._onPointerLockChangeHandler, false);
    document.removeEventListener('pointerdown', this._onOutsidePressHandler, true);
    document.removeEventListener('focusin', this._onFocusInHandler, true);
    this._elem.removeEventListener('resize', this._onResizeEventHandler, false);
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this._elem.removeEventListener('click', this._onMouseEventHandler, false);
    this._elem.removeEventListener('mousedown', this._onMouseEventHandler, false);
    this._elem.removeEventListener('mouseup', this._onMouseEventHandler, false);
    this._elem.removeEventListener('mousemove', this._onMouseEventHandler, false);
    this._elem.removeEventListener('wheel', this._onMouseEventHandler, false);
    this._elem.removeEventListener('pointerdown', this._onDragPointerDownHandler, false);
    this._elem.removeEventListener('lostpointercapture', this._onDragPointerLostHandler, false);
    this._elem.removeEventListener('pointercancel', this._onDragPointerCancelHandler, false);
    this._elem.removeEventListener('mouseenter', this._onVideoPointerEnterHandler, false);
    window.removeEventListener('mousemove', this._onOutsideMouseEventHandler, false);
    window.removeEventListener('mouseup', this._onOutsideMouseEventHandler, false);
    document.removeEventListener('mouseleave', this._onPagePointerLeaveHandler, false);
    this._elem.removeEventListener('touchend', this._onTouchEventHandler, false);
    this._elem.removeEventListener('touchstart', this._onTouchEventHandler, false);
    this._elem.removeEventListener('touchcancel', this._onTouchEventHandler, false);
    this._elem.removeEventListener('touchmove', this._onTouchEventHandler, false);
    this._elem.removeEventListener('click', this._onTouchEventHandler, false);
    document.removeEventListener('keyup', this._onKeyEventHandler, false);
    document.removeEventListener('keydown', this._onKeyEventHandler, false);
    document.removeEventListener('visibilitychange', this._onVisibilityChangeHandler, false);
    window.removeEventListener('blur', this._onWindowBlurHandler, false);
    window.removeEventListener('focus', this._onWindowFocusHandler, false);
    window.removeEventListener('pagehide', this._onPageHideHandler, false);
    window.removeEventListener("gamepadconnected", this._onGamepadEventHandler, false);
    window.removeEventListener("gamepaddisconnected", this._onGamepadEventHandler, false);
    if (this._gamepadHandler) {
      this._gamepadHandler.removeEventListener("gamepadupdated", this._onGamepadEventHandler, false);
      this._gamepadHandler = null;
    }
  }

  _queueStateEvent(state, device) {
    const stateEvent =
      StateEvent.fromState(state, device.deviceId, this.timeSinceStartup);
    const e = new CustomEvent(
      'event', {detail: { event: stateEvent, device: device}});
    super.onEvent.dispatchEvent(e);
  }
  _queueTextEvent(device, event) {
    const textEvent = TextEvent.create(device.deviceId, event, this.timeSinceStartup);
    const e = new CustomEvent(
      'event', {detail: { event: textEvent, device: device}});
    super.onEvent.dispatchEvent(e);
  }
  _queueDeviceChange(device, usage) {
    const e = new CustomEvent(
      'changedeviceusage', {detail: { device: device, usage: usage }});
    super.onEvent.dispatchEvent(e);
  }
}

export class Observer {
  /**
   *
   * @param {RTCDataChannel} channel
   */
  constructor(channel, maxBufferedAmount = 256 * 1024) {
    this.channel = channel;
    this.maxBufferedAmount = maxBufferedAmount;
  }

  /**
   *
   * @param {RTCDataChannel} channel
   */
  setChannel(channel) {
    this.channel = channel;
  }
  /**
   *
   * @param {Message} message
   */
  onNext(message) {
    if(this.channel == null || this.channel.readyState != 'open') {
      return;
    }
    // Keyboard state edges are low-volume and must stay reliable: dropping a release
    // leaves Unity holding a movement key until another keyboard snapshot arrives.
    const isKeyboardState = message.type === MessageType.NewEvents
      && message.data.byteLength >= InputEvent.size + 4
      && new DataView(message.data).getInt32(0, true) === StateEvent.format
      && new DataView(message.data).getInt32(InputEvent.size, true) === KeyboardState.format;
    if (typeof this.channel.bufferedAmount === 'number'
      && this.channel.bufferedAmount > this.maxBufferedAmount && !isKeyboardState) {
      return;
    }
    this.channel.send(message.buffer);
  }
}
