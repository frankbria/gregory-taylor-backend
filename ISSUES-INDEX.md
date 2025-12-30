# Issues Index - Backend

> **Comprehensive issue tracker for Gregory Taylor Photography backend**
>
> Last updated: 2025-12-29
>
> **Note:** Issue #3 already exists on GitHub. This index contains additional issues discovered during codebase review.

---

## Quick Stats

| Category | Issues | Estimated Hours | Priority Breakdown |
|----------|--------|----------------|-------------------|
| Critical Security | 7 | 26 hours | P0: 4, P1: 2, P2: 1 |
| Critical Functionality | 6 | 23 hours | P0: 2, P1: 2, P2: 2 |
| Admin Features | 4 | 23 hours | P2: 2, P3: 2 |
| Testing | 6 | 24 hours | P0: 4, P1: 2 |
| **Total** | **23** | **~96 hours** | **~12 days** |

---

## Documents Overview

### [ISSUES-CRITICAL-SECURITY.md](./ISSUES-CRITICAL-SECURITY.md)
**CRITICAL: Security vulnerabilities that must be fixed before production**

| Issue | Priority | Hours | Severity |
|-------|----------|-------|----------|
| Replace NEXT_PUBLIC_ADMIN_API_KEY | P0 | 4h | **CRITICAL** |
| Implement rate limiting | P0 | 3h | **CRITICAL** |
| Add CSRF protection | P0 | 3h | **CRITICAL** |
| Add input validation (Zod) | P0 | 6h | **CRITICAL** |
| Add security headers | P1 | 2h | High |
| Implement audit logging | P2 | 6h | Medium |
| Validate Stripe webhooks | P1 | 2h | High |

**CRITICAL VULNERABILITIES:**
- ⚠️ **ADMIN API KEY EXPOSED** in client-side JavaScript
- ⚠️ No rate limiting (brute-force attacks possible)
- ⚠️ No CSRF protection (admin account hijacking possible)
- ⚠️ No input validation (injection attacks possible)

**These must be fixed before ANY production deployment.**

---

### [ISSUES-FUNCTIONALITY.md](./ISSUES-FUNCTIONALITY.md)
**Critical functional gaps and incomplete features**

| Issue | Priority | Hours | Impact |
|-------|----------|-------|--------|
| Add customer order lookup API | P0 | 3h | Blocks frontend |
| Server-side price validation | P0 | 4h | Revenue loss risk |
| Populate payment_intent_id | P1 | 1h | Missing audit trail |
| Add pagination to list endpoints | P1 | 4h | Performance |
| Photo search/filtering | P2 | 5h | User experience |
| Email notifications | P2 | 6h | Customer service |

**Production Blockers:**
- Customers cannot view order history
- Prices can be manipulated (revenue loss)
- No pagination (will fail with large catalogs)

---

### [ISSUES-ADMIN.md](./ISSUES-ADMIN.md)
**Admin dashboard functionality improvements**

| Issue | Priority | Hours | Value |
|-------|----------|-------|-------|
| User management page | P2 | 6h | Moderate |
| Bulk actions for photos/orders | P2 | 5h | High productivity |
| Analytics dashboard | P3 | 8h | Nice to have |
| Export functionality | P3 | 4h | Reporting |

**Impact:**
- Improves admin workflow efficiency
- Provides business insights
- Not required for launch but valuable

---

### [ISSUES-TESTING.md](./ISSUES-TESTING.md)
**Testing infrastructure - CRITICAL GAP**

| Issue | Priority | Hours | Coverage |
|-------|----------|-------|----------|
| Set up Jest infrastructure | P0 | 3h | 0% → 20% |
| Photo API tests | P0 | 6h | +20% |
| Stripe webhook tests | P0 | 4h | +15% |
| Model tests | P1 | 3h | +10% |
| Checkout integration tests | P0 | 5h | +15% |
| CI/CD testing pipeline | P1 | 3h | Infrastructure |

