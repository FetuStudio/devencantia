import { useState, useEffect } from "react";
import { useRouter } from "next/router";  // Agregar importación useRouter
import { supabase } from "../../utils/supabaseClient";

export default function BooksManager() {
  const router = useRouter(); // Instanciamos router

  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    cover_url: "",
    portada_url: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para usuario y carga de auth
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Estado para dropdown navbar
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Navbar data
  const avatarUrl = "https://i.ibb.co/d0mWy0kP/perfildef.png";
  const navButtons = [
    { icon: "https://dev.encantia.lat/navbar/home.png", name: "Inicio", url: "/" },
    { icon: "https://dev.encantia.lat/navbar/gestion.png", name: "Gestion", url: "/gestion" },
    { icon: "https://dev.encantia.lat/navbar/ipersonal.png", name: "Tu Información", url: "/infow" },
  ];

  // Verificar usuario logueado al montar el componente
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error obteniendo usuario", error);
      }
      setUser(user);
      setAuthLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Cargar libros solo si hay usuario
  const fetchBooks = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error cargando libros");
      console.error(error);
    } else {
      setBooks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [user]);

  // Cambiar inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Crear libro nuevo
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("El título es obligatorio");
      return;
    }
    const { error } = await supabase.from("books").insert([{ ...form }]);
    if (error) {
      alert("Error creando libro");
      console.error(error);
    } else {
      setForm({ title: "", description: "", cover_url: "", portada_url: "" });
      fetchBooks();
    }
  };

  // Guardar edición
  const handleSaveEdit = async (id) => {
    if (!form.title.trim()) {
      alert("El título es obligatorio");
      return;
    }
    const { error } = await supabase
      .from("books")
      .update({ ...form })
      .eq("id", id);
    if (error) {
      alert("Error guardando libro");
      console.error(error);
    } else {
      setEditingId(null);
      setForm({ title: "", description: "", cover_url: "", portada_url: "" });
      fetchBooks();
    }
  };

  // Editar libro (cargar datos en form)
  const handleEdit = (book) => {
    setEditingId(book.id);
    setForm({
      title: book.title || "",
      description: book.description || "",
      cover_url: book.cover_url || "",
      portada_url: book.portada_url || "",
    });
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", description: "", cover_url: "", portada_url: "" });
  };

  // Eliminar libro
  const handleDelete = async (id) => {
    if (!confirm("¿Seguro quieres eliminar este libro?")) return;
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) {
      alert("Error eliminando libro");
      console.error(error);
    } else {
      fetchBooks();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (authLoading) {
    return <p className="text-center mt-20">Verificando sesión...</p>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        <p>No estás autorizado. Por favor inicia sesión para acceder.</p>
      </div>
    );
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
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col pt-16">
        <h1 className="text-3xl font-bold mb-6 text-center">Gestor de Libros</h1>

        {/* Form para crear o editar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            editingId ? handleSaveEdit(editingId) : handleCreate(e);
          }}
          className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto"
        >
          <input
            type="text"
            name="title"
            placeholder="Título"
            value={form.title}
            onChange={handleChange}
            className="p-2 rounded bg-gray-700 text-white"
            required
          />
          <input
            type="text"
            name="cover_url"
            placeholder="URL cover"
            value={form.cover_url}
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
          <textarea
            name="description"
            placeholder="Descripción"
            value={form.description}
            onChange={handleChange}
            className="p-2 rounded bg-gray-700 text-white col-span-1 md:col-span-2 h-24 resize-none"
          />

          <div className="col-span-1 md:col-span-2 flex justify-center gap-4">
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

        {/* Tabla de libros */}
        <div className="flex-1 overflow-auto max-w-6xl mx-auto">
          {loading ? (
            <p className="text-center">Cargando libros...</p>
          ) : books.length === 0 ? (
            <p className="text-center">No hay libros aún.</p>
          ) : (
            <table className="w-full table-auto border-collapse border border-gray-600">
              <thead>
                <tr className="bg-gray-800">
                  <th className="border border-gray-600 p-2">ID</th>
                  <th className="border border-gray-600 p-2">Título</th>
                  <th className="border border-gray-600 p-2">Descripción</th>
                  <th className="border border-gray-600 p-2">Creado</th>
                  <th className="border border-gray-600 p-2">Cover</th>
                  <th className="border border-gray-600 p-2">Portada</th>
                  <th className="border border-gray-600 p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr
                    key={book.id}
                    className="even:bg-gray-800 odd:bg-gray-700 align-top"
                  >
                    <td className="border border-gray-600 p-2 text-center">
                      {book.id}
                    </td>

                    <td className="border border-gray-600 p-2">
                      {editingId === book.id ? (
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, title: e.target.value }))
                          }
                          className="p-1 rounded bg-gray-600 w-full text-white"
                        />
                      ) : (
                        book.title
                      )}
                    </td>

                    <td className="border border-gray-600 p-2 max-w-xs break-words">
                      {editingId === book.id ? (
                        <textarea
                          value={form.description}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                          className="p-1 rounded bg-gray-600 w-full text-white resize-none"
                          rows={3}
                        />
                      ) : (
                        book.description
                      )}
                    </td>

                    <td className="border border-gray-600 p-2 text-center">
                      {new Date(book.created_at).toLocaleString()}
                    </td>

                    <td className="border border-gray-600 p-2 text-center">
                      {editingId === book.id ? (
                        <input
                          type="text"
                          value={form.cover_url}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, cover_url: e.target.value }))
                          }
                          className="p-1 rounded bg-gray-600 w-full text-white"
                        />
                      ) : book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt="cover"
                          className="mx-auto h-16 object-contain"
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="border border-gray-600 p-2 text-center">
                      {editingId === book.id ? (
                        <input
                          type="text"
                          value={form.portada_url}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, portada_url: e.target.value }))
                          }
                          className="p-1 rounded bg-gray-600 w-full text-white"
                        />
                      ) : book.portada_url ? (
                        <img
                          src={book.portada_url}
                          alt="portada"
                          className="mx-auto h-16 object-contain"
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="border border-gray-600 p-2 text-center space-x-2">
                      {editingId === book.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(book.id)}
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
                            onClick={() => handleEdit(book)}
                            className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(book.id)}
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
