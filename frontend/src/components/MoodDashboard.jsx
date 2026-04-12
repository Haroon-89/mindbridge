import './MoodDashboard.css'

const PLANT_CONFIG = {
  hopeful:    { stem: '#e8a020', bloom: '#ffd93d', petals: '#ffb347', center: '#ff6b35', label: 'Hopeful',   emoji: '🌻', type: 'sunflower'  },
  neutral:    { stem: '#3a8a5a', bloom: '#a8e6cf', petals: '#5cb87a', center: '#2d7a4a', label: 'Peaceful',  emoji: '🎋', type: 'bamboo'     },
  anxious:    { stem: '#b8860b', bloom: '#ffe066', petals: '#ffc947', center: '#e8a020', label: 'Unsettled', emoji: '🌾', type: 'wheat'      },
  sad:        { stem: '#4a7abf', bloom: '#c9e8ff', petals: '#90c4f0', center: '#5b8dd9', label: 'Tender',    emoji: '🌸', type: 'blossom'    },
  distressed: { stem: '#7a4a9a', bloom: '#e8c8ff', petals: '#c89ae8', center: '#9b59b6', label: 'Brave',     emoji: '💜', type: 'lavender'   },
}
const DEFAULT = PLANT_CONFIG.neutral

const COLOR_VARIANTS = {
  sunflower: [
    { petals: '#ffb347', center: '#ff6b35' },
    { petals: '#ff8c00', center: '#cc4400' },
    { petals: '#ffd700', center: '#e8a020' },
    { petals: '#ffcc44', center: '#d45500' },
    { petals: '#ffa500', center: '#b83200' },
  ],
  bamboo: [
    { petals: '#5cb87a', center: '#2d7a4a' },
    { petals: '#3aaa60', center: '#1a6a30' },
    { petals: '#7acc8a', center: '#3a8a5a' },
    { petals: '#4ab870', center: '#2a6a40' },
    { petals: '#60c880', center: '#308050' },
  ],
  wheat: [
    { petals: '#ffc947', center: '#e8a020' },
    { petals: '#e8b030', center: '#c07010' },
    { petals: '#ffe066', center: '#d4900a' },
    { petals: '#d4a020', center: '#a06010' },
    { petals: '#f0c040', center: '#b87818' },
  ],
  blossom: [
    { petals: '#90c4f0', center: '#5b8dd9' },
    { petals: '#ffb3c6', center: '#e05080' },
    { petals: '#c8a0f0', center: '#8050c0' },
    { petals: '#a0d8b0', center: '#3a8a5a' },
    { petals: '#f0b0d0', center: '#c06090' },
  ],
  lavender: [
    { petals: '#c89ae8', center: '#9b59b6' },
    { petals: '#a070d0', center: '#7040a0' },
    { petals: '#d8b0f8', center: '#b070d8' },
    { petals: '#e0a0c8', center: '#b06090' },
    { petals: '#b888e0', center: '#8848b8' },
  ],
}

function variantCfg(cfg, idx) {
  const variants = COLOR_VARIANTS[cfg.type]
  if (!variants) return cfg
  const v = variants[idx % variants.length]
  return { ...cfg, petals: v.petals, center: v.center }
}

const AFFIRMATIONS = [
  "Every time you showed up, you chose yourself. 💚",
  "Your garden grows with every brave conversation.",
  "You are more resilient than you know. 🌸",
  "Each bloom is proof you kept going.",
  "Healing is not linear, and neither is a garden. 🌿",
  "You reached out. That is everything.",
]

