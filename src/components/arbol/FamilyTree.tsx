'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  useReactFlow,
  MarkerType,
} from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ZoomIn, ZoomOut, Maximize2, Search, X } from 'lucide-react'
import type { Persona, Matrimonio } from '@/types'
import { PersonaNode } from './PersonaNode'
import { FamNode } from './FamNode'
import { FamBgNode } from './FamBgNode'
import { GenSepNode } from './GenSepNode'
import { PersonaModal } from './PersonaModal'

// ─── Layout constants ──────────────────────────────────────────────────────────
const NODE_W = 160
const NODE_H = 165
const FAM_W = 10
const FAM_H = 10
const SUB_OFFSET = 90  // vertical offset between sibling-group sub-levels within a generation

// ─── Build ancestor/descendant set for highlighting ───────────────────────────
function getRelatedIds(
  personaId: string,
  personas: Persona[],
): Set<string> {
  const pMap = new Map(personas.map((p) => [p.id, p]))

  // Build children map
  const childrenOf = new Map<string, string[]>()
  personas.forEach((p) => {
    if (p.padre_id) {
      if (!childrenOf.has(p.padre_id)) childrenOf.set(p.padre_id, [])
      childrenOf.get(p.padre_id)!.push(p.id)
    }
    if (p.madre_id) {
      if (!childrenOf.has(p.madre_id)) childrenOf.set(p.madre_id, [])
      childrenOf.get(p.madre_id)!.push(p.id)
    }
  })

  const related = new Set<string>([personaId])

  // Walk up ancestors
  const visitAncestors = (id: string) => {
    const p = pMap.get(id)
    if (!p) return
    if (p.padre_id && pMap.has(p.padre_id) && !related.has(p.padre_id)) {
      related.add(p.padre_id)
      visitAncestors(p.padre_id)
    }
    if (p.madre_id && pMap.has(p.madre_id) && !related.has(p.madre_id)) {
      related.add(p.madre_id)
      visitAncestors(p.madre_id)
    }
  }

  // Walk down descendants
  const visitDescendants = (id: string) => {
    const children = childrenOf.get(id) ?? []
    children.forEach((childId) => {
      if (!related.has(childId)) {
        related.add(childId)
        visitDescendants(childId)
      }
    })
  }

  visitAncestors(personaId)
  visitDescendants(personaId)

  // Include spouses
  const p = pMap.get(personaId)
  if (p) {
    personas.forEach((other) => {
      if (other.padre_id === personaId || other.madre_id === personaId) {
        const spouseId = other.padre_id === personaId ? other.madre_id : other.padre_id
        if (spouseId && pMap.has(spouseId)) related.add(spouseId)
      }
    })
    if (p.padre_id || p.madre_id) {
      personas.forEach((sibling) => {
        if (sibling.id === personaId) return
        if (
          (p.padre_id && sibling.padre_id === p.padre_id) ||
          (p.madre_id && sibling.madre_id === p.madre_id)
        ) {
          related.add(sibling.id)
        }
      })
    }
  }

  return related
}

// ─── Manual generation layout ──────────────────────────────────────────────────
const H_GAP = 40   // horizontal gap between nodes
const V_GAP = 180  // vertical gap between generations (needs room for sub-level offsets)

// Children at generation index >= this value start collapsed by default (6th gen in 1-based counting)
const COLLAPSE_FROM_GEN = 5

