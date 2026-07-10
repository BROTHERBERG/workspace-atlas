import { diffCareersRoles, diffTeamRosters, parseCareersRoles, parseTeamRoster } from '../lib/radar/collectors'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

function main(): void {
  const previousTeam = parseTeamRoster(`
    <section>
      <h2>Leadership Team</h2>
      <div>Alex Morgan</div><div>General Manager</div>
      <div>Jordan Lee</div><div>Director of Operations</div>
      <div>Priya Shah</div><div>Community Manager</div>
    </section>
  `)
  const currentTeam = parseTeamRoster(`
    <section>
      <h2>Leadership Team</h2>
      <div>Alex Morgan</div><div>Acting General Manager</div>
      <div>Priya Shah</div><div>Community Manager</div>
    </section>
  `)
  const teamSignals = diffTeamRosters(previousTeam, currentTeam, 'Fixture Workspace', 'https://fixture.example/team', '2026-07-09T00:00:00.000Z')

  assert(teamSignals.some((signal) => signal.type === 'team_departure' && /Jordan Lee - Director of Operations/.test(signal.evidence?.[0]?.excerpt ?? '')), 'expected Jordan Lee team_departure')
  assert(teamSignals.some((signal) => signal.type === 'interim_title' && /Alex Morgan - General Manager -> Acting General Manager/.test(signal.evidence?.[0]?.excerpt ?? '')), 'expected Alex Morgan interim_title')

  const homepageSignals = diffTeamRosters(previousTeam, currentTeam, 'Homepage Fixture', 'https://fixture.example/', '2026-07-09T00:00:00.000Z')
  assert(homepageSignals.length === 0, 'expected bare homepage team-page diff to emit nothing')

  const previousCareers = parseCareersRoles(`
    <main>
      <h2>Open roles</h2>
      <a>Community Associate</a>
    </main>
  `)
  const currentCareers = parseCareersRoles(`
    <main>
      <h2>Open roles</h2>
      <a>Community Associate</a>
      <a>Director of Community Operations</a>
    </main>
  `)
  const careersSignals = diffCareersRoles(previousCareers, currentCareers, 'Fixture Workspace', 'https://fixture.example/careers', '2026-07-09T00:00:00.000Z')
  const directorSignal = careersSignals.find((signal) => signal.type === 'careers_added' && signal.title === 'Director of Community Operations')

  assert(directorSignal, 'expected Director of Community Operations careers_added')
  assert(directorSignal?.confidence === 0.9, 'expected leadership careers_added confidence 0.9')

  console.log('TRIPWIRE collector fixture tests passed')
  console.log(`  team_departure=${teamSignals.filter((signal) => signal.type === 'team_departure').length}`)
  console.log(`  interim_title=${teamSignals.filter((signal) => signal.type === 'interim_title').length}`)
  console.log(`  careers_added=${careersSignals.filter((signal) => signal.type === 'careers_added').length}`)
  console.log(`  homepage_guard=${homepageSignals.length}`)
}

try {
  main()
} catch (err) {
  console.error('TRIPWIRE collector fixture tests failed:', err)
  process.exit(1)
}
