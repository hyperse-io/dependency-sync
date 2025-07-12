import { checkConflicts } from '../../src/checkConflicts/checkConflicts.js';

vi.mock('../../src/utils/fileWalk.js', () => ({
  fileWalk: vi.fn(),
}));

vi.mock('../../src/utils/readJson.js', () => ({
  readJson: vi.fn(),
}));

describe('checkConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find conflicting package versions', async () => {
    const fileWalk = vi.mocked(
      await import('../../src/utils/fileWalk.js')
    ).fileWalk;
    const readJson = vi.mocked(
      await import('../../src/utils/readJson.js')
    ).readJson;

    fileWalk.mockResolvedValue([
      'pkg1/package.json',
      'pkg1-other/package.json',
      'pkg2/package.json',
    ]);

    readJson
      .mockReturnValueOnce({ name: 'pkg1', version: '1.0.0' })
      .mockReturnValueOnce({ name: 'pkg1', version: '2.0.0' })
      .mockReturnValueOnce({ name: 'pkg2', version: '1.0.0' });

    const conflicts = await checkConflicts('/node_modules', ['pkg1', 'pkg2']);

    expect(conflicts.size).toBe(1);
    expect(conflicts.get('pkg1')).toEqual(['1.0.0', '2.0.0']);
  });

  it('should ignore specified packages', async () => {
    const fileWalk = vi.mocked(
      await import('../../src/utils/fileWalk.js')
    ).fileWalk;
    const readJson = vi.mocked(
      await import('../../src/utils/readJson.js')
    ).readJson;

    fileWalk.mockResolvedValue([
      'pkg1/package.json',
      'pkg1-other/package.json',
    ]);

    readJson
      .mockReturnValueOnce({ name: 'pkg1', version: '1.0.0' })
      .mockReturnValueOnce({ name: 'pkg1', version: '2.0.0' });

    const conflicts = await checkConflicts('/node_modules', ['pkg1'], ['pkg1']);

    expect(conflicts.size).toBe(0);
  });

  it('should handle empty package list', async () => {
    const fileWalk = vi.mocked(
      await import('../../src/utils/fileWalk.js')
    ).fileWalk;

    fileWalk.mockResolvedValue([]);

    const conflicts = await checkConflicts('/node_modules', []);

    expect(conflicts.size).toBe(0);
  });
});
