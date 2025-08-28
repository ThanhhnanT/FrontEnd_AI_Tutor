import { post } from "../utils";

export const gen_schedule =async (data) => {
    const result = await post("generate_schedule", data);
    return result
}