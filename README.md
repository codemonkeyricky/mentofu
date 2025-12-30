# Quiz API

A REST API for multiplication quiz sessions with GET and POST endpoints.

## Features

- **GET /session**: Creates a new session with 10 random single-digit multiplication questions
- **POST /session**: Validates answers for a session and returns the score
- **GET /session/simple-words**: Creates a new session with 10 simple words to type
- **POST /session/simple-words**: Validates answers for a simple words session and returns the score
- **Web UI**: Interactive web interface for children to practice math and spelling

## Endpoints

### GET /session
Creates a new multiplication session and returns:
```json
{
  "sessionId": "uuid-string",
  "questions": [
    {"question": "2*8", "answer": 16},
    {"question": "3*6", "answer": 18}
  ]
}
```

### POST /session
Validates multiplication answers and returns score:
```json
{
  "score": 7,
  "total": 10
}
```

### GET /session/simple-words
Creates a new simple words session and returns:
```json
{
  "sessionId": "uuid-string",
  "words": [
    {"word": "cat", "hint": "A small pet that says meow"},
    {"word": "dog", "hint": "A loyal pet that says woof"}
  ]
}
```

### POST /session/simple-words
Validates simple words answers and returns score:
```json
{
  "score": 7,
  "total": 10
}
```

## Web UI

The application now includes a web interface for children to practice math and spelling:
- Engaging, child-friendly design with colorful visuals
- Progress tracking during the quiz
- Immediate feedback on answers
- Score display with encouraging messages
- Two different quiz modes: multiplication and simple words

## Implementation Details

The API was implemented with:
- Express.js for the REST framework
- TypeScript for type safety
- UUID for session identification
- In-memory session storage with TTL (10 minutes)
- SQLite database for persistent user account storage
- Static file serving for web UI

## How to Run

1. Install dependencies: `npm install`
2. Start the server: `npm run dev` (development) or `npm start` (production)
3. The API will be available at http://localhost:4000
4. Open your browser and navigate to http://localhost:4000 to access the web UI

## Files Created

- `src/index.ts`: Main server entry point
- `src/session/`: Session management logic
  - `session.service.ts`: Core session business logic
  - `session.controller.ts`: Request/response handling
  - `session.types.ts`: Type definitions
  - `simple.words.types.ts`: Simple words type definitions
- `src/utils/question.generator.ts`: Question generation utility
- `src/utils/simple.words.generator.ts`: Simple words generation utility
- `public/index.html`: Main web UI page
- `public/style.css`: Styling for the web interface
- `public/script.js`: JavaScript logic for the web interface

## Testing

The API can be tested with curl or any HTTP client:

```bash
# Get a new multiplication session
curl http://localhost:4000/session

# Get a new simple words session
curl http://localhost:4000/session/simple-words

# Submit multiplication answers (replace sessionId with actual ID from above)
curl -X POST http://localhost:4000/session \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"your-session-id","answers":[16,18,24,32,...]}'

# Submit simple words answers (replace sessionId with actual ID from above)
curl -X POST http://localhost:4000/session/simple-words \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"your-session-id","answers":["cat","dog","sun",...]}'
```

### E2E Testing with Cypress

This project includes Cypress E2E tests to verify the complete user flow from registration through quiz completion.

To run E2E tests:
1. Start the application in development mode: `npm run dev`
2. In another terminal, run: `npm run cypress:open` to open the Cypress GUI
3. Or run: `npm run cypress:run` to run tests in CLI mode

The E2E tests cover:
- User registration and login flow
- Quiz session creation and completion
- Navigation between different application screens

## Web UI Usage

1. Navigate to http://localhost:4000 in your browser
2. Click either "Start Math Quiz" or "Start Simple Words Quiz"
3. Answer all questions/words
4. Click "Submit Answers" to see your score
5. Click "Try Again" to take another quiz

## Workflow Scripts

This repository includes bash scripts that automate the complete workflow of the quiz application:

### Available Scripts

1. **`quiz_workflow.sh`** - Complete Workflow Script
   This script performs the complete workflow including:
   - User registration
   - Login to get JWT token
   - Starting a new session (math quiz)
   - Generating sample answers
   - Submitting answers and retrieving score
   - Getting all user scores

2. **`simple_quiz_workflow.sh`** - Math Quiz Only Script
   This script focuses specifically on the math quiz workflow:
   - User registration
   - Login to get JWT token
   - Starting a math quiz session
   - Generating sample answers
   - Submitting answers and retrieving score

### Usage

1. Make sure the quiz application is running:
   ```bash
   npm start
   # or however you start the application
   ```

2. Run the script:
   ```bash
   ./simple_quiz_workflow.sh
   ```

3. The script will output the progress and final results including:
   - User registration status
   - Login success
   - Session ID
   - Score achieved

### Example Output

```
Starting math quiz workflow for user: math_test_1704234567
Step 1: Registering new user...
✓ User registered successfully
Step 2: Logging in...
✓ Logged in successfully, got JWT token
Step 3: Starting new math quiz session...
✓ Session started with ID: 123e4567-e89b-12d3-a456-426614174000
Step 4: Parsing questions and preparing sample answers...
Found 10 questions
Prepared 10 sample answers
Step 5: Submitting answers...
✓ Answers submitted successfully
Score: 3/10
Step 6: Retrieving session score...
✓ Session score retrieved: 3/10
Math quiz workflow completed successfully!
User: math_test_1704234567
Session ID: 123e4567-e89b-12d3-a456-426614174000
Final Score: 3/10
```