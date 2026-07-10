import { OPERATOR_REGISTRY } from '../lib/radar/operators'
import { snapshotPage, snapshotSlug, SnapshotDiffResult } from '../lib/radar/snapshot'

const TEST_OPERATOR_NAMES = ['Work Nicer', 'Assembly', 'TradeSpace', 'Platform Calgary', 'VennYYC']

function homepageFromDomain(domain: string): string {
  return `https://${domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}/`
}

function pickOperators() {
  return TEST_OPERATOR_NAMES.map((name) => {
    const operator = OPERATOR_REGISTRY.find((entry) => entry.name === name)
    if (!operator) throw new Error(`Operator not found in registry: ${name}`)
    if (operator.domains.length === 0) throw new Error(`Operator has no domains in registry: ${name}`)
    return {
      name: operator.name,
      operatorId: snapshotSlug(operator.name),
      pageKey: 'homepage-check',
      url: homepageFromDomain(operator.domains[0]),
    }
  })
}

function diffCount(results: SnapshotDiffResult[]): number {
  return results.reduce((sum, result) => sum + result.added.length + result.removed.length, 0)
}

function printRun(label: string, results: SnapshotDiffResult[]): void {
  console.log(`\n${label}`)
  for (const result of results) {
    const count = result.added.length + result.removed.length
    const suffix = result.status === 'fetch_error' ? ` fetch_error=${result.error}` : ` diffs=${count}`
    console.log(`  ${result.operatorId.padEnd(24)} ${result.status.padEnd(11)} ${result.url}${suffix}`)
  }
  console.log(`  totalDiffBlocks=${diffCount(results)}`)
}

async function runPass(label: string, pages: ReturnType<typeof pickOperators>): Promise<SnapshotDiffResult[]> {
  const results: SnapshotDiffResult[] = []
  for (const page of pages) {
    const result = await snapshotPage(page)
    results.push(result)
  }
  printRun(label, results)
  return results
}

async function main() {
  const pages = pickOperators()

  console.log('TRIPWIRE snapshot check: 5 Calgary independent operators')
  for (const page of pages) {
    console.log(`  ${page.name}: ${page.url}`)
  }

  const first = await runPass('first run', pages)
  const second = await runPass('second run', pages)
  const secondDiffs = diffCount(second)
  const fetchErrors = [...first, ...second].filter((result) => result.status === 'fetch_error')

  console.log('\nsummary')
  console.log(`  operators=${pages.length}`)
  console.log(`  firstRunDiffBlocks=${diffCount(first)}`)
  console.log(`  secondRunDiffBlocks=${secondDiffs}`)
  console.log(`  fetchErrors=${fetchErrors.length}`)

  if (secondDiffs > 0) {
    console.error('\nSnapshot check failed: second run emitted diffs.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Snapshot check failed:', err)
  process.exit(1)
})
