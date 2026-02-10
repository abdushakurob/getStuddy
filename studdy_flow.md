# Studdy: End-to-End System Flow

This sequence diagram illustrates the complete lifecycle of a user interaction within Studdy, from accessing the dashboard to a complex agentic study session.

## System Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Browser as Client (Browser)
    participant Page as Next.js Page (RSC)
    participant Action as Server Actions
    participant DB as MongoDB
    participant Agent as Agent Logic (Lib)
    participant Gemini as Gemini Pro 1.5

    %% --- 1. Dashboard Load ---
    Note over User, Gemini: 1. Dashboard Initialization
    User->>Browser: Navigate to /dashboard
    Browser->>Page: Request Dashboard Page
    Page->>Action: getDashboardData()
    Action->>DB: Find Active Courses & Last Session
    DB-->>Action: User Data
    Action-->>Page: Dashboard JSON
    Page-->>Browser: Render Dashboard UI

    %% --- 2. Course & Session Start ---
    Note over User, Gemini: 2. Starting a Study Session
    User->>Browser: Click "Jump Back In" (Session ID)
    Browser->>Page: Request /work/[sessionId]
    Page->>Action: getSessionTranscript(sessionId)
    Action->>DB: Fetch Transcript, Progress, Milestones
    DB-->>Action: Session Data
    Action-->>Page: Initial State
    Page-->>Browser: Render AgentCanvas & Workspace

    %% --- 3. The Agentic Loop ---
    Note over User, Gemini: 3. The Agentic Interaction Loop
    User->>Browser: Type: "I don't get Mitosis steps."
    Browser->>Action: sendMessageToDirector(msg, sessionId)
    
    rect rgb(240, 248, 255)
        Note right of Action: Context Construction
        Action->>DB: Fetch Session (Milestones, Parking Lot)
        Action->>DB: Fetch Resources (PDFs, Videos)
        DB-->>Action: Resource Knowledge Base & Learning Maps
        Action->>Agent: Construct System Prompt (The "Anchor")
        Note right of Agent: Inject: Current Milestone, Parking Lot, Available Resources
    end

    Agent->>Gemini: Send Prompt + User Message + History
    Gemini-->>Agent: Response: Text + Tool Calls
    Note right of Gemini: Tool Call: navigate_resource(page: 12)
    Note right of Gemini: Tool Call: update_milestone("Mitosis", "completed")

    rect rgb(255, 248, 240)
        Note right of Action: Tool Execution (Server Side)
        loop For each Tool Call
            Agent->>Action: handleToolCall(name, args)
            alt navigate_resource
                Action->>Action: Create Navigation Command
            else update_milestone
                Action->>DB: Update Session.milestones.status
            else park_topic
                Action->>DB: Push to Session.parkingLot
            end
        end
    end

    Action->>DB: Save New Transcript (User Msg + Agent Msg + Tool Results)
    Action-->>Browser: Return { message, navigationCommands, toolResults }

    %% --- 4. Client Reaction ---
    Note over User, Gemini: 4. Client-Side Reaction
    Browser->>Browser: processToolResults() -> Update Local Milestones State
    
    alt Navigation Command Received
        Browser->>Browser: switchResource(resourceId)
        Browser->>Browser: jumpToLabel("12") OR seekTo(timestamp)
        Note right of Browser: PDF Auto-Scrolls / Video Seeks
    end
    
    Browser-->>User: Display Message: "Check this diagram on Page 12..."
```

## Key Flow Descriptions

### 1. Context Construction (The "Anchor")
Every time the user sends a message, the server (`actions-director.ts`) rebuilds the **entire cognitive state** of the agent. This is not just a chat history. It includes:
*   **The Roadmap**: Which milestone is currently valid? (e.g., "Intro to Cells" is Done, "Mitosis" is Active).
*   **The Resources**: A list of available PDFs and Videos with their IDs.
*   **The Knowledge Base**: A distilled summary of the *content* creates a "RAG-lite" context window.

### 2. The Tool Execution Loop
Gemini doesn't just reply with text. It replies with **Intent**.
*   If Gemini says "Let's look at page 5", it *must* call `navigate_resource`.
*   The server executes this logic (validating arguments) and returns a **Command** to the frontend.

### 3. The "Puppet" Client
The `AgentCanvas` client is a "smart puppet". It doesn't make decisions; it acts on the Director's commands.
*   It receives `navigationCommands` and mechanically executes them (calling `react-player` or `pdf-viewer` methods).
*   It receives `milestone_update` and optimistically updates the checkbox UI.

### 4. Persistence
All state changes (Parking Lot additions, Milestone completions) are saved to MongoDB *during* the server action, ensuring that if the user refreshes, the "Brain" remembers exactly where they left off.
