import * as esbuild from 'esbuild'
import pkg from './package.json' with { type: 'json'}

const today = new Date();
const year = today.getFullYear();
const date = ("0" + today.getDate()).slice(-2);
const month = ("0" + (today.getMonth() + 1)).slice(-2);

const config = {
  banner: {
    js: `/*!
 * ${pkg.name} v${pkg.version} (${year}-${month}-${date})
 * ${pkg.homepage}
 * Copyright (c) ${year} ; Licensed ${pkg.license}
 */`},
  minify: true,
  bundle: false,
  outdir: 'dist',
}

esbuild.build({
  ...config,
  entryPoints: ['src/sorts/*.js'],
  format: 'iife',
  entryNames: '[dir]/sorts/[name].min',
})

esbuild.build({
  ...config,
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'iife',
  entryNames: '[dir]/tablesort.min',
})

esbuild.build({
  ...config,
  entryPoints: ['src/tablesort.js', 'src/sorts/*.js'],
  format: 'esm',
  entryNames: '[dir]/[name].min',
  outExtension: { '.js': '.mjs' },
})
