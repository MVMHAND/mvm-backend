---
trigger: always_on
---

# My Virtual Mate – MCP Integration Rules

Use this document to guide when and how to leverage Model Context Protocol (MCP) servers for enhanced development capabilities.

---

## 1. Available MCP Servers

This project has the following MCP servers configured and available:

### 1.1 Supabase MCP Server
- **Purpose**: Direct interaction with Supabase project management and PostgREST API
- **Primary use cases**:
  - Querying database tables via PostgREST
  - Inspecting database schema and structure
  - Managing RLS policies
  - Retrieving project logs and metrics
  - Generating TypeScript interfaces from database tables
- **Tools available**: 
  - `postgrestRequest` for data operations (GET, POST, PATCH, DELETE)
  - `getSchema` for retrieving table structures
  - Project management tools

### 1.2 Postgres MCP Server  
- **Purpose**: Direct PostgreSQL database operations
- **Primary use cases**:
  - Executing raw SQL queries
  - Complex database migrations
  - Schema introspection
  - Database performance analysis
  - Transaction management
- **When to use**: For operations requiring direct SQL execution that go beyond PostgREST capabilities

### 1.3 Browser MCP Server
- **Purpose**: Browser automation, web interaction, and **real-time web content retrieval**
- **Primary use cases**:
  - **Fetching latest documentation** from official sources (Next.js docs, Supabase docs, React docs, etc.)
  - **Reading API references** and changelogs for libraries/frameworks
  - **Checking latest best practices** from authoritative sources
  - **Verifying current package versions** and compatibility information
  - Testing deployed applications
  - Verifying UI/UX flows
  - Screenshot generation for documentation
  - E2E testing assistance
  - Form submission testing
  - Accessibility checks on rendered pages
- **When to use**: 
  - When you need information newer than my knowledge cutoff (October 2023)
  - When official documentation might have been updated
  - When you need to validate or interact with the running application

---

## 2. When to Use Each MCP Server

### 2.1 Use Supabase MCP When:
- Reading or writing data to existing tables
- Inspecting current database schema
- Checking Row Level Security policies
- Generating TypeScript types from database tables
- Debugging PostgREST API responses
- Verifying data relationships and foreign keys
- Creating, updating, or deleting records through the API layer

**Example scenarios**:
- "Fetch all active admin users from the profiles table"
- "Show me the schema for the roles table"
- "Generate TypeScript interface for the audit_logs table"
- "Check what RLS policies exist on the role_permissions table"

### 2.2 Use Postgres MCP When:
- Writing or modifying database migrations
- Executing complex SQL queries with CTEs or window functions
- Creating or altering database functions and triggers
- Analyzing query performance with EXPLAIN
- Working with database constraints and indexes
- Batch operations requiring transactions
- Raw SQL is more efficient than multiple PostgREST calls

**Example scenarios**:
- "Create a migration to add audit logging triggers"
- "Run EXPLAIN ANALYZE on this complex query"
- "Add a unique constraint ensuring only one Super Admin exists"
- "Create a database function to calculate effective permissions"

### 2.3 Use Browser MCP When:

#### For Documentation & Web Research:
- **Fetching latest library/framework documentation** (Next.js, React, Supabase, TypeScript, etc.)
- **Reading official migration guides** for version updates
- **Checking breaking changes** in changelogs
- **Verifying API method signatures** from official docs
- **Finding up-to-date configuration examples** (e.g., latest Vercel deployment config)
- **Researching best practices** from authoritative sources (Vercel blog, React docs, etc.)
- **Reading error messages and solutions** from GitHub issues or Stack Overflow
- **Checking package compatibility** from npm registry or GitHub

#### For Application Testing:
- Testing the deployed admin panel UI
- Verifying authentication flows (login, logout, password reset)
- Checking responsive design on different viewports
- Validating form submissions and error handling
- Testing user navigation through multi-step processes
- Capturing screenshots for documentation or bug reports
- Verifying accessibility features (ARIA labels, keyboard navigation)

-**Example scenarios for documentation/research**:
- "Look up the current best practices for Next.js Image component optimization"
- "Find the latest Vercel deployment configuration for environment variables"

---

## 3. MCP Usage Guidelines

### 3.1 Default Behavior
- **Always prefer MCP tools** when they can accomplish the task more directly
- **Use Browser MCP first** when:
  - Question involves "latest", "current", "up-to-date" information
  - Dealing with a library/framework that frequently updates
  - My knowledge cutoff (October 2023) is likely outdated
  - You need to verify official documentation or specs
- Use Supabase MCP for data operations instead of manually constructing API calls
- Use Postgres MCP for schema introspection instead of reading migration files
- Use Browser MCP for UI validation instead of assuming behavior

### 3.2 Combining MCP Servers
You can and should use multiple MCP servers in sequence when appropriate:

**Example workflow 1 (Research-driven development)**:
1. Use **Browser MCP** to fetch latest Next.js 15 documentation on a specific feature
2. Use **Postgres MCP** to check current database schema
3. Implement the feature following latest best practices
4. Use **Browser MCP** to test the implementation

**Example workflow 2 (Database migration)**:
1. Use **Browser MCP** to check latest Supabase migration best practices
2. Use **Postgres MCP** to run the migration
3. Use **Supabase MCP** to verify the schema changes
4. Use **Browser MCP** to test that the UI reflects the new schema

