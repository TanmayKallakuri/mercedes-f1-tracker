import { eveChannel } from "eve/channels/eve";
import { localDev, none, vercelOidc } from "eve/channels/auth";

// Public demo: the tracker site calls the agent anonymously from the browser.
// vercelOidc keeps the eve TUI and other Vercel deployments working; none() must stay last.
export default eveChannel({
  auth: [vercelOidc(), localDev(), none()],
});
