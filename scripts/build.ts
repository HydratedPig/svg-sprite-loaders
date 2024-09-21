#!/usr/bin/env pnpm tsx
import { cpus } from 'node:os'
import * as path from 'node:path'
import { existsSync } from 'node:fs'
import { rimrafSync } from 'rimraf'
import { execa } from 'execa'
import { chunk } from 'lodash-es'
import { targets } from './utils'

import { parseArgs } from 'node:util'

const commandOpts = parseArgs({
  options: {
    type: {
      type: 'boolean',
      short: 't',
      default: false
    },
  },
})

async function main() {
  const cores = cpus().length
  const groups = Math.ceil(targets.length / cores)
  const chunkTargets = chunk(targets, groups)
  await Promise.all(chunkTargets.map(t => Promise.all(t.map(build))))
}

async function build(target: string) {
  const pkgDir = path.resolve('packages', target)
  const distDir = path.resolve(pkgDir, 'dist')
  if (existsSync(distDir))
    rimrafSync(distDir)
  const { stdout } = await execa(
    'rollup',
    [
      '-c',
      commandOpts.values.type ? 'rollup.dts.config.ts' : 'rollup.pkg.config.ts',
      '--configPlugin',
      'swc3',
      '--environment',
      `TARGET:${target}`,
    ],
  )
  console.log(stdout)
}

main()
