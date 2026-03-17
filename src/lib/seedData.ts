import {
  getContacts,
  saveContacts,
  saveDeals,
  saveActivities,
  saveDismissedFollowUps,
  saveLeads,
  saveTasks,
} from "./storage"
import type { Contact, Deal, Activity, DealStage, ActivityType, Lead, LeadSource, LeadStatus, Task } from "./types"
import { calculateLeadScore } from "./helpers"

function generateId() {
  return crypto.randomUUID()
}

function dateDaysAgo(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString()
}

const SED_CONTACTS = [
  { name: "Sarah Chen",       company: "Vercel",          email: "sarah@vercel.com",       phone: "+1 415 234 5678", source: "referral" as const },
  { name: "Marcus Rivera",    company: "Stripe",          email: "marcus@stripe.com",      phone: "+1 628 345 6789", source: "ad" as const },
  { name: "Priya Nair",       company: "Linear",          email: "priya@linear.app",       phone: "+1 510 456 7890", source: "manual" as const },
  { name: "James Okafor",     company: "Notion",          email: "james@notion.so",        phone: "+1 650 567 8901", source: "referral" as const },
  { name: "Emma Johansson",   company: "Figma",           email: "emma@figma.com",         phone: "+1 415 678 9012", source: "import" as const },
  { name: "Daniel Park",      company: "PlanetScale",     email: "daniel@planetscale.com", phone: "+1 628 789 0123", source: "ad" as const },
  { name: "Aisha Kamara",     company: "Supabase",        email: "aisha@supabase.io",      phone: "+1 510 890 1234", source: "manual" as const },
  { name: "Tom Whitfield",    company: "Railway",         email: "tom@railway.app",        phone: "+1 650 901 2345", source: "referral" as const },
  { name: "Yuki Tanaka",      company: "Resend",          email: "yuki@resend.dev",        phone: "+1 415 012 3456", source: "import" as const },
  { name: "Carlos Mendez",    company: "Turso",           email: "carlos@turso.tech",      phone: "+1 628 123 4567", source: "ad" as const },
  { name: "Nina Wolff",       company: "Lemon Squeezy",   email: "nina@lemonsqueezy.com",  phone: "+1 510 234 5678", source: "manual" as const },
  { name: "Raj Patel",        company: "Trigger.dev",     email: "raj@trigger.dev",        phone: "+1 650 345 6789", source: "referral" as const },
]

const SED_DEALS = [
  { title: "Enterprise plan - Vercel",        contactName: "Sarah Chen",     value: 48000, stage: "negotiation" as DealStage, daysAgo: 2  },
  { title: "Team license - Stripe",           contactName: "Marcus Rivera",  value: 24000, stage: "proposal" as DealStage,    daysAgo: 8  },
  { title: "Starter plan - Linear",           contactName: "Priya Nair",     value: 6000,  stage: "discovery" as DealStage,   daysAgo: 15 },
  { title: "Pro plan - Notion",               contactName: "James Okafor",   value: 12000, stage: "won" as DealStage,         daysAgo: 5  },
  { title: "Design seats - Figma",            contactName: "Emma Johansson", value: 18000, stage: "won" as DealStage,         daysAgo: 3  },
  { title: "DB scaling - PlanetScale",        contactName: "Daniel Park",    value: 9600,  stage: "lost" as DealStage,        daysAgo: 20, lostReason: "Went with competitor" },
  { title: "Backend infra - Supabase",        contactName: "Aisha Kamara",   value: 15000, stage: "proposal" as DealStage,    daysAgo: 12 },
  { title: "Deployment plan - Railway",       contactName: "Tom Whitfield",  value: 4800,  stage: "discovery" as DealStage,   daysAgo: 18 },
  { title: "Email API - Resend",              contactName: "Yuki Tanaka",    value: 2400,  stage: "negotiation" as DealStage,  daysAgo: 6  },
  { title: "DB migration - Turso",            contactName: "Carlos Mendez",  value: 7200,  stage: "lost" as DealStage,        daysAgo: 11, lostReason: "Budget cut" },
]

