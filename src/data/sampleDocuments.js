export const sampleDocuments = [
  {
    id: 1,
    title: 'Q2 Loss Analysis — Enterprise Deals',
    type: 'Loss Analysis',
    content: `Loss Analysis — Q2 Enterprise Deals

Top reasons deals were lost this quarter:

1. Price objections (38% of losses)
- Procurement teams requested 20–30% discounts we couldn't match
- Competitors (Vendor X, Vendor Y) offered lower entry-level pricing
- Our response: emphasize total cost of ownership (TCO) over 3 years. In 4 of 6 analyzed wins, reps who led with TCO closed at full price.

2. "We already have a solution" (24% of losses)
- Typically existing tools like Salesforce or homegrown spreadsheets
- Winning counter: ask what gaps their current solution leaves. The answer is almost always reporting, onboarding time, or cross-team visibility.

3. Timing / budget freeze (18% of losses)
- Q4 is historically weak for new spend approvals
- Winning counter: offer a pilot scoped to one team at a reduced commitment, then expand in Q1.

4. Champion left the company (12% of losses)
- No multi-threading in 80% of these deals
- Rep coaching note: always identify a second champion within 30 days of first contact.

Key win pattern: Reps who scheduled an executive briefing in the first two calls won at 2.3x the rate of those who didn't.`,
  },
  {
    id: 2,
    title: 'Competitive Battlecard — Vendor X',
    type: 'Battlecard',
    content: `Competitive Battlecard: Vendor X

Strengths (theirs):
- Lower entry price ($12k/year vs our $18k starting)
- Faster implementation claims (they say 2 weeks; reality is 4–6)
- Strong brand recognition in mid-market

Weaknesses (theirs):
- No enterprise SSO or SCIM provisioning
- Reporting is locked behind their highest tier ($35k+)
- Customer support is offshore, avg 48hr response SLA
- No API access below enterprise tier
- Lost 3 mutual prospects in Q2 due to data residency issues (EU customers)

How to position against them:
- If price comes up: "Vendor X's $12k price doesn't include the reporting and integrations your team needs — by the time you're fully operational you're at $30k+. Our $18k includes everything."
- If implementation comes up: "Their 2-week claim is for a basic setup. Teams with your data volume typically take 6–8 weeks with them. We've done 4 implementations of your size in under 3 weeks."
- If brand recognition comes up: "They're a great fit for smaller teams. At your scale, their support model becomes a real problem — your CSM won't be based in your timezone."

Proof points to use:
- Acme Corp switched from Vendor X to us in Q1 — 40% reduction in time-to-report
- Global Co evaluated both; chose us for EU data residency compliance`,
  },
  {
    id: 3,
    title: 'Renewal Call Notes — TechCorp Account',
    type: 'Renewal Playbook',
    content: `TechCorp Renewal — Call Notes & Playbook

Account background:
- $48k ARR, 3-year customer, expansion potential to $72k if they add the Analytics module
- Champion: Dana W., VP of Sales Ops — highly engaged, internal advocate
- Risk factor: New CFO joined 6 months ago, unknown disposition toward the platform

Objections raised on last renewal call:

"We're not sure we're getting the ROI we expected."
- Dana knows the value but needs help building the business case for the new CFO
- Action: send ROI summary template pre-populated with their actual usage data before the next call
- Key metric to surface: their team went from 4-hour to 45-minute weekly reporting cycles

"We need to see a price reduction to renew."
- Standard negotiating position; they've renewed twice before without a discount
- Our position: we can offer a 3-year lock at current pricing (no future increases) instead of a cash discount
- Do not offer more than 5% without VP approval

"Can we pause and restart in Q1?"
- This is a delay tactic; they want to see if they can get a better deal
- Counter: offer Q1 start date at current price only if they sign by October 15; otherwise Q1 start will be at next year's list price (+8%)

Expansion opportunity:
- Analytics module demo should happen in the same call as renewal discussion
- Dana confirmed her team manually pulls 3 reports/week that Analytics would automate — frame expansion as solving her team's current pain, not as upsell`,
  },
];

export const DOC_TYPE_STYLES = {
  'Battlecard': {
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  'Loss Analysis': {
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  'Renewal Playbook': {
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  'Call Notes': {
    badge: 'bg-pink-100 text-pink-700',
    dot: 'bg-pink-500',
  },
  'Other': {
    badge: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  },
};
