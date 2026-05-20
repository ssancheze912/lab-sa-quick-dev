## Functional Requirements

### Client Management

- FR1: Users can create a new client record with the required fields
  (Name, NIT/RUC, Phone, City)
- FR2: Users can view a paginated or scrollable list of all clients
- FR3: Users can search the client list by client name
- FR4: Users can search the client list by NIT/RUC
- FR5: Users can view the complete details of a specific client record
- FR6: Users can edit any field of an existing client record
- FR7: Users can delete a client record from the system
- FR8: The system prevents saving a client record with missing required
  fields

### Contact Management

- FR9: Users can create a new contact record with the required fields
  (Name, Role/Title, Phone, Email)
- FR10: Users can view a list of all contacts
- FR11: Users can search the contact list by contact name
- FR12: Users can search the contact list by email
- FR13: Users can view the complete details of a specific contact record
- FR14: Users can edit any field of an existing contact record
- FR15: Users can delete a contact record from the system
- FR16: The system prevents saving a contact record with missing required
  fields

### Client–Contact Association

- FR17: Users can associate one or more existing contacts to a client
- FR18: Users can associate a contact to a client at the time of contact
  creation
- FR19: Users can associate a contact to a client from within the client
  detail view without navigating away
- FR20: Users can disassociate a contact from a client without deleting
  either record
- FR21: Users can view all contacts associated with a client directly
  within the client detail view
- FR22: Users can navigate from the client detail view to any associated
  contact's detail view
- FR23: Users can view which client a contact is associated with directly
  from the contact detail view
- FR24: Users can navigate from the contact detail view to the associated
  client's detail view

### Data Quality & Administration

- FR25: Users can identify contacts that are not associated with any client
- FR26: Users can reassign a contact from one client to a different client
- FR27: The system reflects all data changes (create, update, delete,
  associate, disassociate) immediately for all users without requiring a
  manual sync

### Navigation & Access

- FR28: Users can navigate between views (client list, client detail,
  contact list, contact detail) without full page reloads
- FR29: Users can access and use the full application from a mobile
  browser viewport
- FR30: Users can access the application directly via URL routes for any
  view (deep linking)
