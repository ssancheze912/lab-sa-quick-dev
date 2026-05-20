## User Journeys

### Journey 1: Carlos — The Call He Was Always Dreading

Carlos is in the middle of reviewing a proposal when his phone rings. It's a
number he half-recognizes — probably someone from Distribuidora Andina, a
client with four or five contacts across different departments. In the old
world, this is the beginning of a small crisis: he minimizes his proposal,
opens the shared Drive folder, waits for the Excel to load, searches by company
name, finds three rows with slight name variations, and still isn't sure which
contact he's about to speak with. By the time he has context, he's already
apologized twice and lost the professional thread of the call.

Today is different. Carlos opens the app, types "Andina", and the client record
appears before he finishes typing. One click: he's on the client detail page.
All contacts are right there — names, roles, phones. He sees "Ramiro Vega —
Procurement Manager" and instantly knows this is the person who handles
approvals. He answers confidently, uses Ramiro's name, and navigates the
conversation without a single awkward pause.

After the call, he notices Ramiro's email is missing. He fills it in directly
from the contact detail, knowing every teammate will see the updated record
immediately. No separate email to Marcela. No note in his personal agenda that
will be forgotten by Friday.

**This journey reveals requirements for:**
- Client search with fast, real-time filtering
- Client detail view with inline contact list (no navigation away)
- Contact detail view accessible in one click from the client
- Inline field editing on contact records

### Journey 2: Carlos — First Day Onboarding a New Client

Carlos just closed a deal with a new company: Construcciones del Valle. He's
in the parking lot after the meeting, laptop closed, running on adrenaline. He
needs to get the client and his two contacts into the system before he forgets
the details.

He opens the app on his phone-sized browser, taps "New Client", fills in the
name, NIT, city and phone in under 30 seconds. The client is saved. Now he
adds the first contact — the general manager — links him to Construcciones del
Valle directly from the contact creation form, and does the same for the
operations coordinator. Two minutes from parking lot to fully registered,
associated, and accessible to his whole team.

Back at the office, a colleague asks who to call at the new client. Carlos
says: "Search Construcciones del Valle — it's already there."

**This journey reveals requirements for:**
- New client creation form: minimal required fields, fast to complete
- New contact creation with client association at creation time
- Association link available inline during contact creation
- Mobile-friendly responsive layout

### Journey 3: Marcela — Bringing Order to Chaos

It's Monday morning and Marcela has 20 minutes before her team standup. She
opens the client list and immediately spots what she's been dreading: two
entries for the same company — "Textiles Ramírez" and "Textiles Ramirez S.A."
— created by two different vendors who didn't search before adding.

She opens both records side by side (two tabs). One has three contacts, the
other has one. She edits the correct record to add the missing contact,
associates it to the right client, then deletes the duplicate. The whole
team's records are now clean, and she didn't have to send a single message
asking anyone to fix their own entries.

Ten minutes later she's reviewing contacts without an associated client —
a list she can now actually see. She finds two contacts that belong to existing
clients and links them properly. By the time standup begins, the data is
consistent.

The moment that matters most to Marcela: she makes a change, refreshes the
app on her phone, and the change is there. Not "I'll update the Excel and send
the link." Just: it's done, it's live, everyone sees it.

**This journey reveals requirements for:**
- Full client list view with search and browse capability
- Edit and delete operations on both clients and contacts
- Contact list view with ability to filter unassociated contacts
- Real-time data consistency (no local state, server-driven)
- Associate/disassociate contact from client without losing context

### Journey 4: Diego — The Decision He Has to Make

Diego doesn't use the system himself. But three weeks after rollout, he asks
Marcela how it's going. She pulls up the client list — 87 clients, all with
at least one contact linked. "Zero duplicates," she says. "And I haven't
touched the Excel in two weeks."

He asks Carlos the same question during a 1:1. Carlos shows him on his phone:
he searches a client name, taps once, and has the full contact list in front
of him. "I used to ask Marcela for this every other day," Carlos says. "Now
I don't."

Diego doesn't need a dashboard or a report. He needs to see that the system
works without him having to manage it. What he observes is: the team adopted
it, data is clean, and no one is complaining. That's his success signal. He
approves continued use and mentions it in the next all-hands as an example of
a tool that actually works.

**This journey reveals requirements for:**
- Zero-friction adoption: the system must work without training or onboarding
  documentation for Carlos-level users
- Admin capabilities sufficient for Marcela to maintain data independently
- No administrative overhead requiring Diego's involvement

### Journey Requirements Summary

| Capability Area | Required By | Priority |
|---|---|---|
| Client search with real-time filtering | Journey 1, 2 | MVP |
| Client detail with inline contact list | Journey 1 | MVP |
| Contact detail with client back-link | Journey 1 | MVP |
| New client creation (minimal fields) | Journey 2 | MVP |
| New contact with client association | Journey 2 | MVP |
| Full client list with browse | Journey 3 | MVP |
| Edit and delete clients and contacts | Journey 3 | MVP |
| Unassociated contact visibility | Journey 3 | MVP |
| Associate/disassociate without context loss | Journey 3 | MVP |
| Real-time data consistency | Journey 3 | MVP |
| Zero-friction adoption (no training needed) | Journey 4 | MVP |
