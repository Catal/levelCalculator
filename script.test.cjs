// ABOUTME: Verifies level arrival dates with the calculator's browser interface.
// ABOUTME: Covers Sounds Great pacing and lesson format changes starting at BP1.
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { test } = require('node:test')
const vm = require('node:vm')

function calculate({ units = 1, half = false, start = 'Pre1', frequency = 1 } = {}) {
  const levels = ['Pre1', 'Pre2', 'Pre3', 'Pre4', ...Array.from({ length: 12 }, (_, i) => `BP${i + 1}`)]
  const rows = Array.from({ length: 17 }, () => ({
    cells: Array.from({ length: 4 }, () => ({ textContent: '' }))
  }))
  const elements = {
    studentName: { value: '確認用' },
    startDate: { value: '2026-10-20' },
    startGrade: { value: '小3' },
    startLevel: { value: start },
    soundsGreatUnits: { value: String(units) },
    lessonFrequency: { value: String(frequency) },
    levelTable: { rows },
    levelUpMessage: {},
    downloadPDF: { addEventListener() {} }
  }
  const context = vm.createContext({
    document: {
      getElementById: id => elements[id],
      querySelector: () => ({ value: half ? 'yes' : 'no' }),
      addEventListener() {}
    },
    console: { log() {} }
  })
  vm.runInContext(readFileSync(`${__dirname}/script.js`, 'utf8'), context)
  vm.runInContext('calculateLevels()', context)
  return Object.fromEntries(levels.map((level, i) => [level, {
    date: rows[16 - i].cells[2].textContent,
    period: rows[16 - i].cells[3].textContent
  }]))
}

test('one unit and full lessons preserve the existing schedule', () => {
  const result = calculate()
  assert.equal(result.Pre2.period, '9週後')
  assert.equal(result.Pre3.period, '9週後')
  assert.equal(result.Pre4.period, '18週後')
  assert.equal(result.BP1.date, '2027/8/31')
  assert.equal(result.BP2.period, '21週後')
})

test('two units round up each Pre interval and leave BP lessons unchanged', () => {
  const result = calculate({ units: 2 })
  assert.deepEqual(['Pre2', 'Pre3', 'Pre4', 'BP1'].map(level => result[level].period),
    ['5週後', '5週後', '9週後', '5週後'])
  assert.equal(result.BP1.date, '2027/4/6')
  assert.equal(result.BP2.period, '21週後')
})

test('half lessons affect BP1 to BP2 onward, including when starting at BP1', () => {
  for (const units of [1, 2]) {
    const full = calculate({ units })
    const half = calculate({ units, half: true })
    for (const level of ['Pre1', 'Pre2', 'Pre3', 'Pre4', 'BP1']) {
      assert.deepEqual(half[level], full[level])
    }
    assert.equal(half.BP2.period, '42週後')
  }
  assert.equal(calculate({ start: 'BP1', half: true }).BP2.period, '42週後')
})

test('two-unit lesson counts round before converting to weeks', () => {
  const result = calculate({ units: 2, frequency: 2 })
  assert.deepEqual(['Pre2', 'Pre3', 'Pre4', 'BP1'].map(level => result[level].period),
    ['3週後', '3週後', '5週後', '3週後'])
})
