# Project proposal (as submitted)

> Source: our submitted proposal (due Fri, Oct 23), copied for reference on 2026-11-12. The text is kept as submitted.
>
> **Superseded by [team-plan.md](team-plan.md) where they differ.** In particular:
> - **Scope:** the build focuses on tasks, classes, schedule (accept/reject), and the morning brief. The daily summary, Canvas sync, weather, and push notifications are stretch goals at most.
> - **Evaluation:** the baseline is now *the LLM writes the whole schedule in one step, with no scheduler code and no checker*. The main metric is *% of schedules with zero rule breaks*, and the second is *valid structured output rate*.
> - **Test cases:** the push-notification test is dropped. The 20 cases must be updated to the new scope and include at least 2 prompt-injection cases.
> - **Budget:** the app blocks calls at $8/month of logged spend, and mock mode is the default.

## Description

For our LLM project, we propose to create a scheduling/task planning app powered by an LLM. This app will be specifically designed for college students who need to balance their coursework, class schedules, extracurriculars, and personal goals, such as physical and mental health or social time. It will help students reduce the mental effort of figuring out their daily and weekly priorities by suggesting a plan based on their responsibilities and availability. Our proposed core features are suggested amounts of time to spend on tasks, blocking out work sessions around classes and other commitments, and suggested adjustments when deadlines or plans change. The app will also have a customizable morning brief to summarize a student's daily priorities, upcoming deadlines, and other selected information.

In this project, the LLM will interpret a student's goals and task descriptions, recommend priorities, and explain scheduling suggestions in natural language. Students will be able to change, reject, or accept these suggestions, allowing them to maintain control over their schedules.

## Core problem / gap

College students spend considerable effort deciding how to divide their time between assignments, classes, and personal obligations. Knowing the deadline for a project or assignment is helpful, but it does not necessarily tell a student when to start, how much time to set aside, or how to balance it with other coursework and commitments. A task taking longer than expected or an unexpected commitment can make it even more difficult for a student to manage a busy schedule. Our app will combine task tracking and scheduling in one place, using an LLM to help students organize their responsibilities and create a realistic plan for completing them.

## Related work

With our daily briefing and scheduling/task planning app, we plan to integrate multiple features from other applications into one unified experience with LLMs.

Numerous basic calendar and scheduling applications exist, such as the ones preinstalled on smartphones, that send push notifications as reminders. These can be categorized into calendar apps, providing an hour by hour rundown of events, or task tracking apps, providing a list of tasks.

In the realm of schedulers, there are a few apps that combine task scheduling and schedule management with AI/LLMs. Currently, AI chatbots are given access to existing calendar and task tracking apps to provide insights. For example, Google Tasks can be used in conjunction with Google Gemini for task planning and daily briefings. With this approach, the user must utilize three separate apps to create the experience of an LLM assisted scheduler.

### Distinguishing factors

Our app's distinguishing features include integration into student's schedules and assignments and morning daily briefs.

By automatically accessing students' schedules and assignments, the user will no longer manually input these tasks and schedules into the app. On top of this, we can leverage AI suggested task durations to unify both task tracking and calendar functionality into one app that can keep track of both.

The app will also feature an AI powered daily briefing feature with multiple possible integrations such as weather. This briefing can automatically adapt to schedule changes or user goals on a day-by-day basis for a personalized experience when the user starts their day.

## Technical plan

### Architecture

We will build a mobile app frontend to provide the LLM with more context and tools such as location and notifications. We will also build a backend to allow the LLM to do things while the app is closed.

*(Architecture diagram, generated with AI: see the submitted PDF. Not reproduced here.)*

#### Frontend

We will use Expo + React Native + TypeScript to build the mobile app.

- **Expo:** good for both Windows and macOS development environments
- **React Native:** renders natively on iOS, and is cross-platform
- **TypeScript:** JavaScript with static typing

#### Backend

We will use TypeScript + Supabase to build the backend.

- **TypeScript:** frontend already uses TypeScript, types can be shared between ends
- **Supabase:** provides Postgres, sign-in, serverless functions, and scheduled jobs, sufficient free tier

### Running the app

The team has Windows and macOS development environments, and iOS production environments.

#### Development

During development, Windows users can run the app using an Android emulator or a web browser. macOS users can run the app using the iOS simulator, an Android emulator, or a web browser.

#### Production

The team only has iOS phones. There are paid and free ways to run the app. The typical way of doing this would be by publishing the app to TestFlight or the App Store but an Apple Developer Program account is required ($99/yr). Since the team does not have access to an ADP account, free methods will be used such as:

- **Web app added to home screen:** can't access iOS calendar and other system information
- **Expo Go (App Store app):** notifications may not work; other limitations
- **Sideloading:** troublesome to set up, app needs to be refreshed every 7 days. Supported Capabilities lists all the features (entitlements) that are available for free sideloading methods in the Apple Developer column.
- One member has a device slot in an ADP account so they can do this method without most limitations and with most ADP entitlements.

### Advanced components

One of the advanced components will be the **scheduler**. It will find free time around the user's calendar, place tasks before their deadline, split large tasks, add time before and after events, and detect impossible/flawed plans.

Another advanced component will be the **scheduler and LLM loop**, which is where the LLM integration takes place. It will prioritize certain tasks, code will build and check the schedule and send it back if issues are detected, and explain the final plan to the user.

### Data sources

Most of the data that is needed will be provided by the user in the app such as goals, class schedules, etc. The app will also generate data such as time logs or completed tasks. The OpenAI API will be used for the LLM integration, the free Open-Meteo API can be used for weather, and the Canvas API can be used to get assignments and other class information. Students are able to generate Canvas API keys.

### Output schemas

The output schemas will be written in Zod to get both the OpenAI format and TypeScript types from the same code. Suggested schemas:

