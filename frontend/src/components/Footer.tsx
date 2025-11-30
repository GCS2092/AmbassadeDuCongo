import { Link } from 'react-router-dom'
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <FiMapPin className="mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Ambassade de la République du Congo</p>
                  <p className="text-gray-400 text-sm">
                    Stèle Mermoz, Pyrotechnie<br />
                    P.O. Box 5243, Dakar, Sénégal
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiPhone />
                <div>
                  <p>+221 824 8398</p>
                  <p>+221 649 3117</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiMail />
                <p>contact@ambassade-congo.sn</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/services" className="text-gray-400 hover:text-white transition">
                  Services consulaires
                </Link>
              </li>
              <li>
                <Link to="/appointments/book" className="text-gray-400 hover:text-white transition">
                  Prendre rendez-vous
                </Link>
              </li>
              <li>
                <Link to="/applications/new" className="text-gray-400 hover:text-white transition">
                  Nouvelle demande
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white transition">
                  Questions fréquentes
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition">
                  Nous contacter
                </Link>
              </li>
            </ul>
          </div>

          {/* Hours & Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Horaires d'ouverture</h3>
            <div className="space-y-2 text-gray-400 text-sm">
              <p><strong className="text-white">Lundi - Vendredi:</strong> 9h00 - 17h00</p>
              <p><strong className="text-white">Samedi:</strong> 9h00 - 13h00</p>
              <p><strong className="text-white">Dimanche:</strong> Fermé</p>
            </div>
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Services d'urgence</h4>
              <p className="text-gray-400 text-sm">
                Pour les urgences consulaires en dehors des heures d'ouverture, 
                veuillez contacter le numéro d'urgence.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>
            © {new Date().getFullYear()} Ambassade de la République du Congo au Sénégal. 
            Tous droits réservés.
          </p>
          <div className="mt-2 space-x-4">
            <Link to="/privacy" className="hover:text-white transition">
              Politique de confidentialité
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition">
              Conditions d'utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