const SED_ACTIVITIES = [
  // Calls
  { contactName: "Sarah Chen",     type: "call" as ActivityType, content: "Discussed pricing tiers, they need to loop in their CFO.", daysAgo: 2, dealLinked: true },
  { contactName: "Marcus Rivera",  type: "call" as ActivityType, content: "Initial discovery call, gathering requirements for the team.", daysAgo: 10, dealLinked: true },
  { contactName: "Priya Nair",     type: "call" as ActivityType, content: "Quick sync on roadmap and expected timeline.", daysAgo: 18, dealLinked: false },
  { contactName: "James Okafor",   type: "call" as ActivityType, content: "Procurement discussion and final negotiation.", daysAgo: 6, dealLinked: true },
  { contactName: "Carlos Mendez",  type: "call" as ActivityType, content: "Quarterly check-in, budget is tight this year.", daysAgo: 15, dealLinked: true },
  // Emails
  { contactName: "Sarah Chen",     type: "email" as ActivityType, content: "Sent proposal PDF and follow-up on timeline.", daysAgo: 4, dealLinked: true },
  { contactName: "Emma Johansson", type: "email" as ActivityType, content: "Shared case studies on design team rollouts.", daysAgo: 8, dealLinked: false },
  { contactName: "Aisha Kamara",   type: "email" as ActivityType, content: "Followed up on the security questionnaire.", daysAgo: 14, dealLinked: true },
  { contactName: "Daniel Park",    type: "email" as ActivityType, content: "Checked in on evaluation phase. No response yet.", daysAgo: 22, dealLinked: true },
  { contactName: "Tom Whitfield",  type: "email" as ActivityType, content: "Sent invitation for the technical deep-dive.", daysAgo: 19, dealLinked: false },
  // Notes
  { contactName: "Sarah Chen",     type: "note" as ActivityType, content: "Champion is Sarah, decision maker is the VP of Eng. Need technical validation.", daysAgo: 5, dealLinked: true },
  { contactName: "Marcus Rivera",  type: "note" as ActivityType, content: "They are currently using a mix of internal tools. Pain point is scaling.", daysAgo: 12, dealLinked: true },
  { contactName: "Nina Wolff",     type: "note" as ActivityType, content: "Met at conference. High intent but timeline is Q3.", daysAgo: 25, dealLinked: false },
  { contactName: "Raj Patel",      type: "note" as ActivityType, content: "Introduced via investor. Looking to streamline operations.", daysAgo: 28, dealLinked: false },
  { contactName: "Yuki Tanaka",    type: "note" as ActivityType, content: "Strong technical team, will likely need API sandbox access.", daysAgo: 9, dealLinked: true },
  // Meetings
  { contactName: "Sarah Chen",     type: "meeting" as ActivityType, content: "Ran a 45 min demo with the core dev team. High engagement.", daysAgo: 7, dealLinked: true },
  { contactName: "Marcus Rivera",  type: "meeting" as ActivityType, content: "Executive briefing with CTO. Solid alignment on business value.", daysAgo: 14, dealLinked: true },
  { contactName: "Aisha Kamara",   type: "meeting" as ActivityType, content: "Architecture review. Addressed latency concerns.", daysAgo: 16, dealLinked: true },
  { contactName: "Daniel Park",    type: "meeting" as ActivityType, content: "Final vendor shootout presentation. Went okay, but competitor is cheaper.", daysAgo: 21, dealLinked: true },
  { contactName: "Emma Johansson", type: "meeting" as ActivityType, content: "Kickoff call for the pilot program. Success criteria defined.", daysAgo: 4, dealLinked: true },
]

const SED_LEADS: {
  name: string; company: string; email: string; source: LeadSource; status: LeadStatus; phone: string
}[] = [
  { name: "Felix Wagner",    company: "Raycast",      email: "felix@raycast.com",    source: "referral",        status: "qualified",    phone: "+1 415 111 2222" },
  { name: "Sophie Laurent",  company: "Zed",          email: "sophie@zed.dev",       source: "website",         status: "contacted",    phone: "+1 628 222 3333" },
  { name: "Omar Hassan",     company: "Codeium",      email: "omar@codeium.com",     source: "cold-outreach",   status: "new",          phone: "+1 510 333 4444" },
  { name: "Lily Chen",       company: "Warp",         email: "lily@warp.dev",        source: "ad",              status: "new",          phone: "+1 650 444 5555" },
  { name: "Ben Schwartz",    company: "Cursor",       email: "ben@cursor.sh",        source: "referral",        status: "converted",    phone: "+1 415 555 6666" },
  { name: "Amara Diallo",    company: "Gitpod",       email: "amara@gitpod.io",      source: "website",         status: "unqualified",  phone: "+1 628 666 7777" },
  { name: "Ivan Petrov",     company: "Pieces.app",   email: "ivan@pieces.app",      source: "import",          status: "contacted",    phone: "+1 510 777 8888" },
  { name: "Grace Kim",       company: "Devbox",       email: "grace@devbox.sh",      source: "ad",              status: "qualified",    phone: "+1 650 888 9999" },
]

