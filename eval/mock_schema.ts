import { z } from "zod";
import { ClassMeetingSchema } from "../shared/schemas/class-meeting";
import { CommitmentSchema } from "../shared/schemas/commitment";
import { UserPreferencesSchema } from "../shared/schemas/preferences";
import { TaskSchema } from "../shared/schemas/task";

// ZoD schema for mock JSON
export const MockStudentSchema=z.object({
    studentId:z.string(),
    preferences:UserPreferencesSchema,
    tasks:z.array(TaskSchema),
    classMeetings:z.array(ClassMeetingSchema),
    commitments:z.array(CommitmentSchema)
}); 


export function validate_json(parsed_json: any): boolean {
    try {
        MockStudentSchema.parse(parsed_json);
    } catch (err) {
        console.error("[ERROR]" + err);
        return false;
    }
    
    return true;
}