// Compute which couple keys should start collapsed based on their children's generation.
// Uses a simplified genOf (without equalization) — good enough for initialization.
function computeInitialCollapsed(personas: Persona[], _matrimonios: Matrimonio[]): Set<string> {
  const pMap = new Map(personas.map((p) => [p.id, p]))
  const genOf = new Map<string, number>()

  const computeGen = (id: string, depth = 0): number => {
    if (depth > 60) return 0
    if (genOf.has(id)) return genOf.get(id)!
    const p = pMap.get(id)
    if (!p) return 0
    const pg = p.padre_id && pMap.has(p.padre_id) ? computeGen(p.padre_id, depth + 1) : -1
    const mg = p.madre_id && pMap.has(p.madre_id) ? computeGen(p.madre_id, depth + 1) : -1
    const parentGen = Math.max(pg, mg)
    const gen = parentGen >= 0 ? parentGen + 1 : 0
    genOf.set(id, gen)
    return gen
  }
  personas.forEach((p) => computeGen(p.id))

  const collapsed = new Set<string>()
  personas.forEach((p) => {
    if (!p.padre_id || !p.madre_id) return
    if (!pMap.has(p.padre_id) || !pMap.has(p.madre_id)) return
    if ((genOf.get(p.id) ?? 0) >= COLLAPSE_FROM_GEN) {
      collapsed.add([p.padre_id, p.madre_id].sort().join('::'))
    }
  })
  return collapsed
}

