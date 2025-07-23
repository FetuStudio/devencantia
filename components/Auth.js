import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';

export default function Auth() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const handleAuth = async () => {
        setLoading(true);
        setErrorMessage(null);

        if (!email || !password) {
            setErrorMessage('Correo y contraseña son obligatorios.');
            setLoading(false);
            return;
        }

        try {
            // 1. Intentar login
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;

            // 2. Si login OK, verificar si email está en ownerlogin
            const { data: owners, error: ownersError } = await supabase
                .from('ownerlogin')
                .select('correo')
                .eq('correo', email)
                .limit(1)
                .single();

            if (ownersError || !owners) {
                // No está en la tabla ownerlogin: cerrar sesión y mostrar error
                await supabase.auth.signOut();
                setErrorMessage('No tienes el rol suficiente para ingresar en esta página.');
                setLoading(false);
                return;
            }

            // 3. Si sí está, redirigir al inicio
            router.push('/');
        } catch (e) {
            setErrorMessage(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 h-screen flex items-center justify-center relative">
            {errorMessage && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-black p-3 rounded shadow-lg flex justify-between items-center">
                    <span>{errorMessage}</span>
                    <button
                        className="ml-4 font-bold hover:bg-gray-300 px-2 rounded"
                        onClick={() => setErrorMessage(null)}
                    >
                        X
                    </button>
                </div>
            )}

            <div className="max-w-sm w-full border border-gray-700 rounded p-6 bg-gray-800">
                <div className="flex flex-col items-center mb-4">
                    <h2 className="text-white text-xl font-bold mb-2">Encantia A.P.</h2>
                    <img
                        src="https://images.encantia.lat/encantia-logo-2025.webp"
                        alt="Logo de Encatia"
                        className="h-25"
                    />
                </div>

                <h1 className="text-center text-white text-2xl">
                    Iniciar sesión
                </h1>

                <div className="field mt-4">
                    <label htmlFor="email" className="text-white block text-sm">Correo electrónico</label>
                    <div className="flex items-center">
                        <input
                            type="email"
                            className="p-2 border border-gray-600 w-full rounded bg-gray-700 text-white placeholder-gray-400"
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            placeholder="Correo electrónico"
                        />
                        <img src="https://images.encantia.lat/email.png" alt="Correo" className="w-6 h-6 ml-2" />
                    </div>
                </div>

                <div className="field mt-4">
                    <label htmlFor="password" className="text-white block text-sm">Contraseña</label>
                    <div className="flex items-center">
                        <input
                            type={passwordVisible ? "text" : "password"}
                            className="p-2 border border-gray-600 w-full rounded bg-gray-700 text-white placeholder-gray-400"
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            placeholder="Contraseña"
                        />
                        <img src="https://images.encantia.lat/password.png" alt="Contraseña" className="w-6 h-6 ml-2" />
                        <button
                            type="button"
                            className="ml-2 text-white"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                            <img
                                src={passwordVisible ? "https://images.encantia.lat/upass.png" : "https://images.encantia.lat/vpass.png"}
                                alt={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                                className="w-6 h-6"
                            />
                        </button>
                    </div>
                </div>

                <button
                    className="border p-2 w-full mt-5 rounded bg-blue-600 text-white flex justify-center items-center relative"
                    onClick={handleAuth}
                    disabled={loading}
                >
                    {loading ? (
                        <img
                            src="https://images.encantia.lat/loading.gif"
                            alt="Cargando..."
                            className="w-6 h-6"
                        />
                    ) : 'Iniciar sesión'}
                </button>
            </div>

            <div className="absolute bottom-4 right-4 text-xs flex items-center gap-1">
                <span className="text-white">Powered by</span>
                <span className="bg-green-400 py-1 px-2 rounded-xl">Encantia</span>
            </div>
        </div>
    );
}
