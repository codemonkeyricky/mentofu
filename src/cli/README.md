# Quiz Admin CLI

A command-line interface for managing users, credits, and multipliers in the Quiz application.

## Installation

```bash
# Install globally
npm install -g

# Or run directly from the project
cd src/cli
npm install
npm run build
```

## Usage

```bash
quiz-admin [global-options] <command> [command-options]
```

### Global Options

- `--api-url <url>`: API base URL (default: http://localhost:3000)
- `--username <username>`: Admin username (required for auth)
- `--password <password>`: Admin password (required for auth)
- `--token <token>`: Direct JWT token (alternative to username/password)
- `--verbose`: Show detailed output
- `--dry-run`: Validate without making changes

### Commands

#### Update Multiplier

```bash
quiz-admin update-multiplier \
  --user <userId|username> \
  --quiz-type <quiz-type> \
  --value <integer-multiplier>
```

Options:
- `--user`: Required - user ID or username (CLI resolves)
- `--quiz-type`: Required - valid quiz type (simple-math, simple-math-2, etc.)
- `--value`: Required - INTEGER multiplier (≥ 0)
- `--list-types`: List valid quiz types

#### Update Credits

```bash
quiz-admin update-credits \
  --user <userId|username> \
  --earned <value> \
  --claimed <value> \
  --earned-delta <+/-value> \
  --claimed-delta <+/-value>
```

Options:
- At least one credit option required
- Integers only
- Supports absolute values or relative adjustments

#### List Users

```bash
quiz-admin list-users \
  --search <username> \
  --limit <number> \
  --show-multipliers \
  --show-credits
```

#### Get User Info

```bash
quiz-admin get-user --user <userId|username>
```

## Configuration

You can configure the CLI using environment variables in a `.env` file:

```env
API_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secret
VERBOSE=true
DRY_RUN=false
```

## Examples

Set multiplier for a user:
```bash
quiz-admin update-multiplier --user john --quiz-type simple-math --value 3
```

Update credits for a user:
```bash
quiz-admin update-credits --user john --earned 100 --claimed 50
```

List all users:
```bash
quiz-admin list-users --limit 10
```

Get user info:
```bash
quiz-admin get-user --user john
```