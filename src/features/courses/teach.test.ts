import { describe, expect, it } from 'vitest'
import { groupMaterials, type Material } from './api'
import { abilities, normCode, validateCourseDraft, type CourseDraft } from './teach'

describe('kadro görevine göre yetkiler (F-43)', () => {
  it('koordinatör her şeyi yapar', () => {
    expect(Object.values(abilities('COORDINATOR')).every(Boolean)).toBe(true)
  })

  it('hoca düzenleme, yayın ve kadro dışında her şeyi yapar', () => {
    const can = abilities('INSTRUCTOR')
    expect([can.edit, can.lifecycle, can.staff]).toEqual([false, false, false])
    expect([can.applications, can.announce, can.materials, can.removeStudent]).toEqual([true, true, true, true])
  })

  it('asistan başvuru, duyuru, materyal ve öğrenci çıkarmayı görmez', () => {
    expect(Object.values(abilities('ASSISTANT')).some(Boolean)).toBe(false)
  })
})

const draft = (d: Partial<CourseDraft>): CourseDraft => ({
  code: 'BİL 342',
  title: 'Yapay Zekâ',
  description: '',
  credit: '3',
  ects: '6',
  capacity: '40',
  termId: 't1',
  section: '',
  ...d,
})

describe('ders açma formu', () => {
  it('geçerli taslakta hata yok', () => {
    expect(validateCourseDraft(draft({}), false)).toEqual({})
  })

  it('kontenjan, kredi, AKTS ve şube sınırlarını yakalar', () => {
    const e = validateCourseDraft(draft({ capacity: '0', credit: '0', ects: '61', section: '2-A' }), false)
    expect(Object.keys(e).sort()).toEqual(['capacity', 'credit', 'ects', 'section'])
  })

  it('katalogdan seçilen derste ad ve kredi denetlenmez', () => {
    expect(validateCourseDraft(draft({ title: '', credit: '' }), true)).toEqual({})
  })

  it('kodları Türkçe büyük harfle karşılaştırır', () => {
    expect(normCode('  bil   301 ')).toBe('BİL 301')
  })
})

const material = (id: string, section: string | null, sortOrder = 1): Material => ({
  id,
  courseId: 'c1',
  title: id,
  description: null,
  section,
  sortOrder,
  kind: 'FILE',
  fileName: null,
  linkUrl: null,
  visible: true,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
})

describe('materyal bölümleri', () => {
  it('bölümsüzler başta, bölümler doğal sırada', () => {
    const groups = groupMaterials([material('a', 'Hafta 10'), material('b', 'Hafta 2'), material('c', null), material('d', 'Hafta 3')])
    expect(groups.map(([s]) => s)).toEqual(['Genel', 'Hafta 2', 'Hafta 3', 'Hafta 10'])
  })

  it('bölüm içinde sıra numarasına göre', () => {
    const groups = groupMaterials([material('ikinci', 'Hafta 1', 2), material('birinci', 'Hafta 1', 1)])
    expect(groups[0]?.[1].map((m) => m.id)).toEqual(['birinci', 'ikinci'])
  })
})
