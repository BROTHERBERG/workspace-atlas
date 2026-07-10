import { collectOperatorS2S3, OperatorCollectorResult } from '../lib/radar/collectors'
import { OPERATOR_REGISTRY } from '../lib/radar/operators'

const LIMIT = Number(process.env.TRIPWIRE_LIMIT ?? 25)

function pickOperators() {
  return OPERATOR_REGISTRY.filter((operator) => operator.domains.length > 0).slice(0, Math.max(25, LIMIT))
}

function printOperator(result: OperatorCollectorResult): void {
  const team = result.discovered.teamPageUrl ?? 'null'
  const careers = result.discovered.careersUrl ?? 'null'
  const rendered = [result.teamSnapshot?.rendered ? 'team-rendered' : null, result.careersSnapshot?.rendered ? 'careers-rendered' : null]
    .filter(Boolean)
    .join(',')
  const suffix = rendered ? ` ${rendered}` : ''
  console.log(`${result.operator.padEnd(34)} team=${team} careers=${careers} roster=${String(result.roster.length).padStart(2)} roles=${String(result.roles.length).padStart(2)} signals=${result.signals.length}${suffix}`)
}

function printSampleRosters(results: OperatorCollectorResult[]): void {
  console.log('\nSample rosters')
  for (const result of results.filter((item) => item.roster.length > 0).slice(0, 5)) {
    console.log(`  ${result.operator}`)
    for (const member of result.roster.slice(0, 5)) {
      console.log(`    - ${member.name} | ${member.title}`)
    }
  }
}

async function main(): Promise<void> {
  const operators = pickOperators()
  const results: OperatorCollectorResult[] = []

  console.log(`TRIPWIRE S2/S3 live baseline: operators=${operators.length}`)
  for (const operator of operators) {
    try {
      const result = await collectOperatorS2S3(operator)
      results.push(result)
      printOperator(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.log(`${operator.name.padEnd(34)} ERROR ${message}`)
    }
  }

  const teamHits = results.filter((result) => result.discovered.teamPageUrl).length
  const careersHits = results.filter((result) => result.discovered.careersUrl).length
  const eitherHits = results.filter((result) => result.discovered.teamPageUrl || result.discovered.careersUrl).length
  const signals = results.flatMap((result) => result.signals)

  console.log('\nDiscovery hit-rate')
  console.log(`  team=${teamHits}/${results.length}`)
  console.log(`  careers=${careersHits}/${results.length}`)
  console.log(`  either=${eitherHits}/${results.length}`)
  console.log(`  emittedSignals=${signals.length}`)
  printSampleRosters(results)

  if (results.length < 25) {
    console.error('Baseline failed: fewer than 25 operators completed.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('TRIPWIRE S2/S3 baseline failed:', err)
  process.exit(1)
})
