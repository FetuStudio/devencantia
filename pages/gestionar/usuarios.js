import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../utils/supabaseClient";

export default function AdminUsers() {
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Error al obtener usuario supabase auth:", authError);
        router.push("/");
        return;
      }

      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);
      setCheckingAuth(false);
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    if (!checkingAuth) {
      fetchUsers();
    }
  }, [checkingAuth]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url, email, pin, description, created_at, updated_at");
    if (error) {
      setError(error.message);
    } else {
      setUsers(data);
    }
    setLoading(false);
  };

  const navButtons = [
    { icon: "https://dev.encantia.lat/navbar/home.png", name: "Inicio", url: "/" },
    { icon: "https://dev.encantia.lat/navbar/gestion.png", name: "Gestion", url: "/gestionar" },
    { icon: "https://dev.encantia.lat/navbar/ipersonal.png", name: "Tu Información", url: "/infow" },
  ];

  const avatarUrl = user
    ? users.find((u) => u.user_id === user.id)?.avatar_url || "https://i.ibb.co/d0mWy0kP/perfildef.png"
    : "https://i.ibb.co/d0mWy0kP/perfildef.png";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const startEdit = (user) => {
    setEditingId(user.user_id);
    setFormData({ ...user });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name || formData.name.trim() === "") {
      setError("El nombre es obligatorio.");
      return false;
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Email inválido.");
      return false;
    }
    if (formData.pin && !/^\d{4,6}$/.test(formData.pin)) {
      setError("El pin debe tener entre 4 y 6 dígitos numéricos.");
      return false;
    }
    return true;
  };

  const saveChanges = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: formData.name.trim(),
        avatar_url: formData.avatar_url || null,
        email: formData.email.trim(),
        pin: formData.pin || null,
        description: formData.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", editingId);

    if (error) {
      setError(error.message);
    } else {
      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === editingId ? { ...user, ...formData } : user
        )
      );
      cancelEdit();
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-screen h-screen w-screen">
      {/* Navbar inferior */}
      <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 flex items-center bg-gray-900 p-2 rounded-full shadow-lg space-x-4 w-max z-50">
        <img
          src="https://images.encantia.lat/encantia-logo-2025.webp"
          alt="Logo"
          className="h-13 w-auto"
        />

        {navButtons.map((button, index) => (
          <div key={index} className="relative group">
            <button
              onClick={() => {
                if (button.url.startsWith("http")) {
                  window.open(button.url, "_blank");
                } else {
                  router.push(button.url);
                }
              }}
              className="p-2 rounded-full bg-gray-800 text-white text-xl transition-transform transform group-hover:scale-110"
              aria-label={button.name}
              title={button.name}
            >
              <img src={button.icon} alt={button.name} className="w-8 h-8" />
            </button>
            <span className="absolute bottom-14 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-700 text-white text-xs rounded px-2 py-1 transition-opacity pointer-events-none">
              {button.name}
            </span>
          </div>
        ))}

        {/* Avatar y dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-full bg-gray-800 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Menú de usuario"
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover"
              loading="lazy"
            />
          </button>

          {isDropdownOpen && (
            <div
              className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm rounded-lg shadow-md mt-2 w-40 z-50"
              role="menu"
              aria-label="Opciones de usuario"
            >
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-700"
                role="menuitem"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenedor principal que ocupa todo el alto y ancho */}
      <main className="flex-grow p-6 pt-20 overflow-auto h-full w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Usuarios</h1>

        {error && (
          <div className="mb-4 bg-red-700 p-3 rounded text-center font-semibold">
            {error}
          </div>
        )}
        {loading && <p className="mb-4 text-center">Cargando...</p>}

        <div className="overflow-auto rounded-lg border border-gray-700 h-full w-full">
          <table className="min-w-full bg-gray-800 text-white rounded-lg overflow-hidden table-fixed">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b border-gray-700 w-24">Avatar</th>
                <th className="px-4 py-2 border-b border-gray-700 w-40">Nombre</th>
                <th className="px-4 py-2 border-b border-gray-700 w-56">Email</th>
                <th className="px-4 py-2 border-b border-gray-700 w-24">Pin</th>
                <th className="px-4 py-2 border-b border-gray-700">Descripción</th>
                <th className="px-4 py-2 border-b border-gray-700 w-36">Acciones</th>
              </tr>
            </thead>
            <tbody className="overflow-auto">
              {users.map((user) => (
                <tr
                  key={user.user_id}
                  className="border-b border-gray-700 hover:bg-gray-700"
                >
                  <td className="px-4 py-2">
                    {editingId === user.user_id ? (
                      <input
                        type="url"
                        name="avatar_url"
                        value={formData.avatar_url || ""}
                        onChange={handleChange}
                        placeholder="URL de avatar"
                        className="w-24 rounded px-2 py-1 text-black"
                      />
                    ) : (
                      <img
                        src={user.avatar_url || "https://i.ibb.co/d0mWy0kP/perfildef.png"}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === user.user_id ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleChange}
                        placeholder="Nombre completo"
                        className="rounded px-2 py-1 text-black"
                      />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === user.user_id ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        placeholder="Email"
                        className="rounded px-2 py-1 text-black"
                      />
                    ) : (
                      user.email
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === user.user_id ? (
                      <input
                        type="text"
                        name="pin"
                        value={formData.pin || ""}
                        onChange={handleChange}
                        placeholder="PIN (4-6 dígitos)"
                        className="rounded px-2 py-1 text-black"
                        maxLength={6}
                      />
                    ) : (
                      user.pin
                    )}
                  </td>
                  <td className="px-4 py-2 max-w-xs">
                    {editingId === user.user_id ? (
                      <textarea
                        name="description"
                        value={formData.description || ""}
                        onChange={handleChange}
                        placeholder="Descripción"
                        className="rounded px-2 py-1 text-black w-full"
                        rows={2}
                      />
                    ) : (
                      user.description
                    )}
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    {editingId === user.user_id ? (
                      <>
                        <button
                          onClick={saveChanges}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(user)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center p-4 text-gray-400">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <div className="fixed bottom-3 right-3 text-gray-400 text-xs bg-gray-900 p-2 rounded-md shadow-md">
        © 2025 by Encantia A.P. is licensed under CC BY-NC-ND 4.0.
      </div>
    </div>
  );
}
