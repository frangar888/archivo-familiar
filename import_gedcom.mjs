/**
 * Importación GEDCOM → Supabase
 *
 * Uso:
 *   node import_gedcom.mjs            ← dry run (no modifica nada)
 *   node import_gedcom.mjs --import   ← importa datos reales
 *
 * Qué hace:
 *   1. Parsea el archivo .ged
 *   2. Limpia las tablas personas y matrimonios
 *   3. Inserta todas las personas (sin links de padres)
 *   4. Actualiza cada persona con padre_id / madre_id
 *   5. Inserta los matrimonios
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ─── Credenciales ─────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://qyvscvutoarelxjeeysw.supabase.co'
const SERVICE_KEY   = 'REDACTED'
const GED_FILE      = '../arbol_garcia_desimon.ged'

const DRY_RUN = !process.argv.includes('--import')

// ─── Supabase client ───────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS = {
  JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
  JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12',
}

function parseGedDate(s) {
  if (!s) return null
  const p = s.trim().split(/\s+/)
  if (p.length === 3) {
    const m = MONTHS[p[1].toUpperCase()]
    if (m) return `${p[2]}-${m}-${p[0].padStart(2,'0')}`
  }
  if (p.length === 2) {
    const m = MONTHS[p[0].toUpperCase()]
    if (m) return `${p[1]}-${m}-01`
  }
  if (p.length === 1 && /^\d{4}$/.test(p[0])) return `${p[0]}-01-01`
  return null
}

function parseName(raw) {
  const m = raw.match(/^(.*?)\s*\/([^/]*)\/\s*$/)
  if (m) return { nombre: m[1].trim() || 'Sin nombre', apellido: m[2].trim() }
  return { nombre: raw.trim() || 'Sin nombre', apellido: '' }
}

function stripAt(s) { return s.replace(/@/g, '').trim() }

// ─── Parse GEDCOM ─────────────────────────────────────────────────────────────
const lines = readFileSync(GED_FILE, 'utf-8').split(/\r?\n/).map(l => l.trim()).filter(Boolean)

/** @type {Map<string, {nombre:string,apellido:string,genero:string|null,fecha_nacimiento:string|null,fecha_fallecimiento:string|null,deceased:boolean,famc:string|null}>} */
const individuals = new Map()

/** @type {Map<string, {husb:string|null,wife:string|null,children:string[]}>} */
const families = new Map()

let curType = null   // 'INDI' | 'FAM'
let curId   = null
let lastL1  = null

for (const line of lines) {
  const m = line.match(/^(\d+)\s+(@[^@]+@\s+)?(\S+)\s*(.*)$/)
  if (!m) continue
  const level = +m[1], ref = m[2]?.trim(), tag = m[3], value = m[4]?.trim() ?? ''

  if (level === 0) {
    lastL1 = null
    if (ref && tag === 'INDI') {
      curType = 'INDI'
      curId   = stripAt(ref)
      individuals.set(curId, { nombre: '', apellido: '', genero: null,
        fecha_nacimiento: null, fecha_fallecimiento: null, deceased: false, famc: null })
    } else if (ref && tag === 'FAM') {
      curType = 'FAM'
      curId   = stripAt(ref)
      families.set(curId, { husb: null, wife: null, children: [] })
    } else {
      curType = null; curId = null
    }
    continue
  }

  if (!curId) continue

  if (level === 1) {
    lastL1 = tag
    if (curType === 'INDI') {
      const p = individuals.get(curId)
      if (tag === 'NAME') { const n = parseName(value); p.nombre = n.nombre; p.apellido = n.apellido }
      else if (tag === 'SEX')  p.genero = value === 'M' ? 'masculino' : value === 'F' ? 'femenino' : 'otro'
      else if (tag === 'DEAT') p.deceased = true
      else if (tag === 'FAMC') p.famc = stripAt(value)
    } else if (curType === 'FAM') {
      const f = families.get(curId)
      if (tag === 'HUSB')      f.husb = stripAt(value)
      else if (tag === 'WIFE') f.wife = stripAt(value)
      else if (tag === 'CHIL') f.children.push(stripAt(value))
    }
  } else if (level === 2 && curType === 'INDI') {
    const p = individuals.get(curId)
    if (lastL1 === 'BIRT' && tag === 'DATE') p.fecha_nacimiento    = parseGedDate(value)
    if (lastL1 === 'DEAT' && tag === 'DATE') { p.fecha_fallecimiento = parseGedDate(value); p.deceased = true }
  }
}

console.log(`✓ Parseado: ${individuals.size} personas, ${families.size} familias`)