const SED_LEAD_ACTIVITIES: {
  leadName: string; type: ActivityType; content: string; daysAgo: number
}[] = [
  { leadName: "Felix Wagner",   type: "call",    content: "Intro call, strong product interest. Wants a demo next week.", daysAgo: 3 },
  { leadName: "Sophie Laurent", type: "email",   content: "Sent product overview doc and pricing sheet.", daysAgo: 5 },
  { leadName: "Omar Hassan",    type: "note",    content: "Found via outbound sequence. Cold lead, needs warming.", daysAgo: 1 },
  { leadName: "Grace Kim",      type: "meeting", content: "45 min deep dive on use case. Very engaged.", daysAgo: 2 },
  { leadName: "Ivan Petrov",    type: "email",   content: "Follow-up after initial call. Scheduling a demo.", daysAgo: 7 },
  { leadName: "Ben Schwartz",   type: "call",    content: "Final qualifying call before conversion.", daysAgo: 10 },
]

const SED_TASKS = [
  // Overdue
  { title: "Send contract to Sarah Chen",       entityType: "contact" as const, entityName: "Sarah Chen",     dueOffset: -5,  priority: "urgent" as const,  status: "open" as const        },
  { title: "Follow up on Stripe proposal",      entityType: "deal" as const,    entityName: "Team license - Stripe", dueOffset: -2, priority: "high" as const, status: "in-progress" as const },
  
  // Due today
  { title: "Demo prep for Linear call",         entityType: "lead" as const,    entityName: "Priya Nair",     dueOffset: 0,   priority: "high" as const,    status: "open" as const        },
  { title: "Review Figma contract terms",       entityType: "contact" as const, entityName: "Emma Johansson", dueOffset: 0,   priority: "medium" as const,  status: "in-progress" as const },
  
  // Due this week
  { title: "Qualify Felix Wagner",              entityType: "lead" as const,    entityName: "Felix Wagner",   dueOffset: 2,   priority: "high" as const,    status: "open" as const        },
  { title: "Send pricing deck to Supabase",     entityType: "deal" as const,    entityName: "Backend infra - Supabase", dueOffset: 3, priority: "medium" as const, status: "open" as const },
  { title: "Check in with James Okafor",        entityType: "contact" as const, entityName: "James Okafor",   dueOffset: 4,   priority: "low" as const,     status: "open" as const        },
  { title: "Research Turso competitors",        entityType: "lead" as const,    entityName: "Grace Kim",      dueOffset: 5,   priority: "medium" as const,  status: "open" as const        },
  
  // Upcoming
  { title: "Renewal call with Notion",          entityType: "contact" as const, entityName: "James Okafor",   dueOffset: 10,  priority: "medium" as const,  status: "open" as const        },
  { title: "Onboarding check-in - Vercel",      entityType: "contact" as const, entityName: "Sarah Chen",     dueOffset: 14,  priority: "low" as const,     status: "open" as const        },
  
  // Completed
  { title: "Send intro email to Omar Hassan",   entityType: "lead" as const,    entityName: "Omar Hassan",    dueOffset: -8,  priority: "medium" as const,  status: "completed" as const   },
  { title: "Close Figma deal",                  entityType: "deal" as const,    entityName: "Design seats - Figma", dueOffset: -3, priority: "urgent" as const, status: "completed" as const },
]

