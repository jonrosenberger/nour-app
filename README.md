# Nour
> Healing Has Curves. Follow trends, not moments.

Nour is a local-first mood and wellbeing tracking app focused on privacy, emotional nuance, and long-term trends instead of daily judgment.

The project was created in response to common frustrations with modern mental health and wellness apps: many feel overly clinical, overly gamified, invasive, subscription-driven, or designed around engagement loops rather than reflection.

Nour is designed to feel calm, observational, and human.

<img width="1110" height="693" alt="Nour Screenshot" src="https://github.com/user-attachments/assets/465b9397-e478-4d50-8281-f138e597b172" />

---

## Version

Current prototype: v0.4.2 — Mobile Stabilization

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
- AI emotional interpretation
- "Wellness streak" pressure
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
- Self-talk

Additional categories are planned as optional future toggles.

<img width="832" height="697" alt="Check In Screenshot" src="https://github.com/user-attachments/assets/776d7fae-59bc-44cd-9c87-0189b3d70344" />

---

### Trend-Based Visualization

Instead of focusing on single entries, Nour emphasizes patterns over time through:

- moving averages
- trend lines
- long-term emotional visualization

<img width="1099" height="703" alt="Trend Screenshot" src="https://github.com/user-attachments/assets/d7fd8302-5eb2-4817-96cb-52288bbf0dd2" />

The goal is to reduce emotional overreaction to isolated difficult days.

---

### Local-First Storage

All user data is currently stored locally on-device.

No accounts.  
No cloud sync.  
No data harvesting.

Users remain in control of their information.

---

### Therapist-Friendly Export

Nour supports optional reflection and discussion with therapists or trusted support systems through clean printable exports.

Exports focus on:

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

- low-friction check-ins
- intentionally optional skips
- simple visual hierarchy
- reduced cognitive overload
- mobile-first usability
- accessibility-conscious interaction design
- minimal emotional pressure

---

## Why This Project Exists

Many existing mental health apps optimize for retention, monetization, or "daily streak" engagement. This can quickly create emotional pressure, distrust, and burnout.

Nour is being built specifically to avoid those pressures and instead provide a calm tool for observing emotional trends over time.

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
- Lucide React (icons)

---

## Running Locally

```bash
npm install
npm run dev
```