**CRITICAL:** Backend currently has **0% test coverage**.
- No tests for payment processing
- No tests for webhook handlers
- No tests for API endpoints
- Production deployment without tests is extremely risky

---

## Existing GitHub Issues

**Do not create duplicates of these:**

- **Issue #3:** Security: Generate signed/transformed URLs server-side instead of exposing raw imageUrl and publicID
- **Issue #4 (CLOSED):** Enhancement: Capture and store image dimensions from Cloudinary upload

---

## Priority Roadmap

### Week 1: CRITICAL SECURITY (P0 Security)
**Goal: Fix critical vulnerabilities**

| Day | Focus | Issues |
|-----|-------|--------|
| 1 | Auth Security | Replace NEXT_PUBLIC_ADMIN_API_KEY, Add CSRF |
| 2 | Input Security | Add rate limiting, Input validation (Zod) |
| 3 | Testing Setup | Set up Jest, First API tests |

**Deliverable:** Major security holes patched, testing begins

---

### Week 2: CRITICAL FUNCTIONALITY (P0 Functionality + Testing)
**Goal: Fix broken features and add critical tests**

| Day | Focus | Issues |
|-----|-------|--------|
| 4 | Payment Security | Server-side price validation, Payment tests |
| 5 | Customer Features | Order lookup API, Webhook tests |
| 6 | Testing | Checkout integration tests, Model tests |

**Deliverable:** Critical features work, payment flow tested

---

### Week 3: IMPORTANT IMPROVEMENTS (P1)
**Goal: Performance and UX**

| Day | Focus | Issues |
|-----|-------|--------|
| 7 | Performance | Pagination, Payment intent storage |
| 8 | Infrastructure | Security headers, CI/CD testing |
| 9 | Polish | Bug fixes, Documentation |

**Deliverable:** Production-ready backend

---

### Week 4: ENHANCEMENTS (P2-P3)
**Goal: Nice-to-haves and admin productivity**

| Day | Focus | Issues |
|-----|-------|--------|
| 10 | Admin Features | User management, Bulk actions |
| 11 | Customer Experience | Search/filtering, Email notifications |
| 12 | Analytics | Dashboard, Export tools |

**Deliverable:** Full-featured admin panel

---

## Critical Path

### Must Fix Before Production (P0)

**Security (16 hours):**
1. Replace NEXT_PUBLIC_ADMIN_API_KEY (4h)
2. Add rate limiting (3h)
3. Add CSRF protection (3h)
4. Add input validation (6h)

**Functionality (7 hours):**
1. Customer order lookup (3h)
2. Server-side price validation (4h)

**Testing (18 hours):**
1. Jest setup (3h)
2. Photo API tests (6h)
3. Stripe webhook tests (4h)
4. Checkout integration tests (5h)

**Total Critical Path:** 41 hours (~5 days for one developer)

---

## Risk Assessment

### High Risk (Production Blockers)

1. **Exposed Admin API Key**
   - **Risk:** Complete admin access compromise
   - **Likelihood:** High (visible in browser)
   - **Impact:** Critical (data loss, fraud)
   - **Mitigation:** Replace with session-based auth ASAP

2. **No Price Validation**
   - **Risk:** Revenue loss from price manipulation
   - **Likelihood:** Medium (requires technical knowledge)
   - **Impact:** High (financial loss)
   - **Mitigation:** Server-side price recalculation

3. **Zero Test Coverage**
   - **Risk:** Production bugs, payment failures
   - **Likelihood:** High (no quality gates)
   - **Impact:** High (lost sales, reputation)
   - **Mitigation:** P0 testing issues first

### Medium Risk

4. **No Rate Limiting**
   - **Risk:** Brute-force attacks, DoS
   - **Likelihood:** Medium
   - **Impact:** Medium
   - **Mitigation:** Express rate limiter

