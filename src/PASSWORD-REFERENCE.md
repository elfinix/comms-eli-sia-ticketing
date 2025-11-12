# 🔐 Password Reference - LPU-Cavite IT Helpdesk

## Role-Based Passwords

All test accounts use **role-based passwords** for easy testing:

| Role | Password | Example Email |
|------|----------|---------------|
| **Student** | `student` | juan.delacruz@lpu.edu.ph |
| **Faculty** | `faculty` | prof.garcia@lpu.edu.ph |
| **ICT Staff** | `ict` | ict.staff1@lpu.edu.ph |
| **Admin** | `admin` | admin@lpu.edu.ph |

---

## 📋 Complete Test Accounts List

### 👨‍🎓 Students (password: `student`)
1. juan.delacruz@lpu.edu.ph
2. maria.santos@lpu.edu.ph
3. pedro.reyes@lpu.edu.ph

### 👨‍🏫 Faculty (password: `faculty`)
4. prof.garcia@lpu.edu.ph
5. prof.lopez@lpu.edu.ph

### 🛠️ ICT Staff (password: `ict`)
6. ict.staff1@lpu.edu.ph
7. ict.staff2@lpu.edu.ph

### 👑 Admin (password: `admin`)
8. admin@lpu.edu.ph

---

## 🧪 Quick Login Tests

Copy and paste these for quick testing:

**Student Login:**
```
Email: juan.delacruz@lpu.edu.ph
Password: student
```

**Faculty Login:**
```
Email: prof.garcia@lpu.edu.ph
Password: faculty
```

**ICT Staff Login:**
```
Email: ict.staff1@lpu.edu.ph
Password: ict
```

**Admin Login:**
```
Email: admin@lpu.edu.ph
Password: admin
```

---

## ⚠️ Production Deployment

**IMPORTANT:** These simple passwords are for development/testing ONLY!

Before deploying to production:
1. ❌ Delete all test accounts
2. ✅ Enforce strong password policies
3. ✅ Enable email verification
4. ✅ Implement password complexity requirements
5. ✅ Set up proper user onboarding flow
6. ✅ Enable 2FA for admin accounts

---

## 🔄 How Passwords Are Managed

- **Supabase Auth** manages all passwords (not stored in database)
- `users.password_hash` column is legacy/placeholder (can be removed)
- Passwords are hashed and stored securely by Supabase
- Password resets are handled through Supabase Auth API

---

## 📝 Creating Users in Supabase

When creating users in Supabase Dashboard:

1. Go to **Authentication** → **Users** → **Add User**
2. Enter email (e.g., `juan.delacruz@lpu.edu.ph`)
3. Enter password based on role (e.g., `student`)
4. ✅ Check **Auto Confirm User** (skip email verification)
5. Click **Create User**
6. Copy the UUID from the user details

Remember to use these exact passwords when creating each role!