function buildLayout(
  personas: Persona[],
  matrimonios: Matrimonio[],
  onClick: (p: Persona) => void,
  highlighted: Set<string> | null,
  collapsed: Set<string>,
) {
  const pMap = new Map(personas.map((p) => [p.id, p]))
  const validMats = matrimonios.filter(
    (m) => pMap.has(m.persona1_id) && pMap.has(m.persona2_id)
  )

  // ── 1. Infer couple groups from padre_id/madre_id ────────────────────────
  const coupleMap = new Map<string, { p1: string; p2: string; children: string[] }>()
  personas.forEach((p) => {
    if (!p.padre_id || !p.madre_id) return
    if (!pMap.has(p.padre_id) || !pMap.has(p.madre_id)) return
    const key = [p.padre_id, p.madre_id].sort().join('::')
    if (!coupleMap.has(key)) coupleMap.set(key, { p1: p.padre_id, p2: p.madre_id, children: [] })
    coupleMap.get(key)!.children.push(p.id)
  })

  const childToCouple = new Map<string, string>()
  coupleMap.forEach((data, key) => data.children.forEach((c) => childToCouple.set(c, key)))

  // ── Compute hidden persons (BFS from collapsed couples' children) ─────────
  // A person is hidden if they are a descendant of a collapsed couple group.
  const hiddenPersonIds = new Set<string>()
  const bfsQueue: string[] = []
  collapsed.forEach((key) => {
    coupleMap.get(key)?.children.forEach((c) => bfsQueue.push(c))
  })
  const bfsVisited = new Set<string>()
  while (bfsQueue.length > 0) {
    const id = bfsQueue.shift()!
    if (bfsVisited.has(id)) continue
    bfsVisited.add(id)
    hiddenPersonIds.add(id)
    // Propagate through couples where this hidden person is a parent
    coupleMap.forEach((cdata) => {
      if (cdata.p1 === id || cdata.p2 === id) {
        cdata.children.forEach((c) => { if (!bfsVisited.has(c)) bfsQueue.push(c) })
      }
    })
    // Also single-parent children
    personas.forEach((p) => {
      if (!childToCouple.has(p.id) && (p.padre_id === id || p.madre_id === id)) {
        if (!bfsVisited.has(p.id)) bfsQueue.push(p.id)
      }
    })
  }

  // FamNode IDs that are completely hidden (because at least one parent is hidden)
  const hiddenFamNodeIds = new Set<string>()
  coupleMap.forEach((data, key) => {
    if (hiddenPersonIds.has(data.p1) || hiddenPersonIds.has(data.p2)) {
      hiddenFamNodeIds.add(`fam-${key}`)
    }
  })

  // Combined set for edge filtering
  const hiddenNodeIds = new Set<string>()
  hiddenPersonIds.forEach((id) => hiddenNodeIds.add(id))
  hiddenFamNodeIds.forEach((id) => hiddenNodeIds.add(id))

  // Build spouse map (personaId → Set<spouseId>) from coupleMap
  const spouseOf = new Map<string, Set<string>>()
  const addSpouse = (a: string, b: string) => {
    if (!spouseOf.has(a)) spouseOf.set(a, new Set())
    spouseOf.get(a)!.add(b)
  }
  coupleMap.forEach(({ p1, p2 }) => { addSpouse(p1, p2); addSpouse(p2, p1) })
  // Also add spouses from matrimonios (childless couples)
  validMats.forEach((m) => {
    const key = [m.persona1_id, m.persona2_id].sort().join('::')
    if (!coupleMap.has(key)) { addSpouse(m.persona1_id, m.persona2_id); addSpouse(m.persona2_id, m.persona1_id) }
  })

  // ── 2. Compute generations ────────────────────────────────────────────────
  // Seed: persona with no parents in system → gen 0
  const genOf = new Map<string, number>()

  // DFS downward from ancestors
  const setGen = (id: string, gen: number, visited = new Set<string>()) => {
    if (visited.has(id)) return
    visited.add(id)
    const cur = genOf.get(id)
    if (cur !== undefined && cur >= gen) return
    genOf.set(id, gen)
    // propagate to children
    personas.forEach((p) => {
      if (p.padre_id === id || p.madre_id === id) setGen(p.id, gen + 1, visited)
    })
  }

  // Start from roots (no parents in system)
  personas.forEach((p) => {
    if (!p.padre_id && !p.madre_id) setGen(p.id, 0)
    else if (p.padre_id && !pMap.has(p.padre_id) && p.madre_id && !pMap.has(p.madre_id)) setGen(p.id, 0)
    else if (p.padre_id && !pMap.has(p.padre_id) && !p.madre_id) setGen(p.id, 0)
    else if (p.madre_id && !pMap.has(p.madre_id) && !p.padre_id) setGen(p.id, 0)
  })

  // Anyone still unset: compute from parents
  const computeFromParents = (id: string, depth = 0): number => {
    if (depth > 50) return 0
    if (genOf.has(id)) return genOf.get(id)!
    const p = pMap.get(id)
    if (!p) return 0
    const pg = p.padre_id && pMap.has(p.padre_id) ? computeFromParents(p.padre_id, depth + 1) : -1
    const mg = p.madre_id && pMap.has(p.madre_id) ? computeFromParents(p.madre_id, depth + 1) : -1
    const parentGen = Math.max(pg, mg)
    const gen = parentGen >= 0 ? parentGen + 1 : 0
    genOf.set(id, gen)
    return gen
  }
  personas.forEach((p) => { if (!genOf.has(p.id)) computeFromParents(p.id) })

  // ── 3. Equalize couples: both spouses at same generation ─────────────────
  // Iterate until stable (handles chains: A married B married C...)
  let changed = true
  let iters = 0
  while (changed && iters++ < 30) {
    changed = false
    coupleMap.forEach(({ p1, p2, children }) => {
      const g1 = genOf.get(p1) ?? 0
      const g2 = genOf.get(p2) ?? 0
      const max = Math.max(g1, g2)
      if (g1 !== max) { genOf.set(p1, max); changed = true }
      if (g2 !== max) { genOf.set(p2, max); changed = true }
      // re-assert children are at least max+1
      children.forEach((c) => {
        const cg = genOf.get(c) ?? 0
        if (cg < max + 1) { genOf.set(c, max + 1); changed = true }
      })
    })
    // Also equalize matrimonios (childless)
    validMats.forEach((m) => {
      const key = [m.persona1_id, m.persona2_id].sort().join('::')
      if (coupleMap.has(key)) return
      const g1 = genOf.get(m.persona1_id) ?? 0
      const g2 = genOf.get(m.persona2_id) ?? 0
      const max = Math.max(g1, g2)
      if (g1 !== max) { genOf.set(m.persona1_id, max); changed = true }
      if (g2 !== max) { genOf.set(m.persona2_id, max); changed = true }
    })
  }

  // ── 3b. Detect in-laws: no parents in system AND ended up at gen > 0 ─────
  const isInLaw = new Set<string>()
  personas.forEach((p) => {
    const hasParentInSystem =
      (p.padre_id && pMap.has(p.padre_id)) ||
      (p.madre_id && pMap.has(p.madre_id))
    if (!hasParentInSystem && (genOf.get(p.id) ?? 0) > 0) isInLaw.add(p.id)
  })

  // ── 4. Group personas by generation and assign X positions ───────────────
  const byGen = new Map<number, string[]>()
  genOf.forEach((gen, id) => {
    if (!byGen.has(gen)) byGen.set(gen, [])
    byGen.get(gen)!.push(id)
  })

  // Sort gens
  const gens = Array.from(byGen.keys()).sort((a, b) => a - b)

  // For each generation, order personas: try to keep spouses adjacent,
  // and children under their parents' center
  const posX = new Map<string, number>()
  const posY = new Map<string, number>()

  // Build ordered list per generation using a greedy approach:
  // For gen 0 use natural order, for later gens sort by parent center X
  const getParentCenterX = (id: string): number => {
    const p = pMap.get(id)
    if (!p) return -1
    const px = p.padre_id && posX.has(p.padre_id) ? posX.get(p.padre_id)! : null
    const mx = p.madre_id && posX.has(p.madre_id) ? posX.get(p.madre_id)! : null
    if (px !== null && mx !== null) return (px + mx) / 2
    if (px !== null) return px
    if (mx !== null) return mx
    return -1  // no parents in system
  }

  // In-laws (no parents in system) must sort next to their blood-relative spouse,
  // not to the front of the generation. Use the spouse's parentCenterX as sort key.
  // Tiebreaker: blood relative always before their in-law spouse.
  const getSortKey = (id: string): number => {
    const own = getParentCenterX(id)
    if (own >= 0) return own
    const spouses = spouseOf.get(id)
    if (spouses) {
      for (const sid of Array.from(spouses)) {
        const sk = getParentCenterX(sid)
        if (sk >= 0) return sk
      }
    }
    return 0
  }

  // SUB_OFFSET is defined at module level (90px)

  gens.forEach((gen) => {
    const ids = byGen.get(gen)!
    const baseY = gen * (NODE_H + V_GAP)

    if (gen > 0) {
      ids.sort((a, b) => {
        const ka = getSortKey(a)
        const kb = getSortKey(b)
        if (ka !== kb) return ka - kb
        // Same sort key → blood relative comes before in-law
        const aBlood = getParentCenterX(a) >= 0
        const bBlood = getParentCenterX(b) >= 0
        if (aBlood && !bBlood) return -1
        if (!aBlood && bBlood) return 1
        return 0
      })
    }

    // Build ordered list: spouses placed adjacent
    const placed = new Set<string>()
    const order: string[] = []
    ids.forEach((id) => {
      if (placed.has(id)) return
      placed.add(id)
      order.push(id)
      const spouses = spouseOf.get(id)
      if (spouses) {
        spouses.forEach((spouseId) => {
          if (ids.includes(spouseId) && !placed.has(spouseId)) {
            placed.add(spouseId)
            order.push(spouseId)
          }
        })
      }
    })

    // Assign each person a "block index" = which sibling group they belong to.
    // In-laws (no childToCouple key) join the current block.
    // Each time the sibling-group key changes, increment the block counter.
    const blockOf = new Map<string, number>()
    let blockIdx = 0
    let prevGroupKey: string | null = null
    order.forEach((id) => {
      const ck = childToCouple.get(id)
      if (ck) {
        if (ck !== prevGroupKey) { blockIdx++; prevGroupKey = ck }
        blockOf.set(id, blockIdx)
      } else {
        // In-law / solo root: join current block
        blockOf.set(id, blockIdx)
      }
    })

    // Y sub-level: alternate even/odd blocks between two horizontal bands.
    // This keeps the offset bounded (max SUB_OFFSET) regardless of how many groups exist,
    // while clearly separating consecutive sibling groups onto different "floors".
    const getSubY = (id: string) => {
      const bi = blockOf.get(id) ?? 0
      return baseY + (bi % 2 === 0 ? 0 : SUB_OFFSET)
    }

    // Assign X (normal gaps) and Y (sub-level)
    let x = 0
    order.forEach((id, i) => {
      posX.set(id, x)
      posY.set(id, getSubY(id))

      const nextId = order[i + 1]
      if (!nextId) return
      const isSpousePair =
        spouseOf.get(id)?.has(nextId) && spouseOf.get(nextId)?.has(id)
      const curFamily  = childToCouple.get(id)
      const nextFamily = childToCouple.get(nextId)
      const isDifferentSiblingGroup = !isSpousePair && curFamily !== nextFamily
      // Generations 4+ get larger gaps between sibling groups to accommodate
      // the many descendant families they spawn in subsequent generations.
      const groupGap = gen >= 4 ? H_GAP * 7 : gen >= 2 ? H_GAP * 4 : H_GAP * 3
      x += NODE_W + (isSpousePair ? H_GAP / 2 : isDifferentSiblingGroup ? groupGap : H_GAP)
    })
  })

  // Center each generation horizontally so the tree looks pyramid-shaped
  gens.forEach((gen) => {
    const ids = byGen.get(gen)!
    const xs = ids.map((id) => posX.get(id)!)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs) + NODE_W
    const totalW = maxX - minX

    // Find overall tree width (max of all gens)
    const allWidths = gens.map((g) => {
      const gids = byGen.get(g)!
      const gxs = gids.map((id) => posX.get(id)!)
      return Math.max(...gxs) + NODE_W - Math.min(...gxs)
    })
    const maxW = Math.max(...allWidths)
    const offset = (maxW - totalW) / 2 - minX

    ids.forEach((id) => posX.set(id, (posX.get(id) ?? 0) + offset))
  })

  // ── 5. Build React Flow nodes ─────────────────────────────────────────────
  const dimmed = (id: string) => highlighted !== null && !highlighted.has(id)

  // Skip hidden persons
  const nodes: any[] = personas
    .filter((p) => !hiddenPersonIds.has(p.id))
    .map((p) => ({
      id: p.id,
      type: 'personaNode',
      position: { x: posX.get(p.id) ?? 0, y: posY.get(p.id) ?? 0 },
      data: { persona: p, onClick, isInLaw: isInLaw.has(p.id) },
      draggable: false,
      style: { opacity: dimmed(p.id) ? 0.15 : 1, transition: 'opacity 0.2s' },
    }))

  // Family junction nodes (center between spouses, halfway down to children)
  coupleMap.forEach((data, key) => {
    const famId = `fam-${key}`
    // Skip if either parent is hidden (cascade hide)
    if (hiddenFamNodeIds.has(famId)) return
    const x1 = (posX.get(data.p1) ?? 0) + NODE_W / 2
    const x2 = (posX.get(data.p2) ?? 0) + NODE_W / 2
    // Use the lower parent's bottom edge so the famNode sits below both spouses
    const bottomY = Math.max(
      (posY.get(data.p1) ?? 0) + NODE_H,
      (posY.get(data.p2) ?? 0) + NODE_H,
    )
    const famX = (x1 + x2) / 2 - FAM_W / 2
    const famY = bottomY + V_GAP / 2 - FAM_H / 2
    const anyHighlighted = highlighted === null ||
      data.children.some((c) => highlighted.has(c)) ||
      highlighted.has(data.p1) || highlighted.has(data.p2)
    const isCollapsed = collapsed.has(key)
    const hasChildren = data.children.length > 0
    nodes.push({
      id: famId,
      type: 'famNode',
      position: { x: famX, y: famY },
      data: { hasChildren, isCollapsed },
      draggable: false,
      selectable: false,
      style: {
        opacity: anyHighlighted ? 1 : 0.15,
        transition: 'opacity 0.2s',
        cursor: hasChildren ? 'pointer' : 'default',
      },
    })
  })

  // ── 6. Build React Flow edges ─────────────────────────────────────────────
  // Matrimonio: línea terracota punteada  →  ej. esposo ─ ─ ─ famNode
  const ST_COUPLE: React.CSSProperties  = { stroke: '#b87065', strokeWidth: 1.8, strokeDasharray: '7 4', opacity: 0.85 }
  // Descendencia: línea verde sólida con flecha  →  famNode → hijo
  const ST_CHILD: React.CSSProperties   = { stroke: '#4a6741', strokeWidth: 2, opacity: 0.75 }
  const ARROW_CHILD = { type: MarkerType.ArrowClosed, width: 10, height: 10, color: '#4a6741' }
  // Matrimonio sin hijos (tabla matrimonios)
  const ST_MARRIED: React.CSSProperties = { stroke: '#b87065', strokeWidth: 1.5, strokeDasharray: '5 3', opacity: 0.7 }

  const edges: Edge[] = []

  coupleMap.forEach((data, key) => {
    const famId = `fam-${key}`
    // Skip if the famNode itself is hidden (parents are hidden)
    if (hiddenNodeIds.has(famId)) return
    edges.push({ id: `e-p1-${key}`, source: data.p1, target: famId, type: 'straight', style: ST_COUPLE })
    edges.push({ id: `e-p2-${key}`, source: data.p2, target: famId, type: 'straight', style: ST_COUPLE })
    data.children.forEach((childId) => {
      if (hiddenNodeIds.has(childId)) return  // skip hidden or collapsed children
      edges.push({ id: `e-ch-${key}-${childId}`, source: famId, target: childId, type: 'step', style: ST_CHILD, markerEnd: ARROW_CHILD })
    })
  })

  // Marriage lines for childless couples (from matrimonios table)
  validMats.forEach((m) => {
    const key = [m.persona1_id, m.persona2_id].sort().join('::')
    if (coupleMap.has(key)) return
    if (hiddenNodeIds.has(m.persona1_id) || hiddenNodeIds.has(m.persona2_id)) return
    edges.push({ id: `em-${m.id}`, source: m.persona1_id, target: m.persona2_id, type: 'straight', style: ST_MARRIED })
  })

  // Direct parent edges for single-parent children
  personas.forEach((p) => {
    if (childToCouple.has(p.id)) return
    if (hiddenNodeIds.has(p.id)) return  // skip hidden children
    if (p.padre_id && pMap.has(p.padre_id) && !hiddenNodeIds.has(p.padre_id))
      edges.push({ id: `dp-${p.id}`, source: p.padre_id, target: p.id, type: 'step', style: ST_CHILD, markerEnd: ARROW_CHILD })
    if (p.madre_id && pMap.has(p.madre_id) && !hiddenNodeIds.has(p.madre_id))
      edges.push({ id: `dm-${p.id}`, source: p.madre_id, target: p.id, type: 'step', style: ST_CHILD, markerEnd: ARROW_CHILD })
  })

  // ── 7. Build sibling-group background nodes ────────────────────────────────
  const BG_PAD_X = 16
  const BG_PAD_Y_TOP = 28  // room for label above the first sibling row
  const BG_PAD_Y_BOT = 12

  const bgNodes: any[] = []
  coupleMap.forEach((data, key) => {
    if (data.children.length < 2) return
    // Skip bg node if all children are hidden
    const visibleChildren = data.children.filter((c) => !hiddenNodeIds.has(c))
    if (visibleChildren.length < 2) return
    const xs = visibleChildren.map((c) => posX.get(c) ?? 0)
    const ys = visibleChildren.map((c) => posY.get(c) ?? 0)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs) + NODE_W
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys) + NODE_H

    const p1 = pMap.get(data.p1)
    const p2 = pMap.get(data.p2)
    const label = p1 && p2 ? `Hijos de ${p1.nombre} y ${p2.nombre}` : ''

    bgNodes.push({
      id: `bg-${key}`,
      type: 'famBgNode',
      position: { x: minX - BG_PAD_X, y: minY - BG_PAD_Y_TOP },
      data: {
        width: maxX - minX + BG_PAD_X * 2,
        height: maxY - minY + BG_PAD_Y_TOP + BG_PAD_Y_BOT,
        label,
      },
      draggable: false,
      selectable: false,
      zIndex: -1,
      style: {},
    })
  })

  // ── 8. Build generation separator nodes ───────────────────────────────────
  // Compute full horizontal extent of the tree (after centering)
  let treeMinX = Infinity
  let treeMaxX = -Infinity
  posX.forEach((x) => {
    if (x < treeMinX) treeMinX = x
    if (x + NODE_W > treeMaxX) treeMaxX = x + NODE_W
  })

  const SEP_PAD = 800  // extra width on each side of the tree
  const GEN_NAMES = [
    '', // gen 0 doesn't get a separator above it
    'Primera generación',
    'Segunda generación',
    'Tercera generación',
    'Cuarta generación',
    'Quinta generación',
    'Sexta generación',
    'Séptima generación',
    'Octava generación',
  ]

  // Generations that have at least one visible persona
  const visibleGens = new Set<number>()
  personas.forEach((p) => {
    if (!hiddenPersonIds.has(p.id)) {
      const g = genOf.get(p.id)
      if (g !== undefined) visibleGens.add(g)
    }
  })

  const sepNodes: any[] = []
  gens.forEach((gen) => {
    if (gen === 0) return
    if (!visibleGens.has(gen)) return  // skip separators for empty generations
    // Place separator in the middle of the gap above this generation
    const sepY = gen * (NODE_H + V_GAP) - Math.round(V_GAP * 0.55)
    const label = GEN_NAMES[gen] ?? `Generación ${gen + 1}`
    const sepW = treeMaxX - treeMinX + SEP_PAD * 2
    sepNodes.push({
      id: `sep-gen-${gen}`,
      type: 'genSepNode',
      position: { x: treeMinX - SEP_PAD, y: sepY },
      data: { width: sepW, label },
      draggable: false,
      selectable: false,
      zIndex: -2,
      style: {},
    })
  })

  return { nodes: [...sepNodes, ...bgNodes, ...nodes], edges }
}