### 3.3 Prioritizing Information Sources
When answering questions:
1. **If information might be outdated**: Use Browser MCP to check official docs first
2. **If information is about data**: Use Supabase/Postgres MCP
3. **If information is general and unlikely to change**: Use my knowledge base
4. **Always cite the source** (Browser MCP fetched content should be cited)

### 3.4 Error Handling
- If an MCP tool fails, explain the error clearly to the user
- Suggest alternative approaches (e.g., if Supabase MCP fails, try Postgres MCP)
- Never silently fall back without explanation

### 3.5 Web Content Guidelines
When using Browser MCP for documentation/research:
- **Prefer official sources**: Official docs > GitHub repos > reputable blogs > forums
- **Check publication/update dates** when available
- **Verify across multiple sources** for critical implementation decisions
- **Summarize findings** rather than copying verbatim (respect copyright)
- **Provide source URLs** so users can verify themselves
- **Cache-bust if needed**: Documentation sites may cache; consider checking multiple related pages

---

## 4. Integration with Main Project Rules

### 4.1 Database Operations
When the main rules file mentions database operations:
- Use **Supabase MCP** for CRUD operations through PostgREST
- Use **Postgres MCP** for migrations, triggers, and complex queries
- Respect RLS policies defined in the main rules

### 4.2 TypeScript Type Generation
When generating types for database tables:
- Use **Supabase MCP** `getSchema` to retrieve current table structure
- Generate TypeScript interfaces following the naming conventions from main rules (PascalCase)
- Place generated types in `src/types/database.ts` or `src/types/supabase.ts`

### 4.3 Testing & Validation
When implementing new features:
1. Write the code following main project rules
2. Use **Browser MCP** to test the feature in the deployed/local environment
3. Use **Supabase MCP** to verify data was correctly written
4. Report results back to user with specific details

---

## 5. Practical Examples

### Example 1: Investigating a Bug
**User**: "Users with Manager role can't see the settings page"

**MCP workflow**:
1. Use **Supabase MCP** to query the `role_permissions` table for Manager role
2. Use **Postgres MCP** to check if relevant permission keys exist
3. Use **Browser MCP** to test logging in as a Manager and verify the issue
4. Report findings with specific permission gaps identified

### Example 2: Adding a New Feature
**User**: "Add a 'Department' field to users"

**MCP workflow**:
1. Use **Postgres MCP** to create and run the migration adding the column
2. Use **Supabase MCP** to verify the schema change and generate TypeScript type
3. Update code with the new field following main rules (forms, tables, etc.)
4. Use **Browser MCP** to test the new field works in the UI

### Example 3: Performance Investigation  
**User**: "The users list is loading slowly"

**MCP workflow**:
1. Use **Postgres MCP** to run EXPLAIN ANALYZE on the users query
2. Use **Supabase MCP** to check RLS policies that might be causing joins
3. Suggest indexing improvements based on query plan
4. Use **Browser MCP** to verify improvement after changes

### Example 4: Implementing Latest Best Practices
**User**: "Implement the roles management page using latest Next.js 15 patterns"

**MCP workflow**:
1. Use **Browser MCP** to fetch latest Next.js 15 App Router patterns from official docs
2. Use **Browser MCP** to check latest Server Actions best practices
3. Use **Supabase MCP** to inspect current roles table schema
4. Implement the page following the latest patterns discovered
5. Use **Browser MCP** to test the implementation

---

## 6. MCP Tool Invocation Format

When you decide to use an MCP tool, explain your reasoning briefly:

**Good approach**:
"I'll use the Supabase MCP server to query the current roles table and show you the existing roles with their permissions."

**Avoid**:
Silently calling MCP tools without explanation.

---

##  7. Limitations & Fallbacks

### 7.1 Known Limitations
- MCP servers require proper configuration in `mcp_config.json`
- Browser MCP requires a running instance of the application
- Some operations may require elevated database privileges

### 7.2 When MCP is Unavailable
If MCP tools are not available or fail:
- Explain what MCP would have done
- Provide alternative manual approaches
- Suggest checking MCP configuration if repeatedly failing

---

## 8. Documentation & Type Safety

### 8.1 Generated Types
When using Supabase MCP to generate types:
- Follow TypeScript strict mode requirements
- Use descriptive interface names matching table names
- Include JSDoc comments for complex types
- Export all generated types from a central location

### 8.2 Query Documentation
When using Postgres MCP for complex queries:
- Add comments explaining the query logic
- Document expected performance characteristics
- Note any indexes that should exist

---

## 9. Summary

**Priority order for information gathering**:
1. **Browser MCP** - for latest documentation, best practices, and up-to-date technical information
2. **Supabase MCP** - for standard CRUD through PostgREST API
3. **Postgres MCP** - for raw SQL, migrations, and complex operations
4. **My knowledge base** - for stable, well-established concepts

**Always use Browser MCP** when:
- Information might be newer than October 2023
- Checking official documentation for latest features/APIs
- Verifying current library versions and compatibility
- Reading error solutions from recent GitHub issues
- Testing UI functionality
- Verifying user workflows
- Capturing visual state

This MCP integration enhances the main project rules by providing direct, verified access to your database, application state, **and the latest information from the web**.
