#!/usr/bin/env node

import '../lib/sandbox-patch.mjs'

import fs from 'fs'
import util from 'util'
import yaml from 'js-yaml'
import handlebars from 'handlebars'

import hl from '@mathdown/microlight'
import md from 'markdown-it'
import emoji from 'markdown-it-emoji'
import graph from '../lib/markdown-it-graph.mjs'
import anchor from 'markdown-it-anchor'
import funplot from '../lib/markdown-it-funplot.mjs'
import grammkit from '../lib/markdown-it-grammkit.mjs'
import deflist from 'markdown-it-deflist'
import ascii2mathml from '../lib/markdown-it-ascii2mathml.mjs'
import tableofcontents from 'markdown-it-toc-done-right'

import { version } from '../lib/version.mjs'

const flags = {
	input: '',
	output: '',
	metadata: '',
	template: '',
	args: [],
}
const argv = process.argv
const argc = argv.length
if (argc < 2) {
	console.error('not enough arguments')
	process.exit(1)
}
for (let i = 2; i < argc; i++) {
	if (!argv[i].startsWith('-') || argv[i] == '--') {
		i++
		flags.args = argv.slice(i)
		break
	}
	switch (argv[i]) {
	case '-input':
		i++
		if (i >= argc) {
			console.error('expected input file path')
			process.exit(1)
		}
		flags.input = argv[i]
		break
	case '-output':
		i++
		if (i >= argc) {
			console.error('expected output file path')
			process.exit(1)
		}
		flags.output = argv[i]
		break
	case '-metadata':
		i++
		if (i >= argc) {
			console.error('expected metadata file path')
			process.exit(1)
		}
		flags.metadata = argv[i]
		break
	case '-template':
		i++
		if (i >= argc) {
			console.error('expected template file path')
			process.exit(1)
		}
		flags.template = argv[i]
		break
	default:
		const quoted = util.format('%O', argv[i])
		console.error(`unknown argument: ${quoted}`)
		process.exit(1)
	}
}

let inputFile = process.stdin.fd
if (flags.input != '') {
	inputFile = flags.input
}
const input = fs.readFileSync(inputFile, 'utf8')

let outputFile = process.stdout.fd
if (flags.output != '') {
	outputFile = flags.output
}
const output = fs.openSync(outputFile, 'w')

let metadataText = ''
if (flags.metadata != '') {
	metadataText = fs.readFileSync(flags.metadata, 'utf8')
}
const metadata = yaml.load(metadataText)

let templateText = '<doctype html>{{{body}}}'
if (flags.template != '') {
	templateText = fs.readFileSync(flags.template, 'utf8')
}
const template = handlebars.compile(templateText)

const config = {
	typography: true,
	highlight: (s) => `<pre class=microlight><code>${hl(s)}</code></pre>`,
}

anchor.defaults.permalink = true

fs.writeSync(output, template({
	version: `v${version}`,
	...metadata,
	body: md(config)
		.use(emoji)
		.use(graph)
		.use(anchor)
		.use(funplot)
		.use(grammkit)
		.use(ascii2mathml)
		.use(tableofcontents)
		.render(input),
}))