// ─── Controls ─────────────────────────────────────────────────────────────────
function TreeControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  return (
    <Panel position="bottom-right" className="flex flex-col gap-2 !m-4">
      <button onClick={() => zoomIn({ duration: 300 })} title="Acercar"
        className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline/30 shadow-card flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
        <ZoomIn className="w-5 h-5" />
      </button>
      <button onClick={() => zoomOut({ duration: 300 })} title="Alejar"
        className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline/30 shadow-card flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
        <ZoomOut className="w-5 h-5" />
      </button>
      <button onClick={() => fitView({ duration: 600, padding: 0.08 })} title="Ver árbol completo"
        className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline/30 shadow-card flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
        <Maximize2 className="w-5 h-5" />
      </button>
    </Panel>
  )
}

// ─── Search panel ─────────────────────────────────────────────────────────────
function SearchPanel({
  personas,
  onHighlight,
}: {
  personas: Persona[]
  onHighlight: (ids: Set<string> | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Persona[]>([])
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      onHighlight(null)
      return
    }
    const q = query.toLowerCase()
    const matches = personas.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.apellido.toLowerCase().includes(q) ||
        (p.apellido_casada ?? '').toLowerCase().includes(q)
    )
    setResults(matches)
    if (matches.length > 0) {
      onHighlight(new Set(matches.map((p) => p.id)))
    } else {
      onHighlight(null)
    }
  }, [query, personas, onHighlight])

  const jumpTo = (id: string) => {
    fitView({ nodes: [{ id }], duration: 500, padding: 0.5 })
  }

  const clear = () => {
    setQuery('')
    setResults([])
    onHighlight(null)
  }

  return (
    <Panel position="top-left" className="!m-4 w-64">
      <div className="bg-surface-container-lowest border border-outline/30 rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-outline/20">
          <Search className="w-4 h-4 text-outline flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar persona..."
            className="flex-1 bg-transparent text-body-sm text-on-surface placeholder:text-outline outline-none"
          />
          {query && (
            <button onClick={clear} className="text-outline hover:text-on-surface transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {results.length > 0 && (
          <div className="max-h-48 overflow-y-auto">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => jumpTo(p.id)}
                className="w-full text-left px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container-high transition-colors border-b border-outline/10 last:border-0"
              >
                <span className="font-medium">{p.nombre}</span>{' '}
                <span className="text-on-surface-variant">{p.apellido}</span>
                {p.fecha_nacimiento && (
                  <span className="text-outline ml-1">· {p.fecha_nacimiento.split('-')[0]}</span>
                )}
              </button>
            ))}
          </div>
        )}
        {query && results.length === 0 && (
          <p className="px-3 py-2 text-body-sm text-outline">Sin resultados</p>
        )}
      </div>
    </Panel>
  )
}

