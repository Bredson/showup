# API Conventions

Standards for designing and implementing APIs in this project.

## REST Endpoints

- Use nouns for resources: `/users`, `/orders`
- HTTP verbs: GET (read), POST (create), PUT/PATCH (update), DELETE (remove)
- Return appropriate HTTP status codes

## Request / Response

- Use JSON for request and response bodies
- Validate all input on the server side
- Return consistent error shapes: `{ error: string, code: string }`

## Versioning

- Version APIs in the URL: `/api/v1/...`
- Never break existing contracts without a version bump
