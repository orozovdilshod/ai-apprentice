# AI Apprentice

> AI Apprentice captures how senior experts make decisions, extracts grounded tacit knowledge, and turns it into interactive voice training for new hires.

---

## Problem

In every high-performing organization, critical business operations depend on senior experts who possess years of accumulated intuition—undocumented heuristics, edge-case reflexes, and diagnostic shortcuts that cannot be found in static SOPs or employee handbooks.

When these experienced specialists change roles, transfer teams, or leave the company, their decision-making instincts vanish with them. Organizations face:
- **Severe Knowledge Loss**: Tribal operational wisdom walks out the door.
- **Prolonged Onboarding Cycles**: New hires spend months shadowing seniors without understanding the unwritten reasoning behind high-stakes decisions.
- **Costly Operational Mistakes**: Junior operators misdiagnose system anomalies, trigger false alarms, or prematurely escalate incidents because standard documentation fails to explain *why* an expert would bypass standard protocol in critical moments.

---

## Solution

AI Apprentice acts as an intelligent shadow partner that observes expert workflows in real time, elicits tacit heuristics, and compiles verified decision maps into interactive voice drills for apprentices:

$$\text{Observe} \longrightarrow \text{Detect Decision} \longrightarrow \text{Ask Why} \longrightarrow \text{Capture Knowledge} \longrightarrow \text{Work Map} \longrightarrow \text{Train}$$

1. **Observe**: Silently monitors tools, event streams, and spoken expert commentary.
2. **Detect Decision**: Identifies operational inflection points where an expert departs from baseline routine.
3. **Ask Why**: Asks a targeted, timely probe question to elicit the tacit mental model behind the action.
4. **Capture Knowledge**: Structures the expert's response into verified heuristics (rules, exceptions, guardrails).
5. **Work Map**: Compiles the elicited logic into a visual, evidence-grounded decision workflow.
6. **Train**: Converts captured knowledge into voice-interactive simulators where new hires practice real-world scenarios with live AI feedback.

---

## Core Features

- **Passive Expert Observation**: Streams live tool actions, system events, and expert commentary without disrupting the specialist's flow.
- **AI Decision-Point Detection**: Evaluates operational context in real time to flag anomalous actions and high-leverage decision moments.
- **Targeted "Why" Questions**: Automatically synthesizes contextual, non-intrusive probe questions to draw out unstated professional intuition.
- **ElevenLabs Voice Interaction**: Generates realistic, natural spoken audio for the AI observer and Voice Tutor using ElevenLabs Text-to-Speech (TTS).
- **Expert Speech-to-Text**: Transcribes spoken answers from experts and trainees with high precision using ElevenLabs `scribe_v2` speech recognition.
- **Grounded Claude Knowledge Extraction**: Leverages Anthropic Claude (`claude-sonnet-5-5`) to extract explicit rules, operational guardrails, and handled exceptions directly from verbatim statements.
- **Decision X-Ray**: Interactive inspector providing verbatim grounded citations, operational rationale ("Why It Matters"), confidence metrics, and clear source classifications.
- **Expert Work Map**: Full-width interactive decision canvas (with 28px coordinate grid texture, semantic left accent strips, and SVG branch connectors) visualizing hierarchical judgment paths.
- **New Hire Voice Training**: Immersive voice studio where trainees practice critical decisions via microphone orb interaction, real-time waveform visualization, and progressive multi-drill scenarios.
- **AI Evaluation & Voice Feedback**: Evaluates trainee answers with strict grounding against the expert's captured rule, scores adherence, identifies knowledge gaps, and speaks personalized voice feedback.

---

## Product Flow

The application demonstrates a complete, grounded operational scenario centered around **Sarah Chen**, Senior Data Analyst:

1. **Routine Monitoring (`/observe`)**:
   Sarah opens the Executive Revenue Dashboard in Looker and notices an unexpected **18% revenue drop** week-over-week in EMEA. Rather than calling sales or alerting leadership, she immediately opens Snowflake to inspect raw ledger events.
2. **Decision Detection & Probe**:
   The AI observer flags the abrupt switch from dashboard viewing to raw SQL verification as a critical decision point. It poses a targeted inquiry:
   *“Why did you query raw transaction events instead of escalating the headline revenue drop?”*
3. **Voice Response & Extraction**:
   Sarah responds by voice:
   *“Whenever variance exceeds 10%, we always inspect raw transaction events before raising any alert.”*
   Claude processes the response, identifies that the rule contains a strict threshold (`>10%`) and guardrail (`inspect before alerting`), and records verbatim evidence.
4. **Compiled Architecture (`/work-map`)**:
   The extracted heuristic instantly updates the Work Map. The Decision Canvas marks the branch as `✨ NEW`, mapping normal reconciliation (`≤10%`) against critical ledger verification (`>10%`), followed by ETL lag vs. business churn diagnosis.
5. **Voice Training Studio (`/train`)**:
   A new hire enters voice practice. The Voice Simulator tests whether the trainee has internalized the expert rule across 3 progressive drills:
   - *Drill 1 (18% drop)*: Trainee verifies raw ledger events before alerting.
   - *Drill 2 (3% variance)*: Trainee identifies that 3% does not meet the 10% condition, avoiding wasted database audits.
   - *Drill 3 (14% drop under manager escalation pressure)*: Trainee adheres to the expert guardrail despite organizational pressure.
