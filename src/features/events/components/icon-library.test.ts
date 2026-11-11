// T9 guard: the frontend must use a single icon library (`@lucide/astro` for
// `.astro` files) plus the local inline SVG set for islands. This scans the
// source tree so a future import of the removed packages fails the suite.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const FORBIDDEN_PACKAGES = ['@tabler/icons-react', 'lucide', 'lucide-react'];
const EXTENSIONS = ['.astro', '.ts', '.tsx', '.mjs'];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (EXTENSIONS.some((extension) => entry.endsWith(extension))) {
      files.push(full);
    }
  }
  return files;
}

const sourceFiles = walk(SRC).filter((file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'));

/** Module specifiers imported by a source file. */
const importsOf = (file: string): string[] => {
  const specifiers: string[] = [];
  const matcher = /from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;
  const source = readFileSync(file, 'utf8');
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(source))) {
    specifiers.push(match[1] ?? match[2]);
  }
  return specifiers;
};

const importsPackage = (specifiers: string[], packageName: string): boolean =>
  specifiers.some((specifier) => specifier === packageName || specifier.startsWith(`${packageName}/`));

describe('icon library consolidation', () => {
  for (const packageName of FORBIDDEN_PACKAGES) {
    it(`source files do not import ${packageName}`, () => {
      const offenders = sourceFiles.filter((file) => importsPackage(importsOf(file), packageName));

      expect(offenders.map((file) => file.replace(SRC, 'src/'))).toEqual([]);
    });
  }

  it('keeps @lucide/astro as the one library for .astro components', () => {
    const astroFiles = sourceFiles.filter((file) => file.endsWith('.astro'));
    const importers = astroFiles.filter((file) => importsOf(file).includes('@lucide/astro'));

    expect(importers.length).toBeGreaterThan(0);
  });
});
