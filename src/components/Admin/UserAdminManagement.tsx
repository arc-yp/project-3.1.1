import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  Smartphone,
  Building2,
  Loader2,
  X,
  Eye,
  EyeOff,
  Users,
  CheckCircle,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { userAuth } from "../../utils/userAuth";
import { storage } from "../../utils/storage";
import { ReviewCard } from "../../types";

interface UserAdminData {
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

export const UserAdminManagement: React.FC = () => {
  const [userAdmins, setUserAdmins] = useState<UserAdminData[]>([]);
  const [businessCards, setBusinessCards] = useState<ReviewCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAdminData | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAdminData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [admins, cards] = await Promise.all([
        userAuth.getAllUserAdmins(),
        storage.getCards(),
      ]);
      setUserAdmins(admins);
      setBusinessCards(cards);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBusinessName = (slug: string) => {
    const card = businessCards.find((c) => c.slug === slug);
    return card ? card.businessName : slug;
  };

  // Get business logo for the user's assigned business (used as avatar)
  const getBusinessLogo = (slug: string) => {
    const card = businessCards.find((c) => c.slug === slug);
    return card?.logoUrl;
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const success = await userAuth.deleteUserAdmin(deletingUser.id);
      if (success) {
        setUserAdmins(userAdmins.filter((u) => u.id !== deletingUser.id));
        setDeletingUser(null);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleLoginAsAdmin = (user: UserAdminData) => {
    // Store the admin credentials temporarily for direct login
    const adminLoginData = {
      email: user.email,
      password: user.password,
      businessSlug: user.business_slug,
      fullName: user.full_name,
    };

    // Store in session storage for the login process
    sessionStorage.setItem("adminLoginData", JSON.stringify(adminLoginData));

    // Navigate directly to the user admin dashboard using the business slug
    window.open(`/${user.business_slug}/admin`, "_blank");
  };

  const activeUsersCount = userAdmins.filter((u) => u.is_active).length;
  const inactiveUsersCount = userAdmins.filter((u) => !u.is_active).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-green-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center">
              <User className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-blue-600" />
              User Admin Management
            </h2>
            <p className="text-slate-600 mt-1">
              Manage user-level administrator access
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add User Admin
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {userAdmins.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {activeUsersCount}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-red-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Inactive Users
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {inactiveUsersCount}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-yellow-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Businesses</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {businessCards.length}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="p-4 sm:p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              User Administrators
            </h3>
          </div>

          {userAdmins.length === 0 ? (
            <div className="p-8 text-center">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">
                No user administrators found
              </p>
              <p className="text-slate-500 mt-2">
                Add your first user admin to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {userAdmins.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
                              {getBusinessLogo(user.business_slug) ? (
                                <img
                                  src={getBusinessLogo(user.business_slug) as string}
                                  alt={user.full_name || "User"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-medium text-sm">
                                  {user.full_name
                                    ? user.full_name.charAt(0).toUpperCase()
                                    : "U"}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {user.full_name || "No Name"}
                            </div>
                            <div className="text-sm text-slate-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-slate-900">
                            <Mail className="w-4 h-4 mr-2 text-slate-400" />
                            {user.email}
                          </div>
                          <div className="flex items-center text-sm text-slate-500">
                            <Smartphone className="w-4 h-4 mr-2 text-slate-400" />
                            {user.mobile}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center text-sm">
                          <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                          <span className="text-slate-900">
                            {getBusinessName(user.business_slug)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          /{user.business_slug}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleLoginAsAdmin(user)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title="Login as this admin"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingUser) && (
        <UserAdminModal
          user={editingUser}
          businessCards={businessCards}
          onClose={() => {
            setShowAddModal(false);
            setEditingUser(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setEditingUser(null);
            loadData();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingUser && (
        <DeleteConfirmDialog
          user={deletingUser}
          onCancel={() => setDeletingUser(null)}
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  );
};

// User Admin Modal Component
const UserAdminModal: React.FC<{
  user: UserAdminData | null;
  businessCards: ReviewCard[];
  onClose: () => void;
  onSave: () => void;
}> = ({ user, businessCards, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    email: user?.email || "",
    mobile: user?.mobile || "",
    password: user?.password || "",
    businessSlug: user?.business_slug || "",
    fullName: user?.full_name || "",
    isActive: user?.is_active ?? true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      let success = false;

      if (user) {
        // Update existing user
        success = await userAuth.updateUserAdmin(user.id, {
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          businessSlug: formData.businessSlug,
          fullName: formData.fullName,
          isActive: formData.isActive,
        });
      } else {
        // Create new user
        success = await userAuth.createUserAdmin({
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          businessSlug: formData.businessSlug,
          fullName: formData.fullName,
        });
      }

      if (success) {
        onSave();
      } else {
        setError("Failed to save user admin. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error saving user admin:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl my-8">
        {/* Fixed Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-slate-800">
              {user ? "Edit User Admin" : "Add User Admin"}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
              aria-label="Close modal"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          <form
            id="user-admin-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mobile Number *
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-green-50 border border-green-200 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pr-10 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Business Selection */}
            <div>
              <label
                htmlFor="business-select"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Assigned Business *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none z-10" />
                <select
                  id="business-select"
                  value={formData.businessSlug}
                  onChange={(e) =>
                    setFormData({ ...formData, businessSlug: e.target.value })
                  }
                  className="w-full pl-10 pr-10 py-3 bg-blue-50 border border-blue-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                  required
                  title="Select business for this user admin"
                >
                  <option value="" className="text-slate-500">
                    Select a business
                  </option>
                  {businessCards.map((card) => (
                    <option
                      key={card.id}
                      value={card.slug}
                      className="text-slate-800"
                    >
                      {card.businessName} (/{card.slug})
                    </option>
                  ))}
                </select>
              </div>
              {businessCards.length === 0 && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                  ⚠️ No businesses available. Create a review card first.
                </p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <label className="text-sm font-medium text-slate-700">
                Active Status
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, isActive: !formData.isActive })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isActive ? "bg-green-500" : "bg-gray-400"
                }`}
                aria-label={
                  formData.isActive ? "Deactivate user" : "Activate user"
                }
                title={
                  formData.isActive
                    ? "Click to deactivate"
                    : "Click to activate"
                }
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Fixed Footer with Buttons */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="user-admin-form"
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : user ? (
                "Update User Admin"
              ) : (
                "Create User Admin"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Dialog
const DeleteConfirmDialog: React.FC<{
  user: UserAdminData;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ user, onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-yellow-50">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <AlertCircle className="w-6 h-6 mr-3 text-red-500" />
            Confirm Deletion
          </h3>
        </div>

        <div className="p-6">
          <p className="text-slate-700 mb-4">
            Are you sure you want to delete the user admin:
          </p>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="font-medium text-slate-800">
              {user.full_name || "No Name"}
            </p>
            <p className="text-sm text-slate-600">{user.email}</p>
            <p className="text-sm text-slate-600">
              {getBusinessName(user.business_slug)}
            </p>
          </div>
          <p className="text-red-600 text-sm mt-4 font-medium">
            This action cannot be undone.
          </p>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
            >
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for delete dialog
const getBusinessName = (slug: string) => {
  return slug; // This should be replaced with proper business name lookup
};
