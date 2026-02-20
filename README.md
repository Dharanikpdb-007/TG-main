# Tour Guard - Emergency SOS System

Phase 0 Implementation: Email-Based Emergency Response System for Tourists

## Overview

Tour Guard is a web-based emergency response system designed to help tourists in distress. The Phase 0 implementation focuses on a reliable email-based SOS (Signal of Distress) system that notifies emergency contacts immediately when a tourist triggers an emergency alert.

## Key Features

### 1. **User Authentication**
- Email/password-based registration and login
- Secure session management with Supabase Auth
- User profile with digital ID for quick identification

### 2. **Emergency SOS System**
- One-touch emergency alert button
- Multiple emergency type categories:
  - Medical emergency
  - Crime/Assault
  - Lost/Disoriented
  - Accident
  - Other
- Optional emergency description for additional context
- Automatic GPS location capture and sharing

### 3. **Emergency Contact Management**
- Add multiple emergency contacts (family, friends, embassy, etc.)
- Store contact email and phone number
- Categorize relationships for better context
- Manage contacts with easy delete functionality

### 4. **Location Tracking**
- Real-time GPS location tracking
- Optional tracking activation (user can start/stop)
- Location accuracy display
- Automatic location updates stored in database
- Last update timestamp tracking

### 5. **Email Notifications**
- HTML-formatted emergency alert emails
- Plain text fallback for compatibility
- Includes:
  - Tourist name and digital ID
  - GPS coordinates with Google Maps link
  - Emergency type and description
  - Device information
  - Timestamp
- Email delivery logging and tracking
- Failure handling with error messages

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Lucide React** - Icon library
- **Leaflet** - Map integration (for future phases)

### Backend
- **Supabase** - Database, authentication, and edge functions
- **PostgreSQL** - Data persistence
- **Edge Functions (Deno)** - Serverless email sending

### Database Schema

#### `users` table
- `id` - UUID primary key
- `email` - Unique email address
- `name` - User's full name
- `phone` - Phone number (optional)
- `digital_id` - QR-scannable unique identifier
- `current_latitude` - Latest GPS latitude
- `current_longitude` - Latest GPS longitude
- `last_location_update` - Timestamp of last location update
- `created_at` - Account creation timestamp

#### `emergency_contacts` table
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `contact_name` - Contact's full name
- `contact_email` - Contact's email address
- `contact_phone` - Contact's phone number (optional)
- `relationship` - Type of relationship (family, friend, embassy, other)
- `created_at` - Contact creation timestamp

#### `sos_events` table
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `emergency_type` - Type of emergency
- `description` - User-provided details
- `latitude` - GPS latitude at alert time
- `longitude` - GPS longitude at alert time
- `device_info` - Device and browser information (JSON)
- `status` - Event status (triggered, acknowledged, resolved)
- `triggered_at` - When the SOS was activated
- `resolved_at` - When the emergency was resolved (if applicable)
- `created_at` - Record creation timestamp

#### `email_logs` table
- `id` - UUID primary key
- `sos_event_id` - Foreign key to sos_events
- `recipient_email` - Email that received the alert
- `recipient_name` - Name of email recipient
- `status` - Send status (sent, failed, pending)
- `error_message` - Error details if failed
- `retry_count` - Number of retry attempts
- `sent_at` - Timestamp when email was sent
- `created_at` - Record creation timestamp

## Security Features

### Row Level Security (RLS)
- Users can only view/modify their own data
- Service role has full access for SOS processing
- Email logs accessible only to service role

### Authentication
- Supabase Auth handles password hashing and validation
- JWT-based session management
- Secure token storage in browser

### Privacy
- Location data only captured when tracking is enabled
- Users have full control over data
- Secure edge function communication

## How It Works

### Registration Flow
1. User creates account with email, password, name, and phone
2. System generates unique digital ID
3. User is authenticated and logged in

