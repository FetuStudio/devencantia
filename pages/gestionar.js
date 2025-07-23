import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../utils/supabaseClient";

// Hook para cargar avatar del usuario
function useUserInfo() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    async function fetchAvatar() {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No user logged in");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", user.id)
          .single();

        if (profileError) throw profileError;

        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        } else {
          setAvatarUrl(null);
        }
      } catch (err) {
        setError(err.message || "Error fetching avatar");
      } finally {
        setLoading(false);
      }
    }

    fetchAvatar();
  }, []);

  return { loading, error, avatarUrl };
}

export default function Navbar() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { avatarUrl } = useUserInfo();

  const navButtons = [
    { icon: "https://dev.encantia.lat/navbar/home.png", name: "Inicio", url: "/" },
    { icon: "https://dev.encantia.lat/navbar/gestion.png", name: "Gestion", url: "/gestionar" },
    { icon: "https://dev.encantia.lat/navbar/ipersonal.png", name: "Tu Información", url: "/infow" },
  ];

  const textButtons = [
    { text: "Gestionar Eventos", url: "/gestionar/eventos" },
    { text: "Gestionar Usuarios", url: "/gestionar/usuarios" },
    { text: "Gestionar Musicas", url: "/gestionar/musicas" },
    { text: "Gestionar Libros", url: "/gestionar/libros" },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center">

      {/* Botones arriba */}
      <div className="fixed top-3 left-1/2 transform -translate-x-1/2 flex space-x-3 bg-gray-800 p-3 rounded-full shadow-lg z-50">
        {textButtons.map((btn, index) => (
          <button
            key={index}
            onClick={() => router.push(btn.url)}
            className="px-4 py-2 bg-blue-600 rounded-full text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            {btn.text}
          </button>
        ))}
      </div>

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
              src={avatarUrl || "https://i.ibb.co/d0mWy0kP/perfildef.png"}
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

      <div className="fixed bottom-3 right-3 text-gray-400 text-xs bg-gray-900 p-2 rounded-md shadow-md">
        © 2025 by Encantia A.P. is licensed under CC BY-NC-ND 4.0.
      </div>
    </div>
  );
}
