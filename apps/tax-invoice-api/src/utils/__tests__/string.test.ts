import { escapeRegExp } from '../string'

describe('escapeRegExp', () => {
  it('should leave plain alphanumeric text unchanged', () => {
    expect(escapeRegExp('INV-001')).toEqual('INV-001')
  })

  it('should escape regex metacharacters so input matches literally', () => {
    expect(escapeRegExp('INV.001')).toEqual('INV\\.001')
    expect(escapeRegExp('INV-00(')).toEqual('INV-00\\(')
    expect(escapeRegExp('[abc]')).toEqual('\\[abc\\]')
    expect(escapeRegExp('a*b+c?d')).toEqual('a\\*b\\+c\\?d')
    expect(escapeRegExp('^start$end')).toEqual('\\^start\\$end')
    expect(escapeRegExp('{1,2}|x\\y')).toEqual('\\{1,2\\}\\|x\\\\y')
  })

  it('should produce a pattern that matches literally case-insensitively', () => {
    const pattern = new RegExp(escapeRegExp('INV.001'), 'i')

    expect(pattern.test('inv.001')).toBe(true)
    expect(pattern.test('INV-001')).toBe(false)
    expect(pattern.test('INVX001')).toBe(false)
  })
})
