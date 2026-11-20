import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate_json } from "./mock_schema";

const USER_ID = "canvas-student.json"

/*************************************************************************************************** */
// Load .env file

// Find the directory containing this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const BASE_DIR = path.resolve(__dirname, "..");
dotenv.config({path: BASE_DIR.toString() + "/.env"});

const CANVAS_URL = process.env.CANVAS_URL;
const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;

if (CANVAS_URL === undefined) {
    console.error("[ERROR]: Canvas URL is undefined");
    process.exit(-1);
}
if (CANVAS_API_TOKEN === undefined) {
    console.error("[ERROR]: Canvas API Token is undefined");
    process.exit(-1);
}

/*************************************************************************************************** */
// Interfaces and schemas

// Type for loading coarses from Canvas API
interface Course {
    id: number;
    name: string;
    course_code: string;
}

// Type for loading todo tasks from Canvas API
interface TodoItem {
    type: string;
    context_name: string;
    assignment?: {
        id: number;
        name: string;
        created_at: string;
        due_at: string | null;
        html_url: string;
        is_quiz_assignment: boolean;
    };
}

// Type for storing a task as JSON from Canvas API
interface TaskJSON {
    id: string,
    userId: string,
    title: string,
    description: string | null,
    course: string | null,
    dueAt: string,
    estimatedMinutes: number | null,
    splittable: boolean,
    minSessionMinutes: number | null,
    priority: number | null,
    status: string,
    source: "synthetic",
    createdAt: string
}

interface PreferencesJSON {
    "userId": string,
    "timezone": string,
    "dayStart": string,
    "dayEnd": string,
    "bufferMinutes": number,
    "maxSessionMinutes": number
}

interface ClassMeetingJSON {
    id: string,
    userId: string,
    name: string,
    location: string | null,
    days: string[],
    startTime: string,
    endTime: string,
    termStart: string,
    termEnd: string,
}

interface CommitmentJSON {
    id: string,
    userId: string,
    title: string,
    kind: string,
    startAt: string,
    endAt: string,
}

interface StudentJSON {
    studentId: string,
    preferences: PreferencesJSON,
    tasks: TaskJSON[],
    classMeetings: ClassMeetingJSON[],
    commitments: CommitmentJSON[],
}


/*************************************************************************************************** */
// Functions to convert Canvas todos into JSON
async function canvas_request<T>(path: string): Promise<T> {
    const response = await fetch(`${CANVAS_URL}/api/v1/${path}`, {
        headers: {
            Authorization: `Bearer ${CANVAS_API_TOKEN}`,
            "Content-Type": "application/json"
        },
    });

    if (!response.ok) {
        console.error("[ERROR]: Canvas API Error");
        console.error(response);
        throw new Error(
            `Canvas API Error: ${response.status} ${response.statusText}`
        );
    }
    canvas_request<Course[]>("courses");

    return response.json() as Promise<T>;
}

function todos_to_json_task(todos: TodoItem[]): TaskJSON[] {
    let todos_json: TaskJSON[] = [];
    let todo_count = 0;
    for (const todo of todos) {
        if (todo.assignment === undefined) {
            console.error("[WARN]: todo for " + todo.context_name + " is not associated with an assignment.");
            continue;
        }
        if (todo.assignment?.due_at === null) {
            console.error("[WARN]: todo " + todo.assignment?.name + " does not have a due date.");
            continue;
        }

        let todo_json: TaskJSON = {
            id: USER_ID + "_task_" + todo_count,
            userId: USER_ID,
            title: todo.assignment?.name,
            description: null,
            course: todo.context_name,
            dueAt: todo.assignment?.due_at,
            estimatedMinutes: null,
            splittable: !todo.assignment?.is_quiz_assignment,
            minSessionMinutes: null,
            priority: null,
            status: "todo",
            source: "synthetic", 
            createdAt: todo.assignment?.created_at,
        }
        todos_json.push(todo_json);
        todo_count++;
    }

    return todos_json;
}


