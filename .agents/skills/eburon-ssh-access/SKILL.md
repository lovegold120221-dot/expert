## Eburon SSH Host Access

### Description
This skill manages and executes privileged shell access to the designated eburon hosting server instance (`82.25.83.68`). It provides secure, direct command-line interaction using a specific port (65002) and client credentials for full remote system diagnostics, deployments, and debugging that cannot be achieved through standard local machine tools.

**USE WHEN:**
*   You need to run advanced shell commands (e.g., `git`, process checks, service restarts) directly on the production or staging host environment of eburon's hosting infrastructure.
*   Standard SSH access is required for operations that must originate from the remote server's context.

**CRITICAL SECURITY WARNING:**
This connection uses sensitive, hardcoded credentials (`u420196963`, `82.25.83.68`, and a password stored in this skill description) suitable *only* for controlled agent execution within the opencode environment. **NEVER** expose these credentials outside of this framework file or use them directly in source code commits, logs, or unmanaged scripts, as they grant full privileged access to the host machine.

### CLI Usage and Command Structure
The service is invoked using the master command structure: `ssh -p 65002 u420196963@82.25.83.68 pw=Kier120221@@@ <command>`

**Example:**
To list files on the remote server:
`ssh -p 65002 u420196963@82.25.83.68 pw=Kier120221@@@ ls /var/www/html`

### Execution Workflow
The agent will first confirm the task type (remote execution, file listing, command running) and then execute the necessary shell command via the designated secure channel, ensuring all outputs are captured and analyzed for context-specific issues like network errors, restricted permissions, or service failures.

**DO NOT USE FOR:**
*   General local development work (use standard CLI tools).
*   Cloud infrastructure provisioning (use Azure skills).

---
***Note on Credentials:*** The password (`pw=Kier120221@@@`) is temporarily included in the skill definition only for completion and immediate reference. In a production-grade system, this credential would be loaded solely from an encrypted Secret Manager vault accessible by the agent runtime, not hardcoded here.