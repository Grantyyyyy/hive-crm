import * as api from './api'

function dateDaysAgo(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString()
}

const SED_CONTACTS = [
  { name: "Sarah Chen", company: "Vercel", email: "sarah@vercel.com", phone: "+1 415 234 5678", source: "REFERRAL" },
  { name: "Marcus Rivera", company: "Stripe", email: "marcus@stripe.com", phone: "+1 628 345 6789", source: "AD" },
  { name: "Priya Nair", company: "Linear", email: "priya@linear.app", phone: "+1 510 456 7890", source: "MANUAL" },
  { name: "James Okafor", company: "Notion", email: "james@notion.so", phone: "+1 650 567 8901", source: "REFERRAL" },
  { name: "Emma Johansson", company: "Figma", email: "emma@figma.com", phone: "+1 415 678 9012", source: "IMPORT" },
  { name: "Daniel Park", company: "PlanetScale", email: "daniel@planetscale.com", phone: "+1 628 789 0123", source: "AD" },
  { name: "Aisha Kamara", company: "Supabase", email: "aisha@supabase.io", phone: "+1 510 890 1234", source: "MANUAL" },
  { name: "Tom Whitfield", company: "Railway", email: "tom@railway.app", phone: "+1 650 901 2345", source: "REFERRAL" },
  { name: "Yuki Tanaka", company: "Resend", email: "yuki@resend.dev", phone: "+1 415 012 3456", source: "IMPORT" },
  { name: "Carlos Mendez", company: "Turso", email: "carlos@turso.tech", phone: "+1 628 123 4567", source: "AD" },
  { name: "Nina Wolff", company: "Lemon Squeezy", email: "nina@lemonsqueezy.com", phone: "+1 510 234 5678", source: "MANUAL" },
  { name: "Raj Patel", company: "Trigger.dev", email: "raj@trigger.dev", phone: "+1 650 345 6789", source: "REFERRAL" },
]

const SED_LEADS = [
  { name: "Felix Wagner", company: "Raycast", email: "felix@raycast.com", source: "REFERRAL", status: "QUALIFIED", phone: "+1 415 111 2222" },
  { name: "Sophie Laurent", company: "Zed", email: "sophie@zed.dev", source: "WEBSITE", status: "CONTACTED", phone: "+1 628 222 3333" },
  { name: "Omar Hassan", company: "Codeium", email: "omar@codeium.com", source: "COLD_OUTREACH", status: "NEW", phone: "+1 510 333 4444" },
  { name: "Lily Chen", company: "Warp", email: "lily@warp.dev", source: "AD", status: "NEW", phone: "+1 650 444 5555" },
  { name: "Amara Diallo", company: "Gitpod", email: "amara@gitpod.io", source: "WEBSITE", status: "UNQUALIFIED", phone: "+1 628 666 7777" },
  { name: "Ivan Petrov", company: "Pieces.app", email: "ivan@pieces.app", source: "IMPORT", status: "CONTACTED", phone: "+1 510 777 8888" },
  { name: "Grace Kim", company: "Devbox", email: "grace@devbox.sh", source: "AD", status: "QUALIFIED", phone: "+1 650 888 9999" },
]

const SED_TASKS = [
  { title: "Send contract to Sarah Chen", dueDate: dateDaysAgo(-5), priority: "URGENT", status: "OPEN" },
  { title: "Follow up on Stripe proposal", dueDate: dateDaysAgo(-2), priority: "HIGH", status: "IN_PROGRESS" },
  { title: "Demo prep for Linear call", dueDate: new Date().toISOString(), priority: "HIGH", status: "OPEN" },
  { title: "Review Figma contract terms", dueDate: new Date().toISOString(), priority: "MEDIUM", status: "IN_PROGRESS" },
  { title: "Qualify Felix Wagner", dueDate: dateDaysAgo(-2), priority: "HIGH", status: "OPEN" },
  { title: "Send pricing deck to Supabase", dueDate: dateDaysAgo(-3), priority: "MEDIUM", status: "OPEN" },
  { title: "Check in with James Okafor", dueDate: dateDaysAgo(-4), priority: "LOW", status: "OPEN" },
  { title: "Renewal call with Notion", dueDate: dateDaysAgo(-10), priority: "MEDIUM", status: "OPEN" },
  { title: "Onboarding check-in - Vercel", dueDate: dateDaysAgo(-14), priority: "LOW", status: "OPEN" },
  { title: "Send intro email to Omar Hassan", dueDate: dateDaysAgo(-8), priority: "MEDIUM", status: "COMPLETED", completedAt: dateDaysAgo(-7) },
  { title: "Close Figma deal", dueDate: dateDaysAgo(-3), priority: "URGENT", status: "COMPLETED", completedAt: dateDaysAgo(-2) },
]

