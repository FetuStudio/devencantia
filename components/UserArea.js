import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { supabase } from "../utils/supabaseClient";

export default function Navbar() {
  const [userProfile, setUserProfile] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombresyapellidos: "",
    fechadenacimiento: "",
    nacionalidad: "",
    uuid: "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [formError, setFormError] = useState("");
  const router = useRouter();

  // Carga datos de user y ownerinfo
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setFormError("");
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("No hay usuario logueado");

      // Perfil general
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (profileError) throw profileError;
      setUserProfile(profileData);

      // Owner info por uuid = user.id
      const { data: ownerData, error: ownerError } = await supabase
        .from("ownerinfo")
        .select("*")
        .eq("uuid", user.id)
        .single();

      if (ownerError && ownerError.code !== "PGRST116") throw ownerError; // PGRST116 = no encontrado

      if (ownerData) {
        setOwnerInfo(ownerData);
      } else {
        // No hay ownerInfo, prefill uuid en form
        setOwnerInfo(null);
        setFormData((f) => ({ ...f, uuid: user.id }));
      }
    } catch (error) {
      setFormError(error.message);
      setOwnerInfo(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const hour = new Date().getHours();
    let greetingText = "";

    if (hour >= 5 && hour < 12) {
      greetingText = "Buenos días";
    } else if (hour >= 12 && hour < 20) {
      greetingText = "Buenas tardes";
    } else {
      greetingText = "Buenas noches";
    }

    setGreeting(greetingText);
  }, []);

  // Actualiza formData
  const handleChange = (e) => {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Guarda formulario en ownerinfo
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validaciones simples
    if (
      !formData.nombresyapellidos.trim() ||
      !formData.fechadenacimiento ||
      !formData.nacionalidad.trim()
    ) {
      setFormError("Por favor completa todos los campos");
      return;
    }

    // Validación: fecha no debe ser del 2013 en adelante
    const birthYear = new Date(formData.fechadenacimiento).getFullYear();
    if (birthYear >= 2013) {
      setFormError("No tienes la edad suficiente para ingresar a la página.");
      return;
    }

    try {
      const { error: insertError } = await supabase.from("ownerinfo").insert([
        {
          nombresyapellidos: formData.nombresyapellidos,
          fechadenacimiento: formData.fechadenacimiento,
          nacionalidad: formData.nacionalidad,
          uuid: formData.uuid,
        },
      ]);
      if (insertError) throw insertError;

      // Refrescar datos tras insertar
      await fetchUserData();
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push("/");
  };

  const navButtons = [
    { icon: "https://dev.encantia.lat/navbar/home.png", name: "Inicio", url: "/" },
    { icon: "https://dev.encantia.lat/navbar/gestion.png", name: "Gestion", url: "/gestionar" },
    { icon: "https://dev.encantia.lat/navbar/ipersonal.png", name: "Tu Información", url: "/infow" },
  ];

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen flex justify-center items-center text-white">
        Cargando...
      </div>
    );
  }

  // Si no hay ownerInfo, mostrar formulario
  if (!ownerInfo) {
    return (
      <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl mb-4 font-semibold">Completa tu información</h1>
        {formError && <p className="text-red-500 mb-4">{formError}</p>}
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
          <div>
            <label htmlFor="nombresyapellidos" className="block mb-1 font-semibold">
              Nombres y Apellidos
            </label>
            <input
              type="text"
              name="nombresyapellidos"
              id="nombresyapellidos"
              value={formData.nombresyapellidos}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="fechadenacimiento" className="block mb-1 font-semibold">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              name="fechadenacimiento"
              id="fechadenacimiento"
              value={formData.fechadenacimiento}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              max={new Date().toISOString().split("T")[0]} // no fechas futuras
            />
          </div>

          <div>
            <label htmlFor="nacionalidad" className="block mb-1 font-semibold">
              Nacionalidad
            </label>
            <input
              type="text"
              name="nacionalidad"
              id="nacionalidad"
              value={formData.nacionalidad}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors py-2 rounded text-white font-semibold"
          >
            Guardar Información
          </button>
        </form>
      </div>
    );
  }

  // Si hay ownerInfo, mostramos contenido normal
  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Saludo centrado arriba */}
      {userProfile && (
        <div className="text-white text-center text-xl font-semibold py-6">
          {greeting}, {userProfile.name}
        </div>
      )}

      {/* Navegación inferior */}
      <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 flex items-center bg-gray-900 p-2 rounded-full shadow-lg space-x-4 w-max">
        <img
          src="https://images.encantia.lat/encantia-logo-2025.webp"
          alt="Logo"
          className="h-13 w-auto"
        />
        {navButtons.map((button, index) => (
          <div key={index} className="relative group">
            <button
              onClick={() => router.push(button.url)}
              className="p-2 rounded-full bg-gray-800 text-white text-xl transition-transform transform group-hover:scale-110"
            >
              <img src={button.icon} alt={button.name} className="w-8 h-8" />
            </button>
            <span className="absolute bottom-14 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-700 text-white text-xs rounded px-2 py-1 transition-opacity">
              {button.name}
            </span>
          </div>
        ))}
        {userProfile && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 rounded-full bg-gray-800 text-white text-xl hover:scale-110 transition-transform"
            >
              <img
                src={userProfile.avatar_url || "https://i.ibb.co/d0mWy0kP/perfildef.png"}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
            </button>
            {isDropdownOpen && (
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm rounded-lg shadow-md mt-2 w-40">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-700"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-3 right-3 text-gray-400 text-xs bg-gray-900 p-2 rounded-md shadow-md">
        © 2025 by Encantia A.P. is licensed under CC BY-NC-ND 4.0.
      </div>
    </div>
  );
}
