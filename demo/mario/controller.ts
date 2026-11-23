/**
 * controller.ts — encapsulates Gamepad API polling and normalizes
 * the DualShock 4 (PS4) layout into game intents.
 *
 * Chrome exposes the DualShock 4 with the W3C "standard" mapping:
 *   buttons[0]  Cross      buttons[12] D-Pad Up
 *   buttons[1]  Circle     buttons[13] D-Pad Down
 *   buttons[2]  Square     buttons[14] D-Pad Left
 *   buttons[3]  Triangle   buttons[15] D-Pad Right
 *   axes[0]     Left stick X (-1 left … +1 right)
 *   axes[1]     Left stick Y (-1 up   … +1 down)
 *
 * The browser only exposes a gamepad after the user presses a button on it.
 */

// #region ds4-buttons
export const DS4_BUTTONS: Record<number, string> = {
  0: 'CROSS',
  1: 'CIRCLE',
  2: 'SQUARE',
  3: 'TRIANGLE',
  4: 'L1',
  5: 'R1',
  6: 'L2',
  7: 'R2',
  8: 'SHARE',
  9: 'OPTIONS',
  10: 'L3',
  11: 'R3',
  12: 'DPAD_UP',
  13: 'DPAD_DOWN',
  14: 'DPAD_LEFT',
  15: 'DPAD_RIGHT',
  16: 'PS',
  17: 'TOUCHPAD',
}
// #endregion ds4-buttons

export const DS4_AXES: Record<number, string> = {
  0: 'LEFT_X',
  1: 'LEFT_Y',
  2: 'RIGHT_X',
  3: 'RIGHT_Y',
}

const BTN_JUMP = 0 // Cross
const BTN_DPAD_UP = 12
const BTN_DPAD_DOWN = 13
const BTN_DPAD_LEFT = 14
const BTN_DPAD_RIGHT = 15
const AXIS_LEFT_X = 0
const AXIS_LEFT_Y = 1
const DEADZONE = 0.25

/** Normalized intent the game engine consumes each frame. */
export interface ControllerState {
  connected: boolean
  /** -1 (left) … +1 (right) after deadzone. */
  moveX: number
  /** -1 (up) … +1 (down) after deadzone; for top-down games. Arrow keys / W S on the keyboard. */
  moveY: number
  /** True only on the frame jump was pressed (edge-triggered). Cross, or Space / W / ↑. */
  jumpPressed: boolean
  /** True while jump is held. */
  jumpHeld: boolean
  /**
   * True only on the frame the action button was pressed. Cross, or Space /
   * Enter: unlike `jumpPressed` this never comes from ↑ or W, so a top-down
   * game can walk up without also "talking".
   */
  actionPressed: boolean
  source: 'gamepad' | 'keyboard' | 'none'
}

export type ControllerEvent =
  | { kind: 'connected'; id: string; mapping: string }
  | { kind: 'disconnected' }
  | { kind: 'button'; index: number; name: string; pressed: boolean }
  | { kind: 'axis'; index: number; name: string; value: number }

type Listener = (ev: ControllerEvent) => void

export class Controller {
  private listeners = new Set<Listener>()
  private prevButtons: boolean[] = []
  private prevAxes: number[] = []
  private prevJump = false
  private prevAction = false
  private wasConnected = false

  private keys = { left: false, right: false, up: false, down: false, jump: false, action: false }
  private keyboardTarget: HTMLElement | null = null

  /** Human-readable id of the active gamepad, or null. */
  gamepadId: string | null = null

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(ev: ControllerEvent) {
    for (const fn of this.listeners) fn(ev)
  }

  private activeGamepad(): Gamepad | null {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return null
    for (const gp of navigator.getGamepads()) {
      if (gp && gp.connected) return gp
    }
    return null
  }

  /** Attach optional keyboard fallback (arrow keys / space) to an element. */
  attachKeyboard(el: HTMLElement) {
    this.detachKeyboard()
    this.keyboardTarget = el
    el.addEventListener('keydown', this.onKey)
    el.addEventListener('keyup', this.onKey)
    el.addEventListener('blur', this.onBlur)
  }

