## Non-Functional Requirements

### Performance

- NFR1: Search operations (client by name/NIT, contact by name/email)
  must return and render results in under 1 second with up to 500 records
  in the database
- NFR2: All CRUD operations (create, edit, delete) must reflect changes
  in the UI in under 2 seconds under normal conditions
- NFR3: The application must remain responsive with up to 10 simultaneous
  active users without measurable degradation

### Security

- NFR4: All data exchanged between the frontend and backend must be
  transmitted over HTTPS in any non-local deployment
- NFR5: The API must validate and sanitize all user inputs before
  persisting data to prevent injection attacks
- NFR6: The application must not expose internal error details or stack
  traces to end users

### Usability

- NFR7: A new user must be able to complete core tasks (find a client,
  view their contacts, register a new client with a contact) without
  any training or documentation
- NFR8: The application must require no more than 2 clicks to navigate
  from a client record to any of its associated contacts
- NFR9: The application must require no additional search or navigation
  to view a contact's associated client from the contact detail view

### Scalability

- NFR10: The system is designed and scoped for a maximum of 500 client
  records, 1,000 contact records, and 10 simultaneous users in MVP
- NFR11: The data model must support future expansion of these limits
  without requiring schema redesign (i.e., no hardcoded limits in the
  data layer)
