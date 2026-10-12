<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { prefersReducedMotion } from '@/composables/useAnimation'

/**
 * Flower gate intro (WebGL). Morning garden: an arch smothered in
 * blossoms, two lattice doors, falling petals. Doors swing inward, the camera
 * dollies through flower arches, then hands off. All text lives in DOM
 * overlays owned by InvitationCover — this component is pure scenery.
 *
 * Flower/leaf colors derive from the active theme (--inv-*) read off the host
 * element; garden sage is a fixed green tinted 35% by the theme accent.
 *
 * motif="jawa": gold kenanga blossoms, rising gold dust (not falling petals),
 * and a procedural kawung batik backdrop (pure GLSL, zero image assets).
 */
const emit = defineEmits<{
  opened: []
  done: []
  skipped: []
}>()

const props = withDefaults(defineProps<{ motif?: 'floral' | 'jawa' }>(), { motif: 'floral' })

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
  // Jawa motif: gold kenanga garden on procedural kawung batik.
  const JAWA = props.motif === 'jawa'

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

  const FLOWER_TEX = JAWA
    ? [
        flowerTexture({ petals: 6, layers: 2, color: mix(T.accent, T.surface, 0.2), light: mix(T.accent, '#ffffff', 0.55), deep: mix(T.accent, '#000000', 0.18) }),
        flowerTexture({ petals: 5, layers: 1, color: mix(T.border, '#ffffff', 0.3), light: mix(T.surface, '#ffffff', 0.5), deep: mix(T.accent, T.border, 0.45) }),
        flowerTexture({ petals: 8, layers: 2, color: mix(T.accent, T.surface, 0.4), light: mix(T.border, '#ffffff', 0.5), deep: mix(T.accent, '#000000', 0.08) }),
      ]
    : [
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
  // Jawa-only shared materials: temple stone + ember gold.
  const stoneMat = new THREE.MeshStandardMaterial({ color: mix(T.surface, T.border, 0.5), roughness: 0.9 })
  const flameMat = new THREE.MeshStandardMaterial({ color: mix(T.accent, '#ffffff', 0.3), emissive: mix(T.accent, '#ffffff', 0.2), emissiveIntensity: 0.8, roughness: 0.5 })
  const sceneSet = flowerSet(scene)
  // Per-frame sway registry (canopies, fronds). Filled by builders below.
  const swayers: { o: THREE.Object3D; ph: number; amp: number }[] = []

  // Jawa: banyan trees flanking the mid path (canopy sways in the loop).
  const waringinAt = (x: number, z: number, s: number, ph: number) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    g.scale.setScalar(s)
    const trunkMat = new THREE.MeshStandardMaterial({ color: mix(T.text, T.surface, 0.15), roughness: 1 })
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 3.0, 10), trunkMat)
    trunk.position.y = 1.5
    g.add(trunk)
    const canopy = new THREE.Group()
    canopy.position.y = 3.2
    g.add(canopy)
    const leafMat = new THREE.MeshStandardMaterial({ color: mix('#3f5a2a', T.accent, 0.3), roughness: 1 })
    const blobs: [number, number, number, number][] = [[0, 0.5, 0, 1.5], [-1.1, 0.1, 0.2, 1.0], [1.1, 0.15, -0.2, 1.05]]
    blobs.forEach((b) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(b[3], 14, 10), leafMat)
      m.position.set(b[0], b[1], b[2])
      m.scale.y = 0.8
      canopy.add(m)
    })
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.6, 6), trunkMat)
      const a = (i / 3) * Math.PI * 2 + 0.5
      r.position.set(Math.cos(a) * 0.9, -0.5, Math.sin(a) * 0.9)
      canopy.add(r)
    }
    scene.add(g)
    swayers.push({ o: canopy, ph, amp: 0.03 })
  }

  const bushes: [number, number, number][] = [[-4.3, -6, 1.5], [4.5, -7.5, 1.7], [-5, -12, 1.8], [5.3, -13, 1.6], [-4.6, -18, 1.8], [4.9, -19, 1.7], [-5.2, -25, 1.9]]
  if (JAWA) {
    // Stone lanterns guard the gate; banyans shade the mid path.
    const lanterns: [number, number][] = [[-3.4, -5], [3.4, -5], [-3.8, -12], [3.8, -12]]
    lanterns.forEach(([x, z]) => {
      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.0, 0.55), stoneMat)
      ped.position.set(x, 0.5, z)
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.7), stoneMat)
      box.position.set(x, 1.27, z)
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.3, 0.72), flameMat)
      win.position.set(x, 1.27, z)
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.45, 4), stoneMat)
      roof.position.set(x, 1.77, z)
      roof.rotation.y = Math.PI / 4
      scene.add(ped, box, win, roof)
    })
  } else {
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
  }
  if (JAWA) {
    waringinAt(-5.2, -9, 1.0, 0)
    waringinAt(5.2, -10, 1.1, 1.3)
    waringinAt(-5.6, -17, 1.2, 2.1)
    waringinAt(5.6, -18, 0.95, 2.9)
  }

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
  if (!JAWA) {
    archAt(0, 1, 130, true)
    archAt(-8, 0.92, 80, false)
    archAt(-14, 0.84, 70, false)
    archAt(-20, 0.76, 60, false)
  }

  // Jawa: candi bentar split-gates instead of flower arches — stepped
  // stone towers with gold trims and ember finials.
  const bentarAt = (z: number, s: number) => {
    const grp = new THREE.Group()
    grp.position.set(0, 0, z)
    grp.scale.setScalar(s)
    const widths = [1.25, 1.05, 0.85, 0.65, 0.45]
    const stepH = 0.72
    ;[-1, 1].forEach((sd) => {
      const tx = sd * (LW + 0.55)
      widths.forEach((wdt, i) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(wdt, stepH, 0.9 - i * 0.08), stoneMat)
        m.position.set(tx, stepH / 2 + i * stepH, 0)
        grp.add(m)
        const trim = new THREE.Mesh(new THREE.BoxGeometry(wdt + 0.08, 0.07, 0.98 - i * 0.08), goldMat)
        trim.position.set(tx, (i + 1) * stepH, 0)
        grp.add(trim)
      })
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 10), flameMat)
      flame.position.set(tx, widths.length * stepH + 0.25, 0)
      grp.add(flame)
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 1.2), stoneMat)
      base.position.set(tx, 0.17, 0)
      grp.add(base)
    })
    scene.add(grp)
  }
  if (JAWA) {
    bentarAt(0, 1)
    bentarAt(-8, 0.92)
    bentarAt(-14, 0.84)
    bentarAt(-20, 0.76)
  }

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
  // Jawa: the opening IS a gunungan — two carved halves split apart.
  // Silhouette: pointed apex, tumpal-serrated sides, scalloped ocean base.
  const fitUV = (geo: THREE.BufferGeometry, w: number, h: number) => {
    const pos = geo.attributes.position as THREE.BufferAttribute
    const uv = geo.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w, pos.getY(i) / h)
    uv.needsUpdate = true
  }
  const carveTexture = () => {
    const cv = mk(256, 512)
    const g = cv.getContext('2d')!
    const base = g.createLinearGradient(0, 0, 0, 512)
    base.addColorStop(0, css(mix(T.text, T.surface, 0.3)))
    base.addColorStop(1, css(col(T.text)))
    g.fillStyle = base
    g.fillRect(0, 0, 256, 512)
    const gold = css(mix(T.accent, '#ffffff', 0.15))
    g.strokeStyle = gold
    g.fillStyle = gold
    g.lineWidth = 5
    g.strokeRect(10, 10, 236, 492)
    // Spine on the inner (center) edge.
    g.lineWidth = 7
    g.beginPath()
    g.moveTo(234, 24)
    g.lineTo(234, 436)
    g.stroke()
    // Vine curls opening outward from the spine.
    g.lineWidth = 4
    for (let k = 0; k < 3; k++) {
      const y = 130 + k * 105
      g.beginPath()
      g.moveTo(234, y)
      g.bezierCurveTo(190, y - 46, 150, y - 38, 132, y + 4)
      g.bezierCurveTo(122, y + 30, 140, y + 48, 158, y + 40)
      g.stroke()
      g.beginPath()
      g.arc(158, y + 40, 7, 0, Math.PI * 2)
      g.fill()
    }
    // Faint kawung dot lattice.
    g.globalAlpha = 0.3
    for (let gx = 52; gx <= 204; gx += 38) {
      for (let gy = 70; gy <= 430; gy += 60) {
        g.beginPath()
        g.arc(gx, gy, 4, 0, Math.PI * 2)
        g.fill()
        g.lineWidth = 2
        g.beginPath()
        g.arc(gx, gy, 10, 0, Math.PI * 2)
        g.stroke()
      }
    }
    g.globalAlpha = 1
    // Tumpal triangles along the outer edge.
    for (let y = 30; y < 470; y += 36) {
      g.beginPath()
      g.moveTo(12, y)
      g.lineTo(44, y + 18)
      g.lineTo(12, y + 36)
      g.closePath()
      g.fill()
    }
    // Ocean waves along the base.
    g.lineWidth = 4
    for (let i = 0; i < 3; i++) {
      g.beginPath()
      g.arc(64 + i * 64, 478, 26, Math.PI, 0)
      g.stroke()
    }
    return tex(cv)
  }
  const gununganDoor = (side: number) => {
    const grp = new THREE.Group()
    grp.position.set(side * LW, 0, 0)
    const w = LW
    const h = H
    const s = new THREE.Shape()
    // Ocean scallops along the base.
    s.moveTo(0.02, 0.3)
    s.quadraticCurveTo(0.35, 0.02, 0.68, 0.3)
    s.quadraticCurveTo(1.0, 0.02, 1.33, 0.3)
    s.quadraticCurveTo(1.66, 0.02, 1.98, 0.3)
    // Inner spine rises to the pointed apex.
    s.lineTo(w - 0.02, h)
    // Shoulder down to the serrated outer edge.
    s.quadraticCurveTo(1.15, 4.02, 0.35, 3.86)
    const teeth = 12
    for (let i = 0; i <= teeth; i++) {
      const y = 3.86 - (3.86 - 0.3) * (i / teeth)
      s.lineTo(i % 2 === 0 ? 0.35 : 0.02, y)
    }
    s.closePath()
    const carvedMat = new THREE.MeshStandardMaterial({ map: carveTexture(), roughness: 0.7, metalness: 0.1, side: THREE.DoubleSide })
    const mkHalf = (mirror: boolean) => {
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false })
      fitUV(geo, w, h)
      // Right hinge needs inner edge toward -x; mirroring keeps UVs on vertices.
      if (mirror) geo.scale(-1, 1, 1)
      geo.translate(0, 0, -0.06)
      return new THREE.Mesh(geo, carvedMat)
    }
    grp.add(mkHalf(side === 1))
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), goldMat)
    knob.position.set(-side * (w - 0.3), h * 0.5, 0.12)
    grp.add(knob)
    const k2 = knob.clone()
    k2.position.z = -0.12
    grp.add(k2)
    scene.add(grp)
    return grp
  }
  const doorL = JAWA ? gununganDoor(-1) : door(-1)
  const doorR = JAWA ? gununganDoor(1) : door(1)
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

  // Jawa only: procedural kawung batik backdrop (pure GLSL, zero assets).
  // ShaderMaterial skips three's output transform, so uniforms are converted
  // to sRGB on the CPU to match the theme hexes.
  let kawungMat: THREE.ShaderMaterial | null = null
  if (JAWA) {
    const srgb = (h: string) => {
      const c = col(h).convertLinearToSRGB()
      return new THREE.Vector3(c.r, c.g, c.b)
    }
    kawungMat = new THREE.ShaderMaterial({
      uniforms: {
        uA: { value: srgb(T.accent) },
        uB: { value: srgb(T.border) },
        uS: { value: srgb(T.surface) },
        uT: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform vec3 uA;
        uniform vec3 uB;
        uniform vec3 uS;
        uniform float uT;
        void main() {
          vec2 uv = vUv * vec2(9.0, 5.0);
          uv += vec2(uT * 0.008, uT * 0.005);
          vec2 cell = fract(uv) - 0.5;
          float d1 = length(cell);
          vec2 q = abs(cell);
          float d2 = min(length(q - vec2(0.25, 0.0)), length(q - vec2(0.0, 0.25)));
          float ring1 = 1.0 - smoothstep(0.0, 0.035, abs(d1 - 0.30));
          float ring2 = 1.0 - smoothstep(0.0, 0.030, abs(d2 - 0.13));
          float dotm = 1.0 - smoothstep(0.0, 0.05, d1);
          vec3 colr = mix(uS, uB, 0.55);
          colr = mix(colr, uA, clamp(ring1 + ring2, 0.0, 1.0) * 0.85);
          colr = mix(colr, uA, dotm * 0.9);
          float vig = smoothstep(1.15, 0.35, length(vUv - 0.5));
          colr *= mix(0.55, 1.0, vig);
          gl_FragColor = vec4(colr, 1.0);
        }
      `,
      fog: false,
      depthWrite: false,
    })
    const kawung = new THREE.Mesh(new THREE.PlaneGeometry(60, 34), kawungMat)
    kawung.position.set(0, 6, -34)
    scene.add(kawung)
  }

  // Jawa only: living sky — drifting gull silhouettes (1 draw call).
  let birdSys: { geo: THREE.BufferGeometry; cx: number; cy: number; cz: number; r: Float32Array; sp: Float32Array; ph: Float32Array; n: number } | null = null
  if (JAWA) {
    const cv = mk(64, 32)
    const g2 = cv.getContext('2d')!
    g2.strokeStyle = css(mix(T.text, '#ffffff', 0.2))
    g2.lineWidth = 4
    g2.lineCap = 'round'
    g2.beginPath()
    g2.moveTo(6, 20)
    g2.quadraticCurveTo(20, 6, 32, 18)
    g2.quadraticCurveTo(44, 6, 58, 20)
    g2.stroke()
    const n = small ? 8 : 12
    const bp = new Float32Array(n * 3)
    const r = new Float32Array(n)
    const sp = new Float32Array(n)
    const ph = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      r[i] = rnd(6, 10)
      sp[i] = rnd(0.08, 0.2) * (Math.random() < 0.5 ? 1 : -1)
      ph[i] = rnd(0, 6.28)
    }
    const bgeo = new THREE.BufferGeometry()
    bgeo.setAttribute('position', new THREE.BufferAttribute(bp, 3))
    const bmat = new THREE.PointsMaterial({ size: 0.55, map: tex(cv), transparent: true, alphaTest: 0.05, depthWrite: false })
    const pts = new THREE.Points(bgeo, bmat)
    pts.frustumCulled = false
    scene.add(pts)
    birdSys = { geo: bgeo, cx: 0, cy: 7.5, cz: -14, r, sp, ph, n }
  }

  // Jawa only: gold butterflies wandering the path (CPU flap, ~12 matrices).
  let flySys: { mesh: THREE.InstancedMesh; c: Float32Array; s: Float32Array; ph: Float32Array; fl: Float32Array; n: number; dummy: THREE.Object3D } | null = null
  if (JAWA) {
    const cv = mk(64, 64)
    const g2 = cv.getContext('2d')!
    const wing = css(mix(T.accent, '#ffffff', 0.25))
    g2.fillStyle = wing
    g2.beginPath()
    g2.ellipse(20, 32, 13, 20, -0.35, 0, Math.PI * 2)
    g2.fill()
    g2.beginPath()
    g2.ellipse(44, 32, 13, 20, 0.35, 0, Math.PI * 2)
    g2.fill()
    g2.strokeStyle = css(col(T.text))
    g2.lineWidth = 3
    g2.beginPath()
    g2.moveTo(32, 12)
    g2.lineTo(32, 54)
    g2.stroke()
    const n = small ? 8 : 12
    const mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.34, 0.34),
      new THREE.MeshBasicMaterial({ map: tex(cv), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }),
      n,
    )
    const tints = [col(T.accent), mix(T.accent, '#ffffff', 0.3), mix(T.accent, T.text, 0.4)]
    const c = new Float32Array(n * 3)
    const s = new Float32Array(n * 2)
    const ph = new Float32Array(n)
    const fl = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      mesh.setColorAt(i, tints[i % tints.length])
      c[i * 3] = rnd(-3, 3)
      c[i * 3 + 1] = rnd(1, 3.5)
      c[i * 3 + 2] = rnd(-16, -2)
      s[i * 2] = rnd(0.5, 1.2)
      s[i * 2 + 1] = rnd(0.15, 0.35)
      ph[i] = rnd(0, 6.28)
      fl[i] = rnd(9, 14)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.frustumCulled = false
    scene.add(mesh)
    flySys = { mesh, c, s, ph, fl, n, dummy: new THREE.Object3D() }
  }

  // Jawa only: full carved gebyok wall — the dolly's final backdrop.
  // Couple names stay in the DOM frame card floating before it.
  if (JAWA) {
    const cv = mk(512, 288)
    const g2 = cv.getContext('2d')!
    const base = g2.createLinearGradient(0, 0, 0, 288)
    base.addColorStop(0, css(mix(T.text, T.surface, 0.18)))
    base.addColorStop(1, css(col(T.text)))
    g2.fillStyle = base
    g2.fillRect(0, 0, 512, 288)
    const gold = css(mix(T.accent, '#ffffff', 0.15))
    g2.strokeStyle = gold
    g2.fillStyle = gold
    // Tumpal frieze.
    for (let x = 8; x < 512; x += 32) {
      g2.beginPath()
      g2.moveTo(x, 8)
      g2.lineTo(x + 16, 36)
      g2.lineTo(x + 32, 8)
      g2.closePath()
      g2.fill()
    }
    // Five carved panels with kawung medallions.
    for (let i = 0; i < 5; i++) {
      const x0 = 14 + i * 98
      const wdt = 78
      g2.lineWidth = 4
      g2.strokeRect(x0, 52, wdt, 168)
      g2.lineWidth = 2
      g2.strokeRect(x0 + 9, 61, wdt - 18, 150)
      const mx = x0 + wdt / 2
      const my = 136
      g2.lineWidth = 3
      g2.beginPath()
      g2.arc(mx, my, 26, 0, Math.PI * 2)
      g2.stroke()
      for (let k = 0; k < 8; k++) {
        g2.save()
        g2.translate(mx, my)
        g2.rotate((k * Math.PI) / 4)
        g2.beginPath()
        g2.ellipse(0, -17, 6, 11, 0, 0, Math.PI * 2)
        g2.stroke()
        g2.restore()
      }
      g2.beginPath()
      g2.arc(mx, my, 5, 0, Math.PI * 2)
      g2.fill()
    }
    // Base wave band.
    g2.lineWidth = 3
    for (let i = 0; i < 8; i++) {
      g2.beginPath()
      g2.arc(32 + i * 64, 262, 24, Math.PI, 0)
      g2.stroke()
    }
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(17, 7.5),
      new THREE.MeshStandardMaterial({ map: tex(cv), roughness: 0.8 }),
    )
    wall.position.set(0, 3.6, -31)
    scene.add(wall)
    ;[-1, 1].forEach((sd) => {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.9, 8, 0.9), stoneMat)
      pil.position.set(sd * 9, 4, -31)
      scene.add(pil)
    })
    const beam = new THREE.Mesh(new THREE.BoxGeometry(19.5, 0.8, 1.1), stoneMat)
    beam.position.set(0, 7.9, -31)
    scene.add(beam)
    const trim = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.15, 1.15), goldMat)
    trim.position.set(0, 7.45, -31)
    scene.add(trim)
  }

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
  // Jawa: rising gold dust (additive); floral: falling petals.
  const dustMat = new THREE.PointsMaterial({
    size: small ? 0.42 : 0.28,
    map: JAWA ? radialTexture(mix(T.accent, '#ffffff', 0.35)) : petalTexture(),
    transparent: true,
    alphaTest: 0.05,
    depthWrite: false,
    ...(JAWA ? { blending: THREE.AdditiveBlending } : {}),
  })
  scene.add(new THREE.Points(pgeo, dustMat))

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
      if (JAWA) {
        ppos[i * 3 + 1] += pspd[i] * dt * 0.7
        ppos[i * 3] += Math.sin(now / 1400 + pph[i]) * 0.3 * dt
        if (ppos[i * 3 + 1] > 9) ppos[i * 3 + 1] = 0
      } else {
        ppos[i * 3 + 1] -= pspd[i] * dt
        ppos[i * 3] += Math.sin(now / 1200 + pph[i]) * 0.35 * dt
        if (ppos[i * 3 + 1] < 0) ppos[i * 3 + 1] = 9
      }
    }
    pgeo.attributes.position.needsUpdate = true
    if (kawungMat) kawungMat.uniforms.uT.value = now / 1000

    if (JAWA) {
      const tt = now / 1000
      swayers.forEach((sw) => {
        sw.o.rotation.z = Math.sin(tt * 1.1 + sw.ph) * sw.amp
        sw.o.rotation.x = Math.cos(tt * 0.9 + sw.ph) * sw.amp * 0.6
      })
      flameMat.emissiveIntensity = 0.8 + Math.sin(tt * 7) * 0.12 + Math.sin(tt * 13.7) * 0.08
      if (birdSys) {
        const bp = birdSys.geo.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < birdSys.n; i++) {
          const a = birdSys.ph[i] + now / 1000 * birdSys.sp[i]
          bp.setXYZ(i, birdSys.cx + Math.cos(a) * birdSys.r[i], birdSys.cy + Math.sin(tt * 0.9 + birdSys.ph[i]) * 0.5, birdSys.cz + Math.sin(a) * birdSys.r[i] * 0.6)
        }
        bp.needsUpdate = true
      }
      if (flySys) {
        for (let i = 0; i < flySys.n; i++) {
          const fx = flySys.c[i * 3] + Math.sin(tt * flySys.s[i * 2 + 1] + flySys.ph[i]) * 1.2
          const fy = flySys.c[i * 3 + 1] + Math.sin(tt * flySys.s[i * 2] + flySys.ph[i] * 2) * 0.5
          const fz = flySys.c[i * 3 + 2] + Math.cos(tt * flySys.s[i * 2 + 1] * 0.8 + flySys.ph[i]) * 1.0
          flySys.dummy.position.set(fx, fy, fz)
          flySys.dummy.rotation.set(0, Math.sin(tt * 0.7 + flySys.ph[i]) * 0.6, 0)
          const flap = 0.25 + Math.abs(Math.sin(tt * flySys.fl[i] + flySys.ph[i])) * 0.75
          flySys.dummy.scale.set(flap, 1, 1)
          flySys.dummy.updateMatrix()
          flySys.mesh.setMatrixAt(i, flySys.dummy.matrix)
        }
        flySys.mesh.instanceMatrix.needsUpdate = true
      }
    }

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