  detachKeyboard() {
    const el = this.keyboardTarget
    if (!el) return
    el.removeEventListener('keydown', this.onKey)
    el.removeEventListener('keyup', this.onKey)
    el.removeEventListener('blur', this.onBlur)
    this.keyboardTarget = null
  }

  private onBlur = () => {
    this.keys = { left: false, right: false, up: false, down: false, jump: false, action: false }
  }

  private onKey = (e: KeyboardEvent) => {
    const down = e.type === 'keydown'
    let handled = true
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
        this.keys.left = down
        break
      case 'ArrowRight':
      case 'd':
        this.keys.right = down
        break
      case ' ':
        this.keys.jump = down
        this.keys.action = down
        break
      case 'Enter':
        this.keys.action = down
        break
      case 'ArrowUp':
      case 'w':
        this.keys.jump = down
        this.keys.up = down
        break
      case 'ArrowDown':
      case 's':
        this.keys.down = down
        break
      default:
        handled = false
    }
    if (handled) {
      // Keep Slidev from treating Space / arrows as slide navigation
      // while the game canvas has focus.
      e.preventDefault()
      e.stopPropagation()
    }
  }

  /** Poll once per frame. Emits diagnostic events and returns normalized state. */
  poll(): ControllerState {
    const gp = this.activeGamepad()

    if (gp && !this.wasConnected) {
      this.wasConnected = true
      this.gamepadId = gp.id
      this.emit({ kind: 'connected', id: gp.id, mapping: gp.mapping || 'unknown' })
    } else if (!gp && this.wasConnected) {
      this.wasConnected = false
      this.gamepadId = null
      this.prevButtons = []
      this.prevAxes = []
      this.emit({ kind: 'disconnected' })
    }

    let moveX = 0
    let moveY = 0
    let jumpHeld = false
    let actionHeld = false
    let source: ControllerState['source'] = 'none'

    if (gp) {
      source = 'gamepad'

      gp.buttons.forEach((b, i) => {
        const pressed = b.pressed
        if (pressed !== (this.prevButtons[i] ?? false)) {
          this.emit({ kind: 'button', index: i, name: DS4_BUTTONS[i] ?? `B${i}`, pressed })
        }
        this.prevButtons[i] = pressed
      })

      gp.axes.forEach((v, i) => {
        const prev = this.prevAxes[i] ?? 0
        if (Math.abs(v - prev) > 0.05) {
          this.emit({ kind: 'axis', index: i, name: DS4_AXES[i] ?? `A${i}`, value: v })
          this.prevAxes[i] = v
        }
      })

      const stick = gp.axes[AXIS_LEFT_X] ?? 0
      if (Math.abs(stick) > DEADZONE) moveX = Math.sign(stick) * Math.min(1, (Math.abs(stick) - DEADZONE) / (1 - DEADZONE))
      const stickY = gp.axes[AXIS_LEFT_Y] ?? 0
      if (Math.abs(stickY) > DEADZONE) moveY = Math.sign(stickY) * Math.min(1, (Math.abs(stickY) - DEADZONE) / (1 - DEADZONE))
      if (gp.buttons[BTN_DPAD_LEFT]?.pressed) moveX = -1
      if (gp.buttons[BTN_DPAD_RIGHT]?.pressed) moveX = 1
      if (gp.buttons[BTN_DPAD_UP]?.pressed) moveY = -1
      if (gp.buttons[BTN_DPAD_DOWN]?.pressed) moveY = 1
      jumpHeld = gp.buttons[BTN_JUMP]?.pressed ?? false
      actionHeld = jumpHeld
    }

    // Keyboard fallback (only when the canvas is focused and no gamepad input).
    const k = this.keys
    if (k.left || k.right || k.up || k.down || k.jump || k.action) {
      if (source === 'none') source = 'keyboard'
      if (k.left) moveX = -1
      if (k.right) moveX = 1
      if (k.up) moveY = -1
      if (k.down) moveY = 1
      if (k.jump) jumpHeld = true
      if (k.action) actionHeld = true
    }

    const jumpPressed = jumpHeld && !this.prevJump
    this.prevJump = jumpHeld
    const actionPressed = actionHeld && !this.prevAction
    this.prevAction = actionHeld

    return { connected: !!gp, moveX, moveY, jumpPressed, jumpHeld, actionPressed, source }
  }
}
