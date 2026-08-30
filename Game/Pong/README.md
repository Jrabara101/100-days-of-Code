# PONG_OS v2.04 // Authoritative Real-Time WebRTC LAN Pong Engine

A high-performance, serverless 2-Player LAN Pong engine built in **React + Vite**, featuring **Host-Authoritative Physics**, **Sub-Stepping Continuous Collision Detection (CCD)**, **UDP-equivalent WebRTC DataChannels (zero retransmits)**, **Compact Binary Serialization**, and **Synthesized 8-Bit Web Audio**.

---

## 🏛️ Technical Architecture

```
        [React Room & WebRTC Signaling HUD] <--- Offer/Answer SDP Exchange, Ping HUD, & Game Over UI
                          │
                          ▼
             [Canvas 2D Viewport Layer]      <--- Blits Paddles, Ball Glow, CRT Scanlines, & Particles
                          │
                          ▼
            [Raw RTCDataChannel (UDP Mode)]  <--- Binary Packed Arrays (Host: Snapshots, Client: Inputs)
                          │
                          ▼
          [Clock Sync & Ping Estimator]      <--- NTP-Style Ping-Pong: RTT / 2 for Timestamp Offsets
                          │
                          ▼
     [Authoritative Physics Engine (Host)]   <--- Sub-Stepping CCD, Paddle Segment Deflection, Score FSM
                          │
                          ▼
      [Client Predictor & Interp Buffer]     <--- Smooth Hermite / Linear State Snapping for Remote Entity
```

---

## ⚡ Architectural Pillars & Design Decisions

| Architectural Pillar | Strategy Design Pattern | Operational Value |
| :--- | :--- | :--- |
| **Unreliable RTCDataChannel** | Configures WebRTC data channel with `{ ordered: false, maxRetransmits: 0 }`. | **Zero Head-of-Line Blocking.** Transmits state payloads with true UDP latency ($<5\text{ ms}$ on LAN), bypassing TCP retransmission stalls. |
| **Binary Serialization** | Packs input vectors and state snapshots into raw 48-byte `Float32Array` buffers. | **Zero JSON Overhead.** Minimizes garbage collection and CPU overhead during 60 Hz socket bursts. |
| **Authoritative Sub-Stepped CCD** | Evaluates ball movement in 4 sub-steps per frame on the Host engine. | **Eliminates High-Speed Tunneling.** Prevents the ball from clipping through paddles at maximum velocity. |
| **NTP Clock Sync** | Client transmits timestamped ping packets $T_0$, Host echoes with $T_{\text{host}}$. | Measures Round-Trip Time (RTT), Jitter, and clock drift offset $\Delta t$. |
| **Web Audio Synthesizer** | Pure procedural sound synthesis via Web Audio API oscillators. | Zero external audio asset dependencies; dynamic pitch based on paddle impact offset. |

---

## 🧮 Physics & Deflection Mathematics

### 1. Continuous Angular Mapping
When the ball impacts a paddle, its reflection angle $\theta$ is derived continuously from the impact offset relative to the paddle's vertical center:

$$\text{Normalized Impact Point } d = \frac{Y_{\text{ball}} - Y_{\text{paddle}}}{H_{\text{paddle}} / 2} \in [-1.0, 1.0]$$

$$\theta = d \times \theta_{\text{max}} \quad (\theta_{\text{max}} \approx 50^\circ \text{ or } 0.87\text{ rad})$$

$$v_x = -\text{sgn}(v_x) \cdot \Vert\vec{v}\Vert \cos(\theta), \quad v_y = \Vert\vec{v}\Vert \sin(\theta)$$

### 2. Dynamic Acceleration
To prevent static volleys, ball speed increases by $5\%$ on every successful paddle deflection, up to $V_{\max} = 16.0\text{ px/frame}$:

$$\Vert\vec{v}_{t+1}\Vert = \min\left(V_{\max}, \, \Vert\vec{v}_t\Vert \times 1.05\right)$$

---

## 📦 Binary Packet Specification

| Packet Type | ID | Size | Data Layout (Float32Array) |
| :--- | :---: | :---: | :--- |
| `MSG_INPUT` | `1.0` | 16 B | `[1.0, inputVector (-1/0/1), seqNumber, clientTimestamp]` |
| `MSG_SNAPSHOT` | `2.0` | 48 B | `[2.0, ballX, ballY, ballVx, ballVy, p1Y, p2Y, score1, score2, stateCode, rallyCount, serverTimestamp]` |
| `MSG_PING` | `3.0` | 8 B | `[3.0, pingOriginTimestamp]` |
| `MSG_PONG` | `4.0` | 12 B | `[4.0, pingOriginTimestamp, hostServerTimestamp]` |
| `MSG_EVENT` | `5.0` | 16 B | `[5.0, eventCode, param1, param2]` |

---

## 🕹️ Game Modes

1. **VS AI Bot**: Single-player mode with 4 difficulty levels (Easy, Medium, Hard, Impossible/Aimbot) using continuous raycast trajectory simulation.
2. **Local 2-Player**: Split-keyboard local match (`W/S` vs. `↑/↓`).
3. **LAN WebRTC P2P**: Direct browser-to-browser UDP connection across tabs or devices over LAN via SDP token exchange.

---

## 🚀 Development & Build

```bash
# Navigate to the project directory
cd Game/Pong

# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```