6. **Instant Evaluation & Voice Tutor Feedback**:
   Claude grades the trainee's answer against the captured rule, assigns an adherence score, and ElevenLabs delivers spoken coaching in Sarah Chen's voice.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components & Dynamic API Routes)
- **UI Library**: [React 18](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type checking)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom Slate/Obsidian design system with coordinate grid textures)
- **LLM Reasoning & Evaluation**: [Anthropic Claude](https://www.anthropic.com/) (`claude-sonnet-5-5`) via Anthropic Messages API
- **Voice Synthesis & Transcription**: [ElevenLabs](https://elevenlabs.io/) (Text-to-Speech API & `scribe_v2` Speech-to-Text)
- **Deployment & Hosting**: [Vercel](https://vercel.com/)

---

## AI Grounding

A fundamental principle of AI Apprentice is **zero-hallucination operational fidelity**:

- **Strict Verbatim Evidence**: Extracted rules, guardrails, and exceptions are permanently coupled to the exact sentence spoken by the senior expert during observation.
- **Source Classification Badges**:
  - `EXPLICIT`: Directly articulated by the expert in recording or probe response.
  - `INFERRED`: Grounded operational deduction based on observed tool actions.
  - `UNKNOWN`: Not stated by the expert. Unsupported assumptions are explicitly marked `UNKNOWN` rather than invented.
- **Grounded Evaluation Criteria**: Trainee responses are evaluated strictly against what the expert actually stated—preventing generic corporate boilerplate or unverified rules from contaminating training feedback.

---

## Live Demo & Routes

- **Live Production URL**: [https://ai-apprentice-d7zwlppwr-heal-code.vercel.app/](https://ai-apprentice-d7zwlppwr-heal-code.vercel.app/)

### Main Application Routes:
- `/`: **Product Dashboard & Architecture Hub** — Live metric highlights, end-to-end pipeline overview, and quick navigation.
- `/observe`: **Expert Observation Studio** — Simulated dual-screen workstation (Looker & Snowflake), live transcript stream, and voice inquiry studio.
- `/work-map`: **Expert Work Map & Decision Canvas** — Full-width interactive coordinate grid canvas, branching connectors, and the Decision X-Ray inspector drawer.
- `/train`: **New Hire Voice Training Studio** — Progressive 3-drill voice simulator with microphone recording, waveform visualizer, Claude evaluation, and ElevenLabs Voice Tutor.

---

## 60-Second Hackathon Demo Flow

1. **Start Observation (`/observe`)**: Click **"Start Live Simulation"** to watch Sarah Chen's workflow unfold across Looker and Snowflake.
2. **AI Detects Anomaly**: At step 2, the system notices an 18% revenue drop; at step 3, Sarah opens raw SQL. The AI observer detects a critical decision point.
3. **AI Asks Why**: The AI synthesizes a probe question: *“Why did you query raw transaction events instead of escalating?”*
4. **Expert Answers by Voice**: Click **"Answer Probe via Voice"** to simulate Sarah Chen speaking her unwritten rule, or use the microphone to record your own answer.
5. **Claude Extracts Rule**: Claude analyzes the speech and extracts the explicit 10% threshold rule and verification guardrail.
6. **Work Map Updates (`/work-map`)**: Navigate to the Work Map. Notice the **`✨ NEW`** badge on the `Variance > 10%` node. Click it to open the **Decision X-Ray** and view the exact verbatim quote.
7. **New Hire Voice Drill (`/train`)**: Open Voice Training. Review the scenario and click **Record Answer** (or use the one-click demo fill) to answer: *“I would verify raw transaction events first because variance exceeds 10%.”*
8. **AI Evaluates & Coaches**: Click **Analyze / Submit Answer**. Claude scores the response (`97/100`), validates rule compliance, and the ElevenLabs Voice Tutor speaks personalized audio coaching.

---

## Environment Variables

Configure the following environment variables in your local `.env.local` or Vercel dashboard:

| Variable Name | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key for Claude decision detection and trainee evaluation. |
| `ANTHROPIC_MODEL` | *(Optional)* Model identifier. Defaults to `claude-sonnet-5-5`. |
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key for Text-to-Speech synthesis and Speech-to-Text transcription. |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID used for the AI observer and Voice Tutor. |

> **Security Note**: Never commit API keys or secret credentials to version control. Keep `.env.local` strictly excluded.

---

## Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/orozovdilshod/ai-apprentice.git
cd ai-apprentice
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a local `.env.local` file:
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-sonnet-5-5
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Lint the Codebase
```bash
npm run lint
```

### 6. Build for Production
```bash
npm run build
```

---

## Security

- **Server-Side API Invocations**: All calls to Anthropic Claude and ElevenLabs are mediated through Next.js server-side Route Handlers (`/api/*`). API keys are never leaked to client bundles or browser consoles.
- **Git Exclusions**: `.env.local`, `.env*.local`, node modules, and local development artifacts are strictly ignored in `.gitignore`.
- **Safe Error Reporting**: API failure handlers redact sensitive error attributes to ensure credentials are never exposed in log outputs.