// ─── Preview ───────────────────────────────────────────────────────────────────
if (DRY_RUN) {
  console.log('\n──── DRY RUN (sin cambios en la DB) ────')
  console.log('\nPersonas a insertar:')
  for (const [id, p] of individuals) {
    console.log(`  ${id}: ${p.nombre} ${p.apellido} (${p.genero ?? 'sin género'}) ${p.deceased ? '†' : ''}`)
  }
  console.log('\nFamilias (padre → madre → hijos):')
  for (const [id, f] of families) {
    const husb = f.husb ? individuals.get(f.husb) : null
    const wife = f.wife ? individuals.get(f.wife) : null
    const kids = f.children.map(c => { const p = individuals.get(c); return p ? `${p.nombre} ${p.apellido}` : c })
    console.log(`  ${id}: ${husb ? `${husb.nombre} ${husb.apellido}` : '?'} + ${wife ? `${wife.nombre} ${wife.apellido}` : '?'} → [${kids.join(', ')}]`)
  }
  console.log('\nEjecutá con --import para aplicar los cambios.')
  process.exit(0)
}

// ─── Import ────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n── Limpiando tablas existentes...')

  // Limpiar matrimonios primero (FK hacia personas)
  const { error: e1 } = await supabase.from('matrimonios').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e1) { console.error('Error limpiando matrimonios:', e1.message); process.exit(1) }

  // Limpiar personas
  const { error: e2 } = await supabase.from('personas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e2) { console.error('Error limpiando personas:', e2.message); process.exit(1) }

  console.log('  ✓ Tablas limpias')

  // ── Insertar personas (sin links de padres) ──────────────────────────────────
  console.log('\n── Insertando personas...')
  const gedToUuid = new Map()   // gedcomId → supabase UUID

  for (const [gedId, p] of individuals) {
    const payload = {
      nombre:              p.nombre || 'Sin nombre',
      apellido:            p.apellido || '',
      genero:              p.genero,
      fecha_nacimiento:    p.fecha_nacimiento,
      // fecha_fallecimiento: solo si tenemos la fecha exacta (DEAT Y sin fecha → null)
      fecha_fallecimiento: p.deceased && p.fecha_fallecimiento ? p.fecha_fallecimiento : null,
      padre_id:            null,
      madre_id:            null,
    }

    const { data, error } = await supabase.from('personas').insert(payload).select('id').single()
    if (error) {
      console.error(`  ✗ ${gedId} (${p.nombre} ${p.apellido}): ${error.message}`)
    } else {
      gedToUuid.set(gedId, data.id)
      process.stdout.write('.')
    }
  }
  console.log(`\n  ✓ ${gedToUuid.size}/${individuals.size} personas insertadas`)

  // ── Actualizar padre_id / madre_id en base a las familias ───────────────────
  console.log('\n── Vinculando parentescos...')
  let linked = 0

  for (const [, fam] of families) {
    const husbUuid = fam.husb ? gedToUuid.get(fam.husb) : null
    const wifeUuid = fam.wife ? gedToUuid.get(fam.wife) : null

    for (const childGed of fam.children) {
      const childUuid = gedToUuid.get(childGed)
      if (!childUuid) continue

      const update = {}
      if (husbUuid) update.padre_id = husbUuid
      if (wifeUuid) update.madre_id = wifeUuid

      if (Object.keys(update).length === 0) continue

      const { error } = await supabase.from('personas').update(update).eq('id', childUuid)
      if (error) {
        console.error(`  ✗ Parentesco ${childGed}: ${error.message}`)
      } else {
        linked++
        process.stdout.write('.')
      }
    }
  }
  console.log(`\n  ✓ ${linked} parentescos vinculados`)

  // ── Insertar matrimonios ─────────────────────────────────────────────────────
  console.log('\n── Insertando matrimonios...')
  let mats = 0

  for (const [, fam] of families) {
    if (!fam.husb || !fam.wife) continue
    const p1 = gedToUuid.get(fam.husb)
    const p2 = gedToUuid.get(fam.wife)
    if (!p1 || !p2) continue

    const { error } = await supabase.from('matrimonios').insert({ persona1_id: p1, persona2_id: p2 })
    if (error) {
      console.error(`  ✗ Matrimonio ${fam.husb}+${fam.wife}: ${error.message}`)
    } else {
      mats++
      process.stdout.write('.')
    }
  }
  console.log(`\n  ✓ ${mats} matrimonios insertados`)

  console.log('\n🎉 Importación completa.')
}

run().catch(err => { console.error(err); process.exit(1) })
