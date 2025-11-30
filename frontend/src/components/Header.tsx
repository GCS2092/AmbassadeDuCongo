import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { FiMenu, FiX, FiUser, FiLogOut, FiChevronDown, FiHome, FiFileText, FiSettings, FiCalendar, FiClipboard, FiBell, FiShield } from 'react-icons/fi'
import PersonalQRCode from './PersonalQRCode'
import ProtectedFeatureLink from './ProtectedFeatureLink'
import { 
  getDefaultRoute, 
  canAccessRoute, 
  canCreateApplications, 
  canCreateAppointments,
  canAccessAdmin,
  canAccessVigile,
  UserRole 
} from '../lib/permissions'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showPersonalQR, setShowPersonalQR] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to={isAuthenticated ? getDefaultRoute(user?.role as UserRole) : '/'} 
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">🇨🇬</span>
            </div>
            <div className="hidden md:block">
              <div className="text-lg font-bold text-gray-900">Ambassade du Congo</div>
              <div className="text-xs text-gray-600">République du Congo - Sénégal</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {/* Liens publics - seulement pour non-connectés et citoyens */}
            {(!isAuthenticated || user?.role === 'CITIZEN') && (
              <>
            <Link to="/" className="text-gray-700 hover:text-primary-500 transition">
              Accueil
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-primary-500 transition">
              Services
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-primary-500 transition">
              Contact
            </Link>
            <Link to="/faq" className="text-gray-700 hover:text-primary-500 transition">
              FAQ
            </Link>
            <Link to="/announcements" className="text-gray-700 hover:text-primary-500 transition">
              Actualités
            </Link>
              </>
            )}
            
            {isAuthenticated ? (
              <>
                <div className="relative group">
                  <button className="text-gray-700 hover:text-primary-500 transition flex items-center space-x-1">
                    <span>Mon Espace</span>
                    <FiChevronDown size={16} />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      {/* Lien tableau de bord selon le rôle */}
                      <Link 
                        to={getDefaultRoute(user?.role as UserRole)} 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FiHome size={16} />
                        <span>Tableau de bord</span>
                      </Link>

                      {/* Pour ADMIN/SUPERADMIN : afficher uniquement les liens admin */}
                      {canAccessAdmin(user?.role as UserRole) ? (
                        <>
                          {canAccessRoute(user?.role as UserRole, '/admin') && (
                        <Link to="/admin" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiSettings size={16} />
                          <span>Dashboard Admin</span>
                        </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/admin/users') && (
                            <Link to="/admin/users" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiSettings size={16} />
                              <span>Gestion Utilisateurs</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/admin/applications') && (
                            <Link to="/admin/applications" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiClipboard size={16} />
                              <span>Gestion Demandes</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/admin/access-logs') && (
                            <Link to="/admin/access-logs" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiBell size={16} />
                              <span>Logs d'Accès</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/admin/site-settings') && (
                            <Link to="/admin/site-settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiSettings size={16} />
                              <span>Paramètres du Site</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/admin/announcements') && (
                            <Link to="/admin/announcements" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiBell size={16} />
                              <span>Actualités</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/profile') && (
                            <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiSettings size={16} />
                              <span>Mon Profil</span>
                            </Link>
                          )}
                        </>
                      ) : user?.role === 'VIGILE' ? (
                        <>
                          {/* Pour VIGILE : afficher uniquement les liens vigile */}
                          {canAccessRoute(user?.role as UserRole, '/vigile') && (
                        <Link to="/vigile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                          <FiHome size={16} />
                          <span>Dashboard Vigile</span>
                        </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/security/scanner') && (
                            <Link to="/security/scanner" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiShield size={16} />
                              <span>Scanner QR</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/security/today') && (
                            <Link to="/security/today" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiShield size={16} />
                              <span>Scans du jour</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/profile') && (
                            <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiSettings size={16} />
                              <span>Mon Profil</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/my-qr-code') && (
                            <Link to="/my-qr-code" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiShield size={16} />
                              <span>Mon QR Code</span>
                            </Link>
                          )}
                        </>
                      ) : user?.role === 'AGENT_RDV' ? (
                        <>
                          {/* Pour AGENT_RDV : menu agent rendez-vous (pas de création d'applications) */}
                          {canAccessRoute(user?.role as UserRole, '/profile') && (
                            <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiSettings size={16} />
                              <span>Mon Profil</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/identity') && (
                            <Link to="/identity" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiUser size={16} />
                              <span>Mon Identité Numérique</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/documents') && (
                            <Link to="/documents" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiFileText size={16} />
                              <span>Mes Documents</span>
                            </Link>
                          )}
                          <div className="border-t border-gray-200 my-1"></div>
                          {canAccessRoute(user?.role as UserRole, '/appointments') && canCreateAppointments(user?.role as UserRole) && (
                            <Link to="/appointments" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiCalendar size={16} />
                              <span>Gestion Rendez-vous</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/applications') && (
                            <Link to="/applications" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiClipboard size={16} />
                              <span>Consultation Demandes</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/reminders') && (
                            <Link to="/reminders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiBell size={16} />
                              <span>Mes Rappels</span>
                            </Link>
                          )}
                          <Link to="/notifications" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                            <FiBell size={16} />
                            <span>Notifications</span>
                          </Link>
                          <div className="border-t border-gray-200 my-1"></div>
                          {canAccessRoute(user?.role as UserRole, '/my-qr-code') && (
                            <Link to="/my-qr-code" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiShield size={16} />
                              <span>Mon QR Code</span>
                            </Link>
                          )}
                        </>
                      ) : user?.role === 'AGENT_CONSULAIRE' ? (
                        <>
                          {/* Pour AGENT_CONSULAIRE : menu agent consulaire (peut créer des applications) */}
                          {canAccessRoute(user?.role as UserRole, '/profile') && (
                            <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiSettings size={16} />
                              <span>Mon Profil</span>
                        </Link>
                      )}
                          {canAccessRoute(user?.role as UserRole, '/identity') && (
                      <Link to="/identity" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                        <FiUser size={16} />
                        <span>Mon Identité Numérique</span>
                      </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/documents') && (
                      <Link to="/documents" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                        <FiFileText size={16} />
                        <span>Mes Documents</span>
                      </Link>
                          )}
                          <div className="border-t border-gray-200 my-1"></div>
                          {canAccessRoute(user?.role as UserRole, '/appointments') && canCreateAppointments(user?.role as UserRole) && (
                            <Link to="/appointments" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiCalendar size={16} />
                              <span>Gestion Rendez-vous</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/applications') && canCreateApplications(user?.role as UserRole) && (
                            <Link to="/applications" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiClipboard size={16} />
                              <span>Gestion Demandes</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/reminders') && (
                            <Link to="/reminders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiBell size={16} />
                              <span>Mes Rappels</span>
                            </Link>
                          )}
                          <Link to="/notifications" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                            <FiBell size={16} />
                            <span>Notifications</span>
                          </Link>
                          <div className="border-t border-gray-200 my-1"></div>
                          {canAccessRoute(user?.role as UserRole, '/my-qr-code') && (
                            <Link to="/my-qr-code" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiShield size={16} />
                              <span>Mon QR Code</span>
                            </Link>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Pour CITIZEN : menu citoyen complet */}
                          {canAccessRoute(user?.role as UserRole, '/profile') && (
                      <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                        <FiSettings size={16} />
                        <span>Mon Profil</span>
                      </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/identity') && (
                            <Link to="/identity" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiUser size={16} />
                              <span>Mon Identité Numérique</span>
                            </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/documents') && (
                            <Link to="/documents" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                              <FiFileText size={16} />
                              <span>Mes Documents</span>
                            </Link>
                          )}
                      <div className="border-t border-gray-200 my-1"></div>
                          {canAccessRoute(user?.role as UserRole, '/appointments') && canCreateAppointments(user?.role as UserRole) && (
                      <Link to="/appointments" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                        <FiCalendar size={16} />
                        <span>Mes Rendez-vous</span>
                      </Link>
                          )}
                          {canAccessRoute(user?.role as UserRole, '/applications') && canCreateApplications(user?.role as UserRole) && (
                        <Link to="/applications" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                          <FiClipboard size={16} />
                          <span>Mes Demandes</span>
                        </Link>
                      )}
                          {canAccessRoute(user?.role as UserRole, '/reminders') && (
                      <Link to="/reminders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                        <FiBell size={16} />
                        <span>Mes Rappels</span>
                      </Link>
                          )}
                          <Link to="/notifications" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                            <FiBell size={16} />
                            <span>Notifications</span>
                          </Link>
                      <div className="border-t border-gray-200 my-1"></div>
                          {canAccessRoute(user?.role as UserRole, '/my-qr-code') && (
                      <Link to="/my-qr-code" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                        <FiShield size={16} />
                        <span>Mon QR Code</span>
                      </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu compte: masquer les liens admin pour non-admin */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-500">
                    <FiUser />
                    <span>{user?.first_name || 'Mon compte'}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                    {canAccessRoute(user?.role as UserRole, '/profile') && (
                    <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Profil
                      </Link>
                    )}
                    
                    {/* Menu spécifique selon le rôle */}
                    {canAccessAdmin(user?.role as UserRole) ? (
                      <>
                        {canAccessRoute(user?.role as UserRole, '/admin') && (
                        <Link to="/admin" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                          <FiSettings size={14} />
                          <span>Administration</span>
                        </Link>
                        )}
                      </>
                    ) : user?.role === 'VIGILE' ? (
                      <>
                        {canAccessRoute(user?.role as UserRole, '/vigile') && (
                      <Link to="/vigile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                        <FiShield size={14} />
                        <span>Tableau Vigile</span>
                      </Link>
                    )}
                        {canAccessRoute(user?.role as UserRole, '/security/scanner') && (
                          <Link to="/security/scanner" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                            <FiShield size={14} />
                            <span>Scanner QR</span>
                          </Link>
                        )}
                      </>
                    ) : user?.role === 'AGENT_RDV' ? (
                      <>
                        {canAccessRoute(user?.role as UserRole, '/appointments') && canCreateAppointments(user?.role as UserRole) && (
                          <Link to="/appointments" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            Gestion Rendez-vous
                          </Link>
                        )}
                        {canAccessRoute(user?.role as UserRole, '/applications') && (
                          <Link to="/applications" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            Consultation Demandes
                          </Link>
                        )}
                      </>
                    ) : user?.role === 'AGENT_CONSULAIRE' ? (
                      <>
                        {canAccessRoute(user?.role as UserRole, '/appointments') && canCreateAppointments(user?.role as UserRole) && (
                          <Link to="/appointments" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            Gestion Rendez-vous
                          </Link>
                        )}
                        {canAccessRoute(user?.role as UserRole, '/applications') && canCreateApplications(user?.role as UserRole) && (
                          <Link to="/applications" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            Gestion Demandes
                          </Link>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Pour CITIZEN */}
                        {canAccessRoute(user?.role as UserRole, '/appointments') && canCreateAppointments(user?.role as UserRole) && (
                          <Link to="/appointments" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            Mes rendez-vous
                          </Link>
                        )}
                        {canAccessRoute(user?.role as UserRole, '/applications') && canCreateApplications(user?.role as UserRole) && (
                          <Link to="/applications" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            Mes demandes
                          </Link>
                        )}
                      </>
                    )}
                    
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FiLogOut />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline">
                  Connexion
                </Link>
                <ProtectedFeatureLink to="/register" feature="registration" className="btn-primary">
                  Inscription
                </ProtectedFeatureLink>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-primary-500"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            {/* Liens publics - seulement pour non-connectés et citoyens */}
            {(!isAuthenticated || user?.role === 'CITIZEN') && (
              <>
            <Link to="/" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Accueil</Link>
            <Link to="/services" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Services</Link>
            <Link to="/contact" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Contact</Link>
            <Link to="/faq" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
            <Link to="/announcements" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Actualités</Link>
              </>
            )}
            
            {isAuthenticated ? (
              <>
                {/* Lien Tableau de bord selon le rôle */}
                <Link
                  to={getDefaultRoute(user?.role as UserRole)} 
                  className="block py-2 text-gray-700 hover:text-primary-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tableau de bord
                </Link>
                
                {/* Pour ADMIN/SUPERADMIN : afficher uniquement les liens admin */}
                {canAccessAdmin(user?.role as UserRole) ? (
                  <>
                    {canAccessRoute(user?.role as UserRole, '/admin') && (
                      <Link to="/admin" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Administration</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/admin/users') && (
                      <Link to="/admin/users" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Gestion Utilisateurs</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/admin/applications') && (
                      <Link to="/admin/applications" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Gestion Demandes</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/admin/access-logs') && (
                      <Link to="/admin/access-logs" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Logs d'Accès</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/admin/site-settings') && (
                      <Link to="/admin/site-settings" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Paramètres du Site</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/admin/announcements') && (
                      <Link to="/admin/announcements" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Actualités</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/security/scanner') && (
                      <Link to="/security/scanner" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Scanner Sécurité</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/profile') && (
                      <Link to="/profile" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mon Profil</Link>
                    )}
                  </>
                ) : user?.role === 'VIGILE' ? (
                  <>
                    {/* Pour VIGILE : afficher uniquement les liens vigile */}
                    {canAccessRoute(user?.role as UserRole, '/vigile') && (
                      <Link to="/vigile" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Dashboard Vigile</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/security/scanner') && (
                    <Link to="/security/scanner" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Scanner QR</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/security/today') && (
                    <Link to="/security/today" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Scans du jour</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/profile') && (
                      <Link to="/profile" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mon Profil</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/my-qr-code') && (
                      <Link to="/my-qr-code" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mon QR Code</Link>
                    )}
                  </>
                ) : user?.role === 'AGENT_RDV' ? (
                  <>
                    {/* Pour AGENT_RDV : menu agent rendez-vous */}
                    {canAccessRoute(user?.role as UserRole, '/profile') && (
                      <Link to="/profile" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Profil</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/identity') && (
                      <Link to="/identity" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mon Identité Numérique</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/documents') && (
                      <Link to="/documents" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mes Documents</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/appointments') && canCreateAppointments(user?.role as UserRole) && (
                      <Link to="/appointments" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Gestion Rendez-vous</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/applications') && (
                      <Link to="/applications" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Consultation Demandes</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/reminders') && (
                      <Link to="/reminders" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mes Rappels</Link>
                    )}
                    <Link to="/notifications" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Notifications</Link>
                    {canAccessRoute(user?.role as UserRole, '/my-qr-code') && (
                      <Link to="/my-qr-code" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mon QR Code</Link>
                    )}
                  </>
                ) : user?.role === 'AGENT_CONSULAIRE' ? (
                  <>
                    {/* Pour AGENT_CONSULAIRE : menu agent consulaire */}
                    {canAccessRoute(user?.role as UserRole, '/profile') && (
                      <Link to="/profile" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Profil</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/identity') && (
                      <Link to="/identity" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mon Identité Numérique</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/documents') && (
                      <Link to="/documents" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mes Documents</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/appointments') && canCreateAppointments(user?.role as UserRole) && (
                      <Link to="/appointments" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Gestion Rendez-vous</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/applications') && canCreateApplications(user?.role as UserRole) && (
                      <Link to="/applications" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Gestion Demandes</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/reminders') && (
                      <Link to="/reminders" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mes Rappels</Link>
                    )}
                    <Link to="/notifications" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Notifications</Link>
                    {canAccessRoute(user?.role as UserRole, '/my-qr-code') && (
                      <Link to="/my-qr-code" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mon QR Code</Link>
                    )}
                  </>
                ) : (
                  <>
                    {/* Pour CITIZEN : menu citoyen complet */}
                    {canAccessRoute(user?.role as UserRole, '/profile') && (
                      <Link to="/profile" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Profil</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/identity') && (
                      <Link to="/identity" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mon Identité Numérique</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/documents') && (
                      <Link to="/documents" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mes Documents</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/appointments') && canCreateAppointments(user?.role as UserRole) && (
                      <Link to="/appointments" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mes rendez-vous</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/applications') && canCreateApplications(user?.role as UserRole) && (
                      <Link to="/applications" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mes demandes</Link>
                    )}
                    {canAccessRoute(user?.role as UserRole, '/reminders') && (
                      <Link to="/reminders" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mes Rappels</Link>
                    )}
                    <Link to="/notifications" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Notifications</Link>
                    {canAccessRoute(user?.role as UserRole, '/my-qr-code') && (
                      <Link to="/my-qr-code" className="block py-2 text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>Mon QR Code</Link>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left py-2 text-red-600"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-gray-700 hover:text-primary-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Connexion
                </Link>
                <ProtectedFeatureLink
                  to="/register"
                  feature="registration"
                  className="block py-2 text-gray-700 hover:text-primary-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Inscription
                </ProtectedFeatureLink>
              </>
            )}
          </nav>
        )}
      </div>

      {/* Personal QR Code Modal */}
      {showPersonalQR && (
        <PersonalQRCode onClose={() => setShowPersonalQR(false)} />
      )}
    </header>
  )
}

