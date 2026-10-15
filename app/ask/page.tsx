import type { Metadata } from "next";
import { Chat } from "./chat";

export const metadata: Metadata = { title: "Ask the Silver Arrows agent" };

export default function AskPage() {
  return <Chat />;
}
