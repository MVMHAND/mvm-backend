# Send Dynamic Email - Implementation Guide

> **Version:** 2.0.0  
> **Last Updated:** January 2026  
> **Backward Compatible:** ✅ Yes - All existing integrations continue to work without changes

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [API Reference](#api-reference)
4. [Feature Guide](#feature-guide)
5. [Integration Examples](#integration-examples)
6. [Best Practices](#best-practices)
7. [Migration Guide](#migration-guide)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The **Send Dynamic Email** function is a flexible, production-ready Supabase Edge Function that handles email notifications for MVM applications. It supports:

- ✅ **Dynamic form fields** - No hardcoded schemas
- ✅ **Customer email control** - Enable/disable confirmation emails
- ✅ **Custom email templates** - Override subject and body
- ✅ **Source tracking** - Track form submissions by page/source
- ✅ **Backward compatible** - Works with existing integrations
- ✅ **Multi-project ready** - Use across multiple applications

### What's New in v2.0

| Feature                 | Description                             | Use Case                      |
| ----------------------- | --------------------------------------- | ----------------------------- |
| `sendCustomerEmail`     | Control whether customer receives email | Silent lead capture, testing  |
| `customerEmail.subject` | Custom subject line                     | Branded confirmations, events |
| `customerEmail.body`    | Custom HTML template                    | White-label, custom branding  |
| `customerEmailSent`     | Response field indicating email status  | Frontend notifications        |

---

## 🚀 Quick Start

### Basic Usage (Default Behavior)

```typescript
// Send both admin notification and customer confirmation
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/send-dynamic-email`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      subject: "Contact Form Inquiry",
      name: "John Doe",
      email: "john@example.com",
      fields: [
        {
          label: "Message",
          value: "I'd like to know more about your services",
        },
      ],
    }),
  },
);

const result = await response.json();
// { success: true, message: "...", requestId: "abc123", customerEmailSent: true }
```

---

## 📚 API Reference

### Endpoint

```
POST /functions/v1/send-dynamic-email
```

### Request Body Schema

```typescript
interface DynamicEmailRequest {
  // REQUIRED FIELDS
  subject: string; // Email subject (shown in admin notification)
  email: string; // Customer's email address

  // OPTIONAL FIELDS
  name?: string; // Customer's name (default: "there")
  fields?: DynamicField[]; // Array of form fields
  source?: SourceInfo; // Page/form tracking information

  // NEW IN V2.0
  sendCustomerEmail?: boolean; // Send customer email? (default: true)
  customerEmail?: {
    subject?: string; // Custom subject line
    body?: string; // Custom HTML body
  };
}

interface DynamicField {
  label: string; // Field label (e.g., "Phone", "Company")
  value: string; // Field value
}

interface SourceInfo {
  formName?: string; // Form identifier (e.g., "Contact Form")
  pageTitle?: string; // Page title
  pageUrl?: string; // Full URL
}
```

### Response Schema

```typescript
// Success Response (200)
{
  success: true,
  message: string,              // User-friendly message
  requestId: string,            // Unique request ID for tracing
  customerEmailSent: boolean    // NEW: Indicates if customer email was sent
}

// Error Response (400/500)
{
  success: false,
  error: string,                // Error message
  requestId?: string            // Request ID (if available)
}
```

---

## 🎨 Feature Guide

### Feature 1: Disable Customer Email

**Use Case:** Silent lead capture, internal tracking, testing

```typescript
// Only admin gets notified, customer receives nothing
await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    subject: "Newsletter Signup",
    email: "user@example.com",
    fields: [{ label: "Lead Source", value: "Homepage Banner" }],
    sendCustomerEmail: false, // 🚫 No customer email
  }),
});
```

**Response:**

```json
{
  "success": true,
  "message": "Your submission has been received and our team has been notified.",
  "requestId": "abc123",
  "customerEmailSent": false
}
```

---

### Feature 2: Custom Subject Line

**Use Case:** Event confirmations, branded experiences, personalization

```typescript
await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    subject: "Event Registration",
    name: "Jane Smith",
    email: "jane@example.com",
    fields: [
      { label: "Event", value: "Annual Conference 2026" },
      { label: "Ticket Type", value: "VIP Pass" },
    ],
    customerEmail: {
      subject: "🎉 You're Registered! Annual Conference 2026", // ✨ Custom subject
    },
  }),
});
```

**What the customer receives:**

- **Subject:** "🎉 You're Registered! Annual Conference 2026"
- **Body:** Default MVM-branded template (professional confirmation)

---

### Feature 3: Fully Custom Email Template

**Use Case:** White-label applications, custom branding, transactional emails

```typescript
const customHtmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; background: white; padding: 30px; }
    .header { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 20px; }
    .content { margin-top: 20px; line-height: 1.6; }
    .footer { margin-top: 30px; font-size: 12px; color: #7f8c8d; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmation</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>Your order <strong>#12345</strong> has been confirmed!</p>
      <p><strong>Total:</strong> $99.99</p>
      <p><strong>Expected Delivery:</strong> January 15, 2026</p>
      <p>Thank you for your purchase!</p>
    </div>
    <div class="footer">
      <p>© 2026 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    subject: "Order Confirmation",
    email: "customer@example.com",
    fields: [
      { label: "Order ID", value: "#12345" },
      { label: "Total", value: "$99.99" },
    ],
    customerEmail: {
      subject: "Your Order #12345 is Confirmed!",
      body: customHtmlTemplate, // ✨ Completely custom HTML
    },
  }),
});
```

---

## 💡 Integration Examples

### Example 1: React Contact Form

```typescript
import { useState } from 'react';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-dynamic-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: "Contact Form Submission",
            name: formData.name,
            email: formData.email,
            source: {
              formName: "Contact Form",
              pageTitle: document.title,
              pageUrl: window.location.href
            },
            fields: [
              { label: "Phone", value: formData.phone },
              { label: "Message", value: formData.message }
            ]
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        alert('Thank you! We\'ll get back to you soon.');
        // Reset form
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

