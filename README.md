# Nour

> Healing Has Curves. Follow trends, not moments.

Nour is a local-first mood and wellbeing tracking app focused on privacy, emotional nuance, and long-term trends instead of daily judgment.

The project was created in response to common frustrations with modern mental health and wellness apps: many feel overly clinical, overly gamified, invasive, subscription-driven, or designed around engagement loops rather than reflection.

Nour is designed to feel calm, observational, and human.

<img width="1110" height="693" alt="Screenshot 2026-05-13 at 11 17 31 AM" src="https://github.com/user-attachments/assets/465b9397-e478-4d50-8281-f138e597b172" />


---

## Core Philosophy

Nour is built around a few guiding principles:

- Privacy by default, not a premium feature
- Emotional states should not be moralized or scored
- Trends over time matter more than isolated good or bad days
- Users define their own emotional baseline
- Mental health tools should avoid addiction mechanics

The app intentionally avoids:
- AI-generated diagnoses
- “Wellness streak” pressure
- Emotional ranking systems
- Manipulative engagement loops
- Advertising and surveillance models

---

## Current Features

### Daily Check-Ins
Users record subjective emotional and behavioral data through a lightweight daily flow.

Current tracking categories include:
- Mood baseline
- Energy
- Sleep

<img width="832" height="697" alt="Screenshot 2026-05-13 at 11 20 24 AM" src="https://github.com/user-attachments/assets/776d7fae-59bc-44cd-9c87-0189b3d70344" />


Additional categories are planned as optional future toggles.

---

### Trend-Based Visualization
Instead of focusing on single entries, Nour emphasizes patterns over time through:
- moving averages
- trend lines
- long-term emotional visualization

<img width="1099" height="703" alt="Screenshot 2026-05-13 at 11 21 50 AM" src="https://github.com/user-attachments/assets/d7fd8302-5eb2-4817-96cb-52288bbf0dd2" />


The goal is to reduce emotional overreaction to isolated difficult days.

---

### Local-First Storage
All user data is stored locally on-device in the current prototype.

No accounts.
No cloud sync.
No data harvesting.

Users remain in control of their information.

---

### Therapist-Friendly Export
Nour is designed to support optional reflection and discussion with therapists or trusted support systems.

Planned exports focus on:
- visual trends
- optional notes
- non-interpretive summaries

The app intentionally avoids diagnostic conclusions or automated emotional analysis.

---

## Design Goals

Nour is intentionally designed to feel:
- calm
- lightweight
- reflective
- emotionally nonjudgmental

UX priorities include:
- low-friction check-ins with intentionally optional skips
- simple visual hierarchy
- reduced cognitive overload
- accessibility-focused interaction design
- minimal emotional pressure

---

## Why This Project Exists

Many existing mental health apps optimize for retention, monetization, or “daily streak” engagement. This can quickly cause mental strain and distrust. 

Nour is built specifically to avoid these pressures and focus on a non-judgemental tool to help the users track their trends and changes in mood over time. 

The project is also an exploration of:
- ethical product design
- AI-assisted development workflows
- local-first application architecture
- emotionally sensitive UX systems

---

## Tech Stack

Current prototype stack:
- React
- Vite
- Recharts
- Framer Motion

Additional architecture decisions are being documented as the project evolves.

---

## Running Locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in terminal.

---

## Requirements

- Node.js 20+
- npm

## Current Status

The core check-in flow, local storage system, and trend visualization are currently functional in the prototype.

Current development priorities include:
- mobile responsiveness
- export systems
- accessibility improvements
- onboarding flow
- interaction refinement

---

## Key Design Decisions

### Local-first architecture
User emotional data remains on-device by default.

### No streak mechanics
The app intentionally avoids engagement systems that create guilt or pressure around missed days.

### Subjective baseline tracking
Nour avoids universal emotional scoring and instead encourages users to track changes relative to their own lived experience.

### Trend-focused visualization
The app emphasizes long-term patterns over isolated difficult days.

## Roadmap Highlights

Planned future exploration includes:
- customizable tracking categories
- optional journaling
- advanced exports
- theme support
- improved data visualization
- therapist collaboration workflows
- habit formation research
- accessibility edge cases

The project remains intentionally cautious about introducing features that could compromise simplicity, privacy, or emotional safety.

---

## Development Philosophy

I come from a customer support and operations background rather than a traditional software engineering one. Building Nour has been a way to push my own boundaries while also finding out what's actually possible when someone with that kind of background can build and iterate on software directly using AI as a development partner.

A lot of the value I bring to the project comes from things I already spent years doing professionally:
- understanding where users get frustrated
- identifying friction before it becomes a problem
- thinking through edge cases and future scalability
- designing around blockers that stop people from actually using a tool consistently
- balancing feature ideas against complexity and usability

AI dramatically speeds up implementation and iteration. The direction of the product still comes from human judgment, lived experience, and constant review.

For example:
- local-first storage was a deliberate privacy decision
- the app intentionally avoids streak mechanics and engagement pressure
- the check-in flow is designed to minimize emotional friction and cognitive overload
- trend visualization is prioritized over isolated bad days to reduce emotional overreaction

The workflow itself is highly iterative:
identify a problem, define constraints, prototype quickly, review critically, refine, and repeat.

AI is very good at accelerating the build process. My role is making sure the end result actually feels thoughtful, sustainable, and usable by real people.

Nour is both a product and an ongoing exploration of what AI-assisted development can look like when guided by strong human direction rather than pure automation.
---

## License

Project currently under active personal development.
License and future distribution model are still being evaluated.