function Sunflower({ cfg, h, cx, tipY, sway, delay }) {
  const { stem, petals, center } = cfg
  const R = 13
  const petalAngles = [0,30,60,90,120,150,180,210,240,270,300,330]
  return (
    <g style={{ animation: `growUp 0.8s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both` }}>
      <GrassBlades cx={cx} stem={stem} />
      <path d={`M${cx},0 C${cx+sway*0.3},${-h*0.4} ${cx+sway*0.6},${-h*0.7} ${cx+sway*0.4},${tipY}`}
        stroke={stem} strokeWidth="3" fill="none" strokeLinecap="round" />
      <Leaf cx={cx} h={h} sway={sway} stem={stem} side={1} pos={0.35} />
      <Leaf cx={cx} h={h} sway={sway} stem={stem} side={-1} pos={0.62} />
      {petalAngles.map((a, i) => {
        const rad = a * Math.PI / 180
        const px = cx + sway*0.4 + Math.cos(rad) * R * 1.3
        const py = tipY + Math.sin(rad) * R * 1.3
        return <ellipse key={i} cx={px} cy={py} rx={R*0.55} ry={R*0.28} fill={petals}
          opacity="0.9" transform={`rotate(${a},${px},${py})`} />
      })}
      <circle cx={cx+sway*0.4} cy={tipY} r={R*0.72} fill={center} />
      {[0,1,2,3,4,5,6].map(i => {
        const a = i * 51.4 * Math.PI/180, r = R*0.35
        return <circle key={i} cx={cx+sway*0.4+Math.cos(a)*r} cy={tipY+Math.sin(a)*r} r="1.8" fill="#7a3a10" opacity="0.7" />
      })}
      <circle cx={cx+sway*0.4} cy={tipY} r="3" fill="#5a2a08" />
    </g>
  )
}

function Bamboo({ cfg, h, cx, tipY, sway, delay }) {
  const { stem } = cfg
  const segments = Math.max(3, Math.floor(h / 22))
  const segH = h / segments
  return (
    <g style={{ animation: `growUp 0.8s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both` }}>
      <GrassBlades cx={cx} stem={stem} />
      {Array.from({ length: segments }).map((_, i) => {
        const y0 = -i * segH, y1 = -(i+1) * segH
        const lx = cx + sway * 0.3
        return (
          <g key={i}>
            <line x1={lx} y1={y0} x2={lx} y2={y1} stroke={stem} strokeWidth="5" strokeLinecap="butt" />
            <line x1={lx-3} y1={y1} x2={lx+3} y2={y1} stroke="#2a6a3a" strokeWidth="2" />
            {i % 2 === 0 && (
              <path d={`M${lx},${y1+segH*0.3} Q${lx+18},${y1+segH*0.1} ${lx+22},${y1-segH*0.1}`}
                stroke="#4aab6a" strokeWidth="2" fill="none" strokeLinecap="round" />
            )}
            {i % 2 === 1 && (
              <path d={`M${lx},${y1+segH*0.3} Q${lx-18},${y1+segH*0.1} ${lx-22},${y1-segH*0.1}`}
                stroke="#4aab6a" strokeWidth="2" fill="none" strokeLinecap="round" />
            )}
          </g>
        )
      })}
      <ellipse cx={cx+sway*0.3} cy={tipY-6} rx="10" ry="5" fill="#5cb87a" opacity="0.8"
        transform={`rotate(-20,${cx+sway*0.3},${tipY-6})`} />
      <ellipse cx={cx+sway*0.3} cy={tipY-10} rx="8" ry="4" fill="#4aab6a" opacity="0.7"
        transform={`rotate(15,${cx+sway*0.3},${tipY-10})`} />
    </g>
  )
}

function Wheat({ cfg, h, cx, tipY, sway, delay }) {
  const { stem, petals } = cfg
  const strands = [-10,-6,-2,2,6,10]
  return (
    <g style={{ animation: `growUp 0.8s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both` }}>
      <GrassBlades cx={cx} stem={stem} />
      <path d={`M${cx},0 Q${cx+sway*0.5},${-h*0.5} ${cx+sway*0.4},${tipY}`}
        stroke={stem} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Leaf cx={cx} h={h} sway={sway} stem={stem} side={1} pos={0.4} />
      {strands.map((offset, i) => {
        const grainY = tipY + i * 5
        const droop = offset * 1.4
        return (
          <g key={i}>
            <path d={`M${cx+sway*0.4},${grainY} Q${cx+sway*0.4+droop*0.5},${grainY+4} ${cx+sway*0.4+droop},${grainY+8}`}
              stroke={petals} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <ellipse cx={cx+sway*0.4+droop} cy={grainY+10} rx="2.5" ry="4"
              fill={petals} opacity="0.85" transform={`rotate(${offset*3},${cx+sway*0.4+droop},${grainY+10})`} />
          </g>
        )
      })}
    </g>
  )
}

