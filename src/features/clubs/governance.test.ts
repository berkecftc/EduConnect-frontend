import { describe, expect, it } from 'vitest'
import {
  canonicalRole,
  holderCount,
  logoProblem,
  profileChanges,
  validateProfileDraft,
  validateCreationDraft,
  type ProfileDraft,
} from './governance'

const draft = (d: Partial<ProfileDraft> = {}): ProfileDraft => ({
  about: 'Her çarşamba serbest oyun.',
  category: 'HOBBY',
  contactEmail: 'satranc@ogr.example.edu',
  websiteUrl: '',
  instagramUrl: 'https://instagram.com/satranc',
  xUrl: '',
  linkedinUrl: '',
  ...d,
})

describe('canonicalRole', () => {
  it('eski uyumluluk adlarını yeni koda çevirir', () => {
    expect(canonicalRole('ROLE_CLUB_OFFICIAL')).toBe('PRESIDENT')
    expect(canonicalRole('ROLE_SECRETARY')).toBe('GENERAL_SECRETARY')
    expect(canonicalRole('ROLE_TREASURER')).toBe('TREASURER')
    expect(canonicalRole('BOARD_MEMBER')).toBe('BOARD_MEMBER')
    expect(canonicalRole(null)).toBe('MEMBER')
  })
})

describe('holderCount', () => {
  it('eski ve yeni adları aynı görev sayar', () => {
    const board = [
      { studentId: 'a', firstName: null, lastName: null, role: 'ROLE_BOARD_MEMBER' },
      { studentId: 'b', firstName: null, lastName: null, role: 'BOARD_MEMBER' },
      { studentId: 'c', firstName: null, lastName: null, role: 'ROLE_CLUB_OFFICIAL' },
    ]
    expect(holderCount(board, 'BOARD_MEMBER')).toBe(2)
    expect(holderCount(board, 'PRESIDENT')).toBe(1)
  })
})

describe('profileChanges', () => {
  it('değişmeyen alanları göndermez', () => {
    expect(profileChanges(draft(), draft())).toBeNull()
    expect(profileChanges(draft(), draft({ about: '  Her çarşamba serbest oyun.  ' }))).toBeNull()
  })

  it('değişen alanı kırpılmış, boşaltılan alanı boş metin olarak gönderir', () => {
    expect(profileChanges(draft(), draft({ websiteUrl: ' https://satranc.example ', instagramUrl: '' }))).toEqual({
      websiteUrl: 'https://satranc.example',
      instagramUrl: '',
    })
  })
})

describe('validateProfileDraft', () => {
  it('https olmayan bağlantıyı ve geçersiz e-postayı yakalar', () => {
    const e = validateProfileDraft(draft({ websiteUrl: 'http://satranc.example', xUrl: 'https://x.com/a b', contactEmail: 'satranc@' }))
    expect(Object.keys(e).sort()).toEqual(['contactEmail', 'websiteUrl', 'xUrl'])
  })

  it('boş alanlara izin verir', () => {
    expect(validateProfileDraft(draft({ contactEmail: '', instagramUrl: '' }))).toEqual({})
  })
})

describe('validateCreationDraft', () => {
  it('ad ve danışman zorunlu', () => {
    expect(validateCreationDraft({ name: '  ', about: '', advisorId: undefined })).toEqual({
      name: 'Kulübün adını yazın.',
      advisorId: 'Danışman olacak akademisyeni listeden seçin.',
    })
    expect(validateCreationDraft({ name: 'Münazara Kulübü', about: '', advisorId: 'u-c7' })).toEqual({})
  })
})

describe('logoProblem', () => {
  it('türü ve boyutu denetler', () => {
    expect(logoProblem(new File(['x'], 'logo.png', { type: 'image/png' }))).toBeNull()
    expect(logoProblem(new File(['x'], 'logo.svg', { type: 'image/svg+xml' }))).toMatch(/JPEG/)
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'logo.jpg', { type: 'image/jpeg' })
    expect(logoProblem(big)).toMatch(/5 MB/)
  })
})
