# Studdy: Agentic Study Navigator

![Studdy Banner](public/og-image.jpg)

**Studdy** is an agentic learning platform that transforms passive study materials into an active, guided learning experience. It uses a **Director Agent** (powered by Google Gemini 3 Pro) to orchestrate a personalized study session, dynamically navigating PDFs and videos, tracking progress, and managing distractions.

Unlike standard chatbots, Studdy has **agency**. It doesn't just answer questions; it drives the session, scrolls your documents, seeks your videos, and negotiates the study plan with you.

---

## Key Features

### 1. **The Director Agent**
A stateful AI companion that acts as your study guide. It maintains a "Session Anchor" to keep you on track and uses a "Mood System" to adapt its teaching style (Guide, Challenger, Supporter) based on your engagement.

### 2. **Multimodal Context**
*   **PDFs**: The agent "sees" your textbooks and lecture slides. It can reference specific pages and auto-scroll the viewer to the relevant diagram.
*   **Video**: The agent analyzes YouTube lectures and can seek the video player to the exact moment a concept is explained.

### 3. **Negotiated Planning**
Don't stick to a rigid schedule. Tell the agent "I only have 20 minutes" or "Focus on the hard stuff," and it will dynamically rebuild your session roadmap in real-time.

### 4. **The Parking Lot**
Stay in the flow. If you have a distracting thought ("Wait, is this related to quantum physics?"), the agent "parks" it for later so you can finish the current mission.

---

## Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
*   **Language**: TypeScript
*   **AI**: [Google Gemini 3 Pro](https://deepmind.google/technologies/gemini/) (via Generative AI SDK)
*   **Database**: MongoDB (Mongoose)
*   **Styling**: Tailwind CSS, Framer Motion
*   **PDF Handling**: `react-pdf`, `pdf-parse`
*   **Video**: `react-player`, `youtube-transcript`
*   **Auth**: NextAuth.js v5

---

## 🏗️ Architecture

The system follows an **Agentic Architecture**:

```mermaid
graph TD
    Client[Client (AgentCanvas)] <--> Server[Server Actions]
    Server <--> DB[(MongoDB)]
    Server <--> Gemini[Gemini 3 Pro]
    
    subgraph "Agent Logic"
        Director[Director Agent]
        Tools[Start / Navigate / Park]
    end
    
    Server --- Director
    Director --- Tools
```

### Agentic Workflow

This sequence diagram illustrates how the **Director Agent** constructs context, plans actions, and drives the UI in real-time.

```mermaid
sequenceDiagram
    actor User
    participant Browser as Client (Browser)
    participant Page as Next.js Page (RSC)
    participant Action as Server Actions
    participant DB as MongoDB
    participant Agent as Agent Logic (Lib)
    participant Gemini as Gemini 3 Pro

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

1.  **Context Construction**: For every message, the server rebuilds the agent's "brain" (Milestones, Parking Lot, Knowledge Base) so it never loses track of the goal.
2.  **Tool Execution**: The agent doesn't just chat; it calls tools (`navigate_resource`) to control the frontend.
3.  **Client Reaction**: The frontend is a "smart puppet" that executes these commands (scrolling PDF, seeking video) instantly.

---

## Getting Started

### Prerequisites
*   Node.js 18+
*   MongoDB Instance
*   Google Gemini API Key


### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/abdushakurob/getstuddy.git
    cd getstuddy
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory:
    ```env
    # Database
    MONGODB_URI=mongodb+srv://...

    # Auth
    AUTH_SECRET=your_auth_secret

    # AI
    GOOGLE_API_KEY=your_gemini_api_key

    # UploadThing (for file storage)
    UPLOADTHING_SECRET=...
    UPLOADTHING_APP_ID=...
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/
│   ├── workspace/       # AgentCanvas, PDFViewer, MediaPlayer
│   ├── dashboard/       # Course cards, Sidebar
│   └── landing/         # Marketing pages
├── lib/
│   ├── actions-*.ts     # Server Actions (API Layer)
│   ├── director-agent.ts # Core Agent Logic & Tools
│   └── gemini.ts        # AI Client & Ingestion
├── models/              # Mongoose Schemas (Session, Course, Resource)
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

---

**Built with ❤️ by [AOB](https://github.com/abdushakurob)
