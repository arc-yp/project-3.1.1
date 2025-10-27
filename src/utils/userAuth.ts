import { supabase } from "./supabase";

const USER_AUTH_KEY = "user_admin_auth";
const USER_ADMIN_DATA = "user_admin_data";

export interface UserAdmin {
  id: string;
  email: string;
  mobile: string;
  businessSlug: string;
  fullName?: string;
  isActive: boolean;
}

export interface UserAdminData {
  id: string;
  email: string;
  mobile: string;
  password: string;
  business_slug: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StoredAuthData {
  userAdmin: UserAdmin;
  timestamp: number;
}

export const userAuth = {
  async login(
    emailOrMobile: string,
    password: string
  ): Promise<UserAdmin | null> {
    if (!supabase) {
      console.error("Supabase not configured");
      return null;
    }

    try {
      // Check if input is email or mobile
      const isEmail = emailOrMobile.includes("@");

      const { data, error } = await supabase
        .from("user_admins")
        .select("*")
        .eq(isEmail ? "email" : "mobile", emailOrMobile)
        .eq("password", password) // In production, use proper password hashing
        .eq("is_active", true)
        .single();

      if (error || !data) {
        console.error("Login failed:", error);
        return null;
      }

      // Map database fields to camelCase
      const userAdmin: UserAdmin = {
        id: data.id,
        email: data.email,
        mobile: data.mobile,
        businessSlug: data.business_slug,
        fullName: data.full_name,
        isActive: data.is_active,
      };

      // Store auth data in session
      const authData: StoredAuthData = {
        userAdmin,
        timestamp: Date.now(),
      };

      sessionStorage.setItem(USER_AUTH_KEY, "true");
      sessionStorage.setItem(USER_ADMIN_DATA, JSON.stringify(authData));

      return userAdmin;
    } catch (error) {
      console.error("Error during login:", error);
      return null;
    }
  },

  logout(): void {
    sessionStorage.removeItem(USER_AUTH_KEY);
    sessionStorage.removeItem(USER_ADMIN_DATA);
  },

  isAuthenticated(): boolean {
    const isAuth = sessionStorage.getItem(USER_AUTH_KEY) === "true";
    const data = sessionStorage.getItem(USER_ADMIN_DATA);

    if (!isAuth || !data) {
      return false;
    }

    try {
      const authData: StoredAuthData = JSON.parse(data);
      // Session expires after 24 hours
      const isExpired = Date.now() - authData.timestamp > 24 * 60 * 60 * 1000;

      if (isExpired) {
        this.logout();
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  getCurrentUser(): UserAdmin | null {
    const data = sessionStorage.getItem(USER_ADMIN_DATA);
    if (!data) return null;

    try {
      const authData: StoredAuthData = JSON.parse(data);
      return authData.userAdmin;
    } catch {
      return null;
    }
  },

  // For main admin to manage user admins
  async getAllUserAdmins(): Promise<UserAdminData[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from("user_admins")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user admins:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getAllUserAdmins:", error);
      return [];
    }
  },

  async createUserAdmin(userData: {
    email: string;
    mobile: string;
    password: string;
    businessSlug: string;
    fullName?: string;
  }): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase.from("user_admins").insert({
        email: userData.email,
        mobile: userData.mobile,
        password: userData.password, // In production, hash this
        business_slug: userData.businessSlug,
        full_name: userData.fullName,
        is_active: true,
      });

      if (error) {
        console.error("Error creating user admin:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in createUserAdmin:", error);
      return false;
    }
  },

  async updateUserAdmin(
    id: string,
    updates: {
      email?: string;
      mobile?: string;
      password?: string;
      businessSlug?: string;
      fullName?: string;
      isActive?: boolean;
    }
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.mobile !== undefined) dbUpdates.mobile = updates.mobile;
      if (updates.password !== undefined) dbUpdates.password = updates.password;
      if (updates.businessSlug !== undefined)
        dbUpdates.business_slug = updates.businessSlug;
      if (updates.fullName !== undefined)
        dbUpdates.full_name = updates.fullName;
      if (updates.isActive !== undefined)
        dbUpdates.is_active = updates.isActive;

      const { error } = await supabase
        .from("user_admins")
        .update(dbUpdates)
        .eq("id", id);

      if (error) {
        console.error("Error updating user admin:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in updateUserAdmin:", error);
      return false;
    }
  },

  async deleteUserAdmin(id: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from("user_admins")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting user admin:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteUserAdmin:", error);
      return false;
    }
  },
};