export async function seedDemoData(_userId: string) {
  const confirm = window.confirm("Loading demo data will replace all existing data. Proceed?")
  if (!confirm) return

  try {
    const contacts: any[] = []
    for (const c of SED_CONTACTS) {
      const response = await api.contactsApi.create({
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        source: c.source,
        status: c.name === 'James Okafor' || c.name === 'Emma Johansson' ? 'CUSTOMER' : c.name === 'Sarah Chen' || c.name === 'Aisha Kamara' ? 'PROSPECT' : 'LEAD',
      })
      if (response.success && response.data) {
        contacts.push(response.data)
      }
    }
    console.log(`Seeded ${contacts.length} contacts`)

    const contactMap = new Map(contacts.map(c => [c.name, c]))

    const leads: any[] = []
    for (const l of SED_LEADS) {
      const response = await api.leadsApi.create({
        name: l.name,
        email: l.email,
        phone: l.phone,
        company: l.company,
        source: l.source,
        status: l.status,
        score: 0,
      })
      if (response.success && response.data) {
        leads.push(response.data)
      }
    }
    console.log(`Seeded ${leads.length} leads`)

    const deals = [
      { title: "Enterprise plan - Vercel", contactName: "Sarah Chen", value: 48000, stage: "NEGOTIATION", daysAgo: 2 },
      { title: "Team license - Stripe", contactName: "Marcus Rivera", value: 24000, stage: "PROPOSAL", daysAgo: 8 },
      { title: "Starter plan - Linear", contactName: "Priya Nair", value: 6000, stage: "DISCOVERY", daysAgo: 15 },
      { title: "Pro plan - Notion", contactName: "James Okafor", value: 12000, stage: "WON", daysAgo: 5 },
      { title: "Design seats - Figma", contactName: "Emma Johansson", value: 18000, stage: "WON", daysAgo: 3 },
      { title: "DB scaling - PlanetScale", contactName: "Daniel Park", value: 9600, stage: "LOST", daysAgo: 20, lostReason: "Went with competitor" },
      { title: "Backend infra - Supabase", contactName: "Aisha Kamara", value: 15000, stage: "PROPOSAL", daysAgo: 12 },
      { title: "Deployment plan - Railway", contactName: "Tom Whitfield", value: 4800, stage: "DISCOVERY", daysAgo: 18 },
      { title: "Email API - Resend", contactName: "Yuki Tanaka", value: 2400, stage: "NEGOTIATION", daysAgo: 6 },
      { title: "DB migration - Turso", contactName: "Carlos Mendez", value: 7200, stage: "LOST", daysAgo: 11, lostReason: "Budget cut" },
    ]

    const createdDeals: any[] = []
    for (const d of deals) {
      const contact = contactMap.get(d.contactName)
      if (contact) {
        const response = await api.dealsApi.create({
          title: d.title,
          contactId: contact.id,
          value: d.value,
          stage: d.stage,
          lostReason: d.lostReason,
          expectedCloseDate: new Date(Date.now() - (d.daysAgo - 30) * 86400000).toISOString(),
        })
        if (response.success && response.data) {
          createdDeals.push(response.data)
        }
      }
    }
    console.log(`Seeded ${createdDeals.length} deals`)

    const dealMap = new Map(createdDeals.map((d, i) => [deals[i].contactName, d]))

    const activities = [
      { contactName: "Sarah Chen", type: "CALL", content: "Discussed pricing tiers, they need to loop in their CFO.", daysAgo: 2, dealLinked: true },
      { contactName: "Marcus Rivera", type: "CALL", content: "Initial discovery call, gathering requirements for the team.", daysAgo: 10, dealLinked: true },
      { contactName: "Sarah Chen", type: "EMAIL", content: "Sent proposal PDF and follow-up on timeline.", daysAgo: 4, dealLinked: true },
      { contactName: "Emma Johansson", type: "EMAIL", content: "Shared case studies on design team rollouts.", daysAgo: 8, dealLinked: false },
      { contactName: "Aisha Kamara", type: "EMAIL", content: "Followed up on the security questionnaire.", daysAgo: 14, dealLinked: true },
      { contactName: "Sarah Chen", type: "NOTE", content: "Champion is Sarah, decision maker is VP of Eng. Need technical validation.", daysAgo: 5, dealLinked: true },
      { contactName: "Marcus Rivera", type: "NOTE", content: "They are currently using a mix of internal tools. Pain point is scaling.", daysAgo: 12, dealLinked: true },
      { contactName: "Yuki Tanaka", type: "NOTE", content: "Strong technical team, will likely need API sandbox access.", daysAgo: 9, dealLinked: true },
      { contactName: "Sarah Chen", type: "MEETING", content: "Ran a 45 min demo with the core dev team. High engagement.", daysAgo: 7, dealLinked: true },
      { contactName: "Aisha Kamara", type: "MEETING", content: "Architecture review. Addressed latency concerns.", daysAgo: 16, dealLinked: true },
      { contactName: "Emma Johansson", type: "MEETING", content: "Kickoff call for the pilot program. Success criteria defined.", daysAgo: 4, dealLinked: true },
    ]

    for (const a of activities) {
      const contact = contactMap.get(a.contactName)
      if (contact) {
        let dealId: string | undefined
        if (a.dealLinked) {
          const deal = dealMap.get(a.contactName)
          if (deal) dealId = deal.id
        }
        await api.activitiesApi.create({
          type: a.type,
          content: a.content,
          contactId: contact.id,
          dealId,
        })
      }
    }
    console.log(`Seeded ${activities.length} activities`)

    for (const t of SED_TASKS) {
      await api.tasksApi.create({
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
        completedAt: t.completedAt,
      })
    }
    console.log(`Seeded ${SED_TASKS.length} tasks`)

    window.location.reload()
  } catch (error) {
    console.error('Error seeding data:', error)
    alert('Failed to seed data. Please check the console for details.')
  }
}
