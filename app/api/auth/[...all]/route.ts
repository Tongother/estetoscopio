import { auth } from "@/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth.handler);
export const GET = handler.GET;
export const POST = handler.POST;