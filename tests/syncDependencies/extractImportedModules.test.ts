import { existsSync, readFileSync } from 'node:fs';
import { extractImportedModules } from '../../src/syncDependencies/extractImportedModules.js';
import * as myFileWalk from '../../src/utils/fileWalk.js';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

describe('extractImportedModules', () => {
  let fileWalkSpy: any;

  beforeAll(() => {
    fileWalkSpy = vi.spyOn(myFileWalk, 'fileWalk');
  });

  it('should extract imports from a package with src directory', async () => {
    const packageCwd = 'test/package';
    const mockFiles = [
      'test/package/src/file1.ts',
      'test/package/src/file2.js',
    ];

    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockImplementation((path) => {
      if (path === mockFiles[0]) {
        return 'import { foo } from "foo-pkg";';
      }
      return 'import { bar } from "bar-pkg";';
    });
    fileWalkSpy.mockResolvedValue(mockFiles);

    const result = await extractImportedModules(packageCwd);
    expect(result).toEqual(new Set(['foo-pkg', 'bar-pkg']));
  });

  it('should extract imports from a package without src directory', async () => {
    const packageCwd = 'test/package';
    const mockFiles = ['test/package/file1.ts'];

    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readFileSync).mockReturnValue('import { baz } from "baz-pkg";');
    fileWalkSpy.mockResolvedValue(mockFiles);

    const result = await extractImportedModules(packageCwd);
    expect(result).toEqual(new Set(['baz-pkg']));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
});