function Blossom({ cfg, h, cx, tipY, sway, delay }) {
  const { stem, petals, center, bloom } = cfg
  const branches = [
    { dx: -18, dy: 14, angle: -40 },
    { dx:  18, dy: 10, angle:  35 },
    { dx: -10, dy: 28, angle: -55 },
    { dx:  12, dy: 24, angle:  50 },
  ]
  return (
    <g style={{ animation: `growUp 0.8s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both` }}>
      <GrassBlades cx={cx} stem={stem} />
      <path d={`M${cx},0 C${cx+sway*0.2},${-h*0.3} ${cx+sway*0.4},${-h*0.65} ${cx+sway*0.3},${tipY}`}
        stroke={stem} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {branches.map((b, bi) => {
        const bx = cx + sway*0.3 + b.dx, by = tipY + b.dy
        return (
          <g key={bi}>
            <path d={`M${cx+sway*0.3},${tipY+b.dy*0.3} Q${bx*0.6+cx*0.4},${by-8} ${bx},${by}`}
              stroke={stem} strokeWidth="2" fill="none" strokeLinecap="round" />
            {[0,72,144,216,288].map((a, pi) => {
              const rad = a * Math.PI/180
              return <ellipse key={pi} cx={bx+Math.cos(rad)*5} cy={by+Math.sin(rad)*5}
                rx="4" ry="2.5" fill={petals} opacity="0.85"
                transform={`rotate(${a},${bx+Math.cos(rad)*5},${by+Math.sin(rad)*5})`} />
            })}
            <circle cx={bx} cy={by} r="2.5" fill={center} opacity="0.9" />
          </g>
        )
      })}
      <circle cx={cx+sway*0.3} cy={tipY} r="5" fill={bloom} opacity="0.6" />
    </g>
  )
}

function Lavender({ cfg, h, cx, tipY, sway, delay }) {
  const { stem, petals, bloom } = cfg
  const floretCount = 10
  return (
    <g style={{ animation: `growUp 0.8s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both` }}>
      <GrassBlades cx={cx} stem={stem} />
      <path d={`M${cx},0 C${cx+sway*0.2},${-h*0.4} ${cx+sway*0.3},${-h*0.7} ${cx+sway*0.2},${tipY}`}
        stroke={stem} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Leaf cx={cx} h={h} sway={sway} stem={stem} side={1} pos={0.3} />
      <Leaf cx={cx} h={h} sway={sway} stem={stem} side={-1} pos={0.55} />
      {Array.from({ length: floretCount }).map((_, i) => {
        const fy = tipY + i * 6
        const spread = (1 - i / (floretCount - 1)) * 7
        return (
          <g key={i}>
            <ellipse cx={cx+sway*0.2-spread} cy={fy} rx="3.5" ry="2" fill={petals} opacity="0.85"
              transform={`rotate(-30,${cx+sway*0.2-spread},${fy})`} />
            <ellipse cx={cx+sway*0.2+spread} cy={fy} rx="3.5" ry="2" fill={bloom} opacity="0.85"
              transform={`rotate(30,${cx+sway*0.2+spread},${fy})`} />
          </g>
        )
      })}
    </g>
  )
}

function GrassBlades({ cx, stem }) {
  return [-8,-4,4,8].map((offset, i) => (
    <path key={i}
      d={`M${cx+offset},0 Q${cx+offset+offset*0.5},-12 ${cx+offset+offset},-20`}
      stroke="#5cb87a" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.55" />
  ))
}

function Leaf({ cx, h, sway, stem, side, pos }) {
  const lx = cx + sway * pos * 0.4 + side * 10
  const ly = -h * pos
  return (
    <ellipse cx={lx} cy={ly} rx="9" ry="4"
      fill={stem} opacity="0.6"
      transform={`rotate(${side * -35},${lx},${ly})`} />
  )
}

