import { useState } from "react";
import EditProfileModal from "../../components/ui/EditProfileModal";
import { useAuth } from "../../contexts/AuthContext";

export default function Settings() {
  const { user, setUser } = useAuth();
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);

  return (
    <section className="space-y-6">
      <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Settings</h3>
            <p className="text-gray-600 text-sm">Manage your profile and preferences.</p>
          </div>
          <button onClick={() => setEditProfileModalOpen(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black/80">
            Edit Profile
          </button>
        </div>
      </div>

      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        user={user}
        onProfileUpdate={(updated) => { setUser(updated); setEditProfileModalOpen(false); }}
      />
    </section>
  );
}
