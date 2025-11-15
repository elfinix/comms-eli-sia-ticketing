import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Initialize Supabase client with service role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-0488e420/health", (c) => {
  return c.json({ status: "ok" });
});

// Helper function to generate password from email and role
function generatePassword(email: string, role: string): string {
  const emailPrefix = email.split('@')[0];
  const roleFormatted = role.toLowerCase().replace(/\s+/g, '');
  return `${emailPrefix}_${roleFormatted}`;
}

// Helper function to verify admin authorization
async function verifyAdmin(authHeader: string | null) {
  console.log('🔐 Verifying admin authorization...');
  console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader) {
    console.log('❌ No authorization header provided');
    return { authorized: false, userId: null };
  }

  const token = authHeader.split(' ')[1];
  console.log('Token extracted:', token ? 'Yes' : 'No');
  
  // Create a Supabase client with the user's access token to verify it
  const userSupabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );
  
  const { data: { user }, error } = await userSupabase.auth.getUser();
  
  if (error || !user) {
    console.log('❌ Auth error or no user:', error?.message || 'No user');
    return { authorized: false, userId: null };
  }

  console.log('✅ User authenticated:', user.id);

  // Check if user is admin using service role client
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  console.log('Profile lookup result:', { role: profile?.role, error: profileError?.message });

  if (profileError || profile?.role !== 'admin') {
    console.log('❌ User is not admin. Role:', profile?.role || 'Not found');
    return { authorized: false, userId: user.id };
  }

  console.log('✅ Admin verified:', user.id);
  return { authorized: true, userId: user.id };
}

// Add new user
app.post("/make-server-0488e420/users", async (c) => {
  try {
    // Verify admin authorization
    const { authorized } = await verifyAdmin(c.req.header('Authorization'));
    if (!authorized) {
      return c.json({ error: 'Unauthorized. Admin access required.' }, 401);
    }

    const body = await c.req.json();
    const { name, email, role, department } = body;

    if (!name || !email || !role) {
      return c.json({ error: 'Missing required fields: name, email, role' }, 400);
    }

    // Generate password
    const password = generatePassword(email, role);
    console.log(`Creating user ${email} with role ${role}, password: ${password}`);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since we don't have email server configured
    });

    if (authError) {
      console.error('Auth error creating user:', authError);
      
      // Better error message for duplicate email
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        return c.json({ error: 'A user with this email already exists.' }, 409);
      }
      
      return c.json({ error: `Failed to create user: ${authError.message}` }, 400);
    }

    if (!authData.user) {
      return c.json({ error: 'Failed to create user: No user returned' }, 500);
    }

    // Create user profile in users table
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        password_hash: 'SUPABASE_AUTH', // Placeholder - actual password managed by Supabase Auth
        name,
        role,
        department: department || null,
        status: 'active',
        created_at: new Date().toISOString(),
        last_login: null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error creating user profile:', dbError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: `Failed to create user profile: ${dbError.message}` }, 500);
    }

    console.log('✅ User created successfully:', userData);
    return c.json({ 
      user: userData,
      generatedPassword: password 
    }, 201);

  } catch (err: any) {
    console.error('Server error creating user:', err);
    return c.json({ error: `Server error: ${err.message}` }, 500);
  }
});

// Update user
app.put("/make-server-0488e420/users/:id", async (c) => {
  try {
    // Verify admin authorization
    const { authorized } = await verifyAdmin(c.req.header('Authorization'));
    if (!authorized) {
      return c.json({ error: 'Unauthorized. Admin access required.' }, 401);
    }

    const userId = c.req.param('id');
    const body = await c.req.json();
    const { name, email, role, department, status } = body;

    console.log(`Updating user ${userId}:`, body);

    // Update auth email if changed
    if (email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { email }
      );

      if (authError) {
        console.error('Auth error updating user:', authError);
        return c.json({ error: `Failed to update user email: ${authError.message}` }, 400);
      }
    }

    // Update user profile
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating user:', error);
      return c.json({ error: `Failed to update user: ${error.message}` }, 500);
    }

    console.log('✅ User updated successfully:', data);
    return c.json({ user: data });

  } catch (err: any) {
    console.error('Server error updating user:', err);
    return c.json({ error: `Server error: ${err.message}` }, 500);
  }
});

// Delete user
app.delete("/make-server-0488e420/users/:id", async (c) => {
  try {
    // Verify admin authorization
    const { authorized } = await verifyAdmin(c.req.header('Authorization'));
    if (!authorized) {
      return c.json({ error: 'Unauthorized. Admin access required.' }, 401);
    }

    const userId = c.req.param('id');
    console.log(`Deleting user ${userId}`);

    // Delete from users table first
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) {
      console.error('Database error deleting user:', dbError);
      return c.json({ error: `Failed to delete user: ${dbError.message}` }, 500);
    }

    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Auth error deleting user:', authError);
      // Continue anyway since database deletion succeeded
    }

    console.log('✅ User deleted successfully');
    return c.json({ success: true });

  } catch (err: any) {
    console.error('Server error deleting user:', err);
    return c.json({ error: `Server error: ${err.message}` }, 500);
  }
});

// Upload file to storage (bypasses RLS by using service role)
app.post("/make-server-0488e420/upload", async (c) => {
  try {
    console.log('📤 Upload request received');

    // Verify user is authenticated (not necessarily admin)
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      console.log('❌ No authorization header');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ Auth error:', authError?.message);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('✅ User authenticated:', user.id);

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const ticketId = formData.get('ticketId') as string || 'unknown';

    if (!file) {
      console.log('❌ No file provided');
      return c.json({ error: 'No file provided' }, 400);
    }

    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      folder,
      ticketId
    });

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'File size exceeds 10MB limit' }, 400);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${ticketId}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log('📤 Uploading to:', filePath);

    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload using service role (bypasses RLS!)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ticket-attachments')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return c.json({ 
        error: `Upload failed: ${uploadError.message}`,
        details: uploadError 
      }, 500);
    }

    console.log('✅ File uploaded:', uploadData.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ticket-attachments')
      .getPublicUrl(filePath);

    console.log('🔗 Public URL:', urlData.publicUrl);

    return c.json({
      success: true,
      path: uploadData.path,
      url: urlData.publicUrl
    });

  } catch (err: any) {
    console.error('❌ Server error during upload:', err);
    return c.json({ 
      error: `Server error: ${err.message}`,
      stack: err.stack 
    }, 500);
  }
});

Deno.serve(app.fetch);