const BOUQUET_STEMS = [
  { dx:  0,  h: 108, sway:  0  },
  { dx: -14, h:  96, sway: -10 },
  { dx:  14, h:  96, sway:  10 },
]

const BOUQUET_TYPES = ['sunflower', 'blossom', 'lavender', 'wheat', 'bamboo']

function renderPlant(type, props) {
  switch (type) {
    case 'sunflower': return <Sunflower {...props} />
    case 'bamboo':    return <Bamboo    {...props} />
    case 'wheat':     return <Wheat     {...props} />
    case 'blossom':   return <Blossom   {...props} />
    case 'lavender':  return <Lavender  {...props} />
    default:          return <Sunflower {...props} />
  }
}

function Bouquet({ plants, clusterIndex }) {
  const count = Math.min(plants.length, 3)
  const cx = 36
  return (
    <g>
      {/* Ribbon tie */}
      <path d={`M${cx-7},-10 Q${cx-14},-4 ${cx-10},0`} fill="#e8a0c0" opacity="0.75" />
      <path d={`M${cx+7},-10 Q${cx+14},-4 ${cx+10},0`} fill="#e8a0c0" opacity="0.75" />
      <ellipse cx={cx} cy={-10} rx="7" ry="4" fill="#e8a0c0" opacity="0.85" />
      <ellipse cx={cx} cy={-10} rx="4" ry="3" fill="#f8d0e8" opacity="0.95" />

      {Array.from({ length: count }).map((_, i) => {
        const s = BOUQUET_STEMS[i]
        const stemCx = cx + s.dx
        const tipY = -s.h
        const delay = clusterIndex * 0.15 + i * 0.12
        const flowerType = BOUQUET_TYPES[(clusterIndex + i) % BOUQUET_TYPES.length]
        const baseCfg = plants[i]?.config || DEFAULT
        const cfg = variantCfg({ ...baseCfg, type: flowerType }, clusterIndex * 3 + i)
        return renderPlant(flowerType, { key: i, cfg, h: s.h, cx: stemCx, tipY, sway: s.sway, delay })
      })}
    </g>
  )
}

function SunIcon({ svgW }) {
  return (
    <g transform={`translate(${svgW - 52}, 48)`}>
      <circle cx="0" cy="0" r="18" fill="#ffd93d" opacity="0.9">
        <animate attributeName="r" values="18;20;18" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="0" cy="0" r="12" fill="#ffb347" opacity="0.8" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad = deg * Math.PI / 180
        return <line key={i} x1={Math.cos(rad)*22} y1={Math.sin(rad)*22}
          x2={Math.cos(rad)*30} y2={Math.sin(rad)*30}
          stroke="#ffd93d" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      })}
    </g>
  )
}

function Cloud({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity="0.5">
      <ellipse cx="0"   cy="0"   rx="28" ry="16" fill="white" />
      <ellipse cx="22"  cy="-4"  rx="20" ry="14" fill="white" />
      <ellipse cx="-18" cy="-2"  rx="18" ry="12" fill="white" />
      <ellipse cx="8"   cy="-12" rx="16" ry="12" fill="white" />
    </g>
  )
}

function Butterfly({ x, y, color, delay, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <g style={{ animation: `flutter 1.8s ease-in-out ${delay}s infinite alternate` }}>
        <ellipse cx="-6" cy="-3" rx="7" ry="4" fill={color} opacity="0.75" transform="rotate(-20,-6,-3)" />
        <ellipse cx="6"  cy="-3" rx="7" ry="4" fill={color} opacity="0.75" transform="rotate(20,6,-3)" />
        <ellipse cx="-4" cy="3"  rx="5" ry="3" fill={color} opacity="0.55" transform="rotate(15,-4,3)" />
        <ellipse cx="4"  cy="3"  rx="5" ry="3" fill={color} opacity="0.55" transform="rotate(-15,4,3)" />
        <line x1="0" y1="-6" x2="0" y2="6" stroke="#555" strokeWidth="0.8" />
        {/* antennae */}
        <line x1="0" y1="-6" x2="-4" y2="-11" stroke="#555" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="0" y1="-6" x2="4"  y2="-11" stroke="#555" strokeWidth="0.7" strokeLinecap="round" />
        <circle cx="-4" cy="-11" r="1" fill="#555" />
        <circle cx="4"  cy="-11" r="1" fill="#555" />
      </g>
    </g>
  )
}