### Example 2: Lead Capture (No Customer Email)

```typescript
// Analytics tracking without notifying the customer
async function trackLead(email: string, source: string) {
  await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: "New Lead Captured",
      email: email,
      fields: [
        { label: "Source", value: source },
        { label: "Timestamp", value: new Date().toISOString() },
      ],
      sendCustomerEmail: false, // Silent tracking
    }),
  });
}

// Usage
trackLead("prospect@example.com", "Homepage CTA Button");
```

---

### Example 3: Event Registration with Custom Template

```typescript
async function registerForEvent(userData: {
  name: string;
  email: string;
  eventName: string;
  ticketType: string;
}) {
  const customEmailBody = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial; padding: 20px;">
        <h1 style="color: #4CAF50;">🎉 Registration Confirmed!</h1>
        <p>Hi ${userData.name},</p>
        <p>You're all set for <strong>${userData.eventName}</strong>!</p>
        <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Event Details:</h3>
          <p><strong>Event:</strong> ${userData.eventName}</p>
          <p><strong>Ticket:</strong> ${userData.ticketType}</p>
          <p><strong>Date:</strong> January 20, 2026</p>
        </div>
        <p>See you there!</p>
      </body>
    </html>
  `;

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/send-dynamic-email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Event Registration",
        name: userData.name,
        email: userData.email,
        fields: [
          { label: "Event", value: userData.eventName },
          { label: "Ticket Type", value: userData.ticketType },
        ],
        customerEmail: {
          subject: `You're Registered for ${userData.eventName}!`,
          body: customEmailBody,
        },
      }),
    },
  );

  return await response.json();
}
```

---

## 🏆 Best Practices

### 1. Default Forms (Contact, Career, Partnership)

**DO:**

```typescript
// Keep it simple - use defaults
{
  subject: "Contact Form Submission",
  email: "user@example.com",
  fields: [...]
}
```

**DON'T:**

```typescript
// Unnecessary customization for standard forms
{
  sendCustomerEmail: true,  // This is already the default
  customerEmail: { /* ... */ }
}
```

---

### 2. Testing & Development

**DO:**

```typescript
// Disable customer emails during testing
const isProduction = import.meta.env.PROD;