function create_class_meetings() {
    const machine_learning: ClassMeetingJSON = {
        id: "Machine Learning",
        userId: USER_ID,
        name: "Machine Learning",
        location: null,
        days: ["tue", "thu"],
        startTime: "11:00",
        endTime: "12:15",
        termStart: "2026-08-24",
        termEnd: "2026-12-11"
    }
    const os: ClassMeetingJSON = {
        id: "Operating Systems",
        userId: USER_ID,
        name: "Operating Systems",
        location: null,
        days: ["tue", "thu"],
        startTime: "14:00",
        endTime: "15:15",
        termStart: "2026-08-24",
        termEnd: "2026-12-11"
    }
    const networks: ClassMeetingJSON = {
        id: "Computer Networks I",
        userId: USER_ID,
        name: "Computer Networks I",
        location: null,
        days: ["tue", "thu"],
        startTime: "08:00",
        endTime: "09:15",
        termStart: "2026-08-24",
        termEnd: "2026-12-11"
    }
    const graphics: ClassMeetingJSON = {
        id: "Computer Graphics",
        userId: USER_ID,
        name: "Computer Graphics",
        location: null,
        days: ["mon", "wed", "fri"],
        startTime: "13:00",
        endTime: "13:50",
        termStart: "2026-08-24",
        termEnd: "2026-12-11"
    }
    const late: ClassMeetingJSON = {
        id: "Literature and the Environment",
        userId: USER_ID,
        name: "Literature and the Environment",
        location: null,
        days: ["mon", "wed", "fri"],
        startTime: "10:00",
        endTime: "10:50",
        termStart: "2026-08-24",
        termEnd: "2026-12-11"
    }
    let class_meetings: ClassMeetingJSON[] = [
        machine_learning,
        os,
        networks,
        graphics,
        late
    ]

    return class_meetings
}

function create_commitments(): CommitmentJSON[] {
    let commitment: CommitmentJSON = {
        id: "Tennis",
        userId: USER_ID,
        title: "Tennis",
        kind: "personal",
        startAt: "2026-11-19T16:00:00-07:00",
        endAt: "2026-11-19T17:30:00-07:00"
    }
    let commitments: CommitmentJSON[] = [commitment];
    return commitments;
}


async function main() {
    // Test AI generated samples
    const ai_student_mock1 = JSON.parse(fs.readFileSync('./eval/fixtures/students/student-01.json','utf8')); 
    console.log("AI Generated JSON 1 result: " + validate_json(ai_student_mock1));

    const ai_student_mock2 = JSON.parse(fs.readFileSync('./eval/fixtures/students/student-02.json','utf8')); 
    console.log("AI Generated JSON 2 result: " + validate_json(ai_student_mock2));

    const ai_student_mock3 = JSON.parse(fs.readFileSync('./eval/fixtures/students/student-03.json','utf8')); 
    console.log("AI Generated JSON 2 result: " + validate_json(ai_student_mock3));

    // Get todos
    let todos: TodoItem[];
    try {
        todos = await canvas_request<TodoItem[]>("users/self/todo");
    } catch (err) {
        console.error(err);
        process.exit(-1);
    }
    
    // Loop through every todo and convert to Schema compatible format
    let task_json = todos_to_json_task(todos);
    if (task_json.length == 0) {
        console.error("[ERROR]: No todos found");
        process.exit(-1);
    }

    // Create fake class meetings
    let class_meet_json = create_class_meetings();

    // Create fake commitment
    let commitments_json = create_commitments();

    // Create fake preferences
    let preferences: PreferencesJSON = {
        userId: USER_ID,
        timezone: "America/Denver",
        dayStart: "08:00",
        dayEnd: "23:59",
        bufferMinutes: 15,
        maxSessionMinutes: 90
    };

    // Write to JSON
    let student_json: StudentJSON = {
        studentId: USER_ID,
        preferences: preferences,
        tasks: task_json,
        classMeetings: class_meet_json,
        commitments: commitments_json
    }
    await fs.promises.writeFile(
        "./eval/fixtures/students/canvas_student.json",
        JSON.stringify(student_json, null, 2),
        "utf-8"
    );

    // Evaluate canvas JSON with schema
    const canvas_mock = JSON.parse(fs.readFileSync('./eval/fixtures/students/canvas_student.json','utf8')); 
    console.log("Canvas Generated JSON result: " + validate_json(canvas_mock));

    process.exit(0);
}


main();