// Small bird (V-shape silhouette) gliding across sky
function Bird({ x, y, delay, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}
       style={{ animation: `birdGlide 0.9s ease-in-out ${delay}s infinite alternate` }}>
      <path d="M-10,0 Q-5,-5 0,-2 Q5,-5 10,0" fill="none" stroke="#5a7a6a" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  )
}

// Dragonfly
function Dragonfly({ x, y, delay }) {
  return (
    <g transform={`translate(${x},${y})`}
       style={{ animation: `flutter 1.2s ease-in-out ${delay}s infinite alternate` }}>
      {/* body */}
      <ellipse cx="0" cy="0" rx="1.5" ry="7" fill="#4aab8a" opacity="0.85" />
      {/* wings */}
      <ellipse cx="-9" cy="-2" rx="9" ry="3.5" fill="#b8f0e0" opacity="0.55" transform="rotate(-10,-9,-2)" />
      <ellipse cx="9"  cy="-2" rx="9" ry="3.5" fill="#b8f0e0" opacity="0.55" transform="rotate(10,9,-2)" />
      <ellipse cx="-7" cy="4"  rx="7" ry="2.8" fill="#a0e8d0" opacity="0.45" transform="rotate(8,-7,4)" />
      <ellipse cx="7"  cy="4"  rx="7" ry="2.8" fill="#a0e8d0" opacity="0.45" transform="rotate(-8,7,4)" />
      {/* head */}
      <circle cx="0" cy="-8" r="2.2" fill="#2a8a6a" opacity="0.9" />
    </g>
  )
}

