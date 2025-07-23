import { useState, useEffect } from "react";
import { useRouter } from "next/router"; // IMPORTANTE para usar router
import { supabase } from "../../utils/supabaseClient";

export default function MusicManager() {
  const router = useRouter();
  const [musics, setMusics] = useState([]);
  const [form, setForm] = useState({
    categoria: "",
    musica_url: "",
    portada_url: "",
    titulo: "",
    autor: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Avatar para Navbar
  const avatarUrl = "https://i.ibb.co/d0mWy0kP/perfildef.png";

  const navButtons = [
    { icon: "https://dev.encantia.lat/navbar/home.png", name: "Inicio", url: "/" },
    { icon: "https://dev.encantia.lat/navbar/gestion.png", name: "Gestion", url: "/gestionar" },
    { icon: "https://dev.encantia.lat/navbar/ipersonal.png", name: "Tu Información", url: "/infow" },
  ];

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        alert("No estás logueado, no tienes acceso.");
        setLoading(false);
        return;
      }

      setUser(session.user);
      fetchMusics();
    };
    getUser();
  }, []);

  const fetchMusics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("musicas")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert("Error cargando música");
      console.error(error);
    } else {
      setMusics(data);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      alert("El título es obligatorio");
      return;
    }
    const { error } = await supabase.from("musicas").insert([{ ...form }]);
    if (error) {
      alert("Error creando música");
      console.error(error);
    } else {
      setForm({ categoria: "", musica_url: "", portada_url: "", titulo: "", autor: "" });
      fetchMusics();
    }
  };

  const handleSaveEdit = async (id) => {
    if (!form.titulo.trim()) {
      alert("El título es obligatorio");
      return;
    }
    const { error } = await supabase
      .from("musicas")
      .update({ ...form })
      .eq("id", id);
    if (error) {
      alert("Error guardando música");
      console.error(error);
    } else {
      setEditingId(null);
      setForm({ categoria: "", musica_url: "", portada_url: "", titulo: "", autor: "" });
      fetchMusics();
    }
  };

  const handleEdit = (music) => {
    setEditingId(music.id);
    setForm({
      categoria: music.categoria || "",
      musica_url: music.musica_url || "",
      portada_url: music.portada_url || "",
      titulo: music.titulo || "",
      autor: music.autor || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ categoria: "", musica_url: "", portada_url: "", titulo: "", autor: "" });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro quieres eliminar esta música?")) return;
    const { error } = await supabase.from("musicas").delete().eq("id", id);
    if (error) {
      alert("Error eliminando música");
      console.error(error);
    } else {
      fetchMusics();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) {
    return <p className="text-center mt-10 text-white">Acceso restringido. Por favor inicia sesión.</p>;
  }

  return (
    <>
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

      {/* Contenido principal */}
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col">
        <h1 className="text-3xl font-bold mb-6 text-center">Gestor de Música</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            editingId ? handleSaveEdit(editingId) : handleCreate(e);
          }}
          className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto"
        >
          <input
            type="text"
            name="categoria"
            placeholder="Categoría"
            value={form.categoria}
            onChange={handleChange}
            className="p-2 rounded bg-gray-700 text-white"
          />
          <input
            type="text"
            name="musica_url"
            placeholder="URL música"
            value={form.musica_url}
            onChange={handleChange}
            className="p-2 rounded bg-gray-700 text-white"
          />
          <input
            type="text"
            name="portada_url"
            placeholder="URL portada"
            value={form.portada_url}
            onChange={handleChange}
            className="p-2 rounded bg-gray-700 text-white"
          />
          <input
            type="text"
            name="titulo"
            placeholder="Título"
            value={form.titulo}
            onChange={handleChange}
            className="p-2 rounded bg-gray-700 text-white"
            required
          />
          <input
            type="text"
            name="autor"
            placeholder="Autor"
            value={form.autor}
            onChange={handleChange}
            className="p-2 rounded bg-gray-700 text-white"
          />

          <div className="col-span-1 md:col-span-3 flex justify-center gap-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
            >
              {editingId ? "Guardar" : "Crear"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="flex-1 overflow-auto max-w-6xl mx-auto">
          {loading ? (
            <p className="text-center">Cargando música...</p>
          ) : musics.length === 0 ? (
            <p className="text-center">No hay música aún.</p>
          ) : (
            <table className="w-full table-auto border-collapse border border-gray-600">
              <thead>
                <tr className="bg-gray-800">
                  <th className="border border-gray-600 p-2">ID</th>
                  <th className="border border-gray-600 p-2">Categoría</th>
                  <th className="border border-gray-600 p-2">Música URL</th>
                  <th className="border border-gray-600 p-2">Portada</th>
                  <th className="border border-gray-600 p-2">Título</th>
                  <th className="border border-gray-600 p-2">Autor</th>
                  <th className="border border-gray-600 p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {musics.map((music) => (
                  <tr
                    key={music.id}
                    className="even:bg-gray-800 odd:bg-gray-700 align-top"
                  >
                    <td className="border border-gray-600 p-2 text-center">{music.id}</td>

                    <td className="border border-gray-600 p-2">
                      {editingId === music.id ? (
                        <input
                          type="text"
                          name="categoria"
                          value={form.categoria}
                          onChange={handleChange}
                          className="p-1 rounded bg-gray-600 w-full text-white"
                        />
                      ) : (
                        music.categoria
                      )}
                    </td>

                    <td className="border border-gray-600 p-2 break-all max-w-xs">
                      {editingId === music.id ? (
                        <input
                          type="text"
                          name="musica_url"
                          value={form.musica_url}
                          onChange={handleChange}
                          className="p-1 rounded bg-gray-600 w-full text-white"
                        />
                      ) : music.musica_url ? (
                        <a href={music.musica_url} target="_blank" rel="noreferrer" className="underline text-blue-400">
                          Escuchar
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="border border-gray-600 p-2 text-center">
                      {editingId === music.id ? (
                        <input
                          type="text"
                          name="portada_url"
                          value={form.portada_url}
                          onChange={handleChange}
                          className="p-1 rounded bg-gray-600 w-full text-white"
                        />
                      ) : music.portada_url ? (
                        <img
                          src={music.portada_url}
                          alt="portada"
                          className="mx-auto h-16 object-contain"
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="border border-gray-600 p-2">
                      {editingId === music.id ? (
                        <input
                          type="text"
                          name="titulo"
                          value={form.titulo}
                          onChange={handleChange}
                          className="p-1 rounded bg-gray-600 w-full text-white"
                        />
                      ) : (
                        music.titulo
                      )}
                    </td>

                    <td className="border border-gray-600 p-2">
                      {editingId === music.id ? (
                        <input
                          type="text"
                          name="autor"
                          value={form.autor}
                          onChange={handleChange}
                          className="p-1 rounded bg-gray-600 w-full text-white"
                        />
                      ) : (
                        music.autor
                      )}
                    </td>

                    <td className="border border-gray-600 p-2 text-center space-x-2">
                      {editingId === music.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(music.id)}
                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(music)}
                            className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(music.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
