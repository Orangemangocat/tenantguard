# TenantGuard TODO List

## Immediate Priorities (Next 2 Weeks)

### High Priority

- [ ] Configure SMTP for email notifications
  - Research email service providers
  - Set up account (SendGrid, AWS SES, or Mailgun)
  - Configure Flask to send emails
  - Test contact form email delivery
  - Create email templates for notifications

- [ ] Add terms of service and privacy policy
  - Draft or hire lawyer to create legal documents
  - Add links to footer
  - Require acceptance during registration

- [ ] Implement user authentication
  - Choose authentication library (Flask-Login recommended)
  - Create user registration form
  - Create login form
  - Implement password hashing (bcrypt)
  - Add session management
  - Create password reset functionality

### Medium Priority

- [ ] Improve error handling
  - Add try-catch blocks to API endpoints
  - Return meaningful error messages
  - Log errors for debugging

- [ ] Add input validation
  - Validate all form inputs on backend
  - Return validation errors to frontend
  - Improve frontend validation messages

- [ ] Set up automated backups
  - Create backup script for database
  - Schedule daily backups with cron
  - Test backup restoration

### Low Priority

- [ ] Add loading states to forms
  - Show spinner while submitting
  - Disable submit button to prevent double-submission

- [ ] Improve accessibility
  - Add ARIA labels to form fields
  - Ensure keyboard navigation works
  - Test with screen reader

---

## Short-Term (Next Month)

### Development

- [ ] Build tenant dashboard
  - Design dashboard layout
  - Create case overview component
  - Add document upload functionality
  - Implement case status tracking

- [ ] Build attorney dashboard
  - Design dashboard layout
  - Create case list component
  - Add task management features
  - Implement KPI tracking

- [ ] Implement file upload
  - Choose storage solution (S3 or local)
  - Create upload API endpoint
  - Add file validation (type, size)
  - Display uploaded files in dashboard

- [ ] Add unit tests
  - Set up pytest for backend
  - Write tests for API endpoints
  - Set up Jest for frontend
  - Write tests for key components

### Infrastructure

- [ ] Set up staging environment
  - Create separate server or subdomain
  - Configure deployment for staging
  - Test changes on staging before production

- [ ] Implement monitoring
  - Set up error tracking (Sentry)
  - Add uptime monitoring (UptimeRobot)
  - Create health check endpoint

- [ ] Improve deployment script
  - Add automated testing before deployment
  - Implement blue-green deployment
  - Add deployment notifications (Slack, email)

### Documentation

- [ ] Create user documentation
  - How to submit a case (tenant guide)
  - How to apply as an attorney
  - How to use the dashboard
  - FAQ section

- [ ] Create developer documentation
  - Setup instructions for local development
  - API documentation
  - Database schema documentation
  - Deployment guide

---

## Medium-Term (Next 3 Months)

### Features

- [ ] Implement attorney matching algorithm
  - Define matching criteria
  - Write matching logic
  - Test with sample data
  - Add manual override for admin

- [ ] Add in-platform messaging
  - Choose messaging technology (WebSockets, Pusher)
  - Create message UI components
  - Implement real-time message delivery
  - Add email notifications for new messages

- [ ] Implement payment system
  - Choose payment processor (Stripe)
  - Create subscription plans
  - Implement billing logic
  - Add payment history page

- [ ] Add analytics dashboard
  - Define key metrics to track
  - Set up analytics database or service
  - Create admin dashboard
  - Add data visualizations

### Infrastructure

- [ ] Migrate to PostgreSQL
  - Set up PostgreSQL database
  - Create migration scripts
  - Test migration with sample data
  - Perform production migration

- [ ] Implement caching
  - Set up Redis
  - Cache frequently accessed data
  - Implement session storage in Redis

- [ ] Add CI/CD pipeline
  - Set up GitHub Actions or similar
  - Automate testing on pull requests
  - Automate deployment to staging
  - Require manual approval for production

---

## Long-Term (Next 6-12 Months)

### Features

- [ ] Build mobile apps
  - Design mobile UI
  - Develop iOS app
  - Develop Android app
  - Submit to app stores

- [ ] Add document automation
  - Create document templates
  - Implement document generation logic
  - Add e-signature integration

- [ ] Implement AI features
  - Research AI/ML tools and libraries
  - Build case analysis model
  - Create chatbot for basic questions
  - Add predictive analytics

### Infrastructure

- [ ] Move to cloud hosting
  - Choose cloud provider (AWS, GCP, Azure)
  - Set up infrastructure (VMs, load balancers, etc.)
  - Migrate application and database
  - Configure auto-scaling

- [ ] Implement advanced security
  - Conduct security audit
  - Implement rate limiting
  - Add CSRF protection
  - Set up WAF (Web Application Firewall)

### Business

- [ ] Expand to new jurisdictions
  - Research legal requirements
  - Recruit attorneys in new areas
  - Adapt platform for new jurisdictions
  - Launch marketing campaigns

- [ ] Build partnerships
  - Reach out to legal aid organizations
  - Partner with bar associations
  - Collaborate with tenant advocacy groups

---

## Bugs and Issues

### Known Bugs

- [ ] None currently identified (platform is in early testing)

### Technical Debt

- [ ] No migration system for database schema changes
  - Implement Alembic for database migrations

- [ ] No automated testing
  - Add unit tests and integration tests

- [ ] No error tracking
  - Set up Sentry or similar

- [ ] Deployment script doesn't handle all edge cases
  - Improve error handling and rollback logic

---

## Ideas and Enhancements

### User-Requested Features

- (None yet - platform is in early testing)

### Team Ideas

- [ ] Add a blog or resource center for tenants
  - Legal guides and articles
  - Know your rights information
  - Success stories

- [ ] Create a referral program
  - Incentivize users to refer others
  - Track referrals and rewards

- [ ] Add multilingual support
  - Translate platform to Spanish
  - Support for other languages

- [ ] Implement two-factor authentication
  - Add 2FA for enhanced security
  - Support for authenticator apps

---

## Completed Tasks

### December 2025

✅ Set up Git repository  
✅ Create React frontend with Vite  
✅ Create Flask backend  
✅ Implement tenant case intake form  
✅ Implement attorney application form  
✅ Create contact form  
✅ Add theme system with 4 color schemes  
✅ Deploy to testing server  
✅ Create deployment script  
✅ Fix navigation links  
✅ Fix button spacing  
✅ Fix "Join as Attorney" button visibility  
✅ Fix database initialization error  
✅ Fix database permissions  
✅ Improve deployment script to handle venv and dist properly  
✅ Create comprehensive project documentation  

---

## Notes

- This TODO list is a living document and should be updated regularly
- Completed tasks should be moved to the "Completed Tasks" section with the date
- New tasks should be added as they are identified
- Priorities should be reviewed and adjusted as needed