- For turning user goals into structured goals by generating categories, target dates, and estimated time lengths
- For each task, generating a time estimate, splitting it into multiple sessions, and a prioritization rank
- For schedule adjustments/changes, moving/shortening/splitting/dropping tasks
- For the morning brief containing the most prioritized tasks, scheduling notes/warnings, weather, and notification text
- For the daily summary containing successes, going over unfinished tasks, any patterns found, about tomorrow, and a notification text

## Evaluation plan

We will test our application on synthetic student schedule tasks compared to the expected result. The tasks will be covering overlapping schedules, due date of assignment, estimated time of completion and the overall tasks will be 20. Before we run the tests the expected results will be documented to evaluate how effective the application is performing. The metric for evaluating the test cases will be passing the predetermined requirements for that task. Out of 20 test cases all test cases should pass for the application. For the 20 test cases we will run 2 times to ensure reliability of the evaluation.

To reproduce the scenario from the application, each task will specify the current date, task time, deadlines, and if the task can be split. Expected outcome will specify the requirements for that synthetic student task to be completed rather than exact schedule or order of sub tasks to be accomplished. Because several different outcomes are possible.

### Test cases (first 10, as submitted)

| Test case | Expected outcome | Automated metric | Baseline |
| --- | --- | --- | --- |
| Estimates time of completion | Outputs estimated time of completion of multiple tasks | Output in time format similar to HH:MM | Fixed time for all tasks |
| Accurate time estimates | Completion time estimates are close to real times | N/A | Fixed time for all tasks |
| User disables access to Canvas API | LLM cannot access disabled APIs | Canvas API call rejected | Unrestricted access to all APIs |
| Read task details | LLM correctly reads task details such as deadlines | Structured LLM output matches original task details | Cannot access and read task details |
| LLM user isolation | LLM cannot access other user's data and leak it to a user | Daily briefings do not include task names from other users | No access to any data or APIs |
| Task push notifications *(dropped in team plan)* | Push notifications generated for upcoming deadlines | Push notifications sent 3 hours before deadline + estimated completion time | No push notifications for upcoming tasks |
| Task scheduling + class scheduling | Task scheduling remains reasonable and does not overlap | Scheduling times do not overlap | Class schedules alone without task schedules |
| LLM task selection | Chooses task with nearest deadline to complete first | Chooses task with nearest deadline to complete first | No task selection |
| Reasonable scheduling to prevent burnout | LLM understands breaks, lunch, other activities during scheduling | N/A | Schedule tasks algorithmically, using as much available time as possible |
| Rescheduling after deadline changes | LLM understands updates to schedules to factor into recommendations | N/A | LLM retrieves data once, does not use new data |

## Risks

For the project of creating a task planning application there are main risks associated with building a mobile application.

| # | Risk | Guardrails |
| --- | --- | --- |
| 1 | Incorrect schedules or unrealistic workloads for users of the app | Automatically check for overlaps with tasks, duration of event, deadline and fixed events. Flag tasks with high workloads and have flexible event time duration. |
| 2 | The app can make unwanted schedule changes | Ask for approval for every change and provide features of undo. |
| 3 | Budget limit for API key can be exhausted | Monitor token usage, limit requests with high usage, and retries. |
| 4 | The app can provide inappropriate recommendations | Prioritize user-defined breaks, and tasks. |
| 5 | Data leak of the user | Minimize and redact user information before sending it to the LLM. If possible, encrypt the data. |

## Costs

For the project there is a monthly budget of $10 a month. Our team will use GPT-6 Luna for understanding task requirements, scheduling recommendations, and morning briefs. We estimate there will be around 800 requests per month for development, testing and validation. An average of 2,000 input tokens and 1,000 output tokens per request, according to the OpenAI rate of input token is $0.10 and output token is $0.50 per million each. The estimated monthly text API cost is $0.56.

The estimate excludes text to speech models and additional tool charges. We will verify these assumptions through testing and monitor our usage of tokens. In addition, we will limit request sizes, cache responses, keep track of the budget alerts, during development.

## Responsible-AI plan

We certify that only public or synthetic data, such as fictional student profiles, assignments, calendars, and completion records, will be used for development, testing, and demonstrations. Mock data will be used in place of actual student accounts for Calendar and Canvas integrations. The app will indicate projected task durations, explicitly identify AI-generated recommendations, and provide users the option to accept, modify, or reject suggested schedules.

## Project timeline (as submitted)

- **Project Proposal:** Fri, Oct 23
- **Demonstration Video:** Wed, Dec 2
- **Final Presentation:** in class, Thu, Dec 3 & Tue, Dec 8

Key milestones (superseded by the phases in [team-plan.md](team-plan.md)):

- **KM1: The Foundation and Initial Development (Oct 26 – Nov 8):** Aim to establish the frontend and backend here, configure the database, and implement the initial interface for managing tasks, deadlines, and user availability.
- **KM2: LLM Integration and Core Features (Nov 9 – Nov 22):** Integrate the OpenAI API to support task prioritisation, duration estimates, schedule generation, schedule adjustments, and daily briefs.
- **KM3: Evaluation and Finalisation (Nov 23 – Dec 6):** Evaluate the application against the baseline, address any identified issues, finalise any documentation, and prepare both the demonstration and final presentation. Ideally, the application should be ready by November 29, giving us time to record the demonstration and submit it by December 2.

## AI-use disclosure (as submitted)

**Research and planning:** We used AI tools, ChatGPT and Claude, to research the developmental frameworks, discuss the application's architecture, and generate the architecture diagram.

**Code and development:** AI may be used to assist with writing, debugging, and interpreting any code throughout development. Any AI-generated code will be reviewed and tested by our team to determine any necessary changes.