// ─── Node types ────────────────────────────────────────────────────────────────
const nodeTypes = { personaNode: PersonaNode, famNode: FamNode, famBgNode: FamBgNode, genSepNode: GenSepNode }

// ─── Main component ────────────────────────────────────────────────────────────
export function FamilyTree({
  personas,
  matrimonios,
}: {
  personas: Persona[]
  matrimonios: Matrimonio[]
}) {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [highlighted, setHighlighted] = useState<Set<string> | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => computeInitialCollapsed(personas, matrimonios)
  )

  const handleSelect = useCallback(
    (p: Persona) => {
      if (selectedPersona?.id === p.id) {
        setSelectedPersona(null)
        setHighlighted(null)
      } else {
        setSelectedPersona(p)
        setHighlighted(getRelatedIds(p.id, personas))
      }
    },
    [selectedPersona, personas]
  )

  const handleClose = useCallback(() => {
    setSelectedPersona(null)
    setHighlighted(null)
  }, [])

  const handleHighlight = useCallback((ids: Set<string> | null) => {
    setHighlighted(ids)
    if (!ids) setSelectedPersona(null)
  }, [])

  const handleToggle = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const { nodes, edges } = useMemo(
    () => buildLayout(personas, matrimonios, handleSelect, highlighted, collapsed),
    [personas, matrimonios, handleSelect, highlighted, collapsed]
  )

  if (personas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="font-serif text-headline-sm text-on-surface mb-2">Árbol vacío</h3>
        <p className="text-body-md text-on-surface-variant max-w-md">
          Aún no hay personas en el árbol genealógico.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        minZoom={0.04}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: '#f5f0e4' }}
        onPaneClick={() => {
          setSelectedPersona(null)
          setHighlighted(null)
        }}
        onNodeClick={(_e, node) => {
          if (node.type === 'famNode' && (node.data as { hasChildren?: boolean }).hasChildren) {
            // key is the famNode id without the 'fam-' prefix
            handleToggle(node.id.slice(4))
          }
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#c8bc9d" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'famNode') return '#c8bc9d'
            const d = node.data as { persona: Persona; isInLaw?: boolean }
            if (d.isInLaw) return '#76786b'
            return d.persona?.genero === 'femenino' ? '#785832' : '#33450d'
          }}
          maskColor="rgba(245,240,228,0.88)"
          style={{ background: '#fcf9f0', border: '1px solid #c8bc9d', borderRadius: '12px' }}
        />
        <SearchPanel personas={personas} onHighlight={handleHighlight} />
        <TreeControls />
        {highlighted && (
          <Panel position="top-right" className="!m-4">
            <button
              onClick={() => { setHighlighted(null); setSelectedPersona(null) }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline/30 shadow-card text-body-sm text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar selección
            </button>
          </Panel>
        )}
      </ReactFlow>

      {selectedPersona && (
        <PersonaModal
          persona={selectedPersona}
          personas={personas}
          matrimonios={matrimonios}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