{
  subject: "Test Form Submission",
  email: "test@example.com",
  fields: [...],
  sendCustomerEmail: isProduction  // Only send in production
}
```

---

### 3. Custom Branding

**DO:**

```typescript
// Store templates externally for maintainability
import { orderConfirmationTemplate } from './email-templates';

{
  subject: "Order Confirmation",
  email: customer.email,
  customerEmail: {
    subject: `Order #${orderId} Confirmed`,
    body: orderConfirmationTemplate({ orderId, customerName })
  }
}
```

**DON'T:**

```typescript
// Hardcode large HTML strings in your components
const body = `<!DOCTYPE html><html><body>...5000 lines...</body></html>`;
```

---

### 4. Error Handling

**DO:**

```typescript
try {
  const response = await fetch(...);
  const result = await response.json();

  if (!result.success) {
    // Log error for debugging
    console.error('Email send failed:', result.error, result.requestId);

    // Show user-friendly message
    showErrorToast('Unable to send message. Please try again.');
  }
} catch (error) {
  console.error('Network error:', error);
  showErrorToast('Network error. Please check your connection.');
}
```

---

### 5. Multi-tenant Applications

**DO:**

```typescript
// Load tenant-specific templates
const tenantConfig = await getTenantConfig(tenantId);

{
  subject: tenantConfig.emailSubjectPrefix + " Contact Form",
  email: customer.email,
  customerEmail: {
    subject: tenantConfig.confirmationSubject,
    body: tenantConfig.emailTemplate
  }
}
```

---

## 🔄 Migration Guide

### Migrating from v1.x to v2.0

**Good news:** No changes required! All v1.x code continues to work.

#### v1.x Code (Still Works)

```typescript
// This still works exactly as before
await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
  method: 'POST',
  body: JSON.stringify({
    subject: "Contact Form",
    email: "user@example.com",
    fields: [...]
  })
});
```

#### v2.0 Enhanced Code (Optional)

```typescript
// You can now optionally add new features
await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
  method: 'POST',
  body: JSON.stringify({
    subject: "Contact Form",
    email: "user@example.com",
    fields: [...],
    // NEW: Optional enhancements
    sendCustomerEmail: true,
    customerEmail: {
      subject: "Custom Subject"
    }
  })
});
```

---

## 🐛 Troubleshooting

### Issue 1: Customer Not Receiving Emails

**Check:**

1. Is `sendCustomerEmail` set to `false`?
2. Check spam folder
3. Verify email address is valid
4. Check Resend dashboard for delivery status

**Solution:**

```typescript
// Ensure customer email is enabled
{
  sendCustomerEmail: true,  // or omit (defaults to true)
  email: "valid@email.com"
}
```

---

### Issue 2: Custom Email Not Applying

**Common Mistake:**

```typescript
// ❌ WRONG: Typo in field name
{
  customEmail: {
    // Should be 'customerEmail'
    subject: "...";
  }
}
```

**Solution:**

```typescript
// ✅ CORRECT
{
  customerEmail: {
    // Correct field name
    subject: "...";
  }
}
```

---

### Issue 3: HTML Not Rendering Properly

**Issue:** HTML showing as plain text

**Solution:**

- Ensure you're passing `customerEmail.body` (not `customerEmail.text`)
- Use complete HTML structure with `<!DOCTYPE html>`
- Test HTML in email testing tools

```typescript
// ✅ CORRECT
{
  customerEmail: {
    body: `<!DOCTYPE html><html><body>...</body></html>`;
  }
}
```

---

### Issue 4: Request Fails Silently

**Check Response:**

```typescript
const response = await fetch(...);
const result = await response.json();

