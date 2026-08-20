import { z } from "zod";

export const paginationSchema = {
  cursor: z.number().optional().describe("Pagination cursor from a previous response"),
  limit: z.number().min(1).max(50).optional().describe("Max items to return (default 20, max 50)"),
};