### SOS Alert Flow
1. User presses "Emergency SOS" button
2. Form opens to select emergency type and add description
3. System captures current GPS location
4. SOS event is created in database
5. Edge function is triggered to send emails
6. Emergency contacts receive HTML email with:
   - Tourist details and digital ID
   - Exact GPS location with Google Maps link
   - Emergency type and description
   - Device information
7. Email delivery is logged for tracking
8. User receives confirmation of alert

### Emergency Contact Setup
1. User adds new emergency contact with name, email, and phone
2. Contact is categorized by relationship type
3. Contact is saved to database
4. Contact will automatically receive alerts when SOS is triggered

## Running Locally

### Prerequisites
- Node.js 16+ and npm
- Supabase account and project

### Installation
```bash
npm install
```

### Environment Variables
The following variables are already set in your `.env` file:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_SUPABASE_ANON_KEY=your-anon-key
```

### Development
```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

## Testing the SOS System

### Test Scenario 1: Basic SOS Alert
1. Create a test account
2. Add at least one emergency contact
3. Enable location tracking
4. Trigger SOS with "Medical Emergency" type
5. Check that email was sent (check email logs in database)

### Test Scenario 2: Multiple Contacts
1. Create account with 3 emergency contacts
2. Trigger SOS
3. Verify all contacts receive emails

### Test Scenario 3: Location Accuracy
1. Enable tracking on desktop with simulated location
2. Trigger SOS
3. Verify coordinates appear in email and database

## Database Indexes

For optimal performance, the following indexes are created:
- `emergency_contacts` on `user_id`
- `sos_events` on `user_id`
- `sos_events` on `triggered_at` (DESC) - for timeline queries
- `email_logs` on `sos_event_id`
- `email_logs` on `status`

## Edge Function: send-sos-email

Location: `supabase/functions/send-sos-email/`

### Functionality
- Validates SOS event exists
- Fetches user and emergency contact details
- Generates HTML and plain text email templates
- Sends emails to all emergency contacts
- Logs email delivery status

### Future Enhancements
- Integration with SendGrid, AWS SES, or Resend
- Email retry logic with exponential backoff
- Template customization per region
- Multi-language support

## Phase 0 Deliverables

✅ **Completed:**
- Email-based SOS system implementation
- Database schema with RLS policies
- Edge function for email sending
- Frontend UI with React and TypeScript
- User authentication and registration
- Emergency contact management
- Location tracking
- Comprehensive testing infrastructure

## Known Limitations

- Email service currently uses mock implementation (ready for SendGrid/AWS SES integration)
- Location tracking requires user permission
- No offline functionality in Phase 0
- Single language (English)
- No blockchain integration in Phase 0

## Next Steps (Future Phases)

### Phase 1: Planning & Architecture
- Security audit and penetration testing
- Compliance review (GDPR, DPDP)
- Legal framework development

### Phase 2: UX/UI & System Design
- Responsive UI improvements
- Incident tracking dashboard
- Responder interface design

### Phase 3: Core Infrastructure
- CI/CD pipeline setup
- Monitoring and logging
- Advanced authentication

### Phase 4: MVP Core Features
- Advanced incident tracking
- Responder dashboard
- Chat system for incident communication

### Phase 5-10: Advanced Features
- AI-powered risk engine
- Blockchain integration
- Multiple language support
- Public launch and scaling

## Support & Debugging

### Common Issues

**Issue: Location not capturing**
- Solution: Grant browser permission to access location
- Check browser console for geolocation errors

**Issue: Email not received**
- Check email_logs table for delivery status
- Verify emergency contacts have valid email addresses
- Ensure edge function is properly deployed

**Issue: Authentication problems**
- Clear browser cache and cookies
- Verify Supabase credentials in .env
- Check Supabase Auth configuration

## Contributing

This is Phase 0 of the Tour Guard project. For future phases, follow the development roadmap provided in the project specifications.

## License

Proprietary - Tour Guard Emergency Response System

---

**Version:** 0.1.0 (Phase 0)
**Last Updated:** 2024
**Status:** Ready for Phase 0 Testing and Deployment