export function seedDemoData(userId: string) {
  const existingContacts = getContacts(userId)
  
  if (existingContacts.length > 0) {
    const confirm = window.confirm("You already have data. Loading demo data will replace all existing contacts, deals, activities, and leads. Proceed?")
    if (!confirm) {
      return
    }
  }

  // Clear existing
  saveContacts(userId, [])
  saveDeals(userId, [])
  saveActivities(userId, [])
  saveDismissedFollowUps(userId, [])
  saveLeads(userId, [])
  saveTasks(userId, [])

  // Generate Contacts
  const contacts: Contact[] = SED_CONTACTS.map((c, i) => ({
    id: generateId(),
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    source: c.source,
    createdAt: dateDaysAgo(30 - i), // Spread creation dates
  }))

  const contactMap = new Map(contacts.map(c => [c.name, c]))

  // Generate Deals
  const deals: Deal[] = SED_DEALS.map(d => {
    const contact = contactMap.get(d.contactName)
    if (!contact) throw new Error(`Contact ${d.contactName} not found mapped.`)
    const dateStr = dateDaysAgo(d.daysAgo)
    return {
      id: generateId(),
      title: d.title,
      contactId: contact.id,
      value: d.value,
      stage: d.stage,
      expectedCloseDate: dateDaysAgo(d.daysAgo - 30), // future relative to daysAgo, roughly
      lostReason: (d as any).lostReason,
      createdAt: dateStr,
      updatedAt: dateStr,
    }
  })

  // Group deals by contact for easy linking
  const dealsByContact = new Map<string, Deal>()
  deals.forEach(d => {
    // just store the first deal for the contact as the linked one
    if (!dealsByContact.has(d.contactId)) {
      dealsByContact.set(d.contactId, d)
    }
  })

  // Generate Activities
  const activities: Activity[] = SED_ACTIVITIES.map(a => {
    const contact = contactMap.get(a.contactName)
    if (!contact) throw new Error(`Contact ${a.contactName} not found mapped.`)
    
    let dealId: string | undefined = undefined
    if (a.dealLinked) {
      const deal = dealsByContact.get(contact.id)
      if (deal) dealId = deal.id
    }

    const dateStr = dateDaysAgo(a.daysAgo)
    
    return {
      id: generateId(),
      contactId: contact.id,
      dealId,
      type: a.type,
      content: a.content,
      createdAt: dateStr,
    }
  })

  // Generate Leads
  const sarahChen = contactMap.get("Sarah Chen")

  const leads: Lead[] = SED_LEADS.map((l, i) => {
    const baseLead: Lead = {
      id: generateId(),
      name: l.name,
      email: l.email,
      company: l.company,
      phone: l.phone,
      source: l.source,
      status: l.status,
      score: 0,
      ownerId: userId,
      createdAt: dateDaysAgo(20 - i * 2),
      updatedAt: dateDaysAgo(Math.max(0, 10 - i)),
    }

    // Ben Schwartz is converted, link to Sarah Chen
    if (l.name === "Ben Schwartz" && sarahChen) {
      baseLead.convertedAt = dateDaysAgo(5)
      baseLead.convertedToContactId = sarahChen.id
      baseLead.status = "converted"
    }

    baseLead.score = calculateLeadScore(baseLead)
    return baseLead
  })

  const leadMap = new Map(leads.map(l => [l.name, l]))

  // Generate Lead Activities
  const leadActivities: Activity[] = SED_LEAD_ACTIVITIES.map(la => {
    const lead = leadMap.get(la.leadName)
    if (!lead) throw new Error(`Lead ${la.leadName} not found mapped.`)
    return {
      id: generateId(),
      contactId: "",
      leadId: lead.id,
      type: la.type,
      content: la.content,
      createdAt: dateDaysAgo(la.daysAgo),
    }
  })

  // Merge activities
  const allActivities = [...activities, ...leadActivities]

  // Save
  saveContacts(userId, contacts)
  saveDeals(userId, deals)
  saveActivities(userId, allActivities)
  saveLeads(userId, leads)

  // Generate Tasks
  const dealMap = new Map(deals.map(d => [d.title, d]))
  const tasks: Task[] = SED_TASKS.map(t => {
    let entityId = ""
    if (t.entityType === 'contact') entityId = contactMap.get(t.entityName)?.id ?? ""
    if (t.entityType === 'deal') entityId = dealMap.get(t.entityName)?.id ?? ""
    if (t.entityType === 'lead') entityId = leadMap.get(t.entityName)?.id ?? ""

    const dateStr = dateDaysAgo(-t.dueOffset) // positive offset in dateDaysAgo means in the past, so negative here
    const isCompleted = t.status === 'completed'

    return {
      id: generateId(),
      title: t.title,
      dueDate: dateStr,
      priority: t.priority,
      status: t.status,
      ownerId: userId,
      createdBy: userId,
      entityType: t.entityType,
      entityId,
      completedAt: isCompleted ? dateDaysAgo(1) : undefined,
      createdAt: dateDaysAgo(10),
      updatedAt: dateDaysAgo(1),
    }
  })

  saveTasks(userId, tasks)

  // Reload
  window.location.reload()
}
