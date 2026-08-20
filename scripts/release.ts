import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type ReleaseArtifact = {
  name: string;
  file: string;
  sha256: string;
};

const repositoryRoot = join(import.meta.dir, '..');
const releaseRoot = join(repositoryRoot, 'release');
const stagingRoot = join(releaseRoot, '.staging');
const backendRoot = join(repositoryRoot, 'apps/backend');
const frontendRoot = join(repositoryRoot, 'apps/frontend');

const packageJson = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8')) as {
  version?: unknown;
};

if (typeof packageJson.version !== 'string' || packageJson.version.length === 0) {
  throw new Error('Root package.json must contain a non-empty version before release');
}

function run(command: string[]) {
  const result = Bun.spawnSync(command, {
    cwd: repositoryRoot,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  if (result.exitCode !== 0) {
    throw new Error(`Release command failed (${result.exitCode}): ${command.join(' ')}`);
  }
}

function createArchive(name: string, sourceDirectory: string): ReleaseArtifact {
  const file = `sync-canvas-${name}-v${packageJson.version}.tar.gz`;
  const archivePath = join(releaseRoot, file);

  run(['tar', '-czf', archivePath, '-C', sourceDirectory, '.']);

  return {
    name,
    file,
    sha256: createHash('sha256').update(readFileSync(archivePath)).digest('hex'),
  };
}

run(['bun', 'run', 'check']);

rmSync(releaseRoot, { force: true, recursive: true });
mkdirSync(stagingRoot, { recursive: true });

const backendStage = join(stagingRoot, 'backend');
const frontendStage = join(stagingRoot, 'frontend');
mkdirSync(backendStage, { recursive: true });
mkdirSync(frontendStage, { recursive: true });

cpSync(join(backendRoot, 'dist'), join(backendStage, 'dist'), { recursive: true });
cpSync(join(backendRoot, 'drizzle'), join(backendStage, 'drizzle'), { recursive: true });
cpSync(join(backendRoot, '.env.example'), join(backendStage, '.env.example'));
cpSync(join(backendRoot, 'RELEASE.md'), join(backendStage, 'README.md'));
cpSync(join(frontendRoot, 'dist'), frontendStage, { recursive: true });

const artifacts = [createArchive('backend', backendStage), createArchive('frontend', frontendStage)];

writeFileSync(
  join(releaseRoot, 'manifest.json'),
  `${JSON.stringify(
    {
      version: packageJson.version,
      createdAt: new Date().toISOString(),
      artifacts,
    },
    null,
    2,
  )}\n`,
);

rmSync(stagingRoot, { force: true, recursive: true });

for (const artifact of artifacts) {
  console.info(`${artifact.file}  ${artifact.sha256}`);
}