console.log('Status:', response.status);
console.log('Result:', result);
console.log('Request ID:', result.requestId);  // Use for debugging
```

**Common Errors:**

- **400:** Missing required fields (`subject` or `email`)
- **400:** Invalid email format
- **500:** Server error (check Supabase logs with `requestId`)

---

## 📞 Support & Resources

### Environment Setup

Required environment variable in Supabase:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
```

### Resend Dashboard

- Check email delivery status
- View bounce/spam reports
- Monitor API usage

### Supabase Edge Function Logs

```bash
supabase functions logs send-dynamic-email --tail
```

Filter by request ID:

```bash
supabase functions logs send-dynamic-email | grep "abc123"
```

---

## 📊 Feature Comparison Matrix

| Feature             | Default Behavior | With Control     | With Customization |
| ------------------- | ---------------- | ---------------- | ------------------ |
| Admin Email         | ✅ Always sent   | ✅ Always sent   | ✅ Always sent     |
| Customer Email      | ✅ Sent          | ⚙️ Configurable  | ⚙️ Configurable    |
| Customer Subject    | Default template | Default template | ✨ Custom          |
| Customer Body       | Default template | Default template | ✨ Custom HTML     |
| Backward Compatible | ✅ Yes           | ✅ Yes           | ✅ Yes             |

---

## 🎓 Advanced Use Cases

### Dynamic Template Variables

```typescript
function generateOrderEmail(order: Order) {
  const template = `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Order Confirmed!</h1>
        <p>Order ID: ${order.id}</p>
        <p>Total: $${order.total}</p>
        <ul>
          ${order.items.map((item) => `<li>${item.name} - $${item.price}</li>`).join("")}
        </ul>
      </body>
    </html>
  `;

  return template;
}

// Usage
await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
  method: "POST",
  body: JSON.stringify({
    subject: "Order Confirmation",
    email: customer.email,
    customerEmail: {
      subject: `Order #${order.id} Confirmed`,
      body: generateOrderEmail(order),
    },
  }),
});
```

---

### A/B Testing Email Templates

```typescript
function getEmailVariant(userId: string): "A" | "B" {
  // Simple hash-based A/B split
  return parseInt(userId, 36) % 2 === 0 ? "A" : "B";
}

const variant = getEmailVariant(user.id);

await fetch(`${SUPABASE_URL}/functions/v1/send-dynamic-email`, {
  method: "POST",
  body: JSON.stringify({
    subject: "Registration Confirmation",
    email: user.email,
    fields: [
      { label: "Variant", value: variant }, // Track in admin email
    ],
    customerEmail: {
      subject: variant === "A" ? "Welcome to MVM!" : "🎉 Welcome aboard!",
      body: variant === "A" ? templateA : templateB,
    },
  }),
});
```

---

## 📝 Changelog

### v2.0.0 (January 2026)

- ✨ Added `sendCustomerEmail` control flag
- ✨ Added `customerEmail.subject` customization
- ✨ Added `customerEmail.body` full template override
- ✨ Added `customerEmailSent` to response
- 📚 Enhanced documentation with 4 detailed examples
- 🔒 Maintained 100% backward compatibility

### v1.0.0 (Initial Release)

- Basic dynamic email functionality
- Admin notifications
- Customer confirmations
- Dynamic fields support
- Source tracking

---

## 📄 License & Credits

**Function:** Send Dynamic Email  
**Organization:** My Virtual Mate (MVM)  
**Author:** MVM Development Team  
**License:** Proprietary - For MVM projects use only

For questions or support, contact: expressmate@myvirtualmate.com

---

**Happy Coding! 🚀**
