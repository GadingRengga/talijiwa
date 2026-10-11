<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { prefersReducedMotion } from '@/composables/useAnimation'

/**
 * Pink flower gate intro (WebGL). Morning garden: an arch smothered in
 * blossoms, two lattice doors, falling petals. Doors swing inward, the camera
 * dollies through flower arches, then hands off. All text lives in DOM
 * overlays owned by InvitationCover — this component is pure scenery.
 *
 * Flower/leaf colors derive from the active theme (--inv-*) read off the host
 * element; garden sage is a fixed green tinted 35% by the theme accent.
 */
const emit = defineEmits<{
  opened: []
  done: []
  skipped: []
}>()

defineExpose({ play })

const host = ref<HTMLElement | null>(null)

let raf = 0
let cleanup: (() => void) | null = null
let playFn: (() => void) | null = null

function play() {
  playFn?.()
}

onMounted(() => {
  if (!host.value || prefersReducedMotion()) {
    emit('skipped')
    return
  }
  try {
    cleanup = start(host.value)
  } catch {
    emit('skipped')
  }
})

onBeforeUnmount(() => cleanup?.())

function start(hostEl: HTMLElement): () => void {
  const DOOR_MS = 2600
  // Dolly starts after the doors near full-open so the camera never meets a
  // half-swung wingtip at z=0 (was ~70ms margin on desktop).
  const DOLLY_START = 1100
  const DOLLY_DUR = 3500
  const FLASH_AT = 3700
  const END_MS = 4800
  const small = window.innerWidth < 480
  const PETALS = small ? 50 : 90
  const DENSITY = small ? 0.7 : 1

  const cssVars = getComputedStyle(hostEl)
  const tok = (n: string, fb: string) => cssVars.getPropertyValue(n).trim() || fb
  const T = {
    bg: tok('--inv-bg', '#fbeeee'),
    surface: tok('--inv-surface', '#fffaf6'),
    text: tok('--inv-text', '#4b3b3f'),
    accent: tok('--inv-accent', '#a94e63'),
    border: tok('--inv-border', '#f0d4d8'),
  }

  const col = (h: string) => new THREE.Color(h)
  const mix = (a: string, b: string, t: number) => col(a).lerp(col(b), t)
  const css = (c: THREE.Color) => `#${c.getHexString()}`
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const rnd = (a: number, b: number) => a + Math.random() * (b - a)
  const easeIO3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  const SAGE = '#7BA07A'
  const SAGE_DK = '#5d8a5d'
  const sage = col(SAGE).lerp(col(T.accent), 0.35)
  const sageDk = col(SAGE_DK).lerp(col(T.accent), 0.35)

  const P = {
    haze: mix(T.border, T.surface, 0.55),
    cream: mix(T.surface, '#ffffff', 0.35),
    wood: mix(T.surface, T.border, 0.35),
    rose: col(T.accent),
    roseLt: mix(T.accent, '#ffffff', 0.35),
    blush: mix(T.border, '#ffffff', 0.25),
    mid: mix(T.accent, T.border, 0.5),
    glow: mix(T.border, '#ffffff', 0.6),
    path: mix(T.surface, T.border, 0.45),
  }

  /* ── Procedural textures (no image assets) ── */
  const mk = (w: number, h: number) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    return c
  }
  const tex = (cv: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(cv)
    t.generateMipmaps = false
    t.minFilter = THREE.LinearFilter
    return t
  }
  const flowerTexture = (o: { petals: number; layers: number; color: THREE.Color; light: THREE.Color; deep: THREE.Color }) => {
    const cv = mk(256, 256)
    const g = cv.getContext('2d')!
    g.translate(128, 128)
    for (let layer = 0; layer < o.layers; layer++) {
      const n = o.petals
      const r = 112 - layer * 34
      const w = 46 - layer * 9
      const off = (layer * Math.PI) / n
      for (let i = 0; i < n; i++) {
        g.save()
        g.rotate((i * 2 * Math.PI) / n + off)
        g.beginPath()
        g.moveTo(0, 0)
        g.bezierCurveTo(-w, -r * 0.3, -w * 0.95, -r, 0, -r)
        g.bezierCurveTo(w * 0.95, -r, w, -r * 0.3, 0, 0)
        const gr = g.createLinearGradient(0, 0, 0, -r)
        gr.addColorStop(0, css(o.deep))
        gr.addColorStop(0.5, css(o.color))
        gr.addColorStop(1, css(o.light))
        g.fillStyle = gr
        g.fill()
        g.strokeStyle = 'rgba(120,30,60,.22)'
        g.lineWidth = 1.5
        g.stroke()
        g.restore()
      }
    }
    g.fillStyle = '#F4C95D'
    g.beginPath()
    g.arc(0, 0, 14, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(160,100,20,.55)'
    for (let k = 0; k < 9; k++) {
      g.beginPath()
      g.arc(Math.cos(k * 0.7) * 8, Math.sin(k * 0.7) * 8, 1.8, 0, Math.PI * 2)
      g.fill()
    }
    return tex(cv)
  }
  const leafTexture = () => {
    const cv = mk(128, 256)
    const g = cv.getContext('2d')!
    g.beginPath()
    g.moveTo(64, 8)
    g.bezierCurveTo(8, 70, 8, 190, 64, 248)
    g.bezierCurveTo(120, 190, 120, 70, 64, 8)
    const gr = g.createLinearGradient(0, 0, 128, 0)
    gr.addColorStop(0, '#d8e6d4')
    gr.addColorStop(0.5, '#f2f8ef')
    gr.addColorStop(1, '#d0e0cb')
    g.fillStyle = gr
    g.fill()
    g.strokeStyle = 'rgba(70,110,70,.45)'
    g.lineWidth = 2.5
    g.beginPath()
    g.moveTo(64, 14)
    g.lineTo(64, 242)
    g.stroke()
    for (let y = 50; y < 220; y += 30) {
      g.beginPath()
      g.moveTo(64, y)
      g.lineTo(28, y - 22)
      g.moveTo(64, y)
      g.lineTo(100, y - 22)
      g.stroke()
    }
    return tex(cv)
  }
  const latticeTexture = () => {
    const cv = mk(256, 512)
    const g = cv.getContext('2d')!
    g.strokeStyle = css(P.cream)
    g.lineWidth = 7
    g.lineCap = 'round'
    for (let k = -512; k <= 512; k += 64) {
      g.beginPath()
      g.moveTo(k, 0)
      g.lineTo(k + 512, 512)
      g.stroke()
      g.beginPath()
      g.moveTo(k, 512)
      g.lineTo(k + 512, 0)
      g.stroke()
    }
    return tex(cv)
  }
  const radialTexture = (color: THREE.Color) => {
    const cv = mk(256, 256)
    const g = cv.getContext('2d')!
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128)
    const rg = (a: number) => `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${a})`
    r.addColorStop(0, rg(1))
    r.addColorStop(0.4, rg(0.4))
    r.addColorStop(1, rg(0))
    g.fillStyle = r
    g.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(cv)
  }
  const petalTexture = () => {
    const cv = mk(64, 64)
    const g = cv.getContext('2d')!
    g.translate(32, 32)
    g.rotate(-0.5)
    g.beginPath()
    g.moveTo(0, -26)
    g.bezierCurveTo(22, -14, 18, 18, 0, 26)
    g.bezierCurveTo(-18, 18, -22, -14, 0, -26)
    const gr = g.createLinearGradient(0, -26, 0, 26)
    gr.addColorStop(0, css(P.blush))
    gr.addColorStop(1, css(P.roseLt))
    g.fillStyle = gr
    g.fill()
    return tex(cv)
  }
  const beamTexture = (color: THREE.Color) => {
    const cv = mk(128, 256)
    const g = cv.getContext('2d')!
    const rg = (a: number) => `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${a})`
    const h = g.createLinearGradient(0, 0, 128, 0)
    h.addColorStop(0, rg(0))
    h.addColorStop(0.5, rg(1))
    h.addColorStop(1, rg(0))
    g.fillStyle = h
    g.fillRect(0, 0, 128, 256)
    g.globalCompositeOperation = 'destination-in'
    const v = g.createLinearGradient(0, 0, 0, 256)
    v.addColorStop(0, 'rgba(0,0,0,.4)')
    v.addColorStop(1, 'rgba(0,0,0,1)')
    g.fillStyle = v
    g.fillRect(0, 0, 128, 256)
    return new THREE.CanvasTexture(cv)
  }

  const FLOWER_TEX = [
    flowerTexture({ petals: 5, layers: 1, color: mix(T.accent, '#ffffff', 0.15), light: mix(T.accent, '#ffffff', 0.5), deep: P.rose }),
    flowerTexture({ petals: 6, layers: 1, color: P.blush, light: mix(T.border, '#ffffff', 0.7), deep: mix(T.border, T.accent, 0.4) }),
    flowerTexture({ petals: 8, layers: 2, color: P.mid, light: mix(T.border, '#ffffff', 0.35), deep: mix(T.accent, '#000000', 0.1) }),
  ]
  const LEAF_TEX = leafTexture()
  const SAGE_TINTS = [sage, sageDk, sage.clone().lerp(sageDk, 0.5)]

  function flowerSet(parent: THREE.Scene | THREE.Group) {
    const fl: [number, number, number, number][][] = [[], [], []]
    const lf: [number, number, number, number][] = []
    const dummy = new THREE.Object3D()
    const api = {
      flower(x: number, y: number, z: number, s: number) {
        fl[(Math.random() * 3) | 0].push([x, y, z, s])
      },
      leaf(x: number, y: number, z: number, s: number) {
        lf.push([x, y, z, s])
      },
      commit() {
        const geo = new THREE.PlaneGeometry(1, 1)
        const fill = (m: THREE.InstancedMesh, list: [number, number, number, number][], tint: boolean) => {
          list.forEach((p, i) => {
            dummy.position.set(p[0], p[1], p[2])
            dummy.rotation.set(rnd(-0.35, 0.35), rnd(-0.35, 0.35), rnd(0, 6.28))
            dummy.scale.setScalar(p[3])
            dummy.updateMatrix()
            m.setMatrixAt(i, dummy.matrix)
            if (tint) m.setColorAt(i, SAGE_TINTS[(Math.random() * SAGE_TINTS.length) | 0])
          })
          m.instanceMatrix.needsUpdate = true
          if (m.instanceColor) m.instanceColor.needsUpdate = true
          m.frustumCulled = false
          parent.add(m)
        }
        if (lf.length) fill(new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: LEAF_TEX, alphaTest: 0.4, side: THREE.DoubleSide }), lf.length), lf, true)
        fl.forEach((list, vi) => {
          if (list.length) fill(new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: FLOWER_TEX[vi], alphaTest: 0.4, side: THREE.DoubleSide }), list.length), list, false)
        })
      },
    }
    return api
  }

  /* ── Scene ── */
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2))
  hostEl.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = P.haze.clone()
  scene.fog = new THREE.FogExp2(css(P.haze), 0.032)

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 90)
  let baseZ = 11
  const resize = () => {
    // Size to the host element (device frame in preview), never the window —
    // otherwise the gate framing breaks inside the builder canvas.
    const w = hostEl.clientWidth || window.innerWidth
    const h = hostEl.clientHeight || window.innerHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    const tanV = Math.tan(THREE.MathUtils.degToRad(20))
    baseZ = Math.max(11, Math.min(22, 3.1 / (tanV * camera.aspect)))
    camera.updateProjectionMatrix()
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(hostEl)

  const H = 4.2
  const LW = 2.0

  scene.add(new THREE.HemisphereLight(0xffffff, sage, 0.95))
  const key = new THREE.DirectionalLight(0xffffff, 0.7)
  key.position.set(-4, 8, 8)
  scene.add(key)
  const backLight = new THREE.PointLight(P.glow, 0.15, 40, 2)
  backLight.position.set(0, 3, -4)
  scene.add(backLight)

  const grass = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color: sage, roughness: 1 }))
  grass.rotation.x = -Math.PI / 2
  scene.add(grass)
  const pathM = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 60), new THREE.MeshStandardMaterial({ color: P.path, roughness: 0.95 }))
  pathM.rotation.x = -Math.PI / 2
  pathM.position.set(0, 0.015, -28)
  scene.add(pathM)

  const woodMat = new THREE.MeshStandardMaterial({ color: P.cream, roughness: 0.55, metalness: 0.05 })
  const goldMat = new THREE.MeshStandardMaterial({ color: mix(T.border, T.accent, 0.35), metalness: 0.7, roughness: 0.35 })
  const sceneSet = flowerSet(scene)

  const bushes: [number, number, number][] = [[-4.3, -6, 1.5], [4.5, -7.5, 1.7], [-5, -12, 1.8], [5.3, -13, 1.6], [-4.6, -18, 1.8], [4.9, -19, 1.7], [-5.2, -25, 1.9]]
  bushes.forEach((b) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(b[2], 18, 12), new THREE.MeshStandardMaterial({ color: sageDk, roughness: 1 }))
    m.scale.y = 0.85
    m.position.set(b[0], b[2] * 0.75, b[1])
    scene.add(m)
    for (let i = 0; i < Math.floor(16 * DENSITY); i++) {
      const dx = rnd(-1, 1)
      const dy = rnd(0.1, 1)
      const dz = rnd(-0.2, 1)
      const l = Math.hypot(dx, dy, dz)
      sceneSet.flower(b[0] + (dx / l) * b[2] * 1.03, b[2] * 0.75 + (dy / l) * b[2] * 0.87, b[1] + (dz / l) * b[2] * 1.03, rnd(0.5, 0.85))
    }
  })

  const archAt = (z: number, s: number, n: number, detail: boolean) => {
    const R = LW + 0.16
    const grp = new THREE.Group()
    grp.position.set(0, 0, z)
    grp.scale.setScalar(s)
    const torus = new THREE.Mesh(new THREE.TorusGeometry(R, 0.12, 10, 56, Math.PI), woodMat)
    torus.position.y = H
    grp.add(torus)
    ;[-1, 1].forEach((sd) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, H, 14), woodMat)
      post.position.set(sd * R, H / 2, 0)
      grp.add(post)
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5), woodMat)
      base.position.set(sd * R, 0.1, 0)
      grp.add(base)
      if (detail) {
        const fin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), goldMat)
        fin.position.set(sd * R, 0.32, 0.2)
        grp.add(fin)
      }
    })
    const count = Math.floor(n * DENSITY)
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI
      const r = R + rnd(-0.17, 0.17)
      sceneSet.flower(Math.cos(th) * r * s, (H + Math.sin(th) * r) * s, z + rnd(-0.2, 0.2) * s, rnd(0.34, 0.62) * s)
      if (i % 3 === 0) sceneSet.leaf(Math.cos(th) * r * s, (H + Math.sin(th) * r) * s, z + rnd(-0.2, 0.2) * s, rnd(0.4, 0.65) * s)
    }
    for (let j = 0; j < Math.floor(count * 0.5); j++) {
      const sd2 = j % 2 ? 1 : -1
      sceneSet.flower((sd2 * R + rnd(-0.22, 0.22)) * s, rnd(0.1, H) * s, z + rnd(-0.2, 0.2) * s, rnd(0.3, 0.52) * s)
      if (j % 3 === 0) sceneSet.leaf((sd2 * R + rnd(-0.25, 0.25)) * s, rnd(0.1, H) * s, z + rnd(-0.2, 0.2) * s, rnd(0.4, 0.6) * s)
    }
    scene.add(grp)
  }
  archAt(0, 1, 130, true)
  archAt(-8, 0.92, 80, false)
  archAt(-14, 0.84, 70, false)
  archAt(-20, 0.76, 60, false)

  const latticeMap = latticeTexture()
  const door = (side: number) => {
    const grp = new THREE.Group()
    grp.position.set(side * LW, 0, 0)
    const cx = (-side * LW) / 2
    const lat = new THREE.Mesh(
      new THREE.PlaneGeometry(LW - 0.24, H - 0.24),
      new THREE.MeshStandardMaterial({ map: latticeMap, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6 }),
    )
    lat.position.set(cx, H / 2, 0)
    grp.add(lat)
    const bar = (w: number, h: number, x: number, y: number) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), woodMat)
      b.position.set(x, y, 0)
      grp.add(b)
    }
    bar(LW, 0.14, cx, H - 0.07)
    bar(LW, 0.14, cx, 0.07)
    bar(LW, 0.1, cx, H * 0.36)
    bar(0.14, H, -side * 0.07, H / 2)
    bar(0.14, H, -side * (LW - 0.07), H / 2)
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), goldMat)
    knob.position.set(-side * (LW - 0.22), H * 0.5, 0.09)
    grp.add(knob)
    const k2 = knob.clone()
    k2.position.z = -0.09
    grp.add(k2)
    const set = flowerSet(grp)
    const vines = Math.floor(46 * DENSITY)
    for (let i = 0; i < vines; i++) {
      const u = Math.random()
      let x = 0
      let y = 0
      if (u < 0.45) {
        x = -side * rnd(0.05, 0.7)
        y = rnd(0, H)
      } else if (u < 0.8) {
        x = -side * rnd(0.05, LW * 0.85)
        y = rnd(0, 1.0)
      } else {
        x = -side * rnd(0.05, LW * 0.6)
        y = rnd(H - 0.9, H)
      }
      set.flower(x, y, rnd(-0.07, 0.07), rnd(0.3, 0.52))
      if (i % 3 === 0) set.leaf(x + rnd(-0.1, 0.1), y + rnd(-0.1, 0.1), rnd(-0.07, 0.07), rnd(0.35, 0.55))
    }
    set.commit()
    scene.add(grp)
    return grp
  }
  const doorL = door(-1)
  const doorR = door(1)
  sceneSet.commit()

  const beamMat = new THREE.MeshBasicMaterial({ map: beamTexture(P.glow), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(4.0, H), beamMat)
  // Offset so the dolly never pierces the quad head-on (was a 1-frame
  // full-screen flash mid-crossing); reads as a side light shaft instead.
  beam.position.set(2.4, H / 2, -0.15)
  scene.add(beam)
  const glowMat = new THREE.MeshBasicMaterial({ map: radialTexture(P.glow), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), glowMat)
  glow.position.set(0, 4, -34)
  scene.add(glow)

  const N = PETALS
  const ppos = new Float32Array(N * 3)
  const pspd = new Float32Array(N)
  const pph = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    ppos[i * 3] = rnd(-7, 7)
    ppos[i * 3 + 1] = rnd(0, 9)
    ppos[i * 3 + 2] = rnd(-24, 6)
    pspd[i] = rnd(0.25, 0.6)
    pph[i] = rnd(0, 6.28)
  }
  const pgeo = new THREE.BufferGeometry()
  pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3))
  scene.add(new THREE.Points(pgeo, new THREE.PointsMaterial({ size: small ? 0.42 : 0.28, map: petalTexture(), transparent: true, alphaTest: 0.05, depthWrite: false })))

  let tx = 0
  let ty = 0
  let px = 0
  let py = 0
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    tx = (e.clientX / window.innerWidth - 0.5) * 2
    ty = (e.clientY / window.innerHeight - 0.5) * 2
  }
  window.addEventListener('pointermove', onMove)

  let phase: 'idle' | 'opening' = 'idle'
  let t0 = 0
  let opened = false
  let finished = false
  let last = performance.now()
  let blendFrom = { x: 0, y: 2.2, z: baseZ }
  const DOOR_MAX = THREE.MathUtils.degToRad(105)

  playFn = () => {
    if (phase !== 'idle') return
    phase = 'opening'
    t0 = performance.now()
    // Blend start: freeze the idle sway/parallax pose and ease onto the dolly
    // path over the first 400ms (kills the tap-at-extreme jump-cut).
    blendFrom = { x: px * 0.55, y: 2.2 - py * 0.25, z: baseZ }
    tx = 0
    ty = 0
    px = 0
    py = 0
  }

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    px += (tx - px) * 0.06
    py += (ty - py) * 0.06

    for (let i = 0; i < N; i++) {
      ppos[i * 3 + 1] -= pspd[i] * dt
      ppos[i * 3] += Math.sin(now / 1200 + pph[i]) * 0.35 * dt
      if (ppos[i * 3 + 1] < 0) ppos[i * 3 + 1] = 9
    }
    pgeo.attributes.position.needsUpdate = true

    if (phase === 'idle') {
      camera.position.set(px * 0.55, 2.2 - py * 0.25 + Math.sin(now / 2200) * 0.04, baseZ + Math.sin(now / 3000) * 0.1)
      camera.lookAt(0, 3.1, 0)
    } else {
      const t = now - t0
      const d = easeIO3(clamp01(t / DOOR_MS))
      doorL.rotation.y = d * DOOR_MAX
      doorR.rotation.y = -d * DOOR_MAX
      const g = clamp01(t / DOOR_MS)
      beamMat.opacity = g * 0.55
      glowMat.opacity = 0.35 + 0.65 * g
      backLight.intensity = 0.15 + 1.6 * g
      const s = easeIO3(clamp01((t - DOLLY_START) / DOLLY_DUR))
      // End nestled among the flower arches (not past them staring at the
      // path): the last garden frame before the flash is blossoms + glow.
      // Ease off the frozen idle pose onto the dolly path (first 400ms).
      const bt = 1 - Math.pow(1 - clamp01(t / 400), 3)
      camera.position.set(
        lerp(blendFrom.x, px * 0.55 * (1 - s), bt),
        lerp(blendFrom.y, lerp(2.2, 2.0, s), bt),
        lerp(blendFrom.z, lerp(baseZ, -13, s), bt),
      )
      camera.fov = lerp(40, 54, s)
      camera.updateProjectionMatrix()
      camera.lookAt(0, lerp(3.1, 3.4, s), lerp(0, -26, s))
      if (!opened && t >= FLASH_AT) {
        opened = true
        emit('opened')
      }
      if (!finished && t >= END_MS) {
        finished = true
        emit('done')
      }
    }
    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(frame)

  return () => {
    cancelAnimationFrame(raf)
    ro.disconnect()
    window.removeEventListener('pointermove', onMove)
    playFn = null
    scene.traverse((o) => {
      const inst = o as unknown as THREE.InstancedMesh
      if (inst.isInstancedMesh) inst.dispose()
      const mesh = o as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((m) => {
        const mm = m as THREE.MeshBasicMaterial
        if (mm.map) mm.map.dispose()
        m.dispose()
      })
      else if (mat) {
        const mm = mat as THREE.MeshBasicMaterial
        if (mm.map) mm.map.dispose()
        mat.dispose()
      }
    })
    renderer.dispose()
    renderer.domElement.remove()
  }
}
</script>

<template>
  <div ref="host" class="gate3d-host absolute inset-0" aria-hidden="true" />
</template>
