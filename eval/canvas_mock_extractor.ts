import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

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