function GardenScene({ plants }) {
  // Group into clusters of 2–3
  const clusters = []
  let i = 0
  while (i < plants.length) {
    const size = plants.length - i === 1 ? 1 : plants.length - i === 2 ? 2 : (i % 2 === 0 ? 3 : 2)
    clusters.push(plants.slice(i, i + size))
    i += size
  }

  const clusterW = 88
  const svgW = Math.max(clusters.length * clusterW + 60, 760)
  const svgH = 340
  const groundY = svgH - 30

  return (
    <div className="garden-scene-wrap">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="garden-svg" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#c8e8ff" />
            <stop offset="60%"  stopColor="#dff5ea" />
            <stop offset="100%" stopColor="#eafaf2" />
          </linearGradient>
          <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6ec898" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3a9a60" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="dirtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8B6340" />
            <stop offset="100%" stopColor="#5a3e22" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width={svgW} height={svgH} fill="url(#skyGrad)" rx="20" />

        {/* Soft horizon glow */}
        <ellipse cx={svgW/2} cy={groundY} rx={svgW*0.6} ry="40" fill="#b8f0d0" opacity="0.18" />

        {/* Clouds */}
        <Cloud x={svgW * 0.08} y={36}  scale={1.1} />
        <Cloud x={svgW * 0.42} y={22}  scale={1.3} />
        <Cloud x={svgW * 0.78} y={40}  scale={0.9} />

        {/* Sun */}
        <SunIcon svgW={svgW} />

        {/* Butterflies */}
        <Butterfly x={svgW*0.10} y={70}  color="#ffb347" delay={0}    scale={1.1} />
        <Butterfly x={svgW*0.22} y={48}  color="#ff8fab" delay={0.5}  scale={0.85} />
        <Butterfly x={svgW*0.38} y={62}  color="#c89ae8" delay={1.1}  scale={1.0} />
        <Butterfly x={svgW*0.55} y={38}  color="#ffd93d" delay={0.3}  scale={0.75} />
        <Butterfly x={svgW*0.68} y={72}  color="#90c4f0" delay={1.6}  scale={1.0} />
        <Butterfly x={svgW*0.84} y={50}  color="#a8e6cf" delay={0.8}  scale={0.9} />

        {/* Birds gliding */}
        <Bird x={svgW*0.30} y={28}  delay={0}   scale={1.1} />
        <Bird x={svgW*0.50} y={18}  delay={0.4} scale={0.85} />
        <Bird x={svgW*0.62} y={32}  delay={0.8} scale={0.9} />
        <Bird x={svgW*0.75} y={22}  delay={0.2} scale={1.0} />

        {/* Dragonflies near flowers */}
        <Dragonfly x={svgW*0.18} y={groundY - 80} delay={0.3} />
        <Dragonfly x={svgW*0.60} y={groundY - 95} delay={1.0} />
        <Dragonfly x={svgW*0.88} y={groundY - 70} delay={0.6} />

        {/* Ground strip */}
        <rect x="0" y={groundY - 8} width={svgW} height={38} fill="url(#groundGrad)" />
        <rect x="0" y={groundY - 8} width={svgW} height={6}  fill="#5cb87a" opacity="0.5" />
        {/* Dirt band */}
        <rect x="0" y={groundY + 18} width={svgW} height={12} fill="url(#dirtGrad)" opacity="0.5" />

        {/* Clusters */}
        {clusters.map((cluster, ci) => (
          <g key={ci} transform={`translate(${ci * clusterW + 20}, ${groundY - 4})`}>
            <Bouquet plants={cluster} clusterIndex={ci} />
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function MoodDashboard({ messages }) {
  const botMessages = messages.filter(m => m.role === 'bot' && m.mood_label)

  if (botMessages.length === 0) {
    return (
      <div className="garden-empty">
        <div className="garden-empty-icon">🌱</div>
        <p className="garden-empty-title">Your garden is waiting</p>
        <p className="garden-empty-sub">Start a conversation and watch your first plant bloom.</p>
      </div>
    )
  }

  // Group by calendar day
  const byDay = {}
  botMessages.forEach(m => {
    let day = 'Today'
    if (m.timestamp) {
      const d = new Date(m.timestamp)
      day = isNaN(d.getTime())
        ? 'Today'
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    if (!byDay[day]) byDay[day] = []
    byDay[day].push({
      config: PLANT_CONFIG[m.mood_label] || DEFAULT,
      tier: m.crisis_tier || 0,
      mood: m.mood_label,
    })
  })

  const dayGroups = Object.entries(byDay)

  const totalPlants = botMessages.length
  const positiveCount = botMessages.filter(m => ['hopeful', 'neutral'].includes(m.mood_label)).length
  const affirmation = AFFIRMATIONS[totalPlants % AFFIRMATIONS.length]

  let winsText
  if (positiveCount === totalPlants) winsText = `All ${totalPlants} of your moments carried light. 🌟`
  else if (positiveCount > 0) winsText = `${positiveCount} of your ${totalPlants} moments felt lighter. Your garden is growing. 🌿`
  else winsText = `You showed up ${totalPlants} time${totalPlants !== 1 ? 's' : ''}. That is everything. 💚`

  return (
    <div className="garden-wrapper">
      <div className="garden-affirmation">
        <span className="affirmation-sparkle">✨</span>
        <span>{affirmation}</span>
        <span className="affirmation-sparkle">✨</span>
      </div>

      <div className="garden-wins">{winsText}</div>

      <div className="garden-card">
        <div className="garden-header">
          <div className="garden-title">🌸 Your Mood Garden</div>
          <div className="garden-subtitle">Every plant is a moment you chose to reach out.</div>
        </div>
        <div className="garden-rows">
          {dayGroups.map(([label, plants], i) => {
            const rows = []
            for (let j = 0; j < plants.length; j += 10) rows.push(plants.slice(j, j + 10))
            return rows.map((row, ri) => (
              <GardenScene key={`${i}-${ri}`} plants={row} />
            ))
          })}
        </div>
      </div>

      <div className="garden-legend">
        {Object.entries(PLANT_CONFIG).map(([key, cfg]) => (
          <span key={key} className="legend-plant">
            <span className="legend-emoji">{cfg.emoji}</span>
            <span>{cfg.label}</span>
          </span>
        ))}
      </div>

      <div className="garden-note">
        🌧️ Even the days that felt heavy helped your garden grow. Every plant counts.
      </div>
    </div>
  )
}