5. **No Pagination**
   - **Risk:** Performance degradation
   - **Likelihood:** High (will happen as catalog grows)
   - **Impact:** Medium (slow site)
   - **Mitigation:** Cursor-based pagination

---

## Dependencies

### Frontend Dependencies
These backend issues block frontend work:

- **Contact form** ← Frontend waiting for `/api/contact` route
- **Orders page** ← Frontend needs customer order lookup API
- **Price validation** ← Must be done server-side
- **reCAPTCHA** ← Server must verify tokens

**Coordinate with frontend team on timeline.**

### Infrastructure Dependencies

- **MongoDB Atlas** - Production database configured?
- **Cloudinary** - Production account set up?
- **Stripe** - Production keys obtained?
- **Email Service** - SMTP/SendGrid/Postmark configured?
- **Deployment** - PM2/server access ready?

---

## How to Use This Index

### For Developers

1. **Starting work?** Follow Critical Path above
2. **Creating issues?** Copy from individual documents
3. **Stuck?** Check Dependencies section
4. **Deploying?** Run through P0 checklist first

### For Technical Leads

1. **Sprint planning?** Use 4-week roadmap as template
2. **Resource allocation?** ~96 hours = 2 developers for 1 month
3. **Risk mitigation?** Address High Risk items first
4. **Code review?** Focus on P0 security issues

### Creating GitHub Issues

Each issue in the documents is GitHub-ready:
1. Open document (e.g., `ISSUES-CRITICAL-SECURITY.md`)
2. Copy issue markdown
3. Paste into GitHub issue form
4. Add labels from issue header
5. Assign to milestone by priority

---

## Issue Format

All issues follow this template:

```markdown
## Issue: [Title]

**Labels:** `label1`, `label2`
**Priority:** P0/P1/P2/P3
**Estimated Effort:** X hours

### Summary
Brief description

### Current Implementation
What exists now (with code)

### Impact
What breaks or is at risk

### Proposed Solution
How to fix (with code examples)

### Acceptance Criteria
- [ ] Testable requirements

### Testing
How to verify
```

---

## Deployment Checklist

Before deploying to production, verify:

### Security
- [ ] NEXT_PUBLIC_ADMIN_API_KEY removed
- [ ] Session-based auth implemented
- [ ] Rate limiting active
- [ ] CSRF protection enabled
- [ ] Input validation (Zod) in place
- [ ] Security headers configured

### Functionality
- [ ] Price validation server-side
- [ ] Customer order lookup works
- [ ] Stripe webhooks verified
- [ ] Pagination implemented

### Testing
- [ ] Test suite runs and passes
- [ ] Webhook tests pass
- [ ] Checkout flow tested
- [ ] >80% code coverage achieved

### Infrastructure
- [ ] Environment variables documented
- [ ] Database backups configured
- [ ] Error tracking (Sentry) set up
- [ ] CI/CD pipeline includes tests

---

## Notes

1. **Existing Issues:** Issue #3 already on GitHub - don't duplicate
2. **Estimates:** Single developer, ±20% variance
3. **Priorities:**
   - P0 = Critical (blocks production)
   - P1 = Important (needed soon)
   - P2 = Should have (improves experience)
   - P3 = Nice to have (future enhancement)
4. **Testing:** Currently 0% - HIGH PRIORITY
5. **Security:** Multiple critical vulnerabilities - FIX IMMEDIATELY

---

## Related Documentation

- **Frontend Issues:** `/home/frankbria/projects/gregory-taylor-frontend/ISSUES-INDEX.md`
- **Deployment Guide:** `.github/workflows/deploy.yml`
- **Environment Setup:** `.env.example`
- **Claude Code Guide:** `CLAUDE.md`

---

## Changelog

- **2025-12-29:** Initial comprehensive review
  - 23 backend issues identified
  - 4 priority levels assigned
  - ~96 hours of work estimated
  - Critical security vulnerabilities flagged

---

For questions or clarifications, refer to individual issue documents or contact the backend team lead.
