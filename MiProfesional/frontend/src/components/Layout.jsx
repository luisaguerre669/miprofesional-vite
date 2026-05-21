import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut, Home, Search, MessageSquare, LayoutDashboard, Bell, CreditCard, Settings, Shield, Plus, LogIn, Building2, Wrench } from 'lucide-react';
import Logo from './Logo';

const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [scrolled, setScrolled] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const { user, isAuthenticated, logout, isProfessional } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-top ${
        scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Logo variant="horizontal" />

            <nav className="hidden lg:flex items-center space-x-1">
              {[
                { name: 'Inicio', path: '/', icon: Home },
                { name: 'Buscar', path: '/search', icon: Search },
                { name: 'Construcción', path: '/categoria/construccion-y-hogar', icon: Building2 },
                { name: 'Servicios', path: '/categoria/servicios-generales', icon: Wrench },
                ...(user?.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
              ].map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link key={link.path} to={link.path}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={17} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link to="/messages"
                    className="p-2.5 rounded-xl text-gray-500 hover:text-primary-600 hover:bg-gray-100 transition-all relative"
                  >
                    <MessageSquare size={20} />
                  </Link>
                  <Link to="/notifications"
                    className="p-2.5 rounded-xl text-gray-500 hover:text-primary-600 hover:bg-gray-100 transition-all relative"
                  >
                    <Bell size={20} />
                  </Link>
                  {!isProfessional && (
                    <Link to="/register?role=professional"
                      className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all shadow-lg"
                    >
                      <Plus size={16} />
                      Publicar Servicio
                    </Link>
                  )}
                  <div className="relative flex items-center gap-2 pl-2 border-l border-gray-200">
                    <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="hidden xl:block text-left">
                        <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name || 'Usuario'}</p>
                        <p className="text-xs text-gray-400 capitalize">{user?.role || 'client'}</p>
                      </div>
                    </button>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20 animate-fade-in-down">
                          <Link to={isProfessional ? "/dashboard/professional" : "/dashboard/client"} onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <LayoutDashboard size={16} /> Dashboard
                          </Link>
                          <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <User size={16} /> Mi Perfil
                          </Link>
                          <Link to="/subscriptions" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <CreditCard size={16} /> Suscripcion
                          </Link>
                          <Link to="/settings" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <Settings size={16} /> Configuracion
                          </Link>
                          {user?.role === 'admin' && (
                            <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                              <Shield size={16} /> Admin Panel
                            </Link>
                          )}
                          <div className="border-t border-gray-100 my-1" />
                          <button onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full">
                            <LogOut size={16} /> Cerrar Sesion
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login"
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link to="/register"
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all shadow-lg"
                  >
                    Registrarse
                  </Link>
                  <Link to="/register?role=professional"
                    className="px-5 py-2.5 border-2 border-primary-600 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-50 transition-all"
                  >
                    Soy Profesional
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2.5 rounded-xl transition-all ${
                mobileMenuOpen ? 'bg-gray-100' : scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white shadow-xl animate-fade-in-down">
            <div className="px-4 py-4 space-y-1">
              <form onSubmit={handleSearch} className="relative mb-4">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar servicios..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </form>

              {[
                { name: 'Inicio', path: '/', icon: Home },
                { name: 'Buscar', path: '/search', icon: Search },
                { name: 'Mensajes', path: '/messages', icon: MessageSquare },
                { name: 'Dashboard', path: isAuthenticated ? (isProfessional ? '/dashboard/professional' : '/dashboard/client') : '/login', icon: LayoutDashboard },
              ].map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link key={link.path} to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}

              <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <User size={18} />
                      <span>Mi Perfil</span>
                    </Link>
                    <Link to="/subscriptions" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <CreditCard size={18} />
                      <span>Suscripción</span>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100"
                      >
                        <Shield size={18} />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut size={18} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100"
                    >
                      <LogIn size={18} />
                      <span>Iniciar Sesión</span>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus size={18} />
                      <span>Registrarse</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="h-16 md:h-20" />

      <main>{children}</main>

      <footer className="bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
            <div className="col-span-2 md:col-span-3 lg:col-span-2">
              <Logo className="mb-4" />
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
                Marketplace de servicios profesionales. Conectamos a los mejores expertos con quienes más los necesitan. Todo desde una plataforma segura.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Categorías</h3>
              <ul className="space-y-2.5">
                <li><Link to="/categoria/construccion-y-hogar" className="text-gray-400 text-sm hover:text-white transition-colors">Construcción y Hogar</Link></li>
                <li><Link to="/categoria/servicios-generales" className="text-gray-400 text-sm hover:text-white transition-colors">Servicios Generales</Link></li>
                <li><Link to="/categoria/salud" className="text-gray-400 text-sm hover:text-white transition-colors">Salud</Link></li>
                <li><Link to="/categoria/profesionales" className="text-gray-400 text-sm hover:text-white transition-colors">Profesionales</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Clientes</h3>
              <ul className="space-y-2.5">
                <li><Link to="/search" className="text-gray-400 text-sm hover:text-white transition-colors">Buscar Servicios</Link></li>
                <li><Link to="/register" className="text-gray-400 text-sm hover:text-white transition-colors">Crear Cuenta</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Profesionales</h3>
              <ul className="space-y-2.5">
                <li><Link to="/register?role=professional" className="text-gray-400 text-sm hover:text-white transition-colors">Registrarse</Link></li>
                <li><Link to="/register?role=professional" className="text-gray-400 text-sm hover:text-white transition-colors">Planes de suscripcion</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Legal</h3>
              <ul className="space-y-2.5">
                <li><Link to="#" className="text-gray-400 text-sm hover:text-white transition-colors">Términos</Link></li>
                <li><Link to="#" className="text-gray-400 text-sm hover:text-white transition-colors">Privacidad</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-xs">
                MiProfesional.com &mdash; Plataforma de conexion entre clientes y profesionales
              </p>
              <p className="text-gray-500 text-xs">
                Suscripcion desde $10.000 ARS / mes
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-800/50">
              <p className="text-gray-600 text-[11px] max-w-2xl text-center sm:text-left">
                La plataforma no garantiza trabajo, no gestiona pagos, no interviene en transacciones ni conflictos. Toda relacion contractual es exclusivamente entre el cliente y el profesional. MiProfesional actua unicamente como intermediario de contacto.
              </p>
              <div className="flex gap-6 text-xs text-gray-500 shrink-0">
                <Link to="#" className="hover:text-white transition-colors">Privacidad</Link>
                <Link to="#" className="hover:text-white transition-colors">Terminos</Link>
              </div>
            </div>
            <p className="text-gray-600 text-[10px] text-center pt-2">
              &copy; {new Date().getFullYear()} MiProfesional. Desarrollado por Luis Aguerre.
            </p>
          </div>
        </div>
      </footer>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
              {[
                { name: 'Inicio', path: '/', icon: Home },
                { name: 'Buscar', path: '/search', icon: Search },
                { name: 'Dashboard', path: isAuthenticated ? (isProfessional ? '/dashboard/professional' : '/dashboard/client') : '/login', icon: LayoutDashboard },
                ...(user?.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: Shield }] : [{ name: isAuthenticated ? 'Perfil' : 'Ingresar', path: isAuthenticated ? '/profile' : '/login', icon: User }]),
              ].map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[64px] ${
                  isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="lg:hidden h-16" />
    </div>
  );
};

export default Layout;
