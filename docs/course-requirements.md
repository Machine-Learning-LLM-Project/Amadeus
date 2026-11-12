# Course requirements: LLM application project

> Source: course project description, copied for reference on 2026-11-12. If this file and the course page disagree, the course page wins.
> For how *our team* meets these requirements, see [team-plan.md](team-plan.md).

## Project description

This semester, you will engage in an advanced exploration of artificial intelligence by developing an application powered by a large language model (LLM). You will design, build, evaluate, and present a novel AI-driven tool that addresses a real problem or demonstrates creative potential.

A strong LLM application today is more than a chat window around a model. Current models need little prompt engineering, so put your effort into the system around the model: grounding it in data, connecting it to tools, adding guardrails, and measuring it with a test set.

## Objective

Your goal is to conceive and implement an original application utilizing a large language model. Whether your focus is productivity, education, communication, engineering and science, or innovation, you should define a clear problem or opportunity and deliver a working solution that demonstrates both technical and conceptual merit.

The LLM must do real work inside your application (for example extracting, classifying, retrieving, planning, or taking actions), not only help you write code. You must also show evidence that your application works, using a test set and a baseline comparison.

## Deliverables at a glance

| # | Deliverable | Points | Due |
| --- | --- | --- | --- |
| 1 | Group Formation | 10 | Fri, Oct 9 |
| 2 | Project Proposal | 40 | Fri, Oct 23 |
| 3 | Demonstration Video | 50 | Wed, Dec 2 |
| 4 | Final Presentation | 100 | In class: Thu, Dec 3 & Tue, Dec 8 |
| 5 | Peer Evaluation | 50 | End of semester |
| | **Total** | **250** | |

## Minimum technical requirements

Every team's project must include:

- [ ] **User interface:** a working interface that someone outside your team can use (for example Gradio, Streamlit, or a web app).
- [ ] **Structured output:** at least one schema-validated output (for example a Pydantic model) that your program logic uses.
- [ ] **Test set:** at least 20 test cases with expected outcomes, at least one automated metric, and one baseline comparison (for example with and without retrieval, or a smaller versus a larger model from the course demo notebook).
- [ ] **Guardrails:** input and output checks, plus at least one prompt-injection case in your test set.
- [ ] **Usage log:** a record of tokens, latency, and cost for every model call, summarized in your final presentation.

## API access and keys

The course provides OpenAI API access. After group formation, the instructor will privately send each team an API key for that team's own OpenAI project. The course pays for its usage, and each team's project has a spending limit.

- With the course key, use the default models from the course demo notebook. Larger or more expensive models, and image or video generation, need instructor approval first. (Our allowed models are listed in [api-access.md](api-access.md).)
- You may use another provider instead (for example a free tier such as Google AI Studio or Groq, or a local open-weight model) as long as no one has to pay. Free tiers may use your prompts for training.
- Keep costs low: try a few examples before running your full test set, and cache responses while developing.

Rules for your API key:

- Use it only for this course project, and share it only within your team.
- Store it in a `.env` file and add `.env` to `.gitignore`.
- Never commit it, paste it into public places or chat tools, or show it in your video.
- If a key leaks, tell the instructor immediately so it can be revoked.
- All keys are revoked after the final presentations.

## Data rules

- Use only public or synthetic data.
- Do not send personal information, FERPA-protected records, information that could identify a classmate, or proprietary or confidential data (for example from an internship, employer, or sponsored research) to any model API.
- The OpenAI API does not train on API data by default, but treat everything you send to any provider as potentially stored.
- Follow your provider's usage policies, such as the OpenAI usage policies. For example, no tailored legal or medical advice to real people, and no automated high-stakes decisions about people (such as hiring or credit) without human review.
- Keep any deployed app private to the class or behind a temporary share link, so strangers cannot spend your budget.

## AI coding assistants

You may use AI coding assistants (for example GitHub Copilot, Claude Code, Codex, or Cursor) for any part of this project. Disclose how you used them in your proposal, README, and final presentation: which tools, for which parts, and how you checked the output.

Every team member is responsible for all the code and must be able to explain any part of it during the presentation Q&A.

## Team repository

Create one GitHub repository per team (private is fine) and share it with the instructor at group formation. Your README must include:

- [ ] Setup instructions, with a `.env.example` file (never a real `.env`)
- [ ] How to run the app and reproduce your evaluation
- [ ] Models and providers used, and a usage and cost summary
- [ ] Your AI-use disclosure

## Deliverables and evaluation

### 1. Group Formation (10 points, due Fri, Oct 9)

Form a group of 3–5 members to complete this project. Submit your team name, the member list, each member's role (for example product lead, LLM integration, data and retrieval, evaluation, user interface), and your repository link.

### 2. Project Proposal (40 points, due Fri, Oct 23)

Your proposal should articulate your project's scope and direction. It must include:

- A clear description of the application's purpose and intended users
- The core problem or gap your application addresses
- A discussion of related work and what distinguishes your approach
- Technical plan: architecture (with a diagram), provider, chosen advanced components, data sources, output schemas and tools, and how you will integrate the large language model
- Evaluation plan: your first 10 test cases, your metric, and your baseline
- Risk, cost, and responsible-AI plan: expected usage and cost, confirmation that you will use only public or synthetic data, and your main risks and guardrails
- Project timeline with key milestones and assigned responsibilities
- AI-use disclosure (required, not scored)

Submit as a PDF, up to 5 pages. This is a group submission. Our submitted proposal is in [proposal.md](proposal.md).

#### Proposal grading criteria (40 points)

| Criterion | Points | What to include |
| --- | --- | --- |
| Title Page | 3 | Project name, team name, member list, repository link |
| Introduction | 15 | Objectives, significance, related work, innovation |
| Technical Design | 12 | Architecture, provider, chosen advanced components, data, schemas and tools, integration of a large language model |
| Evaluation and Responsible-AI Plan | 5 | Test cases, metric, baseline, cost plan, data handling, risks and guardrails |
| Timeline & Roles | 5 | Milestones and assignment of responsibilities |
| **Total** | **40** | |

### 3. Demonstration Video (50 points, due Wed, Dec 2)

Produce a short but comprehensive video (3–5 minutes, with captions) showing your application in action. Highlight:

- [ ] The user interface and workflow
- [ ] Key features and functionalities
- [ ] Realistic use cases and impact
- [ ] Unique or novel aspects of your solution
- [ ] Your evaluation results, and one failure case with how your system handles it

The video should be clear, well-structured, and professional. Submit it together with a link to the final commit of your repository. Make sure no API key or personal data appears on screen.

### 4. Final Presentation (100 points, in class Thu, Dec 3 & Tue, Dec 8)

Deliver a formal presentation covering:

- [ ] The initial concept and evolution of your idea
- [ ] Architecture, design decisions (including why you chose a fixed workflow or an agent), and implementation challenges
- [ ] Testing and validation: your test set, metrics, baseline comparison, error analysis, and usage (tokens and cost), plus user feedback if applicable
- [ ] Responsible AI: risks, guardrails, and data handling
- [ ] Lessons learned and future directions

The presentation should be coherent, visually polished, and engaging. A live Q&A with the whole team follows. Bring a recorded demo as a fallback in case the API is slow or unavailable.

### 5. Peer Evaluation (50 points)

At semester's end, group members will evaluate each other for their group performance. You will rate each teammate on five dimensions: contributing to the team's work, interacting with teammates, keeping the team on track, expecting quality, and having relevant knowledge and skills.
