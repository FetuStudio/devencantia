import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../utils/supabaseClient";

export default function Navbar() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    name: "",
    date: "",
    description: "",
    winner: "",
    cover: "",
  });

  const [editingWinnerId, setEditingWinnerId] = useState(null);
  const [winnerInput, setWinnerInput] = useState("");
  const [loadingUser, setLoadingUser] = useState(true); // Nuevo estado para carga de usuario

  const avatarUrl = "https://i.ibb.co/d0mWy0kP/perfildef.png";

  const navButtons = [
    { icon: "https://dev.encantia.lat/navbar/home.png", name: "Inicio", url: "/" },
    { icon: "https://dev.encantia.lat/navbar/gestion.png", name: "Gestion", url: "/gestionar" },
    { icon: "https://dev.encantia.lat/navbar/ipersonal.png", name: "Tu Información", url: "/infow" },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: false });
    if (error) console.error("Error cargando eventos:", error);
    else setEvents(data);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date) return alert("Nombre y fecha son obligatorios");

    const { error } = await supabase.from("events").insert([form]);
    if (error) {
      alert("Error al crear evento");
      console.error(error);
    } else {
      setForm({ name: "", date: "", description: "", winner: "", cover: "" });
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este evento?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      alert("Error eliminando evento");
      console.error(error);
    } else {
      fetchEvents();
    }
  };

  const handleSaveWinner = async (id) => {
    if (!winnerInput.trim()) return;
    const { error } = await supabase.from("events").update({ winner: winnerInput }).eq("id", id);
    if (error) {
      alert("Error al guardar el ganador");
      console.error(error);
    } else {
      setEditingWinnerId(null);
      setWinnerInput("");
      fetchEvents();
    }
  };

  useEffect(() => {
    // Verificar usuario al cargar componente
    const checkUser = async () => {
      setLoadingUser(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
      } else {
        fetchEvents();
      }
      setLoadingUser(false);
    };

    checkUser();
  }, [router]);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Cargando...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center pb-32">
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
              onClick={() =>
                button.url.startsWith("http")
                  ? window.open(button.url)
                  : router.push(button.url)
              }
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

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-full bg-gray-800 hover:scale-110 focus:outline-none"
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
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm rounded-lg shadow-md mt-2 w-40 z-50">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-700"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gestión de eventos SIEMPRE visible */}
      <div className="w-full max-w-4xl mt-10 px-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Gestión de Eventos</h2>

        {/* Formulario */}
        <form
          onSubmit={handleCreateEvent}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          <input
            type="text"
            name="name"
            placeholder="Nombre del evento"
            value={form.name}
            onChange={handleInputChange}
            className="p-2 rounded bg-gray-700"
          />
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleInputChange}
            className="p-2 rounded bg-gray-700"
          />
          <input
            type="text"
            name="description"
            placeholder="Descripción"
            value={form.description}
            onChange={handleInputChange}
            className="p-2 rounded bg-gray-700"
          />
          <input
            type="text"
            name="winner"
            placeholder="Ganador"
            value={form.winner}
            onChange={handleInputChange}
            className="p-2 rounded bg-gray-700"
          />
          <input
            type="url"
            name="cover"
            placeholder="URL de portada"
            value={form.cover}
            onChange={handleInputChange}
            className="p-2 rounded bg-gray-700 col-span-1 md:col-span-2"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 col-span-1 md:col-span-2"
          >
            Crear evento
          </button>
        </form>

        {/* Lista de eventos */}
        <ul className="space-y-4">
          {events.map((event) => (
            <li
              key={event.id}
              className="bg-gray-700 rounded-lg p-4 flex flex-col md:flex-row md:justify-between gap-4"
            >
              <div className="flex gap-4 w-full md:w-auto flex-col md:flex-row">
                <img
                  src={event.cover}
                  alt={event.name}
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{event.name}</h3>
                  <p className="text-sm text-gray-300">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm">{event.description}</p>

                  {editingWinnerId === event.id ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={winnerInput}
                        onChange={(e) => setWinnerInput(e.target.value)}
                        placeholder="Nombre del ganador"
                        className="p-1 bg-gray-600 rounded text-sm"
                      />
                      <button
                        onClick={() => handleSaveWinner(event.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm rounded"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setEditingWinnerId(null);
                          setWinnerInput("");
                        }}
                        className="text-gray-400 text-sm hover:text-red-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : event.winner ? (
                    <div className="mt-2">
                      <p className="text-green-400 text-sm">
                        Ganador: {event.winner}
                      </p>
                      <button
                        onClick={() => {
                          setEditingWinnerId(event.id);
                          setWinnerInput(event.winner);
                        }}
                        className="text-blue-400 hover:text-blue-200 text-xs mt-1"
                      >
                        Editar ganador
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingWinnerId(event.id)}
                      className="text-blue-400 hover:text-blue-200 text-sm mt-2"
                    >
                      Añadir ganador
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDeleteEvent(event.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded self-start md:self-center"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="fixed bottom-3 right-3 text-gray-400 text-xs bg-gray-900 p-2 rounded-md shadow-md">
        © 2025 by Encantia A.P. is licensed under CC BY-NC-ND 4.0.
      </div>
    </div>
  );
}
