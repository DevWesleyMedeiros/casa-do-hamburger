import { spawn } from 'node:child_process';
import { accessSync, constants, readFileSync } from 'node:fs';
import { constants as osConstants } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packages = ['back-end', 'front-end'];
const scripts = ['lint', 'format:check'];
const sharedFiles = ['AGENTS.md', 'scripts/quality-gate.mjs', 'docs/development/automation.md'];
const help = `Uso: node scripts/quality-gate.mjs [--scope front-end|back-end|all]
     node scripts/quality-gate.mjs --help

Sem argumentos: ambos os pacotes. Executa lint e format:check, sem correções.
Todos os escopos também verificam a formatação dos três arquivos compartilhados
e a sintaxe de .githooks/pre-commit. Consulte docs/development/automation.md.`;

class Impediment extends Error {}

function readable(path) {
  try {
    accessSync(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function executable(name, extraPaths = []) {
  const filename = process.platform === 'win32' ? `${name}.exe` : name;
  const candidates = (process.env.PATH ?? '')
    .split(delimiter)
    .filter(Boolean)
    .map((directory) => join(directory.replace(/^"|"$/g, ''), filename));
  for (const candidate of [...candidates, ...extraPaths]) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Procura somente instalações existentes; nunca instala ou faz download.
    }
  }
  throw new Impediment(`executável ${filename} ausente; disponibilize-o no PATH`);
}

function prepare(selected) {
  for (const name of selected) {
    const directory = join(root, name);
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
    } catch {
      throw new Impediment(`${name}: package.json ausente, inacessível ou inválido`);
    }
    for (const script of scripts) {
      if (typeof manifest.scripts?.[script] !== 'string' || !manifest.scripts[script].trim()) {
        throw new Impediment(`${name}: script ${script} ausente em package.json`);
      }
    }
    for (const bin of ['eslint/bin/eslint.js', 'prettier/bin/prettier.cjs']) {
      if (!readable(join(directory, 'node_modules', bin))) {
        throw new Impediment(`${name}: dependência local ${bin} ausente ou inacessível`);
      }
    }
  }

  const prettier = 'back-end/node_modules/prettier/bin/prettier.cjs';
  const config = 'back-end/.prettierrc';
  const ignore = 'front-end/.prettierignore';
  const hook = '.githooks/pre-commit';
  for (const file of [prettier, config, ignore, hook, ...sharedFiles]) {
    if (!readable(join(root, file))) {
      throw new Impediment(`arquivo ou dependência local ausente ou inacessível: ${file}`);
    }
  }

  const bun = executable('bun');
  // Git Bash pode estar instalado sem sh.exe no PATH do PowerShell.
  const shellPaths =
    process.platform === 'win32'
      ? [
          process.env.ProgramFiles && join(process.env.ProgramFiles, 'Git/bin/sh.exe'),
          process.env['ProgramFiles(x86)'] &&
            join(process.env['ProgramFiles(x86)'], 'Git/bin/sh.exe'),
          process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Programs/Git/bin/sh.exe'),
        ].filter(Boolean)
      : [];
  const sh = executable('sh', shellPaths);

  return [
    ...selected.flatMap((name) =>
      scripts.map((script) => ({
        label: `${name}: bun --no-env-file --no-install run ${script}`,
        command: bun,
        args: ['--no-env-file', '--no-install', 'run', script],
        cwd: join(root, name),
      })),
    ),
    {
      label: `compartilhado: Prettier --check ${sharedFiles.join(' ')}`,
      command: process.execPath,
      args: [
        join(root, prettier),
        '--check',
        '--config',
        config,
        '--ignore-path',
        ignore,
        ...sharedFiles,
      ],
      cwd: root,
    },
    {
      label: `compartilhado: sh -n ${hook}`,
      command: sh,
      args: ['-n', hook],
      cwd: root,
    },
  ];
}

function signalCode(signal) {
  return 128 + (osConstants.signals[signal] ?? 1);
}

async function run(checks) {
  let child;
  let interruption;
  const forward = (signal) => {
    interruption ??= signal;
    if (!child?.pid) return;
    try {
      if (process.platform === 'win32') child.kill(signal);
      else process.kill(-child.pid, signal);
    } catch {
      // O processo pode ter terminado antes da entrega do sinal.
    }
  };
  const onInterrupt = () => forward('SIGINT');
  const onTerminate = () => forward('SIGTERM');
  process.on('SIGINT', onInterrupt);
  process.on('SIGTERM', onTerminate);

  let exitCode = 0;
  try {
    for (const check of checks) {
      if (interruption) break;
      console.log(`\n[EXECUTANDO] ${check.label}`);
      const result = await new Promise((resolveResult) => {
        child = spawn(check.command, check.args, {
          cwd: check.cwd,
          stdio: 'inherit',
          shell: false,
          detached: process.platform !== 'win32',
        });
        child.once('error', (error) => {
          console.error(`[IMPEDIMENTO] ${check.label}: processo indisponível (${error.code})`);
          resolveResult(1);
        });
        child.once('close', (code, signal) => {
          if (signal) interruption ??= signal;
          resolveResult(signal ? signalCode(signal) : (code ?? 1));
        });
      });
      child = undefined;
      console.log(`[${result === 0 ? 'APROVADO' : 'FALHA'}] ${check.label} (código ${result})`);
      if (result !== 0 && exitCode === 0) exitCode = result;
    }
    if (interruption) {
      console.error(`[INTERROMPIDO] ${interruption}`);
      return signalCode(interruption);
    }
    console.log(`\n[${exitCode === 0 ? 'APROVADO' : 'REPROVADO'}] Verificador de qualidade.`);
    return exitCode;
  } finally {
    process.off('SIGINT', onInterrupt);
    process.off('SIGTERM', onTerminate);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log(help);
    return 0;
  }
  let scope = 'all';
  if (args.length !== 0) {
    if (args.length !== 2 || args[0] !== '--scope' || ![...packages, 'all'].includes(args[1])) {
      console.error(`Argumentos inválidos.\n${help}`);
      return 2;
    }
    scope = args[1];
  }
  try {
    return await run(prepare(scope === 'all' ? packages : [scope]));
  } catch (error) {
    // Não imprime conteúdo de manifests, configurações ou ambiente em exceções.
    console.error(
      `[IMPEDIMENTO] ${
        error instanceof Impediment
          ? error.message
          : 'Não foi possível preparar ou executar o verificador.'
      }`,
    );
    return 1;
  }
}

process.exitCode = await main();
